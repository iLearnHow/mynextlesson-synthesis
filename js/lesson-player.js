/**
 * MyNextLesson Real-Time Lesson Player
 * Handles UI interactions and real-time synthesis updates
 */

class LessonPlayer {
    constructor() {
        this.currentParameters = {
            age: 25,
            tone: 'fun',
            language: 'english'
        };
        
        this.isLoading = false;
        this.synthesisHistory = [];
        this.debounceTimer = null;
        
        this.initializePlayer();
    }

    async initializePlayer() {
        console.log('🎮 Initializing Lesson Player...');
        
        // Wait for synthesis engine to be ready
        await this.waitForSynthesisEngine();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial lesson
        await this.synthesizeAndDisplay();
        
        console.log('✅ Lesson Player ready!');
    }

    async waitForSynthesisEngine() {
        // Wait for synthesis engine to be available and initialized
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (!window.synthesisEngine && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.synthesisEngine) {
            console.error('❌ Synthesis engine not available');
            return;
        }
        
        // Wait for engine to be initialized
        attempts = 0;
        while (!window.synthesisEngine.lessonDNA && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log('🧬 Synthesis engine ready');
    }

    setupEventListeners() {
        // Age slider
        const ageSlider = document.getElementById('age-slider');
        const ageValue = document.getElementById('age-value');
        
        if (ageSlider && ageValue) {
            ageSlider.addEventListener('input', (e) => {
                const age = parseInt(e.target.value);
                ageValue.textContent = age;
                this.updateParameter('age', age);
            });
            
            // Set initial value
            ageValue.textContent = this.currentParameters.age;
            ageSlider.value = this.currentParameters.age;
        }
        
        // Tone buttons
        const toneButtons = document.querySelectorAll('.tone-btn');
        toneButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                toneButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                const tone = btn.dataset.tone;
                this.updateParameter('tone', tone);
            });
        });
        
        // Language select
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.updateParameter('language', e.target.value);
            });
        }
        
        // Action buttons
        const playBtn = document.getElementById('play-btn');
        const shareBtn = document.getElementById('share-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.playLesson();
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareLesson();
            });
        }
        
        console.log('🎛️ Event listeners configured');
    }

    updateParameter(paramName, value) {
        console.log(`🔄 Parameter update: ${paramName} = ${value}`);
        
        this.currentParameters[paramName] = value;
        
        // Debounce rapid changes
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.synthesizeAndDisplay();
        }, 300);
    }

    async synthesizeAndDisplay() {
        if (this.isLoading) {
            console.log('⏳ Synthesis already in progress, skipping...');
            return;
        }
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            console.log('🚀 Starting synthesis with parameters:', this.currentParameters);
            
            // Record start time for performance tracking
            const startTime = performance.now();
            
            // Call synthesis engine
            const result = await window.synthesisEngine.synthesizeLesson(this.currentParameters);
            
            // Update performance metrics
            this.updateSynthesisMetrics(result);
            
            // Display the synthesized content
            this.displayLessonContent(result);
            
            // Record this synthesis
            this.synthesisHistory.push({
                parameters: { ...this.currentParameters },
                result,
                timestamp: Date.now()
            });
            
            console.log(`✨ Synthesis completed in ${result.synthesisTime.toFixed(1)}ms`);
            
        } catch (error) {
            console.error('❌ Synthesis failed:', error);
            this.showErrorState(error);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    displayLessonContent(result) {
        // Update lesson header
        this.updateElement('lesson-title', result.title);
        this.updateElement('lesson-complexity', result.complexity);
        this.updateElement('lesson-duration', result.duration);
        
        // Update avatar
        this.updateAvatar(result.avatar);
        
        // Update lesson sections with smooth transitions
        this.updateLessonSection('intro-text', result.sections.introduction);
        this.updateLessonSection('concept-text', result.sections.concept);
        this.updateLessonSection('examples-text', result.sections.examples);
        this.updateLessonSection('reflection-text', result.sections.reflection);
        
        // Update synthesis status
        this.updateSynthesisStatus('Ready', result.fromCache);
        
        console.log('📄 Lesson content updated');
    }

    updateLessonSection(elementId, content) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Add updating class for visual feedback
        const section = element.closest('.lesson-section');
        if (section) {
            section.classList.add('updating');
            
            setTimeout(() => {
                section.classList.remove('updating');
            }, 600);
        }
        
        // Smooth content transition
        element.style.opacity = '0.5';
        
        setTimeout(() => {
            element.textContent = content;
            element.style.opacity = '1';
        }, 150);
    }

    updateAvatar(avatarInfo) {
        const avatarDisplay = document.getElementById('avatar-display');
        const avatarName = document.getElementById('avatar-name');
        
        if (avatarDisplay) {
            // Update avatar emoji/face
            const avatarFace = avatarDisplay.querySelector('.avatar-face');
            if (avatarFace) {
                avatarFace.textContent = avatarInfo.emoji || '🎓';
            }
            
            // Add a subtle animation
            avatarDisplay.style.transform = 'scale(0.9)';
            setTimeout(() => {
                avatarDisplay.style.transform = 'scale(1)';
            }, 150);
        }
        
        if (avatarName) {
            avatarName.textContent = avatarInfo.name || 'Ken';
        }
    }

    updateSynthesisMetrics(result) {
        // Update synthesis time
        const synthesisTimeEl = document.getElementById('synthesis-time');
        if (synthesisTimeEl) {
            synthesisTimeEl.textContent = Math.round(result.synthesisTime);
        }
        
        // Update cache indicator if needed
        if (result.fromCache) {
            console.log('⚡ Content served from cache');
        }
    }

    updateSynthesisStatus(status, fromCache = false) {
        const statusEl = document.getElementById('synthesis-status');
        if (!statusEl) return;
        
        statusEl.textContent = status;
        
        if (fromCache) {
            statusEl.classList.add('cached');
            statusEl.title = 'Served from synthesis cache';
        } else {
            statusEl.classList.remove('cached');
            statusEl.title = 'Freshly synthesized content';
        }
    }

    showLoadingState() {
        // Update synthesis status
        this.updateSynthesisStatus('Synthesizing...', false);
        
        // Add visual loading indicators
        const sections = document.querySelectorAll('.lesson-section');
        sections.forEach(section => {
            section.classList.add('updating');
        });
        
        // Show loading overlay for longer operations
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay && !this.debounceTimer) {
            setTimeout(() => {
                if (this.isLoading) {
                    loadingOverlay.classList.add('active');
                }
            }, 500); // Only show overlay if synthesis takes more than 500ms
        }
    }

    hideLoadingState() {
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
        
        // Remove loading indicators
        const sections = document.querySelectorAll('.lesson-section');
        sections.forEach(section => {
            section.classList.remove('updating');
        });
    }

    showErrorState(error) {
        console.error('💥 Displaying error state:', error);
        
        // Update status
        this.updateSynthesisStatus('Error', false);
        
        // Show error message in lesson content
        this.updateLessonSection('intro-text', 
            'We encountered an issue generating your personalized lesson. Please try adjusting your settings or refresh the page.');
        
        this.updateLessonSection('concept-text', 
            'Our synthesis engine is working to resolve this issue. Thank you for your patience.');
        
        this.updateLessonSection('examples-text', 
            'In the meantime, you can explore different age and tone settings to see how our real-time synthesis works.');
        
        this.updateLessonSection('reflection-text', 
            'What aspects of personalized learning are most important to you?');
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element && content) {
            element.textContent = content;
        }
    }

    // Action Methods
    playLesson() {
        console.log('▶️ Playing lesson with current parameters:', this.currentParameters);
        
        // For demo purposes, show an alert
        // In production, this would integrate with voice synthesis and lesson progression
        const { age, tone } = this.currentParameters;
        const ageCategory = this.getAgeCategory(age);
        
        alert(`🎭 Lesson Experience\n\nAge: ${age} (${ageCategory})\nTone: ${tone}\nLanguage: ${this.currentParameters.language}\n\nIn the full version, this would start the interactive lesson with Ken or Kelly guiding you through personalized content with voice synthesis and real-time adaptation!`);
    }

    shareLesson() {
        console.log('🔗 Sharing lesson configuration:', this.currentParameters);
        
        // Create shareable URL with current parameters
        const url = new URL(window.location);
        url.searchParams.set('age', this.currentParameters.age);
        url.searchParams.set('tone', this.currentParameters.tone);
        url.searchParams.set('language', this.currentParameters.language);
        
        // Copy to clipboard
        navigator.clipboard.writeText(url.toString()).then(() => {
            // Show success feedback
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) {
                const originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = '<span>✅</span> Copied to Clipboard!';
                shareBtn.classList.add('success');
                
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                    shareBtn.classList.remove('success');
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            // Fallback: show URL in alert
            alert(`Share this personalized lesson:\n\n${url.toString()}`);
        });
    }

    // Utility Methods
    getAgeCategory(age) {
        if (age <= 8) return 'Early Childhood';
        if (age <= 17) return 'Youth';
        if (age <= 35) return 'Young Adult';
        if (age <= 65) return 'Midlife';
        return 'Wisdom Years';
    }

    // URL Parameter Loading
    loadParametersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const age = urlParams.get('age');
        const tone = urlParams.get('tone');
        const language = urlParams.get('language');
        
        if (age && !isNaN(age)) {
            this.currentParameters.age = parseInt(age);
        }
        
        if (tone && ['grandmother', 'fun', 'neutral'].includes(tone)) {
            this.currentParameters.tone = tone;
        }
        
        if (language && ['english', 'spanish', 'french'].includes(language)) {
            this.currentParameters.language = language;
        }
        
        // Update UI to match loaded parameters
        this.updateUIFromParameters();
    }

    updateUIFromParameters() {
        // Update age slider
        const ageSlider = document.getElementById('age-slider');
        const ageValue = document.getElementById('age-value');
        if (ageSlider && ageValue) {
            ageSlider.value = this.currentParameters.age;
            ageValue.textContent = this.currentParameters.age;
        }
        
        // Update tone buttons
        const toneButtons = document.querySelectorAll('.tone-btn');
        toneButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tone === this.currentParameters.tone) {
                btn.classList.add('active');
            }
        });
        
        // Update language select
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = this.currentParameters.language;
        }
    }

    // Analytics and Insights
    getSynthesisInsights() {
        const totalSyntheses = this.synthesisHistory.length;
        const avgSynthesisTime = totalSyntheses > 0 
            ? this.synthesisHistory.reduce((sum, s) => sum + s.result.synthesisTime, 0) / totalSyntheses
            : 0;
        
        const parameterVariations = new Set(
            this.synthesisHistory.map(s => `${s.parameters.age}_${s.parameters.tone}_${s.parameters.language}`)
        ).size;
        
        return {
            totalSyntheses,
            avgSynthesisTime: Math.round(avgSynthesisTime),
            parameterVariations,
            currentParameters: this.currentParameters
        };
    }
}

// Initialize lesson player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Lesson Player...');
    
    // Create global lesson player instance
    window.lessonPlayer = new LessonPlayer();
    
    // Load parameters from URL if present
    window.lessonPlayer.loadParametersFromURL();
});

// Export for potential external use
window.LessonPlayer = LessonPlayer;
