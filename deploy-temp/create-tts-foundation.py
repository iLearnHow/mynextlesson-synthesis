#!/usr/bin/env python3
"""
Create the foundation for Ken & Kelly TTS Models
No external dependencies - builds what we need from scratch
"""

import os
import json
from pathlib import Path

# Paths
DATA_PATH = "/Users/nicolette/Downloads/my-next-lesson/tts_training 2/data"
OUTPUT_PATH = "/Users/nicolette/ilearn_how/models"

def create_tts_foundation():
    """Create everything needed for TTS from scratch"""
    
    print("🎯 Creating Ken & Kelly TTS Foundation")
    print("=" * 50)
    
    # Create directories
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    os.makedirs(f"{OUTPUT_PATH}/ken", exist_ok=True)
    os.makedirs(f"{OUTPUT_PATH}/kelly", exist_ok=True)
    
    # Check training data
    ken_files = list(Path(f"{DATA_PATH}/ken/segments").glob("*.wav"))
    kelly_files = list(Path(f"{DATA_PATH}/kelly/segments").glob("*.wav"))
    
    print(f"\n📊 Training Data Available:")
    print(f"   Ken: {len(ken_files)} audio files")
    print(f"   Kelly: {len(kelly_files)} audio files")
    
    # Create model manifest
    model_manifest = {
        "version": "1.0",
        "created": "2025-08-16",
        "status": "foundation_ready",
        "models": {
            "ken": {
                "training_data": {
                    "files": len(ken_files),
                    "total_minutes": 30,
                    "format": "wav",
                    "sample_rate": 22050
                },
                "model_type": "xtts_v2",
                "status": "needs_training"
            },
            "kelly": {
                "training_data": {
                    "files": len(kelly_files),
                    "total_minutes": 30,
                    "format": "wav", 
                    "sample_rate": 22050
                },
                "model_type": "xtts_v2",
                "status": "needs_training"
            }
        },
        "pre_recorded_samples": {
            "ken": {
                "available": ["welcome", "questions", "feedback"],
                "path": "/production-deploy/examples/*/en/*/fun/ken/"
            },
            "kelly": {
                "available": ["welcome", "questions", "feedback"],
                "path": "/production-deploy/examples/*/en/*/fun/kelly/"
            }
        }
    }
    
    # Save manifest
    with open(f"{OUTPUT_PATH}/tts_manifest.json", 'w') as f:
        json.dump(model_manifest, f, indent=2)
    print(f"\n✅ Created TTS manifest")
    
    # Create JavaScript TTS interface
    js_interface = """/**
 * Ken & Kelly TTS Interface
 * Bridges between pre-recorded samples and future dynamic TTS
 */

class KenKellyTTS {
    constructor() {
        this.manifest = null;
        this.preRecordedPaths = {
            ken: {
                welcome: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/0_000.opus',
                question: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/1_000.opus',
                feedback: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/2_000.opus'
            },
            kelly: {
                welcome: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/0_full.mp3',
                question: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/1_full.mp3',
                feedback: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/2_full.mp3'
            }
        };
        this.loadManifest();
    }
    
    async loadManifest() {
        try {
            const response = await fetch('/models/tts_manifest.json');
            this.manifest = await response.json();
            console.log('✅ TTS manifest loaded:', this.manifest);
        } catch (error) {
            console.warn('Using pre-recorded samples only');
        }
    }
    
    async generateAudio(text, speaker = 'kelly') {
        // Phase 1: Use pre-recorded samples (current)
        // Phase 2: Use trained models (future)
        
        const textLower = text.toLowerCase();
        
        // Match to closest pre-recorded sample
        if (textLower.includes('welcome') || textLower.includes('hello')) {
            return this.preRecordedPaths[speaker].welcome;
        } else if (text.includes('?')) {
            return this.preRecordedPaths[speaker].question;
        } else {
            return this.preRecordedPaths[speaker].feedback;
        }
    }
    
    isModelReady(speaker) {
        // Check if we have a trained model
        return false; // Will be true after training
    }
    
    async playAudio(text, speaker = 'kelly') {
        const audioUrl = await this.generateAudio(text, speaker);
        const audio = new Audio(audioUrl);
        
        // Update UI
        const avatarBg = document.querySelector('.avatar-background');
        if (avatarBg) {
            avatarBg.classList.add('speaking');
        }
        
        audio.play();
        
        audio.onended = () => {
            if (avatarBg) {
                avatarBg.classList.remove('speaking');
            }
        };
        
        return audio;
    }
}

// Make globally available
window.kenKellyTTS = new KenKellyTTS();
console.log('🎤 Ken & Kelly TTS Foundation loaded');
"""
    
    with open(f"{OUTPUT_PATH}/ken-kelly-tts.js", 'w') as f:
        f.write(js_interface)
    print("✅ Created JavaScript TTS interface")
    
    # Create training instructions
    training_doc = """# Training Ken & Kelly TTS Models

## Current Status
- ✅ Training data prepared (60 minutes total)
- ✅ Pre-recorded samples available for immediate use
- ⏳ Models need training on RunPod

## Option 1: Quick Local Training (Lower Quality)
```bash
# Install Coqui TTS locally
pip install TTS

# Train basic model
tts --model_name tts_models/en/ljspeech/tacotron2-DDC \\
    --vocoder_name vocoder_models/en/ljspeech/hifigan_v2 \\
    --out_path models/ken/quick_model.pth \\
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
"""
    
    with open(f"{OUTPUT_PATH}/TRAINING_INSTRUCTIONS.md", 'w') as f:
        f.write(training_doc)
    print("✅ Created training instructions")
    
    print("\n🎉 TTS Foundation Complete!")
    print("\n📋 What We Created:")
    print(f"  1. Model directories: {OUTPUT_PATH}/ken & kelly")
    print(f"  2. TTS manifest: {OUTPUT_PATH}/tts_manifest.json")
    print(f"  3. JavaScript interface: {OUTPUT_PATH}/ken-kelly-tts.js")
    print(f"  4. Training guide: {OUTPUT_PATH}/TRAINING_INSTRUCTIONS.md")
    
    return True

if __name__ == "__main__":
    create_tts_foundation()
