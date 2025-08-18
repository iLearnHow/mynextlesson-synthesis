/**
 * Lesson Integration Fix - Executive Solution
 * Connects all existing systems to create a working end-to-end lesson experience
 */

class LessonIntegrationFix {
    constructor() {
        this.currentLesson = null;
        this.currentManifest = null;
        this.availableVariants = [];
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🚀 Initializing Lesson Integration Fix...');
        
        // Find available lessons and variants
        await this.discoverAvailableContent();
        
        // Hide legacy lesson picker/pills for clean HUD (icons handle variants)
        this._applyHudSimplifications();
        
        // Load initial lesson
        await this.loadDefaultLesson();
        
        this.isInitialized = true;
        console.log('✅ Lesson Integration Fix initialized');
    }

    _applyHudSimplifications(){
        try{
            const style = document.createElement('style');
            style.textContent = `
                /* Hide redundant top pills/chips; use right rail only */
                #variant-compact, #cl-variant, #cl-phase, #cl-quote, #cl-nav, .pillbtn, .pill, span.pill { display: none !important; }
            `;
            document.head.appendChild(style);
        } catch{}
    }

    async discoverAvailableContent() {
        // Define ONLY the manifest combinations that actually exist
        const existingManifests = [
            // February 28 - The Sun (Fun tone only)
            { date: '2025-02-28', age: '40-60', tone: 'fun', avatar: 'kelly', topic: 'The Sun' },
            { date: '2025-02-28', age: '40-60', tone: 'fun', avatar: 'ken', topic: 'The Sun' },
            
            // August 14 - Box Breathing (Neutral tone only)
            { date: '2025-08-14', age: '40-60', tone: 'neutral', avatar: 'kelly', topic: 'Box Breathing' },
            { date: '2025-08-14', age: '40-60', tone: 'neutral', avatar: 'ken', topic: 'Box Breathing' },
            
            // November 22 - Cryptography (Neutral tone only)
            { date: '2025-11-22', age: '40-60', tone: 'neutral', avatar: 'kelly', topic: 'Cryptography' },
            { date: '2025-11-22', age: '40-60', tone: 'neutral', avatar: 'ken', topic: 'Cryptography' }
        ];
        
        // Only try to load manifests we know exist
        for (const variant of existingManifests) {
            const manifestUrl = `/production-deploy/examples/${variant.date}/en/${variant.age}/${variant.tone}/${variant.avatar}/manifest.json`;
            try {
                const response = await fetch(manifestUrl);
                if (response.ok) {
                    this.availableVariants.push({
                        ...variant,
                        manifestUrl,
                        language: 'en'
                    });
                } else {
                    console.warn(`Expected manifest not found: ${manifestUrl}`);
                }
            } catch (error) {
                console.error(`Error loading manifest: ${manifestUrl}`, error);
            }
        }
        
        console.log(`✅ Loaded ${this.availableVariants.length} variants across 3 lessons`);
        console.log('Available lessons:', [...new Set(this.availableVariants.map(v => v.topic))].join(', '));
    }

    setupVariantControls() {
        // Create a cleaner variant selector UI
        const controlContainer = document.createElement('div');
        controlContainer.id = 'lesson-variant-selector';
        controlContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 3000;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px 25px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-width: 450px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
        `;
        
        // Add header
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">Available Lessons</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">3 lessons • 6 variants total</p>
        `;
        controlContainer.appendChild(header);
        
        // Group variants by topic
        const lessonGroups = this.groupVariantsByTopic();
        
        // Create button row
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = 'display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;';
        
        Object.entries(lessonGroups).forEach(([topic, variants]) => {
            const lessonGroup = document.createElement('div');
            lessonGroup.style.cssText = `
                background: #f8f8f8;
                border-radius: 12px;
                padding: 12px 15px;
                min-width: 200px;
            `;
            
            const topicTitle = document.createElement('div');
            topicTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px; font-size: 15px;';
            topicTitle.textContent = topic;
            lessonGroup.appendChild(topicTitle);
            
            const variantButtons = document.createElement('div');
            variantButtons.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
            
            variants.forEach(variant => {
                const button = document.createElement('button');
                button.textContent = `${variant.avatar} • ${variant.tone}`;
                button.style.cssText = `
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(0, 122, 255, 0.3);
                    background: white;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                    text-transform: capitalize;
                `;
                
                // Highlight active variant
                if (this.isCurrentVariant(variant)) {
                    button.style.background = '#007AFF';
                    button.style.color = 'white';
                }
                
                button.onmouseover = () => {
                    if (!this.isCurrentVariant(variant)) {
                        button.style.background = '#007AFF';
                        button.style.color = 'white';
                    }
                };
                
                button.onmouseout = () => {
                    if (!this.isCurrentVariant(variant)) {
                        button.style.background = 'white';
                        button.style.color = 'black';
                    }
                };
                
                button.onclick = () => {
                    this.loadVariant(variant);
                    // Auto-close the selector after selection
                    setTimeout(() => {
                        controlContainer.style.display = 'none';
                    }, 300);
                };
                variantButtons.appendChild(button);
            });
            
            lessonGroup.appendChild(variantButtons);
            buttonRow.appendChild(lessonGroup);
        });
        
        controlContainer.appendChild(buttonRow);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            width: 30px;
            height: 30px;
            border: none;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => controlContainer.style.display = 'none';
        controlContainer.appendChild(closeBtn);
        
        document.body.appendChild(controlContainer);
    }
    
    groupVariantsByTopic() {
        const groups = {};
        this.availableVariants.forEach(variant => {
            if (!groups[variant.topic]) {
                groups[variant.topic] = [];
            }
            groups[variant.topic].push(variant);
        });
        return groups;
    }
    
    isCurrentVariant(variant) {
        return this.currentVariant &&
               this.currentVariant.avatar === variant.avatar &&
               this.currentVariant.tone === variant.tone &&
               this.currentVariant.date === variant.date;
    }

    async loadDefaultLesson() {
        if (this.availableVariants.length > 0) {
            // Load the first available variant
            await this.loadVariant(this.availableVariants[0]);
        } else {
            console.error('No variants available to load');
            this.showError('No lesson content available');
        }
    }

    async loadVariant(variant) {
        console.log(`Loading: ${variant.topic} - ${variant.avatar} (${variant.tone})`);
        
        // Show loading spinner
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'block';
        
        try {
            // Fetch the manifest
            const response = await fetch(variant.manifestUrl);
            const manifest = await response.json();
            
            this.currentManifest = manifest;
            this.currentVariant = variant; // Track current variant
            
            // Update UI to show current variant
            this.updateVariantDisplay(variant);
            
            // Update button states
            this.updateButtonStates();
            
            // Initialize or update the manifest player
            if (window.manifestPlayer) {
                await window.manifestPlayer.loadManifest(manifest);
            } else {
                // Load manifest into audio system
                if (window.studentAudioSystem) {
                    await window.studentAudioSystem.loadManifest(manifest);
                }
                
                // Fallback: display content directly
                this.displayManifestContent(manifest, variant);
            }
            
            // Update avatar background
            this.updateAvatarBackground(variant.avatar);
            
            console.log(`✅ Loaded: ${variant.topic} lesson`);
            
            // Hide loading spinner
            if (spinner) spinner.style.display = 'none';
            
        } catch (error) {
            console.error('Failed to load variant:', error);
            this.showError('Failed to load lesson variant');
            
            // Hide loading spinner on error
            if (spinner) spinner.style.display = 'none';
        }
    }
    
    updateButtonStates() {
        // Update all variant buttons to reflect current selection
        const buttons = document.querySelectorAll('#lesson-variant-selector button');
        buttons.forEach(button => {
            if (button.textContent.includes('×')) return; // Skip close button
            
            const isActive = this.currentVariant && 
                            button.textContent.includes(this.currentVariant.avatar) && 
                            button.textContent.includes(this.currentVariant.tone) &&
                            button.closest('.lessonGroup')?.querySelector('[style*="font-weight: 600"]')?.textContent === this.currentVariant.topic;
            
            if (isActive) {
                button.style.background = '#007AFF';
                button.style.color = 'white';
            } else {
                button.style.background = 'white';
                button.style.color = 'black';
            }
        });
    }

    updateVariantDisplay(variant) {
        // Update the compact variant display
        const variantCompact = document.getElementById('variant-compact');
        if (variantCompact) {
            variantCompact.innerHTML = `
                <div class="pill" style="background: #007AFF; color: white;">${variant.topic}</div>
                <div class="pill">${variant.avatar}</div>
                <div class="pill">${variant.tone}</div>
                <div class="pill">${variant.age}</div>
            `;
        }
    }

    updateAvatarBackground(avatar) {
        const avatarBg = document.querySelector('.avatar-background');
        if (avatarBg) {
            avatarBg.className = `avatar-background ${avatar}`;
            // Fallback background colors if images don't exist
            if (avatar === 'kelly') {
                avatarBg.style.backgroundColor = '#FFE4E1'; // Light pink
            } else if (avatar === 'ken') {
                avatarBg.style.backgroundColor = '#E0E8FF'; // Light blue
            }
        }
    }

    displayManifestContent(manifest, variant) {
        // Display lesson content when manifest player isn't available
        const contentOverlay = document.getElementById('lesson-content-overlay');
        const lessonContent = document.getElementById('lesson-content');
        
        // Hide the old overlay system to prevent overlapping
        if (contentOverlay) {
            contentOverlay.style.display = 'none';
        }
        if (lessonContent) {
            lessonContent.style.display = 'none';
        }
        
        // Create a simple slide viewer (left-anchored, compact like right modals)
        const slideContainer = document.createElement('div');
        slideContainer.id = 'manifest-slide-viewer';
        slideContainer.style.cssText = `
            position: fixed;
            top: 14vh;
            left: 24px;
            transform: none;
            width: min(340px, 28vw);
            max-width: 380px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 22px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            z-index: 2000;
        `;
        // Close button (X)
        const closeBtn = document.createElement('button');
        closeBtn.setAttribute('aria-label', 'Close text panel');
        closeBtn.title = 'Close';
        closeBtn.style.cssText = `position:absolute; right:12px; top:12px; width:30px; height:30px; border:none; border-radius:50%; background:rgba(0,0,0,0.08); cursor:pointer; font-size:18px;`;
        closeBtn.textContent = '×';
        closeBtn.onclick = ()=>{ try { slideContainer.style.display = 'none'; const pill=document.getElementById('show-text-pill'); if (pill) pill.style.display='inline-flex'; const rail=document.getElementById('left-pill-rail'); if (rail) rail.style.display='none'; } catch{} };
        slideContainer.appendChild(closeBtn);
        
        // Current slide state
        let currentSlideIndex = 0;
        
        // Store current manifest in window for navigation
        window.lessonFix.currentManifestData = manifest;
        window.lessonFix.currentSlideIndex = currentSlideIndex;
        
        // Create left pill rail if missing
        let pillRail = document.getElementById('left-pill-rail');
        if (!pillRail){
            pillRail = document.createElement('div');
            pillRail.id = 'left-pill-rail';
            pillRail.style.cssText = `position: fixed; left: 24px; top: calc(14vh - 46px); display: flex; gap: 8px; flex-wrap: wrap; width: min(340px,28vw); z-index:2001;`;
            document.body.appendChild(pillRail);
        }

        const renderSlide = (index) => {
            currentSlideIndex = index;
            window.lessonFix.currentSlideIndex = index;
            const slide = manifest.slides[index];
            
            // Clear any existing audio
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
            
            // Build pill buttons per slide
            try {
                const pills = [];
                pills.push({ id:'hint', label:'Hint', tip:'Get a nudge for this step' });
                if (slide.qa) { pills.push({ id:'faq', label:'FAQ', tip:'Common questions' }); pills.push({ id:'why', label:'Why true?', tip:'Reasoning' }); }
                if (slide.popup_payload) { pills.push({ id:'learn', label:'Learn more', tip:'Open card' }); }
                pills.push({ id:'ask', label:'Ask Kelly', tip:'Ask a follow-up' });
                pillRail.innerHTML = pills.map(p=>`<button data-id="${p.id}" title="${p.tip}" style="padding:8px 10px;border:1px solid rgba(0,0,0,0.15);background:rgba(255,255,255,0.92);border-radius:999px;font-size:13px;cursor:pointer;">${p.label}</button>`).join('');
                pillRail.style.display = 'flex';
                pillRail.onclick = (e)=>{
                    const b = e.target.closest('button'); if(!b) return;
                    const id = b.getAttribute('data-id');
                    if (id === 'hint') window.lessonFix.showFeedback('Hint: Focus on morning light.');
                    else if (id === 'faq') window.lessonFix.showFeedback('FAQ: Sunlight sets your circadian rhythm.');
                    else if (id === 'why') window.lessonFix.showFeedback('Because light entrains the SCN via retinal input.');
                    else if (id === 'learn' && slide.popup_payload) window.lessonFix.showFeedback('Learn more: ' + (slide.popup_payload.definition || slide.popup_payload.quote || 'See details'));
                    else if (id === 'ask') window.lessonFix.showFeedback('Ask Kelly: Great question—let’s explore that next.');
                };
            } catch{}

            slideContainer.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 22px; margin-bottom: 10px;">${index+1}. ${slide.title}</h2>
                    <div style="color: #666; margin-bottom: 8px;">
                        <strong>${variant.topic}</strong> • ${variant.avatar} (${variant.tone})
                    </div>
                    <div style="color: #999; font-size: 13px; margin-bottom: 12px;">
                        Slide ${index + 1} of ${manifest.slides.length}
                    </div>
                </div>
                
                ${slide.qa ? `
                    <div style="background: #f7faff; padding: 14px; border-radius: 12px; margin-bottom: 16px;">
                        <h3 style="font-size: 16px; margin-bottom: 10px;">${slide.qa.question}</h3>
                        <div style="display: flex; gap: 8px;">
                            ${slide.qa.choices.map(choice => `
                                <button onclick="window.lessonFix.showFeedback('${choice.feedback}')" style="
                                    flex: 1;
                                    padding: 10px 12px;
                                    border: 1px solid #ddd;
                                    border-radius: 8px;
                                    background: white;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                " onmouseover="this.style.background='#007AFF'; this.style.color='white';" 
                                   onmouseout="this.style.background='white'; this.style.color='black';">
                                    ${choice.id}: ${choice.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div id="feedback-display" style="
                        display: none;
                        background: #e8f4fd;
                        padding: 12px;
                        border-radius: 8px;
                        margin-top: 8px;
                        color: #0066cc;
                    "></div>
                ` : ''}
                
                ${slide.popup_payload ? `
                    <div style="background: #fafafa; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        ${slide.popup_template_id === 'definition_card' ? `
                            <strong>${slide.popup_payload.term}:</strong> ${slide.popup_payload.definition}
                        ` : slide.popup_template_id === 'quote_card' ? `
                            <em>"${slide.popup_payload.quote}"</em>
                        ` : slide.popup_template_id === 'number_highlight' ? `
                            <strong>${slide.popup_payload.value}${slide.popup_payload.unit}</strong> - ${slide.popup_payload.label}
                        ` : slide.popup_template_id === 'list_points' ? `
                            <ul style="margin: 0; padding-left: 20px;">
                                ${slide.popup_payload.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <button title="Go to previous" onclick="window.lessonFix.previousSlide()" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        ${index === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    " ${index === 0 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <button title="Next step" onclick="window.lessonFix.nextSlide()" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background: #007AFF;
                        color: white;
                        cursor: pointer;
                        ${index === manifest.slides.length - 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    " ${index === manifest.slides.length - 1 ? 'disabled' : ''}>
                        Next
                    </button>
                </div>
            `;
        };
        
        // Add navigation methods
        window.lessonFix.nextSlide = () => {
            const currentIndex = window.lessonFix.currentSlideIndex;
            const manifestData = window.lessonFix.currentManifestData;
            if (currentIndex < manifestData.slides.length - 1) {
                renderSlide(currentIndex + 1);
                this.updateSlideDots(currentIndex + 1);
                
                // Play the new slide audio
                if (window.studentAudioSystem) {
                    window.studentAudioSystem.playSlide(currentIndex + 1);
                } else {
                    // Fallback to speech
                    const newSlide = manifestData.slides[currentIndex + 1];
                    this.speakSlideContent(this.getSlideNarrationText(newSlide), variant.avatar);
                }
            }
        };
        
        window.lessonFix.previousSlide = () => {
            const currentIndex = window.lessonFix.currentSlideIndex;
            if (currentIndex > 0) {
                renderSlide(currentIndex - 1);
                this.updateSlideDots(currentIndex - 1);
                
                // Play the previous slide audio
                if (window.studentAudioSystem) {
                    window.studentAudioSystem.playSlide(currentIndex - 1);
                } else {
                    // Fallback to speech
                    const newSlide = window.lessonFix.currentManifestData.slides[currentIndex - 1];
                    this.speakSlideContent(this.getSlideNarrationText(newSlide), variant.avatar);
                }
            }
        };
        
        window.lessonFix.showFeedback = (feedback) => {
            const feedbackEl = document.getElementById('feedback-display');
            if (feedbackEl) {
                feedbackEl.textContent = feedback;
                feedbackEl.style.display = 'block';
                
                // Speak the feedback
                this.speakSlideContent(feedback, variant.avatar);
                
                // Auto-advance to next slide after feedback
                setTimeout(() => {
                    window.lessonFix.nextSlide();
                }, 3000);
            }
        };
        
        // Remove existing viewer if any
        const existing = document.getElementById('manifest-slide-viewer');
        if (existing) existing.remove();
        
        // Add the viewer
        document.body.appendChild(slideContainer);

        // Add a pill to re-open text panel when closed
        let reopen = document.getElementById('show-text-pill');
        if (!reopen){
            reopen = document.createElement('button');
            reopen.id = 'show-text-pill';
            reopen.textContent = 'Show text';
            reopen.title = 'Open lesson text panel';
            reopen.style.cssText = `position: fixed; left: 24px; bottom: 110px; z-index: 2001; display: none; padding: 10px 14px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); background: rgba(255,255,255,0.92); box-shadow: 0 8px 24px rgba(0,0,0,0.12); cursor: pointer; font-size: 14px;`;
            reopen.onclick = ()=>{ try { slideContainer.style.display = 'block'; reopen.style.display='none'; } catch{} };
            document.body.appendChild(reopen);
        }
        
        // Store manifest for audio playback
        window.lessonFix.currentManifest = manifest;
        window.lessonFix.currentVariant = variant;
        
        // Render first slide
        renderSlide(0);
        this.updateSlideDots(0);
        
        // Make slide dots clickable
        this.setupSlideDotNavigation(manifest, renderSlide);
        
        // DO NOT auto-play on load - wait for user interaction
        console.log('✅ Lesson loaded, waiting for user to start');
    }
    
    setupSlideDotNavigation(manifest, renderSlideCallback) {
        const dots = document.querySelectorAll('#slide-dots .sd-dot');
        dots.forEach((dot, index) => {
            if (index < manifest.slides.length) {
                dot.style.cursor = 'pointer';
                dot.onclick = () => {
                    renderSlideCallback(index);
                    this.updateSlideDots(index);
                    
                    // Play audio for the clicked slide
                    if (window.studentAudioSystem) {
                        window.studentAudioSystem.playSlide(index);
                    } else {
                        // Fallback to speech
                        const slide = manifest.slides[index];
                        const variant = this.currentVariant || { avatar: 'kelly' };
                        this.speakSlideContent(this.getSlideNarrationText(slide), variant.avatar);
                    }
                };
            }
        });
    }

    updateSlideDots(activeIndex) {
        const dots = document.querySelectorAll('#slide-dots .sd-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    getSlideNarrationText(slide) {
        // Map of known content based on slide patterns
        const contentMap = {
            'Lesson orientation': 'Welcome! Today we\'ll explore how sunlight affects your body. We\'ll learn about vitamin D, your internal clock, and how to get the most benefit from the sun safely.',
            'Vitamin cue': 'Did you know sunlight helps your body make vitamins? Let me ask you a question.',
            'Timing habit': 'Now let\'s talk about the best time to get sunlight. Here\'s another question for you.',
            'Cloudy/indoor fixes': 'What if it\'s cloudy or you\'re stuck inside? Let\'s figure out the best solution.',
            'Close + plan': 'Great job! Remember, a little sunlight each day keeps your body happy and healthy. Plan to get some morning light tomorrow!',
            'Box breathing orientation': 'Welcome! Today we\'ll learn box breathing - a simple technique to help you feel calm and focused. It\'s called box breathing because we count to four, four times, like the four sides of a box.',
            'Cryptography in daily life': 'Welcome! Today we\'ll discover how secret codes and encryption protect your information every single day. From texting to shopping online, cryptography keeps your data safe.'
        };
        
        // Check if we have a known script text
        if (slide.script_text && contentMap[slide.script_text]) {
            const baseText = contentMap[slide.script_text];
            
            // Add question if present
            if (slide.qa && slide.qa.question) {
                return baseText + ' ' + slide.qa.question;
            }
            
            return baseText;
        }
        
        // Build narration from available content
        const texts = [];
        
        // Add title-based intro
        if (slide.title) {
            const titleIntros = {
                'Welcome': 'Welcome to today\'s lesson!',
                'Beginning': 'Let\'s begin with our first question.',
                'Middle': 'Here\'s our next question.',
                'End': 'One more question for you.',
                'Wisdom': 'Let\'s wrap up with today\'s wisdom.'
            };
            
            if (titleIntros[slide.title]) {
                texts.push(titleIntros[slide.title]);
            }
        }
        
        // Add question text if present
        if (slide.qa && slide.qa.question) {
            texts.push(slide.qa.question);
        }
        
        // Add popup content if meaningful
        if (slide.popup_payload) {
            if (slide.popup_payload.term && slide.popup_payload.definition) {
                texts.push(`Here\'s an important term: ${slide.popup_payload.term} means ${slide.popup_payload.definition}`);
            } else if (slide.popup_payload.quote) {
                texts.push(`Remember this: ${slide.popup_payload.quote}`);
            }
        }
        
        // Fallback if nothing found
        if (texts.length === 0) {
            return `This is the ${slide.title || 'next'} section of our lesson.`;
        }
        
        return texts.join(' ');
    }
    
    async speakSlideContent(text, avatar) {
        try {
            // Use the lesson player's speak method if available
            if (window.player && typeof window.player.speak === 'function') {
                await window.player.speak(text, avatar);
                return;
            }
            
            // Debug TTS availability
            console.log('TTS Check:', {
                ttsExists: !!window.tts,
                hasGenerateAudio: window.tts && typeof window.tts.generateAudio === 'function',
                homegrownTTS: !!window.HomegrownTTSSystem
            });
            
            // Try homegrown TTS
            if (window.tts && typeof window.tts.generateAudio === 'function') {
                const voice = avatar.toLowerCase().includes('ken') ? 'ken' : 'kelly';
                const blob = await window.tts.generateAudio(text, voice, 'en-US');
                const url = URL.createObjectURL(blob);
                
                const audio = new Audio(url);
                window.currentAudio = audio;
                
                // Wire up play/pause button
                const playBtn = document.getElementById('play-pause-master');
                if (playBtn) {
                    playBtn.onclick = () => {
                        if (audio.paused) {
                            audio.play();
                            playBtn.textContent = '⏸';
                        } else {
                            audio.pause();
                            playBtn.textContent = '▶';
                        }
                    };
                }
                
                // Wire up volume control
                const volumeSlider = document.getElementById('volume-slider');
                if (volumeSlider) {
                    volumeSlider.oninput = () => {
                        audio.volume = volumeSlider.value;
                    };
                    audio.volume = volumeSlider.value;
                }
                
                audio.play();
                playBtn.textContent = '⏸';
                
                // Add visual indicator
                const avatarBg = document.querySelector('.avatar-background');
                if (avatarBg) {
                    avatarBg.style.filter = 'brightness(1.1)';
                    audio.onended = () => {
                        avatarBg.style.filter = 'brightness(1.0)';
                        playBtn.textContent = '▶';
                    };
                }
                
                console.log(`🎤 Speaking: "${text.substring(0, 50)}..."`);
                return;
            }
            
            // No fallback to browser speech - require proper TTS
            console.error('❌ TTS not available - Ken & Kelly voices required');
            if (window.unifiedTTS) {
                window.unifiedTTS.showTTSError();
            }
            
            console.warn('No text-to-speech system available');
            
        } catch (error) {
            console.error('Failed to speak content:', error);
        }
    }
    
    async playSlideAudio(slide, variant) {
        // This is now handled by speakSlideContent
        const narrationText = this.getSlideNarrationText(slide);
        await this.speakSlideContent(narrationText, variant.avatar);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff3b30;
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 5000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Initialize the fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.lessonFix = new LessonIntegrationFix();
        await window.lessonFix.initialize();
    });
} else {
    window.lessonFix = new LessonIntegrationFix();
    window.lessonFix.initialize();
}
