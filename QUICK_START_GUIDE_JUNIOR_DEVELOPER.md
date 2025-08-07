# 🚀 Quick Start Guide - Junior Developer

## ⚡ **IMMEDIATE SETUP (5 minutes)**

### **1. Start Local Server**
```bash
# In your terminal, navigate to the project directory
cd /Users/nicolette/ilearn_how

# Start a local server
python -m http.server 8000
# OR if you have Node.js:
npx http-server
```

### **2. Open in Browser**
```
http://localhost:8000
```

### **3. Test Current State**
- Click the calendar icon - should show 366 days
- Click avatar icons - should switch between Kelly/Ken
- Click tone buttons - should change tone
- Click "Start Lesson" - **THIS IS BROKEN** (your first fix)

---

## 🎯 **FIRST TASK: Fix "Start Lesson" Button**

### **The Problem:**
When you click "Start Lesson", nothing happens. The lesson doesn't start.

### **The Fix:**
1. Open `index.html` in your code editor
2. Find the `startLesson()` function (around line 1600)
3. Look for this code:
```javascript
function startLesson() {
    // This function is broken
}
```

4. Fix it to actually start a lesson:
```javascript
function startLesson() {
    if (window.lessonPlayer) {
        window.lessonPlayer.startUniversalLesson();
    } else {
        console.error('Lesson player not initialized');
    }
}
```

### **Test Your Fix:**
1. Save the file
2. Refresh the browser
3. Click "Start Lesson"
4. **EXPECTED**: Should show lesson content

---

## 🔍 **DEBUGGING ESSENTIALS**

### **Browser Console (F12)**
- **Errors**: Red text = JavaScript errors
- **Logs**: Blue text = console.log() output
- **Network**: Check if files load properly

### **Common Issues:**
```javascript
// If you see this error:
"Uncaught TypeError: Cannot read property 'startUniversalLesson' of undefined"

// It means the lesson player isn't loaded. Check:
// 1. Are all .js files loading?
// 2. Is the lesson player initialized?
```

### **Quick Debug Commands:**
```javascript
// In browser console, type:
console.log(window.lessonPlayer); // Should show the lesson player object
console.log(window.lessonPlayer.startUniversalLesson); // Should show the function
```

---

## 📁 **CRITICAL FILES TO STUDY**

### **Start Here (in this order):**
1. **`index.html`** - Main interface (1799 lines)
   - Look for `startLesson()` function
   - Look for lesson content display area
   - Look for event handlers

2. **`complete-lesson-player.js`** - Lesson player (1181 lines)
   - Look for `startUniversalLesson()` method
   - Look for `showPhaseContent()` method
   - Look for `generateUniversalContent()` method

3. **`data/april_curriculum.json`** - Sample curriculum data
   - See how lesson data is structured
   - Understand the format

4. **`dna_files/001_dance_expression.json`** - DNA template
   - See how age-specific content is structured
   - Understand the variant system

---

## 🚨 **CRITICAL ISSUES TO FIX**

### **Issue 1: Lesson Content Display**
**Problem**: Lesson content doesn't show properly
**Location**: `index.html` around line 1056
**Fix**: Update `showLessonContent()` function

### **Issue 2: Audio Integration**
**Problem**: ElevenLabs not connected to lessons
**Location**: `complete-lesson-player.js`
**Fix**: Connect `generateAndPlayPhaseAudio()` to lesson phases

### **Issue 3: Variant Changes**
**Problem**: Changing avatar/tone/age doesn't affect content
**Location**: `complete-lesson-player.js`
**Fix**: Implement `onAvatarChange()`, `onToneChange()`, etc.

### **Issue 4: 5-Phase System**
**Problem**: Lesson doesn't progress through phases
**Location**: `complete-lesson-player.js`
**Fix**: Implement phase transitions in `playCurrentPhase()`

---

## 🧪 **TESTING CHECKLIST**

### **Basic Functionality:**
- [ ] Page loads without errors
- [ ] Calendar shows 366 days
- [ ] Avatar buttons work (Kelly/Ken)
- [ ] Tone buttons work (Neutral/Fun/Grandmother)
- [ ] Age selector works (10 age groups)
- [ ] Language selector works (12 languages)

### **Lesson Flow:**
- [ ] "Start Lesson" button works
- [ ] Lesson content displays
- [ ] Avatar updates during lesson
- [ ] Audio plays (if configured)
- [ ] Lesson progresses through phases

### **Variant System:**
- [ ] Changing avatar updates content
- [ ] Changing tone updates content
- [ ] Changing age updates content
- [ ] Changing language updates content

---

## 📞 **GETTING HELP**

### **If You're Stuck:**
1. **Check Console**: F12 → Console tab → Look for red errors
2. **Add Logging**: `console.log('Debug:', variable);`
3. **Test Incrementally**: Make small changes, test immediately
4. **Study the Code**: Read the existing functions carefully
5. **Use the Data**: Look at the curriculum and DNA files

### **Key Debugging Commands:**
```javascript
// In browser console:
console.log(window.lessonPlayer); // Check if lesson player exists
console.log(window.lessonPlayer.currentPhase); // Check current phase
console.log(window.lessonPlayer.currentVariant); // Check current variant
```

### **Files to Reference:**
- **`JUNIOR_DEVELOPER_HANDOFF_COMPLETE.md`** - Complete guide
- **`claude_cursor_constitution.md`** - Project overview
- **`data/`** - All curriculum files
- **`dna_files/`** - DNA templates

---

## ⚠️ **IMPORTANT REMINDERS**

### **DO NOT:**
- Claim success until a complete lesson works
- Ignore console errors
- Make big changes without testing
- Use placeholder content

### **DO:**
- Test every small change
- Check console constantly
- Study the existing code
- Use real curriculum data
- Test with multiple variants

---

## 🎯 **SUCCESS DEFINITION**

**You've succeeded when:**
1. User clicks "Start Lesson" → Lesson starts
2. Lesson shows real content (not placeholder)
3. Lesson progresses through 5 phases
4. Avatar changes appropriately
5. Variant changes affect content
6. Audio plays (if configured)
7. Calendar navigation works

**Remember: This is a complex system. Take it step by step!**

Good luck! 🚀 