# ICON STACK SYNCHRONIZATION PLAN

## CURRENT ICON STACK ANALYSIS

### Current Stack (Bottom to Top):
1. **☰ Hamburger Menu** - Menu system
2. **🔊 Speaker Controls** - Media controls
3. **🎭 Tone Controls** - Voice tone selection
4. **🌍 Language Controls** - Language selection
5. **👤 Avatar Controls** - Avatar selection
6. **📊 Age Controls** - Age slider
7. **📅 Calendar Picker** - Lesson selection

## ICON-BY-ICON FUNCTIONALITY PLAN

### 1. ☰ HAMBURGER MENU
**Purpose**: System menu and navigation
**Current State**: Basic menu overlay
**Enhanced Functionality**:
- **System Menu**: About, Help, Settings, Account
- **Lesson Navigation**: Quick access to lesson phases
- **Progress Overview**: Current lesson status
- **System Controls**: Audio, language, avatar settings

### 2. 🔊 SPEAKER CONTROLS (Media Controls)
**Purpose**: Unified media and lesson control
**Current State**: Basic media controls
**Enhanced Functionality**:
- **Lesson Playback**: Play/pause/advance lesson phases
- **Audio Controls**: Volume, speed, voice synthesis
- **Voice Selection**: Ken/Kelly voice switching
- **Lesson Progress**: Visual progress indicator
- **Auto-Advance**: Automatic phase progression

### 3. 🎭 TONE CONTROLS
**Purpose**: Voice character and delivery style
**Current State**: 3 tone options
**Enhanced Functionality**:
- **Real-time Switching**: Instant tone changes
- **Avatar Mood Sync**: Ken/Kelly expression changes
- **Content Adaptation**: Lesson content tone matching
- **Voice Synthesis**: ElevenLabs integration
- **Auto-Close**: Closes after 2 seconds (set-once)

### 4. 🌍 LANGUAGE CONTROLS
**Purpose**: Content localization and cultural adaptation
**Current State**: 6 language options
**Enhanced Functionality**:
- **12 Languages**: Full language support
- **Cultural Adaptation**: Content culturalization
- **Real-time Translation**: Instant content switching
- **Voice Localization**: Accent and pronunciation
- **Auto-Close**: Closes after 2 seconds (set-once)

### 5. 👤 AVATAR CONTROLS
**Purpose**: Avatar selection and customization
**Current State**: Basic avatar options
**Enhanced Functionality**:
- **Ken/Kelly Switching**: Instant avatar changes
- **Expression Sync**: Mood-based expressions
- **Custom Avatar**: "You" option with face scan
- **Voice Matching**: Avatar-specific voice synthesis
- **Auto-Close**: Closes after 2 seconds (set-once)

### 6. 📊 AGE CONTROLS
**Purpose**: Age-specific content adaptation
**Current State**: Age slider
**Enhanced Functionality**:
- **10 Age Buckets**: 2, 5, 8, 12, 16, 25, 40, 60, 80, 102
- **Content Adaptation**: Age-specific examples
- **Complexity Adjustment**: Cognitive level matching
- **Vocabulary Scaling**: Age-appropriate language
- **Auto-Close**: Closes after 2 seconds (set-once)

### 7. 📅 CALENDAR PICKER
**Purpose**: Lesson selection and navigation
**Current State**: Basic calendar overlay
**Enhanced Functionality**:
- **Year View**: 366 lessons overview
- **Month View**: Monthly lesson grid
- **Day View**: Individual lesson details
- **Progress Tracking**: Completion status
- **Quick Navigation**: Today's lesson highlight

## OVERLAY SYNCHRONIZATION SYSTEM

### Unified Overlay Management
```javascript
class UnifiedOverlaySystem {
    constructor() {
        this.activeOverlays = new Set();
        this.overlayZones = {
            'top-left': { x: 20, y: 20, width: 300, height: 200 },
            'top-right': { x: window.innerWidth - 320, y: 20, width: 300, height: 200 },
            'center-left': { x: 20, y: window.innerHeight/2 - 100, width: 300, height: 200 },
            'center-right': { x: window.innerWidth - 320, y: window.innerHeight/2 - 100, width: 300, height: 200 },
            'bottom-left': { x: 20, y: window.innerHeight - 220, width: 300, height: 200 },
            'bottom-right': { x: window.innerWidth - 320, y: window.innerHeight - 220, width: 300, height: 200 }
        };
        this.faceSafeZone = { x: 0.3, y: 0.2, width: 0.4, height: 0.3 };
    }

    // Open overlay with smart positioning
    openOverlay(overlayId, preferredZone = null) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;

        // Find available zone
        const zone = this.findAvailableZone(preferredZone);
        if (!zone) {
            console.warn('No available zone for overlay:', overlayId);
            return;
        }

        // Position overlay
        this.positionOverlay(overlay, zone);
        
        // Show overlay
        overlay.style.display = 'block';
        this.activeOverlays.add(overlayId);
        
        // Initialize draggable
        new DraggableOverlay(overlay);
        
        console.log(`✅ Overlay opened: ${overlayId} in zone: ${zone.name}`);
    }

    // Find available zone avoiding overlaps
    findAvailableZone(preferredZone = null) {
        const zones = Object.entries(this.overlayZones);
        
        // Try preferred zone first
        if (preferredZone && this.isZoneAvailable(preferredZone)) {
            return { name: preferredZone, ...this.overlayZones[preferredZone] };
        }
        
        // Find any available zone
        for (const [name, zone] of zones) {
            if (this.isZoneAvailable(name)) {
                return { name, ...zone };
            }
        }
        
        return null;
    }

    // Check if zone is available
    isZoneAvailable(zoneName) {
        // Check face-safe positioning
        if (this.overlapsFaceZone(this.overlayZones[zoneName])) {
            return false;
        }
        
        // Check other overlays
        for (const activeOverlay of this.activeOverlays) {
            const overlay = document.getElementById(activeOverlay);
            if (overlay && this.overlaps(overlay, this.overlayZones[zoneName])) {
                return false;
            }
        }
        
        return true;
    }

    // Position overlay in zone
    positionOverlay(overlay, zone) {
        overlay.style.left = `${zone.x}px`;
        overlay.style.top = `${zone.y}px`;
        overlay.style.zIndex = this.getNextZIndex();
    }

    // Close overlay
    closeOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = 'none';
            this.activeOverlays.delete(overlayId);
        }
    }

    // Close all overlays
    closeAllOverlays() {
        for (const overlayId of this.activeOverlays) {
            this.closeOverlay(overlayId);
        }
    }
}
```

## CALENDAR SYSTEM PLAN

### Calendar Architecture
```javascript
class CalendarSystem {
    constructor() {
        this.currentView = 'month'; // year, month, day
        this.currentYear = 2024;
        this.currentMonth = 1;
        this.currentDay = 1;
        this.lessons = this.generateLessonData();
    }

    // Generate 366 lessons data
    generateLessonData() {
        const lessons = {};
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        let dayCount = 1;
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = new Date(2024, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                lessons[dayCount] = {
                    day: dayCount,
                    month: month,
                    monthName: months[month - 1],
                    date: `${months[month - 1]} ${day}`,
                    topic: this.getLessonTopic(dayCount),
                    completed: false,
                    progress: 0
                };
                dayCount++;
            }
        }
        
        return lessons;
    }

    // Get lesson topic for day
    getLessonTopic(day) {
        const topics = [
            'Dance Expression', 'Creative Writing', 'Scientific Method',
            'Emotional Intelligence', 'Critical Thinking', 'Leadership',
            'Art Appreciation', 'Music Theory', 'Philosophy',
            'Mathematics', 'History', 'Literature'
        ];
        return topics[(day - 1) % topics.length];
    }

    // Render calendar view
    renderCalendar(view = 'month') {
        this.currentView = view;
        
        switch (view) {
            case 'year':
                this.renderYearView();
                break;
            case 'month':
                this.renderMonthView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    // Render year view
    renderYearView() {
        const calendarHTML = `
            <div class="calendar-year-view">
                <div class="calendar-header">
                    <button class="nav-btn" onclick="calendarSystem.previousYear()">◀</button>
                    <h2>${this.currentYear}</h2>
                    <button class="nav-btn" onclick="calendarSystem.nextYear()">▶</button>
                </div>
                <div class="year-grid">
                    ${this.generateYearGrid()}
                </div>
            </div>
        `;
        
        document.getElementById('calendar-content').innerHTML = calendarHTML;
    }

    // Render month view
    renderMonthView() {
        const calendarHTML = `
            <div class="calendar-month-view">
                <div class="calendar-header">
                    <button class="nav-btn" onclick="calendarSystem.previousMonth()">◀</button>
                    <h2>${this.getMonthName(this.currentMonth)} ${this.currentYear}</h2>
                    <button class="nav-btn" onclick="calendarSystem.nextMonth()">▶</button>
                </div>
                <div class="month-grid">
                    ${this.generateMonthGrid()}
                </div>
            </div>
        `;
        
        document.getElementById('calendar-content').innerHTML = calendarHTML;
    }

    // Render day view
    renderDayView() {
        const lesson = this.lessons[this.currentDay];
        const calendarHTML = `
            <div class="calendar-day-view">
                <div class="day-header">
                    <h3>${lesson.date}</h3>
                    <div class="lesson-topic">${lesson.topic}</div>
                </div>
                <div class="lesson-details">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${lesson.progress}%"></div>
                    </div>
                    <div class="lesson-status">
                        ${lesson.completed ? '✅ Completed' : '⏳ In Progress'}
                    </div>
                </div>
                <div class="day-actions">
                    <button class="start-lesson-btn" onclick="startLesson(${this.currentDay})">
                        ${lesson.completed ? 'Review Lesson' : 'Start Lesson'}
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('calendar-content').innerHTML = calendarHTML;
    }
}
```

## LESSON ELEMENT OVERLAY INTEGRATION

### Lesson Content Overlays
```javascript
class LessonElementOverlaySystem {
    constructor() {
        this.unifiedOverlaySystem = new UnifiedOverlaySystem();
        this.lessonElements = {
            'lesson-text': { zone: 'center-right', autoClose: false },
            'question': { zone: 'center-left', autoClose: false },
            'answer-choices': { zone: 'bottom-center', autoClose: true },
            'teaching-moment': { zone: 'center-right', autoClose: true },
            'fortune': { zone: 'center', autoClose: false }
        };
    }

    // Show lesson element overlay
    showLessonElement(elementType, content) {
        const config = this.lessonElements[elementType];
        if (!config) return;

        // Create or update overlay
        const overlayId = `lesson-${elementType}-overlay`;
        this.createLessonOverlay(overlayId, content, elementType);
        
        // Open with unified system
        this.unifiedOverlaySystem.openOverlay(overlayId, config.zone);
        
        // Auto-close if configured
        if (config.autoClose) {
            setTimeout(() => {
                this.unifiedOverlaySystem.closeOverlay(overlayId);
            }, 3000);
        }
    }

    // Create lesson overlay
    createLessonOverlay(overlayId, content, elementType) {
        const overlayHTML = `
            <div class="overlay-panel lesson-element-overlay" id="${overlayId}" style="display: none;">
                <div class="overlay-title-bar">
                    <div class="overlay-title">${this.getElementIcon(elementType)} ${this.getElementTitle(elementType)}</div>
                    <div class="overlay-controls">
                        <button class="overlay-minimize-btn" title="Minimize">−</button>
                        <button class="overlay-close-btn" title="Close">✕</button>
                    </div>
                </div>
                <div class="overlay-content">
                    ${content}
                </div>
            </div>
        `;
        
        // Add to DOM if not exists
        if (!document.getElementById(overlayId)) {
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
        } else {
            document.getElementById(overlayId).querySelector('.overlay-content').innerHTML = content;
        }
    }

    // Get element icon
    getElementIcon(elementType) {
        const icons = {
            'lesson-text': '📚',
            'question': '❓',
            'answer-choices': '🎯',
            'teaching-moment': '💡',
            'fortune': '🎉'
        };
        return icons[elementType] || '📄';
    }

    // Get element title
    getElementTitle(elementType) {
        const titles = {
            'lesson-text': 'Lesson Content',
            'question': 'Question',
            'answer-choices': 'Answer Choices',
            'teaching-moment': 'Teaching Moment',
            'fortune': 'Daily Fortune'
        };
        return titles[elementType] || 'Content';
    }
}
```

## IMPLEMENTATION PRIORITY

### Phase 1: Core Synchronization
1. **Unified Overlay System**: Implement smart positioning
2. **Face-Safe Zones**: Ensure no overlaps with Ken/Kelly
3. **Icon Functionality**: Complete all 7 icon features
4. **Auto-Close Logic**: Set-once overlays auto-close

### Phase 2: Calendar System
1. **Year View**: 366 lessons overview
2. **Month View**: Monthly lesson grid
3. **Day View**: Individual lesson details
4. **Progress Tracking**: Completion status

### Phase 3: Lesson Integration
1. **Lesson Element Overlays**: Sync with icon overlays
2. **Content Positioning**: Smart zone allocation
3. **Progress Synchronization**: Real-time updates
4. **State Management**: Unified overlay state

### Phase 4: Advanced Features
1. **Calendar Navigation**: Year/month/day switching
2. **Lesson Completion**: Progress tracking
3. **Overlay Animations**: Smooth transitions
4. **Error Handling**: Robust fallbacks

## SUCCESS CRITERIA

### Technical Requirements
- ✅ No overlapping overlays
- ✅ Face-safe positioning
- ✅ Unified overlay management
- ✅ Calendar year/month/day views
- ✅ Icon functionality completion
- ✅ Lesson element integration

### User Experience Requirements
- ✅ Seamless overlay transitions
- ✅ Intuitive calendar navigation
- ✅ Clear visual hierarchy
- ✅ Responsive design
- ✅ Consistent interactions

### Integration Requirements
- ✅ Icon overlays sync with lesson elements
- ✅ Calendar system integrates with lesson player
- ✅ Progress tracking across all systems
- ✅ State management across overlays 