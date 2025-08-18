#!/usr/bin/env python3
"""
Viseme packer CLI for Ken reference video.

Ingests data/ken/video/ken_reference.mp4, extracts frames, classifies
into coarse visemes (A/E/I/MBP/FV/S/REST) using simple mouth openness and
spectral features (optional), writes Cloudflare-ready manifest.json and
WebP frames. Designed to be improved by better classifiers later, but
works now as a baseline.

Usage:
  python tools/viseme_pack/ken_pack.py --input /Users/nicolette/Downloads/my-next-lesson/my-next-lesson/data/ken/video/ken_reference.mp4 \
      --out /tmp/ken_visemes --limit 8

Then upload /tmp/ken_visemes to Cloudflare under avatars/ken/full/ and
serve manifest.json at avatars/ken/full/manifest.json
"""

import argparse
import json
import os
import subprocess
import tempfile
import cv2
import numpy as np

VKEYS = ["REST","MBP","FV","S","A","E","I"]

def run_ffmpeg_extract(video_path: str, out_dir: str, fps: int = 30):
    os.makedirs(out_dir, exist_ok=True)
    # Extract raw frames
    patt = os.path.join(out_dir, "frame_%06d.png")
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"fps={fps}",
        patt
    ]
    subprocess.run(cmd, check=True)
    return sorted(os.listdir(out_dir))

def mouth_openness_estimate(gray: np.ndarray) -> float:
    h, w = gray.shape
    midy = int(h*0.58)  # approximate mouth row
    band = gray[max(0, midy-int(h*0.07)):min(h, midy+int(h*0.07)), :]
    # Higher variance in band suggests open mouth (dark inner mouth)
    return float(np.std(band) / 255.0)

def hiss_estimate(gray: np.ndarray) -> float:
    # Edge density around mouth band can suggest frication
    edges = cv2.Canny(gray, 50, 150)
    h, w = edges.shape
    midy = int(h*0.58)
    band = edges[max(0, midy-int(h*0.06)):min(h, midy+int(h*0.06)), :]
    return float(np.mean(band) / 255.0)

def classify_viseme(gray: np.ndarray) -> str:
    openv = mouth_openness_estimate(gray)
    hiss = hiss_estimate(gray)
    # Heuristic mapping; tune on your footage
    if openv < 0.05:
        return "MBP"
    if hiss > 0.22 and openv < 0.2:
        return "S"
    if 0.05 <= openv < 0.16:
        return "I"
    if 0.16 <= openv < 0.26:
        return "E"
    if openv >= 0.26:
        return "A"
    return "REST"

def write_webp(img: np.ndarray, out_path: str, quality: int = 85):
    cv2.imwrite(out_path, img, [cv2.IMWRITE_WEBP_QUALITY, quality])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Path to ken_reference.mp4")
    ap.add_argument("--out", required=True, help="Output directory for frames/manifest")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--limit", type=int, default=6, help="Max frames per viseme")
    ap.add_argument("--quality", type=int, default=82, help="WebP quality")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="ken_extract_")

    print("Extracting frames with ffmpeg…")
    run_ffmpeg_extract(args.input, tmp, fps=args.fps)

    bins = {k: [] for k in VKEYS}
    print("Classifying frames…")
    for fname in sorted(os.listdir(tmp)):
        if not fname.lower().endswith(".png"): continue
        path = os.path.join(tmp, fname)
        img = cv2.imread(path)
        if img is None: continue
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        v = classify_viseme(gray)
        bins[v].append((path, float(mouth_openness_estimate(gray))))

    # Pick top-N per viseme by openness score or centrality
    out_manifest = {}
    base_url_placeholder = "https://YOUR_CDN/avatars/ken/full"
    for v in VKEYS:
        frames = sorted(bins[v], key=lambda t: abs(t[1] - 0.22))  # prefer mid openness for stability
        frames = frames[:max(1, args.limit)]
        out_files = []
        vdir = os.path.join(args.out, v)
        os.makedirs(vdir, exist_ok=True)
        for i, (src, score) in enumerate(frames, 1):
            img = cv2.imread(src)
            # White background optimization: preserve white, compress WebP
            outp = os.path.join(vdir, f"frame_{i:02d}.webp")
            write_webp(img, outp, quality=args.quality)
            out_files.append(f"{base_url_placeholder}/{v}/frame_{i:02d}.webp")
        out_manifest[v] = out_files

    with open(os.path.join(args.out, "manifest.json"), "w") as f:
        json.dump(out_manifest, f, indent=2)
    print(f"✅ Wrote manifest and frames to {args.out}\nRemember to set base_url in manifest or rewrite URLs on upload.")

if __name__ == "__main__":
    main()


