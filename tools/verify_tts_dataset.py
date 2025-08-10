import os
import json
import soundfile as sf


PRIMARY_ROOT = "/Users/nicolette/Downloads/my-next-lesson/tts_training 2"
SECONDARY_ROOT = "/Users/nicolette/Desktop/a-z/data"


def count_wavs(path: str) -> int:
    return len([f for f in os.listdir(path) if f.lower().endswith('.wav')])


def first_wav(path: str) -> str:
    for f in sorted(os.listdir(path)):
        if f.lower().endswith('.wav'):
            return os.path.join(path, f)
    raise FileNotFoundError("No wav found in " + path)


def check_sr(path: str) -> int:
    wav = first_wav(path)
    info = sf.info(wav)
    return info.samplerate


def check_json(path: str) -> None:
    with open(path, 'r') as f:
        json.load(f)


def main() -> None:
    report = []
    # Primary
    ken_seg = os.path.join(PRIMARY_ROOT, "data/ken/segments")
    kelly_seg = os.path.join(PRIMARY_ROOT, "data/kelly/segments")
    ken_meta = os.path.join(PRIMARY_ROOT, "data/ken/metadata/enhanced_segments.json")
    kelly_meta = os.path.join(PRIMARY_ROOT, "data/kelly/metadata/enhanced_segments.json")

    items = [
        ("primary_ken_segments", ken_seg, 25),
        ("primary_kelly_segments", kelly_seg, 24),
    ]
    for name, seg_path, expected in items:
        cnt = count_wavs(seg_path)
        sr = check_sr(seg_path)
        report.append((name, seg_path, cnt, expected, sr))

    # Secondary
    ken2_seg = os.path.join(SECONDARY_ROOT, "ken/segments")
    kelly2_seg = os.path.join(SECONDARY_ROOT, "kelly/segments")
    for name, seg_path in [("secondary_ken_segments", ken2_seg), ("secondary_kelly_segments", kelly2_seg)]:
        cnt = count_wavs(seg_path)
        sr = check_sr(seg_path)
        report.append((name, seg_path, cnt, None, sr))

    # JSON validity
    check_json(ken_meta)
    check_json(kelly_meta)

    print("Dataset verification:")
    for name, path, cnt, expected, sr in report:
        exp = f" (expected {expected})" if expected is not None else ""
        print(f"- {name}: {cnt} wavs{exp}, sample_rate={sr}, path={path}")
    print("JSON metadata valid:")
    print(f"- {ken_meta}")
    print(f"- {kelly_meta}")


if __name__ == "__main__":
    main()


