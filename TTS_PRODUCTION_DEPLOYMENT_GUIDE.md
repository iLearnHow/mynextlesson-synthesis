# 🚀 TTS Production Deployment Guide

## 📍 Current Status
- **Local**: Coqui TTS server running on port 5002 ✅
- **Production**: Expecting API at https://api.ilearnhow.com ❌
- **Result**: Production falls back to macOS voices 😱

## 🎯 Why It's Not Deployed Yet

### 1. **Infrastructure Requirements**
- Coqui TTS needs ~4GB RAM and CPU for XTTS v2
- Can't run on Cloudflare Workers (50ms CPU limit)
- Needs persistent server, not serverless

### 2. **Current Architecture Mismatch**
- Your app expects: `https://api.ilearnhow.com/api/tts`
- Cloudflare Workers: Great for light APIs, not ML models
- Need: Dedicated server or container service

## 🛠️ Deployment Options

### Option 1: **Railway/Render** (Recommended) 
```bash
# Deploy directly from GitHub
# $20-40/month for adequate resources

# railway.toml
[build]
builder = "DOCKERFILE"

[deploy]
numReplicas = 1
healthcheckPath = "/health"
healthcheckTimeout = 300

# Dockerfile already exists as xtts_server.py
```

### Option 2: **Google Cloud Run**
```bash
# Build container
docker build -t gcr.io/YOUR_PROJECT/tts-server .

# Deploy
gcloud run deploy tts-server \
  --image gcr.io/YOUR_PROJECT/tts-server \
  --memory 4Gi \
  --cpu 2 \
  --timeout 60 \
  --allow-unauthenticated
```

### Option 3: **Cloudflare + External API**
```javascript
// wrangler.toml for proxy worker
name = "tts-api-proxy"
main = "src/index.js"
compatibility_date = "2023-10-30"

[env.production]
TTS_BACKEND = "https://your-tts-server.railway.app"

// src/index.js
export default {
  async fetch(request, env) {
    if (request.url.includes('/api/tts')) {
      // Proxy to actual TTS server
      return fetch(env.TTS_BACKEND + '/api/tts', {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    return new Response('Not found', { status: 404 });
  }
};
```

## 📝 Quick Deployment Steps

### 1. **Prepare the Server**
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy server files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY xtts_server.py .
COPY dist/reference_kelly.wav dist/
COPY dist/reference_ken_mono16k.wav dist/reference_ken.wav

# Download model on startup
ENV PYTHONUNBUFFERED=1

EXPOSE 5002
CMD ["python", "xtts_server.py"]
EOF

# Create requirements.txt
cat > requirements.txt << 'EOF'
flask==2.3.2
flask-cors==4.0.0
TTS==0.22.0
torch>=2.0.0
EOF
```

### 2. **Deploy to Railway** (Easiest)
1. Push to GitHub repo
2. Connect Railway to repo
3. Set environment variables:
   ```
   PORT=5002
   PYTHON_VERSION=3.9
   ```
4. Deploy!

### 3. **Update Frontend**
```javascript
// Already configured correctly in local-tts-integration.js
this.baseUrl = isProduction ? 'https://api.ilearnhow.com' : 'http://localhost:5002';
```

### 4. **Set up API subdomain**
- Point `api.ilearnhow.com` to your Railway/Render deployment
- Or use Cloudflare proxy worker to route to external service

## ⚡ Immediate Workaround

While setting up proper deployment:

```javascript
// temporary-tts-proxy.js for Cloudflare Worker
export default {
  async fetch(request) {
    // For now, return a clear error message
    if (request.url.includes('/api/tts')) {
      return new Response(JSON.stringify({
        error: "TTS server deployment in progress",
        message: "Please check back in 24 hours or run locally"
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

## 💰 Cost Considerations

| Service | Monthly Cost | Pros | Cons |
|---------|-------------|------|------|
| Railway | $20-40 | Easy deploy, good performance | Costs add up |
| Render | $25-50 | Reliable, auto-scaling | Similar costs |
| Google Cloud Run | $10-30 | Pay per use, scalable | More complex |
| Your own VPS | $20-40 | Full control | Need to manage |

## 🎯 Next Steps

1. **Today**: Deploy to Railway/Render for immediate fix
2. **This Week**: Set up proper CI/CD pipeline
3. **Next Month**: Consider RunPod for GPU acceleration

## 🚨 Critical Note

The TTS server needs to be deployed ASAP because:
- Production is using macOS voices (terrible UX)
- You have the server ready, just needs hosting
- Users expect Ken & Kelly voices, not system voices

---

Want me to create the deployment files and help you deploy right now? [[memory:6378568]]
