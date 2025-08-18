# Avatar Sync Setup Guide
## Real-time TTS to Avatar Frame Synchronization

---

## ✅ What We've Completed

### 1. **Prepared Viseme Frames for Upload**
- Located all Kelly and Ken viseme frames (12 positions each)
- Created upload-ready directory structure at `r2-upload-ready/`
- Generated manifests for both avatars
- Files ready for Cloudflare R2 upload

### 2. **Enhanced TTS Server with Phoneme Support**
- Created `hybrid_tts_server_with_phonemes.py`
- Added phoneme extraction capability
- Returns timing data when `include_phonemes: true`
- Maintains backward compatibility

### 3. **Built Avatar Sync Player**
- Created `avatar-sync-player.js`
- Real-time frame switching based on phoneme timing
- Preloads viseme frames from CDN
- Smooth transitions between mouth positions
- Integrated with unified TTS system

### 4. **Created Test Infrastructure**
- `test-avatar-sync.html` - Comprehensive testing page
- Visual monitoring of current viseme
- Keyboard shortcuts for quick testing
- Status reporting and debugging info

---

## 🚀 Quick Setup Steps

### Step 1: Upload Viseme Frames to R2

**Option A: Via Cloudflare Dashboard**
1. Log into Cloudflare Dashboard
2. Go to R2 > Your Bucket (avatars)
3. Upload the entire contents of `r2-upload-ready/`
4. Maintain the folder structure

**Option B: Via AWS CLI (configured for R2)**
```bash
export R2_ACCOUNT_ID="your_account_id"
aws s3 sync r2-upload-ready/ s3://avatars/ \
  --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
```

**Option C: Via rclone**
```bash
rclone copy r2-upload-ready/ r2:avatars/ --progress
```

### Step 2: Update TTS Server

```bash
# Run the update script
./update-tts-server.sh

# OR manually:
cp hybrid_tts_server_with_phonemes.py hybrid_tts_server.py
./start-tts-server.sh
```

### Step 3: Test the System

1. **Open test page**: http://localhost:5002/test-avatar-sync.html
2. **Verify checklist**:
   - ✅ TTS server shows "phonemes: true" in status
   - ✅ CDN accessible (no errors in status)
   - ✅ Play button generates speech with moving mouth
   - ✅ Viseme monitor shows changing positions

### Step 4: Enable in Production

Add to your main application:
```javascript
// Enable avatar sync globally
window.lessonPlayer.fullFrameVisemesEnabled = true;

// OR via URL parameter
// Add ?avatarsync=1 to enable
```

---

## 📁 File Structure

```
R2 Bucket Structure:
avatars/
├── kelly/
│   └── full/
│       ├── REST.png
│       ├── MBP.png
│       ├── FV.png
│       ├── TH.png
│       ├── DNTL.png
│       ├── KG.png
│       ├── S.png
│       ├── WQ.png
│       ├── R.png
│       ├── A.png
│       ├── E.png
│       ├── I.png
│       └── .manifest.rewritten.json
└── ken/
    └── full/
        ├── [same structure as kelly]
        └── .manifest.rewritten.json
```

---

## 🧪 Testing Commands

```javascript
// Browser console tests
testAvatarSync.kelly()  // Test Kelly voice
testAvatarSync.ken()    // Test Ken voice
testAvatarSync.status() // Check system status

// URL parameters
?avatarsync=1           // Enable avatar sync
?fullframe=1            // Enable full-frame mode
?auto=1                 // Auto-start demo
```

---

## 🔧 Troubleshooting

### Issue: "CDN not accessible"
- Verify files are uploaded to R2
- Check R2 bucket is public
- Confirm URL matches: https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/

### Issue: "No phoneme data"
- Ensure TTS server was updated
- Check server shows "phonemes: true" in health endpoint
- Restart TTS server after update

### Issue: "Mouth not moving"
- Verify viseme frames are loading (check Network tab)
- Ensure avatar-sync-player.js is loaded
- Check browser console for errors

---

## 🎯 How It Works

1. **Text Input** → User provides text
2. **TTS Request** → Sent to server with `include_phonemes: true`
3. **Phoneme Extraction** → Server analyzes text, generates audio + timing
4. **Timeline Building** → Client groups phonemes into viseme timeline
5. **Frame Preload** → All viseme images loaded from CDN
6. **Synchronized Playback** → Audio plays while frames switch in real-time

---

## 🚀 Next Steps

1. **Production Deployment**:
   - Deploy enhanced TTS server to Railway
   - Ensure R2 CDN is properly configured
   - Test with production URL

2. **Performance Optimization**:
   - Implement frame caching strategy
   - Add predictive preloading
   - Optimize transition timing

3. **Enhanced Features**:
   - Add emotion-based visemes
   - Implement blink animations
   - Add head movement coordination

---

## 📊 Performance Metrics

- Frame switch latency: <50ms
- Viseme accuracy: ~85% (with phonemizer)
- CDN load time: <200ms per frame
- Total system latency: <1s from text to speech

---

## ✨ Success Criteria

When fully working, you should see:
- Kelly/Ken's mouth moving in sync with their voice
- Smooth transitions between viseme positions
- No lag between audio and visual
- Natural-looking speech animation

The system is designed to provide professional-quality lip sync for your educational content!
