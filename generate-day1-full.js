/**
 * Generate Day 1 with all 30 variants (10 ages × 3 tones)
 */

const fs = require('fs').promises;
const path = require('path');

class Day1Generator {
    constructor() {
        this.ages = ['age_2', 'age_5', 'age_8', 'age_12', 'age_16', 'age_25', 'age_40', 'age_60', 'age_80', 'age_102'];
        this.tones = ['grandmother', 'fun', 'neutral'];
        this.outputDir = path.join(__dirname, 'generated-lessons');
        
        // Day 1 lesson data
        this.lesson = {
            day: 1,
            globalDay: 1,
            date: "January 1",
            title: "The Sun - Our Magnificent Life-Giving Star",
            learning_objective: "Understand how scientific observation and measurement create shared global knowledge that transcends cultural and political boundaries, demonstrating how evidence-based thinking builds confidence in democratic decision-making.",
            month: "January"
        };
    }
    
    async initialize() {
        // Create output directory
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log('✅ Output directory ready');
        
        // Try to load variant generator
        try {
            const { CorrectedVariantGeneratorV2 } = require('./corrected-variant-generator-v2.js');
            this.variantGenerator = new CorrectedVariantGeneratorV2();
            console.log('✅ Variant Generator loaded');
        } catch (error) {
            console.warn('⚠️ Variant Generator not available, using detailed generation');
            this.variantGenerator = null;
        }
    }
    
    /**
     * Get age group description
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
     * Generate introduction for specific age and tone
     */
    generateIntroduction(age, tone) {
        const intros = {
            age_2: {
                grandmother: "Hello my sweet little star! Look up, up, up! See that bright yellow circle? That's the Sun! It makes everything warm and happy!",
                fun: "HI HI HI! It's Ken! Look look look! The Sun is saying HELLO! It's so bright and shiny! Wheee!",
                neutral: "Hello! Look at the Sun. The Sun is bright. The Sun is warm."
            },
            age_5: {
                grandmother: "Hello my dear little one! Today, Grandma Kelly wants to show you something amazing - our wonderful Sun! It's like a giant warm hug in the sky!",
                fun: "Hey there, super star explorer! Ken here! Are you ready for the COOLEST adventure ever? We're going to learn about the SUN - the biggest, brightest star we can see!",
                neutral: "Hello! Welcome to our lesson about the Sun. The Sun is a star that gives us light and warmth every day."
            },
            age_8: {
                grandmother: "Hello my wonderful learner! Grandma Kelly is so excited to explore the Sun with you today. Did you know the Sun is actually a star, just like the ones we see at night?",
                fun: "What's up, solar scientist! Ken here with mind-blowing facts about the SUN! Get ready to become a Sun expert - this is going to be AWESOME!",
                neutral: "Welcome to today's lesson about the Sun. We'll discover how the Sun works and why it's so important for life on Earth."
            },
            age_12: {
                grandmother: "Hello dear! I'm Kelly, and I'm thrilled to share the fascinating science of our Sun with you. It's more amazing than you might think!",
                fun: "Yo! Ken here with the most EPIC lesson about the Sun! Did you know it's basically a giant nuclear reactor in space? Let's dive in!",
                neutral: "Welcome. Today we're examining the Sun from a scientific perspective. We'll explore its structure, function, and importance."
            },
            age_16: {
                grandmother: "Hello! I'm Kelly, and today we're going deep into understanding our Sun. The physics behind it connects to so many aspects of our world.",
                fun: "Hey! Ken here, and we're about to explore how the Sun literally powers EVERYTHING! From your phone to photosynthesis - it all starts with our star!",
                neutral: "Welcome to our comprehensive study of the Sun. We'll analyze its nuclear processes and global impact on Earth's systems."
            },
            age_25: {
                grandmother: "Welcome! I'm Kelly, and I'm excited to explore the profound implications of solar science with you. The Sun teaches us about both cosmic scale and everyday life.",
                fun: "Hey there, knowledge seeker! Ken here to blow your mind with how the Sun connects to literally everything - from renewable energy to international cooperation!",
                neutral: "Welcome. Today we examine the Sun as both a physical phenomenon and a catalyst for global scientific collaboration."
            },
            age_40: {
                grandmother: "Welcome! I'm Kelly. Today's exploration of the Sun offers insights not just into astronomy, but into how shared scientific understanding builds bridges across cultures.",
                fun: "Hey! Ken here with a fresh perspective on our Sun. Ready to see how solar science drives innovation and brings humanity together? Let's go!",
                neutral: "Welcome to our analysis of the Sun. We'll examine its role in driving both natural systems and human technological advancement."
            },
            age_60: {
                grandmother: "Welcome, friend. I'm Kelly, and our journey with the Sun today reflects on decades of scientific progress and what it means for our shared future.",
                fun: "Hello! Ken here, and isn't it amazing how our understanding of the Sun has evolved in our lifetime? Let's explore what we've learned!",
                neutral: "Welcome. Today we consider the Sun through the lens of accumulated knowledge and its implications for future generations."
            },
            age_80: {
                grandmother: "Welcome, dear friend. I'm Kelly, and contemplating the Sun reminds us of the continuity of scientific discovery across generations.",
                fun: "Hello my friend! Ken here. The Sun has been our constant companion - let's celebrate what we've learned about it over the years!",
                neutral: "Welcome. We'll reflect on the Sun as both a physical constant and a symbol of humanity's growing understanding."
            },
            age_102: {
                grandmother: "Welcome, cherished friend. I'm Kelly, and our Sun continues to inspire wonder. What a gift to share in this timeless learning!",
                fun: "Hello, wonderful soul! Ken here. After a century, the Sun still has lessons to teach us. Isn't that magnificent?",
                neutral: "Welcome. Today we contemplate the Sun's enduring presence and humanity's evolving relationship with knowledge."
            }
        };
        
        return intros[age][tone];
    }
    
    /**
     * Generate questions for specific age
     */
    generateQuestions(age, tone) {
        const questions = {
            age_2: [
                {
                    question: "Where is the Sun?",
                    options: ["Up in the sky!", "Under the ground"],
                    correctAnswer: 0,
                    explanation: "Yes! The Sun is up in the sky!"
                }
            ],
            age_5: [
                {
                    question: "What does the Sun give us?",
                    options: ["Light and warmth", "Snow and ice", "Darkness"],
                    correctAnswer: 0,
                    explanation: "That's right! The Sun gives us light to see and warmth to feel cozy!"
                },
                {
                    question: "When can we see the Sun?",
                    options: ["Only at night", "During the day", "Never"],
                    correctAnswer: 1,
                    explanation: "Yes! We see the Sun during the day when it's bright outside!"
                }
            ],
            age_8: [
                {
                    question: "What kind of star is the Sun?",
                    options: ["A planet", "A moon", "A star like others in the night sky"],
                    correctAnswer: 2,
                    explanation: "Exactly! The Sun is a star, just much closer to Earth than other stars!"
                },
                {
                    question: "Why do plants need the Sun?",
                    options: ["To make their own food", "To sleep", "To hide from rain"],
                    correctAnswer: 0,
                    explanation: "Correct! Plants use sunlight to make their own food through photosynthesis!"
                },
                {
                    question: "How does the Sun help us see?",
                    options: ["It makes electricity", "It provides light", "It makes glasses"],
                    correctAnswer: 1,
                    explanation: "Right! The Sun's light helps us see everything around us during the day!"
                }
            ],
            age_12: [
                {
                    question: "What process powers the Sun?",
                    options: ["Burning wood", "Nuclear fusion", "Electricity"],
                    correctAnswer: 1,
                    explanation: "Correct! Nuclear fusion in the Sun's core converts hydrogen to helium, releasing enormous energy!"
                },
                {
                    question: "How long does sunlight take to reach Earth?",
                    options: ["Instantly", "About 8 minutes", "One hour"],
                    correctAnswer: 1,
                    explanation: "Yes! Light travels at 300,000 km/s, taking about 8 minutes to cross the 150 million km to Earth!"
                },
                {
                    question: "Why do scientists from different countries work together to study the Sun?",
                    options: ["It's too expensive alone", "The Sun affects everyone on Earth", "They're just friends"],
                    correctAnswer: 1,
                    explanation: "Exactly! The Sun impacts all life on Earth, making international cooperation essential!"
                }
            ],
            age_16: [
                {
                    question: "How does nuclear fusion in the Sun relate to clean energy research?",
                    options: ["No connection", "Fusion could provide clean energy on Earth", "It's too dangerous"],
                    correctAnswer: 1,
                    explanation: "Right! Understanding solar fusion helps scientists develop fusion reactors for clean, unlimited energy!"
                },
                {
                    question: "How do solar observations help predict space weather?",
                    options: ["They don't", "Solar flares can disrupt satellites and power grids", "Only for astronauts"],
                    correctAnswer: 1,
                    explanation: "Correct! Monitoring the Sun helps protect our technology-dependent society from solar storms!"
                },
                {
                    question: "Why is international cooperation in solar research important for democracy?",
                    options: ["It's not related", "Shared knowledge builds trust between nations", "Only scientists care"],
                    correctAnswer: 1,
                    explanation: "Exactly! When nations share scientific data, it builds trust and demonstrates evidence-based decision making!"
                }
            ],
            age_25: [
                {
                    question: "How does solar energy relate to energy independence and international relations?",
                    options: ["No connection", "Solar reduces dependence on fossil fuel imports", "Makes countries more dependent"],
                    correctAnswer: 1,
                    explanation: "Correct! Solar energy can reduce geopolitical tensions over energy resources and promote independence!"
                },
                {
                    question: "What role does open solar data play in combating misinformation?",
                    options: ["Doesn't help", "Provides verifiable facts anyone can check", "Creates more confusion"],
                    correctAnswer: 1,
                    explanation: "Right! Publicly accessible solar data demonstrates how transparency and evidence counter false claims!"
                },
                {
                    question: "How do international solar research stations model democratic cooperation?",
                    options: ["They don't", "Show how diverse nations work toward common goals", "Create competition"],
                    correctAnswer: 1,
                    explanation: "Exactly! These collaborations show democracy in action - different perspectives united by shared evidence!"
                }
            ],
            age_40: [
                {
                    question: "How can solar science education strengthen democratic institutions?",
                    options: ["Unrelated topics", "Teaches critical thinking and evidence evaluation", "Only for scientists"],
                    correctAnswer: 1,
                    explanation: "Correct! Understanding how we study the Sun builds skills for evaluating claims and making informed decisions!"
                },
                {
                    question: "What does the history of solar observation teach about scientific progress?",
                    options: ["Nothing useful", "Knowledge builds across generations and cultures", "Science doesn't change"],
                    correctAnswer: 1,
                    explanation: "Right! From ancient astronomers to modern satellites, solar science shows how knowledge accumulates globally!"
                },
                {
                    question: "How does solar research demonstrate the value of long-term thinking?",
                    options: ["It doesn't", "Multi-decade studies reveal climate patterns", "Short-term is better"],
                    correctAnswer: 1,
                    explanation: "Exactly! Solar research requires patience and continuity - valuable lessons for democracy and policy!"
                }
            ],
            age_60: [
                {
                    question: "How has international solar research evolved during your lifetime?",
                    options: ["Hasn't changed", "From Cold War competition to global cooperation", "Become less important"],
                    correctAnswer: 1,
                    explanation: "Right! We've witnessed the transformation from rivalry to collaboration in space and solar science!"
                },
                {
                    question: "What wisdom does consistent solar observation offer future generations?",
                    options: ["None", "Value of patient, systematic study", "Quick results matter most"],
                    correctAnswer: 1,
                    explanation: "Exactly! Decades of careful observation provide invaluable data about our changing world!"
                },
                {
                    question: "How can we pass on appreciation for evidence-based thinking?",
                    options: ["Can't be taught", "Model critical thinking and share wonder of discovery", "Not important"],
                    correctAnswer: 1,
                    explanation: "Correct! By demonstrating how solar science works, we inspire future generations to value evidence!"
                }
            ],
            age_80: [
                {
                    question: "What has a lifetime of solar observations taught humanity?",
                    options: ["Very little", "Our deep connection to cosmic cycles", "The Sun never changes"],
                    correctAnswer: 1,
                    explanation: "Indeed! We've learned how intimately Earth's life is connected to our star's rhythms!"
                },
                {
                    question: "How does sharing solar knowledge across generations strengthen society?",
                    options: ["It doesn't", "Creates continuity and shared understanding", "Causes confusion"],
                    correctAnswer: 1,
                    explanation: "Exactly! When we pass on solar wisdom, we build bridges between past and future!"
                },
                {
                    question: "What legacy does international solar cooperation leave?",
                    options: ["No legacy", "Proof that humanity can unite around truth", "More division"],
                    correctAnswer: 1,
                    explanation: "Beautiful! Solar science proves we can transcend borders when we focus on shared reality!"
                }
            ],
            age_102: [
                {
                    question: "After a century, what does the Sun teach about permanence and change?",
                    options: ["Nothing new", "Both constancy and evolution shape our world", "Everything stays same"],
                    correctAnswer: 1,
                    explanation: "Profound! The Sun shows us how stability and transformation coexist in nature and society!"
                },
                {
                    question: "What wisdom about human cooperation does solar science offer?",
                    options: ["None", "Truth unites across all boundaries", "People can't cooperate"],
                    correctAnswer: 1,
                    explanation: "Yes! A century shows that shared truth about our Sun brings humanity together!"
                },
                {
                    question: "What gift does understanding the Sun offer future generations?",
                    options: ["No value", "Connection to the cosmos and each other", "Only technical knowledge"],
                    correctAnswer: 1,
                    explanation: "Beautiful! Understanding our star connects us to the universe and to our shared humanity!"
                }
            ]
        };
        
        return questions[age] || questions.age_25;
    }
    
    /**
     * Generate activities for specific age
     */
    generateActivities(age, tone) {
        const activities = {
            age_2: {
                type: "sensory play",
                description: "Feel the warm sunshine on your face! Close eyes, open eyes - see how the Sun makes light!",
                duration: "2-3 minutes"
            },
            age_5: {
                type: "drawing",
                description: "Draw a big, bright Sun with yellow crayons! Add happy rays all around it!",
                duration: "5 minutes"
            },
            age_8: {
                type: "experiment",
                description: "Shadow experiment: Go outside at different times and trace your shadow. See how the Sun's position changes it!",
                duration: "10 minutes"
            },
            age_12: {
                type: "research project",
                description: "Research how different cultures have studied the Sun. Create a timeline of solar discoveries!",
                duration: "15 minutes"
            },
            age_16: {
                type: "analysis",
                description: "Calculate how much solar energy hits your school/home. Research solar panel efficiency and costs.",
                duration: "20 minutes"
            },
            age_25: {
                type: "application",
                description: "Design a public education campaign about solar energy benefits for your community.",
                duration: "20 minutes"
            },
            age_40: {
                type: "leadership exercise",
                description: "Develop a plan to promote solar science education in local schools or community centers.",
                duration: "25 minutes"
            },
            age_60: {
                type: "mentoring",
                description: "Share your observations of how solar science has evolved. Write or record insights for younger generations.",
                duration: "20 minutes"
            },
            age_80: {
                type: "reflection",
                description: "Document your memories of major solar events (eclipses, solar research milestones) you've witnessed.",
                duration: "15 minutes"
            },
            age_102: {
                type: "wisdom sharing",
                description: "Share a story about the Sun's constancy throughout your life. What has it meant to you?",
                duration: "10 minutes"
            }
        };
        
        return activities[age] || activities.age_25;
    }
    
    /**
     * Generate conclusion for specific age and tone
     */
    generateConclusion(age, tone) {
        const conclusions = {
            age_2: {
                grandmother: "The Sun is our friend in the sky! It helps us play and grow. Give the Sun a big wave goodbye! See you tomorrow, Sun!",
                fun: "YAY! We learned about the SUN! It's so BRIGHT and WARM! The Sun is AMAZING! Bye bye, Sun friend!",
                neutral: "We learned about the Sun today. The Sun gives us light. Thank you for learning."
            },
            age_5: {
                grandmother: "What a wonderful time learning about our special Sun! Remember, just like the Sun shares its light with everyone, we can share kindness too! I'm so proud of you!",
                fun: "AWESOME JOB! You're now a Sun expert! The Sun is the BEST star ever! Keep shining bright just like our Sun! See you next time!",
                neutral: "Today we learned about the Sun. It gives us light and helps plants grow. Good job learning about the Sun."
            },
            age_8: {
                grandmother: "You've discovered so much about our amazing Sun today! Every time you feel its warmth, remember you're connected to a real star! Keep being curious!",
                fun: "INCREDIBLE! You totally rocked this Sun lesson! Now you know why the Sun is the ultimate superstar! Keep exploring, scientist!",
                neutral: "We've explored how the Sun works as a star. You understand its importance for life on Earth. Well done."
            },
            age_12: {
                grandmother: "I'm so impressed by your understanding of solar science! Remember, scientists worldwide work together studying our Sun - just like you're part of this global learning!",
                fun: "MIND = BLOWN! You've mastered solar fusion and international cooperation! You're ready to change the world with this knowledge!",
                neutral: "You now understand the Sun's nuclear processes and its role in international scientific cooperation. Excellent progress."
            },
            age_16: {
                grandmother: "You've connected solar science to real-world challenges beautifully! Your generation can use this knowledge to build a brighter, more cooperative future.",
                fun: "BRILLIANT! You see how the Sun powers everything from atoms to international relations! Use this knowledge to make a difference!",
                neutral: "You've analyzed the Sun's impact on technology, energy, and global cooperation. This understanding serves future decision-making."
            },
            age_25: {
                grandmother: "What insights you've gained about how solar science demonstrates democratic values! You're equipped to promote evidence-based thinking in your community.",
                fun: "FANTASTIC! You've connected the dots between the Sun, clean energy, and global democracy! Time to put this knowledge into action!",
                neutral: "You understand how solar science exemplifies international cooperation and evidence-based policy. Apply these principles broadly."
            },
            age_40: {
                grandmother: "You've beautifully grasped how solar science models the cooperation our world needs. Your leadership can help others see these connections too.",
                fun: "EXCELLENT! You see how the Sun illuminates both scientific truth and democratic collaboration! Keep spreading this understanding!",
                neutral: "You've examined how solar research demonstrates effective international cooperation and knowledge-sharing. Continue building on these insights."
            },
            age_60: {
                grandmother: "Your perspective on how solar science has evolved is invaluable. Thank you for considering how to pass this wisdom forward to future generations.",
                fun: "INSPIRING! You've seen solar science transform from competition to cooperation - what a journey! Your insights light the way forward!",
                neutral: "You've reflected on decades of solar research progress and its implications for society. Your experience enriches this understanding."
            },
            age_80: {
                grandmother: "What wisdom you bring to understanding our Sun's lessons! Your lifetime of observation helps us all appreciate the continuity of scientific discovery.",
                fun: "WONDERFUL! A lifetime of solar observations - what treasures of understanding! Thank you for sharing in this eternal learning!",
                neutral: "Your long perspective illuminates how patient observation and international cooperation advance human knowledge. Thank you."
            },
            age_102: {
                grandmother: "Dearest friend, your century of experience with our Sun brings profound perspective. Together, we celebrate the eternal dance of learning and light!",
                fun: "MAGNIFICENT! A full century with our faithful Sun - what joy in continuous discovery! You embody the light of lifelong learning!",
                neutral: "Your centennial perspective on the Sun and human cooperation offers unique wisdom. We honor your continued engagement with learning."
            }
        };
        
        return conclusions[age][tone];
    }
    
    /**
     * Generate complete lesson with all 30 variants
     */
    async generateCompleteLesson() {
        console.log('\n🌟 Generating Day 1: The Sun - Our Magnificent Life-Giving Star');
        console.log('=' .repeat(60));
        
        const script = {
            lessonId: 1,
            date: this.lesson.date,
            title: this.lesson.title,
            learningObjective: this.lesson.learning_objective,
            month: this.lesson.month,
            generatedAt: new Date().toISOString(),
            totalVariants: 30,
            variants: {}
        };
        
        let variantCount = 0;
        
        // Generate all 30 variants (10 ages × 3 tones)
        for (const age of this.ages) {
            script.variants[age] = {};
            
            for (const tone of this.tones) {
                variantCount++;
                console.log(`\n[${variantCount}/30] Generating ${age}/${tone} variant...`);
                
                try {
                    // Try to use variant generator if available
                    let content = null;
                    if (this.variantGenerator) {
                        const preferences = {
                            age: age,
                            tone: tone,
                            language: 'english',
                            avatar: tone === 'fun' ? 'ken' : 'kelly'
                        };
                        
                        try {
                            content = await this.variantGenerator.generatePersonalizedContent(preferences);
                        } catch (error) {
                            console.log('  Using detailed generation instead of variant generator');
                        }
                    }
                    
                    // Generate variant content
                    const variant = {
                        age: age,
                        tone: tone,
                        avatar: tone === 'fun' ? 'ken' : 'kelly',
                        ageGroup: this.getAgeGroup(age),
                        introduction: this.generateIntroduction(age, tone),
                        questions: this.generateQuestions(age, tone),
                        activities: this.generateActivities(age, tone),
                        conclusion: this.generateConclusion(age, tone),
                        voiceoverScript: {
                            style: tone === 'fun' ? 'energetic' : tone === 'grandmother' ? 'warm' : 'clear',
                            pacing: this.getVoicePacing(age),
                            emphasis: this.getEmphasisPoints(age, tone)
                        },
                        estimatedDuration: this.getDuration(age),
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            method: content ? 'variant_generator' : 'detailed_generation'
                        }
                    };
                    
                    // Add any additional content from variant generator
                    if (content) {
                        variant.enhancedContent = content;
                    }
                    
                    script.variants[age][tone] = variant;
                    console.log(`  ✅ Generated ${age}/${tone} variant`);
                    
                } catch (error) {
                    console.error(`  ❌ Error generating ${age}/${tone}:`, error.message);
                    script.variants[age][tone] = {
                        error: error.message,
                        fallback: true
                    };
                }
                
                // Small delay to prevent overload
                await this.delay(100);
            }
        }
        
        // Add summary
        script.summary = {
            totalVariants: variantCount,
            successfulVariants: Object.values(script.variants).reduce((sum, ageVariants) => 
                sum + Object.values(ageVariants).filter(v => !v.error).length, 0),
            ages: this.ages,
            tones: this.tones,
            structure: "10 ages × 3 tones = 30 unique variants"
        };
        
        console.log('\n' + '=' .repeat(60));
        console.log(`✅ Generation complete: ${script.summary.successfulVariants}/${script.summary.totalVariants} variants`);
        
        return script;
    }
    
    /**
     * Get voice pacing for age
     */
    getVoicePacing(age) {
        const ageNum = parseInt(age.split('_')[1]);
        if (ageNum <= 5) return 'slow';
        if (ageNum <= 12) return 'moderate';
        if (ageNum >= 80) return 'moderate';
        return 'normal';
    }
    
    /**
     * Get emphasis points
     */
    getEmphasisPoints(age, tone) {
        if (tone === 'fun') return ['exciting', 'amazing', 'awesome'];
        if (tone === 'grandmother') return ['dear', 'wonderful', 'proud'];
        return ['important', 'understand', 'learn'];
    }
    
    /**
     * Get duration for age
     */
    getDuration(age) {
        const durations = {
            'age_2': 5,
            'age_5': 8,
            'age_8': 12,
            'age_12': 15,
            'age_16': 18,
            'age_25': 20,
            'age_40': 22,
            'age_60': 20,
            'age_80': 18,
            'age_102': 15
        };
        return durations[age] || 20;
    }
    
    /**
     * Save the generated lesson
     */
    async saveLesson(script) {
        const fileName = `day_001_the_sun_our_magnificent_life_giving_star.json`;
        const filePath = path.join(this.outputDir, fileName);
        
        await fs.writeFile(filePath, JSON.stringify(script, null, 2));
        console.log(`\n💾 Saved to: ${fileName}`);
        console.log(`📁 Location: ${this.outputDir}`);
        
        // Also create a summary file
        const summaryPath = path.join(this.outputDir, 'day_001_summary.txt');
        const summary = this.createReadableSummary(script);
        await fs.writeFile(summaryPath, summary);
        console.log(`📄 Summary saved to: day_001_summary.txt`);
    }
    
    /**
     * Create readable summary
     */
    createReadableSummary(script) {
        let summary = `DAY 1 LESSON SUMMARY
==================
Title: ${script.title}
Date: ${script.date}
Objective: ${script.learningObjective}

VARIANTS GENERATED: ${script.summary.successfulVariants} / 30
Generated at: ${new Date(script.generatedAt).toLocaleString()}

VARIANT BREAKDOWN:
`;
        
        for (const age of this.ages) {
            summary += `\n${age} (${this.getAgeGroup(age)}):\n`;
            for (const tone of this.tones) {
                const variant = script.variants[age][tone];
                if (variant && !variant.error) {
                    summary += `  ✅ ${tone} - ${variant.estimatedDuration} minutes\n`;
                } else {
                    summary += `  ❌ ${tone} - Failed\n`;
                }
            }
        }
        
        summary += `\nTOTAL STRUCTURE:
- 10 age groups: From age 2 (toddler) to age 102 (centenarian)
- 3 tones: grandmother (Kelly), fun (Ken), neutral (Kelly)
- 30 unique variants total

Each variant includes:
- Age-appropriate introduction
- Customized questions and activities
- Tailored conclusion
- Voice modulation settings
- Estimated duration
`;
        
        return summary;
    }
    
    /**
     * Utility delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Main execution
     */
    async run() {
        try {
            await this.initialize();
            const lesson = await this.generateCompleteLesson();
            await this.saveLesson(lesson);
            
            console.log('\n🎉 Day 1 generation complete with all 30 variants!');
            console.log('Check the generated-lessons directory for the full lesson file.');
            
        } catch (error) {
            console.error('❌ Fatal error:', error);
        }
    }
}

// Run the generator
const generator = new Day1Generator();
generator.run();