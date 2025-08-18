#!/usr/bin/env python3
"""
Generate a photoreal 2D avatar rig (viseme mouth patches + eyelid/pupil patches) from a single neutral headshot.

This avoids manual Blender work and video files. It uses face landmarks to warp the mouth region into 12 viseme shapes.

Requirements (install once):
  pip install opencv-python mediapipe numpy scikit-image

Usage:
  python tools/generate_2d_rig.py \
    --avatar kelly \
    --image /abs/path/to/kelly_neutral.png \
    --out   /abs/path/to/repo/production-deploy/assets/avatars/kelly/2d

Outputs:
  - rig.json (anchors, bbox, z-order)
  - mouth_*.png for 12 visemes (REST, MBP, FV, TH, DNTL, KG, S, WQ, R, A, E, I)
  - eyelids_closed.png, pupil_L.png, pupil_R.png (optional basic derivations)

Notes:
  - This script uses generic landmark offsets to synthesize visemes. For ultimate quality, you can later swap in atlas
    patches extracted from Wav2Lip/SadTalker clips; the runtime code does not change.
"""

import argparse
import json
import os
from pathlib import Path

import cv2
import numpy as np
try:
    import mediapipe as mp
except Exception as e:
    mp = None


VISEMES = ['REST','MBP','FV','TH','DNTL','KG','S','WQ','R','A','E','I']

# 468-landmark indices roughly covering mouth region
MOUTH_IDX = list(set([
    # Outer
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88,
    # Inner
    78,95,  80,  82,  13, 312,  311,  310,  415,  308,  324,  318,  402,  317,
]))


def detect_landmarks(img_bgr):
    if mp is None:
        raise RuntimeError("mediapipe is required. pip install mediapipe")
    mp_face = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    res = mp_face.process(img_rgb)
    mp_face.close()
    if not res.multi_face_landmarks:
        raise RuntimeError("No face landmarks detected")
    h, w = img_bgr.shape[:2]
    pts = []
    for lm in res.multi_face_landmarks[0].landmark:
        pts.append([lm.x * w, lm.y * h])
    return np.array(pts, dtype=np.float32)


def mouth_bbox_from_landmarks(pts):
    mouth = pts[MOUTH_IDX]
    x, y, w, h = cv2.boundingRect(mouth.astype(np.float32))
    # pad a bit
    pad = int(max(4, 0.08 * max(w, h)))
    x = max(0, x - pad); y = max(0, y - pad)
    w = min(int(w + 2*pad), int(pts[:,0].max()) - x)
    h = min(int(h + 2*pad), int(pts[:,1].max()) - y)
    return x, y, w, h


def piecewise_affine_warp(src_img, src_pts, dst_pts, bbox):
    # Use OpenCV triangulation via Subdiv2D within bbox region
    x, y, w, h = bbox
    roi = src_img[y:y+h, x:x+w].copy()
    src = src_pts.copy(); dst = dst_pts.copy()
    src[:,0] -= x; src[:,1] -= y
    dst[:,0] -= x; dst[:,1] -= y

    rect = (0, 0, w, h)
    subdiv = cv2.Subdiv2D(rect)
    for p in dst:
        subdiv.insert((float(p[0]), float(p[1])))
    triangle_list = subdiv.getTriangleList()
    out = np.zeros_like(roi)

    def to_int(p):
        return (int(round(p[0])), int(round(p[1])))

    for t in triangle_list:
        pts_dst = [(t[0],t[1]), (t[2],t[3]), (t[4],t[5])]
        pts_dst = [to_int(p) for p in pts_dst]
        # find corresponding src triangle by nearest neighbors
        tri_idx = []
        for p in pts_dst:
            d = np.sum((dst - p)**2, axis=1)
            tri_idx.append(int(np.argmin(d)))
        src_tri = np.float32([src[i] for i in tri_idx])
        dst_tri = np.float32([dst[i] for i in tri_idx])
        # warp affine
        M = cv2.getAffineTransform(src_tri, dst_tri)
        # bounding rect
        r = cv2.boundingRect(dst_tri)
        x0,y0,w0,h0 = r
        if w0<=0 or h0<=0: continue
        warp = cv2.warpAffine(roi, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(mask, np.int32(dst_tri), 255)
        out_region = out[y0:y0+h0, x0:x0+w0]
        mask_region = mask[y0:y0+h0, x0:x0+w0]
        warped_region = warp[y0:y0+h0, x0:x0+w0]
        out_region[mask_region>0] = warped_region[mask_region>0]
        out[y0:y0+h0, x0:x0+w0] = out_region
    return out


def viseme_offsets(name):
    # Simple, conservative offsets in pixels for mouth landmarks; tweak as needed
    o = {k: (0.0, 0.0) for k in MOUTH_IDX}
    # Heuristics: open/round/press patterns
    if name in ('A','E','I'):
        dd = 6 if name=='A' else (5 if name=='E' else 4)
        for i in MOUTH_IDX:
            # vertical open
            if i % 2 == 0: o[i] = (0.0, -dd)
            else: o[i] = (0.0, dd)
    if name in ('WQ','O'):
        for i in MOUTH_IDX:
            # inward for rounding
            o[i] = (-1.5, 0.0) if i % 2 == 0 else (1.5, 0.0)
    if name == 'MBP':
        for i in MOUTH_IDX:
            # close lips
            o[i] = (0.0, -2.0)
    if name == 'FV':
        for i in MOUTH_IDX:
            o[i] = (0.0, -1.0)
    if name in ('TH','DNTL','S'):
        for i in MOUTH_IDX:
            o[i] = (0.0, -0.5)
    return o


def generate_viseme_patch(img, pts, bbox, name):
    # Build dst landmarks with offsets
    offs = viseme_offsets(name)
    dst_pts = pts.copy()
    for idx in MOUTH_IDX:
        dx, dy = offs[idx]
        dst_pts[idx,0] += dx
        dst_pts[idx,1] += dy
    # Warp mouth ROI
    patch = piecewise_affine_warp(img, pts[MOUTH_IDX], dst_pts[MOUTH_IDX], bbox)
    # Feather mask around mouth area for clean compositing
    mask = np.zeros(patch.shape[:2], dtype=np.uint8)
    mouth = dst_pts[MOUTH_IDX]
    cv2.fillConvexPoly(mask, mouth.astype(np.int32) - np.array([bbox[0], bbox[1]]), 255)
    mask = cv2.GaussianBlur(mask, (0,0), 2.0)
    # BGR to BGRA with alpha
    b,g,r = cv2.split(patch)
    a = mask
    return cv2.merge([b,g,r,a])


def save_png(path, img_rgba):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), img_rgba)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--avatar', required=True, help='kelly|ken')
    ap.add_argument('--image', required=True, help='Path to neutral headshot PNG/JPG')
    ap.add_argument('--out', required=True, help='Output directory for 2d rig assets')
    args = ap.parse_args()

    img = cv2.imread(args.image, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"Failed to read image: {args.image}")

    pts = detect_landmarks(img)
    bbox = mouth_bbox_from_landmarks(pts)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Save viseme patches
    for name in VISEMES:
        patch = generate_viseme_patch(img, pts, bbox, name)
        save_png(out_dir / f"mouth_{name}.png", patch)

    # Eyelids closed (simple vertical blur strip)
    h, w = img.shape[:2]
    eyelids = np.zeros((int(h*0.12), int(w*0.4), 4), dtype=np.uint8)
    eyelids[:,:,3] = 180
    save_png(out_dir / "eyelids_closed.png", eyelids)

    # Pupils (simple dark circles)
    for side in ['L','R']:
        pw, ph = 48, 48
        p = np.zeros((ph, pw, 4), dtype=np.uint8)
        cv2.circle(p, (pw//2, ph//2), 10, (0,0,0,255), -1)
        save_png(out_dir / f"pupil_{side}.png", p)

    # rig.json
    rig = {
        "avatarId": args.avatar,
        "version": "1.0",
        "mouth_bbox": {"x": int(bbox[0]), "y": int(bbox[1]), "w": int(bbox[2]), "h": int(bbox[3])},
        "z_order": ["base", "mouth", "teeth_upper", "teeth_lower", "tongue", "eyelids", "pupils"],
        "visemes": VISEMES
    }
    with open(out_dir / "rig.json", 'w') as f:
        json.dump(rig, f, indent=2)

    print(f"✅ 2D rig generated at: {out_dir}")


if __name__ == '__main__':
    main()


