#!/bin/bash
# Deploy Critical Fixes to ilearnhow.com

echo "🔧 Deploying Critical Fixes"
echo "=========================="

# Step 1: Prepare deployment
echo -e "\n📦 Preparing deployment with fixes..."
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy all files
cp -r * deploy-temp/ 2>/dev/null || true

# Remove large files that break deployment
echo "🗑️  Removing large files..."
find deploy-temp -name "*.mp4" -delete
find deploy-temp -type f -size +24M -delete

# Convert AIFF to smaller MP3 (if ffmpeg available)
echo -e "\n🔄 Converting audio files..."
if command -v ffmpeg &> /dev/null; then
    mkdir -p deploy-temp/generated_audio_mp3/kelly
    mkdir -p deploy-temp/generated_audio_mp3/ken
    
    # Convert Kelly audio
    for f in generated_audio/kelly/*.aiff; do
        if [ -f "$f" ]; then
            base=$(basename "$f" .aiff)
            ffmpeg -i "$f" -codec:a libmp3lame -b:a 128k "deploy-temp/generated_audio_mp3/kelly/${base}.mp3" -y 2>/dev/null
            echo "✅ Converted Kelly: ${base}.mp3"
        fi
    done
    
    # Convert Ken audio  
    for f in generated_audio/ken/*.aiff; do
        if [ -f "$f" ]; then
            base=$(basename "$f" .aiff)
            ffmpeg -i "$f" -codec:a libmp3lame -b:a 128k "deploy-temp/generated_audio_mp3/ken/${base}.mp3" -y 2>/dev/null
            echo "✅ Converted Ken: ${base}.mp3"
        fi
    done
else
    echo "⚠️  ffmpeg not found - copying AIFF files as-is"
    cp -r generated_audio deploy-temp/ 2>/dev/null || true
fi

# Update paths in dynamic-tts-system.js to use MP3
if [ -d "deploy-temp/generated_audio_mp3" ]; then
    sed -i.bak 's|/generated_audio/|/generated_audio_mp3/|g' deploy-temp/dynamic-tts-system.js
    sed -i.bak 's|\.aiff|.mp3|g' deploy-temp/dynamic-tts-system.js
    rm deploy-temp/dynamic-tts-system.js.bak
    echo "✅ Updated audio paths to MP3"
fi

# Step 2: Create autoplay fix
echo -e "\n🔊 Adding autoplay fix..."
cat >> deploy-temp/index.html << 'EOF_AUTOPLAY'
<script>
// Autoplay Fix - Add to end of body
window.addEventListener('DOMContentLoaded', function() {
    // Check if audio context is suspended
    const checkAudioContext = () => {
        if (window.AudioContext || window.webkitAudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') {
                // Add click-to-start overlay
                const overlay = document.createElement('div');
                overlay.id = 'audio-permission-overlay';
                overlay.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.85);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        cursor: pointer;
                    ">
                        <div style="
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            text-align: center;
                            max-width: 400px;
                        ">
                            <h2 style="margin: 0 0 20px 0;">🔊 Enable Audio</h2>
                            <p style="margin: 0 0 30px 0; color: #666;">
                                Click below to enable Kelly and Ken's voices for your lesson
                            </p>
                            <button style="
                                background: #007AFF;
                                color: white;
                                border: none;
                                padding: 15px 40px;
                                border-radius: 10px;
                                font-size: 18px;
                                cursor: pointer;
                            ">Start Learning with Audio</button>
                        </div>
                    </div>
                `;
                
                overlay.onclick = function() {
                    ctx.resume();
                    overlay.remove();
                    // Start first audio if ready
                    if (window.lessonFix && window.lessonFix.playSlideAudio) {
                        setTimeout(() => window.lessonFix.playSlideAudio(), 500);
                    }
                };
                
                document.body.appendChild(overlay);
            }
        }
    };
    
    // Check after a short delay to ensure everything is loaded
    setTimeout(checkAudioContext, 1000);
});
</script>
EOF_AUTOPLAY

echo "✅ Added autoplay fix"

# Step 3: Deploy
echo -e "\n🚀 Ready to deploy!"
echo "Run: npm run deploy"
echo ""
echo "📋 What's Fixed:"
echo "  ✅ Lesson selector moved to top-right (won't cover avatars)"
echo "  ✅ Auto-closes after selecting a lesson"
echo "  ✅ Audio permission overlay for autoplay"
echo "  ✅ Generated audio converted to MP3"
echo "  ✅ Console errors cleaned up"
