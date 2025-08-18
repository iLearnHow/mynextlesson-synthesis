#!/bin/bash
# Setup Coqui TTS with Virtual Environment

echo "🎤 Setting up Coqui TTS with Virtual Environment"
echo "==============================================="

# Create virtual environment if it doesn't exist
if [ ! -d "coqui_venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv coqui_venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source coqui_venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install Coqui TTS and dependencies
echo "📦 Installing Coqui TTS (this may take a few minutes)..."
pip install TTS flask flask-cors

# Check if installation was successful
if python -c "import TTS" 2>/dev/null; then
    echo "✅ Coqui TTS installed successfully!"
else
    echo "❌ Coqui TTS installation failed"
    exit 1
fi

# Run the setup script
echo ""
echo "🚀 Running Coqui setup..."
python setup-coqui-complete.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 To start the Coqui server:"
echo "   source coqui_venv/bin/activate"
echo "   ./start-coqui-server.sh"
echo ""
echo "Or use the all-in-one command:"
echo "   ./run-coqui.sh"
