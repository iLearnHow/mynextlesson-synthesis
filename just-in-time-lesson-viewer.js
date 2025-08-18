/**
 * Just-In-Time Lesson Viewer
 * Minimizes whitespace, maximizes avatar wallpaper visibility
 * Implements seamless, delightful learning moments
 */

class JustInTimeLessonViewer {
    constructor() {
        this.currentPhase = 0;
        this.lessonData = null;
        this.isAnimating = false;
        this.contentQueue = [];
        this.init();
    }

    init() {
        // Don't remove existing viewers - enhance them instead
        console.log('🎯 JIT Viewer initialized - will enhance existing lessons');
        
        // Create minimal, avatar-integrated UI (but don't show yet)
        this.createMinimalUI();
        
        // Initialize animation timing system
        this.setupTimingEngine();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide JIT elements by default - only show when needed
        this.hideJITElements();
    }
    
    hideJITElements() {
        // Hide JIT elements until they're needed
        const container = document.getElementById('jit-lesson-container');
        if (container) container.style.display = 'none';
        
        const progressDots = document.getElementById('jit-progress-dots');
        if (progressDots) progressDots.style.display = 'none';
    }
    
    showJITElements() {
        // Show JIT elements when lesson is active
        const container = document.getElementById('jit-lesson-container');
        if (container) container.style.display = 'flex';
        
        const progressDots = document.getElementById('jit-progress-dots');
        if (progressDots) progressDots.style.display = 'flex';
    }

    createMinimalUI() {
        // Main container - transparent, full-screen
        const container = document.createElement('div');
        container.id = 'jit-lesson-container';
        container.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 1000;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Speech bubble from avatar (initially hidden)
        const speechBubble = document.createElement('div');
        speechBubble.id = 'jit-speech-bubble';
        speechBubble.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px) saturate(180%);
            border-radius: 24px;
            padding: 20px 28px;
            max-width: 420px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            opacity: 0;
            transform: scale(0.9) translateY(10px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            
            /* Speech bubble tail */
            &::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 20px;
                background: inherit;
                clip-path: polygon(50% 100%, 0 0, 100% 0);
            }
        `;

        // Choice buttons container (initially hidden)
        const choiceContainer = document.createElement('div');
        choiceContainer.id = 'jit-choice-container';
        choiceContainer.style.cssText = `
            position: absolute;
            bottom: 25vh;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Wisdom cards container (initially hidden)
        const wisdomContainer = document.createElement('div');
        wisdomContainer.id = 'jit-wisdom-container';
        wisdomContainer.style.cssText = `
            position: absolute;
            bottom: 15vh;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 16px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Progress indicator (minimal dots)
        const progressDots = document.createElement('div');
        progressDots.id = 'jit-progress-dots';
        progressDots.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 1100;
            pointer-events: auto;
        `;

        // Create 5 dots for 5 phases
        for (let i = 0; i < 5; i++) {
            const dot = document.createElement('div');
            dot.className = 'jit-dot';
            dot.dataset.phase = i;
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            progressDots.appendChild(dot);
        }

        container.appendChild(speechBubble);
        container.appendChild(choiceContainer);
        container.appendChild(wisdomContainer);
        document.body.appendChild(container);
        document.body.appendChild(progressDots);
    }

    setupTimingEngine() {
        // Content reveal timing based on reading speed and comprehension
        this.timings = {
            welcomeFadeIn: 600,
            welcomeReadTime: 3500,
            welcomeFadeOut: 400,
            questionFadeIn: 800,
            choiceRevealDelay: 1200,
            choiceStagger: 200,
            feedbackDuration: 3000,
            wisdomRevealDelay: 500,
            wisdomStagger: 300,
            phaseTransition: 600
        };
    }

    setupEventListeners() {
        // Progress dots navigation
        document.querySelectorAll('.jit-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const phase = parseInt(e.target.dataset.phase);
                if (!this.isAnimating && this.lessonData) {
                    this.goToPhase(phase);
                }
            });
        });

        // Listen for lesson data
        window.addEventListener('jit:loadLesson', (e) => {
            this.loadLesson(e.detail);
        });
    }

    loadLesson(lessonData) {
        this.lessonData = lessonData;
        this.currentPhase = 0;
        this.updateProgressDots();
        this.playPhase(0);
    }

    async playPhase(phaseIndex) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.currentPhase = phaseIndex;
        this.updateProgressDots();

        const phase = this.lessonData.phases[phaseIndex];
        
        switch (phase.type) {
            case 'welcome':
                await this.playWelcomePhase(phase);
                break;
            case 'question':
                await this.playQuestionPhase(phase);
                break;
            case 'wisdom':
                await this.playWisdomPhase(phase);
                break;
        }

        this.isAnimating = false;
    }

    async playWelcomePhase(phase) {
        const bubble = document.getElementById('jit-speech-bubble');
        
        // Position bubble near avatar's head
        this.positionBubbleNearAvatar(bubble);
        
        // Set content
        bubble.innerHTML = `
            <div style="font-size: 18px; line-height: 1.6; color: #1d1d1f;">
                ${phase.content}
            </div>
        `;
        
        // Fade in
        await this.fadeIn(bubble, this.timings.welcomeFadeIn);
        
        // Read time
        await this.wait(this.timings.welcomeReadTime);
        
        // Auto-advance to next phase
        await this.fadeOut(bubble, this.timings.welcomeFadeOut);
        
        if (this.currentPhase === 0) {
            this.playPhase(1);
        }
    }

    async playQuestionPhase(phase) {
        const bubble = document.getElementById('jit-speech-bubble');
        const choiceContainer = document.getElementById('jit-choice-container');
        
        // Position and show question
        this.positionBubbleNearAvatar(bubble);
        bubble.innerHTML = `
            <div style="font-size: 17px; line-height: 1.5; color: #1d1d1f; margin-bottom: 8px;">
                ${phase.question}
            </div>
        `;
        
        await this.fadeIn(bubble, this.timings.questionFadeIn);
        
        // Wait before showing choices
        await this.wait(this.timings.choiceRevealDelay);
        
        // Create and show choices with stagger
        choiceContainer.innerHTML = '';
        phase.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'jit-choice-btn';
            btn.style.cssText = `
                padding: 16px 32px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border: 2px solid transparent;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 500;
                color: #1d1d1f;
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                pointer-events: auto;
                
                &:hover {
                    background: rgba(255, 255, 255, 1);
                    border-color: #007AFF;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }
            `;
            btn.textContent = choice.text;
            btn.onclick = () => this.handleChoice(choice, phase);
            choiceContainer.appendChild(btn);
            
            // Stagger animation
            setTimeout(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, index * this.timings.choiceStagger);
        });
        
        choiceContainer.style.opacity = '1';
        choiceContainer.style.pointerEvents = 'auto';
    }

    async handleChoice(choice, phase) {
        const bubble = document.getElementById('jit-speech-bubble');
        const choiceContainer = document.getElementById('jit-choice-container');
        
        // Hide choices
        await this.fadeOut(choiceContainer, 300);
        
        // Show teaching moment
        bubble.innerHTML = `
            <div style="font-size: 16px; line-height: 1.5; color: #1d1d1f;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #007AFF;">
                    ${choice.isCorrect ? '✨ Excellent!' : '💭 Good thinking!'}
                </div>
                ${choice.teachingMoment}
            </div>
        `;
        
        // Wait for comprehension
        await this.wait(this.timings.feedbackDuration);
        
        // Fade out and advance
        await this.fadeOut(bubble, this.timings.welcomeFadeOut);
        
        // Auto-advance to next phase
        if (this.currentPhase < 4) {
            this.playPhase(this.currentPhase + 1);
        }
    }

    async playWisdomPhase(phase) {
        const wisdomContainer = document.getElementById('jit-wisdom-container');
        const bubble = document.getElementById('jit-speech-bubble');
        
        // Hide speech bubble if visible
        bubble.style.opacity = '0';
        
        // Create wisdom cards
        wisdomContainer.innerHTML = '';
        phase.wisdomCards.forEach((card, index) => {
            const wisdomCard = document.createElement('div');
            wisdomCard.className = 'jit-wisdom-card';
            wisdomCard.style.cssText = `
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 24px;
                width: 200px;
                opacity: 0;
                transform: translateY(30px) scale(0.9);
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                
                &:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                }
            `;
            
            wisdomCard.innerHTML = `
                <h3 style="font-size: 14px; font-weight: 600; color: #007AFF; margin-bottom: 12px;">
                    ${card.title}
                </h3>
                <p style="font-size: 13px; line-height: 1.4; color: #1d1d1f;">
                    ${card.content}
                </p>
            `;
            
            wisdomContainer.appendChild(wisdomCard);
            
            // Stagger reveal
            setTimeout(() => {
                wisdomCard.style.opacity = '1';
                wisdomCard.style.transform = 'translateY(0) scale(1)';
            }, this.timings.wisdomRevealDelay + (index * this.timings.wisdomStagger));
        });
        
        wisdomContainer.style.opacity = '1';
        wisdomContainer.style.pointerEvents = 'auto';
    }

    positionBubbleNearAvatar(bubble) {
        // Smart positioning based on current avatar
        const avatarBg = document.querySelector('.avatar-background');
        const isKelly = avatarBg && avatarBg.classList.contains('kelly');
        
        // Position at avatar's speaking level
        bubble.style.top = '32vh';
        bubble.style.left = isKelly ? '65%' : '35%';
        bubble.style.transform = 'translateX(-50%)';
    }

    updateProgressDots() {
        document.querySelectorAll('.jit-dot').forEach((dot, index) => {
            if (index === this.currentPhase) {
                dot.style.background = '#007AFF';
                dot.style.width = '24px';
                dot.style.borderRadius = '12px';
            } else if (index < this.currentPhase) {
                dot.style.background = 'rgba(0, 122, 255, 0.5)';
                dot.style.width = '8px';
                dot.style.borderRadius = '50%';
            } else {
                dot.style.background = 'rgba(255, 255, 255, 0.4)';
                dot.style.width = '8px';
                dot.style.borderRadius = '50%';
            }
        });
    }

    goToPhase(phaseIndex) {
        if (phaseIndex >= 0 && phaseIndex < this.lessonData.phases.length) {
            this.clearAllContent();
            this.playPhase(phaseIndex);
        }
    }

    clearAllContent() {
        ['jit-speech-bubble', 'jit-choice-container', 'jit-wisdom-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
            }
        });
    }

    // Utility functions
    fadeIn(element, duration) {
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '1';
            setTimeout(resolve, duration);
        });
    }

    fadeOut(element, duration) {
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            setTimeout(resolve, duration);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jitLessonViewer = new JustInTimeLessonViewer();
    });
} else {
    window.jitLessonViewer = new JustInTimeLessonViewer();
}

// Export for integration
window.JustInTimeLessonViewer = JustInTimeLessonViewer;
