#!/usr/bin/env python3
"""
Railway TTS Server using Piper - Lightweight and Fast
Real voice synthesis without heavy models
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import subprocess
import tempfile
import os
import base64
import json
import time
import wave
import struct

app = Flask(__name__)

# Allow CORS from ilearnhow.com
CORS(app, origins=[
    "https://ilearnhow.com",
    "https://*.ilearnhow.com",
    "http://localhost:*",
    "http://127.0.0.1:*"
])

# Piper voices mapping
VOICE_MODELS = {
    "kelly": "en_US-amy-medium",  # Female voice
    "ken": "en_US-ryan-medium"     # Male voice
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "piper_tts",
        "message": "Piper TTS Server Running",
        "timestamp": int(time.time())
    })

@app.route('/api/tts', methods=['POST'])
def tts():
    try:
        data = request.json
        text = data.get('text', 'Hello, this is a test.')
        speaker = data.get('speaker', 'kelly').lower()
        include_phonemes = data.get('include_phonemes', True)
        
        # Map speaker to Piper voice
        voice_model = VOICE_MODELS.get(speaker, VOICE_MODELS['kelly'])
        
        print(f"🎤 Piper TTS: {speaker} ({voice_model}) - '{text[:50]}...'")
        
        # Create temporary file for output
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        try:
            # Use Piper to generate speech
            cmd = [
                'piper',
                '--model', voice_model,
                '--output_file', output_path
            ]
            
            # Run Piper
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=text)
            
            if process.returncode != 0:
                raise Exception(f"Piper failed: {stderr}")
            
            # Read the generated audio
            with open(output_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Get audio duration
            with wave.open(output_path, 'rb') as wav_file:
                frames = wav_file.getnframes()
                rate = wav_file.getframerate()
                duration = frames / float(rate)
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Generate simple phonemes for avatar sync
            phonemes = []
            if include_phonemes:
                phonemes = generate_phonemes(text, duration)
            
            response_data = {
                "audio": audio_base64,
                "audio_format": "wav",
                "duration": duration,
                "speaker": speaker,
                "text": text,
                "engine": "piper"
            }
            
            if include_phonemes:
                response_data["phonemes"] = phonemes
            
            print(f"✅ Piper TTS: Generated {duration:.2f}s of audio")
            return jsonify(response_data)
            
        finally:
            # Clean up temporary file
            if os.path.exists(output_path):
                os.unlink(output_path)
        
    except Exception as e:
        print(f"❌ Piper TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

def generate_phonemes(text, duration):
    """Generate simple phoneme timing for avatar sync"""
    words = text.split()
    phonemes = []
    
    if not words:
        return phonemes
    
    time_per_word = duration / len(words)
    current_time = 0.0
    
    # Simple phoneme patterns
    for i, word in enumerate(words):
        word_lower = word.lower().strip('.,!?')
        
        # Opening mouth movement
        if word_lower[0] in 'aeiou':
            phonemes.append({
                "phoneme": "A",
                "start": round(current_time, 3),
                "end": round(current_time + time_per_word * 0.3, 3)
            })
        elif word_lower[0] in 'bpm':
            phonemes.append({
                "phoneme": "MBP",
                "start": round(current_time, 3),
                "end": round(current_time + time_per_word * 0.2, 3)
            })
        else:
            phonemes.append({
                "phoneme": "REST",
                "start": round(current_time, 3),
                "end": round(current_time + time_per_word * 0.1, 3)
            })
        
        # Mid-word movement
        phonemes.append({
            "phoneme": "E",
            "start": round(current_time + time_per_word * 0.3, 3),
            "end": round(current_time + time_per_word * 0.7, 3)
        })
        
        # Closing/rest
        phonemes.append({
            "phoneme": "REST",
            "start": round(current_time + time_per_word * 0.7, 3),
            "end": round(current_time + time_per_word, 3)
        })
        
        current_time += time_per_word
    
    return phonemes

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "Piper TTS Server",
        "status": "running",
        "voices": list(VOICE_MODELS.keys()),
        "endpoints": {
            "health": "/health",
            "tts": "/api/tts"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print("=" * 70)
    print("🚀 Piper TTS Server Starting")
    print("=" * 70)
    print(f"✅ Port: {port}")
    print(f"✅ Voices: {list(VOICE_MODELS.keys())}")
    print(f"✅ CORS enabled for ilearnhow.com")
    print("=" * 70)
    app.run(host='0.0.0.0', port=port, debug=False)
