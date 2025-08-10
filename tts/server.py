import os
from fastapi import FastAPI
from pydantic import BaseModel
import soundfile as sf
import numpy as np
from tempfile import NamedTemporaryFile
from typing import Optional

try:
    from TTS.api import TTS
except Exception as e:
    TTS = None


class SynthesisRequest(BaseModel):
    text: str
    speaker_wav: Optional[str] = None  # optional reference for multi-speaker models
    language: Optional[str] = None


app = FastAPI()
_tts = None


def get_tts():
    global _tts
    if _tts is None:
        model_name = os.environ.get("COQUI_TTS_MODEL", "tts_models/en/vits--ljspeech")
        _tts = TTS(model_name)
    return _tts


@app.post("/tts")
def synth(req: SynthesisRequest):
    tts = get_tts()
    wav = tts.tts(text=req.text, speaker_wav=req.speaker_wav, language=req.language)
    wav = np.asarray(wav, dtype=np.float32)
    with NamedTemporaryFile(delete=False, suffix=".wav") as f:
        sf.write(f.name, wav, 22050)
        out = f.name
    return {"wav_path": out}


