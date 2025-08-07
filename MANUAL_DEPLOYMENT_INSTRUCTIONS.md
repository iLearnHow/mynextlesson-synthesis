# 🚀 Manual Deployment to ilearnhow.com

## Option 1: Using cPanel File Manager
1. Log into your hosting cPanel
2. Open File Manager
3. Navigate to public_html/ (or www/)
4. Upload all files from production-deploy/ directory

## Option 2: Using FTP/SFTP
```bash
# Connect to your hosting provider
sftp username@your-hosting-provider.com
cd public_html/

# Upload core files
put production-deploy/index.html
put production-deploy/*.js

# Upload assets
put -r production-deploy/lesson-player-deploy/
put -r production-deploy/data/
```

## Option 3: Using Cloudflare Pages
1. Go to Cloudflare Dashboard
2. Navigate to Pages
3. Create new project
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

## Post-Upload Verification:
1. Visit https://ilearnhow.com
2. Test https://ilearnhow.com/working-test.html
3. Check browser console for any errors
4. Test all icons and overlays
5. Configure ElevenLabs API keys for voice synthesis

## Expected Results:
- ✅ Site loads without errors
- ✅ All icons work (📅 😊 🎭 🌍 👶 ➕)
- ✅ Overlays show/hide properly
- ✅ Calendar shows correct date (August 1st)
- ✅ Kelly and Ken avatars display correctly
- ✅ No JavaScript errors in console
