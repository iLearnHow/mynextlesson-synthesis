#!/usr/bin/env python3
"""
Enhanced Hybrid TTS Server with Phoneme Extraction
Adds phoneme timing data for real-time avatar lip-sync
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import io
import tempfile
import json
import time
import base64
import numpy as np

# Torch safe-load workaround for XTTS on PyTorch>=2.6
try:
    import torch  # type: ignore
    _orig_torch_load = torch.load

    def _torch_load_compat(*args, **kwargs):
        # Force legacy behavior to allow loading pickled configs in trusted local models
        if 'weights_only' not in kwargs:
            kwargs['weights_only'] = False
        return _orig_torch_load(*args, **kwargs)

    torch.load = _torch_load_compat  # type: ignore
except Exception:
    pass

app = Flask(__name__)
CORS(app, origins=["http://localhost:*", "https://ilearnhow.com", "https://*.ilearnhow.com"])

# Detect available TTS engines
tts_engine = None
engine_name = "none"

# Try Coqui TTS first (force XTTS v2 for reference voice cloning)
try:
    # Workaround for torch 2.6+ safe loading: allow XTTS config in torch.load
    try:
        from torch.serialization import add_safe_globals  # type: ignore
        from TTS.tts.configs.xtts_config import XttsConfig  # type: ignore
        try:
            add_safe_globals([XttsConfig])
        except Exception:
            pass
    except Exception:
        # Older torch may not have add_safe_globals; continue
        pass

    from TTS.api import TTS
    preferred_model = "tts_models/multilingual/multi-dataset/xtts_v2"
    tts_engine = TTS(preferred_model)
    engine_name = "coqui_xtts"
    print(f"✅ Using Coqui TTS model: {preferred_model}")
    
    # Try to load phoneme extraction
    try:
        from TTS.tts.utils.text.phonemizers import ESpeak
        phonemizer = ESpeak(language='en-us')
        print("✅ Phoneme extraction enabled")
    except:
        phonemizer = None
        print("⚠️  Phoneme extraction not available")
except Exception as e:
    print(f"❌ Coqui init failed: {e}")
    phonemizer = None
    pass

# Try gTTS as fallback
STRICT_TTS = os.getenv('STRICT_TTS', '1') == '1'
if not tts_engine and not STRICT_TTS:
    try:
        from gtts import gTTS
        engine_name = "gtts"
        print("✅ Using Google TTS (gTTS)")
    except:
        pass

# Final fallback to pyttsx3
if engine_name == "none" and not STRICT_TTS:
    try:
        import pyttsx3
        engine_name = "pyttsx3"
        print("✅ Using pyttsx3 (offline TTS)")
    except:
        print("❌ No TTS engine available!")

# Voice mappings for different engines
voice_map = {
    "pyttsx3": {
        "kelly": "com.apple.eloquence.en-US.Grandma",  # or Samantha
        "ken": "com.apple.eloquence.en-US.Grandpa"     # or Daniel
    }
}

# Simple phoneme to viseme mapping
PHONEME_TO_VISEME = {
    # Silence
    'SIL': 'REST', 'SP': 'REST', 'PAU': 'REST', '_': 'REST',
    # Bilabials
    'P': 'MBP', 'B': 'MBP', 'M': 'MBP',
    # Labiodentals
    'F': 'FV', 'V': 'FV',
    # Interdentals
    'TH': 'TH', 'DH': 'TH', 'θ': 'TH', 'ð': 'TH',
    # Dentals/Alveolars
    'T': 'DNTL', 'D': 'DNTL', 'N': 'DNTL', 'L': 'DNTL',
    'S': 'S', 'Z': 'S',
    # Post-alveolars
    'SH': 'S', 'ZH': 'S', 'CH': 'S', 'JH': 'S', 'ʃ': 'S', 'ʒ': 'S',
    # Velars
    'K': 'KG', 'G': 'KG', 'NG': 'KG', 'ŋ': 'KG',
    # Approximants
    'R': 'R', 'ER': 'R', 'r': 'R', 'ɹ': 'R',
    'W': 'WQ', 'w': 'WQ',
    'Y': 'I', 'j': 'I',
    # Vowels
    'AA': 'A', 'AE': 'A', 'AH': 'A', 'AO': 'A', 'a': 'A', 'æ': 'A', 'ɑ': 'A',
    'EH': 'E', 'EY': 'E', 'AY': 'E', 'e': 'E', 'ɛ': 'E',
    'IH': 'I', 'IY': 'I', 'i': 'I', 'ɪ': 'I',
    'OW': 'WQ', 'OY': 'WQ', 'AW': 'WQ', 'UH': 'WQ', 'UW': 'WQ', 'o': 'WQ', 'u': 'WQ',
}

def text_to_phonemes(text):
    """Convert text to phonemes using available methods"""
    if phonemizer:
        try:
            # Use Coqui phonemizer
            phonemes = phonemizer.phonemize(text, separator='|')
            return phonemes.split('|')
        except:
            pass
    
    # Fallback: Simple estimation based on text
    # This is very basic and won't be accurate, but provides structure
    words = text.split()
    phonemes = []
    
    for word in words:
        # Add word start
        phonemes.append('SIL')
        
        # Very basic approximation
        for char in word.lower():
            if char in 'aeiou':
                phonemes.append('A')  # Generic vowel
            elif char in 'bp':
                phonemes.append('B')
            elif char in 'fv':
                phonemes.append('F')
            elif char in 'td':
                phonemes.append('T')
            elif char in 'kg':
                phonemes.append('K')
            elif char in 'sz':
                phonemes.append('S')
            elif char in 'lr':
                phonemes.append('R')
            elif char in 'mn':
                phonemes.append('M')
        
        # Add word end
        phonemes.append('SIL')
    
    return phonemes

def estimate_phoneme_timing(phonemes, duration):
    """Estimate timing for each phoneme"""
    if not phonemes or duration <= 0:
        return []
    
    # Simple equal distribution with slight variation
    avg_duration = duration / len(phonemes)
    
    timings = []
    current_time = 0.0
    
    for i, phoneme in enumerate(phonemes):
        # Add slight variation to make it more natural
        if phoneme in ['SIL', 'SP', 'PAU']:
            # Silence is usually shorter
            phoneme_duration = avg_duration * 0.5
        else:
            # Add 10% random variation
            variation = 0.9 + (0.2 * (i % 3) / 3)
            phoneme_duration = avg_duration * variation
        
        # Convert phoneme to viseme
        viseme = PHONEME_TO_VISEME.get(phoneme, 'REST')
        
        timings.append({
            "phoneme": phoneme,
            "viseme": viseme,
            "start": round(current_time, 3),
            "end": round(current_time + phoneme_duration, 3)
        })
        
        current_time += phoneme_duration
    
    # Adjust last timing to match exact duration
    if timings:
        timings[-1]["end"] = duration
    
    return timings

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "engine": engine_name,
        "capabilities": {
            "dynamic": True,
            "voices": ["kelly", "ken"],
            "phonemes": phonemizer is not None,
            "quality": {
                "coqui": "excellent",
                "gtts": "good",
                "pyttsx3": "basic"
            }.get(engine_name, "unknown")
        }
    })

@app.route('/api/tts', methods=['POST'])
def generate_speech():
    try:
        text = ''
        language = 'en'
        speaker = 'kelly'
        speaker_wav_path = None
        include_phonemes = False

        # Accept both JSON and multipart/form-data
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json(silent=True) or {}
            text = data.get('text', '')
            # Accept both speaker and speaker_id
            speaker = (data.get('speaker') or data.get('speaker_id') or 'kelly').lower()
            language = data.get('language') or data.get('language_id') or 'en'
            include_phonemes = data.get('include_phonemes', False)
        else:
            # Multipart path
            text = request.form.get('text', '')
            speaker = (request.form.get('speaker') or request.form.get('speaker_id') or 'kelly').lower()
            language = request.form.get('language') or request.form.get('language_id') or 'en'
            include_phonemes = request.form.get('include_phonemes', '').lower() in ['true', '1', 'yes']
            f = request.files.get('speaker_wav')
            if f:
                tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                f.save(tmp.name)
                speaker_wav_path = tmp.name
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        print(f"🎯 Generating ({engine_name}): '{text[:50]}...' for {speaker}")
        if include_phonemes:
            print("📊 Including phoneme timing data")
        
        # Generate audio based on available engine
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            temp_wav = tmp_file.name
            
            # Track generation start time
            gen_start = time.time()
            
            if engine_name in ("coqui", "coqui_xtts"):
                # Coqui TTS
                # If XTTS model is active and a reference wav is available or mapped, use it
                voice_refs = {
                    "kelly": os.path.join(os.path.dirname(__file__), 'dist', 'reference_kelly.wav'),
                    "ken": os.path.join(os.path.dirname(__file__), 'dist', 'reference_ken_mono16k.wav'),
                }

                # Resolve speaker wav
                if not speaker_wav_path:
                    mapped = voice_refs.get(speaker)
                    if mapped and os.path.exists(mapped):
                        speaker_wav_path = mapped

                # XTTS v2 supports language and speaker_wav. If not XTTS, fall back to basic synthesis
                try:
                    if engine_name == "coqui_xtts" and speaker_wav_path:
                        tts_engine.tts_to_file(
                            text=text,
                            speaker_wav=speaker_wav_path,
                            language=language,
                            file_path=temp_wav
                        )
                    else:
                        tts_engine.tts_to_file(text=text, file_path=temp_wav)
                except Exception as e:
                    # Fallback to basic synthesis if cloning fails
                    print(f"⚠️ XTTS synthesis failed ({e}); falling back to base model")
                    tts_engine.tts_to_file(text=text, file_path=temp_wav)
                
            elif engine_name == "gtts":
                # Google TTS – force US accent for both speakers to avoid UK default
                lang = 'en'
                tld = 'com'
                tts = gTTS(text=text, lang=lang, tld=tld)
                # gTTS saves MP3; convert to WAV for unified post-processing
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as mp3_file:
                    mp3_path = mp3_file.name
                tts.save(mp3_path)
                os.system(f"ffmpeg -y -hide_banner -loglevel error -i '{mp3_path}' -ar 48000 -ac 1 -c:a pcm_s16le '{temp_wav}'")
                try:
                    os.remove(mp3_path)
                except Exception:
                    pass
                
            elif engine_name == "pyttsx3":
                # pyttsx3
                engine = pyttsx3.init()
                
                # Try to set voice
                voices = engine.getProperty('voices')
                if speaker == 'kelly' and len(voices) > 0:
                    # Try to find female voice
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'samantha' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                elif speaker == 'ken' and len(voices) > 1:
                    # Try to find male US voice (prefer Alex/Daniel)
                    for voice in voices:
                        name = (getattr(voice, 'name', '') or '').lower()
                        if 'alex' in name or 'daniel' in name or 'male' in name or 'en_us' in name or 'us' in name:
                            engine.setProperty('voice', voice.id)
                            break
                
                # Generate
                engine.save_to_file(text, temp_wav)
                engine.runAndWait()
            
            else:
                return jsonify({"error": "No TTS engine available"}), 500
            
            # Get audio duration
            import wave
            try:
                with wave.open(temp_wav, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    rate = wav_file.getframerate()
                    duration = frames / float(rate)
            except:
                duration = len(text) * 0.06  # Rough estimate: 60ms per character
            
            # Generate phoneme data if requested
            phoneme_data = None
            if include_phonemes:
                phonemes = text_to_phonemes(text)
                phoneme_data = estimate_phoneme_timing(phonemes, duration)
            
            # Post-process and encode to mp3 with gentle mastering
            try:
                polished_mp3 = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False).name
                # High-pass, light compression, loudness normalize, resample 48k, mono
                ff = (
                    "ffmpeg -y -hide_banner -loglevel error "
                    f"-i '{temp_wav}' "
                    "-filter:a highpass=f=80,acompressor=threshold=-20dB:ratio=2:attack=5:release=120,loudnorm=I=-23:LRA=7:TP=-1.0 "
                    "-ar 48000 -ac 1 -c:a libmp3lame -q:a 3 "
                    f"'{polished_mp3}'"
                )
                os.system(ff)
                
                # If phonemes requested, return JSON with audio as base64
                if include_phonemes:
                    with open(polished_mp3 if os.path.exists(polished_mp3) else temp_wav, 'rb') as audio_file:
                        audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                    
                    return jsonify({
                        "audio": audio_data,
                        "audio_format": "mp3" if os.path.exists(polished_mp3) else "wav",
                        "duration": duration,
                        "phonemes": phoneme_data,
                        "text": text,
                        "speaker": speaker,
                        "generation_time": time.time() - gen_start
                    })
                else:
                    # Return audio file directly
                    out_path = polished_mp3 if os.path.exists(polished_mp3) and os.path.getsize(polished_mp3)>0 else temp_wav
                    mime = 'audio/mpeg' if out_path.endswith('.mp3') else 'audio/wav'
                    return send_file(out_path, mimetype=mime, as_attachment=True, download_name=f'{speaker}_speech.{"mp3" if mime=="audio/mpeg" else "wav"}')
            finally:
                # temp_wav/mp3 cleaned up by OS later; explicit cleanup is optional for dev server
                pass
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Enhanced Hybrid TTS Server starting...")
    print(f"🎤 Using: {engine_name.upper()} engine")
    print(f"🔊 Phoneme extraction: {'ENABLED' if phonemizer else 'FALLBACK MODE'}")
    print("📡 API endpoints:")
    print("   GET  http://localhost:5002/health")
    print("   POST http://localhost:5002/api/tts")
    print("      - include_phonemes: true to get timing data")
    print("\n✨ Server ready for dynamic TTS with lip-sync!\n")
    
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False)
