# Training Ken & Kelly TTS Models

## Current Status
- ✅ Training data prepared (60 minutes total)
- ✅ Pre-recorded samples available for immediate use
- ⏳ Models need training on RunPod

## Option 1: Quick Local Training (Lower Quality)
```bash
# Install Coqui TTS locally
pip install TTS

# Train basic model
tts --model_name tts_models/en/ljspeech/tacotron2-DDC \
    --vocoder_name vocoder_models/en/ljspeech/hifigan_v2 \
    --out_path models/ken/quick_model.pth \
    --speaker_wav data/ken/segments/segment_001.wav
```

## Option 2: RunPod Training (Production Quality)
1. Create RunPod account
2. Launch XTTS v2 template
3. Upload training data
4. Run training script (see models/train_on_runpod.sh)

## Option 3: Use Pre-recorded Samples (Current)
The system currently uses pre-recorded MP3/OPUS files for known phrases.
This works for demos but isn't scalable.

## Next Steps
1. Decide on training approach
2. Train models (4-8 hours on GPU)
3. Deploy models to production
4. Switch from pre-recorded to dynamic generation
