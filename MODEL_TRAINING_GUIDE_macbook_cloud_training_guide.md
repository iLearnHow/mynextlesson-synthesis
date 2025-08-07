# MacBook Pro + Cloud Compute: Complete MyNextLesson Training Guide

## 🎯 OVERVIEW

This guide shows you how to train Ken and Kelly voices to 2000 epochs plus create animated avatars using your MacBook Pro + RunPod cloud compute. **Total estimated cost: $150-250** for complete pipeline.

**What You'll Accomplish:**
- Train 2 high-quality PiperTTS voices (2000 epochs each)
- Create animated talking avatars with SadTalker
- Sync TTS with animation data
- All using your existing MacBook Pro + cloud GPU

---

## 💰 COST BREAKDOWN

### RunPod Pricing (RTX 4090)
- **Hourly Rate**: ~$0.79/hour (secure cloud)
- **Voice Training**: 2000 epochs × 2 voices = ~60-80 hours = **$50-65**
- **Avatar Training**: Setup + batch processing = ~10-15 hours = **$8-12**
- **Testing & Optimization**: ~15-20 hours = **$12-16**
- **Storage**: 100GB = ~$10/month
- **Total Estimated Cost**: **$150-250** (one-time)

### Alternative: Vast.ai (Cheaper Option)
- **Hourly Rate**: ~$0.35-0.50/hour for RTX 3080/4080
- **Total Cost**: **$80-150** (saves ~40-50%)
- **Trade-off**: Slightly less reliable, may need to restart occasionally

---

## 🚀 PART 1: MACBOOK SETUP & PREPARATION

### STEP 1: Prepare Your Assets on MacBook

**1.1 Create Local Project Structure**
```bash
# Open Terminal on your MacBook
mkdir -p ~/MyNextLesson/{ken,kelly,assets,outputs}
mkdir -p ~/MyNextLesson/ken/{audio,transcripts}
mkdir -p ~/MyNextLesson/kelly/{audio,transcripts}
mkdir -p ~/MyNextLesson/assets/{ken_avatars,kelly_avatars}
```

**1.2 Organize Your Training Data**
- Move Ken's 192 audio files to `~/MyNextLesson/ken/audio/`
- Move Ken's 192 transcripts to `~/MyNextLesson/ken/transcripts/`
- Move Kelly's files to corresponding Kelly folders
- Move avatar images to `~/MyNextLesson/assets/ken_avatars/` and `kelly_avatars/`

**1.3 Validate File Structure**
```bash
# Check file counts
ls ~/MyNextLesson/ken/audio/ | wc -l    # Should show 192
ls ~/MyNextLesson/ken/transcripts/ | wc -l # Should show 192
ls ~/MyNextLesson/kelly/audio/ | wc -l  # Should show 192
ls ~/MyNextLesson/assets/ken_avatars/ | wc -l # Should show 12
```

**1.4 Install Local Upload Tools**
```bash
# Install useful tools for file management
brew install rsync
brew install zip unzip
```

---

## 🌥️ PART 2: RUNPOD SETUP (CLICK-BY-CLICK)

### STEP 2: Launch Your RunPod Instance

**2.1 Access RunPod Dashboard**
1. Go to [console.runpod.io](https://console.runpod.io)
2. Click **"Pods"** in left sidebar
3. Click **"+ GPU Pod"** button

**2.2 Select GPU Configuration**
1. **GPU Type**: Select **"RTX 4090"** (24GB VRAM)
   - If not available, choose **"RTX 3090"** (24GB VRAM)
   - Alternative: **"RTX 3080"** (10GB VRAM, cheaper but slower)

2. **Template**: Choose **"PyTorch 2.0"** or **"RunPod PyTorch"**

3. **Storage**: 
   - **Container Disk**: 50GB minimum
   - **Volume Storage**: 100GB (for models and data)

4. **Configuration**:
   - **Ports**: Keep default (JupyterLab, SSH)
   - **Environment**: Keep default

5. Click **"Continue"** → **"Deploy"**

**2.3 Wait for Pod Activation**
- Status will change from "Pending" → "Running"
- Usually takes 1-3 minutes
- **Important**: Your hourly billing starts when status = "Running"

### STEP 3: Connect to Your Pod

**3.1 Access JupyterLab**
1. In RunPod dashboard, find your running pod
2. Click **"Connect"** button
3. Select **"Connect to JupyterLab"**
4. New browser tab opens with JupyterLab interface

**3.2 Open Terminal in JupyterLab**
1. In JupyterLab, click **"+"** (new launcher)
2. Under "Other", click **"Terminal"**
3. Terminal window opens in browser

---

## 🔧 PART 3: ENVIRONMENT SETUP ON RUNPOD

### STEP 4: Install PiperTTS Training Environment

**4.1 Clone and Setup PiperTTS**
```bash
# In RunPod terminal
cd /workspace
git clone https://github.com/rhasspy/piper.git piper_training
cd piper_training

# Create virtual environment
python3 -m venv piper_venv
source piper_venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -e .
pip install librosa soundfile
pip install lightning
```

**4.2 Verify GPU Access**
```bash
# Test GPU availability
python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU count: {torch.cuda.device_count()}'); print(f'GPU name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"No GPU\"}')"
```
Expected output: `CUDA available: True`, `GPU count: 1`, `GPU name: RTX 4090`

### STEP 5: Upload Your Training Data from MacBook

**5.1 Using JupyterLab File Manager**
1. In JupyterLab, use file browser (left panel)
2. Navigate to `/workspace/`
3. Create folders: `ken_data`, `kelly_data`, `avatar_images`
4. **Upload Ken's audio files**:
   - Right-click in `ken_data` → "Upload Files"
   - Select all 192 Ken audio files from your MacBook
   - Wait for upload completion
5. **Upload Ken's transcripts**: Repeat for transcript files
6. **Repeat for Kelly's data**
7. **Upload avatar images** to `avatar_images` folder

**5.2 Alternative: Using Terminal Upload (Faster for Large Files)**
```bash
# From your MacBook terminal (new window)
# Install rsync if not already installed
brew install rsync

# Get your pod's SSH connection details from RunPod dashboard
# Replace [POD_ID] and [SSH_KEY] with your actual values
rsync -avz -e "ssh -i ~/.ssh/id_rsa -p [PORT]" ~/MyNextLesson/ken/audio/ root@[POD_ID].ssh.runpod.io:/workspace/ken_data/audio/
rsync -avz -e "ssh -i ~/.ssh/id_rsa -p [PORT]" ~/MyNextLesson/ken/transcripts/ root@[POD_ID].ssh.runpod.io:/workspace/ken_data/transcripts/
```

**5.3 Verify Upload Success**
```bash
# In RunPod terminal
ls -la /workspace/ken_data/audio/ | wc -l     # Should show 192+ (including . and ..)
ls -la /workspace/ken_data/transcripts/ | wc -l # Should show 192+
ls -la /workspace/kelly_data/audio/ | wc -l   # Should show 192+
```

---

## 🎭 PART 4: VOICE TRAINING (KEN & KELLY)

### STEP 6: Prepare Training Data for PiperTTS

**6.1 Convert to LJSpeech Format (Ken)**
```bash
# In RunPod terminal
source /workspace/piper_training/piper_venv/bin/activate
cd /workspace

# Create LJSpeech structure for Ken
mkdir -p ken_ljspeech/wavs
cp ken_data/audio/*.wav ken_ljspeech/wavs/

# Create metadata.csv for Ken
cd ken_ljspeech
ls wavs/ | while read wav; do
  base=$(basename "$wav" .wav)
  txt_file="/workspace/ken_data/transcripts/${base}.txt"
  if [ -f "$txt_file" ]; then
    text=$(cat "$txt_file" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')
    echo "${base}|${text}"
  fi
done > metadata.csv

# Verify Ken's setup
head -5 metadata.csv
wc -l metadata.csv  # Should show 192 lines
```

**6.2 Convert Kelly's Data**
```bash
# Create LJSpeech structure for Kelly
mkdir -p /workspace/kelly_ljspeech/wavs
cp /workspace/kelly_data/audio/*.wav /workspace/kelly_ljspeech/wavs/

# Create metadata.csv for Kelly
cd /workspace/kelly_ljspeech
ls wavs/ | while read wav; do
  base=$(basename "$wav" .wav)
  txt_file="/workspace/kelly_data/transcripts/${base}.txt"
  if [ -f "$txt_file" ]; then
    text=$(cat "$txt_file" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')
    echo "${base}|${text}"
  fi
done > metadata.csv

# Verify Kelly's setup
head -5 metadata.csv
wc -l metadata.csv  # Should show 192 lines
```

### STEP 7: Audio Quality Analysis & Preprocessing

**7.1 Analyze Audio Quality**
```bash
source /workspace/piper_training/piper_venv/bin/activate

# Check Ken's audio properties
cd /workspace/ken_ljspeech/wavs
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
"
```

**7.2 Preprocess Training Data**
```bash
# Process Ken's data
cd /workspace/piper_training
source piper_venv/bin/activate

python3 -m piper_train.preprocess \
  --language en \
  --input-dir /workspace/ken_ljspeech \
  --output-dir /workspace/ken_processed \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 44100

# Process Kelly's data
python3 -m piper_train.preprocess \
  --language en \
  --input-dir /workspace/kelly_ljspeech \
  --output-dir /workspace/kelly_processed \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 44100
```

### STEP 8: Start Voice Training (2000 Epochs)

**8.1 Launch Ken's Training**
```bash
# Open new terminal tab in JupyterLab
cd /workspace/piper_training
source piper_venv/bin/activate

# Start Ken's training (this will run for ~30-40 hours)
python3 -m piper_train \
  --dataset-dir /workspace/ken_processed/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 2 \
  --validation-split 0.0 \
  --num-test-examples 0 \
  --max_epochs 2000 \
  --checkpoint-epochs 100 \
  --precision 16 \
  --quality medium \
  > ken_training.log 2>&1 &
```

**8.2 Monitor Training Progress**
```bash
# Check training status
tail -f ken_training.log

# Check GPU usage
nvidia-smi

# Check saved checkpoints
ls -la /workspace/ken_processed/lightning_logs/version_*/checkpoints/ | tail -5
```

**8.3 Test Voice Quality at Intervals**
```bash
# Test Ken at epoch 500
python3 -m piper_train.export_onnx \
  /workspace/ken_processed/lightning_logs/version_0/checkpoints/epoch=499-step=*.ckpt \
  /workspace/ken_voice_epoch500.onnx

cp /workspace/ken_processed/config.json /workspace/ken_voice_epoch500.onnx.json

# Test the voice
echo "This is Ken at epoch 500 testing voice quality for MyNextLesson platform." | \
  piper --model /workspace/ken_voice_epoch500.onnx --output_file /workspace/ken_test_epoch500.wav
```

### STEP 9: Launch Kelly's Training (Parallel)

**9.1 Start Kelly's Training**
```bash
# Open another new terminal tab
cd /workspace/piper_training
source piper_venv/bin/activate

# Start Kelly's training (parallel to Ken's)
python3 -m piper_train \
  --dataset-dir /workspace/kelly_processed/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 2 \
  --validation-split 0.0 \
  --num-test-examples 0 \
  --max_epochs 2000 \
  --checkpoint-epochs 100 \
  --precision 16 \
  --quality medium \
  > kelly_training.log 2>&1 &
```

**Note**: You can run both trainings simultaneously if you have enough VRAM, or run them sequentially.

### STEP 10: Training Management & Cost Optimization

**10.1 Monitor Your Costs**
- Check RunPod billing dashboard regularly
- Expected cost: ~$0.79/hour × 60-80 hours = $47-63
- **Set up spend alerts** in RunPod billing settings

**10.2 Training Time Expectations**
- **Epochs 1-200**: Mostly unintelligible (first 8-12 hours)
- **Epochs 200-500**: Words become recognizable (next 12-15 hours)
- **Epochs 500-1000**: Good quality, usable (next 15-20 hours)
- **Epochs 1000-2000**: Excellent quality (final 15-25 hours)

**10.3 Save Checkpoints to Prevent Loss**
```bash
# Download important checkpoints to your MacBook
# Every 500 epochs, download checkpoint files
# Use JupyterLab file browser: Right-click → Download
```

---

## 🎭 PART 5: AVATAR TRAINING & ANIMATION

### STEP 11: Install SadTalker Environment

**11.1 Clone SadTalker**
```bash
cd /workspace
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker

# Install dependencies
pip install -r requirements.txt
pip install face-alignment resampy librosa==0.8.1
pip install opencv-python-headless mediapipe
pip install basicsr gfpgan
pip install imageio-ffmpeg

# Download pre-trained models (3GB+ download)
bash scripts/download_models.sh
```

### STEP 12: Prepare Avatar Images

**12.1 Upload Avatar Images**
- Use JupyterLab file browser
- Upload Ken's 12 avatar images to `/workspace/avatar_images/ken/`
- Upload Kelly's 12 avatar images to `/workspace/avatar_images/kelly/`

**12.2 Validate Image Quality**
```bash
cd /workspace/avatar_images/ken/
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
"
```

### STEP 13: Create Talking Avatars

**13.1 Test Basic Avatar Generation**
```bash
cd /workspace/SadTalker

# Test with Ken's voice and first image
python inference.py \
  --driven_audio /workspace/ken_test_epoch500.wav \
  --source_image /workspace/avatar_images/ken/ken_pose_01.jpg \
  --result_dir /workspace/test_output \
  --still \
  --preprocess crop \
  --size 512
```

**13.2 Create Batch Processing Script**
```bash
# Create automated batch processing
cat > /workspace/batch_avatar_processing.py << 'EOF'
import os
import subprocess
import glob

def process_avatar_batch(character_name, audio_dir, image_dir, output_dir):
    """Process multiple audio files with avatar images"""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
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
            "python", "/workspace/SadTalker/inference.py",
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
        "/workspace/",  # Directory with ken test audio
        "/workspace/avatar_images/ken/",
        "/workspace/animations/ken/"
    )
    
    # Process Kelly's avatars
    process_avatar_batch(
        "kelly",
        "/workspace/",  # Directory with kelly test audio
        "/workspace/avatar_images/kelly/",
        "/workspace/animations/kelly/"
    )
EOF

# Run batch processing
python /workspace/batch_avatar_processing.py
```

---

## 📦 PART 6: EXPORT & DOWNLOAD FINAL MODELS

### STEP 14: Export Production Models

**14.1 Export Final Voice Models**
```bash
cd /workspace/piper_training
source piper_venv/bin/activate

# Export Ken's final voice (epoch 2000)
python3 -m piper_train.export_onnx \
  /workspace/ken_processed/lightning_logs/version_*/checkpoints/epoch=1999-step=*.ckpt \
  /workspace/ken_production_voice.onnx

cp /workspace/ken_processed/config.json /workspace/ken_production_voice.onnx.json

# Export Kelly's final voice
python3 -m piper_train.export_onnx \
  /workspace/kelly_processed/lightning_logs/version_*/checkpoints/epoch=1999-step=*.ckpt \
  /workspace/kelly_production_voice.onnx

cp /workspace/kelly_processed/config.json /workspace/kelly_production_voice.onnx.json
```

**14.2 Test Production Models**
```bash
# Test Ken's final voice
echo "Hello, I'm Ken from MyNextLesson, ready to help you learn amazing new skills!" | \
  piper --model /workspace/ken_production_voice.onnx --output_file /workspace/ken_final_test.wav

# Test Kelly's final voice
echo "Hi there, I'm Kelly from MyNextLesson, let's start today's exciting lesson!" | \
  piper --model /workspace/kelly_production_voice.onnx --output_file /workspace/kelly_final_test.wav
```

### STEP 15: Package Everything for Download

**15.1 Create Production Package**
```bash
# Create final package
mkdir -p /workspace/mynextlesson_final/{voices,avatars,samples,animations}

# Copy voice models
cp /workspace/ken_production_voice.* /workspace/mynextlesson_final/voices/
cp /workspace/kelly_production_voice.* /workspace/mynextlesson_final/voices/

# Copy avatar assets
cp -r /workspace/avatar_images/ken /workspace/mynextlesson_final/avatars/
cp -r /workspace/avatar_images/kelly /workspace/mynextlesson_final/avatars/

# Copy sample outputs
cp /workspace/ken_final_test.wav /workspace/mynextlesson_final/samples/
cp /workspace/kelly_final_test.wav /workspace/mynextlesson_final/samples/

# Copy animations
cp -r /workspace/animations/* /workspace/mynextlesson_final/animations/

# Create archive
cd /workspace
tar -czf mynextlesson_complete_package.tar.gz mynextlesson_final/
```

**15.2 Download to Your MacBook**
1. In JupyterLab file browser, navigate to `/workspace/`
2. Right-click on `mynextlesson_complete_package.tar.gz`
3. Click **"Download"**
4. File downloads to your MacBook's Downloads folder

---

## 🛠️ TROUBLESHOOTING & OPTIMIZATION

### Common Issues & Solutions

**Issue: "CUDA out of memory"**
```bash
# Solution: Reduce batch size
--batch-size 1
# Or use CPU training (much slower)
--accelerator cpu
```

**Issue: "Training stopped unexpectedly"**
```bash
# Resume from latest checkpoint
python3 -m piper_train \
  --resume_from_checkpoint /workspace/ken_processed/lightning_logs/version_*/checkpoints/epoch=XXX-step=*.ckpt \
  [other parameters...]
```

**Issue: "Poor voice quality after 2000 epochs"**
- VoiceMaker/AI audio may need 3000+ epochs
- Check audio quality (sample rate, noise levels)
- Verify transcript accuracy

### Cost Management Tips

1. **Monitor training progress**: Check every 4-6 hours
2. **Use cheaper instances**: Vast.ai or lower-tier RunPod GPUs
3. **Train sequentially**: One voice at a time to use smaller instances
4. **Download checkpoints regularly**: Prevent loss and enable resuming

---

## 📊 FINAL TIMELINE & COSTS

### Expected Timeline
- **Setup & Data Upload**: 2-4 hours
- **Ken Voice Training**: 30-40 hours (2000 epochs)
- **Kelly Voice Training**: 30-40 hours (2000 epochs)
- **Avatar Processing**: 4-8 hours
- **Testing & Export**: 2-4 hours
- **Total**: 68-96 hours

### Cost Breakdown
- **RunPod RTX 4090**: $0.79/hr × 80 hours = **$63**
- **Storage**: $10/month
- **Total**: **~$75-100** for complete project

### Alternative Cost Savings
- **Vast.ai**: ~$40-60 total (50% savings)
- **Sequential training**: Use smaller instances, train one voice at a time
- **Lower epochs**: 1500 epochs still produces excellent results

---

## 🎉 SUCCESS CHECKLIST

### Voice Training Complete
- [ ] Ken voice trained to 2000 epochs
- [ ] Kelly voice trained to 2000 epochs
- [ ] Both voices exported to ONNX format
- [ ] Voice quality tests passed
- [ ] Production models downloaded

### Avatar System Complete
- [ ] SadTalker environment working
- [ ] Avatar images processed (12 per character)
- [ ] Basic avatar generation working
- [ ] Batch processing pipeline operational
- [ ] Animation data synced with TTS

### Production Ready
- [ ] All models packaged and downloaded
- [ ] Sample outputs generated and tested
- [ ] Ready for MyNextLesson platform integration

**🎉 CONGRATULATIONS!**
You now have professional-quality custom voices and talking avatars for Ken and Kelly, all created using your MacBook Pro + cloud compute for under $100-150!

Your MyNextLesson platform is ready to deliver engaging, personalized educational content with consistent, high-quality AI characters.