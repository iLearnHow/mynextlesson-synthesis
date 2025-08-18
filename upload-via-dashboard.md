# Upload Viseme Frames via Cloudflare Dashboard

## 🚀 Quick Upload Method (No CLI needed)

### Step 1: Prepare Files
Your viseme frames are already prepared in `r2-upload-ready/` directory.

### Step 2: Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on **R2** in the left sidebar
3. Select your bucket (should be named `avatars`)

### Step 3: Upload Kelly Frames
1. Click **Upload** button
2. Navigate to `r2-upload-ready/kelly/full/` on your computer
3. Select ALL files in that folder:
   - `.manifest.rewritten.json`
   - `A.png`, `E.png`, `I.png`
   - `REST.png`, `MBP.png`, `FV.png`
   - `TH.png`, `DNTL.png`, `KG.png`
   - `S.png`, `WQ.png`, `R.png`
4. Click **Upload**

### Step 4: Upload Ken Frames
1. Click **Upload** button again
2. Navigate to `r2-upload-ready/ken/full/` on your computer
3. Select ALL files in that folder (same structure as Kelly)
4. Click **Upload**

### Step 5: Verify Structure
Your R2 bucket should look like this:
```
avatars/
├── kelly/
│   └── full/
│       ├── .manifest.rewritten.json
│       ├── REST.png
│       ├── MBP.png
│       ├── FV.png
│       ├── TH.png
│       ├── DNTL.png
│       ├── KG.png
│       ├── S.png
│       ├── WQ.png
│       ├── R.png
│       ├── A.png
│       ├── E.png
│       └── I.png
└── ken/
    └── full/
        ├── .manifest.rewritten.json
        ├── REST.png
        ├── MBP.png
        ├── FV.png
        ├── TH.png
        ├── DNTL.png
        ├── KG.png
        ├── S.png
        ├── WQ.png
        ├── R.png
        ├── A.png
        ├── E.png
        └── I.png
```

### Step 6: Test Access
After upload, test these URLs:
- https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png
- https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full/MBP.png

Both should show the viseme images.

## 🎯 What This Enables

Once uploaded, your avatar sync system will:
1. ✅ Load viseme frames from R2
2. ✅ Switch frames in real-time during speech
3. ✅ Provide smooth lip-sync animation
4. ✅ Work automatically on ilearnhow.com

## 🚨 Important Notes

- **Public Access**: Ensure your R2 bucket allows public read access
- **CORS**: The bucket should allow cross-origin requests from ilearnhow.com
- **File Names**: Keep the exact file names and structure

## 🧪 Test After Upload

Visit https://ilearnhow.com/ and:
1. Click "Start Lesson" button
2. Watch Kelly's mouth move as she speaks
3. No more robot voices!

The system is already deployed and waiting for these files! 🎭
