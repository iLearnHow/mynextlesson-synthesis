#!/usr/bin/env python3
"""
Simplified TTS Server - Ken & Kelly voices only
Using pre-generated audio files as fallback
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import time
import random

app = Flask(__name__)
CORS(app, origins=["*"])  # Allow all origins for now

# Simulated phoneme data for testing
def generate_mock_phonemes(text, duration):
    """Generate realistic phoneme timing for any text"""
    words = text.split()
    time_per_word = duration / max(len(words), 1)
    
    phonemes = []
    current_time = 0.0
    
    # Common viseme patterns for English
    viseme_patterns = {
        'hello': ['REST', 'A', 'E', 'DNTL', 'WQ', 'REST'],
        'i': ['A', 'I'],
        'am': ['A', 'MBP'],
        'kelly': ['KG', 'E', 'DNTL', 'I', 'REST'],
        'ken': ['KG', 'E', 'DNTL', 'REST'],
        'lesson': ['DNTL', 'E', 'S', 'A', 'DNTL', 'REST'],
        'today': ['DNTL', 'WQ', 'DNTL', 'E', 'REST'],
        'default': ['MBP', 'A', 'E', 'REST']
    }
    
    for word in words:
        word_lower = word.lower().strip('.,!?')
        pattern = viseme_patterns.get(word_lower, viseme_patterns['default'])
        
        time_per_viseme = time_per_word / len(pattern)
        
        for viseme in pattern:
            phonemes.append({
                "phoneme": viseme.lower(),
                "viseme": viseme,
                "start": current_time,
                "end": current_time + time_per_viseme
            })
            current_time += time_per_viseme
    
    return phonemes

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "engine": "ken-kelly-simple",
        "message": "Using Ken & Kelly voices only"
    })

@app.route('/api/tts', methods=['POST'])
def tts():
    """Simple TTS endpoint that returns mock audio with phonemes"""
    try:
        data = request.json
        text = data.get('text', '')
        speaker = data.get('speaker', 'kelly').lower()
        include_phonemes = data.get('include_phonemes', False)
        
        if speaker not in ['ken', 'kelly']:
            speaker = 'kelly'
        
        # For now, return a simple audio placeholder
        # In production, this would load your actual Ken/Kelly audio files
        duration = len(text) * 0.06  # Rough estimate: 60ms per character
        
        # Generate a simple sine wave as placeholder audio
        sample_rate = 22050
        t = np.linspace(0, duration, int(sample_rate * duration))
        frequency = 440 if speaker == 'kelly' else 330  # Different pitch for Ken/Kelly
        audio_data = (0.3 * np.sin(2 * np.pi * frequency * t)).astype(np.float32)
        
        # Convert to WAV format
        import wave
        import struct
        
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(struct.pack('h' * len(audio_data), 
                *[int(32767 * x) for x in audio_data]))
        
        wav_buffer.seek(0)
        audio_base64 = base64.b64encode(wav_buffer.read()).decode('utf-8')
        
        response = {
            "audio": audio_base64,
            "audio_format": "wav",
            "duration": duration,
            "speaker": speaker
        }
        
        if include_phonemes:
            response["phonemes"] = generate_mock_phonemes(text, duration)
        
        return jsonify(response)
        
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Import numpy and io at module level
import numpy as np
import io

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    print(f"Starting simple Ken & Kelly TTS server on port {port}")
    print("This is a temporary server while we fix the main TTS system")
    
    app.run(host="0.0.0.0", port=port, debug=False)
