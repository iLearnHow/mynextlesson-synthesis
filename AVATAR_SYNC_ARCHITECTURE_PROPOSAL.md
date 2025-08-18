# Avatar Synchronization Architecture Proposal
## Real-time TTS to Avatar Frame Sync System

---

## Executive Summary

You have a sophisticated foundation already in place! The system includes:
- ✅ Viseme mapping (phoneme to mouth shape)
- ✅ Full-frame viseme support
- ✅ Cloudflare R2 CDN configured (`https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars`)
- ✅ TTS integration with Ken & Kelly voices
- ⚠️ Missing: Real-time synchronization between TTS timing and avatar frames

---

## 🎯 Goal

Create a unified "Avatar Player" that:
1. Plays TTS audio (Ken/Kelly voices)
2. Extracts phoneme timing from TTS
3. Switches avatar background images in real-time from Cloudflare R2
4. Provides smooth, synchronized lip-sync animation

---

## 🚀 Three Architecture Approaches

### **Option 1: Enhanced Phoneme-Driven Player** (Recommended)
*Leverage existing viseme infrastructure with TTS timing data*

**Architecture:**
```
TTS Server → Phoneme Timing → Viseme Curves → Frame Switcher → Avatar Display
```

**Implementation:**
1. **Modify TTS endpoint** to return phoneme timing:
   ```javascript
   POST /api/tts
   {
     "text": "Hello, I'm Kelly",
     "speaker": "kelly",
     "include_phonemes": true
   }
   
   Response:
   {
     "audio": <blob>,
     "phonemes": [
       {"phoneme": "HH", "start": 0.0, "end": 0.1},
       {"phoneme": "EH", "start": 0.1, "end": 0.2},
       {"phoneme": "L", "start": 0.2, "end": 0.3}
     ]
   }
   ```

2. **Create AvatarSyncPlayer class:**
   ```javascript
   class AvatarSyncPlayer {
     constructor() {
       this.audio = document.getElementById('tts-audio');
       this.avatarBg = document.getElementById('avatar-background');
       this.cdnBase = 'https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars';
       this.visemeFrames = new Map(); // Cache loaded images
       this.phonemeTimeline = [];
     }
     
     async play(text, speaker) {
       // 1. Get TTS with phonemes
       const {audio, phonemes} = await this.getTTSWithPhonemes(text, speaker);
       
       // 2. Convert phonemes to viseme timeline
       this.phonemeTimeline = this.buildVisemeTimeline(phonemes);
       
       // 3. Preload viseme frames
       await this.preloadVisemeFrames(speaker);
       
       // 4. Start synchronized playback
       this.audio.src = URL.createObjectURL(audio);
       this.startFrameSync();
       await this.audio.play();
     }
     
     startFrameSync() {
       const updateFrame = () => {
         const currentTime = this.audio.currentTime;
         const viseme = this.getCurrentViseme(currentTime);
         this.updateAvatarFrame(viseme);
         
         if (!this.audio.paused && !this.audio.ended) {
           requestAnimationFrame(updateFrame);
         }
       };
       updateFrame();
     }
   }
   ```

**Pros:**
- Uses existing viseme infrastructure
- Smooth frame transitions
- Precise lip-sync
- Works with current TTS system

**Cons:**
- Requires TTS server modification
- Needs phoneme extraction capability

---

### **Option 2: Pre-rendered Video Player**
*Generate synchronized avatar videos server-side*

**Architecture:**
```
TTS + Avatar Frames → Video Generation → CDN Storage → Video Player
```

**Implementation:**
1. **Server-side video generation:**
   - Use ffmpeg to combine TTS audio with avatar frames
   - Generate videos for common phrases
   - Store in R2 bucket

2. **Client-side player:**
   ```javascript
   class AvatarVideoPlayer {
     constructor() {
       this.videoElement = document.createElement('video');
       this.videoCache = new Map();
     }
     
     async play(text, speaker) {
       const videoUrl = await this.getOrGenerateVideo(text, speaker);
       this.videoElement.src = videoUrl;
       await this.videoElement.play();
     }
   }
   ```

**Pros:**
- Perfect sync guaranteed
- Reduced client-side complexity
- Can use advanced video codecs

**Cons:**
- Not truly dynamic (limited to pre-generated content)
- Large storage requirements
- Generation latency for new content

---

### **Option 3: Waveform Analysis Player**
*Client-side audio analysis for lip-sync*

**Architecture:**
```
TTS Audio → Web Audio API → Amplitude Analysis → Viseme Estimation → Frame Display
```

**Implementation:**
1. **Real-time audio analysis:**
   ```javascript
   class WaveformAvatarPlayer {
     constructor() {
       this.audioContext = new AudioContext();
       this.analyser = this.audioContext.createAnalyser();
       this.visemeEstimator = new VisemeEstimator();
     }
     
     async play(text, speaker) {
       // Get TTS audio
       const audioBlob = await this.getTTS(text, speaker);
       
       // Setup audio analysis
       const audioBuffer = await this.audioContext.decodeAudioData(await audioBlob.arrayBuffer());
       const source = this.audioContext.createBufferSource();
       source.buffer = audioBuffer;
       source.connect(this.analyser);
       this.analyser.connect(this.audioContext.destination);
       
       // Start playback with frame sync
       this.startWaveformSync();
       source.start();
     }
     
     startWaveformSync() {
       const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
       
       const analyze = () => {
         this.analyser.getByteFrequencyData(dataArray);
         
         // Estimate viseme from frequency data
         const viseme = this.visemeEstimator.estimate(dataArray);
         this.updateAvatarFrame(viseme);
         
         requestAnimationFrame(analyze);
       };
       analyze();
     }
   }
   ```

**Pros:**
- Works with any audio source
- No server modifications needed
- Real-time adaptation

**Cons:**
- Less accurate lip-sync
- Higher CPU usage
- Approximation rather than precise sync

---

## 📊 Comparison Matrix

| Feature | Option 1: Phoneme-Driven | Option 2: Pre-rendered | Option 3: Waveform |
|---------|-------------------------|------------------------|-------------------|
| Accuracy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Implementation | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Storage | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Recommendation: Option 1 - Enhanced Phoneme-Driven Player

**Why?**
1. **Leverages existing infrastructure** - You already have viseme mapping and frame switching
2. **True dynamic content** - Any text can be spoken with perfect sync
3. **Scalable** - Only requires phoneme data, not video generation
4. **Quality** - Precise lip-sync matching professional standards

**Quick Win Implementation:**
1. Use existing `_requestPhonemesBackend` method in complete-lesson-player.js
2. Enable `fullFrameVisemesEnabled` mode
3. Set `window.VISEME_CDN_BASE` to your R2 bucket
4. The system already handles frame switching!

**What's Missing:**
- TTS server needs to return phoneme timing
- Viseme frames need to be uploaded to R2 bucket
- Minor coordination code to tie it together

---

## 🚀 Next Steps

1. **Verify R2 bucket has viseme frames:**
   - `/kelly/full/REST.png`
   - `/kelly/full/MBP.png`
   - `/kelly/full/A.png`
   - etc. (12 viseme positions)

2. **Modify TTS server to include phonemes:**
   - Use Coqui TTS phoneme extraction
   - Or use a phoneme estimation library

3. **Test with existing infrastructure:**
   ```javascript
   // This should already work if assets are in place!
   window.lessonPlayer.fullFrameVisemesEnabled = true;
   window.lessonPlayer.speakPhase('welcome');
   ```

The foundation is already built - we just need to connect the final pieces!
