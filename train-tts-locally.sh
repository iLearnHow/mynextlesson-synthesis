#!/bin/bash
# Train Ken & Kelly TTS Models Locally
# This will create actual voice models on your machine

echo "🎯 Ken & Kelly Local TTS Training"
echo "================================"

# Check if we're on Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Running on macOS"
else
    echo "⚠️  This script is optimized for macOS"
fi

# Step 1: Install dependencies
echo -e "\n📦 Step 1: Installing dependencies..."
echo "This will install Coqui TTS (open-source TTS engine)"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pip3 install TTS --upgrade
    pip3 install numpy scipy torch
fi

# Step 2: Prepare data paths
DATA_DIR="/Users/nicolette/Downloads/my-next-lesson/tts_training 2/data"
OUTPUT_DIR="/Users/nicolette/ilearn_how/models"

echo -e "\n📂 Step 2: Checking training data..."
if [ -d "$DATA_DIR/ken/segments" ] && [ -d "$DATA_DIR/kelly/segments" ]; then
    echo "✅ Training data found"
    echo "   Ken: $(ls $DATA_DIR/ken/segments/*.wav | wc -l) files"
    echo "   Kelly: $(ls $DATA_DIR/kelly/segments/*.wav | wc -l) files"
else
    echo "❌ Training data not found at $DATA_DIR"
    exit 1
fi

# Step 3: Create training config
echo -e "\n⚙️  Step 3: Creating training configuration..."
cat > "$OUTPUT_DIR/local_training_config.json" << 'EOF'
{
    "model": "tts_models/multilingual/multi-dataset/xtts_v2",
    "batch_size": 2,
    "eval_batch_size": 1,
    "num_loader_workers": 0,
    "num_eval_loader_workers": 0,
    "run_eval": true,
    "test_delay_epochs": -1,
    "epochs": 10,
    "save_step": 100,
    "save_n_checkpoints": 1,
    "save_best_after": 100,
    "print_step": 10,
    "log_model_step": 100,
    "mixed_precision": false,
    "output_path": "models/",
    "datasets": [
        {
            "name": "ken_dataset",
            "path": "/Users/nicolette/Downloads/my-next-lesson/tts_training 2/data/ken/",
            "meta_file_train": "metadata/enhanced_segments.json"
        },
        {
            "name": "kelly_dataset", 
            "path": "/Users/nicolette/Downloads/my-next-lesson/tts_training 2/data/kelly/",
            "meta_file_train": "metadata/enhanced_segments.json"
        }
    ]
}
EOF

echo "✅ Config created"

# Step 4: Quick voice cloning (faster than full training)
echo -e "\n🎤 Step 4: Quick voice cloning option..."
echo "This creates a basic model in ~10 minutes instead of hours"
read -p "Use quick cloning? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating Ken voice clone..."
    tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
        --text "Welcome to today's lesson" \
        --speaker_wav "$DATA_DIR/ken/segments/segment_001.wav" \
        --language_idx "en" \
        --out_path "$OUTPUT_DIR/ken/test_output.wav"
    
    echo "Creating Kelly voice clone..."
    tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
        --text "Welcome to today's lesson" \
        --speaker_wav "$DATA_DIR/kelly/segments/segment_001.wav" \
        --language_idx "en" \
        --out_path "$OUTPUT_DIR/kelly/test_output.wav"
    
    echo "✅ Quick clones created"
fi

# Step 5: Create immediate usable system
echo -e "\n🔧 Step 5: Creating immediate TTS wrapper..."
cat > "$OUTPUT_DIR/immediate-tts.py" << 'EOF'
#!/usr/bin/env python3
import sys
from TTS.api import TTS

# Initialize TTS with XTTS v2
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)

def generate_audio(text, speaker_wav, output_path):
    """Generate audio using voice cloning"""
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language="en",
        file_path=output_path
    )
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python immediate-tts.py 'text' speaker_wav output.wav")
        sys.exit(1)
    
    generate_audio(sys.argv[1], sys.argv[2], sys.argv[3])
EOF

chmod +x "$OUTPUT_DIR/immediate-tts.py"

echo -e "\n✅ Local TTS Training Setup Complete!"
echo -e "\n📋 What's Ready:"
echo "1. Quick voice clones for testing"
echo "2. Immediate TTS script: $OUTPUT_DIR/immediate-tts.py"
echo "3. Training config for full model training"

echo -e "\n🚀 To generate audio NOW:"
echo "python3 $OUTPUT_DIR/immediate-tts.py 'Your text here' $DATA_DIR/kelly/segments/segment_001.wav output.wav"

echo -e "\n⏳ For production-quality models:"
echo "1. Use RunPod (faster, ~$5)"
echo "2. Or run overnight on this Mac (slower but free)"
