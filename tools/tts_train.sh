#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 tools/tts_prepare_dataset.py --primary-root "/Users/nicolette/Downloads/my-next-lesson/tts_training 2" --out tts/manifests/primary.csv

# Example trainer call; adjust to your trainer CLI if needed
echo "Starting training (placeholder command; replace with actual TTS trainer as needed)"
echo "Config: tts/train_config.yaml"
echo "Checkpoints: tts/checkpoints"


