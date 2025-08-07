import { ELEVENLABS_API_KEY } from './config.js';

class ElevenLabsIntegration {
    // ... (this part is correct and complete)
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.voices = {
            kelly: 'cJLh37pTYdhJT0Dvnttb', // User-provided voice ID
            ken: 's6JeSRcsXa6EBsc5ODOx'     // User-provided voice ID for Ken
        };
    }

    async generateAudio(text, avatar) {
        if (!this.apiKey || this.apiKey === 'your-elevenlabs-api-key') {
            console.warn('ElevenLabs API key not set. Skipping audio generation.');
            return null;
        }
        const voiceId = this.voices[avatar];
        if (!voiceId) {
            console.error(`No voice ID found for avatar: ${avatar}`);
            return null;
        }
        const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
            })
        });

        if (!response.ok) {
            console.error("ElevenLabs API Error:", await response.text());
            return null;
        }

        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
    }
}

export class UniversalLessonPlayer {
    static async create() {
        const lessonId = new URLSearchParams(window.location.search).get('lesson') || 'the-sun';
        const lessonPath = `/dna-templates/${lessonId}.json`;
        try {
            const response = await fetch(lessonPath);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const lessonData = await response.json();
            return new UniversalLessonPlayer(lessonData);
        } catch (error) {
            console.error(`Failed to load lesson '${lessonId}':`, error);
            document.body.innerHTML = `<div style="color:red; text-align:center; padding-top: 50px;">Failed to load lesson. Check console.</div>`;
            return null;
        }
    }

    constructor(lessonData) {
        this.lesson = lessonData;
        const initialAvatar = Math.random() < 0.5 ? 'kelly' : 'ken';
        this.state = { phase: 0, age: '25', tone: 'neutral', avatar: initialAvatar, expression: 'neutral' };
        this.tts = new ElevenLabsIntegration(ELEVENLABS_API_KEY);
        this.currentAudio = null;
        this.readAlongTimer = null;
        this.volume = 1.0;
        this.isPlaying = false;

        // Bind all methods to ensure 'this' context is correct
        this._initialize = this._initialize.bind(this);
        this._cacheDom = this._cacheDom.bind(this);
        this._bindEvents = this._bindEvents.bind(this);
        this.render = this.render.bind(this);
        this._getContentBlock = this._getContentBlock.bind(this);
        this.startReadAlong = this.startReadAlong.bind(this);
        this.stopReadAlong = this.stopReadAlong.bind(this);
        this._makeInspectorsDraggable = this._makeInspectorsDraggable.bind(this);

        this._initialize();
    }

    _initialize() {
        this._cacheDom();
        // Defer binding and rendering until user starts lesson
    }

    startLesson() {
        // Play a tiny, silent audio file on the first user interaction.
        // This "unlocks" the AudioContext, satisfying modern browser security policies
        // that prevent unsolicited audio playback.
        const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTG93cyBvZiBoaWdodCBiYXNlcyBvZmZlcmVkIHdpdGggYWxsIHRoZSBsaWNlbnNlcyB0aGF0IHdlIG9mZmVyLiAvICBDb250YWN0IHVzIGF0IGluZm9AYmlnc291bmRiYW5rLmNvbQAAAAJSyrbWTT+4AAAAAAD/++BwMTC8gAMP/yv96QgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
        audio.play().catch(e => console.warn("Audio context unlock failed, this may be okay on some browsers.", e));

        this.dom.startOverlay.style.display = 'none';
        this._bindEvents();
        this._makeInspectorsDraggable();
        this.render();
    }

    _cacheDom() {
        this.dom = {
            startOverlay: document.getElementById('start-overlay'),
            startLessonBtn: document.getElementById('start-lesson-btn'),
            avatarBackground: document.getElementById('avatar-background'),
            persistentQuestion: document.getElementById('persistent-question-container'),
            phases: {
                welcome: document.getElementById('welcome-phase'),
                beginning: document.getElementById('beginning-phase'),
                middle: document.getElementById('middle-phase'),
                end: document.getElementById('end-phase'),
                wisdom: document.getElementById('wisdom-phase'),
                teachingMoment: document.getElementById('teaching-moment-phase'),
            },
            content: {
                welcome: document.getElementById('welcome-content'),
                beginningChoiceA: document.getElementById('beginning-choice-a'),
                beginningChoiceB: document.getElementById('beginning-choice-b'),
                middleChoiceA: document.getElementById('middle-choice-a'),
                middleChoiceB: document.getElementById('middle-choice-b'),
                endChoiceA: document.getElementById('end-choice-a'),
                endChoiceB: document.getElementById('end-choice-b'),
                wisdom: document.getElementById('wisdom-content'),
                teachingMoment: document.getElementById('teaching-moment-content')
            },
            controls: {
                masterFlyoutContainer: document.querySelector('.master-flyout-container'),
                masterTrigger: document.getElementById('master-trigger'),
                avatarButtons: document.querySelectorAll('#avatar-controls .flyout-btn'),
                ageButtons: document.querySelectorAll('#age-controls .flyout-btn'),
                toneButtons: document.querySelectorAll('#tone-controls .flyout-btn'),
                playPause: document.getElementById('play-pause'),
                volumeUp: document.getElementById('volume-up'),
                volumeDown: document.getElementById('volume-down'),
                saveProgress: document.getElementById('save-progress'),
                loadProgress: document.getElementById('load-progress'),
            },
            progress: {
                lineFill: document.getElementById('progress-line-fill'),
                steps: document.querySelectorAll('.progress-step'),
                clickableSteps: document.querySelectorAll('.progress-label-group')
            },
            readAlongPlayer: document.getElementById('read-along-player'),
            inspectors: {
                panels: document.querySelectorAll('.inspector-panel'),
                stateToggle: document.getElementById('inspector-state-toggle'),
                contentToggle: document.getElementById('inspector-content-toggle'),
                codeToggle: document.getElementById('inspector-code-toggle'),
                statePanel: document.getElementById('state-inspector'),
                contentPanel: document.getElementById('content-inspector'),
                codePanel: document.getElementById('code-inspector'),
                stateContent: document.getElementById('state-inspector-content'),
                contentContent: document.getElementById('content-inspector-content'),
                codeContent: document.getElementById('code-inspector-content'),
                closeButtons: document.querySelectorAll('.inspector-close-btn'),
            }
        };
    }

    _bindEvents() {
        // State changes
        const handleStateChange = (newState) => {
            this.stopReadAlong();
            this.setState(newState, true); // Rerender with new state, but keep phase
        };

        this.dom.controls.masterTrigger.addEventListener('click', () => {
            this.dom.controls.masterFlyoutContainer.classList.toggle('active');
        });

        this.dom.controls.avatarButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ avatar: btn.dataset.avatar })));
        this.dom.controls.ageButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ age: btn.dataset.age })));
        this.dom.controls.toneButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ tone: btn.dataset.tone })));

        // Progress bar navigation
        this.dom.progress.clickableSteps.forEach(step => {
            step.addEventListener('click', () => {
                const phase = parseInt(step.dataset.phase, 10);
                this.stopReadAlong();
                this.setState({ phase: phase });
            });
        });

        // Media Controls
        this.dom.controls.playPause.addEventListener('click', () => this.isPlaying ? this.pauseTTS() : this.playTTS());
        this.dom.controls.volumeUp.addEventListener('click', () => this.updateVolume(this.volume + 0.1));
        this.dom.controls.volumeDown.addEventListener('click', () => this.updateVolume(this.volume - 0.1));

        // Progress Controls
        this.dom.controls.saveProgress.addEventListener('click', () => this.saveProgress());
        this.dom.controls.loadProgress.addEventListener('click', () => this.loadProgress());

        // Inspector Toggles
        const toggleInspector = (panel) => panel.classList.toggle('visible');
        this.dom.inspectors.stateToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.statePanel));
        this.dom.inspectors.contentToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.contentPanel));
        this.dom.inspectors.codeToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.codePanel));
        this.dom.inspectors.closeButtons.forEach(btn => btn.addEventListener('click', (e) => {
            e.target.closest('.inspector-panel').classList.remove('visible');
        }));
    }

    setState(newState, preservePhase = false) {
        const oldPhase = this.state.phase;
        Object.assign(this.state, newState);
        if (!preservePhase && this.state.phase !== oldPhase) {
            this.render();
        } else if (preservePhase) {
            this.render();
        }
    }

    render() {
        this._updateStaticUI();
        this._updateProgressBar();
        this._updateInspectors();

        // Hide all phases, then show the active one
        Object.values(this.dom.phases).forEach(p => p.classList.remove('active'));
        const phaseKey = Object.keys(this.dom.phases)[this.state.phase];
        if (this.dom.phases[phaseKey]) {
            this.dom.phases[phaseKey].classList.add('active');
        }

        const { block, onComplete, onChoice } = this._getContentBlock();

        if (!block) {
            console.error("No content block found for current state:", this.state);
            this.dom.persistentQuestion.textContent = 'Content not found for this state.';
            this.dom.persistentQuestion.style.visibility = 'visible';
            return;
        }

        this.setExpression(block.expression || 'neutral');

        // Render question text in persistent container
        if (this.state.phase >= 1 && this.state.phase <= 3) {
            this.dom.persistentQuestion.textContent = block.display_text;
            this.dom.persistentQuestion.style.visibility = 'visible';
            
            // Clear and render choices
            const choiceA_el = this.dom.content[`${phaseKey}ChoiceA`];
            const choiceB_el = this.dom.content[`${phaseKey}ChoiceB`];
            
            choiceA_el.textContent = block.choices.a;
            choiceB_el.textContent = block.choices.b;

            choiceA_el.onclick = () => onChoice('a');
            choiceB_el.onclick = () => onChoice('b');

        } else {
            this.dom.persistentQuestion.style.visibility = 'hidden';
            const contentEl = this.dom.content[phaseKey];
            if (contentEl) {
                contentEl.textContent = block.display_text;
            }
        }
        
        const script = block.voice_over_script || block.display_text;
        this.startReadAlong(script, onComplete);
    }
    
    _getContentBlock() {
        const { phase, age, tone } = this.state;
        let blockData, onComplete, onChoice;
        const core = this.lesson.core_lesson_structure;

        const getRobustBlock = (source) => {
            if (!source) {
                console.error("Data source for this phase is missing.");
                return null;
            }

            // Welcome and Wisdom are simpler, they don't have the age/tone nesting
            if (phase === 0 || phase === 4) {
                return source.ages[age] ? source.ages[age].tones[tone] : source;
            }

            // For questions (phases 1, 2, 3)
            let ageBlock = source.ages[age] || source.ages['25'];
            if (!ageBlock) return null;

            let toneBlock = ageBlock.tones[tone] || ageBlock.tones['neutral'];
            if (!toneBlock) return null;
            
            // Merge choices, etc. from the root of the question into the final block
            return Object.assign({}, source, toneBlock);
        };
        
        const handleChoice = (choice) => {
            this.stopReadAlong();
            const questionKey = ['question_1', 'question_2', 'question_3'][phase - 1];
            const questionSource = core[questionKey];

            // Get the specific age/tone block to find the teaching moment
            const ageBlock = questionSource.ages[age] || questionSource.ages['25'];
            const toneBlock = ageBlock.tones[tone] || ageBlock.tones['neutral'];

            const isCorrect = choice === toneBlock.correct_option;
            this.setExpression(isCorrect ? 'happy' : 'concerned');

            const teachingMomentKey = isCorrect ? 'positive_feedback' : 'gentle_correction';
            const teachingMoment = toneBlock.teaching_moments[teachingMomentKey];
            
            if (!teachingMoment) {
                console.warn("Teaching moment not found, proceeding.");
                this.setState({ phase: phase + 1 });
                return;
            }

            this.dom.content.teachingMoment.textContent = teachingMoment.display_text;
            this.dom.phases.teachingMoment.classList.add('active');
            
            const nextPhase = phase + 1;
            this.startReadAlong(teachingMoment.voice_over_script, () => {
                this.dom.phases.teachingMoment.classList.remove('active');
                this.setState({ phase: nextPhase });
            });
        };

        switch (phase) {
            case 0:
                blockData = getRobustBlock(core.welcome_message);
                onComplete = () => this.setState({ phase: 1 });
                break;
            case 1:
                blockData = getRobustBlock(core.question_1);
                onChoice = handleChoice;
                break;
            case 2:
                blockData = getRobustBlock(core.question_2);
                onChoice = handleChoice;
                break;
            case 3:
                blockData = getRobustBlock(core.question_3);
                onChoice = handleChoice;
                break;
            case 4:
                blockData = getRobustBlock(core.wisdom_summary);
                onComplete = () => console.log('Lesson Complete!');
                break;
            default:
                blockData = { display_text: "Invalid phase." };
        }

        return { block: blockData, onComplete, onChoice };
    }

    async startReadAlong(script, onComplete) {
        if (!script) {
            if (onComplete) onComplete();
            return;
        }

        this.stopReadAlong();
        const words = script.split(/\s+/);
        this.dom.readAlongPlayer.innerHTML = words.map(w => `<span>${w}</span>`).join(' ');
        const wordSpans = this.dom.readAlongPlayer.querySelectorAll('span');

        this.isPlaying = true;
        const audioUrl = await this.tts.generateAudio(script, this.state.avatar);

        if (audioUrl) {
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = this.volume;

            let wordIndex = 0;
            const highlightNextWord = () => {
                if (wordIndex > 0) wordSpans[wordIndex - 1].classList.remove('highlight');
                if (wordIndex < wordSpans.length) {
                    wordSpans[wordIndex].classList.add('highlight');
                    wordIndex++;
                }
            };
            
            this.currentAudio.addEventListener('play', () => {
                 const wordDuration = (this.currentAudio.duration * 1000) / words.length;
                 this.readAlongTimer = setInterval(highlightNextWord, wordDuration);
            });

            this.currentAudio.addEventListener('ended', () => {
                this.stopReadAlong();
                if (onComplete) onComplete();
            });

            this.currentAudio.play().catch(e => console.error("Audio play failed:", e));
        } else {
            console.warn("No audio URL, falling back to timeout for progression.");
            // Fallback if audio fails: progress after a delay based on text length
            const fallbackTime = words.length * 300; // ~200 WPM
            this.readAlongTimer = setTimeout(() => {
                if (onComplete) onComplete();
            }, fallbackTime);
        }
    }
    
    stopReadAlong() {
        clearInterval(this.readAlongTimer);
        this.readAlongTimer = null;
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.isPlaying = false;
        const highlighted = this.dom.readAlongPlayer.querySelector('.highlight');
        if (highlighted) highlighted.classList.remove('highlight');
        this.dom.readAlongPlayer.innerHTML = "";
    }

    playTTS() {
        if (this.currentAudio) {
            this.currentAudio.play();
            this.isPlaying = true;
        }
    }

    pauseTTS() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.isPlaying = false;
        }
    }

    updateVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }
    
    saveProgress() {
        localStorage.setItem('iLearnHowProgress', JSON.stringify(this.state));
        alert('Progress saved!');
    }
    
    loadProgress() {
        const savedState = localStorage.getItem('iLearnHowProgress');
        if (savedState) {
            this.stopReadAlong();
            this.setState(JSON.parse(savedState));
            alert('Progress loaded!');
        } else {
            alert('No saved progress found.');
        }
    }

    _updateStaticUI() {
        // Update Avatar
        this.dom.avatarBackground.className = `avatar-background ${this.state.avatar}`;
        this.setExpression(this.state.expression);

        // Update control buttons
        const updateBtnGroup = (buttons, dataKey) => {
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset[dataKey] === this.state[dataKey]);
            });
        };
        updateBtnGroup(this.dom.controls.avatarButtons, 'avatar');
        updateBtnGroup(this.dom.controls.ageButtons, 'age');
        updateBtnGroup(this.dom.controls.toneButtons, 'tone');
    }
    
    setExpression(expression) {
        this.state.expression = expression;
        const expressionMap = {
            neutral: 'base-states/kelly_neutral_default.png',
            happy: 'emotional-expressions/kelly_happy_celebrating.png',
            concerned: 'emotional-expressions/kelly_concerned_thinking.png',
            curious: 'lesson-sequence/kelly_question_curious.png',
            explaining: 'lesson-sequence/kelly_teaching_explaining.png',
        };
        const kenExpressionMap = {
            neutral: 'ken_neutral_default.png',
            happy: 'emotional-expressions/ken_happy_celebrating.png',
            concerned: 'emotional-expressions/ken_concerned_thinking.png',
            curious: 'lesson-sequence/ken_question_curious.png',
            explaining: 'lesson-sequence/ken_teaching_explaining.png',
        };

        const map = this.state.avatar === 'ken' ? kenExpressionMap : expressionMap;
        const subPath = map[expression] || (this.state.avatar === 'ken' ? map['neutral'] : expressionMap['neutral']);
        
        const basePath = `/production-deploy/assets/avatars/${this.state.avatar}/`;
        const isKenNeutral = this.state.avatar === 'ken' && expression === 'neutral';
        const finalPath = isKenNeutral ? `${basePath}${subPath}` : `${basePath}optimized/${subPath}`;

        const img = new Image();
        img.onload = () => {
            this.dom.avatarBackground.style.backgroundImage = `url('${finalPath}')`;
            this.dom.avatarBackground.style.backgroundColor = ''; // Remove fallback color on success
        };
        img.onerror = () => {
            console.error(`Failed to load avatar image at path: ${finalPath}`);
            this.dom.avatarBackground.style.backgroundImage = '';
            this.dom.avatarBackground.style.backgroundColor = '#e0e0e0'; // Solid color fallback
        };
        img.src = finalPath;
    }

    _updateProgressBar() {
        const phaseCount = this.dom.progress.steps.length;
        const currentPhase = this.state.phase;
        
        this.dom.progress.steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i < currentPhase) step.classList.add('completed');
            if (i === currentPhase) step.classList.add('active');
        });
        
        this.dom.progress.clickableSteps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i < currentPhase) step.classList.add('completed');
            if (i === currentPhase) step.classList.add('active');
        });

        const percentage = (currentPhase / (phaseCount - 1)) * 100;
        this.dom.progress.lineFill.style.height = `${percentage}%`;
    }
    
    _updateInspectors() {
        this.dom.inspectors.stateContent.textContent = JSON.stringify(this.state, null, 2);
        this.dom.inspectors.contentContent.textContent = JSON.stringify(this._getContentBlock().block, null, 2);
        this.dom.inspectors.codeContent.textContent = JSON.stringify(this.lesson, null, 2);
    }

    _makeInspectorsDraggable() {
        this.dom.inspectors.panels.forEach(panel => {
            const header = panel.querySelector('.inspector-header');
            if (!header) return;
            let isDragging = false, offset = { x: 0, y: 0 };
            const onMouseDown = (e) => {
                isDragging = true;
                const rect = panel.getBoundingClientRect();
                offset.x = e.clientX - rect.left;
                offset.y = e.clientY - rect.top;
                header.style.cursor = 'grabbing';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
            const onMouseMove = (e) => {
                if (isDragging) {
                    panel.style.left = `${e.clientX - offset.x}px`;
                    panel.style.top = `${e.clientY - offset.y}px`;
                }
            };
            const onMouseUp = () => {
                isDragging = false;
                header.style.cursor = 'grab';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            header.addEventListener('mousedown', onMouseDown);
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const player = await UniversalLessonPlayer.create();
    if (player) {
        player.dom.startLessonBtn.addEventListener('click', () => player.startLesson());
    }
});