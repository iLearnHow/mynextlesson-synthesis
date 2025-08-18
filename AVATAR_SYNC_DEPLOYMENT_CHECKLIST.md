# Avatar Sync Production Deployment Checklist
## For ilearnhow.com

---

## 🚀 Pre-Deployment Checklist

### 1. **Upload Viseme Frames to R2** ⏳
- [ ] Upload all files from `r2-upload-ready/` to Cloudflare R2 bucket
- [ ] Verify structure: `/avatars/{kelly|ken}/full/{viseme}.png`
- [ ] Test URLs are accessible:
  - https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png
  - https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full/MBP.png

### 2. **Deploy Enhanced TTS Server to Railway** ⏳
- [ ] Update Railway deployment with `hybrid_tts_server_with_phonemes.py`
- [ ] Verify server includes phoneme extraction
- [ ] Test endpoint: https://tts-server-production-61b7.up.railway.app/health
- [ ] Confirm response shows `"phonemes": true`

### 3. **Code Already Deployed** ✅
- [x] Avatar sync player integrated in index.html
- [x] Unified TTS handler with override support
- [x] Auto-enables for production domain
- [x] Fallback to regular TTS if visemes unavailable

---

## 🧪 Production Testing

### Quick Test URLs:
1. **Default (Auto-enabled)**: https://ilearnhow.com/
2. **Force Enable**: https://ilearnhow.com/?avatarsync=1
3. **Force Disable**: https://ilearnhow.com/?avatarsync=0
4. **Custom TTS**: https://ilearnhow.com/?tts=https://your-server.com

### What to Verify:
- [ ] Blue "Start Lesson" button appears
- [ ] Clicking starts Day 230 lesson (August 18, 2025)
- [ ] Kelly's mouth moves when speaking
- [ ] Lip movements match the words
- [ ] No macOS robot voices
- [ ] Smooth frame transitions

### Browser Console Checks:
```javascript
// Check avatar sync status
testAvatarSync.status()

// Test Kelly directly
testAvatarSync.kelly()

// Test Ken directly
testAvatarSync.ken()

// Check if enabled
window.lessonPlayer.fullFrameVisemesEnabled // should be true
```

---

## 🎯 How It Works in Production

1. **Auto-Detection**: System detects ilearnhow.com domain
2. **Auto-Enable**: Avatar sync turns on automatically
3. **CDN Base Set**: Points to R2 bucket for viseme frames
4. **TTS Override**: All speech uses avatar sync player
5. **Graceful Fallback**: If frames missing, uses regular TTS

---

## 🔧 Troubleshooting

### Issue: Mouth not moving
```javascript
// Check in console:
window.VISEME_CDN_BASE // Should show R2 URL
window.avatarSyncPlayer.visemeFrames.size // Should be > 0
```

### Issue: No phoneme data
- Check Railway TTS server is using enhanced version
- Verify `/api/tts` endpoint accepts `include_phonemes`

### Issue: Frames not loading
- Check R2 bucket permissions (public read)
- Verify CORS settings on R2 bucket
- Test direct image URLs in browser

---

## 📊 Performance Monitoring

### Key Metrics:
- **Frame Load Time**: Should be < 200ms per frame
- **TTS Response**: Should include phoneme data
- **Sync Accuracy**: Visemes should match speech timing
- **CPU Usage**: Should remain low during playback

### Debug Mode:
Add `?debug=1` to see additional console logging

---

## 🚦 Go/No-Go Criteria

**GO if all checked:**
- [ ] Viseme frames accessible from R2
- [ ] TTS server returns phoneme data
- [ ] No console errors on page load
- [ ] Avatar mouth moves during speech
- [ ] Performance is acceptable

**NO-GO if any true:**
- [ ] R2 images return 404
- [ ] TTS server missing phoneme support
- [ ] JavaScript errors in console
- [ ] Significant lag between audio/visual
- [ ] High CPU usage during playback

---

## 🎉 Success Indicators

When fully deployed, you should see:
1. Kelly appears with blur overlay
2. "Start Lesson" button in blue
3. Clicking starts lesson with moving mouth
4. Natural lip sync matching speech
5. Smooth performance on all devices

---

## 📝 Post-Deployment

1. **Monitor Error Logs**: Check for 404s on viseme frames
2. **User Feedback**: Watch for sync issues
3. **Performance**: Monitor page load times
4. **Iterate**: Adjust timing constants if needed

The system is designed to enhance user engagement with realistic avatar animation while maintaining fallback compatibility!
