#!/usr/bin/env python3
"""
Direct test of Coqui TTS - generates audio file
"""

import requests
import json
import time
import subprocess
import os

print("🎤 Testing Coqui TTS Server...")
print("=" * 40)

# Check if server is running
try:
    response = requests.get("http://localhost:5002/health", timeout=5)
    if response.status_code == 200:
        health = response.json()
        print("✅ Server is running!")
        print(f"   Engine: {health.get('engine', 'unknown')}")
        print(f"   Status: {health.get('status', 'unknown')}")
    else:
        print("⚠️  Server returned unexpected status:", response.status_code)
except requests.exceptions.RequestException as e:
    print("❌ Server not responding. Please run: ./start-tts-server.sh")
    print(f"   Error: {e}")
    exit(1)

# Test TTS generation
print("\n🎯 Generating test audio...")

test_phrases = {
    "kelly": "Hi! I'm Kelly from iLearn How. Welcome to our dynamic voice synthesis system!",
    "ken": "Hello! I'm Ken, and I'm speaking with free, local text-to-speech technology!"
}

for speaker, text in test_phrases.items():
    print(f"\n📢 Testing {speaker.title()} voice...")
    
    try:
        # Make TTS request
        response = requests.post(
            "http://localhost:5002/api/tts",
            json={"text": text, "speaker": speaker},
            timeout=30  # Give it time for first generation
        )
        
        if response.status_code == 200:
            # Save audio file
            filename = f"test_{speaker}.mp3"
            with open(filename, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Generated: {filename} ({len(response.content):,} bytes)")
            
            # Try to play it
            if os.path.exists("/usr/bin/afplay"):  # macOS
                print(f"🔊 Playing {speaker} voice...")
                subprocess.run(["afplay", filename])
            else:
                print(f"💾 Audio saved to: {filename}")
                print("   (Install afplay or use another player to hear it)")
                
        else:
            print(f"❌ Failed to generate {speaker} audio")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error generating {speaker} audio: {e}")

print("\n✨ Test complete!")
print("\nTo use in your browser:")
print("1. Keep the server running")
print("2. Open http://localhost:8080")
print("3. Voices will work automatically!")

# Show how to use in code
print("\n📝 JavaScript usage:")
print("""
// In browser console:
testLocalTTS.kelly()  // Test Kelly voice
testLocalTTS.ken()    // Test Ken voice

// Or directly:
window.localTTS.speak("Any text!", "kelly")
""")
