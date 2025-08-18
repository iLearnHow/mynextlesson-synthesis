# Railway TTS Server Deployment Guide
## Enhanced Server with Phoneme Support

---

## 🚀 Quick Deployment Steps

### 1. **Update Railway Service**

```bash
# In your local ilearn_how directory:

# 1. Copy the enhanced server
cp hybrid_tts_server_with_phonemes.py hybrid_tts_server.py

# 2. Commit changes
git add hybrid_tts_server.py
git commit -m "Add phoneme extraction support to TTS server"

# 3. Push to Railway
git push railway main
```

### 2. **Environment Variables**

Ensure these are set in Railway:
```
STRICT_TTS=1            # Disable fallback engines
PORT=5002               # Railway will override with $PORT
FLASK_ENV=production
```

### 3. **Requirements File**

Create/update `requirements.txt`:
```txt
flask==3.0.0
flask-cors==4.0.0
TTS==0.22.0
torch>=2.0.0
numpy
wave
```

### 4. **Procfile** (if needed)

```
web: python hybrid_tts_server.py
```

---

## 🧪 Testing the Deployment

### Health Check:
```bash
curl https://tts-server-production-61b7.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "engine": "coqui_xtts",
  "capabilities": {
    "dynamic": true,
    "voices": ["kelly", "ken"],
    "phonemes": true,
    "quality": "excellent"
  }
}
```

### Test with Phonemes:
```bash
curl -X POST https://tts-server-production-61b7.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "speaker": "kelly",
    "include_phonemes": true
  }'
```

---

## 📦 Alternative: Docker Deployment

If you prefer Docker on Railway:

`Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY hybrid_tts_server.py .
COPY dist/ ./dist/

# Expose port
EXPOSE 5002

# Run server
CMD ["python", "hybrid_tts_server.py"]
```

---

## 🔧 Troubleshooting

### Issue: "Coqui init failed"
- Increase Railway instance memory (min 2GB recommended)
- Check torch installation in logs

### Issue: "Phoneme extraction not available"
- Ensure espeak-ng is installed (add to nixpacks.toml or Dockerfile)
- Check TTS installation includes phonemizer support

### Issue: Slow cold starts
- Normal for XTTS model loading
- Consider keeping service warm with health checks

---

## 🚦 Verification Steps

1. **Check Logs**:
   ```bash
   railway logs
   ```
   Look for:
   - "✅ Using Coqui TTS model: tts_models/multilingual/multi-dataset/xtts_v2"
   - "✅ Phoneme extraction enabled"

2. **Monitor Performance**:
   - First request after deploy: ~30s (model loading)
   - Subsequent requests: <2s
   - With phonemes: +100-200ms overhead

3. **Test Both Voices**:
   - Kelly: `{"text": "Test", "speaker": "kelly"}`
   - Ken: `{"text": "Test", "speaker": "ken"}`

---

## 📝 Production Considerations

1. **Scaling**: 
   - Single instance handles ~10 concurrent requests
   - Scale horizontally for more capacity

2. **Caching**:
   - Consider Redis for repeated phrases
   - Cache phoneme extraction results

3. **Monitoring**:
   - Set up health check every 5 minutes
   - Alert on response time > 5s

The enhanced server is now ready to power avatar lip sync on ilearnhow.com!
