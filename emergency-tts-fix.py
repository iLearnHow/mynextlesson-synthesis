#!/usr/bin/env python3
"""
Emergency TTS Server - Minimal working version
Just returns mock phoneme data so avatar sync can work
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os

app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "engine": "emergency-mock"})

@app.route('/api/tts', methods=['POST'])
def tts():
    """Return mock audio with phoneme timing for testing"""
    data = request.json
    text = data.get('text', '')
    speaker = data.get('speaker', 'kelly').lower()
    
    # Create simple mock audio (1 second of silence)
    # In production, this would be real TTS
    sample_rate = 22050
    duration = max(1.0, len(text) * 0.05)  # 50ms per character
    samples = int(sample_rate * duration)
    
    # Generate silent WAV file
    import wave
    import io
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(b'\x00\x00' * samples)
    
    wav_buffer.seek(0)
    audio_base64 = base64.b64encode(wav_buffer.read()).decode()
    
    # Generate mock phonemes for avatar sync
    phonemes = []
    time_per_word = duration / max(len(text.split()), 1)
    current_time = 0.0
    
    # Simple viseme pattern
    viseme_cycle = ['REST', 'A', 'E', 'MBP', 'I', 'WQ', 'REST']
    viseme_idx = 0
    
    for word in text.split():
        phonemes.append({
            "phoneme": "sil",
            "viseme": "REST",
            "start": current_time,
            "end": current_time + 0.05
        })
        current_time += 0.05
        
        # Add visemes for the word
        word_duration = time_per_word - 0.1
        viseme_time = word_duration / 3
        
        for i in range(3):
            viseme = viseme_cycle[viseme_idx % len(viseme_cycle)]
            phonemes.append({
                "phoneme": viseme.lower(),
                "viseme": viseme,
                "start": current_time,
                "end": current_time + viseme_time
            })
            current_time += viseme_time
            viseme_idx += 1
        
        current_time += 0.05
    
    return jsonify({
        "audio": audio_base64,
        "audio_format": "wav",
        "duration": duration,
        "speaker": speaker,
        "phonemes": phonemes
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    print(f"Starting emergency TTS server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
