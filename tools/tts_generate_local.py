import os
import argparse
import requests


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--server", default="http://127.0.0.1:8000")
    p.add_argument("--out-dir", required=True)
    args = p.parse_args()

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
        r = requests.post(f"{args.server}/tts", json={"text": text})
        r.raise_for_status()
        wav_path = r.json()["wav_path"]
        dst = os.path.join(args.out_dir, f"{key}.wav")
        with open(wav_path, "rb") as src, open(dst, "wb") as out:
            out.write(src.read())
        print(dst)


if __name__ == "__main__":
    main()


