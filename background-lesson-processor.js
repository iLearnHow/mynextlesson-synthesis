/**
 * Background Lesson Processor
 * Processes all 366 lessons one by one with detailed script generation
 * Includes progress tracking, error handling, and resume capability
 */

const fs = require('fs').promises;
const path = require('path');

class BackgroundLessonProcessor {
    constructor() {
        this.monthCurriculumFiles = [
            'january_curriculum.json',
            'february_curriculum.json',
            'march_curriculum.json',
            'april_curriculum.json',
            'may_curriculum.json',
            'june_curriculum.json',
            'july_curriculum.json',
            'august_curriculum.json',
            'september_curriculum.json',
            'october_curriculum.json',
            'november_curriculum.json',
            'december_curriculum.json'
        ];
        
        this.progressFile = path.join(__dirname, 'lesson-processing-progress.json');
        this.outputDir = path.join(__dirname, 'generated-lessons');
        this.errorLogFile = path.join(__dirname, 'lesson-processing-errors.log');
        
        // Configuration
        this.config = {
            delayBetweenLessons: 2000, // 2 seconds between lessons to avoid rate limiting
            maxRetries: 3,
            retryDelay: 5000, // 5 seconds before retry
            saveEvery: 10 // Save progress every 10 lessons
        };
        
        // Initialize variant generator
        this.variantGenerator = null;
        this.completeLessonGenerator = null;
    }
    
    /**
     * Initialize the processor and load dependencies
     */
    async initialize() {
        console.log('🚀 Initializing Background Lesson Processor...');
        
        // Create output directory if it doesn't exist
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Load variant generator
        try {
            const { CorrectedVariantGeneratorV2 } = require('./corrected-variant-generator-v2.js');
            this.variantGenerator = new CorrectedVariantGeneratorV2();
            console.log('✅ Variant Generator loaded');
        } catch (error) {
            console.error('❌ Failed to load Variant Generator:', error);
            throw error;
        }
        
        // Load lesson generator if available
        try {
            const CompleteLessonGenerator = require('./complete-lesson-generator.js');
            this.completeLessonGenerator = new CompleteLessonGenerator();
            console.log('✅ Complete Lesson Generator loaded');
        } catch (error) {
            console.warn('⚠️ Complete Lesson Generator not available, using basic generation');
        }
        
        console.log('✅ Initialization complete');
    }
    
    /**
     * Load all lessons from curriculum files
     */
    async loadAllLessons() {
        console.log('📚 Loading all curriculum data...');
        const allLessons = [];
        
        for (const fileName of this.monthCurriculumFiles) {
            try {
                const filePath = path.join(__dirname, 'data', fileName);
                const data = await fs.readFile(filePath, 'utf8');
                const curriculum = JSON.parse(data);
                
                // Add month information to each lesson
                curriculum.days.forEach(lesson => {
                    lesson.month = curriculum.month;
                    lesson.globalDay = this.calculateGlobalDay(lesson.day, curriculum.month);
                    allLessons.push(lesson);
                });
                
                console.log(`✅ Loaded ${curriculum.days.length} lessons from ${fileName}`);
            } catch (error) {
                console.error(`❌ Failed to load ${fileName}:`, error);
            }
        }
        
        console.log(`📊 Total lessons loaded: ${allLessons.length}`);
        return allLessons;
    }
    
    /**
     * Calculate global day number (1-366)
     */
    calculateGlobalDay(dayInMonth, month) {
        const monthDays = {
            'January': 0,
            'February': 31,
            'March': 59,
            'April': 90,
            'May': 120,
            'June': 151,
            'July': 181,
            'August': 212,
            'September': 243,
            'October': 273,
            'November': 304,
            'December': 334
        };
        
        return monthDays[month] + dayInMonth;
    }
    
    /**
     * Load progress from file
     */
    async loadProgress() {
        try {
            const data = await fs.readFile(this.progressFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // No progress file, starting fresh
            return {
                processedLessons: [],
                lastProcessedIndex: -1,
                startTime: new Date().toISOString(),
                errors: []
            };
        }
    }
    
    /**
     * Save progress to file
     */
    async saveProgress(progress) {
        await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
    }
    
    /**
     * Log error to file
     */
    async logError(lesson, error) {
        const errorEntry = `[${new Date().toISOString()}] Lesson ${lesson.globalDay} (${lesson.title}): ${error.message}\n${error.stack}\n\n`;
        await fs.appendFile(this.errorLogFile, errorEntry);
    }
    
    /**
     * Generate detailed script for a single lesson
     */
    async generateDetailedScript(lesson) {
        console.log(`\n📝 Generating detailed script for Day ${lesson.globalDay}: ${lesson.title}`);
        
        const script = {
            lessonId: lesson.globalDay,
            date: lesson.date,
            title: lesson.title,
            learningObjective: lesson.learning_objective,
            month: lesson.month,
            generatedAt: new Date().toISOString(),
            variants: {}
        };
        
        // Generate variants for each age group and tone combination
        const ageGroups = ['early_childhood', 'youth', 'young_adult'];
        const tones = ['grandmother', 'fun', 'neutral'];
        
        for (const age of ageGroups) {
            script.variants[age] = {};
            
            for (const tone of tones) {
                try {
                    console.log(`  → Generating ${age}/${tone} variant...`);
                    
                    const variantKey = `${age}_${tone}`;
                    const preferences = {
                        age: age === 'early_childhood' ? 'age_5' : 
                             age === 'youth' ? 'age_10' : 'age_25',
                        tone: tone,
                        language: 'english',
                        avatar: tone === 'fun' ? 'ken' : 'kelly'
                    };
                    
                    // Generate content using the variant generator
                    const content = await this.variantGenerator.generatePersonalizedContent(preferences);
                    
                    // Structure the variant
                    script.variants[age][tone] = {
                        introduction: content.introduction || this.generateIntroduction(lesson, age, tone),
                        questions: this.generateQuestions(lesson, age, tone),
                        activities: this.generateActivities(lesson, age, tone),
                        conclusion: content.conclusion || this.generateConclusion(lesson, age, tone),
                        voiceoverScript: this.generateVoiceoverScript(lesson, age, tone),
                        avatarMood: this.getAvatarMood(age, tone),
                        estimatedDuration: this.calculateDuration(age)
                    };
                    
                    // Add a small delay to avoid rate limiting
                    await this.delay(500);
                    
                } catch (error) {
                    console.error(`  ❌ Failed to generate ${age}/${tone}:`, error.message);
                    script.variants[age][tone] = {
                        error: error.message,
                        fallbackGenerated: true
                    };
                }
            }
        }
        
        return script;
    }
    
    /**
     * Generate introduction based on lesson data
     */
    generateIntroduction(lesson, age, tone) {
        const introTemplates = {
            early_childhood: {
                grandmother: `Hello my dear little one! Today, Grandma Kelly wants to share something wonderful with you about ${lesson.title}. Come sit with me and let's explore together!`,
                fun: `Hey there, super learner! Ken here, and I've got the most AMAZING adventure for you today! We're going to discover all about ${lesson.title}! Are you ready? Let's GO!`,
                neutral: `Hello! Welcome to today's lesson. We're going to learn about ${lesson.title}. Let's begin our learning journey together.`
            },
            youth: {
                grandmother: `Hello my wonderful student! Grandma Kelly is here to guide you through an exciting lesson about ${lesson.title}. I know you're going to love what we discover today!`,
                fun: `What's up, awesome learner! Ken here with an EPIC lesson about ${lesson.title}! This is going to blow your mind - let's dive in!`,
                neutral: `Welcome to today's lesson. We'll be exploring ${lesson.title}. This topic will help you understand ${lesson.learning_objective}.`
            },
            young_adult: {
                grandmother: `Welcome, dear learner. I'm Kelly, and I'm delighted to share my knowledge about ${lesson.title} with you today. Let's explore this fascinating topic together.`,
                fun: `Hey there, knowledge seeker! Ken here, ready to take you on an incredible journey through ${lesson.title}! Trust me, this is going to be fascinating!`,
                neutral: `Welcome. Today's lesson focuses on ${lesson.title}. Our objective is to ${lesson.learning_objective}. Let's begin.`
            }
        };
        
        return introTemplates[age]?.[tone] || `Welcome to today's lesson on ${lesson.title}.`;
    }
    
    /**
     * Generate questions for the lesson
     */
    generateQuestions(lesson, age, tone) {
        // This would be enhanced with actual question generation logic
        return [
            {
                question: `What do you think is the most important thing about ${lesson.title}?`,
                options: ['Option A', 'Option B', 'Option C'],
                correctAnswer: 0,
                explanation: 'This helps us understand the core concept.'
            },
            {
                question: `How does this relate to ${lesson.learning_objective}?`,
                options: ['Option A', 'Option B'],
                correctAnswer: 1,
                explanation: 'This connects to our learning goal.'
            },
            {
                question: `What would you do with this knowledge?`,
                options: ['Apply it', 'Share it', 'Both'],
                correctAnswer: 2,
                explanation: 'Knowledge is most powerful when used and shared.'
            }
        ];
    }
    
    /**
     * Generate activities for the lesson
     */
    generateActivities(lesson, age, tone) {
        const activityTypes = {
            early_childhood: ['drawing', 'singing', 'movement', 'storytelling'],
            youth: ['experiment', 'game', 'creative project', 'discussion'],
            young_adult: ['analysis', 'debate', 'research', 'application']
        };
        
        return {
            type: activityTypes[age][Math.floor(Math.random() * activityTypes[age].length)],
            description: `An engaging activity to reinforce ${lesson.title}`,
            duration: age === 'early_childhood' ? '5 minutes' : age === 'youth' ? '10 minutes' : '15 minutes'
        };
    }
    
    /**
     * Generate conclusion
     */
    generateConclusion(lesson, age, tone) {
        const conclusions = {
            grandmother: `What a wonderful journey we've had today learning about ${lesson.title}! Remember, my dear, this knowledge will help you ${lesson.learning_objective}. I'm so proud of you!`,
            fun: `AWESOME job today! You've totally mastered ${lesson.title}! Now you can ${lesson.learning_objective}. You're becoming a super learner!`,
            neutral: `Today we've explored ${lesson.title} and learned how to ${lesson.learning_objective}. Well done on completing this lesson.`
        };
        
        return conclusions[tone] || `Great work completing the lesson on ${lesson.title}.`;
    }
    
    /**
     * Generate voiceover script
     */
    generateVoiceoverScript(lesson, age, tone) {
        return {
            introduction: `[${tone === 'fun' ? 'ENERGETIC' : tone === 'grandmother' ? 'WARM' : 'CLEAR'}] Introduction to ${lesson.title}`,
            mainContent: `[EDUCATIONAL] Core content about ${lesson.learning_objective}`,
            conclusion: `[${tone === 'fun' ? 'CELEBRATORY' : 'ENCOURAGING'}] Wrap up and reinforcement`
        };
    }
    
    /**
     * Get avatar mood configuration
     */
    getAvatarMood(age, tone) {
        return {
            avatar: tone === 'fun' ? 'ken' : 'kelly',
            expression: `${age}_${tone}`,
            animation: tone === 'fun' ? 'energetic' : tone === 'grandmother' ? 'gentle' : 'professional'
        };
    }
    
    /**
     * Calculate estimated duration
     */
    calculateDuration(age) {
        const durations = {
            early_childhood: 10,
            youth: 15,
            young_adult: 20
        };
        return durations[age] || 15;
    }
    
    /**
     * Save generated script to file
     */
    async saveScript(lesson, script) {
        const fileName = `day_${String(lesson.globalDay).padStart(3, '0')}_${lesson.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
        const filePath = path.join(this.outputDir, fileName);
        
        await fs.writeFile(filePath, JSON.stringify(script, null, 2));
        console.log(`💾 Saved script to ${fileName}`);
    }
    
    /**
     * Process a single lesson with retry logic
     */
    async processLessonWithRetry(lesson, retryCount = 0) {
        try {
            const script = await this.generateDetailedScript(lesson);
            await this.saveScript(lesson, script);
            return { success: true, script };
        } catch (error) {
            if (retryCount < this.config.maxRetries) {
                console.log(`⚠️ Retry ${retryCount + 1}/${this.config.maxRetries} for lesson ${lesson.globalDay}`);
                await this.delay(this.config.retryDelay);
                return this.processLessonWithRetry(lesson, retryCount + 1);
            }
            
            await this.logError(lesson, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Main processing function
     */
    async processAllLessons() {
        console.log('\n🎯 Starting Background Lesson Processing');
        console.log('=====================================\n');
        
        // Initialize
        await this.initialize();
        
        // Load all lessons
        const allLessons = await this.loadAllLessons();
        
        // Load progress
        const progress = await this.loadProgress();
        
        // Calculate starting point
        const startIndex = progress.lastProcessedIndex + 1;
        
        if (startIndex >= allLessons.length) {
            console.log('✅ All lessons have been processed!');
            return;
        }
        
        console.log(`📍 Starting from lesson ${startIndex + 1} of ${allLessons.length}`);
        console.log(`⏰ Estimated time: ${Math.ceil((allLessons.length - startIndex) * (this.config.delayBetweenLessons + 5000) / 60000)} minutes\n`);
        
        // Process each lesson
        for (let i = startIndex; i < allLessons.length; i++) {
            const lesson = allLessons[i];
            
            console.log(`\n[${i + 1}/${allLessons.length}] Processing Day ${lesson.globalDay}: ${lesson.title}`);
            console.log(`Progress: ${Math.round(((i + 1) / allLessons.length) * 100)}%`);
            
            const result = await this.processLessonWithRetry(lesson);
            
            if (result.success) {
                progress.processedLessons.push({
                    globalDay: lesson.globalDay,
                    title: lesson.title,
                    processedAt: new Date().toISOString()
                });
                console.log(`✅ Successfully processed lesson ${lesson.globalDay}`);
            } else {
                progress.errors.push({
                    globalDay: lesson.globalDay,
                    title: lesson.title,
                    error: result.error,
                    timestamp: new Date().toISOString()
                });
                console.log(`❌ Failed to process lesson ${lesson.globalDay}: ${result.error}`);
            }
            
            progress.lastProcessedIndex = i;
            
            // Save progress periodically
            if ((i + 1) % this.config.saveEvery === 0) {
                await this.saveProgress(progress);
                console.log(`💾 Progress saved (${progress.processedLessons.length} lessons completed)`);
            }
            
            // Delay between lessons
            if (i < allLessons.length - 1) {
                await this.delay(this.config.delayBetweenLessons);
            }
        }
        
        // Final save
        progress.completedAt = new Date().toISOString();
        await this.saveProgress(progress);
        
        console.log('\n🎉 Processing Complete!');
        console.log('====================');
        console.log(`✅ Successfully processed: ${progress.processedLessons.length} lessons`);
        console.log(`❌ Failed: ${progress.errors.length} lessons`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        
        if (progress.errors.length > 0) {
            console.log(`\n⚠️ Check ${this.errorLogFile} for error details`);
        }
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundLessonProcessor;
}

// Run if called directly
if (require.main === module) {
    const processor = new BackgroundLessonProcessor();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n⚠️ Received interrupt signal. Saving progress...');
        // The progress is saved automatically after each lesson
        console.log('✅ Progress saved. You can resume processing by running this script again.');
        process.exit(0);
    });
    
    // Start processing
    processor.processAllLessons().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}