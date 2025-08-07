
# 🚀 iLearn How - Live Deployment Commands

## Option 1: Using FTP/SFTP
```bash
# Connect to your hosting provider via FTP/SFTP
# Upload all files from production-deploy/ to the root directory of ilearnhow.com

# Example using sftp:
sftp username@your-hosting-provider.com
cd public_html/
put production-deploy/index.html
put production-deploy/*.js
put production-deploy/working-test.html
put -r production-deploy/lesson-player-deploy/
put -r production-deploy/data/
```

## Option 2: Using cPanel File Manager
1. Log into your hosting cPanel
2. Open File Manager
3. Navigate to public_html/ (or www/)
4. Upload all files from production-deploy/ directory

## Option 3: Using Git (if using GitHub Pages or similar)
```bash
# If you have a git repository for ilearnhow.com
git add .
git commit -m "Deploy iLearn How production version"
git push origin main
```

## Option 4: Using Cloudflare Pages
1. Go to Cloudflare Dashboard
2. Navigate to Pages
3. Create new project or connect existing repository
4. Upload files from production-deploy/ directory

## Files to Upload:
- index.html (main interface)
- complete-curriculum.js (curriculum system)
- corrected-variant-generator-v2.js (variant generation)
- complete-elevenlabs-integration.js (voice system)
- apple-quality-overlay-system.js (overlay management)
- ai-generation-integration.js (AI integration)
- face-safe-layout-system.js (face-safe positioning)
- test-overlay-fixes.js (overlay tests)
- test-system-status.js (system tests)
- working-test.html (test page)
- lesson-player-deploy/ (avatar assets)
- data/ (curriculum data)

## Post-Deployment Verification:
1. Visit https://ilearnhow.com
2. Test https://ilearnhow.com/working-test.html
3. Check browser console for any errors
4. Test all icons and overlays
5. Configure ElevenLabs API keys for voice synthesis
