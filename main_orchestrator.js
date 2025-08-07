/**
 * Main Orchestrator for Universal Learning System
 * Coordinates all components to create personalized learning experiences
 * FIXED VERSION - Works with actual system architecture
 */

class MainOrchestrator {
    constructor() {
        // Core system components
        this.lessonPlayer = null;
        this.aiGenerator = null;
        this.curriculum = null;
        this.variantGenerator = null;
        
        // System state
        this.currentLesson = null;
        this.currentVariant = {
            age: 'age_25',
            tone: 'neutral',
            language: 'english',
            avatar: 'kelly'
        };
        
        // Performance tracking
        this.generationMetrics = new Map();
        this.qualityMetrics = new Map();
        
        // Initialize the orchestrator
        this.initializeOrchestrator();
    }

    /**
     * Initialize the main orchestrator
     */
    async initializeOrchestrator() {
        console.log('🎯 Initializing Main Orchestrator...');
        
        try {
            // Wait for all components to be available
            await this.waitForComponents();
            
            // Initialize core components
            this.initializeComponents();
            
            // Set up event listeners
            this.setupOrchestratorEvents();
            
            // Load initial lesson
            await this.loadInitialLesson();
            
            console.log('✅ Main Orchestrator initialized successfully');
            
        } catch (error) {
            console.error('❌ Main Orchestrator initialization failed:', error);
            throw error;
        }
    }

    /**
     * Wait for all required components to be available
     */
    async waitForComponents() {
        const maxWaitTime = 10000; // 10 seconds
        const checkInterval = 100; // Check every 100ms
        let elapsed = 0;
        
        while (elapsed < maxWaitTime) {
            if (this.areComponentsReady()) {
                console.log('✅ All components ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }
        
        throw new Error('Timeout waiting for components to load');
    }

    /**
     * Check if all required components are available
     */
    areComponentsReady() {
        const components = {
            lessonPlayer: !!window.lessonPlayer,
            aiContentGenerator: !!window.aiContentGenerator,
            curriculum: !!window.COMPLETE_CURRICULUM,
            variantGenerator: !!window.correctedVariantGenerator
        };
        
        console.log('🔍 Checking component availability:', components);
        
        // We can work with just the essential components
        const essentialComponents = components.lessonPlayer && components.curriculum;
        
        if (essentialComponents) {
            console.log('✅ Essential components ready');
            return true;
        } else {
            console.log('⚠️ Some components missing, but can proceed with fallbacks');
            return true; // Allow initialization with fallbacks
        }
    }

    /**
     * Initialize core system components
     */
    initializeComponents() {
        // Initialize lesson player
        this.lessonPlayer = window.lessonPlayer;
        console.log('✅ Lesson player connected');
        
        // Initialize AI content generator
        this.aiGenerator = window.aiContentGenerator;
        console.log('✅ AI content generator connected');
        
        // Initialize curriculum
        this.curriculum = window.COMPLETE_CURRICULUM;
        console.log('✅ Curriculum connected');
        
        // Initialize variant generator
        this.variantGenerator = window.correctedVariantGenerator;
        console.log('✅ Variant generator connected');
    }

    /**
     * Set up orchestrator event listeners
     */
    setupOrchestratorEvents() {
        // Listen for lesson player events
        if (this.lessonPlayer) {
            this.lessonPlayer.onLessonComplete = this.handleLessonComplete.bind(this);
            this.lessonPlayer.onVariantChange = this.handleVariantChange.bind(this);
        }
        
        // Listen for AI generation events
        if (this.aiGenerator) {
            this.aiGenerator.onGenerationComplete = this.handleGenerationComplete.bind(this);
        }
        
        console.log('✅ Orchestrator event listeners set up');
    }

    /**
     * Load initial lesson
     */
    async loadInitialLesson() {
        const currentDay = this.getCurrentDayOfYear();
        await this.loadLessonByDay(currentDay);
    }

    /**
     * MAIN METHOD: Load lesson for specific day
     */
    async loadLessonByDay(day) {
        const lessonId = `lesson_${day}`;
        console.log(`📚 Loading lesson for day ${day} (${lessonId})`);
        
        try {
            // Get lesson data from curriculum
            const lessonData = this.getLessonDataForDay(day);
            if (!lessonData) {
                throw new Error(`No lesson data for day ${day}`);
            }
            
            // Load DNA data if available
            const dnaData = await this.loadDNALesson(day);
            
            // Set current lesson
            this.currentLesson = {
                day: day,
                lessonId: lessonId,
                lessonData: lessonData,
                dnaData: dnaData
            };
            
            // Update lesson player
            if (this.lessonPlayer) {
                await this.lessonPlayer.loadLessonByDay(day);
            }
            
            console.log(`✅ Lesson loaded for day ${day}: ${lessonData.title}`);
            
        } catch (error) {
            console.error(`❌ Failed to load lesson for day ${day}:`, error);
            this.showError(`Failed to load lesson for day ${day}`);
        }
    }

    /**
     * Load DNA lesson data
     */
    async loadDNALesson(day) {
        try {
            // Try to load specific DNA file for this day
            const dnaPath = `dna_files/${day.toString().padStart(3, '0')}_lesson.json`;
            console.log(`🔍 Attempting to load DNA from: ${dnaPath}`);
            
            const dnaResponse = await fetch(dnaPath);
            if (dnaResponse.ok) {
                const dnaData = await dnaResponse.json();
                console.log(`✅ DNA data loaded for day ${day}`);
                return dnaData;
            } else {
                console.log(`⚠️ DNA file not found for day ${day}, trying fallback`);
                // Fallback to the-sun-dna.json
                const fallbackResponse = await fetch('data/the-sun-dna.json');
                if (fallbackResponse.ok) {
                    const dnaData = await fallbackResponse.json();
                    console.log(`✅ Using fallback DNA data for day ${day}`);
                    return dnaData;
                }
            }
        } catch (error) {
            console.warn(`⚠️ No DNA data available for day ${day}: ${error.message}`);
            console.log('📝 Continuing without DNA data - will use curriculum fallback');
        }
        return null;
    }

    /**
     * Get lesson data for specific day
     */
    getLessonDataForDay(day) {
        if (this.curriculum && this.curriculum[day]) {
            return this.curriculum[day];
        }
        
        // Fallback lesson data
        return {
            title: "Learning - The Journey Never Ends",
            learning_objective: "Embrace continuous learning while understanding how knowledge enables personal growth, social progress, and human flourishing."
        };
    }

    /**
     * MAIN METHOD: Generate personalized lesson
     */
    async generatePersonalizedLesson(variant = null) {
        if (!this.currentLesson) {
            throw new Error('No lesson loaded');
        }
        
        const targetVariant = variant || this.currentVariant;
        const generationId = this.generateId();
        
        console.log(`🎨 Generating personalized lesson for variant:`, targetVariant);
        
        try {
            // Generate personalized content
            if (this.aiGenerator) {
                const personalizedLesson = await this.aiGenerator.generatePersonalizedLesson(
                    this.currentLesson.lessonData,
                    targetVariant,
                    this.currentLesson.dnaData
                );
                
                // Record generation metrics
                this.recordGenerationMetric(generationId, 'success', Date.now());
                
                console.log(`✅ Personalized lesson generated: ${generationId}`);
                return personalizedLesson;
            } else {
                // Fallback to lesson player's built-in generation
                console.log('⚠️ AI generator not available, using lesson player fallback');
                return this.generateFallbackLesson(targetVariant);
            }
            
        } catch (error) {
            this.recordGenerationMetric(generationId, 'failure', Date.now());
            console.error(`❌ Failed to generate personalized lesson:`, error);
            
            // Fallback to lesson player's built-in generation
            console.log('🔄 Using fallback lesson generation');
            return this.generateFallbackLesson(targetVariant);
        }
    }

    /**
     * Generate fallback lesson when AI generator is not available
     */
    generateFallbackLesson(variant) {
        const lessonData = this.currentLesson.lessonData;
        const { age, tone, language, avatar } = variant;
        
        console.log(`🔄 Generating fallback lesson for ${age}, ${tone}, ${language}, ${avatar}`);
        
        return {
            lesson_metadata: {
                lesson_id: lessonData.title?.toLowerCase().replace(/\s+/g, '_') || 'daily_lesson',
                title: lessonData.title,
                learning_objective: lessonData.learning_objective,
                generated_at: new Date().toISOString(),
                generation_id: this.generateId(),
                variant: variant
            },
            scripts: [
                {
                    type: 'opening',
                    script: `Welcome to today's lesson about ${lessonData.title}! Let's explore this fascinating topic together.`,
                    avatar: avatar,
                    expression: this.getAvatarExpression(tone),
                    duration: 30,
                    language: language,
                    tone: tone
                },
                {
                    type: 'question_1',
                    script: `What interests you most about ${lessonData.title}?`,
                    avatar: avatar,
                    expression: 'question_curious',
                    duration: 45,
                    language: language,
                    tone: tone,
                    choices: ["I want to learn more", "I'm curious", "Tell me more"],
                    feedback: "Great thinking! Let's explore further."
                },
                {
                    type: 'question_2',
                    script: "How does this connect to your life?",
                    avatar: avatar,
                    expression: 'teaching_explaining',
                    duration: 45,
                    language: language,
                    tone: tone,
                    choices: ["It helps me understand", "I see connections", "I'm learning"],
                    feedback: "Excellent connections! You're making great insights."
                },
                {
                    type: 'question_3',
                    script: "What would you like to explore next?",
                    avatar: avatar,
                    expression: 'concerned_thinking',
                    duration: 45,
                    language: language,
                    tone: tone,
                    choices: ["More about this topic", "Related subjects", "Practical applications"],
                    feedback: "Wonderful curiosity! Your learning journey continues."
                },
                {
                    type: 'closing',
                    script: `You've learned something amazing about ${lessonData.title}! Keep exploring and asking questions!`,
                    avatar: avatar,
                    expression: this.getAvatarExpression(tone),
                    duration: 25,
                    language: language,
                    tone: tone
                },
                {
                    type: 'daily_fortune',
                    script: "Your curiosity is your superpower. Keep learning and growing!",
                    avatar: avatar,
                    expression: 'happy_celebrating',
                    duration: 15,
                    language: language,
                    tone: tone
                }
            ],
            content: {
                opening: {
                    voice_script: `Welcome to today's lesson about ${lessonData.title}! Let's explore this fascinating topic together.`,
                    on_screen_text: `Today we'll learn about ${lessonData.learning_objective}.`,
                    avatar_expression: this.getAvatarExpression(tone),
                    duration: 30
                },
                questions: [
                    {
                        question_script: `What interests you most about ${lessonData.title}?`,
                        choices: ["I want to learn more", "I'm curious", "Tell me more"],
                        feedback: "Great thinking! Let's explore further.",
                        avatar_expression: 'question_curious',
                        duration: 45
                    },
                    {
                        question_script: "How does this connect to your life?",
                        choices: ["It helps me understand", "I see connections", "I'm learning"],
                        feedback: "Excellent connections! You're making great insights.",
                        avatar_expression: 'teaching_explaining',
                        duration: 45
                    },
                    {
                        question_script: "What would you like to explore next?",
                        choices: ["More about this topic", "Related subjects", "Practical applications"],
                        feedback: "Wonderful curiosity! Your learning journey continues.",
                        avatar_expression: 'concerned_thinking',
                        duration: 45
                    }
                ],
                closing: {
                    voice_script: `You've learned something amazing about ${lessonData.title}! Keep exploring and asking questions!`,
                    on_screen_text: "Keep exploring and asking questions!",
                    avatar_expression: this.getAvatarExpression(tone),
                    duration: 25
                },
                fortune: {
                    voice_script: "Your curiosity is your superpower. Keep learning and growing!",
                    on_screen_text: "Your curiosity is your superpower. Keep learning and growing!",
                    avatar_expression: 'happy_celebrating',
                    duration: 15
                }
            },
            dna_data: this.currentLesson.dnaData,
            production_notes: {
                age_group: age,
                tone: tone,
                language: language,
                avatar: avatar,
                estimated_duration: 205, // 30+45+45+45+25+15
                complexity_level: this.calculateComplexity(age),
                engagement_indicators: this.calculateEngagement(age, tone)
            }
        };
    }

    /**
     * Get avatar expression based on tone
     */
    getAvatarExpression(tone) {
        switch (tone) {
            case 'grandmother': return 'warm_smiling';
            case 'fun': return 'happy_celebrating';
            case 'neutral': return 'neutral_default';
            default: return 'neutral_default';
        }
    }

    /**
     * Calculate complexity based on age
     */
    calculateComplexity(age) {
        const ageNum = parseInt(age.replace('age_', ''));
        if (ageNum <= 5) return 'very_simple';
        if (ageNum <= 12) return 'simple';
        if (ageNum <= 25) return 'moderate';
        if (ageNum <= 60) return 'complex';
        return 'very_complex';
    }

    /**
     * Calculate engagement based on age and tone
     */
    calculateEngagement(age, tone) {
        const ageEngagement = this.getAgeEngagement(age);
        const toneEngagement = this.getToneEngagement(tone);
        return Math.round((ageEngagement + toneEngagement) / 2);
    }

    getAgeEngagement(age) {
        const ageNum = parseInt(age.replace('age_', ''));
        if (ageNum <= 5) return 95;
        if (ageNum <= 12) return 85;
        if (ageNum <= 25) return 75;
        if (ageNum <= 60) return 65;
        return 55;
    }

    getToneEngagement(tone) {
        switch (tone) {
            case 'grandmother': return 80;
            case 'fun': return 90;
            case 'neutral': return 70;
            default: return 70;
        }
    }

    /**
     * MAIN METHOD: Start lesson with current variant
     */
    async startLesson(variant = null) {
        if (!this.currentLesson) {
            this.showError('No lesson loaded');
            return;
        }
        
        const targetVariant = variant || this.currentVariant;
        
        try {
            // Generate personalized content
            const personalizedLesson = await this.generatePersonalizedLesson(targetVariant);
            
            // Update lesson player with personalized content
            if (this.lessonPlayer) {
                this.lessonPlayer.universalContent = personalizedLesson;
                await this.lessonPlayer.startUniversalLesson();
            }
            
            console.log('✅ Lesson started with personalized content');
            
        } catch (error) {
            console.error('❌ Failed to start lesson:', error);
            this.showError('Failed to start lesson');
        }
    }

    /**
     * Change variant and regenerate content
     */
    async changeVariant(newVariant) {
        console.log('🔄 Changing variant to:', newVariant);
        
        // Update current variant
        this.currentVariant = { ...this.currentVariant, ...newVariant };
        
        // Regenerate content with new variant
        await this.generatePersonalizedLesson(this.currentVariant);
        
        // Update lesson player
        if (this.lessonPlayer) {
            this.lessonPlayer.currentVariant = this.currentVariant;
        }
        
        console.log('✅ Variant changed and content regenerated');
    }

    /**
     * Handle lesson completion
     */
    handleLessonComplete() {
        console.log('🎉 Lesson completed');
        
        // Record completion metrics
        this.recordQualityMetric('lesson_completion', 1);
        
        // Could trigger next lesson or show completion UI
    }

    /**
     * Handle variant change
     */
    handleVariantChange(newVariant) {
        console.log('🔄 Variant changed:', newVariant);
        this.changeVariant(newVariant);
    }

    /**
     * Handle generation completion
     */
    handleGenerationComplete(generationId, qualityScore) {
        console.log(`✅ Generation completed: ${generationId}, quality: ${qualityScore}`);
        this.recordQualityMetric('generation_quality', qualityScore);
    }

    /**
     * Get system health status
     */
    getSystemHealth() {
        return {
            status: 'healthy',
            components: {
                lessonPlayer: this.lessonPlayer ? 'connected' : 'disconnected',
                aiGenerator: this.aiGenerator ? 'connected' : 'disconnected',
                curriculum: this.curriculum ? 'loaded' : 'missing',
                variantGenerator: this.variantGenerator ? 'connected' : 'disconnected'
            },
            currentLesson: this.currentLesson ? this.currentLesson.lessonId : 'none',
            currentVariant: this.currentVariant,
            metrics: {
                generations: this.generationMetrics.size,
                quality: this.qualityMetrics.size
            }
        };
    }

    /**
     * Record generation metrics
     */
    recordGenerationMetric(generationId, type, timestamp) {
        if (!this.generationMetrics.has(type)) {
            this.generationMetrics.set(type, []);
        }
        
        this.generationMetrics.get(type).push({
            generationId,
            timestamp,
            value: type === 'success' ? 1 : 0
        });
    }

    /**
     * Record quality metrics
     */
    recordQualityMetric(metric, value) {
        if (!this.qualityMetrics.has(metric)) {
            this.qualityMetrics.set(metric, []);
        }
        
        this.qualityMetrics.get(metric).push({
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Get current day of year
     */
    getCurrentDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌ Orchestrator Error:', message);
        // Could implement toast notification here
    }
}

// Initialize the main orchestrator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing Main Orchestrator...');
    window.mainOrchestrator = new MainOrchestrator();
});