#!/bin/bash
cd "$(dirname "$0")"
source coqui_venv/bin/activate
echo "🚀 Starting TTS Server (phoneme-enabled)..."
python hybrid_tts_server_with_phonemes.py
