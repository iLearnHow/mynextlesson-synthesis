#!/usr/bin/env bash
set -euo pipefail

# Ensure we run from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "[runpod] Project root: $PROJECT_ROOT"

# System deps (idempotent)
apt-get update -y && apt-get install -y ffmpeg sox git-lfs jq wget curl unzip || true

# Python venv and deps
python3 -m venv .venv || true
source .venv/bin/activate
python -m pip install --upgrade pip
pip uninstall -y numpy scipy || true
pip install numpy==1.22.0 scipy==1.11.4
pip install -r tts/requirements.txt --no-deps
pip install opencv-python-headless==4.10.0.84

# SadTalker models
bash SadTalker/scripts/download_models.sh || true

# Point training config to mounted dataset under /workspace
sed -i "s|/Users/nicolette/Downloads/my-next-lesson/tts_training 2|/workspace/tts_training 2|g" tts/train_config.yaml || true

# Prepare dataset manifest
python3 tools/tts_prepare_dataset.py --primary-root "/workspace/tts_training 2" --out tts/manifests/primary.csv

# Launch training
nohup bash -lc 'source .venv/bin/activate; python -m TTS.bin.train_tts --config_path tts/train_config.yaml --output_path tts/checkpoints' >/root/tts_train.log 2>&1 &
sleep 2
tail -n 200 /root/tts_train.log || true

echo "[runpod] Training launched. Logs: /root/tts_train.log"


