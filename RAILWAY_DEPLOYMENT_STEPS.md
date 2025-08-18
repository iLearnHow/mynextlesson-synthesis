# 🚂 Railway Deployment - Step by Step

## Prerequisites
1. Create a Railway account at https://railway.app
2. Add a payment method (required for this app size)

## Step 1: Install Railway CLI

```bash
# If you have npm:
npm install -g @railway/cli

# Or with Homebrew:
brew install railway
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

## Step 3: Create New Project

```bash
# In the ilearn_how directory:
railway link
```

When prompted:
- Select "Create New Project"
- Give it a name like "ilearnhow-tts"

## Step 4: Deploy the TTS Server

```bash
# This will build and deploy using our Dockerfile
railway up
```

This will take 5-10 minutes as it:
- Builds the Docker image
- Downloads the XTTS v2 model (~2GB)
- Starts the server

## Step 5: Get Your Deployment URL

```bash
railway domain
```

Copy the URL it gives you (like `https://ilearnhow-tts.up.railway.app`)

## Step 6: Update Your Frontend

Option A - Update DNS (Recommended):
1. Add a CNAME record: `api.ilearnhow.com` → `your-app.up.railway.app`
2. No code changes needed!

Option B - Update Code Temporarily:
```javascript
// In local-tts-integration.js, change:
this.baseUrl = isProduction ? 'https://api.ilearnhow.com' : 'http://localhost:5002';

// To:
this.baseUrl = isProduction ? 'https://your-app.up.railway.app' : 'http://localhost:5002';
```

## Step 7: Test Production

```bash
# Test the health endpoint
curl https://your-app.up.railway.app/health

# Test TTS generation
curl -X POST https://your-app.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from production!", "speaker":"kelly"}'
```

## Monitoring & Logs

```bash
# View logs
railway logs

# Open Railway dashboard
railway open
```

## Cost Estimate
- **Hobby Plan**: $5/month + usage
- **Expected usage**: ~$20-40/month
- **Resources**: 4GB RAM, 2 vCPU

## Troubleshooting

### If deployment fails:
```bash
# Check logs
railway logs

# Restart
railway restart
```

### If "out of memory":
```bash
# Scale up resources in Railway dashboard
railway open
# Go to Settings → Resources → Increase RAM to 4GB
```

### If domain not working:
1. Make sure to generate a domain with `railway domain`
2. Use the Railway-provided domain first
3. Set up custom domain after confirming it works

## 🎉 Success!

Once deployed:
- No more macOS voices in production!
- Real Ken & Kelly voices
- Scales automatically with demand
- Easy to monitor and update

---

**Need help? The Railway Discord is very responsive!**
