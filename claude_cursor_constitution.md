# Claude Cursor Constitution - iLearn How Project

## 🎯 **PROJECT MISSION**
Create a universal learning platform accessible to everyone on Earth, regardless of age, language, culture, or learning preference. The platform should provide personalized, age-appropriate, culturally-sensitive learning experiences.

## ⚠️ **CURRENT STATUS: WORK IN PROGRESS**

**CRITICAL**: The lesson player is NOT fully functional yet. There is significant work remaining to get a complete lesson working. DO NOT claim success until a complete lesson plays from start to finish.

### **What's Working:**
- Basic HTML interface with navigation icons
- Calendar system with 366 days
- Avatar selection (Kelly/Ken)
- Tone selection (Neutral/Fun/Grandmother)
- Language selection (12 languages)
- Age selection (10 age groups)
- Variant control system structure
- ElevenLabs integration framework
- DNA file system with detailed age expressions
- Curriculum data for all 366 days

### **What's NOT Working (Critical Issues):**
1. **Lesson Flow**: "Start Lesson" button doesn't trigger actual lesson progression
2. **Content Display**: Lesson content doesn't appear properly
3. **Audio Integration**: ElevenLabs not connected to lesson flow
4. **Variant System**: Changes don't dynamically affect lesson content
5. **5-Phase System**: Lesson phases (opening→question_1→question_2→question_3→closing) not implemented
6. **Interactive Questions**: Question system not functional
7. **Avatar Expressions**: Dynamic avatar changes not working
8. **Real Content**: Using placeholder content instead of real curriculum

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Universal Scope:**
- **366 daily lessons** for 2025
- **5 lesson phases**: opening → question_1 → question_2 → question_3 → closing
- **10 age groups**: age_2, age_5, age_8, age_12, age_16, age_25, age_40, age_60, age_80, age_102
- **3 tones**: grandmother, fun, neutral
- **12 languages**: English, Spanish, French, German, Chinese, Japanese, Portuguese, Italian, Russian, Arabic, Hindi, Korean
- **2 avatars**: Kelly, Ken
- **3x3x3x3 variants**: 81 unique experiences per lesson

### **Core Files:**
- `index.html` (1799 lines) - Main interface
- `dev-player.html` (DEV-ONLY) - Sandbox for manifest-driven playback validation; must be removed before production merges
- `complete-lesson-player.js` (1181 lines) - Universal lesson player
- `complete-curriculum.js` (377 lines) - 366-day curriculum
- `corrected-variant-generator-v2.js` (973 lines) - Variant system
- `complete-elevenlabs-integration.js` (437 lines) - Voice synthesis

### **Data Files:**
- `data/` - Monthly curriculum JSON files (12 files)
- `dna_files/` - DNA lesson templates (3 files)
- `production-deploy/` - Deployment-ready files
- `api/` - Imported OpenAPI, JSON Schemas, and example manifests used for local validation and dev playback

## 🧪 DEV-ONLY SANDBOX POLICY

- `dev-player.html` is permitted for local development to validate: manifest fetch/parse, first‑chunk prefetch, Opus chunk playback with cross‑fade (150–250 ms), captions/popups, and sentence‑boundary variant switching.
- It reuses existing runtime modules (`complete-curriculum.js`, `complete-lesson-player.js`, `complete-elevenlabs-integration.js`, `corrected-variant-generator-v2.js`).
- It must not be deployed or merged into production branches. All final wiring happens in `index.html`.

## 📦 PLANNING SUITE IMPORTS

- OpenAPI: `api/openapi/openapi.yaml`
- Schemas: `api/schemas/*.json` (incl. `manifest.schema.json` and popup payload schemas)
- Examples: `api/examples/manifests/*.json`

These artifacts are authoritative for the manifest player integration and validation during development.

## 🎯 **SUCCESS CRITERIA**

### **Minimum Viable Product (MVP):**
1. ✅ User can click "Start Lesson"
2. ✅ Lesson content displays properly
3. ✅ Lesson progresses through phases
4. ✅ Avatar changes appropriately
5. ✅ Variant changes affect content
6. ✅ Calendar navigation works
7. ✅ Audio plays (if configured)

### **Full Success:**
1. ✅ Complete 5-phase lesson flow
2. ✅ Interactive questions work
3. ✅ All 10 age groups supported
4. ✅ All 3 tones implemented
5. ✅ All 12 languages supported
6. ✅ ElevenLabs audio integration
7. ✅ 366 daily lessons accessible
8. ✅ 3x3x3x3 variant system working

## 🚨 **CRITICAL RULES**

### **DO NOT:**
- Claim success until a complete lesson works
- Ignore console errors
- Make changes without testing
- Use placeholder content instead of real data
- Skip testing all variant combinations

### **DO:**
- Test incrementally after each change
- Check browser console constantly
- Study the existing code structure
- Use real curriculum data
- Test with multiple age/tone/language combinations

## 🔧 **IMMEDIATE PRIORITIES**

### **Priority 1: Fix Lesson Flow (CRITICAL)**
```javascript
// In complete-lesson-player.js - Fix startLesson() method
startLesson() {
    // Currently: Just shows overlay
    // Need: Actually start 5-phase lesson progression
    // Need: Load real curriculum content
    // Need: Display lesson content properly
}
```

### **Priority 2: Implement 5-Phase System**
```javascript
// Need to implement these phases:
const phases = ['opening', 'question_1', 'question_2', 'question_3', 'closing'];

// Each phase should:
// 1. Display appropriate content
// 2. Update avatar expression
// 3. Generate/play audio
// 4. Handle user interaction
// 5. Transition to next phase
```

### **Priority 3: Connect Real Content**
```javascript
// In index.html - Fix content display
// Currently: Static placeholder content
// Need: Dynamic content from curriculum data
// Need: Age-appropriate content generation
// Need: Tone-specific delivery
```

### **Priority 4: Audio Integration**
```javascript
// In complete-elevenlabs-integration.js
// Need: Connect to lesson phases
// Need: Generate audio for each phase
// Need: Handle audio playback timing
// Need: Fallback for when API unavailable
```

## 🧪 **TESTING STRATEGY**

### **Test 1: Basic Lesson Flow**
1. Load https://ilearnhow.com
2. Click "Start Lesson" button
3. **EXPECTED**: Lesson should start with opening phase
4. **EXPECTED**: Content should display properly
5. **EXPECTED**: Avatar should update
6. **EXPECTED**: Audio should play (if configured)

### **Test 2: Variant Changes**
1. Change avatar (Kelly/Ken)
2. Change tone (Neutral/Fun/Grandmother)
3. Change age (any age group)
4. **EXPECTED**: Content should update immediately
5. **EXPECTED**: Avatar expression should change
6. **EXPECTED**: Audio should regenerate

### **Test 3: Calendar Navigation**
1. Click calendar icon
2. Select different day
3. **EXPECTED**: New lesson should load
4. **EXPECTED**: Content should be different
5. **EXPECTED**: "Start Lesson" should work

### **Test 4: Complete Lesson**
1. Start lesson
2. Answer questions
3. **EXPECTED**: Should progress through 5 phases
4. **EXPECTED**: Should show completion
5. **EXPECTED**: Should show daily fortune

## 📚 **LEARNING RESOURCES**

### **JavaScript Concepts to Master:**
1. **Async/Await**: For API calls and audio generation
2. **Event Handling**: For user interactions
3. **DOM Manipulation**: For content updates
4. **Object-Oriented Programming**: For lesson player class
5. **API Integration**: For ElevenLabs voice synthesis

### **Key Files to Study:**
1. **`data/the-sun-dna.json`** - Understand DNA structure
2. **`data/april_curriculum.json`** - Understand curriculum format
3. **`complete-lesson-player.js`** - Understand lesson flow
4. **`index.html`** - Understand UI structure

### **External Resources:**
- **ElevenLabs API**: https://elevenlabs.io/docs
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **HTML/CSS**: https://developer.mozilla.org/en-US/docs/Web

## 🚨 **COMMON PITFALLS TO AVOID**

### **Pitfall 1: Not Testing Incrementally**
- **Problem**: Making too many changes at once
- **Solution**: Test each small fix before moving on

### **Pitfall 2: Ignoring Console Errors**
- **Problem**: JavaScript errors breaking functionality
- **Solution**: Check browser console constantly

### **Pitfall 3: Not Understanding the Architecture**
- **Problem**: Making changes without understanding the system
- **Solution**: Study the file relationships and data flow

### **Pitfall 4: Hardcoding Instead of Using Data**
- **Problem**: Using placeholder content
- **Solution**: Always use real curriculum data

### **Pitfall 5: Not Testing All Variants**
- **Problem**: Only testing one age/tone/language
- **Solution**: Test multiple combinations

## 📞 **SUPPORT RESOURCES**

### **Project Documentation:**
- **`JUNIOR_DEVELOPER_HANDOFF_COMPLETE.md`** - Complete handoff guide
- **`ILEARNHOW_DEPLOYMENT_COMPLETE.md`** - Deployment status
- **`production-deploy/DEPLOYMENT_INSTRUCTIONS.md`** - Upload instructions
- **`data/`** - All curriculum and DNA files

### **Testing Files:**
- **`working-test.html`** - System test page
- **`test-system-status.js`** - System diagnostics
- **`production-deploy/live-test.html`** - Deployment verification

### **Debugging Tools:**
- **Browser DevTools**: Essential for debugging
- **Console Logging**: Add console.log() statements
- **Network Monitoring**: Check API calls
- **Error Tracking**: Monitor for JavaScript errors

## 🚀 **GETTING STARTED**

### **Day 1: Understand the System**
1. Read the handoff document completely
2. Study the file structure and relationships
3. Run the local server and test current state
4. Identify the most critical issues

### **Day 2: Fix Basic Lesson Flow**
1. Fix the "Start Lesson" button
2. Implement basic lesson content display
3. Test with one age/tone/language combination
4. Ensure lesson starts and shows content

### **Day 3: Implement 5-Phase System**
1. Implement opening phase
2. Implement question phases
3. Implement closing phase
4. Test phase transitions

### **Day 4: Connect Real Content**
1. Integrate curriculum data
2. Implement age-appropriate content
3. Implement tone-specific delivery
4. Test with multiple variants

### **Day 5: Audio Integration**
1. Connect ElevenLabs to lesson phases
2. Implement audio generation
3. Handle audio timing
4. Test audio playback

### **Day 6: Testing & Polish**
1. Test all variant combinations
2. Fix any remaining issues
3. Optimize performance
4. Prepare for deployment

## ⚠️ **FINAL WARNING**

**DO NOT CLAIM SUCCESS UNTIL:**
1. A complete lesson plays from start to finish
2. All variant changes work properly
3. Audio integration is functional
4. Calendar navigation works
5. You have tested with multiple age/tone/language combinations

**The project has a solid foundation but needs significant work to be fully functional. Focus on incremental progress and thorough testing.**

## 📞 **SUPPORT**

If you get stuck:
1. Check browser console for errors
2. Add console.log() statements for debugging
3. Test small changes incrementally
4. Study the existing code structure
5. Refer to the curriculum and DNA files for content

**Remember: This is a complex system. Take it step by step and test everything thoroughly.**

---

## 🎯 **MISSION STATEMENT**

**Universal learning accessible to everyone on Earth** - This project aims to provide truly personalized, accessible, and universal learning experiences. Any person, at any age, speaking any language, should be able to access world-class education tailored to their needs and preferences.

**Status: Work in Progress - Foundation Complete, Implementation Needed**