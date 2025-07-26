/**
 * MyNextLesson Real-Time Synthesis Engine
 * Transforms educational content based on age, tone, and language parameters
 */

class SynthesisEngine {
    constructor() {
        this.lessonDNA = null;
        this.cache = new Map();
        this.synthesisCount = 0;
        this.initializeEngine();
    }

    async initializeEngine() {
        try {
            // Load lesson DNA
            this.lessonDNA = await this.loadLessonDNA();
            console.log('🧬 Synthesis Engine initialized with lesson DNA');
        } catch (error) {
            console.error('❌ Failed to initialize synthesis engine:', error);
            // Use fallback DNA if loading fails
            this.lessonDNA = this.getFallbackDNA();
        }
    }

    async loadLessonDNA() {
        const response = await fetch('data/the-sun-dna.json');
        if (!response.ok) {
            throw new Error(`Failed to load lesson DNA: ${response.status}`);
        }
        return await response.json();
    }

    /**
     * Main synthesis method - transforms content based on parameters
     */
    async synthesizeLesson(parameters) {
        const startTime = performance.now();
        
        try {
            // Generate cache key
            const cacheKey = this.generateCacheKey(parameters);
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                return {
                    ...cached,
                    synthesisTime: performance.now() - startTime,
                    fromCache: true
                };
            }

            // Synthesize new content
            const synthesizedContent = await this.performSynthesis(parameters);
            
            // Cache the result
            this.cache.set(cacheKey, synthesizedContent);
            this.synthesisCount++;

            const synthesisTime = performance.now() - startTime;
            
            console.log(`✨ Synthesized lesson in ${synthesisTime.toFixed(1)}ms`);
            
            return {
                ...synthesizedContent,
                synthesisTime,
                fromCache: false,
                synthesisCount: this.synthesisCount
            };
            
        } catch (error) {
            console.error('❌ Synthesis failed:', error);
            return this.getErrorFallback(parameters);
        }
    }

    async performSynthesis(parameters) {
        const { age, tone, language } = parameters;
        
        // Step 1: Age contextualization
        const ageContext = this.contextualizeForAge(age);
        
        // Step 2: Tone application
        const toneContext = this.applyTone(tone, ageContext);
        
        // Step 3: Language adaptation
        const languageContext = this.adaptLanguage(language, toneContext);
        
        // Step 4: Generate final content
        return this.generateLessonContent(ageContext, toneContext, languageContext, parameters);
    }

    contextualizeForAge(age) {
        let ageCategory;
        let cognitiveLevel;
        let complexity;
        
        if (age <= 8) {
            ageCategory = 'early_childhood';
            cognitiveLevel = 'concrete';
            complexity = 'Simple';
        } else if (age <= 17) {
            ageCategory = 'youth';
            cognitiveLevel = 'developing_abstract';
            complexity = 'Intermediate';
        } else if (age <= 35) {
            ageCategory = 'young_adult';
            cognitiveLevel = 'full_abstract';
            complexity = 'Advanced';
        } else if (age <= 65) {
            ageCategory = 'midlife';
            cognitiveLevel = 'systems_thinking';
            complexity = 'Expert';
        } else {
            ageCategory = 'wisdom_years';
            cognitiveLevel = 'wisdom_integration';
            complexity = 'Wisdom';
        }

        const ageExpression = this.lessonDNA?.age_expressions?.[ageCategory] || this.getDefaultAgeExpression(ageCategory);
        
        return {
            ageCategory,
            cognitiveLevel,
            complexity,
            conceptName: ageExpression.concept_name || this.getAgeAppropriateTitle(age),
            examples: ageExpression.examples || this.getAgeAppropriateExamples(age),
            vocabulary: ageExpression.vocabulary || [],
            attentionSpan: ageExpression.attention_span || this.calculateAttentionSpan(age)
        };
    }

    applyTone(tone, ageContext) {
        const toneData = this.lessonDNA?.tone_delivery?.[tone] || this.getDefaultToneData(tone);
        
        return {
            toneName: tone,
            voiceCharacter: toneData.voice_character || this.getDefaultVoiceCharacter(tone),
            emotionalTemperature: toneData.emotional_temperature || 'balanced',
            languagePatterns: toneData.language_patterns || this.getDefaultLanguagePatterns(tone),
            personalityTraits: this.getTonePersonality(tone, ageContext.ageCategory)
        };
    }

    adaptLanguage(language, toneContext) {
        // For demo purposes, primarily English with basic adaptations
        return {
            language,
            culturalContext: this.getCulturalContext(language),
            formalityLevel: this.getFormalityLevel(language, toneContext.toneName),
            localizedExamples: this.getLocalizedExamples(language)
        };
    }

    generateLessonContent(ageContext, toneContext, languageContext, parameters) {
        const { age, tone } = parameters;
        
        return {
            title: this.synthesizeTitle(ageContext, toneContext),
            complexity: ageContext.complexity,
            duration: this.calculateDuration(ageContext.attentionSpan),
            avatar: this.getAvatarInfo(tone),
            
            sections: {
                introduction: this.synthesizeIntroduction(ageContext, toneContext, languageContext),
                concept: this.synthesizeConcept(ageContext, toneContext, languageContext),
                examples: this.synthesizeExamples(ageContext, toneContext, languageContext),
                reflection: this.synthesizeReflection(ageContext, toneContext, languageContext)
            },
            
            metadata: {
                ageCategory: ageContext.ageCategory,
                cognitiveLevel: ageContext.cognitiveLevel,
                toneName: toneContext.toneName,
                language: languageContext.language,
                personalityMatch: this.calculatePersonalityMatch(age, tone)
            }
        };
    }

    // Content Synthesis Methods
    synthesizeTitle(ageContext, toneContext) {
        const baseTitles = {
            early_childhood: "The Amazing Sun That Lights Up Our World",
            youth: "The Sun - Earth's Incredible Energy Source",
            young_adult: "Solar Physics - Understanding Our Star",
            midlife: "The Sun's Role in Earth's Energy Systems", 
            wisdom_years: "The Sun - A Lifetime of Solar Wonder"
        };
        
        const toneModifiers = {
            grandmother: {
                prefix: "Let's Learn About ",
                style: "gentle and warm"
            },
            fun: {
                prefix: "Get Ready to Explore ",
                suffix: "! 🌟",
                style: "exciting and energetic"
            },
            neutral: {
                prefix: "Understanding ",
                style: "clear and educational"
            }
        };
        
        let title = baseTitles[ageContext.ageCategory] || baseTitles.young_adult;
        const modifier = toneModifiers[toneContext.toneName] || toneModifiers.neutral;
        
        if (modifier.prefix) title = modifier.prefix + title;
        if (modifier.suffix) title = title + modifier.suffix;
        
        return title;
    }

    synthesizeIntroduction(ageContext, toneContext, languageContext) {
        const introductions = {
            early_childhood: {
                grandmother: "Oh my dear little one, let me tell you about something absolutely magical that shines down on us every single day. The sun is like a giant, warm hug from the sky that helps everything grow and keeps us cozy!",
                fun: "Hey there, superstar! 🌟 Ready to learn about the most AMAZING ball of fire in our sky? The sun is like nature's biggest, brightest nightlight - except it works during the day!",
                neutral: "The sun is a very important star that gives light and warmth to Earth. Every day, the sun helps plants grow and keeps our planet at the right temperature for life."
            },
            youth: {
                grandmother: "Sweetheart, the sun has been watching over our world for billions of years, and today I want to share with you some of the incredible secrets this beautiful star holds.",
                fun: "Alright, space explorer! 🚀 Time to blast off into some mind-blowing facts about our cosmic neighbor. The sun isn't just a big bright thing - it's basically a massive nuclear reactor floating in space!",
                neutral: "The sun is a medium-sized star located at the center of our solar system. Understanding how the sun works helps us understand energy, weather patterns, and life on Earth."
            },
            young_adult: {
                grandmother: "My dear, the sun represents one of humanity's greatest sources of wonder and practical energy. Let me share what we've learned about this remarkable celestial body.",
                fun: "Ready to have your mind completely blown? 🤯 We're diving into stellar physics today, and trust me - the sun is way cooler than you think! (Well, actually it's incredibly hot, but you know what I mean!)",
                neutral: "Solar physics encompasses the study of nuclear fusion, electromagnetic radiation, and the complex interactions that make our star function as Earth's primary energy source."
            },
            midlife: {
                grandmother: "Dear one, as we explore the sun together, think about how this knowledge can enrich your understanding of the world and perhaps inspire those around you.",
                fun: "Time to level up your cosmic knowledge! 🌞 Whether you're thinking about solar panels for your home or just want to impress people at dinner parties, this sun science is absolutely fascinating!",
                neutral: "Understanding solar physics provides practical insights for energy decisions, climate awareness, and technological applications that affect daily life and long-term planning."
            },
            wisdom_years: {
                grandmother: "Precious soul, the sun has been our faithful companion throughout your entire lifetime. Let's reflect together on the profound science behind this daily miracle.",
                fun: "You've watched thousands of sunrises and sunsets - now let's dive into the incredible science behind every single one! ☀️ Prepare to see your old friend the sun in a completely new light!",
                neutral: "After decades of observing the sun's cycles and effects, we can now appreciate both the scientific complexity and practical implications of solar science from a lifetime perspective."
            }
        };
        
        return introductions[ageContext.ageCategory]?.[toneContext.toneName] || 
               introductions.young_adult.neutral;
    }

    synthesizeConcept(ageContext, toneContext, languageContext) {
        const concepts = {
            early_childhood: {
                grandmother: "The sun is like a huge campfire in the sky, but instead of burning wood, it makes light and heat by squeezing tiny pieces together so tightly that they become pure energy. This energy travels all the way to Earth to warm us up and help plants grow big and strong!",
                fun: "Picture this: the sun is basically a giant ball of gas having the most epic dance party ever! 💃 All these tiny particles are bouncing around and smashing into each other SO fast that they create light and heat. It's like the universe's most awesome disco ball!",
                neutral: "The sun creates energy through a process called nuclear fusion. Hydrogen atoms combine to form helium, releasing enormous amounts of energy as light and heat that travel to Earth."
            },
            youth: {
                grandmother: "The sun works through nuclear fusion, where hydrogen atoms join together under incredible pressure and temperature to create helium and release energy. This same process could help us create clean energy here on Earth.",
                fun: "Okay, get this - the sun is basically running the most intense chemistry experiment in our solar system! 🧪 Every second, it's converting 600 million tons of hydrogen into helium, and that leftover mass becomes pure energy. Einstein would be SO proud!",
                neutral: "Nuclear fusion in the sun's core converts hydrogen to helium at temperatures of 15 million degrees Celsius. This process releases energy that takes thousands of years to reach the surface and then 8 minutes to travel to Earth."
            },
            young_adult: {
                grandmother: "The fusion process in the sun's core demonstrates principles that scientists are working to harness for sustainable energy production, representing both scientific achievement and environmental hope.",
                fun: "The sun is essentially a self-sustaining fusion reactor that's been running perfectly for 4.6 billion years! 🔥 We're trying to recreate this process on Earth for clean energy - imagine having our own mini-sun powering our cities!",
                neutral: "Solar fusion involves the proton-proton chain reaction, where four hydrogen nuclei fuse to form one helium nucleus. The mass difference is converted to energy according to E=mc², providing the sun's luminosity of 3.8 × 10²⁶ watts."
            },
            midlife: {
                grandmother: "Understanding fusion helps us appreciate both the sun's reliability and the potential for clean energy technologies that could benefit future generations while addressing climate concerns.",
                fun: "Here's what blows my mind: the sun has been our ultimate renewable energy source this whole time! ⚡ Every solar panel, every wind turbine, every growing plant - it all traces back to fusion reactions happening 93 million miles away!",
                neutral: "Solar fusion physics informs renewable energy technologies, climate modeling, and energy policy decisions. Understanding these processes helps evaluate sustainability options and long-term energy strategies."
            },
            wisdom_years: {
                grandmother: "The sun's fusion process represents the cosmic forces that have sustained life throughout your lifetime and will continue long after, connecting your experience to the universal story of energy and matter.",
                fun: "You've felt the sun's warmth for decades, and now you know each ray comes from hydrogen atoms that danced together in nuclear fusion! ✨ Every sunrise you've enjoyed was powered by the same cosmic process that creates all the elements in the universe!",
                neutral: "Solar fusion exemplifies the fundamental physical processes governing stellar evolution and energy production. This understanding enriches appreciation for the cosmic context of human existence and technological development."
            }
        };
        
        return concepts[ageContext.ageCategory]?.[toneContext.toneName] || 
               concepts.young_adult.neutral;
    }

    synthesizeExamples(ageContext, toneContext, languageContext) {
        const examples = {
            early_childhood: {
                grandmother: "Think about how flowers always turn their faces toward the sun, just like you might turn toward someone you love. Plants know the sun gives them energy to grow! And remember how good it feels to stand in a sunny spot on a cool day? That's the sun sharing its warmth with you.",
                fun: "Ever notice how your toys feel warm after sitting in the sunshine? That's the sun's energy traveling 93 million miles just to warm up your stuff! 🧸 And sunflowers? They're like nature's solar panels, always turning to face their energy source!",
                neutral: "Examples of solar energy include: plants using sunlight for photosynthesis, solar panels converting light to electricity, and the water cycle powered by solar heating of oceans and lakes."
            },
            youth: {
                grandmother: "Solar energy powers the weather patterns you see, from gentle breezes to dramatic thunderstorms. Even fossil fuels are ancient solar energy stored in plants and animals that lived millions of years ago.",
                fun: "Your phone's battery? Could be charged by solar panels! That cool breeze on a hot day? Solar-powered wind! Even the gas in cars is basically ancient sunshine that got buried underground for millions of years! 🏃‍♂️⚡",
                neutral: "Solar energy applications include photovoltaic cells in calculators and satellites, solar thermal heating systems, and the indirect solar energy in wind power and hydroelectric systems."
            },
            young_adult: {
                grandmother: "Solar technology has evolved from simple solar calculators to sophisticated systems that can power entire communities, representing human ingenuity in working with natural processes.",
                fun: "Tesla's solar roof tiles, massive solar farms in deserts, and even solar-powered planes flying around the world! 🛩️ We're basically learning to capture and use the same energy source that's powered life on Earth for billions of years!",
                neutral: "Modern applications include grid-scale photovoltaic installations, concentrated solar power plants, passive solar building design, and emerging technologies like perovskite solar cells with 40%+ efficiency rates."
            },
            midlife: {
                grandmother: "Consider how solar energy investments today can provide long-term benefits for your family while contributing to environmental stewardship and energy independence.",
                fun: "From residential solar installations saving thousands on electricity bills to massive solar projects creating jobs and clean energy, we're living through the solar revolution! 📈 Your energy choices today are literally shaping tomorrow's world!",
                neutral: "Economic considerations include residential solar ROI calculations, utility-scale solar cost competitiveness with fossil fuels, and policy implications for renewable energy portfolio standards and carbon reduction targets."
            },
            wisdom_years: {
                grandmother: "You've witnessed the entire evolution of solar technology, from the first solar cells to today's efficient panels. Your perspective spans the growth of renewable energy awareness and implementation.",
                fun: "You've seen solar technology evolve from space programs to rooftops across America! 🏡 From the first solar calculators to entire cities powered by sunshine - what an incredible journey to have witnessed firsthand!",
                neutral: "Historical context includes the 1970s oil crisis spurring solar research, declining photovoltaic costs from $100/watt to under $0.50/watt, and the transition toward renewable energy portfolios in utility planning."
            }
        };
        
        return examples[ageContext.ageCategory]?.[toneContext.toneName] || 
               examples.young_adult.neutral;
    }

    synthesizeReflection(ageContext, toneContext, languageContext) {
        const reflections = {
            early_childhood: {
                grandmother: "Next time you see the sun shining, remember that you're seeing something truly magical - a star that has been giving energy and life to our world for longer than anyone can imagine. What's your favorite thing about sunny days?",
                fun: "Now when you go outside, you're basically standing under a giant nuclear reactor that's perfectly designed to make life possible! 🤯 How cool is that? What would you want to ask the sun if you could talk to it?",
                neutral: "How do you see evidence of solar energy in your daily life? Look around and notice how many things depend on energy from the sun."
            },
            youth: {
                grandmother: "Understanding the sun helps us appreciate both the wonder of nature and the potential for human innovation. How might this knowledge influence your thinking about energy and environment?",
                fun: "You're now officially a solar science expert! 🏆 How could understanding fusion and solar energy influence your future choices about technology, careers, or environmental action?",
                neutral: "Consider how solar physics relates to current energy debates, climate science, and technological development. What questions does this raise about future energy systems?"
            },
            young_adult: {
                grandmother: "This knowledge connects you to both the cosmic scale of stellar physics and the practical decisions about sustainable living and technology choices in your daily life.",
                fun: "Armed with solar knowledge, you're ready to make informed decisions about everything from buying a house with solar panels to supporting renewable energy policies! 💪 How will you use this cosmic wisdom?",
                neutral: "How does understanding solar physics inform your perspectives on energy policy, climate change mitigation, and technological investment decisions in your personal and professional life?"
            },
            midlife: {
                grandmother: "Your understanding of solar energy can guide both personal decisions and your ability to share knowledge with others about sustainable choices and scientific literacy.",
                fun: "You're now equipped to join the renewable energy revolution! 🌍 Whether through home solar installation, supporting clean energy policies, or just being an informed citizen, how will you apply this solar wisdom?",
                neutral: "Consider how solar energy knowledge influences your approach to home energy systems, investment decisions, community planning, and environmental stewardship responsibilities."
            },
            wisdom_years: {
                grandmother: "Your lifetime perspective on solar energy development enriches understanding of both scientific progress and the importance of sustainable choices for future generations.",
                fun: "You've witnessed the entire solar revolution unfold! 🌅 What insights from your experience with changing technology and energy systems would you share with younger generations about our solar future?",
                neutral: "Reflecting on decades of technological change, how do you see solar energy fitting into the broader narrative of human adaptation, environmental responsibility, and intergenerational stewardship?"
            }
        };
        
        return reflections[ageContext.ageCategory]?.[toneContext.toneName] || 
               reflections.young_adult.neutral;
    }

    // Helper Methods
    getAgeAppropriateTitle(age) {
        if (age <= 8) return "The Amazing Sun That Lights Up Our World";
        if (age <= 17) return "The Sun - Earth's Incredible Energy Source";
        if (age <= 35) return "Solar Physics - Understanding Our Star";
        if (age <= 65) return "The Sun's Role in Earth's Energy Systems";
        return "The Sun - A Lifetime of Solar Wonder";
    }

    calculateDuration(attentionSpan) {
        if (typeof attentionSpan === 'string') {
            if (attentionSpan.includes('3-4')) return '4 minutes';
            if (attentionSpan.includes('5-6')) return '6 minutes';
        }
        return '6 minutes';
    }

    getAvatarInfo(tone) {
        const avatars = {
            grandmother: { name: 'Kelly', emoji: '👵', personality: 'Wise & Caring' },
            fun: { name: 'Ken', emoji: '🎉', personality: 'Energetic & Playful' },
            neutral: { name: 'Ken', emoji: '🎓', personality: 'Clear & Educational' }
        };
        return avatars[tone] || avatars.neutral;
    }

    calculatePersonalityMatch(age, tone) {
        // Simulate personality matching algorithm
        const matches = {
            grandmother: age >= 40 ? 0.9 : 0.7,
            fun: age <= 25 ? 0.95 : 0.8,
            neutral: 0.85 // Always balanced
        };
        return matches[tone] || 0.85;
    }

    generateCacheKey(parameters) {
        return `${parameters.age}_${parameters.tone}_${parameters.language}`;
    }

    // Fallback Methods
    getFallbackDNA() {
        return {
            lesson_id: "the_sun",
            universal_concept: "stellar_physics_enables_life",
            core_principle: "scientific_observation_builds_shared_knowledge",
            age_expressions: {
                early_childhood: { concept_name: "The Amazing Sun" },
                youth: { concept_name: "Solar Energy and Physics" },
                young_adult: { concept_name: "Understanding Our Star" },
                midlife: { concept_name: "Solar Systems and Energy" },
                wisdom_years: { concept_name: "A Lifetime of Solar Wonder" }
            },
            tone_delivery: {
                grandmother: { voice_character: "loving_elder" },
                fun: { voice_character: "energetic_guide" },
                neutral: { voice_character: "knowledgeable_teacher" }
            }
        };
    }

    getErrorFallback(parameters) {
        return {
            title: "The Sun - Our Amazing Star",
            complexity: "Intermediate",
            duration: "6 minutes",
            avatar: this.getAvatarInfo(parameters.tone),
            sections: {
                introduction: "Welcome to an amazing lesson about the sun, our nearest star!",
                concept: "The sun creates energy through nuclear fusion, converting hydrogen into helium.",
                examples: "Solar energy powers plants, weather, and increasingly, our technology.",
                reflection: "How do you see the sun's energy affecting your daily life?"
            },
            metadata: {
                error: true,
                fallbackUsed: true
            },
            synthesisTime: 1,
            fromCache: false
        };
    }

    // Utility Methods for Tone Characteristics
    getTonePersonality(tone, ageCategory) {
        const personalities = {
            grandmother: {
                early_childhood: "gentle, nurturing, storytelling",
                youth: "wise, encouraging, patient", 
                young_adult: "caring, experienced, supportive",
                midlife: "understanding, practical, warm",
                wisdom_years: "peer-like, reflective, honoring"
            },
            fun: {
                early_childhood: "playful, exciting, wonder-filled",
                youth: "energetic, relatable, inspiring",
                young_adult: "dynamic, motivating, engaging", 
                midlife: "enthusiastic, practical, empowering",
                wisdom_years: "celebratory, appreciative, joyful"
            },
            neutral: {
                early_childhood: "clear, simple, structured",
                youth: "informative, logical, comprehensive",
                young_adult: "professional, detailed, practical",
                midlife: "authoritative, applicable, strategic", 
                wisdom_years: "respectful, comprehensive, thoughtful"
            }
        };
        
        return personalities[tone]?.[ageCategory] || "balanced, educational";
    }

    getCulturalContext(language) {
        const contexts = {
            english: "individualistic_direct",
            spanish: "family_oriented_warm", 
            french: "formal_intellectual"
        };
        return contexts[language] || "neutral";
    }

    getFormalityLevel(language, tone) {
        if (tone === "grandmother") return "warm_informal";
        if (tone === "fun") return "casual_energetic";
        return "professional_clear";
    }

    getLocalizedExamples(language) {
        // For demo, return English examples
        // In production, this would have culturally adapted examples
        return [];
    }

    // Default fallback methods
    getDefaultAgeExpression(ageCategory) {
        return {
            concept_name: `Solar Physics for ${ageCategory}`,
            examples: ["Solar energy", "Nuclear fusion", "Renewable energy"],
            vocabulary: ["sun", "energy", "light", "heat"],
            attention_span: "6 minutes"
        };
    }

    getDefaultToneData(tone) {
        return {
            voice_character: `${tone}_educator`,
            emotional_temperature: "balanced",
            language_patterns: {
                openings: [`Hello there!`],
                transitions: [`Now let's explore`],
                closings: [`Thanks for learning!`]
            }
        };
    }

    getDefaultVoiceCharacter(tone) {
        const characters = {
            grandmother: "loving_wise_elder",
            fun: "energetic_enthusiastic_guide", 
            neutral: "knowledgeable_clear_teacher"
        };
        return characters[tone] || "balanced_educator";
    }

    getDefaultLanguagePatterns(tone) {
        const patterns = {
            grandmother: {
                openings: ["Oh my dear,", "Sweetheart,", "Let me tell you,"],
                transitions: ["Now here's something beautiful,", "And this is where it gets wonderful,"],
                closings: ["Rest well tonight, dear one,", "What a blessing this knowledge is,"]
            },
            fun: {
                openings: ["Hey there, superstar!", "Ready for something amazing?", "Time to explore!"],
                transitions: ["But here's where it gets REALLY cool!", "Plot twist!", "And now for the best part!"],
                closings: ["You're absolutely incredible!", "Keep being awesome!", "See you next time, champion!"]
            },
            neutral: {
                openings: ["Today we're exploring", "Let's examine", "We'll discover"],
                transitions: ["Building on this understanding", "The next concept", "This leads us to"],
                closings: ["This knowledge will serve you well", "You've built understanding", "Continue exploring"]
            }
        };
        return patterns[tone] || patterns.neutral;
    }

    calculateAttentionSpan(age) {
        if (age <= 8) return "3-4 minutes";
        if (age <= 17) return "5-6 minutes"; 
        return "6+ minutes";
    }

    getAgeAppropriateExamples(age) {
        if (age <= 8) return ["Sunshine warming your face", "Plants growing in sunlight", "Solar toys"];
        if (age <= 17) return ["Solar calculators", "Solar panels on houses", "Solar cars"];
        if (age <= 35) return ["Solar energy systems", "Fusion research", "Renewable technology"];
        if (age <= 65) return ["Home solar installations", "Energy investments", "Climate solutions"];
        return ["Solar technology evolution", "Energy policy", "Environmental legacy"];
    }
}

// Initialize global synthesis engine
window.synthesisEngine = new SynthesisEngine();
