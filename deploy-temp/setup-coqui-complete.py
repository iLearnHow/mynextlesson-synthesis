#!/usr/bin/env python3
"""
Complete Coqui TTS Setup with Voice Cloning
Free, local, dynamic TTS using your Ken & Kelly voices
"""

import os
import sys
import subprocess
import json

print("🎤 Setting up Coqui TTS with Voice Cloning")
print("=" * 50)

# Step 1: Install Coqui TTS
print("\n📦 Installing Coqui TTS...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "TTS", "flask", "flask-cors"])
    print("✅ Coqui TTS installed successfully")
except Exception as e:
    print(f"❌ Error installing Coqui TTS: {e}")
    print("Try: pip3 install TTS flask flask-cors")
    sys.exit(1)

# Step 2: Create voice reference extractor
print("\n🎯 Creating voice reference extractor...")

extract_script = '''#!/usr/bin/env python3
import os
import json
from pathlib import Path

# Find Ken and Kelly reference audio
ken_refs = []
kelly_refs = []

# Check multiple possible locations for reference audio
search_paths = [
    "heygen_batches",
    "production-deploy/assets/audio",
    "tts_training 2/data",
    "../critical-foundations",
    "."
]

print("🔍 Searching for reference audio...")

for base_path in search_paths:
    if os.path.exists(base_path):
        for root, dirs, files in os.walk(base_path):
            for file in files:
                if file.endswith(('.mp3', '.wav', '.m4a', '.mp4')):
                    full_path = os.path.join(root, file)
                    if 'ken' in file.lower() or 'ken' in root.lower():
                        ken_refs.append(full_path)
                        print(f"  Found Ken: {file}")
                    elif 'kelly' in file.lower() or 'kelly' in root.lower():
                        kelly_refs.append(full_path)
                        print(f"  Found Kelly: {file}")

# Save best references
os.makedirs("voice_references", exist_ok=True)

result = {
    "ken": ken_refs[:5] if ken_refs else [],
    "kelly": kelly_refs[:5] if kelly_refs else []
}

with open("voice_references/found_audio.json", "w") as f:
    json.dump(result, f, indent=2)

print(f"\\n✅ Found {len(ken_refs)} Ken files, {len(kelly_refs)} Kelly files")
print("📁 Saved to voice_references/found_audio.json")
'''

with open("extract_voice_refs.py", "w") as f:
    f.write(extract_script)

# Run the extractor
print("🔍 Extracting voice references...")
subprocess.run([sys.executable, "extract_voice_refs.py"])

# Step 3: Create Coqui API Server
print("\n🚀 Creating Coqui TTS API Server...")

api_server = '''#!/usr/bin/env python3
"""
Coqui TTS API Server with Voice Cloning
Provides dynamic TTS for Ken & Kelly voices
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import io
import json
import tempfile
from TTS.api import TTS
import numpy as np
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Initialize TTS with XTTS v2 for voice cloning
print("🎤 Loading Coqui TTS model...")
try:
    # Use XTTS v2 for best voice cloning
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
    print("✅ XTTS v2 loaded successfully")
except:
    # Fallback to simpler model
    print("⚠️  XTTS v2 failed, using simpler model...")
    tts = TTS(list(TTS().list_models())[0])

# Load voice references
voice_refs = {"ken": None, "kelly": None}
if os.path.exists("voice_references/found_audio.json"):
    with open("voice_references/found_audio.json", "r") as f:
        found = json.load(f)
        for voice in ["ken", "kelly"]:
            if found.get(voice):
                voice_refs[voice] = found[voice][0]
                print(f"✅ {voice.title()} reference: {os.path.basename(voice_refs[voice])}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model": str(tts.model_name) if hasattr(tts, 'model_name') else "default",
        "voices": {
            "ken": bool(voice_refs["ken"]),
            "kelly": bool(voice_refs["kelly"])
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
        
        print(f"🎯 Generating: '{text[:50]}...' for {speaker}")
        
        # Generate audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            temp_path = tmp_file.name
            
            # Try voice cloning if reference exists
            if voice_refs.get(speaker) and hasattr(tts, 'tts_to_file'):
                try:
                    tts.tts_to_file(
                        text=text,
                        speaker_wav=voice_refs[speaker],
                        language="en",
                        file_path=temp_path
                    )
                    print(f"✅ Generated with {speaker} voice clone")
                except:
                    # Fallback to default voice
                    tts.tts_to_file(text=text, file_path=temp_path)
                    print("⚠️  Used default voice")
            else:
                # Use default TTS
                tts.tts_to_file(text=text, file_path=temp_path)
            
            # Return the audio file
            return send_file(
                temp_path,
                mimetype='audio/wav',
                as_attachment=True,
                download_name=f'{speaker}_speech.wav'
            )
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tts/stream', methods=['POST'])
def stream_speech():
    """Alternative endpoint that returns audio data directly"""
    try:
        data = request.json
        text = data.get('text', '')
        speaker = data.get('speaker', 'kelly').lower()
        
        # Generate audio to bytes
        wav = tts.tts(text)
        
        # Convert to bytes
        buffer = io.BytesIO()
        sf.write(buffer, wav, tts.synthesizer.output_sample_rate, format='WAV')
        buffer.seek(0)
        
        return send_file(buffer, mimetype='audio/wav')
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\\n🚀 Coqui TTS API Server starting...")
    print("📡 API endpoints:")
    print("   GET  http://localhost:5002/health")
    print("   POST http://localhost:5002/api/tts")
    print("   POST http://localhost:5002/api/tts/stream")
    print("\\n✨ Server ready for requests!\\n")
    
    app.run(host='0.0.0.0', port=5002, debug=False)
'''

with open("coqui_api_server.py", "w") as f:
    f.write(api_server)

# Step 4: Create integration script
print("\n🔧 Creating browser integration...")

browser_integration = '''/**
 * Coqui TTS Integration for iLearnHow
 * Connects to local Coqui server for free, dynamic TTS
 */

class CoquiTTSIntegration {
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
            console.log('🎤 Coqui TTS status:', data);
            return data;
        } catch (error) {
            console.warn('⚠️ Coqui TTS server not available:', error);
            this.isAvailable = false;
            return null;
        }
    }
    
    async generateSpeech(text, speaker = 'kelly') {
        if (!this.isAvailable) {
            await this.checkAvailability();
        }
        
        if (!this.isAvailable) {
            throw new Error('Coqui TTS server not running');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, speaker })
            });
            
            if (!response.ok) {
                throw new Error(`TTS failed: ${response.statusText}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.error('❌ Coqui TTS error:', error);
            throw error;
        }
    }
    
    async speak(text, speaker = 'kelly') {
        try {
            console.log(`🎯 Coqui speaking: "${text.substring(0, 50)}..." as ${speaker}`);
            
            const audioBlob = await this.generateSpeech(text, speaker);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Stop any current audio
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
            
            // Play new audio
            const audio = new Audio(audioUrl);
            window.currentAudio = audio;
            
            // Add speaking animation
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
            console.error('❌ Coqui speak error:', error);
            // Fallback to browser TTS
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            }
        }
    }
}

// Initialize and integrate
window.coquiTTS = new CoquiTTSIntegration();

// Override existing TTS with Coqui
if (window.tts && window.tts.generateAudio) {
    const original = window.tts.generateAudio;
    window.tts.generateAudio = async function(text, voice, language) {
        if (window.coquiTTS.isAvailable) {
            console.log('🔄 Using Coqui TTS...');
            try {
                return await window.coquiTTS.generateSpeech(text, voice.toLowerCase());
            } catch (error) {
                console.warn('Coqui failed, using fallback');
            }
        }
        return original.call(this, text, voice, language);
    };
}

// Add status indicator
setTimeout(() => {
    window.coquiTTS.checkAvailability().then(status => {
        if (status && status.status === 'healthy') {
            console.log('✅ Coqui TTS is running! Free local voice synthesis active.');
            
            // Show status
            const statusDiv = document.createElement('div');
            statusDiv.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    background: #D4EDDA;
                    border: 1px solid #28A745;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 14px;
                    z-index: 1000;
                ">
                    ✅ Coqui TTS Active (Free Local Voices)
                </div>
            `;
            document.body.appendChild(statusDiv);
            setTimeout(() => statusDiv.remove(), 5000);
        }
    });
}, 1000);

// Test functions
window.testCoqui = {
    kelly: () => window.coquiTTS.speak("Hi! I'm Kelly using free local Coqui voice synthesis!", 'kelly'),
    ken: () => window.coquiTTS.speak("Hello! I'm Ken with Coqui text-to-speech running locally!", 'ken'),
    status: () => window.coquiTTS.checkAvailability()
};

console.log('💡 Test with: testCoqui.kelly() or testCoqui.status()');
'''

with open("coqui-integration.js", "w") as f:
    f.write(browser_integration)

# Step 5: Create start script
print("\n📝 Creating start script...")

start_script = '''#!/bin/bash
# Start Coqui TTS Server

echo "🚀 Starting Coqui TTS Server"
echo "=========================="

# Check if Coqui is installed
if ! python3 -c "import TTS" 2>/dev/null; then
    echo "❌ Coqui TTS not installed!"
    echo "📦 Installing now..."
    pip3 install TTS flask flask-cors
fi

# Extract voice references if not done
if [ ! -d "voice_references" ]; then
    echo "🔍 Extracting voice references..."
    python3 extract_voice_refs.py
fi

# Start the server
echo "🎤 Starting TTS API server..."
echo "📡 Server will be available at:"
echo "   http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 coqui_api_server.py
'''

with open("start-coqui-server.sh", "w") as f:
    f.write(start_script)

os.chmod("start-coqui-server.sh", 0o755)

# Step 6: Create test page
print("\n🎨 Creating test page...")

test_page = '''<!DOCTYPE html>
<html>
<head>
    <title>Coqui TTS Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .online { background: #D4EDDA; color: #155724; }
        .offline { background: #F8D7DA; color: #721C24; }
        .voice-btn {
            padding: 10px 20px;
            margin: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .kelly { background: #FF69B4; color: white; }
        .ken { background: #4169E1; color: white; }
        textarea {
            width: 100%;
            padding: 10px;
            font-size: 16px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>🎤 Coqui TTS Test</h1>
    
    <div id="status" class="status offline">
        Checking server status...
    </div>
    
    <div>
        <h3>Test Voices:</h3>
        <button class="voice-btn kelly" onclick="testVoice('kelly')">
            Test Kelly Voice
        </button>
        <button class="voice-btn ken" onclick="testVoice('ken')">
            Test Ken Voice
        </button>
    </div>
    
    <div style="margin-top: 30px;">
        <h3>Custom Text:</h3>
        <textarea id="custom-text" rows="3" 
            placeholder="Enter any text to speak...">Welcome to iLearn How! Today we're learning about the wonders of science.</textarea>
        <br>
        <button class="voice-btn kelly" onclick="speakCustom('kelly')">
            Speak as Kelly
        </button>
        <button class="voice-btn ken" onclick="speakCustom('ken')">
            Speak as Ken
        </button>
    </div>
    
    <script src="/coqui-integration.js"></script>
    <script>
        // Check server status
        async function checkStatus() {
            const statusDiv = document.getElementById('status');
            try {
                const response = await fetch('http://localhost:5002/health');
                const data = await response.json();
                
                if (data.status === 'healthy') {
                    statusDiv.className = 'status online';
                    statusDiv.innerHTML = `
                        ✅ Coqui TTS Server Online<br>
                        Model: ${data.model}<br>
                        Kelly: ${data.voices.kelly ? '✓' : '✗'} | 
                        Ken: ${data.voices.ken ? '✓' : '✗'}
                    `;
                }
            } catch (error) {
                statusDiv.className = 'status offline';
                statusDiv.innerHTML = '❌ Coqui TTS Server Offline<br>Run: ./start-coqui-server.sh';
            }
        }
        
        async function testVoice(voice) {
            const text = voice === 'kelly' 
                ? "Hi! I'm Kelly, your learning companion at iLearn How!"
                : "Hello! I'm Ken, ready to explore new topics with you!";
            
            if (window.coquiTTS) {
                await window.coquiTTS.speak(text, voice);
            } else {
                alert('Coqui integration not loaded');
            }
        }
        
        async function speakCustom(voice) {
            const text = document.getElementById('custom-text').value;
            if (text && window.coquiTTS) {
                await window.coquiTTS.speak(text, voice);
            }
        }
        
        // Check status on load
        checkStatus();
        setInterval(checkStatus, 5000);
    </script>
</body>
</html>
'''

with open("test-coqui.html", "w") as f:
    f.write(test_page)

# Final instructions
print("\n✅ Coqui TTS Setup Complete!")
print("\n📋 Next Steps:")
print("1. Start the server:")
print("   ./start-coqui-server.sh")
print("\n2. Test in browser:")
print("   Open http://localhost:8080/test-coqui.html")
print("\n3. Integration with iLearnHow:")
print("   - Add to index.html: <script src='/coqui-integration.js'></script>")
print("   - It will automatically override existing TTS")
print("\n🎯 Features:")
print("  ✅ Free local TTS")
print("  ✅ Voice cloning with your audio")
print("  ✅ No API keys needed")
print("  ✅ Dynamic generation")
print("  ✅ Automatic fallback")

# Create a quick reference
with open("COQUI_QUICK_START.md", "w") as f:
    f.write("""# 🎤 Coqui TTS Quick Start

## Start Server:
```bash
./start-coqui-server.sh
```

## Test Voices:
```javascript
// In browser console:
testCoqui.kelly()  // Test Kelly voice
testCoqui.ken()    // Test Ken voice
testCoqui.status() // Check server
```

## Integration:
Already integrated! When server is running, it automatically
replaces other TTS methods with free local generation.

## Troubleshooting:
- Server not starting? Run: `pip3 install TTS flask flask-cors`
- No audio? Check http://localhost:5002/health
- Wrong voice? Voice cloning needs good reference audio

## Benefits:
✅ FREE - No API costs
✅ LOCAL - Runs on your machine
✅ DYNAMIC - Generate any text
✅ PRIVATE - No data sent externally
""")

print("\n📁 Files created:")
print("  - coqui_api_server.py (main server)")
print("  - coqui-integration.js (browser integration)")
print("  - start-coqui-server.sh (start script)")
print("  - test-coqui.html (test page)")
print("  - extract_voice_refs.py (voice extractor)")
print("  - COQUI_QUICK_START.md (quick reference)")
