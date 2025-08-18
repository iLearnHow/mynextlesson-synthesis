/**
 * Unified Player Controls - Surgical Implementation
 * Implements exact UI specification for iLearnHow player
 */

class UnifiedPlayerControls {
    constructor() {
        this.currentState = {
            age: 40,
            language: 'EN-US',
            tone: 'neutral',
            avatar: 'kelly',
            isPlaying: false,
            volume: 1.0,
            isMuted: false
        };
        
        this.currentLesson = null;
        this.useHeygen = false;
        this.railVisible = true;
        this.popupVisible = false;
        this.currentSlideIndex = 0;
        this._ttsRequestId = 0;
        this._activeObjectUrl = null;
        
        this.init();
    }

    init() {
        console.log('🎯 Initializing Unified Player Controls');
        try { const qp = new URLSearchParams(location.search); this.useHeygen = qp.get('useHeygen') === '1'; } catch {}
        this.setupBottomControls();
        this.setupRightRail();
        this.setupPopupSystem();
        this.loadDefaultLesson();
        this.updateUIState();
        this.enableSlideDots();
        // Player event hooks to keep narration in sync
        try {
            if (window.ManifestPlayer && typeof window.ManifestPlayer.on === 'function') {
                window.ManifestPlayer.on('slide_started', (ev)=>{ try { this.currentSlideIndex = ev?.slide_index ?? this.currentSlideIndex; this.generateAndPlayNarrationForCurrentSlide(); } catch {} });
            }
        } catch {}
        try {
            window.addEventListener('ml:lesson_loaded', ()=>{ try { this.generateAndPlayNarrationForCurrentSlide(); } catch {} });
        } catch {}
        // Global start hook for static overlay button
        window.__mlStart = () => {
            try { document.getElementById('start-overlay').style.display = 'none'; } catch {}
            this.currentState.isPlaying = true;
            try { window.ManifestPlayer?.play?.(); } catch {}
            try { window.lessonPlayer?.startUniversalLesson?.(); } catch {}
            console.log('🎯 Start pressed: playing = true');
            // Optional phoneme test path
            if (this.useHeygen) { this.tryPhonemeTest().catch(()=>{}); }
        };
    }

    /**
     * Setup bottom control stack functionality
     */
    setupBottomControls() {
        // Menu toggle - controls rail visibility (guarded)
        const menuBtn = document.getElementById('menu-toggle'); if (!menuBtn) { console.warn('menu-toggle not found'); return; }
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.toggleMenuFan();
            // spin animation to indicate control
            menuBtn.style.transition = 'transform .35s ease';
            const spun = menuBtn.dataset.spun === '1';
            menuBtn.style.transform = spun ? 'rotate(0deg)' : 'rotate(225deg)';
            menuBtn.dataset.spun = spun ? '0' : '1';
        });
        // Safety: global hotkey "m" toggles menu
        try { document.addEventListener('keydown', (ev)=>{ if (ev.key.toLowerCase()==='m') this.toggleMenuFan(); }); } catch{}

        // Play/Pause master control - exact specification behavior
        document.getElementById('play-pause-master').addEventListener('click', () => {
            this.togglePlayback();
        });

        // Volume controls
        const volumeToggle = document.getElementById('volume-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        // Initialize icon based on current muted state and subscribe to AudioBus for external changes
        try {
            volumeToggle.textContent = this.currentState.isMuted ? '🔇' : '🔊';
            volumeToggle.title = this.currentState.isMuted ? 'Unmute' : 'Mute';
            if (window.AudioBus && typeof window.AudioBus.subscribe === 'function') {
                window.AudioBus.subscribe(({ muted }) => {
                    try {
                        this.currentState.isMuted = !!muted;
                        volumeToggle.textContent = muted ? '🔇' : '🔊';
                        volumeToggle.title = muted ? 'Unmute' : 'Mute';
                    } catch {}
                });
            }
        } catch {}

        volumeToggle.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Volume slider show/hide on double-click
        volumeToggle.addEventListener('dblclick', () => {
            volumeSlider.classList.toggle('hidden');
            volumeSlider.classList.toggle('visible');
        });
        // Always position volume group adjacent to menu button with spacing
        try{ document.querySelector('.volume-group').style.marginRight='0'; } catch{}
        // hide secondary bottom controls initially and align in a neat row
        Array.from(document.querySelectorAll('.bottom-right-control-stack .ctl')).forEach(el=>{ el.style.display='none'; el.style.marginRight='12px'; });
        
        volumeSlider.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.setVolume(v);
            try { window.AudioBus?.setVolume?.(v); } catch {}
        });

        // Code viewer - shows all lesson variants
        document.getElementById('code-viewer').addEventListener('click', () => {
            this.openPopup('code', 'Code & Variants', this.generateCodeContent());
        });
    }

    /**
     * Setup right rail icon functionality
     */
    setupRightRail() {
        // Age control - 2-102 slider
        document.getElementById('age-control').addEventListener('click', () => {
            this.openPopup('age', 'Age Selection', this.generateAgeContent());
        });

        // Language control - all available languages
        document.getElementById('language-control').addEventListener('click', () => {
            this.openPopup('language', 'Language Selection', this.generateLanguageContent());
        });

        // Tone control - Fun/Warm/Neutral
        document.getElementById('tone-control').addEventListener('click', () => {
            this.openPopup('tone', 'Tone Selection', this.generateToneContent());
        });

        // Model/Avatar control - Kelly/Ken
        document.getElementById('model-control').addEventListener('click', () => {
            this.openPopup('model', 'Avatar Selection', this.generateAvatarContent());
        });

        // Calendar control - 366 day navigation
        document.getElementById('calendar-control').addEventListener('click', () => {
            this.openPopup('calendar', 'Calendar & Lessons', this.generateCalendarContent());
        });

        // Settings control - account, preferences
        document.getElementById('settings-control').addEventListener('click', () => {
            this.openPopup('settings', 'Settings', this.generateSettingsContent());
        });

        // Find control - search and generate lessons
        document.getElementById('find-control').addEventListener('click', () => {
            this.openPopup('find', 'Find Lessons', this.generateFindContent());
        });

        // Replace Model icon with avatar image if available
        this.renderModelIcon();
    }

    /**
     * Setup 35% right overlay popup system
     */
    setupPopupSystem() {
        const overlay = document.getElementById('unified-popup-overlay');
        const closeBtn = document.getElementById('overlay-close');

        closeBtn.addEventListener('click', () => {
            this.closePopup();
        });

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closePopup();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popupVisible) {
                this.closePopup();
            }
        });
    }

    /**
     * Toggle rail visibility when menu is clicked
     */
    toggleRailVisibility() {
        const rail = document.getElementById('unified-rail');
        this.railVisible = !this.railVisible;
        
        if (this.railVisible) {
            rail.classList.remove('collapsed');
        } else {
            rail.classList.add('collapsed');
            this.closePopup(); // Close any open popups
        }
        
        console.log(`🎯 Rail visibility: ${this.railVisible ? 'visible' : 'hidden'}`);
    }

    /**
     * Menu fan-out: bottom controls and right rail appear/disappear
     */
    toggleMenuFan(){
        const body = document.body;
        const open = !body.classList.contains('menu-open');
        if (open){
            body.classList.add('menu-open');
            // reveal bottom controls with stagger
            const ctrls = Array.from(document.querySelectorAll('.bottom-right-control-stack .ctl'));
            ctrls.forEach((el, i)=>{ el.style.display='flex'; el.style.transform='translateX(-10px)'; el.style.opacity='0'; setTimeout(()=>{ el.style.transition='all .18s ease'; el.style.transform='translateX(0)'; el.style.opacity='1'; }, i*50); });
            // show right rail
            try{ document.getElementById('unified-rail').style.visibility='visible'; document.getElementById('unified-rail').style.opacity='1'; } catch{}
        } else {
            body.classList.remove('menu-open');
            const ctrls = Array.from(document.querySelectorAll('.bottom-right-control-stack .ctl'));
            ctrls.reverse().forEach((el, i)=>{ setTimeout(()=>{ el.style.transform='translateX(10px)'; el.style.opacity='0'; }, i*40); setTimeout(()=>{ el.style.display='none'; el.style.transition=''; }, 220 + i*40); });
            // hide right rail is handled by CSS body.menu-open toggle
        }
    }

    /**
     * Toggle playback - exact specification (manual control only)
     */
    togglePlayback() {
        this.currentState.isPlaying = !this.currentState.isPlaying;
        const btn = document.getElementById('play-pause-master');
        
        if (this.currentState.isPlaying) {
            btn.textContent = '⏸';
            btn.title = 'Pause';
            this.startLessonPlayback();
        } else {
            btn.textContent = '▶';
            btn.title = 'Play';
            this.pauseLessonPlayback();
            try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch {}
        }
        
        console.log(`🎯 Playback: ${this.currentState.isPlaying ? 'playing' : 'paused'}`);
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.currentState.isMuted = !this.currentState.isMuted;
        const btn = document.getElementById('volume-toggle');
        
        if (this.currentState.isMuted) {
            btn.textContent = '🔇';
            btn.title = 'Unmute';
            this.setVolume(0);
            try { window.AudioBus?.mute?.(true); } catch {}
        } else {
            btn.textContent = '🔊';
            btn.title = 'Mute';
            this.setVolume(this.currentState.volume);
            try { window.AudioBus?.mute?.(false); } catch {}
        }
        
        console.log(`🎯 Mute: ${this.currentState.isMuted}`);
    }

    /**
     * Set volume level
     */
    setVolume(level) {
        this.currentState.volume = Math.max(0, Math.min(1, level));
        try {
            const audio = document.getElementById('tts-audio');
            if (audio) {
                audio.volume = this.currentState.isMuted ? 0 : this.currentState.volume;
            }
            if (window.ManifestPlayer && typeof window.ManifestPlayer._audio?.setVolume === 'function') {
                try { window.ManifestPlayer._audio.setVolume(this.currentState.isMuted ? 0 : this.currentState.volume); } catch {}
            }
            if (window.lessonPlayer && typeof window.lessonPlayer.setVolume === 'function') {
                try { window.lessonPlayer.setVolume(this.currentState.isMuted ? 0 : this.currentState.volume); } catch {}
            }
        } catch {}
        console.log(`🎯 Volume: ${this.currentState.volume}`);
    }

    /**
     * Open popup with specific content
     */
    openPopup(type, title, content) {
        const overlay = document.getElementById('unified-popup-overlay');
        const titleEl = document.getElementById('overlay-title');
        const bodyEl = document.getElementById('overlay-body');
        const cardEl = document.getElementById('overlay-card');

        titleEl.textContent = title;
        bodyEl.innerHTML = content;
        
        // Position rules to avoid covering avatar face (keep below eye-line and right of center)
        try {
            if (cardEl) {
                const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                // target 58% down the viewport, aligned to the right rail
                cardEl.style.top = Math.round(vh * 0.58) + 'px';
                cardEl.style.transform = 'translateY(-50%)';
            }
        } catch {}

        overlay.classList.add('visible');
        this.popupVisible = true;
        
        // Set active state on clicked rail button
        document.querySelectorAll('.rail-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${type}-control`)?.classList.add('active');
        
        console.log(`🎯 Popup opened: ${type}`);
    }

    /**
     * Close popup
     */
    closePopup() {
        const overlay = document.getElementById('unified-popup-overlay');
        overlay.classList.remove('visible');
        this.popupVisible = false;
        
        // Remove active states
        document.querySelectorAll('.rail-btn').forEach(btn => btn.classList.remove('active'));
        
        console.log('🎯 Popup closed');
    }

    /**
     * Generate age selection content with 2-102 slider
     */
    generateAgeContent() {
        return `
            <div style="margin-bottom: 20px;">
                <label for="age-slider" style="display: block; margin-bottom: 10px; font-weight: 600;">
                    Age: ${this.currentState.age} years old
                </label>
                <input type="range" id="age-slider" min="2" max="102" value="${this.currentState.age}" 
                       style="width: 100%; margin: 10px 0;" 
                       oninput="window.unifiedControls.updateAge(this.value)">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                    <span>2</span><span>25</span><span>40</span><span>60</span><span>80</span><span>102</span>
                </div>
            </div>
            <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.05); border-radius: 12px;">
                <p><strong>Avatar Changes:</strong> Kelly and Ken age visually as you adjust the slider.</p>
                <p><strong>Content Adapts:</strong> Lesson complexity and vocabulary adjust to age-appropriate levels.</p>
            </div>
            <div style="margin: 20px 0;">
                <button onclick="window.unifiedControls.sponsorVariant('age')" 
                        style="padding: 10px 20px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Sponsor this age variant for $4.99
                </button>
            </div>
        `;
    }

    /**
     * Generate language selection content
     */
    generateLanguageContent() {
        const languages = [
            { code: 'EN-US', name: 'English (United States)', available: true },
            { code: 'ES-ES', name: 'Spanish (Spain)', available: true },
            { code: 'FR-FR', name: 'French (France)', available: true },
            { code: 'DE-DE', name: 'German (Germany)', available: false },
            { code: 'ZH-CN', name: 'Chinese (Simplified)', available: false },
            { code: 'JA-JP', name: 'Japanese (Japan)', available: false }
        ];
        
        let content = '<div style="margin-bottom: 20px;">';
        languages.forEach(lang => {
            const isSelected = this.currentState.language === lang.code;
            const availability = lang.available ? 'available' : 'sponsor-needed';
            
            content += `
                <div style="margin: 10px 0; padding: 12px; border-radius: 8px; 
                           background: ${isSelected ? '#007AFF' : 'rgba(0,0,0,0.05)'}; 
                           color: ${isSelected ? 'white' : '#333'}; cursor: pointer;"
                     onclick="window.unifiedControls.changeLanguage('${lang.code}', ${lang.available})">
                    <strong>${lang.name}</strong>
                    <div style="font-size: 12px; margin-top: 4px;">
                        ${lang.available ? '✅ Available' : '💰 Sponsor for $4.99'}
                    </div>
                </div>
            `;
        });
        content += '</div>';
        
        return content;
    }

    /**
     * Generate tone selection content
     */
    generateToneContent() {
        const tones = [
            { id: 'neutral', name: 'Neutral', icon: 'N', description: 'Clear, informative delivery' },
            { id: 'fun', name: 'Fun', icon: 'F', description: 'Enthusiastic, engaging style' },
            { id: 'grandmother', name: 'Warm', icon: 'W', description: 'Nurturing, gentle approach' }
        ];
        
        let content = '<div style="margin-bottom: 20px;">';
        tones.forEach(tone => {
            const isSelected = this.currentState.tone === tone.id;
            content += `
                <div style="margin: 10px 0; padding: 15px; border-radius: 8px; 
                           background: ${isSelected ? '#007AFF' : 'rgba(0,0,0,0.05)'}; 
                           color: ${isSelected ? 'white' : '#333'}; cursor: pointer; 
                           display: flex; align-items: center; gap: 15px;"
                     onclick="window.unifiedControls.changeTone('${tone.id}')">
                    <div style="width: 40px; height: 40px; border-radius: 50%; 
                               background: ${isSelected ? 'rgba(255,255,255,0.2)' : '#007AFF'}; 
                               color: ${isSelected ? 'white' : 'white'}; 
                               display: flex; align-items: center; justify-content: center; 
                               font-weight: bold; font-size: 16px;">
                        ${tone.icon}
                    </div>
                    <div>
                        <strong>${tone.name}</strong>
                        <div style="font-size: 14px; opacity: 0.8; margin-top: 2px;">
                            ${tone.description}
                        </div>
                    </div>
                </div>
            `;
        });
        content += '</div>';
        
        return content;
    }

    /**
     * Generate avatar/model selection content
     */
    generateAvatarContent() {
        const avatars = [
            { id: 'kelly', name: 'Kelly', emoji: '👩', description: 'Professional, approachable teacher' },
            { id: 'ken', name: 'Ken', emoji: '👨', description: 'Knowledgeable, friendly educator' },
            { id: 'you', name: 'You', emoji: '🎭', description: 'Coming soon - your custom avatar' }
        ];
        
        let content = '<div style="margin-bottom: 20px;">';
        avatars.forEach(avatar => {
            const isSelected = this.currentState.avatar === avatar.id;
            const isAvailable = avatar.id !== 'you';
            
            content += `
                <div style="margin: 10px 0; padding: 15px; border-radius: 8px; 
                           background: ${isSelected ? '#007AFF' : 'rgba(0,0,0,0.05)'}; 
                           color: ${isSelected ? 'white' : '#333'}; 
                           cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                           opacity: ${isAvailable ? '1' : '0.6'};
                           display: flex; align-items: center; gap: 15px;"
                     ${isAvailable ? `onclick="window.unifiedControls.changeAvatar('${avatar.id}')"` : ''}>
                    <div style="font-size: 32px;">${avatar.emoji}</div>
                    <div>
                        <strong>${avatar.name}</strong>
                        <div style="font-size: 14px; opacity: 0.8; margin-top: 2px;">
                            ${avatar.description}
                        </div>
                    </div>
                </div>
            `;
        });
        content += '</div>';
        
        return content;
    }

    /**
     * Generate code viewer content
     */
    generateCodeContent() {
        return `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Current Lesson Variants</h3>
                <div style="background: #1d1d1f; color: #fff; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px;">
                    <div>📚 Lesson: "The Sun - Our Star" (Day 1)</div>
                    <div>👤 Avatar: ${this.currentState.avatar}</div>
                    <div>🎯 Age: ${this.currentState.age}</div>
                    <div>🎵 Tone: ${this.currentState.tone}</div>
                    <div>🌍 Language: ${this.currentState.language}</div>
                    <div style="margin-top: 10px; color: #5AC8FA;">
                        ✅ 5 phases loaded<br>
                        ✅ Q&A interactions ready<br>
                        ✅ Teaching moments active<br>
                        ✅ Avatar expressions loaded
                    </div>
                </div>
            </div>
            <div style="margin: 15px 0;">
                <button onclick="window.unifiedControls.downloadVariants()" 
                        style="padding: 10px 20px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                    Download All Variants
                </button>
                <button onclick="window.unifiedControls.validateLesson()" 
                        style="padding: 10px 20px; background: #34C759; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Validate Lesson
                </button>
            </div>
        `;
    }

    /**
     * Generate calendar content
     */
    generateCalendarContent() {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
        
        return `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3>${currentMonth} 2025</h3>
                    <div style="font-size: 14px; color: #666;">Day ${currentDay}</div>
                </div>
                <div style="padding: 15px; background: rgba(0,0,0,0.05); border-radius: 12px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div>
                            <strong>Currently Playing:</strong><br>
                            The Sun - Our Star
                        </div>
                        <button style="padding: 8px 16px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Jump to Today
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 15px;">
                    ${this.generateCalendarDays()}
                </div>
                <div style="text-align: center;">
                    <button onclick="window.unifiedControls.navigateMonth(-1)" 
                            style="padding: 8px 12px; margin: 0 5px; background: rgba(0,0,0,0.1); border: none; border-radius: 6px; cursor: pointer;">‹ Prev</button>
                    <button onclick="window.unifiedControls.navigateMonth(1)" 
                            style="padding: 8px 12px; margin: 0 5px; background: rgba(0,0,0,0.1); border: none; border-radius: 6px; cursor: pointer;">Next ›</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate calendar days
     */
    generateCalendarDays() {
        let days = '';
        for (let day = 1; day <= 31; day++) {
            const isToday = day === 15; // Aug 15 as example
            days += `
                <div style="padding: 8px; text-align: center; border-radius: 4px; 
                           background: ${isToday ? '#007AFF' : 'rgba(0,0,0,0.05)'}; 
                           color: ${isToday ? 'white' : '#333'}; 
                           cursor: pointer; font-size: 12px;"
                     onclick="window.unifiedControls.jumpToDay(${day})">
                    ${day}
                </div>
            `;
        }
        return days;
    }

    /**
     * Generate settings content
     */
    generateSettingsContent() {
        return `
            <div style="margin-bottom: 20px;">
                <div style="margin: 20px 0;">
                    <h4 style="margin-bottom: 10px;">Account Status</h4>
                    <div style="padding: 15px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                        <div style="margin: 5px 0;">Status: <strong>Not logged in</strong></div>
                        <div style="margin: 15px 0;">
                            <button style="padding: 8px 16px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                                Sign Up
                            </button>
                            <button style="padding: 8px 16px; background: rgba(0,0,0,0.1); border: none; border-radius: 6px; cursor: pointer;">
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
                <div style="margin: 20px 0;">
                    <h4 style="margin-bottom: 10px;">Preferences</h4>
                    <div style="padding: 15px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                        <div style="margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span>Teaching Persona Consistency</span>
                            <input type="checkbox" checked>
                        </div>
                        <div style="margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span>Auto-save Progress</span>
                            <input type="checkbox" checked>
                        </div>
                        <div style="margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span>Blue Caption Highlighting</span>
                            <input type="checkbox" checked>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate find lessons content
     */
    generateFindContent() {
        return `
            <div style="margin-bottom: 20px;">
                <input type="text" placeholder="Search 366 lesson topics..." 
                       style="width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; font-size: 16px; margin-bottom: 15px;">
                <div style="margin: 15px 0;">
                    <h4 style="margin-bottom: 10px;">Recent Lessons</h4>
                    <div style="padding: 10px; background: rgba(0,0,0,0.05); border-radius: 6px; margin: 5px 0; cursor: pointer;">
                        🌞 The Sun - Our Star (Currently Playing)
                    </div>
                    <div style="padding: 10px; background: rgba(0,0,0,0.05); border-radius: 6px; margin: 5px 0; cursor: pointer;">
                        🧮 Mathematics - Language of Patterns
                    </div>
                    <div style="padding: 10px; background: rgba(0,0,0,0.05); border-radius: 6px; margin: 5px 0; cursor: pointer;">
                        ⚗️ Chemistry - Science of Matter
                    </div>
                </div>
                <div style="margin: 20px 0; padding: 15px; background: rgba(52, 199, 89, 0.1); border-radius: 8px;">
                    <h4 style="color: #34C759; margin-bottom: 10px;">Generate New Topics</h4>
                    <p style="margin-bottom: 10px;">Create unlimited custom lessons for any topic</p>
                    <button style="padding: 10px 20px; background: #34C759; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Subscribe for $4.99/week
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Update age and trigger avatar/content changes
     */
    updateAge(newAge) {
        this.currentState.age = parseInt(newAge);
        document.getElementById('age-control').textContent = newAge;
        document.getElementById('age-control').title = `Age: ${newAge} years old`;
        
        // Update lesson content for new age
        this.adaptContentForAge(newAge);
        try { window.lessonPlayer?.onAgeChange?.(`age_${newAge}`); } catch {}
        try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        
        console.log(`🎯 Age updated to: ${newAge}`);
    }

    /**
     * Change language and update content
     */
    changeLanguage(langCode, isAvailable) {
        if (!isAvailable) {
            alert('This language needs sponsorship. Contribute $4.99 to unlock for everyone!');
            return;
        }
        
        this.currentState.language = langCode;
        document.getElementById('language-control').textContent = langCode.split('-')[0];
        document.getElementById('language-control').title = `Language: ${langCode}`;
        try { window.lessonPlayer?.onLanguageChange?.(langCode.toLowerCase().startsWith('es')?'spanish':langCode.toLowerCase().startsWith('fr')?'french':'english'); } catch {}
        try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        
        console.log(`🎯 Language changed to: ${langCode}`);
    }

    /**
     * Change tone and update delivery
     */
    changeTone(toneId) {
        this.currentState.tone = toneId;
        const toneIcons = { neutral: 'N', fun: 'F', grandmother: 'W' };
        document.getElementById('tone-control').textContent = toneIcons[toneId] || 'N';
        document.getElementById('tone-control').title = `Tone: ${toneId}`;
        try { window.lessonPlayer?.onToneChange?.(toneId); } catch {}
        try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        
        console.log(`🎯 Tone changed to: ${toneId}`);
    }

    /**
     * Change avatar and update visuals
     */
    changeAvatar(avatarId) {
        this.currentState.avatar = avatarId;
        this.renderModelIcon();
        document.getElementById('model-control').title = `Avatar: ${avatarId}`;
        
        // Update avatar background
        const bg = document.getElementById('avatar-background');
        if (bg) {
            bg.classList.remove('kelly', 'ken');
            bg.classList.add(avatarId);
        }
        try { window.lessonPlayer?.onAvatarChange?.(avatarId); } catch {}
        try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        
        console.log(`🎯 Avatar changed to: ${avatarId}`);
    }

    renderModelIcon(){
        try{
            const modelBtn = document.getElementById('model-control');
            const src = (this.currentState.avatar||'kelly').toLowerCase() === 'ken'
                ? '/production-deploy/assets/avatars/ken/ken_neutral_default.png'
                : '/production-deploy/assets/avatars/kelly/optimized/base-states/kelly_neutral_default.png';
            modelBtn.innerHTML='';
            const img = new Image(); img.src = src; img.alt = 'Avatar';
            img.style.width='100%'; img.style.height='100%'; img.style.borderRadius='50%';
            modelBtn.appendChild(img);
        } catch{}
    }

    /**
     * Load default lesson - The Sun demo
     */
    async loadDefaultLesson() {
        try {
            const response = await fetch('/demo-lesson-the-sun.json');
            this.currentLesson = await response.json();
            console.log('🎯 Demo lesson loaded:', this.currentLesson.lesson_metadata.title);
            
            // Update UI with lesson content
            this.displayLessonContent();

            // Generate initial narration using homegrown TTS if available
            try { await this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        } catch (error) {
            console.warn('🎯 Could not load demo lesson, using fallback');
            this.loadFallbackLesson();
        }
    }

    /**
     * Display lesson content in UI
     */
    displayLessonContent() {
        if (!this.currentLesson) return;
        
        const welcomePhase = this.currentLesson.phases.find(p => p.id === 'welcome');
        if (welcomePhase) {
            // Update lesson title area
            const titleEl = document.getElementById('lesson-title');
            const previewEl = document.getElementById('lesson-preview');
            
            if (titleEl) titleEl.textContent = this.currentLesson.lesson_metadata.title;
            if (previewEl) previewEl.textContent = this.currentLesson.lesson_metadata.learning_objective;
            
            // Prepare read-along content
            this.setupReadAlongContent();
            this.syncTopBarPills();

            // Refresh narration for welcome phase
            try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
        }
    }

    /**
     * Setup read-along content with blue highlighting
     */
    setupReadAlongContent() {
        const readAlongPlayer = document.getElementById('read-along-player');
        if (!readAlongPlayer) return;
        
        // Override any yellow highlighting to blue as specified
        const style = document.createElement('style');
        style.textContent = `
            .read-along-highlight { 
                background-color: #007AFF !important; 
                color: white !important; 
                border-radius: 3px;
                padding: 1px 2px;
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Start lesson playback with manual control
     */
    startLessonPlayback() {
        if (!this.currentLesson) return;
        
        console.log('🎯 Starting lesson playback (manual control)');
        try {
            // Prefer ManifestPlayer or UniversalLessonPlayer if available
            if (window.ManifestPlayer && typeof window.ManifestPlayer.play === 'function') {
                window.ManifestPlayer.play();
            }
            if (window.lessonPlayer && typeof window.lessonPlayer.play === 'function') {
                window.lessonPlayer.play();
            }
        } catch {}
        try {
            // Drive audio element if a source is set
            const audio = document.getElementById('tts-audio');
            if (audio && audio.src) {
                audio.play().catch(()=>{});
            }
        } catch {}
    }

    /**
     * Pause lesson playback
     */
    pauseLessonPlayback() {
        console.log('🎯 Pausing lesson playback');
        try { if (window.ManifestPlayer && typeof window.ManifestPlayer.pause === 'function') window.ManifestPlayer.pause(); } catch {}
        try { if (window.lessonPlayer && typeof window.lessonPlayer.pause === 'function') window.lessonPlayer.pause(); } catch {}
        try {
            const audio = document.getElementById('tts-audio');
            if (audio && !audio.paused) audio.pause();
        } catch {}
    }

    /**
     * Phoneme provider test (local assets) when ?useHeygen=1
     * Loads ARPAbet JSON and audio URL based on avatar, normalizes digits
     */
    async tryPhonemeTest(){
        try {
            // Determine selected clip
            const avatar = (this.currentState.avatar||'ken').toLowerCase();
            const saved = (typeof localStorage!=='undefined' && localStorage.getItem('phoneme_test_clip')) || null;
            const clip = (window.__phonemeTestClip || saved || (avatar==='kelly' ? 'kelly2_first60' : 'ken2_first60')).toLowerCase();

            // Resolve audio URL from clips map if available
            let audioUrl = `/phoneme_data/audio/${clip}.wav`;
            try {
                const mapRes = await fetch('/phoneme_data/clips.json', { cache:'no-cache' });
                if (mapRes.ok) {
                    const map = await mapRes.json();
                    if (map && map[clip] && map[clip].audioUrl) audioUrl = String(map[clip].audioUrl);
                }
            } catch {}

            // Load phonemes for the chosen clip; fall back to legacy file
            let res = await fetch(`/phoneme_data/${clip}.json`, { cache:'no-cache' });
            if (!res.ok) res = await fetch('/phoneme_data/whisper_g2p_phonemes.json', { cache:'no-cache' });
            if (!res.ok) { console.warn('phoneme JSON missing'); return; }
            const raw = await res.json();
            const phonemes = Array.isArray(raw) ? raw.map(p=>({
                p: String(p.p||'').replace(/[0-9]/g,''),
                start: Number(p.start||0),
                end: Number(p.end||0)
            })) : [];
            const payload = { audioUrl, phonemes, duration_s: (phonemes.at(-1)?.end||null) };
            if (typeof window.__applyPhonemes === 'function') {
                window.__applyPhonemes(payload);
            }
            console.log(`🎯 Phoneme test applied for clip: ${clip}`);
        } catch(e){ console.warn('phoneme test failed', e); }
    }

    /**
     * Enable simple 5-dot navigation even without full lesson
     */
    enableSlideDots(){
        const dots = Array.from(document.querySelectorAll('#slide-dots .sd-dot'));
        if (!dots.length) return;
        const setActive = (i)=>{
            this.currentSlideIndex = i;
            this.syncTopBarPills();
            try { this.generateAndPlayNarrationForCurrentSlide(); } catch {}
            // Update cardlets (if enabled)
            try {
                const map = ['welcome','beginning','middle','end','wisdom'];
                const phase = i===0? 'welcome' : (map[i-1]||'welcome');
                const h = document.getElementById('cl-phase-h');
                if (h) h.textContent = phase.charAt(0).toUpperCase()+phase.slice(1);
            } catch{}
        };
        dots.forEach((dot, i)=>{
            dot.addEventListener('click', ()=>{
                setActive(i);
                try{ window.ManifestPlayer?.seekToSlide?.(i); } catch{}
                try{ window.lessonPlayer?.seekToSlide?.(i); } catch{}
            });
        });
        setActive(0);
    }

    /**
     * Update UI state to reflect current settings
     */
    updateUIState() {
        // Update button states
        document.getElementById('age-control').textContent = this.currentState.age;
        document.getElementById('language-control').textContent = this.currentState.language.split('-')[0];
        
        const toneIcons = { neutral: 'N', fun: 'F', grandmother: 'W' };
        document.getElementById('tone-control').textContent = toneIcons[this.currentState.tone];
        
        const avatarEmojis = { kelly: '👩', ken: '👨' };
        document.getElementById('model-control').textContent = avatarEmojis[this.currentState.avatar];
        
        // Update date display (example: Aug 15)
        const today = new Date();
        const monthShort = today.toLocaleDateString('en-US', { month: 'short' });
        const day = today.getDate();
        document.getElementById('calendar-control').innerHTML = `<div style="font-size:10px;">${monthShort}</div><div>${day}</div>`;

        // Sync top bar
        this.syncTopBarPills();
    }

    syncTopBarPills(){
        try{
            const v = this.currentState;
            const pill = (id, val)=>{ const el=document.getElementById(id); if (el) el.textContent = val; };
            pill('vc-avatar', `Avatar: ${v.avatar}`);
            pill('vc-tone', `Tone: ${v.tone}`);
            pill('vc-lang', `Lang: ${v.language.toLowerCase()}`);
            pill('vc-age', `Age: ${String(v.age).replace('age_','')}`);
            const dots = document.querySelectorAll('#slide-dots .sd-dot');
            dots.forEach(d=>d.classList.remove('active'));
            const active = document.querySelector(`#slide-dots .sd-dot[data-i="${this.currentSlideIndex||0}"]`);
            active?.classList.add('active');
        } catch {}
    }

    /**
     * Fallback lesson if demo file not available
     */
    loadFallbackLesson() {
        this.currentLesson = {
            lesson_metadata: {
                title: "The Sun - Our Star",
                learning_objective: "Understand how the sun provides energy for all life on Earth"
            },
            phases: [
                {
                    id: 'welcome',
                    narration: { readAlong: "Welcome! Today we're learning about the sun, our closest star." }
                }
            ]
        };
        this.displayLessonContent();
    }

    // Additional utility methods for popup interactions
    sponsorVariant(type) { alert(`Sponsor ${type} variant for $4.99!`); }
    adaptContentForAge(age) { console.log(`🎯 Adapting content for age ${age}`); }
    downloadVariants() { console.log('🎯 Downloading lesson variants'); }
    validateLesson() { console.log('🎯 Validating lesson structure'); }
    jumpToDay(day) { console.log(`🎯 Jumping to day ${day}`); }
    navigateMonth(direction) { console.log(`🎯 Navigate month ${direction > 0 ? 'forward' : 'back'}`); }

    /**
     * Generate and play narration for the current slide/phase using homegrown TTS
     */
    async generateAndPlayNarrationForCurrentSlide(){
        try {
            const audio = document.getElementById('tts-audio');
            if (!audio) return;
            // Cancel previous
            const requestId = ++this._ttsRequestId;
            try { if (this._activeObjectUrl) { URL.revokeObjectURL(this._activeObjectUrl); this._activeObjectUrl = null; } } catch {}
            const tts = window.tts instanceof Object ? window.tts : null;
            // Determine active text based on slide index
            const slide = this.currentSlideIndex || 0;
            let script = '';
            if (slide === 0) {
                script = document.getElementById('lesson-preview')?.textContent || document.getElementById('lesson-text')?.textContent || '';
            } else {
                const map = ['beginning','middle','end','wisdom'];
                const phase = map[slide-1];
                if (phase === 'wisdom') {
                    script = document.getElementById('daily-fortune')?.textContent || '';
                } else {
                    const qEl = document.getElementById(`${phase}-question`);
                    script = qEl?.textContent || '';
                }
            }
            script = (script||'').trim();
            if (!script) return;
            // Generate audio via TTS or speak fallback
            if (!window.__forceSpeech && tts && typeof tts.generateAudio === 'function') {
                const voice = (this.currentState.avatar||'kelly').toLowerCase().includes('ken') ? 'ken' : 'kelly';
                const blob = await tts.generateAudio(script, voice, (this.currentState.language||'EN-US'));
                try {
                    const phonemes = blob && blob.__phonemes ? blob.__phonemes : null;
                    if (phonemes && typeof window.__applyPhonemes === 'function') {
                        const urlTmp = URL.createObjectURL(blob);
                        window.__applyPhonemes({ audioUrl: urlTmp, phonemes, duration_s: phonemes[phonemes.length-1]?.end||null });
                        // Do not revoke here; the audio system below will own lifecycle
                    }
                } catch{}
                if (requestId !== this._ttsRequestId) return; // stale
                const url = URL.createObjectURL(blob);
                audio.src = url;
                this._activeObjectUrl = url;
                audio.volume = this.currentState.isMuted ? 0 : this.currentState.volume;
                if (this.currentState.isPlaying) {
                    try { await audio.play(); } catch(e) { console.warn('Audio playback failed', e); }
                }
                try { audio.onended = ()=>{ try { if (this._activeObjectUrl===url) { URL.revokeObjectURL(url); this._activeObjectUrl=null; } } catch {} }; } catch {}
            } else if ('speechSynthesis' in window) {
                // As a browser fallback (dev only)
                if (this.currentState.isPlaying) {
                    const utter = new SpeechSynthesisUtterance(script);
                    utter.rate = 1.0;
                    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter); } catch {}
                }
            }
        } catch(e){ console.warn('narration generation failed', e); }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unifiedControls = new UnifiedPlayerControls();
    });
} else {
    window.unifiedControls = new UnifiedPlayerControls();
}
