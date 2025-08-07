# MyNextLesson Voice & Avatar Training - Complete Implementation Guide

## 🎯 OVERVIEW
This document provides step-by-step instructions for training custom PiperTTS voices and creating talking avatars for Ken and Kelly characters in the MyNextLesson platform.

**What This Guide Covers:**
- Custom voice training with PiperTTS for Ken & Kelly
- Talking avatar creation and animation
- Complete RunPod setup and configuration
- Troubleshooting common issues
- Production deployment workflow

---

## 📋 PREREQUISITES

### Required Assets
- **Ken Audio**: 192 WAV files + transcripts (.txt files)
- **Kelly Audio**: 192 WAV files + transcripts (.txt files)
- **Ken Avatar**: 12 base images (different expressions/poses)
- **Kelly Avatar**: 12 base images (different expressions/poses)

### RunPod Configuration
- **Instance**: RTX 4090 or A100 (24GB+ VRAM recommended)
- **Template**: PyTorch 2.0 or CUDA 11.8
- **Storage**: 100GB+ for all models and data
- **Estimated Cost**: $100-200 total for complete pipeline

---

## 🚀 PART 1: PIPERTS VOICE TRAINING

### STEP 1: RunPod Initial Setup

**1.1 Connect to RunPod**
- Go to runpod.io → Dashboard
- Launch your pod → Connect to JupyterLab
- Open Terminal

**1.2 Install PiperTTS Environment**
```bash
# Clone PiperTTS training repository
cd /root
git clone https://github.com/rhasspy/piper.git piper_training
cd piper_training/piper

# Create Python virtual environment
python3 -m venv piper_venv
source piper_venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -e .
pip install librosa soundfile
```

### STEP 2: Prepare Training Data

**2.1 Create Directory Structure**
```bash
# Ken's voice data
mkdir -p ~/ken_training_data/{audio,transcripts}
mkdir -p ~/ken_ljspeech/wavs

# Kelly's voice data  
mkdir -p ~/kelly_training_data/{audio,transcripts}
mkdir -p ~/kelly_ljspeech/wavs
```

**2.2 Upload Your Audio Files**
- Upload Ken's 192 audio files to `/root/ken_training_data/audio/`
- Upload Ken's 192 transcript files to `/root/ken_training_data/transcripts/`
- Upload Kelly's files to corresponding Kelly directories
- **File naming**: Ensure audio files and transcripts have matching names (e.g., `ken_001.wav` and `ken_001.txt`)

**2.3 Convert to LJSpeech Format**
```bash
# Convert Ken's data
cd ~/ken_ljspeech
cp ~/ken_training_data/audio/*.wav wavs/

# Create metadata.csv for Ken
ls wavs/ | while read wav; do
  base=$(basename "$wav" .wav)
  txt_file="$HOME/ken_training_data/transcripts/${base}.txt"
  if [ -f "$txt_file" ]; then
    text=$(cat "$txt_file" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')
    echo "${base}|${text}"
  fi
done > metadata.csv

# Verify Ken's setup
head -5 metadata.csv
wc -l metadata.csv  # Should show 192 lines
```

**2.4 Repeat for Kelly**
```bash
# Convert Kelly's data
cd ~/kelly_ljspeech
cp ~/kelly_training_data/audio/*.wav wavs/

# Create metadata.csv for Kelly
ls wavs/ | while read wav; do
  base=$(basename "$wav" .wav)
  txt_file="$HOME/kelly_training_data/transcripts/${base}.txt"
  if [ -f "$txt_file" ]; then
    text=$(cat "$txt_file" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')
    echo "${base}|${text}"
  fi
done > metadata.csv

# Verify Kelly's setup
head -5 metadata.csv
wc -l metadata.csv  # Should show 192 lines
```

### STEP 3: Audio Quality Analysis

**⚠️ CRITICAL: Check Sample Rate**
```bash
# Activate environment
source /root/piper_training/piper/piper_venv/bin/activate

# Check Ken's audio properties
cd ~/ken_ljspeech/wavs
python3 -c "
import librosa
import numpy as np
import os

print('🎭 Analyzing Ken audio quality...')
files = [f for f in os.listdir('.') if f.endswith('.wav')][:10]
for f in files:
    audio, sr = librosa.load(f, sr=None)
    duration = len(audio) / sr
    max_amp = np.max(np.abs(audio))
    print(f'{f}: {sr}Hz, {duration:.2f}s, max: {max_amp:.3f}')
    
    # Check for issues
    if sr != 44100 and sr != 22050:
        print(f'  ⚠️  Unusual sample rate: {sr}Hz')
    if max_amp < 0.01:
        print(f'  ❌ Too quiet!')
    if duration < 0.5:
        print(f'  ❌ Too short!')
"

# Check Kelly's audio properties
cd ~/kelly_ljspeech/wavs
python3 -c "
import librosa
import numpy as np
import os

print('🎭 Analyzing Kelly audio quality...')
files = [f for f in os.listdir('.') if f.endswith('.wav')][:10]
for f in files:
    audio, sr = librosa.load(f, sr=None)
    duration = len(audio) / sr
    max_amp = np.max(np.abs(audio))
    print(f'{f}: {sr}Hz, {duration:.2f}s, max: {max_amp:.3f}')
"
```

**Sample Rate Decision:**
- **If 44100Hz**: Use `--sample-rate 44100` (recommended for high quality)
- **If 22050Hz**: Use `--sample-rate 22050`
- **If mixed**: Convert all to 44100Hz for consistency

### STEP 4: Preprocess Training Data

**4.1 Process Ken's Data**
```bash
source /root/piper_training/piper/piper_venv/bin/activate

python3 -m piper_train.preprocess \
  --language en \
  --input-dir ~/ken_ljspeech \
  --output-dir ~/ken_processed_44k \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 44100
```

**4.2 Process Kelly's Data**
```bash
python3 -m piper_train.preprocess \
  --language en \
  --input-dir ~/kelly_ljspeech \
  --output-dir ~/kelly_processed_44k \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 44100
```

**4.3 Verify Preprocessing**
```bash
# Check Ken's processed data
ls -la ~/ken_processed_44k/
# Should see: config.json, dataset.jsonl, cache/

# Check Kelly's processed data
ls -la ~/kelly_processed_44k/
# Should see: config.json, dataset.jsonl, cache/
```

### STEP 5: Voice Training Strategy

**⚠️ CRITICAL LESSON LEARNED: VoiceMaker/AI-Generated Audio Challenges**

**For VoiceMaker or AI-generated audio (like your Ken & Kelly):**
- **Minimum epochs needed**: 500-1000+ (vs 50-100 for human speech)
- **Quality progression**: Epochs 1-200 (garbled) → 200-500 (improving) → 500+ (usable)
- **Training time**: 24-72 hours on GPU, weeks on CPU

**5.1 GPU Training (Recommended)**
```bash
# Terminal 1: Ken GPU Training
source /root/piper_training/piper/piper_venv/bin/activate

python3 -m piper_train \
  --dataset-dir ~/ken_processed_44k/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 1 \
  --validation-split 0.0 \
  --num-test-examples 0 \
  --max_epochs 1000 \
  --checkpoint-epochs 50 \
  --precision 16 \
  --quality medium
```

```bash
# Terminal 2: Kelly GPU Training  
source /root/piper_training/piper/piper_venv/bin/activate

python3 -m piper_train \
  --dataset-dir ~/kelly_processed_44k/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 1 \
  --validation-split 0.0 \
  --num-test-examples 0 \
  --max_epochs 1000 \
  --checkpoint-epochs 50 \
  --precision 16 \
  --quality medium
```

**5.2 GPU Training Troubleshooting**

**If you get "cuFFT error: CUFFT_INTERNAL_ERROR":**
- **Solution 1**: Use `--precision 16` (reduces memory usage)
- **Solution 2**: Reduce `--batch-size` to 1
- **Solution 3**: Use `--accelerator cpu` as fallback (much slower)

### STEP 6: Monitor Training Progress

**6.1 Check Training Status**
```bash
# Check Ken's progress
ls -la ~/ken_processed_44k/lightning_logs/version_*/checkpoints/ | tail -3

# Check Kelly's progress  
ls -la ~/kelly_processed_44k/lightning_logs/version_*/checkpoints/ | tail -3
```

**6.2 Test Voice Quality at Intervals**
```bash
# Test Ken at epoch 100
python3 -m piper_train.export_onnx \
  ~/ken_processed_44k/lightning_logs/version_0/checkpoints/epoch=99-step=19200.ckpt \
  ~/ken_voice_epoch100.onnx

cp ~/ken_processed_44k/config.json ~/ken_voice_epoch100.onnx.json

echo "This is Ken at epoch 100 testing voice quality." | piper --model ~/ken_voice_epoch100.onnx --output_file ~/test_audio/ken_epoch100_test.wav
```

**Quality Expectations by Epoch (VoiceMaker audio):**
- **Epochs 1-50**: Mostly noise/unintelligible
- **Epochs 50-200**: Some speech sounds, still poor quality
- **Epochs 200-500**: Recognizable words, improving clarity
- **Epochs 500-1000**: Good quality, usable for production
- **Epochs 1000+**: Excellent quality, natural-sounding

### STEP 7: Resume Training from Checkpoints

**If training stops or you need to restart:**
```bash
# Find latest checkpoint
ls -la ~/ken_processed_44k/lightning_logs/version_*/checkpoints/ | tail -1

# Resume Ken from specific checkpoint
python3 -m piper_train \
  --dataset-dir ~/ken_processed_44k/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 1 \
  --validation-split 0.0 \
  --num-test-examples 0 \
  --max_epochs 2000 \
  --checkpoint-epochs 50 \
  --precision 16 \
  --quality medium \
  --resume_from_checkpoint ~/ken_processed_44k/lightning_logs/version_X/checkpoints/epoch=XXX-step=XXXXX.ckpt
```

---

## 🎭 PART 2: TALKING AVATAR CREATION

### STEP 8: Avatar Training Environment Setup

**8.1 Install Avatar Dependencies**
```bash
# Use same environment as PiperTTS
source /root/piper_training/piper/piper_venv/bin/activate

# Install avatar-specific packages
pip install face-alignment resampy librosa==0.8.1
pip install opencv-python-headless mediapipe
pip install basicsr gfpgan
pip install imageio-ffmpeg
```

**8.2 Clone SadTalker Repository**
```bash
cd /root
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker
pip install -r requirements.txt

# Download pre-trained models (3GB+ download)
bash scripts/download_models.sh
```

**8.3 Create Avatar Workspace**
```bash
mkdir -p /root/avatar_pipeline/{ken,kelly,test_output,batch_processing}
mkdir -p /root/avatar_pipeline/ken/{base_images,processed,animations}
mkdir -p /root/avatar_pipeline/kelly/{base_images,processed,animations}
```

### STEP 9: Prepare Avatar Assets

**9.1 Upload Avatar Images**
- Upload Ken's 12 base images to `/root/avatar_pipeline/ken/base_images/`
- Upload Kelly's 12 base images to `/root/avatar_pipeline/kelly/base_images/`
- **Naming convention**: `ken_pose_01.jpg`, `ken_pose_02.jpg`, etc.

**9.2 Image Quality Check**
```bash
cd /root/avatar_pipeline/ken/base_images
python3 -c "
import cv2
import os

print('🖼️ Checking Ken avatar image quality...')
for img_file in sorted(os.listdir('.')):
    if img_file.endswith(('.jpg', '.jpeg', '.png')):
        img = cv2.imread(img_file)
        if img is not None:
            h, w = img.shape[:2]
            print(f'{img_file}: {w}x{h} pixels')
            if w < 512 or h < 512:
                print(f'  ⚠️  Low resolution: recommend 512x512 minimum')
        else:
            print(f'{img_file}: ❌ Failed to load')
"
```

### STEP 10: Avatar Model Training

**10.1 Test Basic Avatar Generation**
```bash
cd /root/SadTalker

# Test with Ken's voice and first image
python inference.py \
  --driven_audio /root/test_audio/ken_epoch100_test.wav \
  --source_image /root/avatar_pipeline/ken/base_images/ken_pose_01.jpg \
  --result_dir /root/avatar_pipeline/test_output \
  --still \
  --preprocess crop \
  --size 512
```

**10.2 Batch Avatar Processing**
```bash
# Create batch processing script
cat > /root/avatar_pipeline/batch_process.py << 'EOF'
import os
import subprocess
import glob

def process_avatar_batch(character_name, audio_dir, image_dir, output_dir):
    """Process multiple audio files with avatar images"""
    
    audio_files = glob.glob(f"{audio_dir}/*.wav")
    image_files = glob.glob(f"{image_dir}/*.jpg") + glob.glob(f"{image_dir}/*.png")
    
    if not image_files:
        print(f"No images found in {image_dir}")
        return
        
    # Use first image as primary avatar
    primary_image = image_files[0]
    
    for audio_file in audio_files:
        audio_name = os.path.basename(audio_file).replace('.wav', '')
        output_path = f"{output_dir}/{character_name}_{audio_name}"
        
        cmd = [
            "python", "/root/SadTalker/inference.py",
            "--driven_audio", audio_file,
            "--source_image", primary_image,
            "--result_dir", output_path,
            "--still",
            "--preprocess", "crop",
            "--size", "512"
        ]
        
        print(f"Processing: {audio_name}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Success: {audio_name}")
        else:
            print(f"❌ Failed: {audio_name} - {result.stderr}")

if __name__ == "__main__":
    # Process Ken's avatars
    process_avatar_batch(
        "ken",
        "/root/test_audio",
        "/root/avatar_pipeline/ken/base_images",
        "/root/avatar_pipeline/ken/animations"
    )
    
    # Process Kelly's avatars
    process_avatar_batch(
        "kelly", 
        "/root/test_audio",
        "/root/avatar_pipeline/kelly/base_images",
        "/root/avatar_pipeline/kelly/animations"
    )
EOF

# Run batch processing
cd /root/avatar_pipeline
python batch_process.py
```

### STEP 11: Animation Data Optimization

**11.1 Convert to Web-Optimized Format**
```bash
# Create animation data extraction script
cat > /root/avatar_pipeline/extract_animation_data.py << 'EOF'
import cv2
import json
import numpy as np
import os
import glob

def extract_animation_data(video_path, output_path):
    """Extract keyframe data from avatar video for web playback"""
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Failed to open video: {video_path}")
        return
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps
    
    animation_data = {
        "fps": fps,
        "duration": duration,
        "frame_count": frame_count,
        "keyframes": []
    }
    
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Extract every 5th frame to reduce data size
        if frame_idx % 5 == 0:
            timestamp = frame_idx / fps
            
            # Convert frame to base64 for web display
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_data = buffer.tobytes()
            
            keyframe = {
                "timestamp": timestamp,
                "frame_index": frame_idx,
                "data_size": len(frame_data)
            }
            
            animation_data["keyframes"].append(keyframe)
            
            # Save frame as separate file
            frame_filename = f"{output_path}_frame_{frame_idx:04d}.jpg"
            cv2.imwrite(frame_filename, frame)
        
        frame_idx += 1
    
    cap.release()
    
    # Save animation metadata
    with open(f"{output_path}_animation.json", 'w') as f:
        json.dump(animation_data, f, indent=2)
    
    print(f"✅ Extracted {len(animation_data['keyframes'])} keyframes")
    return animation_data

# Process all generated videos
for video_file in glob.glob("/root/avatar_pipeline/*/animations/*/*.mp4"):
    output_base = video_file.replace('.mp4', '')
    extract_animation_data(video_file, output_base)
EOF

# Run animation data extraction
python /root/avatar_pipeline/extract_animation_data.py
```

---

## 🚀 PART 3: PRODUCTION DEPLOYMENT

### STEP 12: Export Final Models

**12.1 Export Production Voice Models**
```bash
# Export Ken's final voice (use highest epoch checkpoint)
python3 -m piper_train.export_onnx \
  ~/ken_processed_44k/lightning_logs/version_X/checkpoints/epoch=999-step=XXXXX.ckpt \
  ~/ken_production_voice.onnx

cp ~/ken_processed_44k/config.json ~/ken_production_voice.onnx.json

# Export Kelly's final voice
python3 -m piper_train.export_onnx \
  ~/kelly_processed_44k/lightning_logs/version_X/checkpoints/epoch=999-step=XXXXX.ckpt \
  ~/kelly_production_voice.onnx

cp ~/kelly_processed_44k/config.json ~/kelly_production_voice.onnx.json
```

**12.2 Test Production Models**
```bash
# Test Ken's production voice
echo "Hello, I'm Ken from MyNextLesson, ready to help you learn!" | \
  piper --model ~/ken_production_voice.onnx --output_file ~/ken_production_test.wav

# Test Kelly's production voice  
echo "Hi there, I'm Kelly from MyNextLesson, let's start today's lesson!" | \
  piper --model ~/kelly_production_voice.onnx --output_file ~/kelly_production_test.wav
```

### STEP 13: Create Production Package

**13.1 Package All Assets**
```bash
# Create production package
mkdir -p /root/mynextlesson_assets/{voices,avatars,samples}

# Copy voice models
cp ~/ken_production_voice.* /root/mynextlesson_assets/voices/
cp ~/kelly_production_voice.* /root/mynextlesson_assets/voices/

# Copy avatar assets
cp -r /root/avatar_pipeline/ken/base_images /root/mynextlesson_assets/avatars/ken_images
cp -r /root/avatar_pipeline/kelly/base_images /root/mynextlesson_assets/avatars/kelly_images

# Copy sample outputs
cp ~/ken_production_test.wav /root/mynextlesson_assets/samples/
cp ~/kelly_production_test.wav /root/mynextlesson_assets/samples/

# Create deployment readme
cat > /root/mynextlesson_assets/README.md << 'EOF'
# MyNextLesson Voice & Avatar Assets

## Voice Models
- `ken_production_voice.onnx` - Ken's custom voice model
- `ken_production_voice.onnx.json` - Ken's voice configuration  
- `kelly_production_voice.onnx` - Kelly's custom voice model
- `kelly_production_voice.onnx.json` - Kelly's voice configuration

## Usage
```python
import piper
voice = piper.PiperVoice.load("ken_production_voice.onnx")
audio = voice.synthesize("Hello from Ken!")
```

## Avatar Images
- `avatars/ken_images/` - Ken's base images for animation
- `avatars/kelly_images/` - Kelly's base images for animation

## Samples
- `samples/ken_production_test.wav` - Ken voice sample
- `samples/kelly_production_test.wav` - Kelly voice sample
EOF
```

**13.2 Download Assets**
```bash
# Create downloadable archive
cd /root
tar -czf mynextlesson_complete_assets.tar.gz mynextlesson_assets/

# File should be available for download via JupyterLab file browser
ls -la mynextlesson_complete_assets.tar.gz
```

---

## 🛠️ TROUBLESHOOTING GUIDE

### Common PiperTTS Issues

**Issue: "cuFFT error: CUFFT_INTERNAL_ERROR"**
```bash
# Solution: Use mixed precision training
--precision 16 --batch-size 1
```

**Issue: "Sample rate mismatch"**
```bash
# Check audio sample rate first
python3 -c "import librosa; audio, sr = librosa.load('file.wav', sr=None); print(f'Sample rate: {sr}Hz')"

# Use correct sample rate in preprocessing
--sample-rate 44100  # or 22050 based on your audio
```

**Issue: "Poor voice quality after training"**
```bash
# For VoiceMaker/AI audio, train much longer
--max_epochs 1000  # instead of default 200
```

**Issue: "Training keeps stopping"**
```bash
# Resume from latest checkpoint
--resume_from_checkpoint /path/to/latest/checkpoint.ckpt
```

### Common Avatar Issues

**Issue: "Face not detected in image"**
```bash
# Ensure good quality face images
# Face should be clearly visible, well-lit, front-facing
# Minimum 512x512 resolution recommended
```

**Issue: "Avatar animation looks unnatural"**
```bash
# Try different preprocessing options
--preprocess crop  # vs full vs resize
--size 512        # try 256 or 1024
```

**Issue: "Audio-video sync problems"**
```bash
# Ensure audio sample rate matches
# Use high-quality voice models (500+ epochs)
# Check frame rate consistency
```

---

## 📊 PERFORMANCE EXPECTATIONS

### Training Times (RTX 4090)
- **PiperTTS Voice Training**: 
  - 100 epochs: ~2-4 hours
  - 500 epochs: ~10-20 hours  
  - 1000 epochs: ~20-40 hours

- **Avatar Training**:
  - Basic setup: ~30 minutes
  - Per avatar generation: ~2-5 minutes
  - Batch processing 50 samples: ~2-4 hours

### Quality Milestones
- **Voice Quality**: Usable at 500+ epochs, excellent at 1000+
- **Avatar Quality**: Good with proper source images and audio
- **Sync Accuracy**: 95%+ with optimized pipeline

### Cost Estimates (RunPod RTX 4090)
- **Voice Training Complete**: $50-100
- **Avatar Training Complete**: $20-50
- **Total Project Cost**: $100-200

---

## 🎯 SUCCESS CHECKLIST

### PiperTTS Voices
- [ ] Ken voice trained to 500+ epochs
- [ ] Kelly voice trained to 500+ epochs  
- [ ] Both voices export successfully to ONNX
- [ ] Voice quality test: Clear, natural speech
- [ ] Production models saved and backed up

### Talking Avatars
- [ ] SadTalker environment set up correctly
- [ ] Ken avatar images processed (12 base images)
- [ ] Kelly avatar images processed (12 base images)
- [ ] Basic avatar generation working
- [ ] Batch processing pipeline operational
- [ ] Animation data optimized for web deployment

### Production Ready
- [ ] All models packaged for deployment
- [ ] Sample outputs generated and tested
- [ ] Documentation complete
- [ ] Assets downloadable from RunPod
- [ ] Integration plan documented

---

## 📞 NEXT STEPS

1. **Complete Voice Training**: Let models train to 1000+ epochs
2. **Test Voice Quality**: Regular quality checks every 100 epochs
3. **Avatar Integration**: Connect voices to avatar animation
4. **Web Integration**: Deploy to MyNextLesson platform
5. **Lesson Content**: Create educational content pipeline
6. **User Testing**: Gather feedback and iterate

---

**🎉 CONGRATULATIONS!**
You now have a complete pipeline for creating custom voices and talking avatars for educational content. This system will scale to support hundreds of lessons with consistent, high-quality Ken and Kelly characters.

**Remember**: VoiceMaker audio requires patience - 500+ epochs minimum for good quality. The investment in training time pays off with professional results!