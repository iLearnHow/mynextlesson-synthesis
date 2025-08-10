#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/runpod/credentials.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

REQ_VARS=(RUNPOD_POD_IP RUNPOD_SSH_USER LOCAL_SSH_KEY RUNPOD_S3_ENDPOINT RUNPOD_VOLUME_NAME RUNPOD_DATACENTER)
for v in "${REQ_VARS[@]}"; do
  if [ -z "${!v:-}" ]; then echo "Missing $v in credentials.env" >&2; exit 1; fi
done

# Optional direct TCP SSH port; if not set, default 22
RUNPOD_SSH_PORT=${RUNPOD_SSH_PORT:-22}

echo "[+] Packaging project"
TMP_TAR="/tmp/image_training.tgz"
tar -czf "$TMP_TAR" -C "$(dirname "$ROOT_DIR")" "$(basename "$ROOT_DIR")"

echo "[+] Uploading to pod $RUNPOD_POD_IP:$RUNPOD_SSH_PORT"
scp -P "$RUNPOD_SSH_PORT" -i "$LOCAL_SSH_KEY" "$TMP_TAR" "$RUNPOD_SSH_USER@$RUNPOD_POD_IP:~/"

REMOTE_CMDS='\
  set -euo pipefail; \
  mkdir -p ~/workspace && cd ~/workspace; \
  rm -rf "image-training" && mkdir -p "image-training"; \
  tar -xzf ~/image_training.tgz -C ~/workspace; \
  cd "image training"; \
  bash runpod/bootstrap.sh; \
  nohup env COQUI_TTS_MODEL=tts_models/en/vits--ljspeech uvicorn tts.server:app --host 0.0.0.0 --port 8000 > ~/tts_server.log 2>&1 & \
  sleep 15; \
  source .venv/bin/activate; \
  python3 tools/tts_generate_local.py --server http://127.0.0.1:8000 --out-dir autorun/audio; \
  bash autorun/run_ken.sh; \
  echo "DONE"'

echo "[+] Bootstrapping remote and starting jobs"
ssh -p "$RUNPOD_SSH_PORT" -i "$LOCAL_SSH_KEY" "$RUNPOD_SSH_USER@$RUNPOD_POD_IP" "$REMOTE_CMDS"

echo "[+] Finished. Check logs on pod: ~/tts_server.log and ~/workspace/\"image training\"/autorun/renders"


