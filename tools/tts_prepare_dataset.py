import os
import csv
import json
import argparse


def write_manifest(root: str, out_csv: str, speaker: str) -> int:
    seg_dir = os.path.join(root, "data", speaker, "segments")
    meta_path = os.path.join(root, "data", speaker, "metadata", "enhanced_segments.json")
    with open(meta_path, "r") as f:
        meta = json.load(f)
    rows = []
    for i, seg in enumerate(meta.get("segments", [])):
        rel = seg.get("file") or f"data/{speaker}/segments/segment_{i:03d}.wav"
        text = seg.get("text", "")
        rows.append([speaker, rel, text])
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    with open(out_csv, "w", newline="") as f:
        w = csv.writer(f, delimiter="|")
        w.writerow(["speaker", "audio_path", "text"])  # header
        for r in rows:
            w.writerow(r)
    return len(rows)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--primary-root", default="/Users/nicolette/Downloads/my-next-lesson/tts_training 2")
    p.add_argument("--out", default="tts/manifests/primary.csv")
    args = p.parse_args()
    n1 = write_manifest(args.primary_root, args.out.replace(".csv", "_ken.csv"), "ken")
    n2 = write_manifest(args.primary_root, args.out.replace(".csv", "_kelly.csv"), "kelly")
    # merge
    with open(args.out, "w", newline="") as out_f:
        w = csv.writer(out_f, delimiter="|")
        w.writerow(["speaker", "audio_path", "text"])  # header
        for part in ("_ken.csv", "_kelly.csv"):
            with open(args.out.replace(".csv", part), "r") as f:
                next(f)
                for line in f:
                    out_f.write(line)
    print(f"Wrote {args.out} with {n1 + n2} rows")


if __name__ == "__main__":
    main()


