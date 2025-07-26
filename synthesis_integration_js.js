/**
 * MyNextLesson Synthesis Engine - Enterprise Integration
 * Transforms 12 monthly curriculum files into 366 lesson DNA library
 * Provides real-time synthesis with calendar navigation
 */

class SynthesisEngineIntegrated {
    constructor() {
        this.curriculumData = [];
        this.dnaLibrary = new Map();
        this.synthesisCache = new Map();
        this.currentDay = 1;
        this.currentParameters = {
            age: 25,
            tone: 'fun',
            language: 'english'
        };
        this.initializeIntegration();
    }

    async initializeIntegration() {
        console.log('🧬 Initializing Enterprise Synthesis Integration...');
        
        try {
            // Load all 12 monthly curriculum files
            await this.loadAllCurriculumData();
            
            // Generate DNA library for all 366 lessons
            await this.generateDNALibrary();
            
            // Add synthesis controls to existing page
            this.addSynthesisControls();
            
            // Add calendar overlay
            this.addCalendarOverlay();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load today's lesson
            this.loadTodaysLesson();
            
            console.log('✅ Enterprise synthesis integration complete!');
            
        } catch (error) {
            console.error('❌ Integration failed:', error);
            this.initializeFallbackMode();
        }
    }

    async loadAllCurriculumData() {
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        this.curriculumData = [];
        
        for (const month of months) {
            try {
                const response = await fetch(`data/${month}_curriculum.json`);
                if (response.ok) {
                    const monthData = await response.json();
                    this.curriculumData.push(...monthData.days);
                    console.log(`📚 Loaded ${month}: ${monthData.days.length} topics`);
                } else {
                    console.warn(`⚠️ Could not load ${month}_curriculum.json`);
                }
            } catch (error) {
                console.warn(`⚠️ Error loading ${month}:`, error);
            }
        }
        
        // Sort by day number to ensure proper order
        this.curriculumData.sort((a, b) => a.day - b.day);
        
        console.log(`📖 Total curriculum loaded: ${this.curriculumData.length} lessons`);
    }

    async generateDNALibrary() {
        console.log('🧬 Generating DNA library for all lessons...');
        
        for (const topic of this.curriculumData) {
            const dna = this.generateDNAFromTopic(topic);
            const dnaKey = `day_${topic.day.toString().padStart(3, '0')}_${this.slugify(topic.title)}`;
            this.dnaLibrary.set(dnaKey, dna);
        }
        
        console.log(`🔬 Generated ${this.dnaLibrary.size} DNA files`);
    }

    generateDNAFromTopic(topic) {
        return {
            lesson_id: this.slugify(topic.title),
            day: topic.day,
            date: topic.date,
            title: topic.title,
            universal_concept: this.extractUniversalConcept(topic),
            core_principle: this.extractCorePrinciple(topic.learning_objective),
            learning_essence: topic.learning_objective,
            
            age_expressions: this.generateAgeExpressions(topic),
            tone_delivery: this.generateToneDelivery(topic),
            
            metadata: {
                auto_generated: true,
                source_curriculum: topic,
                generated_at: new Date().toISOString()
            }
        };
    }

    extractUniversalConcept(topic) {
        // Extract core concept from learning objective
        const concepts = {
            'animal': 'biological_systems_enable_life_and_adaptation',
            'environment': 'ecological_systems_create_sustainable_relationships',
            'light': 'electromagnetic_phenomena_enable_communication_and_energy',
            'technology': 'innovation_transforms_human_capabilities_and_society',
            'biology': 'living_systems_demonstrate_complex_organization',
            'physics': 'fundamental_forces_govern_natural_phenomena',
            'chemistry': 'molecular_interactions_create_material_properties',
            'art': 'creative_expression_enables_cultural_communication',
            'innovation': 'systematic_thinking_drives_technological_progress'
        };
        
        const title = topic.title.toLowerCase();
        for (const [keyword, concept] of Object.entries(concepts)) {
            if (title.includes(keyword)) {
                return concept;
            }
        }
        
        return 'scientific_understanding_enables_informed_decision_making';
    }

    extractCorePrinciple(learningObjective) {
        if (learningObjective.includes('conservation')) {
            return 'sustainable_practices_require_scientific_understanding_and_ethical_responsibility';
        }
        if (learningObjective.includes('technology')) {
            return 'technological_development_must_balance_innovation_with_social_impact';
        }
        if (learningObjective.includes('behavior') || learningObjective.includes('social')) {
            return 'understanding_systems_enables_positive_interaction_and_cooperation';
        }
        if (learningObjective.includes('expression') || learningObjective.includes('art')) {
            return 'creative_expression_builds_empathy_and_cultural_understanding';
        }
        
        return 'scientific_observation_and_evidence_create_shared_knowledge_for_human_benefit';
    }

    generateAgeExpressions(topic) {
        const baseTitle = topic.title;
        const baseObjective = topic.learning_objective;
        
        return {
            early_childhood: {
                concept_name: this.adaptTitleForAge(baseTitle, 'early_childhood'),
                examples: this.generateExamplesForAge(topic, 'early_childhood'),
                vocabulary: this.extractSimpleVocabulary(topic),
                attention_span: "3-4_minutes",
                complexity_level: "concrete_observable_actions"
            },
            youth: {
                concept_name: this.adaptTitleForAge(baseTitle, 'youth'),
                examples: this.generateExamplesForAge(topic, 'youth'),
                vocabulary: this.extractIntermediateVocabulary(topic),
                attention_span: "5-6_minutes",
                complexity_level: "systems_thinking_with_identity_relevance"
            },
            young_adult: {
                concept_name: this.adaptTitleForAge(baseTitle, 'young_adult'),
                examples: this.generateExamplesForAge(topic, 'young_adult'),
                vocabulary: this.extractAdvancedVocabulary(topic),
                attention_span: "6_minutes",
                complexity_level: "mechanistic_understanding_with_applications"
            },
            midlife: {
                concept_name: this.adaptTitleForAge(baseTitle, 'midlife'),
                examples: this.generateExamplesForAge(topic, 'midlife'),
                vocabulary: this.extractProfessionalVocabulary(topic),
                attention_span: "6_minutes",
                complexity_level: "systems_integration_and_leadership"
            },
            wisdom_years: {
                concept_name: this.adaptTitleForAge(baseTitle, 'wisdom_years'),
                examples: this.generateExamplesForAge(topic, 'wisdom_years'),
                vocabulary: this.extractWisdomVocabulary(topic),
                attention_span: "6_minutes",
                complexity_level: "philosophical_integration_and_legacy"
            }
        };
    }

    generateToneDelivery(topic) {
        return {
            grandmother: {
                voice_character: "loving_wise_elder_sharing_knowledge_with_gentle_authority",
                emotional_temperature: "warm_nurturing_encouraging_protective",
                language_patterns: {
                    openings: ["Oh my dear,", "Sweetheart,", "Let me tell you something wonderful,", "Come close and listen,"],
                    transitions: ["Now here's the beautiful part", "And this is where it gets magical", "Let me share something amazing"],
                    encouragements: ["Isn't that incredible?", "What a wonderful thing to learn!", "You understand so well!", "How amazing you are!"],
                    closings: ["What a blessing this knowledge is", "Sleep well with this wonder", "You carry such wisdom"]
                }
            },
            fun: {
                voice_character: "enthusiastic_adventure_guide_and_discovery_leader",
                emotional_temperature: "high_energy_amazed_celebratory_exciting",
                language_patterns: {
                    openings: ["Ready for something AMAZING?", "Time to explore something incredible!", "Get ready to have your mind blown!", "Welcome to the coolest adventure!"],
                    transitions: ["But wait, it gets even MORE incredible!", "BOOM! Here's the awesome part!", "Plot twist - this is amazing!", "And now for the coolest discovery!"],
                    encouragements: ["You're basically a scientist now!", "Your brain is on fire!", "That's some serious understanding!", "You're crushing this knowledge!"],
                    closings: ["You're officially an expert!", "Sweet dreams, amazing explorer!", "See you tomorrow, genius!", "Keep being incredible!"]
                }
            },
            neutral: {
                voice_character: "knowledgeable_professional_educator_and_evidence_guide",
                emotional_temperature: "calm_confident_scientifically_precise_inspiring",
                language_patterns: {
                    openings: ["Today we're exploring", "Let's examine", "Research shows us", "Evidence reveals"],
                    transitions: ["Building on this understanding", "The data demonstrates", "This leads us to", "Research indicates"],
                    encouragements: ["You're thinking scientifically", "Excellent reasoning", "You grasp the key concepts", "Strong understanding"],
                    closings: ["This knowledge serves you well", "Scientific thinking benefits society", "Continue exploring", "Apply this understanding"]
                }
            }
        };
    }

    // Age-specific content adaptation methods
    adaptTitleForAge(title, ageCategory) {
        const adaptations = {
            early_childhood: (t) => t.replace(/Science|Study|Physics|Technology/, 'Amazing World of').replace(/-.*/, ''),
            youth: (t) => t.replace(/- /, ' and '),
            young_adult: (t) => t,
            midlife: (t) => t + ' - Applications and Impact',
            wisdom_years: (t) => t + ' - Wisdom and Legacy'
        };
        
        return adaptations[ageCategory] ? adaptations[ageCategory](title) : title;
    }

    generateExamplesForAge(topic, ageCategory) {
        const baseExamples = {
            early_childhood: ['things you can see and touch', 'family experiences', 'simple activities'],
            youth: ['school projects', 'future careers', 'technology you use'],
            young_adult: ['career applications', 'personal decisions', 'innovative solutions'],
            midlife: ['family and community', 'leadership opportunities', 'long-term planning'],
            wisdom_years: ['life experience', 'sharing knowledge', 'legacy building']
        };
        
        return baseExamples[ageCategory] || baseExamples.young_adult;
    }

    extractSimpleVocabulary(topic) {
        return topic.title.split(' ').slice(0, 3).map(word => word.toLowerCase());
    }

    extractIntermediateVocabulary(topic) {
        return topic.title.split(' ').slice(0, 5).map(word => word.toLowerCase());
    }

    extractAdvancedVocabulary(topic) {
        const words = topic.title.split(' ').concat(topic.learning_objective.split(' '));
        return words.filter(word => word.length > 4).slice(0, 7);
    }

    extractProfessionalVocabulary(topic) {
        const advanced = this.extractAdvancedVocabulary(topic);
        return advanced.concat(['applications', 'systems', 'impact', 'development']);
    }

    extractWisdomVocabulary(topic) {
        const professional = this.extractProfessionalVocabulary(topic);
        return professional.concat(['wisdom', 'legacy', 'understanding', 'significance']);
    }

    // Synthesis engine methods
    async synthesizeLesson(day, age, tone, language = 'english') {
        const cacheKey = `${day}_${age}_${tone}_${language}`;
        
        if (this.synthesisCache.has(cacheKey)) {
            const cached = this.synthesisCache.get(cacheKey);
            return { ...cached, fromCache: true, synthesisTime: 1 };
        }
        
        const startTime = performance.now();
        
        try {
            const dna = this.getDNAForDay(day);
            if (!dna) {
                throw new Error(`No DNA found for day ${day}`);
            }
            
            const synthesizedContent = await this.performSynthesis(dna, age, tone, language);
            
            this.synthesisCache.set(cacheKey, synthesizedContent);
            
            const synthesisTime = performance.now() - startTime;
            
            return {
                ...synthesizedContent,
                synthesisTime,
                day,
                fromCache: false
            };
            
        } catch (error) {
            console.error(`❌ Synthesis failed for day ${day}:`, error);
            return this.getErrorFallback(day, age, tone);
        }
    }

    async performSynthesis(dna, age, tone, language) {
        const ageCategory = this.mapAgeToCategory(age);
        const ageExpression = dna.age_expressions[ageCategory];
        const toneData = dna.tone_delivery[tone];
        
        return {
            title: this.synthesizeTitle(dna, ageExpression, toneData),
            introduction: this.synthesizeIntroduction(dna, ageExpression, toneData),
            concept: this.synthesizeMainConcept(dna, ageExpression, toneData),
            examples: this.synthesizeExamples(dna, ageExpression, toneData),
            reflection: this.synthesizeReflection(dna, ageExpression, toneData),
            
            metadata: {
                dna: dna.lesson_id,
                ageCategory,
                tone,
                language,
                complexity: this.calculateComplexity(age),
                duration: this.calculateDuration(age),
                avatar: this.getAvatarInfo(tone)
            }
        };
    }

    synthesizeTitle(dna, ageExpression, toneData) {
        let title = ageExpression.concept_name || dna.title;
        
        if (toneData.voice_character.includes('fun')) {
            title += ' 🌟';
        }
        
        return title;
    }

    synthesizeIntroduction(dna, ageExpression, toneData) {
        const opening = toneData.language_patterns.openings[0] || 'Welcome!';
        const concept = ageExpression.concept_name || dna.title;
        
        return `${opening} Today we're exploring ${concept.toLowerCase()}. ${this.adaptLearningEssence(dna.learning_essence, ageExpression)}`;
    }

    synthesizeMainConcept(dna, ageExpression, toneData) {
        const principle = dna.core_principle.replace(/_/g, ' ');
        const examples = ageExpression.examples[0] || 'practical applications';
        
        return `${principle}. This connects to your life through ${examples} and helps you understand how this knowledge applies in meaningful ways.`;
    }

    synthesizeExamples(dna, ageExpression, toneData) {
        const examples = ageExpression.examples || ['real-world applications'];
        const transition = toneData.language_patterns.transitions[0] || 'Here are examples';
        
        return `${transition}: ${examples.join(', ')}. These connections help you see how this knowledge relates to your everyday experience.`;
    }

    synthesizeReflection(dna, ageExpression, toneData) {
        const closing = toneData.language_patterns.closings[0] || 'Keep learning!';
        return `How will you apply this understanding in your own life and future decisions? ${closing}`;
    }

    adaptLearningEssence(essence, ageExpression) {
        // Simplify language based on age complexity level
        if (ageExpression.complexity_level === 'concrete_observable_actions') {
            return essence.replace(/while understanding/g, 'and learn').replace(/enables/g, 'helps with');
        }
        return essence;
    }

    // UI Integration methods
    addSynthesisControls() {
        const controlsHTML = `
            <div id="synthesis-controls">
                <div class="control-group">
                    <label>Age: <span id="age-display">25</span></label>
                    <input type="range" id="age-slider" min="5" max="65" value="25">
                </div>
                <div class="control-group">
                    <label>Tone:</label>
                    <select id="tone-select">
                        <option value="grandmother">👵 Grandmother</option>
                        <option value="fun" selected>🎉 Fun</option>
                        <option value="neutral">🎓 Neutral</option>
                    </select>
                </div>
                <button id="calendar-btn">📅 Choose Day</button>
                <div class="synthesis-status" id="synthesis-status">Ready</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', controlsHTML);
    }

    addCalendarOverlay() {
        const calendarHTML = `
            <div id="calendar-overlay">
                <div class="calendar-container">
                    <div class="calendar-header">
                        <h2>Choose Your Lesson Day (1-366)</h2>
                        <button id="close-calendar">×</button>
                    </div>
                    <div id="calendar-grid"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', calendarHTML);
        this.generateCalendarGrid();
    }

    generateCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        
        let gridHTML = '<div class="calendar-days">';
        
        for (let day = 1; day <= 366; day++) {
            const topic = this.curriculumData.find(t => t.day === day);
            const title = topic ? topic.title : `Day ${day}`;
            const isSelected = day === this.currentDay;
            
            gridHTML += `
                <div class="calendar-day ${isSelected ? 'selected' : ''}" 
                     data-day="${day}" 
                     title="${title}">
                    <div class="day-number">${day}</div>
                    <div class="day-title">${title.substring(0, 20)}${title.length > 20 ? '...' : ''}</div>
                </div>
            `;
        }
        
        gridHTML += '</div>';
        grid.innerHTML = gridHTML;
    }

    setupEventListeners() {
        // Age slider
        const ageSlider = document.getElementById('age-slider');
        const ageDisplay = document.getElementById('age-display');
        
        if (ageSlider && ageDisplay) {
            ageSlider.addEventListener('input', (e) => {
                const age = parseInt(e.target.value);
                ageDisplay.textContent = age;
                this.currentParameters.age = age;
                this.debouncedSynthesis();
            });
        }
        
        // Tone selector
        const toneSelect = document.getElementById('tone-select');
        if (toneSelect) {
            toneSelect.addEventListener('change', (e) => {
                this.currentParameters.tone = e.target.value;
                this.debouncedSynthesis();
            });
        }
        
        // Calendar button
        const calendarBtn = document.getElementById('calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                document.getElementById('calendar-overlay').style.display = 'flex';
            });
        }
        
        // Close calendar
        const closeCalendar = document.getElementById('close-calendar');
        if (closeCalendar) {
            closeCalendar.addEventListener('click', () => {
                document.getElementById('calendar-overlay').style.display = 'none';
            });
        }
        
        // Calendar day selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-day')) {
                const day = parseInt(e.target.closest('.calendar-day').dataset.day);
                this.selectDay(day);
            }
        });
    }

    selectDay(day) {
        this.currentDay = day;
        document.getElementById('calendar-overlay').style.display = 'none';
        
        // Update calendar button
        const topic = this.curriculumData.find(t => t.day === day);
        const calendarBtn = document.getElementById('calendar-btn');
        if (calendarBtn && topic) {
            calendarBtn.textContent = `📅 Day ${day}: ${topic.title.substring(0, 25)}...`;
        }
        
        // Update selected day in calendar
        document.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('selected');
            if (parseInt(el.dataset.day) === day) {
                el.classList.add('selected');
            }
        });
        
        this.updateDisplay();
    }

    debouncedSynthesis() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updateDisplay();
        }, 300);
    }

    async updateDisplay() {
        const { age, tone } = this.currentParameters;
        
        try {
            document.getElementById('synthesis-status').textContent = 'Synthesizing...';
            document.getElementById('synthesis-status').classList.add('synthesizing');
            
            const lesson = await this.synthesizeLesson(this.currentDay, age, tone);
            this.displayLesson(lesson);
            
            document.getElementById('synthesis-status').textContent = `Ready (${Math.round(lesson.synthesisTime)}ms)`;
            document.getElementById('synthesis-status').classList.remove('synthesizing');
            
        } catch (error) {
            console.error('Display update failed:', error);
            document.getElementById('synthesis-status').textContent = 'Error';
            document.getElementById('synthesis-status').classList.remove('synthesizing');
        }
    }

    displayLesson(lesson) {
        // Update lesson title
        this.updateElement('lesson-title', lesson.title);
        this.updateElement('#lesson-title', lesson.title);
        this.updateElement('h1', lesson.title);
        this.updateElement('h2', lesson.title);
        
        // Update lesson content sections
        this.updateElement('#intro-text', lesson.introduction);
        this.updateElement('#concept-text', lesson.concept);
        this.updateElement('#examples-text', lesson.examples);
        this.updateElement('#reflection-text', lesson.reflection);
        
        // Update any existing content areas
        this.updateElement('.lesson-intro', lesson.introduction);
        this.updateElement('.lesson-content', lesson.concept);
        this.updateElement('.lesson-examples', lesson.examples);
        this.updateElement('.lesson-reflection', lesson.reflection);
        
        // Update metadata
        this.updateElement('#lesson-complexity', lesson.metadata.complexity);
        this.updateElement('#lesson-duration', lesson.metadata.duration);
        
        console.log(`📄 Displayed lesson for day ${lesson.day}: ${lesson.title}`);
    }

    updateElement(selector, content) {
        const element = document.querySelector(selector) || document.getElementById(selector.replace('#', ''));
        if (element && content) {
            element.textContent = content;
        }
    }

    loadTodaysLesson() {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        const todayDay = Math.min(dayOfYear, 366);
        
        this.selectDay(todayDay);
    }

    // Utility methods
    getDNAForDay(day) {
        const topic = this.curriculumData.find(t => t.day === day);
        if (!topic) return null;
        
        const dnaKey = `day_${day.toString().padStart(3, '0')}_${this.slugify(topic.title)}`;
        return this.dnaLibrary.get(dnaKey);
    }

    mapAgeToCategory(age) {
        if (age <= 8) return 'early_childhood';
        if (age <= 17) return 'youth';
        if (age <= 35) return 'young_adult';
        if (age <= 65) return 'midlife';
        return 'wisdom_years';
    }

    calculateComplexity(age) {
        if (age <= 8) return 'Beginner';
        if (age <= 17) return 'Intermediate';
        if (age <= 35) return 'Advanced';
        if (age <= 65) return 'Expert';
        return 'Master';
    }

    calculateDuration(age) {
        if (age <= 8) return '4 minutes';
        if (age <= 17) return '6 minutes';
        return '8 minutes';
    }

    getAvatarInfo(tone) {
        const avatars = {
            grandmother: { name: 'Kelly', emoji: '👵', personality: 'Wise & Caring' },
            fun: { name: 'Ken', emoji: '🎉', personality: 'Energetic & Playful' },
            neutral: { name: 'Ken', emoji: '🎓', personality: 'Clear & Educational' }
        };
        return avatars[tone] || avatars.neutral;
    }

    slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '_')
            .replace(/^-+|-+$/g, '');
    }

    getErrorFallback(day, age, tone) {
        const topic = this.curriculumData.find(t => t.day === day);
        return {
            title: topic ? topic.title : `Day ${day} Learning`,
            introduction: 'Welcome to today\'s learning experience!',
            concept: topic ? topic.learning_objective : 'Exploring important concepts today.',
            examples: 'Real-world applications and practical examples.',
            reflection: 'How will you apply this knowledge?',
            metadata: { 
                error: true, 
                day, 
                age, 
                tone,
                complexity: this.calculateComplexity(age),
                duration: this.calculateDuration(age),
                avatar: this.getAvatarInfo(tone)
            }
        };
    }

    initializeFallbackMode() {
        console.warn('⚠️ Running in fallback mode');
        this.addSynthesisControls();
        this.addCalendarOverlay();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Enterprise Synthesis Integration...');
    window.synthesisIntegration = new SynthesisEngineIntegrated();
});

// Export for external use
window.SynthesisEngineIntegrated = SynthesisEngineIntegrated;