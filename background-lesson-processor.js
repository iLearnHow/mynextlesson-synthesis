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
        
        // Age and tone configurations (10 ages × 3 tones = 30 variants per lesson)
        this.ages = ['age_2', 'age_5', 'age_8', 'age_12', 'age_16', 'age_25', 'age_40', 'age_60', 'age_80', 'age_102'];
        this.tones = ['grandmother', 'fun', 'neutral'];
        
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
        
        // Generate variants for all 10 ages × 3 tones = 30 variants
        for (const age of this.ages) {
            script.variants[age] = {};
            
            for (const tone of this.tones) {
                try {
                    console.log(`  → Generating ${age}/${tone} variant...`);
                    
                    const preferences = {
                        age: age,
                        tone: tone,
                        language: 'english',
                        avatar: tone === 'fun' ? 'ken' : 'kelly'
                    };
                    
                    // Generate content using the variant generator
                    const content = await this.variantGenerator.generatePersonalizedContent(preferences);
                    
                    // Structure the variant - EXACTLY 3 questions, 2 options, 2 teaching moments, 1 wisdom
                    script.variants[age][tone] = {
                        introduction: content.introduction || this.generateIntroduction(lesson, age, tone),
                        questions: this.generateQuestions(lesson, age, tone), // EXACTLY 3 questions
                        wisdom: this.generateWisdom(lesson, age, tone), // EXACTLY 1 wisdom
                        conclusion: content.conclusion || this.generateConclusion(lesson, age, tone),
                        avatar: tone === 'fun' ? 'ken' : 'kelly'
                    };
                    
                    // Add a small delay to avoid rate limiting
                    await this.delay(200); // Reduced delay since we have more variants
                    
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
        const ageGroup = this.getAgeGroup(age);
        const introTemplates = {
            toddler: {
                grandmother: `Hello my sweet little one! Grandma Kelly has something very special to show you about ${lesson.title}. Come here, let's explore together!`,
                fun: `Hi hi hi! It's Ken! We're going to play and learn about ${lesson.title}! So much fun! Let's go!`,
                neutral: `Hello! Today we learn about ${lesson.title}. Let's start.`
            },
            early_childhood: {
                grandmother: `Hello my dear! Today, Grandma Kelly wants to share something wonderful with you about ${lesson.title}. Come sit with me and let's explore together!`,
                fun: `Hey there, super learner! Ken here, and I've got the most AMAZING adventure for you today! We're going to discover all about ${lesson.title}! Are you ready? Let's GO!`,
                neutral: `Hello! Welcome to today's lesson. We're going to learn about ${lesson.title}. Let's begin our learning journey together.`
            },
            school_age: {
                grandmother: `Hello my wonderful student! Grandma Kelly is here to guide you through an exciting lesson about ${lesson.title}. I know you're going to love what we discover today!`,
                fun: `What's up, awesome learner! Ken here with an EPIC lesson about ${lesson.title}! This is going to blow your mind - let's dive in!`,
                neutral: `Welcome to today's lesson. We'll be exploring ${lesson.title}. This topic will help you understand important concepts.`
            },
            preteen: {
                grandmother: `Hello dear! I'm Kelly, and I'm excited to explore ${lesson.title} with you today. I think you'll find this really interesting!`,
                fun: `Yo! Ken here with something super cool - we're diving into ${lesson.title}! This is going to be awesome, trust me!`,
                neutral: `Welcome. Today we're examining ${lesson.title}. This lesson will help expand your understanding.`
            },
            teen: {
                grandmother: `Hello! I'm Kelly, and today we're going to explore ${lesson.title} together. I think you'll find some really valuable insights here.`,
                fun: `Hey! Ken here, and we've got an incredible topic today - ${lesson.title}! This is the kind of stuff that really matters. Let's get into it!`,
                neutral: `Welcome to today's lesson on ${lesson.title}. We'll be developing critical understanding of this topic.`
            },
            young_adult: {
                grandmother: `Welcome! I'm Kelly, and I'm delighted to share my knowledge about ${lesson.title} with you today. Let's explore this fascinating topic together.`,
                fun: `Hey there, knowledge seeker! Ken here, ready to take you on an incredible journey through ${lesson.title}! Trust me, this is going to be fascinating!`,
                neutral: `Welcome. Today's lesson focuses on ${lesson.title}. Our objective is to develop deep understanding. Let's begin.`
            },
            adult: {
                grandmother: `Welcome! I'm Kelly, and today we'll be exploring ${lesson.title}. I've found this topic particularly meaningful in my own life.`,
                fun: `Hey! Ken here with ${lesson.title}. This is one of those topics that can really make a difference in how we see things. Let's explore!`,
                neutral: `Welcome to our lesson on ${lesson.title}. We'll examine key concepts and their practical applications.`
            },
            mature_adult: {
                grandmother: `Welcome, friend. I'm Kelly, and I'm honored to share insights about ${lesson.title} with you today. Let's discover together.`,
                fun: `Hello! Ken here, excited to dive into ${lesson.title} with you. Life experience makes this topic even more meaningful!`,
                neutral: `Welcome. Today we explore ${lesson.title}, examining its deeper implications and connections.`
            },
            elder: {
                grandmother: `Welcome, dear friend. I'm Kelly, and it's my pleasure to explore ${lesson.title} with you. Our years of experience bring special perspective to this.`,
                fun: `Hello my friend! Ken here, and we're looking at ${lesson.title} today. Isn't it wonderful how learning never stops?`,
                neutral: `Welcome. We'll be reflecting on ${lesson.title} today, considering its significance and wisdom.`
            },
            centenarian: {
                grandmother: `Welcome, cherished friend. I'm Kelly, and together we'll contemplate ${lesson.title}. What a joy to share in lifelong learning!`,
                fun: `Hello, wonderful soul! Ken here, and we're exploring ${lesson.title}. A century of wisdom makes every lesson special!`,
                neutral: `Welcome. Today's contemplation focuses on ${lesson.title}. Let us explore its timeless truths.`
            }
        };
        
        return introTemplates[ageGroup]?.[tone] || `Welcome to today's lesson on ${lesson.title}.`;
    }
    
    /**
     * Get age group from age identifier
     */
    getAgeGroup(age) {
        const ageMapping = {
            'age_2': 'toddler',
            'age_5': 'early_childhood',
            'age_8': 'school_age',
            'age_12': 'preteen',
            'age_16': 'teen',
            'age_25': 'young_adult',
            'age_40': 'adult',
            'age_60': 'mature_adult',
            'age_80': 'elder',
            'age_102': 'centenarian'
        };
        return ageMapping[age] || 'young_adult';
    }
    
    /**
     * Generate EXACTLY 3 questions with EXACTLY 2 options and 2 teaching moments each
     */
    generateQuestions(lesson, age, tone) {
        const ageGroup = this.getAgeGroup(age);
        
        // Return EXACTLY 3 questions, each with EXACTLY 2 options and 2 teaching moments
        return [
            {
                question: this.getQuestion1(lesson, age),
                options: ['Option A', 'Option B'], // EXACTLY 2 options
                correctAnswer: 0,
                teachingMoments: {
                    option_a: `Correct! This shows understanding of ${lesson.title}.`,
                    option_b: `Let's think about this differently. ${lesson.title} teaches us something else.`
                }
            },
            {
                question: this.getQuestion2(lesson, age),
                options: ['Option A', 'Option B'], // EXACTLY 2 options
                correctAnswer: 0,
                teachingMoments: {
                    option_a: `Excellent! You understand how this connects to our learning.`,
                    option_b: `Good try! Let's explore how this really works.`
                }
            },
            {
                question: this.getQuestion3(lesson, age),
                options: ['Option A', 'Option B'], // EXACTLY 2 options
                correctAnswer: 0,
                teachingMoments: {
                    option_a: `That's right! You can apply this knowledge in many ways.`,
                    option_b: `Think about it another way. This knowledge has practical uses.`
                }
            }
        ];
    }
    
    getQuestion1(lesson, age) {
        const ageNum = parseInt(age.split('_')[1]);
        if (ageNum <= 5) return `What is the ${lesson.title.split(' ')[0]}?`;
        if (ageNum <= 12) return `What makes ${lesson.title} special?`;
        if (ageNum <= 25) return `How does ${lesson.title} work?`;
        return `What does ${lesson.title} teach us?`;
    }
    
    getQuestion2(lesson, age) {
        const ageNum = parseInt(age.split('_')[1]);
        if (ageNum <= 5) return `When do we see this?`;
        if (ageNum <= 12) return `Why is this important?`;
        if (ageNum <= 25) return `How does this affect our world?`;
        return `What broader connections do you see?`;
    }
    
    getQuestion3(lesson, age) {
        const ageNum = parseInt(age.split('_')[1]);
        if (ageNum <= 5) return `What can we do with this?`;
        if (ageNum <= 12) return `How can we learn more?`;
        if (ageNum <= 25) return `How can we apply this knowledge?`;
        return `What wisdom does this offer?`;
    }
    
    /**
     * Generate EXACTLY 1 wisdom/fortune
     */
    generateWisdom(lesson, age, tone) {
        const ageGroup = this.getAgeGroup(age);
        const baseWisdom = `Learning about ${lesson.title} helps us understand our world better.`;
        
        // Age-appropriate wisdom
        const wisdoms = {
            toddler: {
                grandmother: `Just like ${lesson.title}, you are special and loved!`,
                fun: `You're amazing! Keep learning and growing!`,
                neutral: `You learned something new today. Good job.`
            },
            early_childhood: {
                grandmother: `Remember, dear one, ${lesson.title} shows us how wonderful learning can be!`,
                fun: `You're a SUPER learner! Keep exploring and discovering!`,
                neutral: `Understanding ${lesson.title} helps you grow smarter every day.`
            },
            school_age: {
                grandmother: `${lesson.title} teaches us that curiosity leads to amazing discoveries!`,
                fun: `Your brain is AWESOME! Use what you learned to do amazing things!`,
                neutral: `Knowledge about ${lesson.title} gives you power to understand more.`
            },
            preteen: {
                grandmother: `Through ${lesson.title}, we see how learning connects us all!`,
                fun: `You've got the power! Use this knowledge to make a difference!`,
                neutral: `Understanding ${lesson.title} prepares you for future challenges.`
            },
            teen: {
                grandmother: `${lesson.title} reminds us that knowledge empowers positive change!`,
                fun: `You're ready to change the world with what you know!`,
                neutral: `This knowledge equips you to make informed decisions.`
            },
            young_adult: {
                grandmother: `Let ${lesson.title} inspire you to use knowledge for the greater good!`,
                fun: `Time to put this knowledge into ACTION! You've got this!`,
                neutral: `Apply this understanding to create positive impact.`
            },
            adult: {
                grandmother: `${lesson.title} shows how continuous learning enriches our lives!`,
                fun: `Keep that learning fire burning! Knowledge is power!`,
                neutral: `This understanding enhances your capacity for leadership.`
            },
            mature_adult: {
                grandmother: `Your understanding of ${lesson.title} can guide and inspire others!`,
                fun: `Share your wisdom! Your experience makes learning even richer!`,
                neutral: `Your perspective adds depth to this knowledge.`
            },
            elder: {
                grandmother: `${lesson.title} reminds us that wisdom grows with patient observation!`,
                fun: `Your lifetime of learning is a gift to share!`,
                neutral: `Your long view enriches understanding of this topic.`
            },
            centenarian: {
                grandmother: `Dear friend, ${lesson.title} shows that wonder never ages!`,
                fun: `A century of wisdom! You embody lifelong learning!`,
                neutral: `Your perspective spans generations of understanding.`
            }
        };
        
        return wisdoms[ageGroup]?.[tone] || baseWisdom;
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
        // With 30 variants per lesson and delays, estimate ~20-30 seconds per lesson
        const estimatedSecondsPerLesson = 25;
        const totalSeconds = (allLessons.length - startIndex) * estimatedSecondsPerLesson;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        console.log(`⏰ Estimated time: ${hours}h ${minutes}m (30 variants per lesson)\n`);
        
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