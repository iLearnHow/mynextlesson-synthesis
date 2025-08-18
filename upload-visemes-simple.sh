#!/bin/bash

# Simple script to prepare viseme files for R2 upload
# This creates a directory structure ready for upload via Cloudflare dashboard or rclone

echo "🎯 Preparing viseme frames for R2 upload..."

# Create output directory
OUTPUT_DIR="r2-upload-ready"
mkdir -p "$OUTPUT_DIR"

# Viseme names
VISEMES=("REST" "MBP" "FV" "TH" "DNTL" "KG" "S" "WQ" "R" "A" "E" "I")

# Process Kelly frames
echo "📦 Processing Kelly viseme frames..."
mkdir -p "$OUTPUT_DIR/kelly/full"

for viseme in "${VISEMES[@]}"; do
    src="production-deploy/assets/avatars/kelly/2d/full/kelly_${viseme}.png"
    dst="$OUTPUT_DIR/kelly/full/${viseme}.png"
    
    if [ -f "$src" ]; then
        cp "$src" "$dst"
        echo "✅ Copied kelly_${viseme}.png -> ${viseme}.png"
    else
        echo "⚠️  Missing: $src"
    fi
done

# Process Ken frames
echo -e "\n📦 Processing Ken viseme frames..."
mkdir -p "$OUTPUT_DIR/ken/full"

for viseme in "${VISEMES[@]}"; do
    src="production-deploy/assets/avatars/ken/2d/full/ken_${viseme}.png"
    dst="$OUTPUT_DIR/ken/full/${viseme}.png"
    
    if [ -f "$src" ]; then
        cp "$src" "$dst"
        echo "✅ Copied ken_${viseme}.png -> ${viseme}.png"
    else
        echo "⚠️  Missing: $src"
    fi
done

# Create manifests
echo -e "\n📝 Creating manifests..."

# Kelly manifest
cat > "$OUTPUT_DIR/kelly/full/.manifest.rewritten.json" << EOF
{
  "version": "1.0",
  "avatar": "kelly",
  "visemes": ["REST", "MBP", "FV", "TH", "DNTL", "KG", "S", "WQ", "R", "A", "E", "I"],
  "frame": { "w": 1920, "h": 1080 },
  "base_url": "https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Ken manifest
cat > "$OUTPUT_DIR/ken/full/.manifest.rewritten.json" << EOF
{
  "version": "1.0",
  "avatar": "ken",
  "visemes": ["REST", "MBP", "FV", "TH", "DNTL", "KG", "S", "WQ", "R", "A", "E", "I"],
  "frame": { "w": 1920, "h": 1080 },
  "base_url": "https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "\n✅ Files prepared in: $OUTPUT_DIR/"
echo -e "\n📤 To upload to R2:"
echo "1. Via Cloudflare Dashboard:"
echo "   - Go to R2 > Your Bucket > Upload"
echo "   - Upload the entire contents of $OUTPUT_DIR/"
echo ""
echo "2. Via rclone (if configured):"
echo "   rclone copy $OUTPUT_DIR/ r2:avatars/ --progress"
echo ""
echo "3. Via AWS CLI (if configured for R2):"
echo "   aws s3 sync $OUTPUT_DIR/ s3://avatars/ --endpoint-url https://\$ACCOUNT_ID.r2.cloudflarestorage.com"
echo ""
echo "Files will be available at:"
echo "  https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/kelly/full/REST.png"
echo "  https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/ken/full/MBP.png"
echo "  etc..."
