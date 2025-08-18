#!/bin/bash
# Run Coqui TTS Server (handles virtual environment automatically)

echo "🎤 Starting Coqui TTS Server"
echo "=========================="

# Check if virtual environment exists
if [ ! -d "coqui_venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "📦 Please run: ./setup-coqui-venv.sh"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source coqui_venv/bin/activate

# Check if Coqui is installed
if ! python -c "import TTS" 2>/dev/null; then
    echo "❌ Coqui TTS not installed in virtual environment!"
    echo "📦 Please run: ./setup-coqui-venv.sh"
    exit 1
fi

# Extract voice references if needed
if [ ! -d "voice_references" ] && [ -f "extract_voice_refs.py" ]; then
    echo "🔍 Extracting voice references..."
    python extract_voice_refs.py
fi

# Start the server
echo "🚀 Starting TTS API server..."
echo "📡 Server will be available at:"
echo "   http://localhost:5002"
echo ""
echo "✨ Once started, open http://localhost:8080 in your browser"
echo "   and go to /test-coqui.html to test voices"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
if [ -f "coqui_api_server.py" ]; then
    python coqui_api_server.py
else
    echo "❌ coqui_api_server.py not found!"
    echo "📦 Please run: ./setup-coqui-venv.sh"
fi
