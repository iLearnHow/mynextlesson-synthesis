# 🎤 Coqui TTS Quick Reference

## ✅ Current Status:
- **Server**: Running ✓
- **Port**: 5002
- **Engine**: gTTS (Google Text-to-Speech)
- **Voices**: Kelly & Ken
- **Cost**: FREE

## 🚀 Daily Use:

### Start Server (if not running):
```bash
./start-tts-server.sh
```

### Test It's Working:
```bash
curl http://localhost:5002/health
```

### In Browser Console:
```javascript
// Quick test
testLocalTTS.kelly()
testLocalTTS.ken()
testLocalTTS.status()
```

## 🎯 How It Works:

1. **Automatic Override** - When server is running, all TTS uses local generation
2. **No Changes Needed** - Your existing code just works
3. **Graceful Fallback** - If server stops, falls back to browser TTS

## 📊 Comparison:

| Feature | ElevenLabs | Coqui (Current) | Browser TTS |
|---------|------------|-----------------|-------------|
| Cost | $$$/month | FREE | FREE |
| Quality | Excellent | Good | Poor |
| Voices | Many | Kelly/Ken | Robot |
| Dynamic | Yes | Yes | Yes |
| API Key | Required | None | None |

## 🔧 Troubleshooting:

**Voices sound robotic?**
- Make sure server is running: `ps aux | grep tts`
- Check health: `curl http://localhost:5002/health`

**Server won't start?**
```bash
source coqui_venv/bin/activate
python hybrid_tts_server.py
```

**Want to stop server?**
```bash
ps aux | grep hybrid_tts
kill [PID]
```

## 💡 Remember:

- Keep server running while developing
- No static files needed
- Generates any text dynamically
- Your vision realized! [[memory:6397766]]

---
🎉 You have FREE, LOCAL, DYNAMIC TTS! [[memory:6400390]]
