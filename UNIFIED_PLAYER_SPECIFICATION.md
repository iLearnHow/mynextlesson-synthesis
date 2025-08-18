# iLearnHow Unified Player - Complete UI/UX Specification

## CORE PRINCIPLE
There is **ONE PLAYER** that shows today's lesson. No Universal vs Manifest distinction.

## DEFAULT USER JOURNEY
**Target User**: 40-year-old visiting ilearnhow.com
**Default State**: Not logged in, age 40, English US, neutral tone, Kelly avatar

## RIGHT RAIL ICON SYSTEM (Bottom to Top)

### **Bottom Right Corner Stack:**
1. **Menu Icon (+)** - Bottom corner, toggles entire rail visibility
2. **Play/Pause** - Liquid glass on white background, toggles lesson playback
3. **Volume** - Mute/unmute toggle + vertical slider (up/down from icon)
4. **Code Icon** - Shows all lesson variants/files

### **Vertical Rail Stack (when expanded):**
5. **Age Icon** - Dynamic number (2-102), shows current age state
6. **Language Icon** - "EN-US" format, shows current language
7. **Tone Icon** - "F"(Fun)/"W"(Warm)/"N"(Neutral) - shows current tone
8. **Model Icon** - Avatar switcher (Ken/Kelly/"You" coming soon)
9. **Calendar Icon** - Shows "Aug 15" format, date navigation
10. **Settings Icon** - Account, payment, preferences
11. **Find Icon** - Search lessons, generate new topics

## POPUP OVERLAY SYSTEM
**Behavior**: All rail icons (except play/pause/volume) open **same popup space**
**Coverage**: 35% of right screen with large padding next to icons
**Background**: White with dark text, drop shadows, iOS glass morphism
**Position**: Opens over avatar background (covers shoulder/hair area)

## LESSON CONTENT LAYOUT

### **Avatar Background**
- White background
- Avatar positioned center-screen
- Age-appropriate version of Ken/Kelly loads based on age slider

### **Question Layout**
- **Position**: Centered at Ken's tie level (lower deck under neck)
- **Format**: Static centered question + 2 options below
- **Support**: Both short and long text variants
- **Teaching Moments**: Each answer triggers teaching moment
- **Progression**: Play/pause button flash to continue between phases

### **Read-Along Captions**
- **Highlight**: Blue highlight over current word (NOT yellow)
- **Style**: Magnifying glass effect in liquid glass interface
- **Sync**: Phonemes match player state exactly

### **Phase Structure**
1. **Welcome**: Has A/B consent to proceed (not considered "today")
2. **Beginning/Middle/End**: Question phases with A/B choices
3. **Wisdom**: Centered, no options, ~3 sentences + lesson summary
4. **End State**: Points to "Find" or "Calendar" icons

## CRITICAL BEHAVIORS

### **No Autoplay Between Phases**
- **Control**: Everything controlled by play/pause button state
- **User Agency**: Learner controls progression completely

### **State Persistence**
- **Age Change**: Updates avatar image + lesson script instantly
- **Language Change**: Updates text + TTS language
- **Tone Change**: Updates script emotional delivery
- **Playback**: Continues if playing, pauses if paused during changes

### **Authentication States**
- **Logged Out**: Menu shows sign up/log in in upper right (10vh padding, 10% coverage)
- **Logged In**: Settings show account status, plan, payment, variant consistency

## MONETIZATION INTEGRATION
- **Individual Variant**: $4.99 to unlock for everyone forever
- **Universal Lesson**: $4,999 for all ages/languages/tones
- **Weekly Generation**: $4.99/week for unlimited custom topics
- **Sponsorship**: Contribute to "learner commons" for lesson improvements

## TECHNICAL REQUIREMENTS

### **Age Progression System**
- 2-102 year age slider
- Visual avatar changes for each age
- Script complexity adjusts per age bracket
- Real-time preview in age popup

### **Language System**
- Pre-computed lesson variants per language
- Phoneme mapping for each language pair
- Fallback to sponsorship for missing languages

### **Tone Delivery**
- Pre-computed emotional variants (Fun/Warm/Neutral)
- Script delivery style changes
- Teaching moment adaptation

### **Calendar System**
- 366-day curriculum (2025 base year)
- Leap year smart alignment for 2026+
- Month navigation with topic preview
- "Currently Playing" vs "Jump To" status

## DEMO LESSON REQUIREMENTS
**Goal**: Create ONE perfect lesson matching this specification exactly
**Content**: Choose from existing 366 topics that best fits this format
**Quality**: Must be approval-ready before any mass generation

## IMPLEMENTATION PRIORITIES
1. Document and validate specification ✅
2. Choose optimal demo topic from 366 curriculum
3. Create unified player architecture
4. Implement right rail icon system exactly as specified  
5. Build 35% right overlay popup system
6. Perfect read-along captions with blue highlight
7. Remove autoplay, implement play/pause control
8. Create age progression system
9. Polish one lesson to perfection for approval

**Status**: SPECIFICATION DOCUMENTED - Ready for surgical implementation
