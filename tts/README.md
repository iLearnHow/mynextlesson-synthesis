Local TTS (Coqui) quickstart

1) Install deps (on GPU box preferred):
   ```bash
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r tts/requirements.txt
   ```

2) Run server:
   ```bash
   COQUI_TTS_MODEL=tts_models/en/vits--ljspeech uvicorn tts.server:app --host 0.0.0.0 --port 8000
   ```

3) Generate emotion audio locally:
   ```bash
   python3 tools/tts_generate_local.py --out-dir autorun/audio
   ```

Training: Prepare ~30–60 min of clean Ken voice, then use Coqui TTS trainer for fine-tuning. Wire the model id via COQUI_TTS_MODEL.


