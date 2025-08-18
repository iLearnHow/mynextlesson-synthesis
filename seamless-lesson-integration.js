/**
 * Seamless Lesson Integration
 * Replaces manifest-slide-viewer with just-in-time learning
 * Maximizes avatar wallpaper visibility
 */

class SeamlessLessonIntegration {
    constructor() {
        this.lessonData = null;
        this.currentVariant = null;
        this.init();
    }

    init() {
        // Hook into existing lesson systems
        this.hijackManifestViewer();
        this.setupLessonDataTransform();
        this.integrateWithExistingSystems();
    }

    hijackManifestViewer() {
        // Don't completely override - work alongside existing system
        console.log('🎯 JIT system ready - will enhance existing lessons');
        
        // Store references for enhancement
        if (window.lessonFix && window.lessonFix.displayManifestContent) {
            const originalDisplay = window.lessonFix.displayManifestContent;
            
            window.lessonFix.displayManifestContent = (manifest, variant) => {
                // Call original first to maintain existing functionality
                const result = originalDisplay.call(window.lessonFix, manifest, variant);
                
                // Then enhance with JIT features
                this.enhanceExistingLesson(manifest, variant);
                
                return result;
            };
        }
    }

    transformManifestToJIT(manifest, variant) {
        // Transform manifest slides to JIT phases
        const phases = [];
        
        manifest.slides.forEach((slide, index) => {
            if (index === 0) {
                // Welcome phase
                phases.push({
                    type: 'welcome',
                    content: this.createWelcomeContent(slide, variant)
                });
            } else if (slide.qa) {
                // Question phase
                phases.push({
                    type: 'question',
                    question: slide.qa.question,
                    choices: slide.qa.choices.map(choice => ({
                        text: choice.text,
                        isCorrect: choice.is_correct || false,
                        teachingMoment: choice.feedback || this.generateTeachingMoment(choice)
                    }))
                });
            } else if (index === manifest.slides.length - 1) {
                // Wisdom phase
                phases.push({
                    type: 'wisdom',
                    wisdomCards: this.createWisdomCards(slide, variant)
                });
            }
        });
        
        return {
            title: manifest.title,
            variant: variant,
            phases: phases
        };
    }

    createWelcomeContent(slide, variant) {
        const date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        return `Welcome! Today is ${date} at ${time}. Let's explore ${variant.topic} together. ${slide.content || ''}`;
    }

    generateTeachingMoment(choice) {
        // Generate age-appropriate teaching moments
        const age = parseInt(this.currentVariant?.age || '40');
        
        if (age <= 8) {
            return choice.is_correct 
                ? `Great choice! ${choice.text} is exactly right. You're learning so well!`
                : `Good thinking! Let's explore why ${choice.text} might not be the complete answer.`;
        } else if (age <= 25) {
            return choice.is_correct
                ? `Excellent insight! You've identified the key concept here.`
                : `Interesting perspective. Let's dive deeper into this concept.`;
        } else {
            return choice.is_correct
                ? `Precisely. Your understanding demonstrates real wisdom about this topic.`
                : `That's a thoughtful approach. Let's examine this from another angle.`;
        }
    }

    createWisdomCards(slide, variant) {
        // Create three wisdom cards from lesson content
        const cards = [
            {
                title: 'Reflection',
                content: this.extractReflection(slide, variant)
            },
            {
                title: 'Insight',
                content: this.extractInsight(slide, variant)
            },
            {
                title: 'Growth',
                content: this.extractGrowth(slide, variant)
            }
        ];
        
        return cards;
    }

    extractReflection(slide, variant) {
        const age = parseInt(variant.age || '40');
        const baseReflection = slide.fortune || slide.content || 'Take a moment to reflect on what you\'ve learned.';
        
        // Age-appropriate reflection
        if (age <= 12) {
            return `Remember: ${baseReflection.split('.')[0]}.`;
        } else if (age <= 40) {
            return baseReflection;
        } else {
            return `Through life's experiences, we understand: ${baseReflection}`;
        }
    }

    extractInsight(slide, variant) {
        const tone = variant.tone || 'neutral';
        const base = 'Every lesson connects us to something greater.';
        
        switch (tone) {
            case 'fun':
                return 'Learning is an adventure - enjoy every discovery!';
            case 'grandmother':
                return 'Wisdom grows when we share what we learn with others.';
            default:
                return base;
        }
    }

    extractGrowth(slide, variant) {
        return `Your understanding of ${variant.topic} will guide you in unexpected ways.`;
    }

    updateUIForLesson(manifest, variant) {
        // Update slide dots to work with JIT phases
        const dots = document.querySelectorAll('#slide-dots .sd-dot');
        dots.forEach((dot, index) => {
            if (index < 5) {
                dot.style.cursor = 'pointer';
                dot.onclick = () => {
                    if (window.jitLessonViewer) {
                        window.jitLessonViewer.goToPhase(index);
                    }
                };
            }
        });
        
        // Update variant display
        this.updateVariantCompact(variant);
        
        // Hide old overlays
        this.hideOldOverlays();
    }

    updateVariantCompact(variant) {
        const variantCompact = document.getElementById('variant-compact');
        if (variantCompact) {
            variantCompact.innerHTML = `
                <div class="pill" style="background: rgba(0, 122, 255, 0.1); color: #007AFF; font-weight: 500;">
                    ${variant.topic}
                </div>
                <div class="pill">${variant.avatar}</div>
                <div class="pill">${variant.tone}</div>
                <div class="pill">Age ${variant.age}</div>
            `;
        }
    }

    enhanceExistingLesson(manifest, variant) {
        // Enhance the existing lesson instead of hiding it
        console.log('🎯 Enhancing existing lesson with JIT features');
        
        // Store references
        this.lessonData = manifest;
        this.currentVariant = variant;
        
        // Make the existing viewer more minimal
        this.minimizeExistingViewer();
        
        // Add JIT enhancements
        this.addJITEnhancements(manifest, variant);
    }
    
    minimizeExistingViewer() {
        // Make existing viewer less intrusive, don't hide completely
        const viewer = document.getElementById('manifest-slide-viewer');
        if (viewer) {
            // Reduce padding and make more transparent
            viewer.style.padding = '20px';
            viewer.style.background = 'rgba(255, 255, 255, 0.85)';
            viewer.style.backdropFilter = 'blur(20px)';
            viewer.style.borderRadius = '16px';
            viewer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            
            // Position better to show more avatar
            viewer.style.top = '120px';
            viewer.style.width = '70%';
            viewer.style.maxWidth = '600px';
        }
    }
    
    addJITEnhancements(manifest, variant) {
        // Add JIT-style enhancements to existing lesson
        if (window.jitLessonViewer) {
            // Show JIT elements
            window.jitLessonViewer.showJITElements();
            
            // Show JIT progress dots
            const progressDots = document.getElementById('jit-progress-dots');
            if (progressDots) {
                progressDots.style.display = 'flex';
                this.updateJITProgress(manifest.slides.length);
            }
        }
    }
    
    updateJITProgress(totalSlides) {
        const dots = document.querySelectorAll('.jit-dot');
        dots.forEach((dot, index) => {
            if (index < totalSlides) {
                dot.style.display = 'block';
                dot.onclick = () => {
                    // Navigate to slide
                    if (window.lessonFix && window.lessonFix.currentSlideIndex !== undefined) {
                        window.lessonFix.currentSlideIndex = index;
                        // Trigger slide change
                        if (window.lessonFix.renderSlide) {
                            window.lessonFix.renderSlide(index);
                        }
                    }
                };
            } else {
                dot.style.display = 'none';
            }
        });
    }

    setupLessonDataTransform() {
        // Transform lesson player data to JIT format
        if (window.lessonPlayer) {
            const originalGenerate = window.lessonPlayer.generateLessonContent;
            
            if (originalGenerate) {
                window.lessonPlayer.generateLessonContent = function(...args) {
                    const result = originalGenerate.apply(this, args);
                    
                    // Transform to JIT format
                    if (window.jitLessonViewer && result) {
                        const jitData = window.seamlessIntegration.transformLessonToJIT(result);
                        window.dispatchEvent(new CustomEvent('jit:loadLesson', { 
                            detail: jitData 
                        }));
                    }
                    
                    return result;
                };
            }
        }
    }

    transformLessonToJIT(lessonData) {
        // Transform complete lesson player data to JIT format
        const phases = [];
        
        // Welcome phase
        phases.push({
            type: 'welcome',
            content: lessonData.openingContent || 'Welcome to today\'s lesson!'
        });
        
        // Question phases
        if (lessonData.questions) {
            lessonData.questions.forEach(q => {
                phases.push({
                    type: 'question',
                    question: q.text,
                    choices: q.options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                        teachingMoment: opt.feedback
                    }))
                });
            });
        }
        
        // Wisdom phase
        phases.push({
            type: 'wisdom',
            wisdomCards: [
                { title: 'Reflection', content: lessonData.reflection || 'Reflect on your learning.' },
                { title: 'Insight', content: lessonData.insight || 'Every lesson brings new understanding.' },
                { title: 'Growth', content: lessonData.fortune || 'Your knowledge continues to grow.' }
            ]
        });
        
        return {
            title: lessonData.title,
            variant: lessonData.variant,
            phases: phases
        };
    }

    integrateWithExistingSystems() {
        // Play/pause integration
        const playPauseBtn = document.getElementById('play-pause-master');
        if (playPauseBtn) {
            const originalClick = playPauseBtn.onclick;
            playPauseBtn.onclick = (e) => {
                if (originalClick) originalClick(e);
                
                // Start JIT lesson if paused
                if (window.unifiedControls?.currentState?.isPlaying && window.jitLessonViewer) {
                    if (!window.jitLessonViewer.lessonData && this.lessonData) {
                        window.dispatchEvent(new CustomEvent('jit:loadLesson', { 
                            detail: this.lessonData 
                        }));
                    }
                }
            };
        }
        
        // Start button integration
        const startBtn = document.getElementById('start-lesson-btn');
        if (startBtn) {
            const originalClick = startBtn.onclick;
            startBtn.onclick = (e) => {
                if (originalClick) originalClick(e);
                
                // Hide start overlay immediately
                const startOverlay = document.getElementById('start-overlay');
                if (startOverlay) startOverlay.style.display = 'none';
                
                // Start JIT lesson
                if (window.jitLessonViewer && this.lessonData) {
                    window.dispatchEvent(new CustomEvent('jit:loadLesson', { 
                        detail: this.lessonData 
                    }));
                }
            };
        }
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.seamlessIntegration = new SeamlessLessonIntegration();
    });
} else {
    window.seamlessIntegration = new SeamlessLessonIntegration();
}

// Export for other systems
window.SeamlessLessonIntegration = SeamlessLessonIntegration;
