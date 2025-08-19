#!/bin/bash

echo "🚀 Deploying Piper TTS to Railway..."

# Update railway.json to use Piper Dockerfile
cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.piper"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF

echo "✅ Updated railway.json to use Piper"
echo ""
echo "📝 Next steps:"
echo "1. Commit these changes:"
echo "   git add railway.json Dockerfile.piper railway-piper-server.py requirements-piper.txt"
echo "   git commit -m 'Switch to Piper TTS for Railway'"
echo ""
echo "2. Deploy to Railway:"
echo "   railway up"
echo ""
echo "3. Get your URL:"
echo "   railway domain"
echo ""
echo "Piper is MUCH lighter than Coqui/XTTS and will work well on Railway!"
