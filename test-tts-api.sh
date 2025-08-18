#!/bin/bash
# Test TTS API endpoints

echo "🧪 Testing TTS Server..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH=$(curl -s https://tts-server-production-61b7.up.railway.app/health)
echo "Response: $HEALTH"
echo ""

# Test TTS with Kelly voice
echo "2. Testing Kelly voice..."
curl -X POST https://tts-server-production-61b7.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, I am Kelly. Welcome to iLearn How!",
    "speaker": "kelly",
    "include_phonemes": true
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Audio size: {len(data.get(\"audio\", \"\"))} chars'); print(f'Phonemes: {len(data.get(\"phonemes\", []))} items')"
echo ""

# Test TTS with Ken voice
echo "3. Testing Ken voice..."
curl -X POST https://tts-server-production-61b7.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi there, I am Ken. Ready to learn?",
    "speaker": "ken",
    "include_phonemes": true
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Audio size: {len(data.get(\"audio\", \"\"))} chars'); print(f'Phonemes: {len(data.get(\"phonemes\", []))} items')"
echo ""

echo "✅ TTS API tests complete!"
