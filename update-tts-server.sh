#!/bin/bash

# Script to update TTS server with phoneme extraction support

echo "🚀 Updating TTS server with phoneme extraction..."

# Backup current server
if [ -f "hybrid_tts_server.py" ]; then
    echo "📦 Backing up current server..."
    cp hybrid_tts_server.py hybrid_tts_server_backup_$(date +%Y%m%d_%H%M%S).py
fi

# Copy new server
echo "📝 Installing enhanced server..."
cp hybrid_tts_server_with_phonemes.py hybrid_tts_server.py

# Restart the server
echo "🔄 Restarting TTS server..."
pkill -f "python.*hybrid_tts_server" || true
sleep 1

# Check if virtual environment exists
if [ -d "coqui_venv" ]; then
    echo "✅ Starting enhanced TTS server..."
    ./start-tts-server.sh &
    
    sleep 3
    
    # Test the health endpoint
    echo -e "\n🧪 Testing server health..."
    curl -s http://localhost:5002/health | python3 -m json.tool
    
    echo -e "\n✨ TTS server updated with phoneme support!"
    echo -e "\n📚 Usage:"
    echo "   Regular TTS: POST /api/tts with {text, speaker}"
    echo "   With phonemes: POST /api/tts with {text, speaker, include_phonemes: true}"
else
    echo "⚠️  Virtual environment not found. Please set up Coqui TTS first."
    echo "   Run: python3 -m venv coqui_venv && source coqui_venv/bin/activate && pip install TTS"
fi
