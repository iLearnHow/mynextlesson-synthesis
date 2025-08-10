import os
import argparse
from typing import List
import requests


def tts_elevenlabs(api_key: str, voice_id: str, text: str, out_wav: str, model_id: str = "eleven_flash_v2_5") -> None:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key,
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True},
        "output_format": "mp3_44100_128",
    }
    with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as r:
        r.raise_for_status()
        data = r.content
    mp3_path = out_wav[:-4] + ".mp3"
    os.makedirs(os.path.dirname(out_wav), exist_ok=True)
    with open(mp3_path, "wb") as f:
        f.write(data)
    # Convert to wav if ffmpeg exists
    try:
        import subprocess
        subprocess.run(["ffmpeg", "-y", "-i", mp3_path, "-ar", "44100", "-ac", "1", out_wav], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception:
        pass


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice-id", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    api_key = (
        os.environ.get("ELEVENLABS_API_KEY", "").strip()
        or os.environ.get("ELEVENLABS_API_KEY_FALLBACK", "").strip()
    )
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY env var not set")

    lines = [
        ("neutral", "Hello, I’m Ken. Let’s begin."),
        ("happy", "I’m excited to share this with you today!"),
        ("sad", "I’m sorry this part is a little disappointing."),
        ("anger", "This really shouldn’t have happened."),
        ("fear", "I’m concerned about the risks here."),
        ("surprise", "Wow, that outcome was unexpected!"),
        ("disgust", "I really don’t like how that turned out."),
        ("contempt", "We can do much better than that."),
        ("confusion", "I’m not sure that makes sense yet."),
        ("interest", "That’s fascinating—let’s dig deeper."),
    ]

    os.makedirs(args.out_dir, exist_ok=True)
    for key, text in lines:
        out_wav = os.path.join(args.out_dir, f"{key}.wav")
        tts_elevenlabs(api_key, args.voice_id, text, out_wav)
        print(out_wav)


if __name__ == "__main__":
    main()


