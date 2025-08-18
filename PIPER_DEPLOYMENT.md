# Switching from Coqui to Piper TTS

## Why Piper?
- Coqui shut down in late 2023
- Piper is actively maintained and fast
- Works great for voice synthesis
- No license agreement issues

## What I've Done:

### 1. Created New Piper TTS Server
- `piper_tts_server.py` - Drop-in replacement for Coqui
- Same API endpoints (`/api/tts`, `/health`)
- Returns phoneme timing for lip sync
- Uses espeak-ng for phoneme extraction

### 2. Updated Docker/Railway
- `Dockerfile` now uses `piper_tts_server.py`
- `requirements.txt` updated to use piper-tts
- Removed all Coqui dependencies

### 3. Voice Models
- Kelly: Using `en_US-amy-medium` (female voice)
- Ken: Using `en_US-joe-medium` (male voice)
- Models auto-download from HuggingFace on first use

## Next Steps:

### 1. Deploy to Railway
```bash
git add -A
git commit -m "Replace Coqui with Piper TTS - no more license issues"
git push
```

### 2. Test Locally First
```bash
# Install dependencies
pip install piper-tts
brew install espeak-ng  # For phoneme extraction

# Start server
./start-piper-server.sh

# Test in another terminal
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I am Kelly", "speaker": "kelly", "include_phonemes": true}'
```

### 3. Railway Will Auto-Deploy
- No environment variables needed!
- No license agreements!
- Should start working immediately

## Voice Customization (Later)
Once this works, we can:
1. Fine-tune Piper models with your Ken/Kelly recordings
2. Use voice cloning techniques
3. Adjust voice parameters

But first, let's get the basic system working!
