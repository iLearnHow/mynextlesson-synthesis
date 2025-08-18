#!/bin/bash
# Quick Coqui TTS Setup

echo "🎤 Setting up Coqui TTS for dynamic generation"

# Install Coqui TTS
pip3 install TTS

# Create simple API server
cat > tts_api_server.py << 'EOF'
from flask import Flask, request, send_file
from TTS.api import TTS
import io

app = Flask(__name__)
tts = TTS("tts_models/en/ljspeech/tacotron2-DDC_ph")

@app.route('/api/tts', methods=['POST'])
def generate_tts():
    data = request.json
    text = data.get('text', '')
    speaker = data.get('speaker', 'kelly')
    
    # Generate audio
    wav = tts.tts(text)
    
    # Return as audio file
    buffer = io.BytesIO()
    tts.synthesizer.save_wav(wav, buffer)
    buffer.seek(0)
    
    return send_file(buffer, mimetype='audio/wav')

if __name__ == '__main__':
    app.run(port=5002)
EOF

echo "✅ Run: python3 tts_api_server.py"
