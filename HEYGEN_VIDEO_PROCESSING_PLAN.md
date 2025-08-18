# 🚀 HeyGen Video Processing - Realistic 2-3 Day Plan

## 📋 What You Have
- 2-3 MP4 files per avatar (Ken & Kelly)
- ~60 minutes total per avatar
- Transcript files (batch_XX.txt)

## ⏱️ Realistic Timeline: 2-3 Days (Not 10-12!)

### **Day 1: Processing (4-6 hours actual work)**
```bash
# Morning (30 minutes)
- Extract audio from MP4 files
- Prepare transcript files

# Afternoon (2-3 hours) 
- Run MFA forced alignment (mostly automated waiting)
- Extract phoneme timings

# Evening (1-2 hours)
- Create phoneme database
- Test basic integration
```

### **Day 2: Integration (3-4 hours)**
```bash
# Morning (2 hours)
- Integrate with UniversalLessonPlayer
- Test phoneme lookup

# Afternoon (1-2 hours)
- Fine-tune timing
- Add caching layer
```

### **Day 3: Polish (Optional, 2-3 hours)**
```bash
- Optimize performance
- Add fallback handling
- Deploy to production
```

## 🛠️ Required Tools

### 1. **Install Dependencies** (10 minutes)
```bash
# Audio processing
brew install ffmpeg sox

# Phoneme alignment
conda create -n aligner -c conda-forge montreal-forced-aligner
conda activate aligner
mfa model download acoustic english_us_arpa
mfa model download dictionary english_us_arpa

# Node packages (if needed)
npm install textgrid-parser audio-buffer-utils
```

### 2. **Run Processing Script** (2-3 hours total)
```bash
# Place your MP4 files in ~/heygen_videos/
mkdir ~/heygen_videos
# Copy ken_1.mp4, ken_2.mp4, kelly_1.mp4, kelly_2.mp4

# Run the processing pipeline
node tools/process_heygen_videos.js
```

### 3. **Integrate with Player** (30 minutes)
```bash
# Apply the integration patch
node tools/integrate_heygen_phonemes.js

# Copy phoneme database to web directory
cp ~/ilearn_how/phoneme_data/phoneme_database.json ~/ilearn_how/phoneme_data/
```

### 4. **Test & Verify** (30 minutes)
```bash
# Open the visualization tool
open tools/visualize_phonemes.html

# Test in your app
# The player will automatically use HeyGen phonemes when available
```

## 📊 Why It's Actually Fast

1. **Audio Extraction**: 5-10 minutes for 60 minutes of video
   - FFmpeg processes faster than real-time
   - Simple format conversion

2. **MFA Alignment**: 30-60 minutes for 60 minutes of audio
   - Modern CPUs handle this efficiently
   - Fully automated process

3. **Database Creation**: 10-15 minutes
   - Just parsing text files
   - Creating JSON lookup tables

4. **Integration**: 1-2 hours
   - You already have the infrastructure!
   - Just plugging in phoneme data

## 🎯 What You Get

1. **Phoneme-accurate lip sync** from real HeyGen generation
2. **Instant playback** (no API calls needed)
3. **Fallback support** when exact matches aren't found
4. **Professional quality** avatar animation

## ⚡ Quick Start Commands

```bash
# 1. Setup (one time)
conda create -n aligner -c conda-forge montreal-forced-aligner
conda activate aligner
mfa model download acoustic english_us_arpa

# 2. Process videos
mkdir ~/heygen_videos
# Copy your MP4s here
node tools/process_heygen_videos.js

# 3. Test
open tools/visualize_phonemes.html
```

## 🤔 Common Questions

**Q: Why was the original estimate 10-12 days?**
A: I was being overly conservative and breaking down into unnecessary phases. The actual processing is mostly automated.

**Q: What if MFA alignment fails?**
A: The system falls back to text-based phoneme estimation. You can also manually correct critical phrases.

**Q: How much disk space needed?**
A: ~500MB for 60 minutes of audio + phoneme database

**Q: Can I process more videos later?**
A: Yes! Just run the script again with new videos.

## 📞 Need Help?

The scripts include error handling and will guide you through any issues. Most common problems:

1. **MFA not installed**: Follow the conda install commands
2. **Missing transcripts**: Make sure batch_XX.txt files match your videos
3. **Integration issues**: Check browser console for errors

Total actual work time: **4-6 hours spread over 2-3 days**
