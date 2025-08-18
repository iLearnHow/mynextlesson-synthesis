#!/bin/bash

echo "🧪 Testing Avatar Sync Production Readiness"
echo "=========================================="

# Test 1: Check local files
echo -e "\n1️⃣ Checking viseme frames prepared..."
if [ -d "r2-upload-ready" ]; then
    KELLY_COUNT=$(ls r2-upload-ready/kelly/full/*.png 2>/dev/null | wc -l)
    KEN_COUNT=$(ls r2-upload-ready/ken/full/*.png 2>/dev/null | wc -l)
    echo "✅ Kelly frames: $KELLY_COUNT"
    echo "✅ Ken frames: $KEN_COUNT"
else
    echo "❌ Viseme frames not prepared. Run: ./upload-visemes-simple.sh"
fi

# Test 2: Check TTS server
echo -e "\n2️⃣ Checking local TTS server..."
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:5002/health)
    echo "✅ TTS server running"
    echo "$HEALTH" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   Engine: {d[\"engine\"]}'); print(f'   Phonemes: {d[\"capabilities\"][\"phonemes\"]}')"
else
    echo "❌ TTS server not running. Run: ./start-tts-server.sh"
fi

# Test 3: Check Railway TTS
echo -e "\n3️⃣ Checking Railway TTS server..."
if curl -s https://tts-server-production-61b7.up.railway.app/health > /dev/null 2>&1; then
    RAILWAY_HEALTH=$(curl -s https://tts-server-production-61b7.up.railway.app/health)
    echo "✅ Railway server responding"
    echo "$RAILWAY_HEALTH" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   Status: {d[\"status\"]}'); print(f'   Engine: {d.get(\"engine\", \"unknown\")}')" 2>/dev/null || echo "   (Could not parse response)"
else
    echo "⚠️  Railway server not responding"
fi

# Test 4: Check R2 CDN
echo -e "\n4️⃣ Checking R2 CDN access..."
CDN_URL="https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png"
if curl -s -I "$CDN_URL" | grep -q "200\|304"; then
    echo "✅ R2 CDN accessible"
else
    echo "❌ R2 CDN not accessible. Upload files from r2-upload-ready/"
fi

# Test 5: Check code integration
echo -e "\n5️⃣ Checking code integration..."
if grep -q "avatar-sync-player.js" index.html; then
    echo "✅ Avatar sync player integrated"
else
    echo "❌ Avatar sync player not found in index.html"
fi

if grep -q "fullFrameVisemesEnabled = true" index.html; then
    echo "✅ Auto-enable for production configured"
else
    echo "❌ Auto-enable not configured"
fi

# Summary
echo -e "\n📊 Summary"
echo "=========="
echo "To complete deployment:"
echo "1. Upload r2-upload-ready/ contents to R2 bucket"
echo "2. Deploy hybrid_tts_server_with_phonemes.py to Railway"
echo "3. Test at https://ilearnhow.com/"
echo ""
echo "Test URLs:"
echo "- Local test: http://localhost:5002/test-avatar-sync.html"
echo "- Production: https://ilearnhow.com/?avatarsync=1"
