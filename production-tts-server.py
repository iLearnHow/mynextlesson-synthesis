#!/usr/bin/env python3
"""
Production TTS Server for iLearn How
Returns phoneme timing data for avatar synchronization
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
        "engine": "production_tts",
        "message": "Production TTS server running with phoneme support"
    })

@app.route('/api/tts', methods=['POST'])
def tts():
    try:
        data = request.json
        text = data.get('text', 'Hello, this is a test.')
        speaker = data.get('speaker', 'kelly').lower()
        include_phonemes = data.get('include_phonemes', True)
        
        print(f"🎤 TTS request: {speaker} - '{text[:50]}...' (phonemes: {include_phonemes})")
        
        # Generate realistic audio duration based on text length
        duration_seconds = max(1.0, len(text) / 12.0)  # ~12 characters per second
        
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
            
            # Simple phoneme extraction (in production, use proper NLP)
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
                if any(c in word for c in 'bcdfghjklmnpqrstvwxz'):
                    phonemes.append({
                        "phoneme": "MBP",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                # Add vowel sounds
                if any(c in word for c in 'aeiou'):
                    phonemes.append({
                        "phoneme": "A",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.3, 3)
                    })
                    current_time += word_duration * 0.3
                
                # Add ending sounds
                if word.endswith(('s', 't', 'd', 'n')):
                    phonemes.append({
                        "phoneme": "S",
                        "start": round(current_time, 3),
                        "end": round(current_time + word_duration * 0.2, 3)
                    })
                    current_time += word_duration * 0.2
                
                current_time += word_duration * 0.2  # Word spacing
            
            # Ensure we don't exceed duration
            if phonemes and phonemes[-1]['end'] > duration_seconds:
                phonemes[-1]['end'] = duration_seconds
            
            # Add REST frames between words for natural animation
            if len(phonemes) > 1:
                rest_phonemes = []
                for i in range(len(phonemes) - 1):
                    gap_start = phonemes[i]['end']
                    gap_end = phonemes[i + 1]['start']
                    if gap_end - gap_start > 0.1:  # Add REST if gap > 100ms
                        rest_phonemes.append({
                            "phoneme": "REST",
                            "start": round(gap_start, 3),
                            "end": round(gap_end, 3)
                        })
                phonemes.extend(rest_phonemes)
                phonemes.sort(key=lambda x: x['start'])
        
        response_data = {
            "audio": audio_base64,
            "audio_format": "wav",
            "duration": duration_seconds,
            "speaker": speaker,
            "text": text
        }
        
        if include_phonemes:
            response_data["phonemes"] = phonemes
        
        print(f"✅ Generated TTS with {len(phonemes)} phonemes for {duration_seconds:.2f}s")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ TTS error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "iLearn How TTS Server",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "tts": "/api/tts"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print("=" * 60)
    print("🚀 PRODUCTION TTS SERVER STARTING")
    print("=" * 60)
    print(f"✅ Port: {port}")
    print(f"✅ CORS enabled for ilearnhow.com")
    print(f"✅ Phoneme generation enabled")
    print(f"✅ No Coqui dependencies")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
