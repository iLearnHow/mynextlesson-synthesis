#!/bin/bash
# Deploy Dynamic TTS System - The Correct Approach

echo "🚀 Deploying Dynamic TTS System"
echo "=============================="
echo "NO static files! True dynamic generation!"
echo ""

# Prepare deployment
echo "📦 Preparing deployment..."
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy all necessary files
cp -r * deploy-temp/ 2>/dev/null || true

# Remove large files
find deploy-temp -name "*.mp4" -delete
find deploy-temp -type f -size +24M -delete

# Remove the static audio files - we don't need them!
echo "🗑️  Removing static audio (not needed for dynamic TTS)..."
rm -rf deploy-temp/generated_audio
rm -rf deploy-temp/generated_audio_mp3

# Clean up old static approach files
rm -f deploy-temp/generate-all-audio.py
rm -f deploy-temp/batch_convert.py

# Update the deployment info
cat > deploy-temp/DEPLOYMENT_INFO.json << 'EOF'
{
  "tts_system": "dynamic",
  "approach": "real-time generation",
  "static_files": "none",
  "integrations": {
    "elevenlabs": "ready (needs API key)",
    "coqui": "available (needs setup)",
    "xtts_runpod": "future (needs training)"
  },
  "benefits": [
    "Generate any text on-demand",
    "No storage limitations",
    "Truly scalable",
    "Professional quality"
  ]
}
EOF

echo "✅ Ready for deployment"
echo ""
echo "📋 What's Different:"
echo "  ✅ NO static audio files"
echo "  ✅ Dynamic TTS integration"
echo "  ✅ ElevenLabs ready to use"
echo "  ✅ Truly scalable solution"
echo ""
echo "🎯 To deploy: npm run deploy"
echo ""
echo "🔑 After deployment:"
echo "  1. Open ilearnhow.com"
echo "  2. Add ElevenLabs API key when prompted"
echo "  3. Enjoy unlimited dynamic voice generation!"
