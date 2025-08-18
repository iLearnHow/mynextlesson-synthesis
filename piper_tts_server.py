#!/usr/bin/env python3
"""
Piper TTS Server with Phoneme Support
Replaces Coqui TTS with Piper - a fast, local neural TTS
"""

import os
import json
import base64
import tempfile
import subprocess
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import wave
import struct

app = Flask(__name__)
CORS(app, origins=["http://localhost:*", "https://ilearnhow.com", "https://*.ilearnhow.com"])

# Piper models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), "piper_models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Voice configurations
VOICES = {
    "kelly": {
        "model": "en_US-amy-medium",  # Female voice, we'll fine-tune later
        "speaker": 0
    },
    "ken": {
        "model": "en_US-joe-medium",   # Male voice, we'll fine-tune later
        "speaker": 0
    }
}

# Phoneme to viseme mapping
PHONEME_TO_VISEME = {
    # Silence
    'sil': 'REST', 'sp': 'REST', 'spn': 'REST', '': 'REST',
    
    # Bilabials
    'p': 'MBP', 'b': 'MBP', 'm': 'MBP', 'w': 'WQ',
    
    # Labiodentals
    'f': 'FV', 'v': 'FV',
    
    # Dentals
    'θ': 'TH', 'ð': 'TH', 'th': 'TH',
    
    # Alveolars
    't': 'DNTL', 'd': 'DNTL', 'n': 'DNTL', 'l': 'DNTL',
    's': 'S', 'z': 'S',
    
    # Post-alveolars
    'ʃ': 'S', 'ʒ': 'S', 'tʃ': 'S', 'dʒ': 'S',
    
    # Velars
    'k': 'KG', 'g': 'KG', 'ŋ': 'KG',
    
    # Glottals
    'h': 'A',
    
    # Approximants
    'r': 'R', 'ɹ': 'R', 'j': 'I',
    
    # Vowels
    'i': 'I', 'ɪ': 'I', 'e': 'E', 'ɛ': 'E', 'æ': 'A',
    'a': 'A', 'ɑ': 'A', 'ɔ': 'A', 'o': 'WQ', 'ʊ': 'WQ',
    'u': 'WQ', 'ʌ': 'A', 'ə': 'E', 'ɚ': 'R',
    
    # Default
    'default': 'REST'
}

def download_model(model_name):
    """Download Piper model if not exists"""
    model_path = os.path.join(MODELS_DIR, f"{model_name}.onnx")
    config_path = os.path.join(MODELS_DIR, f"{model_name}.onnx.json")
    
    if not os.path.exists(model_path) or not os.path.exists(config_path):
        print(f"Downloading {model_name}...")
        base_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/{model_name.replace('-', '/')}"
        
        # Download model
        subprocess.run([
            "curl", "-L", "-o", model_path,
            f"{base_url}.onnx"
        ], check=True)
        
        # Download config
        subprocess.run([
            "curl", "-L", "-o", config_path,
            f"{base_url}.onnx.json"
        ], check=True)
        
        print(f"Downloaded {model_name}")
    
    return model_path

def extract_phonemes_from_espeak(text):
    """Use espeak-ng to get phonemes with timing"""
    try:
        # Use espeak to get phoneme output
        result = subprocess.run(
            ["espeak-ng", "-x", "-q", "--ipa", text],
            capture_output=True,
            text=True,
            check=True
        )
        
        phoneme_string = result.stdout.strip()
        
        # Simple phoneme extraction - this is a basic version
        # In production, we'd use more sophisticated alignment
        phonemes = []
        current_time = 0.0
        time_per_phoneme = 0.08  # Average 80ms per phoneme
        
        # Split by spaces and process
        parts = phoneme_string.split()
        for part in parts:
            # Clean up the phoneme
            clean_phoneme = part.strip("ˈˌ'\"")
            if clean_phoneme:
                viseme = PHONEME_TO_VISEME.get(clean_phoneme, 'REST')
                phonemes.append({
                    "phoneme": clean_phoneme,
                    "viseme": viseme,
                    "start": current_time,
                    "end": current_time + time_per_phoneme
                })
                current_time += time_per_phoneme
        
        return phonemes
        
    except Exception as e:
        print(f"Phoneme extraction error: {e}")
        return []

def generate_with_piper(text, voice_config):
    """Generate speech using Piper"""
    model_name = voice_config["model"]
    model_path = download_model(model_name)
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
        tmp_path = tmp_file.name
    
    try:
        # Generate speech with Piper
        cmd = [
            "piper",
            "--model", model_path,
            "--output_file", tmp_path
        ]
        
        if voice_config.get("speaker") is not None:
            cmd.extend(["--speaker", str(voice_config["speaker"])])
        
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
        with open(tmp_path, 'rb') as f:
            audio_data = f.read()
        
        # Get duration from WAV file
        with wave.open(tmp_path, 'rb') as wav_file:
            frames = wav_file.getnframes()
            rate = wav_file.getframerate()
            duration = frames / float(rate)
        
        return audio_data, duration
        
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "engine": "piper",
        "voices": list(VOICES.keys())
    })

@app.route('/api/tts', methods=['POST'])
def tts():
    """Text-to-speech endpoint with phoneme support"""
    try:
        data = request.json
        text = data.get('text', '')
        speaker = data.get('speaker', 'kelly').lower()
        include_phonemes = data.get('include_phonemes', False)
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        if speaker not in VOICES:
            speaker = 'kelly'
        
        # Generate speech
        voice_config = VOICES[speaker]
        audio_data, duration = generate_with_piper(text, voice_config)
        
        # Extract phonemes if requested
        phonemes = []
        if include_phonemes:
            phonemes = extract_phonemes_from_espeak(text)
            
            # Scale phoneme timings to match actual audio duration
            if phonemes and phonemes[-1]['end'] > 0:
                scale_factor = duration / phonemes[-1]['end']
                for p in phonemes:
                    p['start'] *= scale_factor
                    p['end'] *= scale_factor
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        response = {
            "audio": audio_base64,
            "audio_format": "wav",
            "duration": duration,
            "speaker": speaker
        }
        
        if include_phonemes:
            response["phonemes"] = phonemes
        
        return jsonify(response)
        
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        "models": VOICES,
        "engine": "piper"
    })

if __name__ == "__main__":
    # Install piper if not available
    try:
        subprocess.run(["piper", "--version"], capture_output=True, check=True)
    except:
        print("Installing piper...")
        subprocess.run([
            "pip", "install", "piper-tts"
        ], check=True)
    
    # Check for espeak-ng
    try:
        subprocess.run(["espeak-ng", "--version"], capture_output=True, check=True)
    except:
        print("WARNING: espeak-ng not found. Phoneme extraction will not work.")
        print("Install with: brew install espeak-ng (macOS) or apt-get install espeak-ng (Linux)")
    
    port = int(os.environ.get("PORT", 5002))
    print(f"Starting Piper TTS server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
