#!/bin/bash

echo "🧪 Testing Production TTS Server"
echo "================================"

# Get the production URL from command line or use default
PROD_URL=${1:-"https://api.ilearnhow.com"}

echo "Testing: $PROD_URL"
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s "$PROD_URL/health" | python3 -m json.tool
echo ""

# Test Kelly voice
echo "2️⃣ Testing Kelly voice..."
curl -X POST "$PROD_URL/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello! I am Kelly from the production server.", "speaker":"kelly"}' \
  -o test_kelly_prod.mp3

if [ -f test_kelly_prod.mp3 ]; then
    echo "✅ Kelly audio generated: test_kelly_prod.mp3"
    echo "   Size: $(ls -lh test_kelly_prod.mp3 | awk '{print $5}')"
else
    echo "❌ Failed to generate Kelly audio"
fi
echo ""

# Test Ken voice
echo "3️⃣ Testing Ken voice..."
curl -X POST "$PROD_URL/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi there! Ken here from your production server.", "speaker":"ken"}' \
  -o test_ken_prod.mp3

if [ -f test_ken_prod.mp3 ]; then
    echo "✅ Ken audio generated: test_ken_prod.mp3"
    echo "   Size: $(ls -lh test_ken_prod.mp3 | awk '{print $5}')"
else
    echo "❌ Failed to generate Ken audio"
fi
echo ""

echo "🎵 To play the audio files:"
echo "   afplay test_kelly_prod.mp3"
echo "   afplay test_ken_prod.mp3"
echo ""
echo "🧹 To clean up test files:"
echo "   rm test_*_prod.mp3"
