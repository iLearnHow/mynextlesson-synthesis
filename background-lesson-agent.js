#!/usr/bin/env node

/**
 * Background Agent for 366 Lesson Processing
 * 
 * This agent runs autonomously to process all 366 lessons one by one
 * with detailed script generation using the existing system components.
 * 
 * Features:
 * - One-by-one processing (no batch processing)
 * - Progress tracking and resumption
 * - Comprehensive logging
 * - Error handling and retry logic
 * - Integration with existing lesson generation system
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Import existing system components
const { COMPLETE_CURRICULUM, getLessonDataForDay } = require('./complete-curriculum.js');

class BackgroundLessonAgent {
    constructor() {
        this.totalLessons = 366;
        this.currentDay = 1;
        this.processedLessons = [];
        this.failedLessons = [];
        this.startTime = null;
        this.pauseRequested = false;
        
        // Configuration
        this.config = {
            outputDir: './generated-lessons',
            progressFile: './lesson-agent-progress.json',
            logFile: './lesson-agent.log',
            retryAttempts: 3,
            retryDelay: 5000, // 5 seconds
            saveInterval: 10, // Save progress every 10 lessons
            enableDetailedScripts: true,
            enableAudioGeneration: false, // Can be enabled if needed
            enableVariantGeneration: true
        };
        
        // Initialize components
        this.initializeComponents();
    }
    
    /**
     * Initialize system components
     */
    async initializeComponents() {
        this.log('🔧 Initializing background lesson agent components...');
        
        // Create output directory
        try {
            await fs.mkdir(this.config.outputDir, { recursive: true });
            this.log(`📁 Output directory created: ${this.config.outputDir}`);
        } catch (error) {
            this.log(`⚠️  Output directory already exists or error: ${error.message}`);
        }
        
        // Load existing progress if available
        await this.loadProgress();
        
        this.log('✅ Background lesson agent initialized');
    }
    
    /**
     * Main execution method - processes all lessons
     */
    async run() {
        this.log('🚀 Starting background lesson agent for 366 lessons...');
        this.startTime = performance.now();
        
        try {
            // Process lessons one by one
            for (let day = this.currentDay; day <= this.totalLessons; day++) {
                if (this.pauseRequested) {
                    this.log('⏸️  Pause requested, stopping execution...');
                    break;
                }
                
                await this.processLesson(day);
                
                // Save progress periodically
                if (day % this.config.saveInterval === 0) {
                    await this.saveProgress();
                }
                
                // Small delay to prevent overwhelming the system
                await this.sleep(1000);
            }
            
            // Final save and summary
            await this.saveProgress();
            await this.generateFinalReport();
            
        } catch (error) {
            this.log(`❌ Fatal error in background agent: ${error.message}`);
            await this.saveProgress();
            throw error;
        }
    }
    
    /**
     * Process a single lesson with detailed script generation
     */
    async processLesson(day) {
        this.log(`📚 Processing lesson ${day}/366...`);
        const lessonStartTime = performance.now();
        
        let attempts = 0;
        let success = false;
        let lessonResult = null;
        
        while (attempts < this.config.retryAttempts && !success) {
            attempts++;
            
            try {
                // Get lesson data from curriculum
                const lessonData = await this.getLessonData(day);
                
                // Generate detailed scripts using narrative weaver
                const detailedLesson = await this.generateDetailedScripts(day, lessonData);
                
                // Generate variants if enabled
                if (this.config.enableVariantGeneration) {
                    detailedLesson.variants = await this.generateLessonVariants(day, lessonData);
                }
                
                // Save lesson to file
                await this.saveLesson(day, detailedLesson);
                
                // Track success
                lessonResult = {
                    day,
                    title: lessonData.title,
                    processingTime: performance.now() - lessonStartTime,
                    variantCount: detailedLesson.variants ? Object.keys(detailedLesson.variants).length : 0,
                    status: 'completed',
                    attempts
                };
                
                this.processedLessons.push(lessonResult);
                success = true;
                
                this.log(`✅ Lesson ${day} completed in ${Math.round(lessonResult.processingTime)}ms (${lessonResult.variantCount} variants)`);
                
            } catch (error) {
                this.log(`⚠️  Attempt ${attempts} failed for lesson ${day}: ${error.message}`);
                
                if (attempts >= this.config.retryAttempts) {
                    // Mark as failed
                    const failedLesson = {
                        day,
                        error: error.message,
                        attempts,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.failedLessons.push(failedLesson);
                    this.log(`❌ Lesson ${day} failed after ${attempts} attempts`);
                } else {
                    // Wait before retry
                    await this.sleep(this.config.retryDelay);
                }
            }
        }
        
        this.currentDay = day + 1;
    }
    
    /**
     * Get lesson data for a specific day
     */
    async getLessonData(day) {
        try {
            // Use existing curriculum system
            const lessonData = await getLessonDataForDay(day);
            return lessonData;
        } catch (error) {
            // Fallback to static curriculum
            const staticLesson = COMPLETE_CURRICULUM[day];
            if (!staticLesson) {
                throw new Error(`No lesson data found for day ${day}`);
            }
            return staticLesson;
        }
    }
    
    /**
     * Generate detailed scripts using the narrative weaver system
     */
    async generateDetailedScripts(day, lessonData) {
        this.log(`🎭 Generating detailed scripts for day ${day}: ${lessonData.title}`);
        
        // Simulate detailed script generation
        // In a real implementation, this would integrate with the narrative weaver
        const detailedLesson = {
            day,
            title: lessonData.title,
            learning_objective: lessonData.learning_objective,
            generated_at: new Date().toISOString(),
            
            // Detailed script structure
            scripts: {
                welcome_phase: {
                    narrative: `Welcome to day ${day} of your learning journey. Today we explore: ${lessonData.title}`,
                    duration_seconds: 30,
                    key_points: this.extractKeyPoints(lessonData),
                    engagement_hooks: this.generateEngagementHooks(lessonData)
                },
                
                beginning_phase: {
                    narrative: this.generateBeginningNarrative(lessonData),
                    duration_seconds: 120,
                    learning_activities: this.generateLearningActivities(lessonData),
                    interactive_elements: this.generateInteractiveElements(lessonData)
                },
                
                middle_phase: {
                    narrative: this.generateMiddleNarrative(lessonData),
                    duration_seconds: 180,
                    deep_dive_content: this.generateDeepDiveContent(lessonData),
                    practical_applications: this.generatePracticalApplications(lessonData)
                },
                
                end_phase: {
                    narrative: this.generateEndNarrative(lessonData),
                    duration_seconds: 120,
                    synthesis_points: this.generateSynthesisPoints(lessonData),
                    reflection_questions: this.generateReflectionQuestions(lessonData)
                },
                
                wisdom_phase: {
                    narrative: this.generateWisdomNarrative(lessonData),
                    duration_seconds: 60,
                    life_connections: this.generateLifeConnections(lessonData),
                    daily_fortune: this.generateDailyFortune(day, lessonData)
                }
            },
            
            // Production metadata
            production_notes: {
                total_duration_seconds: 510, // Sum of all phases
                complexity_level: this.calculateComplexityLevel(lessonData),
                content_themes: this.extractContentThemes(lessonData),
                prerequisite_knowledge: this.identifyPrerequisites(lessonData),
                follow_up_opportunities: this.identifyFollowUps(lessonData)
            }
        };
        
        return detailedLesson;
    }
    
    /**
     * Generate lesson variants for different age groups and tones
     */
    async generateLessonVariants(day, lessonData) {
        const variants = {};
        const ageGroups = [6, 12, 18, 25, 35, 50, 65, 80];
        const tones = ['neutral', 'fun', 'grandmother'];
        const avatars = ['kelly', 'kyle'];
        
        this.log(`🎨 Generating variants for lesson ${day}...`);
        
        for (const age of ageGroups) {
            for (const tone of tones) {
                for (const avatar of avatars) {
                    const variantKey = `age_${age}_${tone}_${avatar}`;
                    
                    variants[variantKey] = {
                        age_group: age,
                        tone,
                        avatar,
                        content: {
                            voiceOver: this.generateAgeAppropriateVoiceOver(lessonData, age, tone, avatar),
                            onScreen: this.generateAgeAppropriateOnScreen(lessonData, age, tone),
                            lessonLogic: this.generateAgeAppropriateLessonLogic(lessonData, age, tone),
                            questions: this.generateAgeAppropriateQuestions(lessonData, age, tone),
                            feedback: this.generateAgeAppropriateFeedback(lessonData, age, tone),
                            fortune: this.generateAgeAppropriateFortune(lessonData, age, tone)
                        },
                        metadata: {
                            generated_at: new Date().toISOString(),
                            complexity_score: this.calculateVariantComplexity(age, tone),
                            estimated_duration: this.estimateVariantDuration(age, tone)
                        }
                    };
                }
            }
        }
        
        this.log(`✨ Generated ${Object.keys(variants).length} variants for lesson ${day}`);
        return variants;
    }
    
    /**
     * Save a completed lesson to file
     */
    async saveLesson(day, lesson) {
        const filename = `lesson-${day.toString().padStart(3, '0')}.json`;
        const filepath = path.join(this.config.outputDir, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(lesson, null, 2));
            this.log(`💾 Saved lesson ${day} to ${filename}`);
        } catch (error) {
            throw new Error(`Failed to save lesson ${day}: ${error.message}`);
        }
    }
    
    /**
     * Save progress to resume later if needed
     */
    async saveProgress() {
        const progress = {
            currentDay: this.currentDay,
            processedCount: this.processedLessons.length,
            failedCount: this.failedLessons.length,
            processedLessons: this.processedLessons,
            failedLessons: this.failedLessons,
            lastSaved: new Date().toISOString(),
            config: this.config
        };
        
        try {
            await fs.writeFile(this.config.progressFile, JSON.stringify(progress, null, 2));
            this.log(`💾 Progress saved: ${this.processedLessons.length}/${this.totalLessons} lessons completed`);
        } catch (error) {
            this.log(`⚠️  Failed to save progress: ${error.message}`);
        }
    }
    
    /**
     * Load existing progress to resume processing
     */
    async loadProgress() {
        try {
            const progressData = await fs.readFile(this.config.progressFile, 'utf8');
            const progress = JSON.parse(progressData);
            
            this.currentDay = progress.currentDay || 1;
            this.processedLessons = progress.processedLessons || [];
            this.failedLessons = progress.failedLessons || [];
            
            this.log(`📋 Loaded progress: resuming from day ${this.currentDay} (${this.processedLessons.length} completed)`);
        } catch (error) {
            this.log('📋 No existing progress found, starting from day 1');
        }
    }
    
    /**
     * Generate final report
     */
    async generateFinalReport() {
        const endTime = performance.now();
        const totalTime = endTime - this.startTime;
        
        const report = {
            execution_summary: {
                total_lessons: this.totalLessons,
                processed_successfully: this.processedLessons.length,
                failed_lessons: this.failedLessons.length,
                total_execution_time_ms: Math.round(totalTime),
                average_time_per_lesson_ms: Math.round(totalTime / this.processedLessons.length),
                completion_rate: (this.processedLessons.length / this.totalLessons * 100).toFixed(2) + '%'
            },
            
            processed_lessons: this.processedLessons,
            failed_lessons: this.failedLessons,
            
            performance_metrics: {
                fastest_lesson: this.processedLessons.reduce((min, lesson) => 
                    lesson.processingTime < min.processingTime ? lesson : min, 
                    this.processedLessons[0] || { processingTime: Infinity }
                ),
                slowest_lesson: this.processedLessons.reduce((max, lesson) => 
                    lesson.processingTime > max.processingTime ? lesson : max, 
                    this.processedLessons[0] || { processingTime: 0 }
                ),
                total_variants_generated: this.processedLessons.reduce((sum, lesson) => 
                    sum + (lesson.variantCount || 0), 0
                )
            },
            
            generated_at: new Date().toISOString()
        };
        
        // Save report
        const reportPath = path.join(this.config.outputDir, 'final-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Log summary
        this.log('🎉 FINAL REPORT GENERATED');
        this.log(`📊 Processed: ${report.execution_summary.processed_successfully}/${this.totalLessons} lessons`);
        this.log(`⏱️  Total time: ${Math.round(totalTime / 1000)}s`);
        this.log(`🎯 Success rate: ${report.execution_summary.completion_rate}`);
        this.log(`📁 Report saved to: ${reportPath}`);
    }
    
    /**
     * Comprehensive logging system
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Console output
        console.log(logMessage);
        
        // File logging (async, non-blocking)
        fs.appendFile(this.config.logFile, logMessage + '\n').catch(() => {
            // Silent fail for logging to not interrupt main process
        });
    }
    
    /**
     * Sleep utility for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Request pause (graceful shutdown)
     */
    requestPause() {
        this.pauseRequested = true;
        this.log('⏸️  Pause requested, will stop after current lesson...');
    }
    
    // =============================================================================
    // DETAILED SCRIPT GENERATION METHODS
    // =============================================================================
    
    extractKeyPoints(lessonData) {
        // Extract key learning points from the lesson objective
        const objective = lessonData.learning_objective || '';
        return [
            `Core concept: ${lessonData.title}`,
            `Learning focus: ${objective.split(',')[0] || 'Understanding fundamentals'}`,
            `Real-world application: ${objective.includes('while') ? objective.split('while')[1] : 'Practical knowledge application'}`
        ];
    }
    
    generateEngagementHooks(lessonData) {
        return [
            `Did you know that ${lessonData.title.toLowerCase()} affects your daily life?`,
            `Let's discover the fascinating world of ${lessonData.title.toLowerCase()}`,
            `Today's lesson will change how you see ${lessonData.title.toLowerCase()}`
        ];
    }
    
    generateBeginningNarrative(lessonData) {
        return `Let's begin our exploration of ${lessonData.title}. ${lessonData.learning_objective.split('.')[0]}. This knowledge will help you understand the world around you in a completely new way.`;
    }
    
    generateLearningActivities(lessonData) {
        return [
            `Interactive exploration of ${lessonData.title} concepts`,
            `Hands-on demonstration of key principles`,
            `Real-world connection exercises`
        ];
    }
    
    generateInteractiveElements(lessonData) {
        return [
            {
                type: 'question',
                content: `What do you already know about ${lessonData.title}?`,
                interaction_type: 'open_response'
            },
            {
                type: 'visualization',
                content: `Interactive diagram showing ${lessonData.title} in action`,
                interaction_type: 'click_explore'
            }
        ];
    }
    
    generateMiddleNarrative(lessonData) {
        return `Now let's dive deeper into ${lessonData.title}. ${lessonData.learning_objective} This understanding forms the foundation for more advanced concepts we'll explore.`;
    }
    
    generateDeepDiveContent(lessonData) {
        return {
            core_concepts: this.extractCoreConceptsFromObjective(lessonData.learning_objective),
            detailed_explanations: this.generateDetailedExplanations(lessonData),
            examples_and_analogies: this.generateExamplesAndAnalogies(lessonData)
        };
    }
    
    generatePracticalApplications(lessonData) {
        return [
            `How ${lessonData.title} applies to everyday life`,
            `Professional applications of ${lessonData.title}`,
            `Future developments in ${lessonData.title}`
        ];
    }
    
    generateEndNarrative(lessonData) {
        return `As we conclude our exploration of ${lessonData.title}, let's synthesize what we've learned and connect it to the bigger picture of knowledge and understanding.`;
    }
    
    generateSynthesisPoints(lessonData) {
        return [
            `Key takeaway: ${lessonData.title} is fundamental to understanding our world`,
            `Connection: This knowledge builds on previous lessons and prepares for future learning`,
            `Application: You can use this understanding in daily decision-making`
        ];
    }
    
    generateReflectionQuestions(lessonData) {
        return [
            `How does ${lessonData.title} connect to your personal experience?`,
            `What questions do you still have about ${lessonData.title}?`,
            `How might this knowledge be useful in your future?`
        ];
    }
    
    generateWisdomNarrative(lessonData) {
        return `The wisdom in understanding ${lessonData.title} extends far beyond facts and figures. It's about developing the curiosity and critical thinking that make us better learners, citizens, and human beings.`;
    }
    
    generateLifeConnections(lessonData) {
        return [
            `Personal growth through ${lessonData.title} understanding`,
            `Community impact of ${lessonData.title} knowledge`,
            `Global significance of ${lessonData.title} awareness`
        ];
    }
    
    generateDailyFortune(day, lessonData) {
        const fortunes = [
            `Your curiosity about ${lessonData.title} opens new doors of understanding`,
            `Knowledge of ${lessonData.title} empowers you to make better decisions`,
            `Understanding ${lessonData.title} connects you to the wonder of learning`
        ];
        
        return fortunes[day % fortunes.length];
    }
    
    // =============================================================================
    // VARIANT GENERATION METHODS
    // =============================================================================
    
    generateAgeAppropriateVoiceOver(lessonData, age, tone, avatar) {
        const avatarName = avatar === 'kelly' ? 'Kelly' : 'Kyle';
        
        if (age <= 11) {
            return `Hi there! I'm ${avatarName}, and today we're going to learn about something really cool: ${lessonData.title}!`;
        } else if (age <= 17) {
            return `Hey! I'm ${avatarName}. Ready to explore ${lessonData.title}? This is going to be interesting!`;
        } else {
            return `Hello, I'm ${avatarName}. Today we'll examine ${lessonData.title} and its significance in our world.`;
        }
    }
    
    generateAgeAppropriateOnScreen(lessonData, age, tone) {
        if (age <= 11) {
            return `🌟 Today's Adventure: ${lessonData.title}\n\n🎯 What We'll Discover:\n• Cool facts about ${lessonData.title}\n• How it affects our world\n• Fun ways to remember what we learn`;
        } else if (age <= 17) {
            return `📚 Today's Topic: ${lessonData.title}\n\n🎯 Learning Goals:\n• Understand key concepts\n• Explore real-world applications\n• Connect to bigger ideas`;
        } else {
            return `📖 ${lessonData.title}\n\n🎯 Learning Objective:\n${lessonData.learning_objective}`;
        }
    }
    
    generateAgeAppropriateLessonLogic(lessonData, age, tone) {
        if (age <= 11) {
            return `🧠 Simple & Fun Learning\n\n${lessonData.title} is like... [age-appropriate analogy]. We'll explore this step by step with fun examples!`;
        } else if (age <= 17) {
            return `🧠 Engaging Exploration\n\n${lessonData.title} connects to many things you already know. Let's build on that knowledge!`;
        } else {
            return `🧠 Comprehensive Analysis\n\n${lessonData.learning_objective}`;
        }
    }
    
    generateAgeAppropriateQuestions(lessonData, age, tone) {
        const baseQuestion = `What is the most important thing about ${lessonData.title}?`;
        
        if (age <= 11) {
            return [{
                question: `What makes ${lessonData.title} special?`,
                choices: [`It helps us understand our world`, `It's just something we have to learn`],
                feedback: `Great thinking! ${lessonData.title} really does help us understand our amazing world!`
            }];
        } else {
            return [{
                question: baseQuestion,
                choices: [`Its practical applications in daily life`, `Its theoretical complexity`],
                feedback: `Excellent insight! Understanding the practical applications helps us see the real value of learning about ${lessonData.title}.`
            }];
        }
    }
    
    generateAgeAppropriateFeedback(lessonData, age, tone) {
        if (age <= 11) {
            return { message: `You're doing amazing! Your curiosity about ${lessonData.title} shows you're a great learner!` };
        } else {
            return { message: `Excellent work! Your engagement with ${lessonData.title} demonstrates strong critical thinking skills.` };
        }
    }
    
    generateAgeAppropriateFortune(lessonData, age, tone) {
        if (age <= 11) {
            return { message: `Your bright curiosity about ${lessonData.title} will lead to wonderful discoveries!` };
        } else {
            return { message: `Your understanding of ${lessonData.title} opens doors to new possibilities and deeper wisdom.` };
        }
    }
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    extractCoreConceptsFromObjective(objective) {
        // Extract main concepts from learning objective
        const concepts = objective.split(/while|and|,/).map(part => part.trim());
        return concepts.slice(0, 3); // Top 3 concepts
    }
    
    generateDetailedExplanations(lessonData) {
        return [
            `Fundamental principles of ${lessonData.title}`,
            `How ${lessonData.title} works in practice`,
            `Why ${lessonData.title} matters for understanding our world`
        ];
    }
    
    generateExamplesAndAnalogies(lessonData) {
        return [
            `Real-world example of ${lessonData.title} in action`,
            `Analogy to help understand ${lessonData.title} concepts`,
            `Historical context of ${lessonData.title} development`
        ];
    }
    
    calculateComplexityLevel(lessonData) {
        const objective = lessonData.learning_objective || '';
        const complexWords = ['analyze', 'synthesize', 'evaluate', 'understand', 'explore', 'practice'];
        const complexity = complexWords.filter(word => objective.toLowerCase().includes(word)).length;
        
        if (complexity <= 2) return 'basic';
        if (complexity <= 4) return 'intermediate';
        return 'advanced';
    }
    
    extractContentThemes(lessonData) {
        const themes = [];
        const objective = lessonData.learning_objective || '';
        
        if (objective.includes('scientific')) themes.push('science');
        if (objective.includes('democratic')) themes.push('civic_engagement');
        if (objective.includes('technology')) themes.push('technology');
        if (objective.includes('environmental')) themes.push('environment');
        if (objective.includes('cultural')) themes.push('culture');
        
        return themes.length > 0 ? themes : ['general_knowledge'];
    }
    
    identifyPrerequisites(lessonData) {
        // Basic prerequisite identification based on lesson content
        return [`Basic understanding of related concepts`, `Curiosity about ${lessonData.title}`];
    }
    
    identifyFollowUps(lessonData) {
        return [`Advanced ${lessonData.title} concepts`, `Related interdisciplinary connections`];
    }
    
    calculateVariantComplexity(age, tone) {
        let score = 0;
        if (age > 18) score += 2;
        if (age > 35) score += 1;
        if (tone === 'neutral') score += 1;
        return Math.min(score, 5);
    }
    
    estimateVariantDuration(age, tone) {
        let baseDuration = 300; // 5 minutes
        if (age <= 11) baseDuration = 180; // 3 minutes
        if (age > 35) baseDuration = 420; // 7 minutes
        if (tone === 'fun') baseDuration += 60; // Extra time for engagement
        return baseDuration;
    }
}

// =============================================================================
// EXECUTION CONTROL
// =============================================================================

/**
 * Main execution function
 */
async function runBackgroundAgent() {
    const agent = new BackgroundLessonAgent();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received interrupt signal...');
        agent.requestPause();
        await agent.saveProgress();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal...');
        agent.requestPause();
        await agent.saveProgress();
        process.exit(0);
    });
    
    try {
        await agent.run();
    } catch (error) {
        console.error('💥 Background agent failed:', error);
        process.exit(1);
    }
}

/**
 * Command line interface
 */
if (require.main === module) {
    console.log('🤖 iLearn How - Background Lesson Agent');
    console.log('📚 Processing 366 lessons with detailed script generation');
    console.log('⚡ Starting in 3 seconds...\n');
    
    setTimeout(() => {
        runBackgroundAgent().catch(error => {
            console.error('💥 Failed to start background agent:', error);
            process.exit(1);
        });
    }, 3000);
}

module.exports = { BackgroundLessonAgent };