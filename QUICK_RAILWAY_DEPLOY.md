# 🚀 Quick Railway TTS Server Deployment

## Step 1: Login to Railway
```bash
railway login
```
Follow the browser authentication process.

## Step 2: Deploy Enhanced TTS Server
```bash
railway up
```

This will deploy your enhanced TTS server with phoneme support to Railway.

## Step 3: Verify Deployment
```bash
railway status
```

## Step 4: Check Health
```bash
curl https://tts-server-production-61b7.up.railway.app/health
```

Expected response should show:
```json
{
  "status": "healthy",
  "engine": "xtts_v2",
  "capabilities": {
    "phonemes": true
  }
}
```

## What This Deploys:
- ✅ Enhanced TTS server with phoneme extraction
- ✅ Support for Kelly and Ken voices
- ✅ Real-time phoneme timing data
- ✅ Avatar sync ready

## After Deployment:
1. Your TTS server will have phoneme support
2. Avatar sync will work with real-time lip movement
3. No more robot voices on ilearnhow.com

## Alternative: Manual Dashboard Deploy
If CLI doesn't work:
1. Go to [Railway Dashboard](https://railway.app/)
2. Select your TTS project
3. Go to Deployments
4. Click "Deploy" (it will use the latest git commit)

The enhanced server is ready to deploy! 🎭
