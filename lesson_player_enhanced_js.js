/**
 * MyNextLesson Enhanced Lesson Player
 * Enterprise UI enhancements for 366-lesson synthesis integration
 * Provides seamless interaction with synthesis engine
 */

class LessonPlayerEnhanced {
    constructor() {
        this.synthesisEngine = null;
        this.currentLesson = null;
        this.isInitialized = false;
        this.performanceMetrics = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🎮 Initializing Enhanced Lesson Player...');
        
        // Wait for synthesis engine to be ready
        await this.waitForSynthesisEngine();
        
        // Enhance existing UI elements
        this.enhanceExistingUI();
        
        // Set up advanced event listeners
        this.setupAdvancedEventListeners();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Initialize with current lesson
        await this.syncWithSynthesisEngine();
        
        this.isInitialized = true;
        console.log('✅ Enhanced Lesson Player ready!');
    }

    async waitForSynthesisEngine() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.synthesisIntegration && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.synthesisIntegration) {
            console.error('❌ Synthesis engine not available');
            return;
        }
        
        this.synthesisEngine = window.synthesisIntegration;
        console.log('🔗 Connected to synthesis engine');
    }

    enhanceExistingUI() {
        // Add synthesis status indicator to existing elements
        this.addSynthesisIndicators();
        
        // Enhance existing lesson display areas
        this.enhanceLessonDisplay();
        
        // Add quick action buttons
        this.addQuickActions();
        
        // Add progress indicators
        this.addProgressIndicators();
        
        // Add accessibility enhancements
        this.addAccessibilityFeatures();
    }

    addSynthesisIndicators() {
        // Add visual feedback for synthesis operations
        const indicators = `
            <div class="synthesis-indicators">
                <div class="synthesis-speed" id="synthesis-speed">
                    <span class="label">Synthesis Speed:</span>
                    <span class="value" id="speed-value">--ms</span>
                </div>
                <div class="synthesis-quality" id="synthesis-quality">
                    <span class="label">Quality Score:</span>
                    <span class="value" id="quality-value">--</span>
                </div>
                <div class="lesson-count" id="lesson-count">
                    <span class="label">Lesson:</span>
                    <span class="value" id="current-lesson">-- of 366</span>
                </div>
            </div>
        `;
        
        // Insert into appropriate location (header, sidebar, or create floating)
        const header = document.querySelector('header') || document.querySelector('.header');
        if (header) {
            header.insertAdjacentHTML('beforeend', indicators);
        } else {
            document.body.insertAdjacentHTML('afterbegin', indicators);
        }
    }

    enhanceLessonDisplay() {
        // Add smooth transitions to existing content areas
        const contentAreas = [
            '#intro-text', '#concept-text', '#examples-text', '#reflection-text',
            '.lesson-intro', '.lesson-content', '.lesson-examples', '.lesson-reflection'
        ];
        
        contentAreas.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('enhanced-content');
                element.style.transition = 'all 0.3s ease';
            }
        });
        
        // Add loading states
        this.addLoadingStates();
    }

    addLoadingStates() {
        const loadingHTML = `
            <div class="loading-overlay" id="content-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Synthesizing your personalized lesson...</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    addQuickActions() {
        const quickActions = `
            <div class="quick-actions" id="quick-actions">
                <button class="quick-btn" id="random-lesson" title="Random Lesson">
                    🎲 Random
                </button>
                <button class="quick-btn" id="bookmark-lesson" title="Bookmark This Lesson">
                    ⭐ Save
                </button>
                <button class="quick-btn" id="share-lesson" title="Share This Lesson">
                    🔗 Share
                </button>
                <button class="quick-btn" id="print-lesson" title="Print Lesson">
                    🖨️ Print
                </button>
            </div>
        `;
        
        // Insert near synthesis controls or in appropriate location
        const controls = document.getElementById('synthesis-controls');
        if (controls) {
            controls.insertAdjacentHTML('afterend', quickActions);
        } else {
            document.body.insertAdjacentHTML('beforeend', quickActions);
        }
    }

    addProgressIndicators() {
        const progressHTML = `
            <div class="lesson-progress" id="lesson-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="yearly-progress" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span id="progress-label">Day 1 of 366</span>
                    <span id="progress-percentage">0%</span>
                </div>
            </div>
        `;
        
        const lessonArea = document.querySelector('.lesson-panel') || document.querySelector('.main-content');
        if (lessonArea) {
            lessonArea.insertAdjacentHTML('afterbegin', progressHTML);
        }
    }

    addAccessibilityFeatures() {
        // Add ARIA labels and enhanced keyboard navigation
        const synthesisControls = document.getElementById('synthesis-controls');
        if (synthesisControls) {
            synthesisControls.setAttribute('role', 'region');
            synthesisControls.setAttribute('aria-label', 'Lesson Personalization Controls');
        }
        
        // Add focus management
        this.setupFocusManagement();
        
        // Add screen reader announcements
        this.addScreenReaderSupport();
    }

    setupFocusManagement() {
        // Ensure proper tab order and focus visibility
        const focusableElements = [
            '#age-slider', '#tone-select', '#calendar-btn',
            '.quick-btn', '.calendar-day'
        ];
        
        focusableElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.addEventListener('focus', this.handleFocus.bind(this));
                element.addEventListener('blur', this.handleBlur.bind(this));
            });
        });
    }

    addScreenReaderSupport() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'sr-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        
        document.body.appendChild(liveRegion);
    }

    setupAdvancedEventListeners() {
        // Enhanced synthesis engine integration
        this.setupSynthesisEventListeners();
        
        // Quick action event listeners
        this.setupQuickActionListeners();
        
        // Advanced keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Performance monitoring events
        this.setupPerformanceListeners();
        
        // Auto-save and state management
        this.setupStateManagement();
    }

    setupSynthesisEventListeners() {
        // Listen for synthesis engine events
        if (this.synthesisEngine) {
            // Hook into synthesis updates
            const originalUpdateDisplay = this.synthesisEngine.updateDisplay.bind(this.synthesisEngine);
            this.synthesisEngine.updateDisplay = async () => {
                this.showLoadingState();
                const startTime = performance.now();
                
                try {
                    await originalUpdateDisplay();
                    const duration = performance.now() - startTime;
                    this.recordPerformanceMetric(duration);
                    this.updatePerformanceDisplay(duration);
                    this.announceToScreenReader('Lesson updated');
                } finally {
                    this.hideLoadingState();
                }
            };
            
            // Hook into day selection
            const originalSelectDay = this.synthesisEngine.selectDay.bind(this.synthesisEngine);
            this.synthesisEngine.selectDay = (day) => {
                originalSelectDay(day);
                this.updateProgress(day);
                this.updateLessonCounter(day);
                this.announceToScreenReader(`Selected day ${day}`);
            };
        }
    }

    setupQuickActionListeners() {
        // Random lesson
        const randomBtn = document.getElementById('random-lesson');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                const randomDay = Math.floor(Math.random() * 366) + 1;
                this.synthesisEngine?.selectDay(randomDay);
                this.announceToScreenReader(`Randomly selected day ${randomDay}`);
            });
        }
        
        // Bookmark lesson
        const bookmarkBtn = document.getElementById('bookmark-lesson');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                this.bookmarkCurrentLesson();
            });
        }
        
        // Share lesson
        const shareBtn = document.getElementById('share-lesson');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareCurrentLesson();
            });
        }
        
        // Print lesson
        const printBtn = document.getElementById('print-lesson');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printCurrentLesson();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch (e.key) {
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.getElementById('random-lesson')?.click();
                    }
                    break;
                case 'c':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.getElementById('calendar-btn')?.click();
                    }
                    break;
                case 'Escape':
                    this.closeModalOverlays();
                    break;
                case 'ArrowLeft':
                    if (e.altKey) {
                        e.preventDefault();
                        this.previousLesson();
                    }
                    break;
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        this.nextLesson();
                    }
                    break;
            }
        });
    }

    setupPerformanceListeners() {
        // Monitor synthesis performance
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
        
        // Monitor user engagement
        this.setupEngagementTracking();
    }

    setupStateManagement() {
        // Auto-save user preferences
        const ageSlider = document.getElementById('age-slider');
        const toneSelect = document.getElementById('tone-select');
        
        if (ageSlider) {
            ageSlider.addEventListener('change', () => {
                this.saveUserPreferences();
            });
        }
        
        if (toneSelect) {
            toneSelect.addEventListener('change', () => {
                this.saveUserPreferences();
            });
        }
        
        // Load saved preferences
        this.loadUserPreferences();
    }

    setupEngagementTracking() {
        let interactionCount = 0;
        let lastInteraction = Date.now();
        
        ['click', 'change', 'input'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
                lastInteraction = Date.now();
            });
        });
        
        // Track engagement metrics
        setInterval(() => {
            const timeSinceLastInteraction = Date.now() - lastInteraction;
            if (timeSinceLastInteraction < 30000) { // Active in last 30 seconds
                this.recordEngagementMetric(interactionCount);
                interactionCount = 0;
            }
        }, 30000);
    }

    // Performance and analytics methods
    recordPerformanceMetric(duration) {
        this.performanceMetrics.push({
            timestamp: Date.now(),
            duration,
            type: 'synthesis'
        });
        
        // Keep only last 100 metrics
        if (this.performanceMetrics.length > 100) {
            this.performanceMetrics.shift();
        }
    }

    updatePerformanceDisplay(duration) {
        const speedElement = document.getElementById('speed-value');
        if (speedElement) {
            speedElement.textContent = `${Math.round(duration)}ms`;
            
            // Color coding for performance
            speedElement.className = duration < 200 ? 'excellent' : 
                                   duration < 500 ? 'good' : 'slow';
        }
    }

    updateProgress(day) {
        const progressFill = document.getElementById('yearly-progress');
        const progressLabel = document.getElementById('progress-label');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (progressFill && progressLabel && progressPercentage) {
            const percentage = (day / 366) * 100;
            
            progressFill.style.width = `${percentage}%`;
            progressLabel.textContent = `Day ${day} of 366`;
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
    }

    updateLessonCounter(day) {
        const lessonCounter = document.getElementById('current-lesson');
        if (lessonCounter) {
            lessonCounter.textContent = `${day} of 366`;
        }
    }

    // User interaction methods
    showLoadingState() {
        const loadingOverlay = document.getElementById('content-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Add loading class to content areas
        document.querySelectorAll('.enhanced-content').forEach(el => {
            el.classList.add('loading');
        });
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('content-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Remove loading class
        document.querySelectorAll('.enhanced-content').forEach(el => {
            el.classList.remove('loading');
        });
    }

    bookmarkCurrentLesson() {
        if (!this.synthesisEngine) return;
        
        const currentDay = this.synthesisEngine.currentDay;
        const bookmarks = this.getBookmarks();
        
        if (!bookmarks.includes(currentDay)) {
            bookmarks.push(currentDay);
            this.saveBookmarks(bookmarks);
            this.announceToScreenReader('Lesson bookmarked');
            
            // Visual feedback
            const bookmarkBtn = document.getElementById('bookmark-lesson');
            if (bookmarkBtn) {
                bookmarkBtn.textContent = '⭐ Saved!';
                setTimeout(() => {
                    bookmarkBtn.textContent = '⭐ Save';
                }, 2000);
            }
        }
    }

    shareCurrentLesson() {
        if (!this.synthesisEngine) return;
        
        const { currentDay, currentParameters } = this.synthesisEngine;
        const url = new URL(window.location);
        url.searchParams.set('day', currentDay);
        url.searchParams.set('age', currentParameters.age);
        url.searchParams.set('tone', currentParameters.tone);
        
        if (navigator.share) {
            navigator.share({
                title: 'MyNextLesson - Personalized Learning',
                text: `Check out this personalized lesson for day ${currentDay}!`,
                url: url.toString()
            });
        } else {
            navigator.clipboard.writeText(url.toString()).then(() => {
                this.announceToScreenReader('Lesson link copied to clipboard');
                
                const shareBtn = document.getElementById('share-lesson');
                if (shareBtn) {
                    shareBtn.textContent = '🔗 Copied!';
                    setTimeout(() => {
                        shareBtn.textContent = '🔗 Share';
                    }, 2000);
                }
            });
        }
    }

    printCurrentLesson() {
        window.print();
        this.announceToScreenReader('Print dialog opened');
    }

    previousLesson() {
        if (!this.synthesisEngine) return;
        
        const prevDay = Math.max(1, this.synthesisEngine.currentDay - 1);
        this.synthesisEngine.selectDay(prevDay);
    }

    nextLesson() {
        if (!this.synthesisEngine) return;
        
        const nextDay = Math.min(366, this.synthesisEngine.currentDay + 1);
        this.synthesisEngine.selectDay(nextDay);
    }

    closeModalOverlays() {
        const overlays = ['#calendar-overlay'];
        overlays.forEach(selector => {
            const overlay = document.querySelector(selector);
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    }

    // Accessibility methods
    handleFocus(e) {
        e.target.classList.add('focus-visible');
    }

    handleBlur(e) {
        e.target.classList.remove('focus-visible');
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('sr-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // Data persistence methods
    saveUserPreferences() {
        if (!this.synthesisEngine) return;
        
        const preferences = {
            age: this.synthesisEngine.currentParameters.age,
            tone: this.synthesisEngine.currentParameters.tone,
            lastDay: this.synthesisEngine.currentDay,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('mynextlesson-preferences', JSON.stringify(preferences));
        } catch (e) {
            console.warn('Could not save preferences:', e);
        }
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('mynextlesson-preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Apply saved preferences
                const ageSlider = document.getElementById('age-slider');
                const toneSelect = document.getElementById('tone-select');
                
                if (ageSlider && preferences.age) {
                    ageSlider.value = preferences.age;
                    document.getElementById('age-display').textContent = preferences.age;
                }
                
                if (toneSelect && preferences.tone) {
                    toneSelect.value = preferences.tone;
                }
                
                // Update synthesis engine if available
                if (this.synthesisEngine) {
                    this.synthesisEngine.currentParameters.age = preferences.age || 25;
                    this.synthesisEngine.currentParameters.tone = preferences.tone || 'fun';
                }
            }
        } catch (e) {
            console.warn('Could not load preferences:', e);
        }
    }

    getBookmarks() {
        try {
            const saved = localStorage.getItem('mynextlesson-bookmarks');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveBookmarks(bookmarks) {
        try {
            localStorage.setItem('mynextlesson-bookmarks', JSON.stringify(bookmarks));
        } catch (e) {
            console.warn('Could not save bookmarks:', e);
        }
    }

    // Monitoring and analytics
    updatePerformanceMetrics() {
        if (this.performanceMetrics.length === 0) return;
        
        const recent = this.performanceMetrics.slice(-10);
        const avgDuration = recent.reduce((sum, metric) => sum + metric.duration, 0) / recent.length;
        
        // Update quality indicator
        const qualityElement = document.getElementById('quality-value');
        if (qualityElement) {
            const quality = avgDuration < 200 ? 'Excellent' : 
                           avgDuration < 500 ? 'Good' : 'Needs Optimization';
            qualityElement.textContent = quality;
        }
    }

    recordEngagementMetric(interactionCount) {
        // Record engagement for analytics
        console.log(`Engagement: ${interactionCount} interactions in 30s`);
    }

    async syncWithSynthesisEngine() {
        if (!this.synthesisEngine) return;
        
        // Sync current state
        const currentDay = this.synthesisEngine.currentDay || 1;
        this.updateProgress(currentDay);
        this.updateLessonCounter(currentDay);
        
        // Load any URL parameters
        this.loadURLParameters();
    }

    loadURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const day = urlParams.get('day');
        const age = urlParams.get('age');
        const tone = urlParams.get('tone');
        
        if (day && this.synthesisEngine) {
            this.synthesisEngine.selectDay(parseInt(day));
        }
        
        if (age) {
            const ageSlider = document.getElementById('age-slider');
            if (ageSlider) {
                ageSlider.value = age;
                document.getElementById('age-display').textContent = age;
            }
        }
        
        if (tone) {
            const toneSelect = document.getElementById('tone-select');
            if (toneSelect) {
                toneSelect.value = tone;
            }
        }
    }

    initializePerformanceMonitoring() {
        // Monitor page performance
        if ('performance' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
                        console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
                    }
                }
            });
            
            try {
                observer.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (e) {
                console.warn('Performance monitoring not supported');
            }
        }
    }

    // Public API methods
    getCurrentLesson() {
        return this.currentLesson;
    }

    getPerformanceMetrics() {
        return {
            synthesisTimes: this.performanceMetrics,
            averageTime: this.performanceMetrics.length > 0 ? 
                this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length : 0
        };
    }

    isReady() {
        return this.isInitialized && this.synthesisEngine !== null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Enhanced Lesson Player...');
    window.lessonPlayerEnhanced = new LessonPlayerEnhanced();
});

// Export for external use
window.LessonPlayerEnhanced = LessonPlayerEnhanced;