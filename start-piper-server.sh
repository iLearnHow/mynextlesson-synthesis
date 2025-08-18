#!/bin/bash
# Start Piper TTS Server locally

echo "🎤 Starting Piper TTS Server..."

# Check if piper is installed
if ! command -v piper &> /dev/null; then
    echo "Installing piper-tts..."
    pip install piper-tts
fi

# Check if espeak-ng is installed (for phoneme extraction)
if ! command -v espeak-ng &> /dev/null; then
    echo "⚠️  WARNING: espeak-ng not found. Phoneme extraction will not work."
    echo "   Install with: brew install espeak-ng"
fi

# Create models directory
mkdir -p piper_models

# Start the server
echo "Starting server on http://localhost:5002"
python piper_tts_server.py
