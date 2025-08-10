#!/bin/bash
set -euo pipefail

# Usage on RunPod after SSH:
#   bash runpod/bootstrap.sh

ROOT="$HOME/image-training"
SRC_DIR="$ROOT"

mkdir -p "$ROOT"
cd "$ROOT"

echo "[+] Installing system packages"
sudo apt-get update -y && sudo apt-get install -y ffmpeg sox git-lfs jq

echo "[+] Python venv"
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip

echo "[+] Installing PyTorch CUDA (cu121 by default)"
pip install --index-url https://download.pytorch.org/whl/cu121 torch==2.2.2+cu121 torchvision==0.17.2+cu121 torchaudio==2.2.2+cu121 || true

echo "[+] Installing project requirements"
pip install -r "tts/requirements.txt"
pip install opencv-python-headless==4.10.0.84

echo "[+] Download SadTalker models"
pushd SadTalker >/dev/null
bash scripts/download_models.sh || true
popd >/dev/null

echo "[+] Build TTS manifest (primary dataset path must exist on this pod)"
python3 tools/tts_prepare_dataset.py --primary-root "$ROOT/tts_training 2" --out tts/manifests/primary.csv || true

echo "[+] Bootstrap complete"


