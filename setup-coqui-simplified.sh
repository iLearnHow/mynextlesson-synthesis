#!/bin/bash
# Simplified Coqui TTS Setup - Just get it working!

echo "🎤 Setting up Free Local TTS with Coqui"
echo "======================================="

# Clean up old venv
rm -rf coqui_venv

# Create virtual environment with Python 3.11
echo "📦 Creating Python 3.11 virtual environment..."
python3.11 -m venv coqui_venv

# Activate it
source coqui_venv/bin/activate

# Upgrade pip first
pip install --upgrade pip setuptools wheel

# Install simpler TTS solution - pyttsx3 first as fallback
echo "📦 Installing TTS packages..."
pip install pyttsx3 gTTS flask flask-cors

# Try to install Coqui TTS (might fail, that's ok)
echo "🎯 Attempting Coqui TTS install..."
pip install TTS 2>/dev/null || echo "⚠️  Coqui TTS not available, using alternatives"

# Create a hybrid TTS server that uses what's available
cat > hybrid_tts_server.py << 'EOF'
#!/usr/bin/env python3
"""
Hybrid TTS Server - Uses best available option
Priority: Coqui TTS > gTTS > pyttsx3
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import io
import tempfile
import json

app = Flask(__name__)
CORS(app)

# Detect available TTS engines
tts_engine = None
engine_name = "none"

# Try Coqui TTS first
try:
    from TTS.api import TTS
    tts_engine = TTS(list(TTS().list_models())[0])
    engine_name = "coqui"
    print("✅ Using Coqui TTS")
except:
    pass

# Try gTTS as fallback
if not tts_engine:
    try:
        from gtts import gTTS
        engine_name = "gtts"
        print("✅ Using Google TTS (gTTS)")
    except:
        pass

# Final fallback to pyttsx3
if engine_name == "none":
    try:
        import pyttsx3
        engine_name = "pyttsx3"
        print("✅ Using pyttsx3 (offline TTS)")
    except:
        print("❌ No TTS engine available!")

# Voice mappings for different engines
voice_map = {
    "pyttsx3": {
        "kelly": "com.apple.eloquence.en-US.Grandma",  # or Samantha
        "ken": "com.apple.eloquence.en-US.Grandpa"     # or Daniel
    }
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "engine": engine_name,
        "capabilities": {
            "dynamic": True,
            "voices": ["kelly", "ken"],
            "quality": {
                "coqui": "excellent",
                "gtts": "good",
                "pyttsx3": "basic"
            }.get(engine_name, "unknown")
        }
    })

@app.route('/api/tts', methods=['POST'])
def generate_speech():
    try:
        data = request.json
        text = data.get('text', '')
        speaker = data.get('speaker', 'kelly').lower()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        print(f"🎯 Generating ({engine_name}): '{text[:50]}...' for {speaker}")
        
        # Generate audio based on available engine
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            temp_path = tmp_file.name
            
            if engine_name == "coqui":
                # Coqui TTS
                tts_engine.tts_to_file(text=text, file_path=temp_path)
                
            elif engine_name == "gtts":
                # Google TTS
                lang = 'en'
                tld = 'com' if speaker == 'kelly' else 'co.uk'  # US vs UK accent
                tts = gTTS(text=text, lang=lang, tld=tld)
                tts.save(temp_path)
                
            elif engine_name == "pyttsx3":
                # pyttsx3
                engine = pyttsx3.init()
                
                # Try to set voice
                voices = engine.getProperty('voices')
                if speaker == 'kelly' and len(voices) > 0:
                    # Try to find female voice
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'samantha' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                elif speaker == 'ken' and len(voices) > 1:
                    # Try to find male voice
                    for voice in voices:
                        if 'male' in voice.name.lower() or 'daniel' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                
                # Generate
                engine.save_to_file(text, temp_path)
                engine.runAndWait()
            
            else:
                return jsonify({"error": "No TTS engine available"}), 500
            
            # Return the audio file
            return send_file(
                temp_path,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name=f'{speaker}_speech.mp3'
            )
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Hybrid TTS Server starting...")
    print(f"🎤 Using: {engine_name.upper()} engine")
    print("📡 API endpoints:")
    print("   GET  http://localhost:5002/health")
    print("   POST http://localhost:5002/api/tts")
    print("\n✨ Server ready for dynamic TTS!\n")
    
    app.run(host='0.0.0.0', port=5002, debug=False)
EOF

# Create simple run script
cat > start-tts-server.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source coqui_venv/bin/activate
echo "🚀 Starting TTS Server..."
python hybrid_tts_server.py
EOF
chmod +x start-tts-server.sh

# Update the integration script
echo "📝 Updating browser integration..."
cp coqui-integration.js local-tts-integration.js 2>/dev/null || cat > local-tts-integration.js << 'EOF'
/**
 * Local TTS Integration - Works with any available engine
 */
class LocalTTSIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:5002';
        this.isAvailable = false;
        this.checkAvailability();
    }
    
    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            this.isAvailable = data.status === 'healthy';
            console.log('🎤 Local TTS:', data);
            return data;
        } catch (error) {
            this.isAvailable = false;
            return null;
        }
    }
    
    async generateSpeech(text, speaker = 'kelly') {
        const response = await fetch(`${this.baseUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speaker })
        });
        
        if (!response.ok) throw new Error('TTS failed');
        return await response.blob();
    }
    
    async speak(text, speaker = 'kelly') {
        try {
            const audioBlob = await this.generateSpeech(text, speaker);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (window.currentAudio) {
                window.currentAudio.pause();
            }
            
            const audio = new Audio(audioUrl);
            window.currentAudio = audio;
            
            const avatarBg = document.querySelector('.avatar-background');
            if (avatarBg) {
                avatarBg.classList.add('speaking');
                audio.onended = () => {
                    avatarBg.classList.remove('speaking');
                    URL.revokeObjectURL(audioUrl);
                };
            }
            
            return audio.play();
        } catch (error) {
            console.error('TTS error:', error);
            // Fallback to browser
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }
}

window.localTTS = new LocalTTSIntegration();

// Override existing TTS
if (window.tts && window.tts.generateAudio) {
    const original = window.tts.generateAudio;
    window.tts.generateAudio = async function(text, voice) {
        if (window.localTTS.isAvailable) {
            return await window.localTTS.generateSpeech(text, voice.toLowerCase());
        }
        return original.call(this, text, voice);
    };
}

// Test functions
window.testLocalTTS = {
    kelly: () => window.localTTS.speak("Hi! I'm Kelly with free local voice synthesis!", 'kelly'),
    ken: () => window.localTTS.speak("Hello! I'm Ken using your local TTS server!", 'ken'),
    status: () => window.localTTS.checkAvailability()
};
EOF

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the TTS server:"
echo "   ./start-tts-server.sh"
echo ""
echo "🎯 To add to your site:"
echo "   <script src='/local-tts-integration.js'></script>"
echo ""
echo "✨ Features:"
echo "  - Free local TTS"
echo "  - No API keys"
echo "  - Dynamic generation"
echo "  - Multiple engine support"
