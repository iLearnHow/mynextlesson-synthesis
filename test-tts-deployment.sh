#!/bin/bash

# Test TTS Deployment Script
# Usage: ./test-tts-deployment.sh [URL]

TTS_URL=${1:-"http://localhost:5002"}

echo "🧪 Testing TTS deployment at: $TTS_URL"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s "$TTS_URL/health" | python3 -m json.tool
echo ""

# Test 2: Generate Ken voice
echo "2️⃣ Testing Ken voice generation..."
curl -s -X POST "$TTS_URL/api/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, I am Ken. Welcome to your lesson today!",
    "speaker": "ken",
    "include_phonemes": true
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Audio generated: {len(data.get(\"audio\", \"\"))} bytes')
print(f'✅ Duration: {data.get(\"duration\", 0):.2f} seconds')
print(f'✅ Phonemes: {len(data.get(\"phonemes\", []))} frames')
"
echo ""

# Test 3: Generate Kelly voice
echo "3️⃣ Testing Kelly voice generation..."
curl -s -X POST "$TTS_URL/api/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi there! I am Kelly, and I am excited to teach you!",
    "speaker": "kelly",
    "include_phonemes": true
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Audio generated: {len(data.get(\"audio\", \"\"))} bytes')
print(f'✅ Duration: {data.get(\"duration\", 0):.2f} seconds')
print(f'✅ Phonemes: {len(data.get(\"phonemes\", []))} frames')
"
echo ""

# Test 4: Test actual audio playback (saves test file)
echo "4️⃣ Saving test audio file..."
curl -s -X POST "$TTS_URL/api/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test of the text to speech system.",
    "speaker": "kelly"
  }' | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
if 'audio' in data:
    audio_data = base64.b64decode(data['audio'])
    with open('test_tts_output.wav', 'wb') as f:
        f.write(audio_data)
    print('✅ Audio saved to test_tts_output.wav')
    print(f'✅ File size: {len(audio_data)} bytes')
else:
    print('❌ No audio data in response')
"

echo ""
echo "🎉 TTS deployment test complete!"
echo ""
echo "To test in production:"
echo "./test-tts-deployment.sh https://your-app.up.railway.app"
