import { ELEVENLABS_API_KEY } from './config.js';

class ElevenLabsIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.voices = {
            kelly: 'cJLh37pTYdhJT0Dvnttb',
            ken: 's6JeSRcsXa6EBsc5ODOx'
        };
    }

    async generateAudio(text, avatar) {
        if (!this.apiKey || this.apiKey === 'YOUR_ELEVENLABS_API_KEY') {
            console.warn('ElevenLabs API key not set. Skipping audio generation.');
            return null;
        }
        const voiceId = this.voices[avatar];
        const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': this.apiKey },
            body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1' })
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
        this._initialize();
    }

    _initialize() {
        this._cacheDom();
    }

    startLesson() {
        const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tbSA8LyBMb3dzIG9mIGhpZ2h0IGJhc2VzIG9mZmVyZWQgd2l0aCBhbGwgdGhlIGxpY2Vuc2VzIHRoYXQgd2Ugb2ZmZXIuIC8gIENvbnRhY3QgdXMgYXQgaW5mb0BiaWdzb3VuZGJhbmsuY29tAAAAAlMp5yo/AAAAAADIHAAAAA8AAAA0AAAAAP/7/8AAAAAMA4AAAAMg8DA9AMHwAAsAAAAAD/++BwMTC8gAMP/yv96QgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
        audio.play().catch(e => console.warn("Audio context unlock failed.", e));
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
        this.dom.startLessonBtn.addEventListener('click', () => this.startLesson());
        
        const handleStateChange = (newState) => {
            this.stopReadAlong();
            this.setState(newState, true);
        };

        this.dom.controls.masterTrigger.addEventListener('click', () => this.dom.controls.masterFlyoutContainer.classList.toggle('active'));
        this.dom.controls.avatarButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ avatar: btn.dataset.avatar })));
        this.dom.controls.ageButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ age: btn.dataset.age })));
        this.dom.controls.toneButtons.forEach(btn => btn.addEventListener('click', () => handleStateChange({ tone: btn.dataset.tone })));

        this.dom.progress.clickableSteps.forEach(step => {
            step.addEventListener('click', () => {
                const phase = parseInt(step.dataset.phase, 10);
                this.stopReadAlong();
                this.setState({ phase: phase });
            });
        });

        this.dom.controls.playPause.addEventListener('click', () => this.isPlaying ? this.pauseTTS() : this.playTTS());
        this.dom.controls.volumeUp.addEventListener('click', () => this.updateVolume(this.volume + 0.1));
        this.dom.controls.volumeDown.addEventListener('click', () => this.updateVolume(this.volume - 0.1));
        this.dom.controls.saveProgress.addEventListener('click', () => this.saveProgress());
        this.dom.controls.loadProgress.addEventListener('click', () => this.loadProgress());

        const toggleInspector = (panel) => panel.classList.toggle('visible');
        this.dom.inspectors.stateToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.statePanel));
        this.dom.inspectors.contentToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.contentPanel));
        this.dom.inspectors.codeToggle.addEventListener('click', () => toggleInspector(this.dom.inspectors.codePanel));
        this.dom.inspectors.closeButtons.forEach(btn => btn.addEventListener('click', (e) => e.target.closest('.inspector-panel').classList.remove('visible')));
    }

    setState(newState, preservePhase = false) {
        const oldPhase = this.state.phase;
        Object.assign(this.state, newState);
        if ((!preservePhase && this.state.phase !== oldPhase) || preservePhase) {
            this.render();
        }
    }
    
    render() {
        this._updateStaticUI();
        this._updateProgressBar();
        this._updateInspectors();

        Object.values(this.dom.phases).forEach(p => p.classList.remove('active'));
        const phaseKey = Object.keys(this.dom.phases)[this.state.phase];
        if (this.dom.phases[phaseKey]) this.dom.phases[phaseKey].classList.add('active');

        const { block, onComplete, onChoice } = this._getContentBlock();

        if (!block) {
            console.error("No content block found for current state:", this.state);
            this.dom.persistentQuestion.textContent = 'Content not found.';
            this.dom.persistentQuestion.style.visibility = 'visible';
            return;
        }

        this.setExpression(block.expression || 'neutral');

        if (this.state.phase >= 1 && this.state.phase <= 3) {
            this.dom.persistentQuestion.textContent = block.display_text;
            this.dom.persistentQuestion.style.visibility = 'visible';
            
            const choiceA_el = this.dom.content[`${phaseKey}ChoiceA`];
            const choiceB_el = this.dom.content[`${phaseKey}ChoiceB`];
            
            choiceA_el.textContent = block.choices.a.display_text;
            choiceB_el.textContent = block.choices.b.display_text;

            choiceA_el.onclick = () => onChoice('a');
            choiceB_el.onclick = () => onChoice('b');

        } else {
            this.dom.persistentQuestion.style.visibility = 'hidden';
            const contentEl = this.dom.content[phaseKey];
            if (contentEl) contentEl.textContent = block.display_text;
        }
        
        const script = block.voice_over_script || block.display_text;
        this.startReadAlong(script, onComplete);
    }
    
    _getContentBlock() {
        const { phase, age, tone } = this.state;
        const core = this.lesson.core_lesson_structure;
        let source, onComplete, onChoice;

        switch (phase) {
            case 0: source = this.lesson.age_expressions[age].concept_name[tone]; onComplete = () => this.setState({ phase: 1 }); break;
            case 1: source = core.question_1; break;
            case 2: source = core.question_2; break;
            case 3: source = core.question_3; break;
            case 4: source = this.lesson.wisdom_phase_content.fortune[tone]; onComplete = () => console.log('Lesson Complete!'); break;
            default: return { block: null };
        }

        if (!source) {
            console.error(`[Data Error] No source data for phase ${phase}.`);
            return { block: null };
        }
        
        let finalBlock;
        if (phase >= 1 && phase <= 3) {
            const ageBlock = source.ages[age] || source.ages['25'];
            const toneBlock = ageBlock.question[tone] || ageBlock.question['neutral'];
            const teachingMoments = ageBlock.teaching_moments;
            
            finalBlock = {
                ...toneBlock,
                choices: { a: ageBlock.option_a, b: ageBlock.option_b },
                correct_option: ageBlock.correct_option || 'b', // Defaulting for safety
                teaching_moments: {
                    positive_feedback: teachingMoments.option_b_response,
                    gentle_correction: teachingMoments.option_a_response
                }
            };
        } else {
            finalBlock = source;
        }

        const handleChoice = (choice) => {
            this.stopReadAlong();
            const isCorrect = choice === finalBlock.correct_option;
            this.setExpression(isCorrect ? 'happy' : 'concerned');
            const moment = isCorrect ? finalBlock.teaching_moments.positive_feedback : finalBlock.teaching_moments.gentle_correction;
            this.dom.content.teachingMoment.textContent = moment.display_text;
            this.dom.phases.teachingMoment.classList.add('active');
            this.startReadAlong(moment.voice_over_script, () => {
                this.dom.phases.teachingMoment.classList.remove('active');
                this.setState({ phase: phase + 1 });
            });
        };
        
        if (phase >=1 && phase <= 3) onChoice = handleChoice;

        return { block: finalBlock, onComplete, onChoice };
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
            
            this.currentAudio.addEventListener('loadedmetadata', () => {
                const duration = this.currentAudio.duration;
                if(isFinite(duration)) {
                    const wordDuration = (duration * 1000) / words.length;
                    let i = 0;
                    this.readAlongTimer = setInterval(() => {
                        if (i < wordSpans.length) {
                            if(i > 0) wordSpans[i-1].classList.remove('highlight');
                            wordSpans[i].classList.add('highlight');
                            i++;
                        } else {
                            this.stopReadAlong();
                        }
                    }, wordDuration);
                }
            });

            this.currentAudio.addEventListener('ended', () => {
                this.stopReadAlong();
                if (onComplete) onComplete();
            });

            this.currentAudio.play().catch(e => console.error("Audio play failed:", e));
        } else {
            console.warn("No audio URL, falling back to timeout.");
            this.readAlongTimer = setTimeout(() => {
                if (onComplete) onComplete();
            }, words.length * 300);
        }
    }
    
    stopReadAlong() {
        clearInterval(this.readAlongTimer);
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.isPlaying = false;
        const highlighted = this.dom.readAlongPlayer.querySelector('.highlight');
        if (highlighted) highlighted.classList.remove('highlight');
        this.dom.readAlongPlayer.innerHTML = "";
    }

    playTTS() { if (this.currentAudio) { this.currentAudio.play(); this.isPlaying = true; } }
    pauseTTS() { if (this.currentAudio) { this.currentAudio.pause(); this.isPlaying = false; } }
    updateVolume(level) { this.volume = Math.max(0, Math.min(1, level)); if (this.currentAudio) this.currentAudio.volume = this.volume; }
    
    saveProgress() { localStorage.setItem('iLearnHowProgress', JSON.stringify(this.state)); alert('Progress saved!'); }
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
        this.dom.avatarBackground.className = `avatar-background ${this.state.avatar}`;
        this.setExpression(this.state.expression);
        const updateBtnGroup = (buttons, dataKey) => buttons.forEach(btn => btn.classList.toggle('active', btn.dataset[dataKey] === this.state[dataKey]));
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
        const subPath = map[expression] || map['neutral'];
        
        const basePath = `/production-deploy/assets/avatars/${this.state.avatar}/`;
        const isKenNeutral = this.state.avatar === 'ken' && expression === 'neutral';
        const finalPath = isKenNeutral ? `${basePath}${subPath}` : `${basePath}optimized/${subPath}`;

        const img = new Image();
        img.onload = () => { this.dom.avatarBackground.style.backgroundImage = `url('${finalPath}')`; this.dom.avatarBackground.style.backgroundColor = ''; };
        img.onerror = () => { console.error(`Failed to load avatar image: ${finalPath}`); this.dom.avatarBackground.style.backgroundColor = '#e0e0e0'; };
        img.src = finalPath;
    }

    _updateProgressBar() {
        const phaseCount = this.dom.progress.steps.length;
        const currentPhase = this.state.phase;
        this.dom.progress.steps.forEach((step, i) => { step.classList.toggle('completed', i < currentPhase); step.classList.toggle('active', i === currentPhase); });
        this.dom.progress.clickableSteps.forEach((step, i) => { step.classList.toggle('completed', i < currentPhase); step.classList.toggle('active', i === currentPhase); });
        this.dom.progress.lineFill.style.height = `${(currentPhase / (phaseCount - 1)) * 100}%`;
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
                offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
