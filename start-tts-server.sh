#!/bin/bash
cd "$(dirname "$0")"
source coqui_venv/bin/activate
echo "🚀 Starting TTS Server..."
python hybrid_tts_server.py
