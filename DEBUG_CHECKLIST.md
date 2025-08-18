# Debug Checklist - iLearn How

## If the test page still shows errors:

### 1. Check Browser Console (F12)
Look for errors like:
- 404 errors (files not found)
- JavaScript syntax errors
- CORS errors

### 2. Verify Files Exist
These files must be present in /Users/nicolette/ilearn_how/:
- homegrown-tts-system.js
- dna-file-loader.js
- complete-curriculum.js
- corrected-variant-generator-v2.js
- complete-lesson-player.js
- unified-player-controls.js
- lesson-integration-fix.js

### 3. Try the Main Page Instead
The test page is just for diagnostics. The actual lesson system is at:
**http://localhost:8080**

### 4. Common Issues & Fixes

**Issue**: "404 File not found" errors
**Fix**: Make sure you're running the server from the ilearn_how directory:
```bash
cd /Users/nicolette/ilearn_how
python3 -m http.server 8080
```

**Issue**: JavaScript syntax errors
**Fix**: Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

**Issue**: Nothing appears on main page
**Fix**: Wait a few seconds for JavaScript to load, then refresh

### 5. Quick Test
Open the browser console (F12) and type:
```javascript
window.lessonFix
```

If this returns an object, the system is loaded correctly.

### 6. Alternative Test
Go directly to the working lesson:
1. Open http://localhost:8080
2. You should see variant selector buttons at the top
3. Click any button to load a lesson variant
4. If you see lesson content, the system is working!

## The test page is optional - the main lesson page is what matters!
