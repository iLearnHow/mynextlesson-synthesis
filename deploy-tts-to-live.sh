#!/bin/bash
# Deploy TTS-enabled system to ilearnhow.com

echo "🚀 Deploying TTS System to ilearnhow.com"
echo "========================================"

# Step 1: Prepare deployment directory
echo -e "\n📦 Step 1: Preparing deployment files..."
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy all necessary files
cp index.html deploy-temp/
cp *.js deploy-temp/
cp *.css deploy-temp/
cp -r data deploy-temp/
cp -r production-deploy deploy-temp/
cp -r generated_audio deploy-temp/ 2>/dev/null || echo "No generated audio yet"
cp -r models deploy-temp/
cp -r heygen_batches deploy-temp/

# Copy Python scripts for reference
cp *.py deploy-temp/

echo "✅ Files prepared"

# Step 2: Create deployment manifest
echo -e "\n📋 Step 2: Creating deployment manifest..."
cat > deploy-temp/tts-deployment.json << 'EOF'
{
  "version": "1.0",
  "deployment_date": "2025-08-16",
  "features": {
    "tts_system": "dynamic-tts-system.js",
    "voice_generator": "speak.py",
    "batch_converter": "batch_convert.py",
    "audio_files": "generated_audio/",
    "models": "models/"
  },
  "status": "tts_enabled"
}
EOF

# Step 3: Test the build locally
echo -e "\n🧪 Step 3: Testing build..."
cd deploy-temp
python3 -m http.server 8081 &
SERVER_PID=$!
sleep 2

echo "✅ Test server running on http://localhost:8081"
echo "   (Kill with: kill $SERVER_PID)"

cd ..

# Step 4: Deploy to Cloudflare
echo -e "\n☁️  Step 4: Ready to deploy to Cloudflare!"
echo ""
echo "To deploy, run:"
echo "  npx wrangler pages deploy deploy-temp --project-name=ilearnhow"
echo ""
echo "Or if you're logged in:"
echo "  npm run deploy"
echo ""
echo "🎯 After deployment, your TTS will be live at ilearnhow.com!"
