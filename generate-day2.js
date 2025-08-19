/**
 * Generate Day 2 with CORRECT structure
 * EXACTLY 3 questions, 2 options each, 2 teaching moments each, 1 wisdom
 * NO duration estimates - only TTS timing matters
 */

const fs = require('fs').promises;
const path = require('path');

class Day2Generator {
    constructor() {
        this.ages = ['age_2', 'age_5', 'age_8', 'age_12', 'age_16', 'age_25', 'age_40', 'age_60', 'age_80', 'age_102'];
        this.tones = ['grandmother', 'fun', 'neutral'];
        this.outputDir = path.join(__dirname, 'generated-lessons');
        
        // Day 2 lesson data
        this.lesson = {
            day: 2,
            globalDay: 2,
            date: "January 2",
            title: "Habit Stacking for Productivity - Building Your Success Architecture",
            learning_objective: "Design personal learning systems that support lifelong education and civic engagement, practicing the self-regulation skills essential for democratic participation and peaceful conflict resolution.",
            month: "January"
        };
    }
    
    async initialize() {
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log('✅ Output directory ready');
    }
    
    /**
     * Generate introduction for specific age and tone
     */
    generateIntroduction(age, tone) {
        const intros = {
            age_2: {
                grandmother: "Hello sweet one! Today we're going to learn about doing things in order. First we do this, then we do that! It's like a fun game!",
                fun: "HI HI! Ken here! We're gonna play the BEST game - doing things one after another! It's like building blocks!",
                neutral: "Hello! Today we learn about doing things in order. First this, then that."
            },
            age_5: {
                grandmother: "Hello my dear! Grandma Kelly wants to show you a special trick - how to remember to do things by connecting them together like a chain!",
                fun: "Hey super organizer! Ken here with the COOLEST way to remember stuff - we stack habits like LEGO blocks! AWESOME!",
                neutral: "Welcome! Today we learn about habit stacking - doing one thing after another to help us remember."
            },
            age_8: {
                grandmother: "Hello wonderful learner! Today I'll share a secret about making good habits stick - we connect them together like links in a chain!",
                fun: "What's up, habit hero! Ken here to show you how to become SUPER organized by stacking your habits like a boss!",
                neutral: "Welcome to today's lesson on habit stacking. We'll learn how to connect activities to build good routines."
            },
            age_12: {
                grandmother: "Hello dear! I'm Kelly, and today we'll explore habit stacking - a powerful way to build routines that help you succeed!",
                fun: "Yo! Ken here with a GAME-CHANGING technique - habit stacking! It's like creating your own success program!",
                neutral: "Welcome. Today we examine habit stacking, a method for building productive routines systematically."
            },
            age_16: {
                grandmother: "Hello! I'm Kelly. Today we'll discover how habit stacking can transform your productivity and help you achieve your goals.",
                fun: "Hey! Ken here with the ultimate life hack - habit stacking! This is how successful people build unstoppable routines!",
                neutral: "Welcome to our study of habit stacking and systematic behavior design for personal effectiveness."
            },
            age_25: {
                grandmother: "Welcome! I'm Kelly. Let's explore how habit stacking creates the foundation for lifelong learning and civic engagement.",
                fun: "Hey achiever! Ken here to show you how habit stacking can revolutionize your productivity AND your impact on the world!",
                neutral: "Welcome. We'll examine habit stacking as a tool for personal development and democratic participation."
            },
            age_40: {
                grandmother: "Welcome! I'm Kelly. Today we'll see how habit stacking helps us model self-regulation for our families and communities.",
                fun: "Hey! Ken here. Ready to master habit stacking? It's not just productivity - it's leadership through example!",
                neutral: "Welcome. We'll analyze habit stacking as a framework for personal leadership and community influence."
            },
            age_60: {
                grandmother: "Welcome, friend. I'm Kelly. Let's explore how decades of experience can inform powerful habit stacking strategies.",
                fun: "Hello! Ken here. After years of experience, we know what works - let's stack those winning habits!",
                neutral: "Welcome. Today we consider how mature perspective enhances habit stacking effectiveness."
            },
            age_80: {
                grandmother: "Welcome, dear friend. I'm Kelly. Our lifetime of habits offers wisdom about what truly matters in our daily routines.",
                fun: "Hello my friend! Ken here. Let's celebrate the habits that have served us well and stack new ones that bring joy!",
                neutral: "Welcome. We'll reflect on how consistent habits shape a meaningful life over time."
            },
            age_102: {
                grandmother: "Welcome, cherished friend. I'm Kelly. A century teaches us that simple, stacked habits create profound life patterns.",
                fun: "Hello wonderful soul! Ken here. After 102 years, we know the secret - small habits, big impact!",
                neutral: "Welcome. Your centennial perspective illuminates how habits compound across a lifetime."
            }
        };
        
        return intros[age][tone];
    }
    
    /**
     * Generate EXACTLY 3 questions with EXACTLY 2 options and 2 teaching moments each
     */
    generateQuestions(age, tone) {
        const questions = {
            age_2: [
                {
                    question: "After we wash hands, what do we do?",
                    options: ["Eat our snack", "Play with toys"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! First wash hands, then eat! That's how we stay clean and healthy!",
                        option_b: "We play after snack time. First wash hands, then eat, then play!"
                    }
                },
                {
                    question: "When we wake up, what comes first?",
                    options: ["Get dressed", "Stay in bed"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Good! Wake up, then get dressed! That's our morning routine!",
                        option_b: "Time to get up! When we wake up, we get dressed for the day!"
                    }
                },
                {
                    question: "Before bed, what do we do?",
                    options: ["Brush teeth", "Run around"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "That's right! We brush teeth before bed to keep them strong!",
                        option_b: "Running is for daytime! Before bed, we brush our teeth!"
                    }
                }
            ],
            age_5: [
                {
                    question: "If you want to remember to water plants, when should you do it?",
                    options: ["Right after breakfast", "Whenever you remember"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Excellent! Connecting it to breakfast helps you remember every day!",
                        option_b: "It's better to connect it to something you already do, like after breakfast!"
                    }
                },
                {
                    question: "How can you remember to pack your school bag?",
                    options: ["Do it after brushing teeth", "Hope someone reminds you"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Great thinking! Brush teeth, then pack bag - a perfect habit stack!",
                        option_b: "Better to connect it to brushing teeth - then you'll always remember!"
                    }
                },
                {
                    question: "What makes habits easier to remember?",
                    options: ["Connecting them together", "Trying really hard"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! When we connect habits like links in a chain, we remember better!",
                        option_b: "Trying hard is good, but connecting habits together works even better!"
                    }
                }
            ],
            age_8: [
                {
                    question: "What is habit stacking?",
                    options: ["Linking habits together", "Doing many things at once"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Habit stacking means doing one habit right after another, like links in a chain!",
                        option_b: "Not quite - it's doing habits one after another in order, not all at once!"
                    }
                },
                {
                    question: "Why does habit stacking work?",
                    options: ["Uses existing routines as triggers", "Makes us work faster"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! When we use something we already do as a reminder, we don't forget!",
                        option_b: "It's not about speed - it's about using routines we have to remember new ones!"
                    }
                },
                {
                    question: "How can habit stacking help with homework?",
                    options: ["Do it right after snack time", "Do it whenever"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Perfect! Snack, then homework - your snack becomes your homework reminder!",
                        option_b: "Connecting homework to snack time helps you never forget!"
                    }
                }
            ],
            age_12: [
                {
                    question: "How does habit stacking build self-regulation?",
                    options: ["Creates automatic behaviors", "Forces you to work harder"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! When behaviors become automatic, you don't have to force yourself!",
                        option_b: "It's actually the opposite - it makes good choices automatic, not forced!"
                    }
                },
                {
                    question: "What's the key to successful habit stacking?",
                    options: ["Start with existing strong habits", "Add many new habits at once"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Build on habits you already have - they're your foundation!",
                        option_b: "Too many at once fails. Start with habits you already do well!"
                    }
                },
                {
                    question: "How can habit stacking help with civic engagement?",
                    options: ["Links learning to action", "Makes you popular"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Stack 'read news' with 'discuss with friends' to stay engaged!",
                        option_b: "It's not about popularity - it's about connecting learning with participation!"
                    }
                }
            ],
            age_16: [
                {
                    question: "How does habit stacking support democratic participation?",
                    options: ["Builds consistent informed action", "Just saves time"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Regular habits of learning and engaging create active citizens!",
                        option_b: "It's bigger than time-saving - it builds engaged citizenship habits!"
                    }
                },
                {
                    question: "What makes habit stacking powerful for conflict resolution?",
                    options: ["Creates pause before reaction", "Avoids all conflicts"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Stack 'feel upset' with 'take three breaths' for better responses!",
                        option_b: "We can't avoid all conflict, but we can stack habits for better responses!"
                    }
                },
                {
                    question: "How can students use habit stacking for success?",
                    options: ["Link study to daily anchors", "Study randomly when motivated"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Perfect! 'After dinner = study time' beats waiting for motivation!",
                        option_b: "Motivation varies, but stacked habits create consistent success!"
                    }
                }
            ],
            age_25: [
                {
                    question: "How does habit stacking enable lifelong learning?",
                    options: ["Embeds learning in daily life", "Requires expensive courses"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Stack learning with commute, lunch, or evening routine!",
                        option_b: "Learning doesn't need to be expensive - stack it into what you already do!"
                    }
                },
                {
                    question: "What role does habit stacking play in social change?",
                    options: ["Small actions compound to impact", "Changes happen instantly"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! Daily stacked actions for justice create real change over time!",
                        option_b: "Real change comes from consistent small actions, not instant transformation!"
                    }
                },
                {
                    question: "How can habit stacking improve community engagement?",
                    options: ["Links awareness to action", "Just posts on social media"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Stack 'read local news' with 'attend one meeting' for real impact!",
                        option_b: "Social media alone isn't enough - stack online awareness with offline action!"
                    }
                }
            ],
            age_40: [
                {
                    question: "How does habit stacking model self-regulation for others?",
                    options: ["Shows discipline through action", "Tells people what to do"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Children and colleagues learn more from what we do than what we say!",
                        option_b: "Leading by example through our habits is more powerful than just telling!"
                    }
                },
                {
                    question: "What makes habit stacking essential for work-life balance?",
                    options: ["Creates boundaries and transitions", "Eliminates all stress"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Stack 'leave work' with 'family connection ritual' for balance!",
                        option_b: "Can't eliminate all stress, but stacked habits create healthy boundaries!"
                    }
                },
                {
                    question: "How can leaders use habit stacking?",
                    options: ["Build team culture through routines", "Micromanage everyone"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! Stack team check-ins with existing meetings to build culture!",
                        option_b: "Leadership means creating positive routines, not controlling people!"
                    }
                }
            ],
            age_60: [
                {
                    question: "How does experience enhance habit stacking?",
                    options: ["Know which habits truly matter", "Habits become harder to change"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Experience shows us which habits create real value over time!",
                        option_b: "Actually, wisdom helps us adapt habits more skillfully as we age!"
                    }
                },
                {
                    question: "What habit stacks support healthy aging?",
                    options: ["Movement linked to daily tasks", "Avoiding all activity"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Perfect! Stack stretches with morning coffee, walks with errands!",
                        option_b: "Staying active through stacked habits keeps us healthy and engaged!"
                    }
                },
                {
                    question: "How can we share habit stacking wisdom?",
                    options: ["Demonstrate and mentor others", "Keep strategies secret"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Sharing what works helps others build their success!",
                        option_b: "Our experience becomes valuable when we share it with others!"
                    }
                }
            ],
            age_80: [
                {
                    question: "What do decades of habits teach us?",
                    options: ["Simple consistency creates results", "Complex systems work best"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! The simple habits we maintain for decades shape our lives most!",
                        option_b: "Life shows us that simple, consistent habits beat complex systems!"
                    }
                },
                {
                    question: "How can habit stacking maintain independence?",
                    options: ["Links safety checks to routines", "Avoids all help from others"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Smart! Stack medication with meals, exercise with daily tasks!",
                        option_b: "Independence includes accepting help - stack gratitude with assistance!"
                    }
                },
                {
                    question: "What legacy do our habits leave?",
                    options: ["Examples inspire generations", "Habits don't matter to others"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Our daily habits become the wisdom we pass forward!",
                        option_b: "Our habits definitely matter - they inspire those who come after us!"
                    }
                }
            ],
            age_102: [
                {
                    question: "What has a century revealed about habits?",
                    options: ["Small daily acts shape destiny", "Big events matter most"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Profound! It's the daily habits, not big events, that create a life!",
                        option_b: "A century shows that daily habits matter more than dramatic moments!"
                    }
                },
                {
                    question: "How do habits connect us across time?",
                    options: ["Link past wisdom to present", "Keep us stuck in the past"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Our habits carry forward the best of what we've learned!",
                        option_b: "Good habits connect us to wisdom while keeping us present!"
                    }
                },
                {
                    question: "What is the greatest gift of habit stacking?",
                    options: ["Peace through purposeful routine", "Just staying busy"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Purposeful routines bring deep peace and meaning!",
                        option_b: "It's not busyness - it's the peace of meaningful daily rhythms!"
                    }
                }
            ]
        };
        
        return questions[age];
    }
    
    /**
     * Generate wisdom/fortune for specific age
     */
    generateWisdom(age, tone) {
        const wisdoms = {
            age_2: {
                grandmother: "When we do things in order, like getting dressed then eating breakfast, every day becomes easier!",
                fun: "You're a routine ROCKSTAR! First this, then that - you've got it!",
                neutral: "Doing things in order helps us remember and learn."
            },
            age_5: {
                grandmother: "My dear, when you connect your habits like beads on a string, you create a beautiful day!",
                fun: "Stack those habits like LEGO blocks and build an AWESOME day! You're amazing!",
                neutral: "Connecting habits together makes them easier to remember and do."
            },
            age_8: {
                grandmother: "Remember, the secret to success is linking good choices together, one after another, every day!",
                fun: "You're building your SUCCESS TOWER one habit block at a time! Keep stacking!",
                neutral: "Habit stacking helps you build strong routines that lead to success."
            },
            age_12: {
                grandmother: "The habits you stack today become the foundation for the amazing person you're becoming!",
                fun: "Your habit stacks are your SUPERPOWER! Use them to level up your life!",
                neutral: "Systematic habit building develops the self-regulation needed for success."
            },
            age_16: {
                grandmother: "Your ability to build positive routines will serve you in school, relationships, and citizenship!",
                fun: "Master your habits, master your life! You're designing your own success story!",
                neutral: "Habit stacking creates the discipline foundation for academic and life success."
            },
            age_25: {
                grandmother: "The habits you stack now will shape not just your success, but your contribution to the world!",
                fun: "Stack habits for success AND impact! You're building a life that matters!",
                neutral: "Strategic habit stacking enables both personal achievement and civic engagement."
            },
            age_40: {
                grandmother: "Your habit stacks don't just shape your life - they inspire everyone watching you!",
                fun: "You're not just building habits - you're building a legacy of positive action!",
                neutral: "Your habit systems model self-regulation and inspire others to grow."
            },
            age_60: {
                grandmother: "Years of experience have shown you which habits truly matter - share that wisdom!",
                fun: "You've mastered the habit game! Time to teach others your winning strategies!",
                neutral: "Your refined habit systems reflect decades of wisdom worth sharing."
            },
            age_80: {
                grandmother: "A lifetime of good habits is the greatest treasure - more valuable than any possession!",
                fun: "80 years of awesome habits! You're living proof that consistency creates magic!",
                neutral: "Your consistent habits across decades demonstrate the power of daily choices."
            },
            age_102: {
                grandmother: "Dear friend, your century of habits shows us that small daily acts create an extraordinary life!",
                fun: "102 years of habit power! You're the ultimate proof that daily habits create destiny!",
                neutral: "Your centennial perspective reveals how simple daily habits compound into a meaningful life."
            }
        };
        
        return wisdoms[age][tone];
    }
    
    /**
     * Generate conclusion
     */
    generateConclusion(age, tone) {
        const conclusions = {
            age_2: {
                grandmother: "Good job learning about doing things in order! First this, then that - you're so smart!",
                fun: "YEAH! You learned about order! First, then, next - you've GOT IT!",
                neutral: "You learned about doing things in order. Well done."
            },
            age_5: {
                grandmother: "Wonderful learning, my dear! Now you know how to connect your habits like a special chain!",
                fun: "AWESOME! You're a habit-stacking champion! Keep building those habit towers!",
                neutral: "Good work learning about habit stacking. You can connect habits together now."
            },
            age_8: {
                grandmother: "Excellent work! You now have the secret to building habits that help you succeed every day!",
                fun: "INCREDIBLE! You've unlocked the habit stacking superpower! Use it wisely!",
                neutral: "You've learned how habit stacking builds strong routines. Well done."
            },
            age_12: {
                grandmother: "I'm proud of you! You understand how building good habits shapes your future success!",
                fun: "MIND = BLOWN! You've mastered habit stacking! Time to build your dream routines!",
                neutral: "You now understand systematic habit building for personal development."
            },
            age_16: {
                grandmother: "Wonderful! You're equipped to build habits that support your goals and values!",
                fun: "BRILLIANT! You've got the keys to habit mastery! Design your perfect life!",
                neutral: "You've learned strategic habit stacking for personal and civic success."
            },
            age_25: {
                grandmother: "Excellent! Use these habit stacking skills to create positive change in your life and community!",
                fun: "FANTASTIC! Stack those habits for success and impact! Change the world!",
                neutral: "You understand how habit stacking enables achievement and engagement."
            },
            age_40: {
                grandmother: "Beautiful work! Your habit stacks will inspire and guide those around you!",
                fun: "EXCELLENT! Lead by example with your awesome habit stacks!",
                neutral: "You've learned how habit systems demonstrate leadership through action."
            },
            age_60: {
                grandmother: "Thank you for exploring this with me! Your wisdom makes habit stacking even more powerful!",
                fun: "INSPIRING! Your experience plus habit stacking equals pure wisdom!",
                neutral: "Your mature perspective enhances understanding of strategic habit formation."
            },
            age_80: {
                grandmother: "Wonderful reflection! Your lifetime of habits is a testament to the power of daily choices!",
                fun: "AMAZING! Eight decades of habit wisdom - you're the real expert here!",
                neutral: "Your long experience illuminates the cumulative power of consistent habits."
            },
            age_102: {
                grandmother: "Dearest friend, thank you for sharing this journey! Your century of habits inspires us all!",
                fun: "MAGNIFICENT! 102 years of habit mastery - you ARE the lesson!",
                neutral: "Your centennial perspective on habits provides invaluable wisdom. Thank you."
            }
        };
        
        return conclusions[age][tone];
    }
    
    /**
     * Generate complete lesson with all 30 variants
     */
    async generateCompleteLesson() {
        console.log('\n📚 Generating Day 2: Habit Stacking for Productivity');
        console.log('=' .repeat(60));
        console.log('Structure: 3 questions, 2 options each, 2 teaching moments, 1 wisdom');
        console.log('=' .repeat(60));
        
        const script = {
            lessonId: 2,
            date: this.lesson.date,
            title: this.lesson.title,
            learningObjective: this.lesson.learning_objective,
            month: this.lesson.month,
            generatedAt: new Date().toISOString(),
            totalVariants: 30,
            structure: {
                questionsPerLesson: 3,
                optionsPerQuestion: 2,
                teachingMomentsPerQuestion: 2,
                wisdomsPerLesson: 1
            },
            variants: {}
        };
        
        let variantCount = 0;
        
        // Generate all 30 variants
        for (const age of this.ages) {
            script.variants[age] = {};
            
            for (const tone of this.tones) {
                variantCount++;
                console.log(`\n[${variantCount}/30] Generating ${age}/${tone} variant...`);
                
                try {
                    const variant = {
                        age: age,
                        tone: tone,
                        avatar: tone === 'fun' ? 'ken' : 'kelly',
                        introduction: this.generateIntroduction(age, tone),
                        questions: this.generateQuestions(age, tone),
                        wisdom: this.generateWisdom(age, tone),
                        conclusion: this.generateConclusion(age, tone),
                        metadata: {
                            generatedAt: new Date().toISOString()
                        }
                    };
                    
                    script.variants[age][tone] = variant;
                    console.log(`  ✅ Generated with 3 questions, 6 teaching moments, 1 wisdom`);
                    
                } catch (error) {
                    console.error(`  ❌ Error generating ${age}/${tone}:`, error.message);
                    script.variants[age][tone] = {
                        error: error.message
                    };
                }
            }
        }
        
        // Add summary
        script.summary = {
            totalVariants: variantCount,
            successfulVariants: Object.values(script.variants).reduce((sum, ageVariants) => 
                sum + Object.values(ageVariants).filter(v => !v.error).length, 0),
            structure: "10 ages × 3 tones = 30 variants, each with 3 questions"
        };
        
        console.log('\n' + '=' .repeat(60));
        console.log(`✅ Generation complete: ${script.summary.successfulVariants}/${script.summary.totalVariants} variants`);
        
        return script;
    }
    
    /**
     * Save the generated lesson
     */
    async saveLesson(script) {
        const fileName = `day_002_habit_stacking.json`;
        const filePath = path.join(this.outputDir, fileName);
        
        await fs.writeFile(filePath, JSON.stringify(script, null, 2));
        console.log(`\n💾 Saved to: ${fileName}`);
        console.log(`📁 Location: ${this.outputDir}`);
    }
    
    /**
     * Main execution
     */
    async run() {
        try {
            await this.initialize();
            const lesson = await this.generateCompleteLesson();
            await this.saveLesson(lesson);
            
            console.log('\n🎉 Day 2 generation complete!');
            console.log('✅ 30 variants (10 ages × 3 tones)');
            console.log('✅ Each variant has exactly:');
            console.log('   - 3 questions');
            console.log('   - 2 options per question');
            console.log('   - 2 teaching moments per question');
            console.log('   - 1 wisdom');
            console.log('✅ NO duration estimates (only TTS timing matters)');
            
        } catch (error) {
            console.error('❌ Fatal error:', error);
        }
    }
}

// Run the generator
const generator = new Day2Generator();
generator.run();