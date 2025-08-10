import argparse
import os
import cv2
import numpy as np


def apply_breath_and_hair(src_video: str, dst_video: str, strength: float = 0.6):
    cap = cv2.VideoCapture(src_video)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {src_video}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(dst_video, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    t = 0
    two_pi = 2 * np.pi
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # vertical breathing oscillation (subtle)
        breath = int(strength * 0.003 * h * (1 + np.sin(two_pi * (t / (fps * 3.5)))))
        M = np.float32([[1, 0, 0], [0, 1, breath]])
        breathed = cv2.warpAffine(frame, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)

        # hair flutter: light horizontal warp in top band
        band_h = int(0.25 * h)
        top = breathed[:band_h, :]
        grid_y, grid_x = np.mgrid[0:band_h, 0:w]
        flutter = (np.sin(2 * np.pi * (grid_y / (band_h * 2) + t / (fps * 1.8))) * (strength * 1.2)).astype(np.float32)
        map_x = (grid_x + flutter * 3).astype(np.float32)
        map_y = grid_y.astype(np.float32)
        warped_top = cv2.remap(top, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
        breathed[:band_h, :] = warped_top

        out.write(breathed)
        t += 1

    cap.release()
    out.release()
    print(dst_video)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", required=True)
    p.add_argument("--dst", required=True)
    p.add_argument("--strength", type=float, default=0.6)
    args = p.parse_args()
    os.makedirs(os.path.dirname(args.dst), exist_ok=True)
    apply_breath_and_hair(args.src, args.dst, args.strength)


if __name__ == "__main__":
    main()



