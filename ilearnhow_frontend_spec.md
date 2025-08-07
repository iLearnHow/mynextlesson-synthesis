# iLearn How - Complete Frontend Design Guide

## 🎯 Core Experience Architecture

### Primary Interface
- **File**: Single `index.html` (951 lines optimized)
- **Experience**: Direct lesson player - user immediately sees today's lesson
- **Aspect Ratio**: 16:9 locked player with adaptive adjustments for mobile
- **Theme**: Pure white background (#ffffff) with Ken/Kelly avatar wallpapers
- **UI System**: Glass morphism overlays with face-safe positioning logic

## 🎨 Visual Design System

### Color Palette
```css
--primary-bg: #ffffff;           /* Pure white background */
--text-primary: #333333;         /* Dark gray text */
--text-secondary: #666666;       /* Medium gray text */
--accent-blue: #007AFF;          /* iOS-style blue */
--overlay-bg: rgba(255, 255, 255, 0.85); /* Glass morphism overlay */
--overlay-border: rgba(0, 0, 0, 0.1);    /* Subtle borders */
```

### Typography
- **Font Stack**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Heading Sizes**: 24px (title), 18px (section), 14px (body)
- **Line Height**: 1.6 for optimal readability

### Glass Morphism Specifications
- **Apple-like balance**: 20-25% white overlay opacity
- **Border Radius**: 12px for all overlay panels
- **Backdrop Filter**: blur(20px) where supported
- **Box Shadow**: 0 8px 32px rgba(0, 0, 0, 0.1)

## 🖼️ Avatar System

### Avatar Wallpaper Logic
- **Dynamic Switching**: Based on lesson content/mood + user preference
- **User Control**: Can toggle between Ken/Kelly anytime via avatar picker
- **Image Path**: `/lesson-player-deploy/assets/avatars/`
- **Transition**: 0.5s ease for smooth mood changes
- **Face-Safe Zones**: Smart anchoring - UI always anchors to edges, expands inward to safe boundary

### Avatar Options
1. **Kelly**: Primary female avatar with dynamic expressions
2. **Ken**: Primary male avatar with dynamic expressions  
3. **You**: Live face scan + voice training with lip-sync generation (paid feature)

## 🎮 UI Component Architecture

### Bottom-Right Icon Stack (Expanding Upward)
**Base Position**: Fixed bottom-right corner
**Expansion**: Icons appear above hamburger in vertical stack
**Styling**: Consistent glass morphism treatment for all overlays

#### Stack Order (Bottom to Top):
1. **Hamburger Menu** (Main Trigger)
2. **Audio Controls** (Separate moveable panel)
3. **New Lesson Generator**
4. **Lesson Controls Panel**
5. **Language Picker**
6. **Tone Picker**
7. **Age Slider**
8. **Avatar Picker**
9. **Calendar Lesson Picker**
10. **About Overlay**

### Individual Icon Specifications

#### 1. Hamburger Menu (Main Trigger)
- **Icon**: Classic 3-line hamburger that rotates to X when open
- **Behavior**: Toggles entire stack visibility
- **Animation**: 0.3s rotation transform

#### 2. Audio Controls Panel
- **Style**: Apple-style comprehensive panel
- **Position**: Separate from stack, moveable like sticky note
- **Default**: Open by default but closable
- **Controls**: Play, pause, rewind, speed, volume, progress bar
- **Behavior**: Can be dragged around screen for optimal positioning

#### 3. New Lesson Generator
- **Icon**: Sparkle/magic wand icon
- **Workflow**: 
  - Smart text input with topic suggestions/autocomplete
  - Topic validation for universal lesson compatibility
  - 24-hour generation process notification
  - Email/text/push notification when ready
  - Auto-adds to user's lesson library
- **Overlay**: Full-screen workflow interface

#### 4. Lesson Controls Panel
- **Style**: Apple-style rounded panel expanding downward
- **Integration**: Volume control integrated within panel
- **Controls**: Organized control groups for comprehensive lesson management

#### 5. Language Picker
- **Icon**: Translation/language symbol
- **Languages**: 12 languages (English, Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Arabic, Hindi, Russian, Dutch)
- **Display**: Button picker with language names in native script (no flags)
- **Behavior**: Instant switching with immediate content update

#### 6. Tone Picker
- **Display**: Emoji faces showing tone options
- **Options**: 😐 Neutral, 😄 Fun, 👵 Grandmother
- **Behavior**: Instant tone switching affects avatar mood and content delivery

#### 7. Age Slider
- **Range**: 2-102 years with 10 development-focused stops
- **Age Buckets**: 2, 5, 8, 12, 16, 25, 40, 60, 80, 102
- **Display**: Horizontal slider showing age numbers (no bucket names)
- **Behavior**: Instant content adaptation to selected age group

#### 8. Avatar Picker
- **Display**: Three circular profile pics (Kelly, Ken, You)
- **"You" Workflow**: 
  - Live face scan capture
  - Voice training session
  - Real-time avatar generation with lip-sync training
  - Paid service feature for teachers/students

#### 9. Calendar Lesson Picker
- **Display**: Mini calendar that expands to full year view
- **Functionality**: All 366 days clickable with pre-defined topics
- **Features**: 
  - Lesson completion status indicators
  - "Today" special highlighting
  - Month-by-month navigation
- **Integration**: Opens selected lesson immediately

#### 10. About Overlay
- **Display**: Single overlay with tabbed interface
- **Tabs**: About Us | How It Works | Upgrade Now | Contact Us
- **Special Treatment**: "Upgrade Now" tab with prominent styling
- **Content**: Complete app information and upgrade flows

## 🔧 Technical Implementation

### Core JavaScript Architecture
```javascript
// Core Files (Maintain existing structure)
complete-curriculum.js           // 365-day lesson data system
corrected-variant-generator-v2.js // Personalized content generation  
complete-lesson-player.js        // Main lesson orchestration
complete-elevenlabs-integration.js // Voice synthesis integration
```

### Face-Safe Positioning Logic
```javascript
// Smart UI positioning to avoid avatar faces
const getSafeZones = (avatarMood, screenSize) => {
  // Dynamic calculation based on avatar position and mood
  // Returns safe anchor points for UI elements
}

const positionOverlay = (element, safeZones) => {
  // Anchors UI to edges, expands inward to safe boundaries
  // Never covers avatar faces regardless of expression changes
}
```

### Glass Morphism Implementation
```css
.overlay-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Responsive 16:9 Logic
```css
.lesson-player {
  aspect-ratio: 16/9;
  width: 100%;
  max-width: 100vw;
  max-height: 100vh;
}

/* Mobile adaptations */
@media (max-width: 768px) {
  .lesson-player {
    /* Slight adjustments while maintaining 16:9 essence */
  }
}
```

## 🚀 Critical Development Rules

### NEVER
- Create new HTML pages (only enhance index.html)
- Create new lesson players (work within existing system)
- Use dark themes (always white theme)
- Cover avatar faces with UI elements
- Break 16:9 aspect ratio

### ALWAYS
- Integrate Ken/Kelly wallpapers as backgrounds
- Use glass morphism for all overlays
- Implement face-safe positioning logic
- Maintain Apple-like clean design principles
- Support instant variant switching (age, tone, language, avatar)

## 📱 User Experience Flow

### Initial Load
1. User lands directly in today's lesson player
2. Ken/Kelly avatar wallpaper loads based on lesson mood
3. Audio controls visible and ready (open by default)
4. Bottom-right hamburger stack collapsed initially

### Interaction Patterns
1. **Hamburger tap** → Stack expands upward revealing all icons
2. **Icon tap** → Corresponding overlay opens with glass morphism
3. **Variant changes** → Instant content/avatar updates
4. **Audio controls** → Draggable panel, always accessible
5. **Face-safe logic** → UI dynamically positions around avatar

### Overlay Behavior
- All overlays use consistent glass morphism styling
- Smart positioning to never obstruct avatar faces
- Smooth 0.3s transitions for open/close animations
- Tap outside overlay to close (standard UX pattern)

## 🎯 Success Metrics

### Technical Validation
- ✅ No JavaScript console errors
- ✅ No 404 server errors  
- ✅ White background visible
- ✅ Kelly/Ken wallpaper displayed
- ✅ 16:9 aspect ratio maintained
- ✅ All overlays positioned face-safe
- ✅ Glass morphism rendering correctly
- ✅ Instant variant switching functional

### User Experience Validation
- ✅ Immersive full-screen lesson experience
- ✅ Intuitive bottom-right stack navigation
- ✅ Smooth avatar mood transitions
- ✅ Professional Apple-like aesthetic
- ✅ Accessible high-contrast text
- ✅ Responsive across all devices

## 📋 Implementation Checklist

### Phase 1: Core Structure
- [ ] Set up single index.html with 16:9 container
- [ ] Implement white theme foundation
- [ ] Integrate Ken/Kelly avatar wallpaper system
- [ ] Build face-safe positioning logic

### Phase 2: Glass Morphism UI
- [ ] Create bottom-right hamburger stack
- [ ] Implement all 10 overlay components
- [ ] Add smooth expand/collapse animations
- [ ] Test face-safe positioning across avatar moods

### Phase 3: Interactive Features
- [ ] Wire up instant variant switching
- [ ] Implement draggable audio controls
- [ ] Connect calendar lesson picker
- [ ] Build new lesson generation workflow

### Phase 4: Advanced Features
- [ ] Integrate face scan + voice training workflow
- [ ] Implement 12-language instant switching
- [ ] Connect upgrade flow and payment integration
- [ ] Test complete user journey end-to-end

---

**Remember**: This is a complete learning experience, not just a website. Every element serves the educational mission while maintaining the highest standards of Apple-like design and engineering excellence.