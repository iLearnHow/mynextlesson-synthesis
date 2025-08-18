# Student-Ready Action Plan - Making iLearn How Actually Work

## 🎯 Current State vs Student-Ready State

### What We Have (10% Functional)
- ✅ Lesson content loads
- ✅ Variant switching works
- ✅ Questions display
- ❌ No spoken audio
- ❌ Controls don't work
- ❌ Overlapping UI elements
- ❌ Missing avatar images
- ❌ Console full of errors

### What Students Need (100% Functional)
1. **Press play → Hear the lesson**
2. **See clean content → No confusion**
3. **Answer questions → Get spoken feedback**
4. **Use controls → They actually work**
5. **No errors → Professional experience**

## 🔧 Priority Fixes (In Order)

### Fix 1: Connect Audio System
**Problem**: The `speak()` method exists but isn't being called
**Solution**: 
```javascript
// When slide loads, automatically speak the content
async loadSlide(slideData) {
    displaySlideContent(slideData);
    await speak(slideData.script_text, currentAvatar);
}
```

### Fix 2: Wire Up Controls
**Problem**: Play/pause buttons exist but don't control audio
**Solution**:
```javascript
// Connect play button to audio system
document.getElementById('play-pause-master').onclick = () => {
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play();
    }
};
```

### Fix 3: Clean Up Display
**Problem**: Multiple overlapping content areas
**Solution**:
- Hide lesson-content-overlay when manifest content shows
- Remove duplicate content displays
- Show only one thing at a time

### Fix 4: Fix Missing Assets
**Problem**: Avatar images return 404
**Solution**:
- Create fallback avatar images
- Fix incorrect asset paths
- Use avatar colors as backup

### Fix 5: Implement Question Flow
**Problem**: Questions are silent and manual
**Solution**:
1. Speak the question text
2. Wait for answer
3. Speak the feedback
4. Auto-advance after 3 seconds

## 📋 Success Checklist

### Audio Working
- [ ] Play button starts audio
- [ ] Pause button stops audio
- [ ] Volume slider changes volume
- [ ] Each slide speaks automatically
- [ ] Questions are spoken aloud
- [ ] Feedback is spoken aloud

### UI Clean
- [ ] One content area visible at a time
- [ ] No overlapping popups
- [ ] Clear question/answer display
- [ ] Progress indicators work
- [ ] No console errors

### Student Experience
- [ ] Click play → lesson starts speaking
- [ ] Can pause and resume anytime
- [ ] Questions wait for answer
- [ ] Automatic progression through slides
- [ ] Clear visual + audio experience

## 🚀 Implementation Priority

### Phase 1: Get Audio Working (Most Critical)
1. Connect TTS to slide loading
2. Wire play/pause to audio element
3. Implement volume control
4. Test with all 6 variants

### Phase 2: Clean UI (User Experience)
1. Remove overlapping elements
2. Fix content display logic
3. Ensure single-focus presentation
4. Add loading indicators

### Phase 3: Polish (Professional)
1. Fix all 404 errors
2. Add smooth transitions
3. Implement progress saving
4. Add keyboard shortcuts

## 🎬 Definition of Done

A 5-year-old can:
1. Click play
2. Listen to the entire lesson
3. Answer questions by clicking
4. Hear feedback
5. Complete the lesson without help

**No technical knowledge required. Just click and learn.**
