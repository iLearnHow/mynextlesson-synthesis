#!/usr/bin/env python3
"""
RAILWAY TTS SERVER - FORCE NEW DEPLOYMENT
This is a completely new file to break Railway's caching
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import base64
import numpy as np
import time
import os

app = Flask(__name__)

# Allow CORS from ilearnhow.com
CORS(app, origins=[
    "https://ilearnhow.com",
    "https://*.ilearnhow.com",
    "http://localhost:*",
    "http://127.0.0.1:*"
])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "railway_tts_v2",
        "message": "RAILWAY TTS SERVER V2.0 - NEW DEPLOYMENT SUCCESSFUL",
        "timestamp": int(time.time())
    })

@app.route('/api/tts', methods=['POST'])
def tts():
    try:
        data = request.json
        text = data.get('text', 'Hello, this is a test.')
        speaker = data.get('speaker', 'kelly').lower()
        include_phonemes = data.get('include_phonemes', True)
        
        print(f"🎤 RAILWAY TTS V2.0: {speaker} - '{text[:50]}...'")
        
        # Generate realistic audio duration based on text length
        duration_seconds = max(1.0, len(text) / 12.0)
        
        # Create dummy audio (silence for now, but with proper timing)
        sample_rate = 16000
        num_samples = int(sample_rate * duration_seconds)
        audio_data = np.zeros(num_samples, dtype=np.int16)
        
        # Write WAV header
        wav_buffer = io.BytesIO()
        wav_buffer.write(b'RIFF')
        wav_buffer.write((36 + len(audio_data) * 2).to_bytes(4, 'little'))
        wav_buffer.write(b'WAVE')
        wav_buffer.write(b'fmt ')
        wav_buffer.write((16).to_bytes(4, 'little'))
        wav_buffer.write((1).to_bytes(2, 'little'))
        wav_buffer.write((1).to_bytes(2, 'little'))
        wav_buffer.write(sample_rate.to_bytes(4, 'little'))
        wav_buffer.write((sample_rate * 1 * 2).to_bytes(4, 'little'))
        wav_buffer.write((1 * 2).to_bytes(2, 'little'))
        wav_buffer.write((16).to_bytes(2, 'little'))
        wav_buffer.write(b'data')
        wav_buffer.write((len(audio_data) * 2).to_bytes(4, 'little'))
        wav_buffer.write(audio_data.tobytes())
        
        audio_base64 = base64.b64encode(wav_buffer.getvalue()).decode('utf-8')
        
        # Generate realistic phoneme timing for avatar sync
        phonemes = []
        if include_phonemes:
            # Map common sounds to visemes
            viseme_map = {
                'a': 'A', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
                'b': 'MBP', 'p': 'MBP', 'm': 'MBP',
                'f': 'FV', 'v': 'FV',
                't': 'DNTL', 'd': 'DNTL', 'n': 'DNTL', 'l': 'DNTL',
                'k': 'KG', 'g': 'KG',
                's': 'S', 'z': 'S',
                'th': 'TH', 'sh': 'S', 'ch': 'S',
                'w': 'WQ', 'r': 'R'
            }
            
            # Simple phoneme extraction
            words = text.lower().split()
            current_time = 0.0
            word_duration = duration_seconds / max(1, len(words))
            
            for word in words:
                # Extract key sounds from word
                if word.startswith(('a', 'e', 'i', 'o', 'u')):
                    phonemes.append({
                        "phoneme": "A",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.3, 3)
                    })
                    current_time += word_duration * 0.3
                
                # Add consonant sounds
                if word.startswith(('b', 'p', 'm')):
                    phonemes.append({
                        "phoneme": "MBP",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('f', 'v')):
                    phonemes.append({
                        "phoneme": "FV",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('t', 'd', 'n', 'l')):
                    phonemes.append({
                        "phoneme": "DNTL",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('k', 'g')):
                    phonemes.append({
                        "phoneme": "KG",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('s', 'z')):
                    phonemes.append({
                        "phoneme": "S",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('w')):
                    phonemes.append({
                        "phoneme": "WQ",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                if word.startswith(('r')):
                    phonemes.append({
                        "phoneme": "R",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                # Add REST frames between words
                if current_time < duration_seconds - 0.1:
                    phonemes.append({
                        "phoneme": "REST",
                        "start": round(current_time, 3),
                        "end": round(current_time + 0.1, 3)
                    })
                    current_time += 0.1

        response_data = {
            "audio": audio_base64,
            "audio_format": "wav",
            "duration": duration_seconds,
            "speaker": speaker,
            "text": text,
            "server": "RAILWAY_TTS_V2.0"
        }

        if include_phonemes:
            response_data["phonemes"] = phonemes

        print(f"✅ RAILWAY TTS V2.0: Generated {len(phonemes)} phonemes for {duration_seconds:.2f}s")
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ RAILWAY TTS V2.0 Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "RAILWAY TTS SERVER V2.0",
        "status": "running",
        "message": "NEW DEPLOYMENT SUCCESSFUL - NO MORE COQUI!",
        "endpoints": {
            "health": "/health",
            "tts": "/api/tts"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print("=" * 70)
    print("🚀 RAILWAY TTS SERVER V2.0 - NEW DEPLOYMENT SUCCESSFUL!")
    print("=" * 70)
    print(f"✅ Port: {port}")
    print(f"✅ CORS enabled for ilearnhow.com")
    print(f"✅ Phoneme generation enabled")
    print(f"✅ NO COQUI DEPENDENCIES")
    print(f"✅ Build ID: {int(time.time())}")
    print(f"✅ Server: RAILWAY_TTS_V2.0")
    print("=" * 70)
    app.run(host='0.0.0.0', port=port, debug=False)
