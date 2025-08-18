#!/bin/bash

echo "🚀 TTS Server Deployment Script"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Please login to Railway:"
railway login

echo ""
echo "🚂 Creating new Railway project..."
railway init

echo ""
echo "🔧 Setting environment variables..."
railway variables set PORT=5002
railway variables set PYTHON_VERSION=3.9

echo ""
echo "🚀 Deploying TTS server..."
railway up

echo ""
echo "🌐 Getting deployment URL..."
railway domain

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the deployment URL from above"
echo "2. Update your DNS to point api.ilearnhow.com to this URL"
echo "3. Or update local-tts-integration.js with the Railway URL"
echo ""
echo "🎉 Your Ken & Kelly voices are now in production!"
