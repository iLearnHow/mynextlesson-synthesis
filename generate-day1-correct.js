/**
 * Generate Day 1 with CORRECT structure
 * EXACTLY 3 questions, 2 options each, 2 teaching moments each, 1 wisdom
 * NO duration estimates - only TTS timing matters
 */

const fs = require('fs').promises;
const path = require('path');

class Day1CorrectGenerator {
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
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log('✅ Output directory ready');
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
     * Generate EXACTLY 3 questions with EXACTLY 2 options and 2 teaching moments each
     */
    generateQuestions(age, tone) {
        const questions = {
            age_2: [
                {
                    question: "Where is the Sun?",
                    options: ["Up in the sky", "Under the water"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! The Sun is up in the sky! It shines down on us from way up high!",
                        option_b: "The Sun is not under water. Look up! The Sun is in the sky above us!"
                    }
                },
                {
                    question: "Is the Sun hot or cold?",
                    options: ["Hot", "Cold"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "That's right! The Sun is very, very hot! It keeps us warm!",
                        option_b: "The Sun is not cold. The Sun is hot! Feel the warm sunshine!"
                    }
                },
                {
                    question: "When do we see the Sun?",
                    options: ["Daytime", "Nighttime"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! We see the Sun in the daytime when it's bright!",
                        option_b: "We don't see the Sun at night. The Sun comes out in the day!"
                    }
                }
            ],
            age_5: [
                {
                    question: "What does the Sun give us?",
                    options: ["Light and warmth", "Snow and ice"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Excellent! The Sun gives us light to see and warmth to feel cozy!",
                        option_b: "Snow and ice come when it's cold. The Sun gives us light and warmth!"
                    }
                },
                {
                    question: "Is the Sun a star?",
                    options: ["Yes, it's a star", "No, it's a planet"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "That's right! The Sun is a star - the closest star to Earth!",
                        option_b: "The Sun is not a planet. The Sun is a star that shines its own light!"
                    }
                },
                {
                    question: "What do plants need from the Sun?",
                    options: ["Light to grow", "Darkness to hide"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Plants need sunlight to grow big and strong!",
                        option_b: "Plants don't need darkness from the Sun. They need the Sun's light to grow!"
                    }
                }
            ],
            age_8: [
                {
                    question: "How does the Sun make its own light?",
                    options: ["It's like a giant fire inside", "Someone turns it on"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Good thinking! The Sun has super hot gases that glow and make light!",
                        option_b: "No one turns the Sun on. The Sun makes its own light from hot gases inside!"
                    }
                },
                {
                    question: "Why do we have day and night?",
                    options: ["Earth spins around", "The Sun moves away"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Earth spins like a top, so we face the Sun (day) then face away (night)!",
                        option_b: "The Sun doesn't move away. Earth spins, which makes day and night!"
                    }
                },
                {
                    question: "How far is the Sun from Earth?",
                    options: ["Very, very far", "Just above the clouds"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! The Sun is about 93 million miles away - super far!",
                        option_b: "The Sun is much farther than the clouds. It's 93 million miles away in space!"
                    }
                }
            ],
            age_12: [
                {
                    question: "What process powers the Sun?",
                    options: ["Nuclear fusion", "Burning coal"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Nuclear fusion combines hydrogen atoms into helium, releasing huge energy!",
                        option_b: "The Sun doesn't burn coal. It uses nuclear fusion - atoms joining together!"
                    }
                },
                {
                    question: "How long does sunlight take to reach Earth?",
                    options: ["About 8 minutes", "Instantly"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Light travels fast but still takes 8 minutes to cross 93 million miles!",
                        option_b: "Even light takes time to travel. Sunlight needs 8 minutes to reach Earth!"
                    }
                },
                {
                    question: "Why do scientists worldwide study the Sun together?",
                    options: ["The Sun affects everyone", "They just like teamwork"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! The Sun impacts all life on Earth, so nations cooperate to understand it!",
                        option_b: "It's more than liking teamwork. The Sun affects everyone, so we study it together!"
                    }
                }
            ],
            age_16: [
                {
                    question: "How does understanding solar fusion help humanity?",
                    options: ["Could provide clean energy", "Just interesting facts"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! If we master fusion like the Sun, we'd have unlimited clean energy!",
                        option_b: "It's more than interesting. Solar fusion knowledge could solve our energy crisis!"
                    }
                },
                {
                    question: "Why monitor solar flares and storms?",
                    options: ["They affect our technology", "Just for astronomy class"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Solar storms can damage satellites and power grids we depend on!",
                        option_b: "It's not just for class. Solar storms can knock out GPS and electricity!"
                    }
                },
                {
                    question: "How does sharing solar data build trust between nations?",
                    options: ["Shows transparent cooperation", "Doesn't really help"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! When countries openly share data, it builds trust and collaboration!",
                        option_b: "It does help! Sharing scientific data shows nations can work together honestly!"
                    }
                }
            ],
            age_25: [
                {
                    question: "How does solar energy relate to global politics?",
                    options: ["Reduces resource conflicts", "No connection"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Solar energy reduces dependence on fossil fuels that cause conflicts!",
                        option_b: "There's a big connection. Solar energy can reduce wars over oil and gas!"
                    }
                },
                {
                    question: "What role does open solar data play in democracy?",
                    options: ["Fights misinformation", "Just for scientists"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! Public data lets citizens verify facts and make informed decisions!",
                        option_b: "It's for everyone! Open data helps all citizens distinguish truth from lies!"
                    }
                },
                {
                    question: "How do international solar missions model cooperation?",
                    options: ["Unite diverse nations", "Create competition"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Solar missions show how different countries achieve more together!",
                        option_b: "They don't compete. Solar missions prove cooperation beats competition!"
                    }
                }
            ],
            age_40: [
                {
                    question: "How can solar science education strengthen democracy?",
                    options: ["Teaches critical thinking", "Unrelated topics"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Correct! Learning to analyze evidence about the Sun builds civic reasoning skills!",
                        option_b: "They're very related. Solar science teaches the evidence evaluation democracy needs!"
                    }
                },
                {
                    question: "What does continuous solar observation teach us?",
                    options: ["Value of long-term thinking", "Quick results are better"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Right! Decades of data reveal patterns - patience brings understanding!",
                        option_b: "Long-term is crucial. Solar cycles teach us that real insights take time!"
                    }
                },
                {
                    question: "How has solar research evolved from competition to cooperation?",
                    options: ["Cold War rivalry to partnership", "Always been cooperative"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! We went from space race competition to shared solar observatories!",
                        option_b: "It wasn't always cooperative. We transformed rivalry into global teamwork!"
                    }
                }
            ],
            age_60: [
                {
                    question: "What wisdom comes from decades of solar observation?",
                    options: ["Patterns reveal truth slowly", "Everything changes quickly"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! Long-term solar data shows how patient observation reveals deep truths!",
                        option_b: "Solar science shows the opposite. Real understanding comes from patient study!"
                    }
                },
                {
                    question: "How can we inspire future solar scientists?",
                    options: ["Share wonder and methods", "Keep knowledge exclusive"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Sharing both discoveries and how we made them inspires learners!",
                        option_b: "Knowledge must be shared! Opening science to all creates future discoverers!"
                    }
                },
                {
                    question: "What legacy does international solar cooperation leave?",
                    options: ["Proof humanity can unite", "Just scientific data"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Exactly! Solar science proves we can transcend borders for common goals!",
                        option_b: "It's much more than data. It shows humanity at its collaborative best!"
                    }
                }
            ],
            age_80: [
                {
                    question: "How has understanding the Sun changed in your lifetime?",
                    options: ["From mystery to deep knowledge", "Stayed about the same"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Indeed! We've gone from basic observation to understanding fusion and solar wind!",
                        option_b: "It's transformed completely! We now understand the Sun's inner workings!"
                    }
                },
                {
                    question: "What does the Sun teach about constancy and change?",
                    options: ["Both exist together", "Everything stays constant"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Profound! The Sun is stable yet dynamic - like life and society!",
                        option_b: "The Sun shows both. It's constant in our sky but always changing inside!"
                    }
                },
                {
                    question: "How does solar knowledge connect generations?",
                    options: ["Shared wonder unites us", "Each generation starts over"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Every generation adds to our solar understanding, building together!",
                        option_b: "We build on past knowledge. Each generation adds to the solar story!"
                    }
                }
            ],
            age_102: [
                {
                    question: "What has a century taught about humanity and the Sun?",
                    options: ["We're deeply connected", "We're separate from nature"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Yes! A century shows how intimately human life dances with solar rhythms!",
                        option_b: "We're not separate. The Sun's cycles are woven into all human experience!"
                    }
                },
                {
                    question: "What endures across a century of change?",
                    options: ["Wonder at the Sun", "Nothing really lasts"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Beautiful! Technologies change but human awe at the Sun remains eternal!",
                        option_b: "Something does last - our wonder! The Sun still inspires after 100 years!"
                    }
                },
                {
                    question: "What gift does solar understanding offer humanity?",
                    options: ["Unity through shared truth", "Just technical knowledge"],
                    correctAnswer: 0,
                    teachingMoments: {
                        option_a: "Profound! Understanding our star together connects all humanity as one!",
                        option_b: "It's far beyond technical. The Sun shows us we're one human family!"
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
                grandmother: "Just like the Sun shines on everyone, you can share your smile with everyone too!",
                fun: "You're a little sunshine! Shine bright like the Sun!",
                neutral: "The Sun shines every day. You are special every day."
            },
            age_5: {
                grandmother: "Remember, my dear, just as the Sun never forgets to rise, you can always count on learning something new each day!",
                fun: "You're a SUPER STAR learner! Keep shining and exploring like our awesome Sun!",
                neutral: "Like the Sun gives light to Earth, your learning lights up your mind."
            },
            age_8: {
                grandmother: "The Sun teaches us that being steady and reliable, like showing up each day, creates powerful results over time!",
                fun: "You've got solar power in your brain! Use your bright ideas to light up the world!",
                neutral: "Understanding the Sun helps us understand our place in the universe."
            },
            age_12: {
                grandmother: "Just as nations unite to study the Sun, your generation can unite to solve Earth's challenges!",
                fun: "You're nuclear-powered with knowledge! Time to fusion your learning with action!",
                neutral: "Scientific cooperation on solar research models how humanity can work together."
            },
            age_16: {
                grandmother: "The Sun shows us that the most powerful forces in nature also nurture life - strength and care go together!",
                fun: "You're ready to harness solar-level energy for positive change! The future is bright!",
                neutral: "Understanding fusion in the Sun illuminates pathways to sustainable energy futures."
            },
            age_25: {
                grandmother: "Like the Sun's light reaches everywhere without discrimination, let your actions promote equity and justice!",
                fun: "You're equipped to be a solar revolutionary - bringing light to dark places and energy to change!",
                neutral: "Solar science demonstrates how evidence-based international cooperation advances humanity."
            },
            age_40: {
                grandmother: "The Sun reminds us that consistent, patient work - like its faithful rising - creates lasting impact!",
                fun: "Channel that solar fusion energy into fusing communities together for positive change!",
                neutral: "Long-term solar observation parallels the patience needed for social progress."
            },
            age_60: {
                grandmother: "Your years of experience, like accumulated solar data, offer invaluable insights for future generations!",
                fun: "You've orbited the Sun enough times to know - persistence and collaboration are the real superpowers!",
                neutral: "Decades of observation reveal patterns invisible to shorter perspectives."
            },
            age_80: {
                grandmother: "Like the Sun that has warmed all your days, your wisdom now warms and guides others!",
                fun: "After so many trips around the Sun, you know the secret - we're all stardust making a difference!",
                neutral: "A lifetime's perspective illuminates how scientific and social progress interweave."
            },
            age_102: {
                grandmother: "Cherished friend, like our faithful Sun, your century of learning lights the path for all who follow!",
                fun: "A hundred years of sunshine! You're proof that wonder and learning never age!",
                neutral: "Your centennial journey with the Sun embodies humanity's continuous quest for understanding."
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
                grandmother: "The Sun is our friend in the sky! Wave bye-bye to the Sun! See you tomorrow!",
                fun: "YAY! The Sun is AMAZING! Bye bye, Sun! See you tomorrow!",
                neutral: "We learned about the Sun. Thank you for learning today."
            },
            age_5: {
                grandmother: "What a wonderful time learning about our special Sun! I'm so proud of you, dear one!",
                fun: "AWESOME JOB! You're a Sun expert now! Keep shining bright!",
                neutral: "Good work learning about the Sun today. You did well."
            },
            age_8: {
                grandmother: "You've discovered so much about our amazing Sun! Keep that curiosity shining bright!",
                fun: "INCREDIBLE! You totally rocked this Sun lesson! You're a solar superstar!",
                neutral: "You now understand important facts about the Sun. Well done."
            },
            age_12: {
                grandmother: "I'm impressed by your understanding! You're part of a global community learning together!",
                fun: "MIND BLOWN! You've mastered the Sun! Use this knowledge to light up the world!",
                neutral: "You've successfully learned about solar science and international cooperation."
            },
            age_16: {
                grandmother: "You've connected science to real-world impact beautifully! Your generation will shine!",
                fun: "BRILLIANT! You see how everything connects! Time to solar-power your future!",
                neutral: "You understand the Sun's role in energy and global cooperation. Excellent."
            },
            age_25: {
                grandmother: "You're equipped to use this knowledge for positive change. Go forth and illuminate!",
                fun: "FANTASTIC! You've got the power of the Sun in your mind! Change the world!",
                neutral: "You've mastered how solar science demonstrates international cooperation principles."
            },
            age_40: {
                grandmother: "Your understanding can guide others. Like the Sun, be a steady light in your community!",
                fun: "EXCELLENT! You see all the connections! Keep spreading that solar wisdom!",
                neutral: "You've integrated solar science with broader democratic and social principles."
            },
            age_60: {
                grandmother: "Thank you for reflecting on these connections. Your insights enrich us all!",
                fun: "INSPIRING! Your perspective adds so much! Keep sharing that solar wisdom!",
                neutral: "Your examination of solar science's evolution provides valuable perspective."
            },
            age_80: {
                grandmother: "Your lifetime of observation is a gift. Thank you for sharing in this eternal learning!",
                fun: "WONDERFUL! Your wisdom shines like the Sun itself! Thank you for learning with us!",
                neutral: "Your long perspective enriches our understanding of scientific and social progress."
            },
            age_102: {
                grandmother: "Dearest friend, your century of experience with our Sun is a treasure. Thank you!",
                fun: "MAGNIFICENT! A century of solar wisdom! You ARE the sunshine!",
                neutral: "Your centennial perspective on the Sun and humanity is invaluable. Thank you."
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
        console.log('Structure: 3 questions, 2 options each, 2 teaching moments, 1 wisdom');
        console.log('=' .repeat(60));
        
        const script = {
            lessonId: 1,
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
        const fileName = `day_001_sun_complete.json`;
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
            
            console.log('\n🎉 Day 1 generation complete!');
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
const generator = new Day1CorrectGenerator();
generator.run();