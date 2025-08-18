#!/bin/bash
set -euo pipefail

# Extract representative full-frame images for 12 visemes from a Heygen MP4 using VAD and simple phoneme proxy.
# Requirements: ffmpeg, python3 with librosa & numpy (optional), a phoneme JSON with segments [{p,start,end}] if available.

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <mp4_path> <avatar: kelly|ken> <output_dir> [phoneme_json]" >&2
  exit 1
fi

MP4="$1"; AVATAR="$2"; OUT="$3"; PHJSON="${4:-}"
mkdir -p "$OUT"

# Default viseme list
VISEMES=(REST MBP FV TH DNTL KG S WQ R A E I)

# If phoneme JSON provided, sample midpoint frames for each viseme occurrence
if [ -n "$PHJSON" ] && [ -f "$PHJSON" ]; then
  PHJSON_PATH="$PHJSON" python3 - <<'PY'
import json, os
ph_path=os.environ['PHJSON_PATH']
with open(ph_path,'r') as f:
    ph=json.load(f)
map={
 'REST':'REST','P':'MBP','B':'MBP','M':'MBP','F':'FV','V':'FV','TH':'TH','DH':'TH',
 'T':'DNTL','D':'DNTL','N':'DNTL','L':'DNTL','K':'KG','G':'KG','NG':'KG','S':'S','Z':'S',
 'SH':'S','ZH':'S','CH':'S','JH':'S','R':'R','ER':'R','W':'WQ','OW':'WQ','OY':'WQ',
 'AW':'WQ','UH':'WQ','UW':'WQ','AA':'A','AE':'A','AH':'A','AO':'A','EH':'E','EY':'E',
 'AY':'E','IH':'I','IY':'I','Y':'I'
}
visemes=['REST','MBP','FV','TH','DNTL','KG','S','WQ','R','A','E','I']
buckets={v:[] for v in visemes}
for p in ph:
    v=map.get(str(p.get('p','')).upper())
    if not v: continue
    try:
        s=float(p.get('start',0) or 0.0)
        e=float(p.get('end',s) or s)
    except Exception:
        continue
    mid=(s+e)/2.0
    buckets[v].append(mid)
pick={}
for v,arr in buckets.items():
    if arr:
        pick[v]=arr[len(arr)//2]
open('.pick.json','w').write(json.dumps(pick))
PY

  for vis in "${VISEMES[@]}"; do
    TS=$(python3 - <<PY
import json
j=json.load(open('.pick.json'))
print(j.get('$vis',0))
PY
)
    ffmpeg -ss "$TS" -i "$MP4" -frames:v 1 -q:v 2 "$OUT/${AVATAR}_${vis}.png" -y >/dev/null 2>&1 || true
  done
  rm -f .pick.json
else
  # Fallback: sample evenly across duration for demo
  DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$MP4")
  STEP=$(python3 - <<PY
dur=float("$DUR") if "$DUR"!="N/A" else 60.0
print(max(0.1, dur/12.0))
PY
)
  i=0; for vis in "${VISEMES[@]}"; do
    TS=$(python3 - <<PY
step=float("$STEP"); idx=int("$i"); print(round(step*idx+step*0.5,2))
PY
)
    ffmpeg -ss "$TS" -i "$MP4" -frames:v 1 -q:v 2 "$OUT/${AVATAR}_${vis}.png" -y >/dev/null 2>&1 || true
    i=$((i+1))
  done
fi

echo "Saved full-frame viseme stills to $OUT"

