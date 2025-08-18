/**
 * Universal Lesson Player for iLearnHow
 * Handles 366 daily lessons with 5 phases, 10 age groups, 3 tones, 12 languages, 2 avatars
 * Generates 3x3x3x3 variants (81 variants per lesson)
 * Universal learning for humanity
 */

class UniversalLessonPlayer {
    constructor() {
        // Universal scope configuration
        this.lessonPhases = ['welcome', 'beginning', 'middle', 'end', 'wisdom'];
        this.ageGroups = ['age_2', 'age_5', 'age_8', 'age_12', 'age_16', 'age_25', 'age_40', 'age_60', 'age_80', 'age_102'];
        this.tones = ['grandmother', 'fun', 'neutral'];
        this.languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'portuguese', 'italian', 'russian', 'arabic', 'hindi', 'korean'];
        this.avatars = ['kelly', 'ken'];
        
        // Current state
        this.currentPhase = 0;
        this.currentLesson = null;
        this.currentDNA = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.playbackSpeed = 1;
        this.volume = 0.5;
        this.autoplay = false;
        // Talking-head video preference (SadTalker integration seam)
        this.talkingHeadEnabled = true;
        // Prefer using muxed video audio when available in high-quality mode
        this.useVideoAudioPreferred = false;
        // Cache for avatar+textHash -> videoUrl
        this.talkingHeadCache = new Map();
        // Live 3D avatar (viseme rig) preference
        this.liveAvatarEnabled = false;
        // Full-frame viseme mode swaps entire 16:9 background per viseme when assets exist
        // Default ON (can be disabled via localStorage 'fullframe_visemes' = '0')
        try {
            const stored = localStorage.getItem('fullframe_visemes');
            this.fullFrameVisemesEnabled = (stored === null) ? true : (stored === '1' || stored === 'true');
        } catch { this.fullFrameVisemesEnabled = true; }
        // Viseme mapping
        this.VISEMES = ['REST','MBP','FV','TH','DNTL','KG','S','WQ','R','A','E','I'];
        this.PHONEME_TO_VISEME = {
            'SIL':'REST','SP':'REST','PAU':'REST',
            'P':'MBP','B':'MBP','M':'MBP',
            'F':'FV','V':'FV',
            'TH':'TH','DH':'TH',
            'T':'DNTL','D':'DNTL','N':'DNTL','L':'DNTL',
            'K':'KG','G':'KG','NG':'KG',
            'S':'S','Z':'S','SH':'S','ZH':'S','CH':'S','JH':'S',
            'R':'R','ER':'R',
            'W':'WQ','OW':'WQ','OY':'WQ','AW':'WQ','UH':'WQ','UW':'WQ',
            'AA':'A','AE':'A','AH':'A','AO':'A',
            'EH':'E','EY':'E','AY':'E',
            'IH':'I','IY':'I','Y':'I',
            'HH':'REST','UX':'WQ','AX':'A','AXR':'R'
        };
        
        // Audio system
        this.audioElement = null;
        this.elevenLabs = null;
        // Pre-synthesized audio cache (text -> blob URL)
        this.preSynthCache = new Map();
        // Finite State Machine minimal state
        this._fsm = { state: 'idle' }; // idle | welcome | question | teaching_moment | wisdom | complete
        // Choice gating controller for question phases
        this._choiceGate = null; // { enabled:boolean, minDelayMs:number, audioThreshold:number, startTs:number }
        
        // Variant system
        this.currentVariant = {
            age: 'age_25',
            tone: 'neutral',
            language: 'english',
            avatar: 'kelly'
        };
        
        // Calendar system
        this.currentYear = 2025;
        this.currentDay = this.getCurrentDayOfYear();
        this.selectedDay = this.currentDay;
        
        // Flask integration
        this.useFlaskProgress = false;
        this.flaskIntegration = null;
        
        // Initialize universal systems
        this.initializeUniversalPlayer();
        this.setupEventListeners();
        this.loadUniversalCurriculum();
    }

    /**
     * Return phase object from current PhaseDNA v1 by id
     */
    getPhaseDataFromDNA(phaseId) {
        try {
            if (!this.currentDNA || this.currentDNA?.metadata?.version !== 'phase_v1') return null;
            return (this.currentDNA.phases || []).find(p => p.id === phaseId) || null;
        } catch { return null; }
    }

    /**
     * Evaluate current DNA for structure completeness and question A/B presence.
     * Returns an object suitable for logging or UI summary.
     */
    evaluateCurrentDNA() {
        const summary = { lessonId: this.currentDNA?.lesson_metadata?.lesson_id || this.currentDNA?.metadata?.lessonId || 'unknown', warnings: [], phases: {} };
        try {
            summary.warnings = this.validatePhaseDNA(this.currentDNA) || [];
            const ids = ['welcome','beginning','middle','end','wisdom'];
            ids.forEach(id => {
                const p = this.getPhaseDataFromDNA(id) || {};
                const q = p.question || {};
                const choices = Array.isArray(q.choices) ? q.choices : [];
                const a = choices.find(c=>c.id==='a');
                const b = choices.find(c=>c.id==='b');
                summary.phases[id] = {
                    hasVO: !!(p.narration && p.narration.voiceOver),
                    hasOnNoChoice: !!(p.narration && p.narration.onNoChoice),
                    hasQuestion: !!q.text,
                    hasA: !!a && !!a.text,
                    hasB: !!b && !!b.text,
                    hasTM: !!(q.teachingMoments && (q.teachingMoments.a || q.teachingMoments.b)),
                    correct: q.correct || null
                };
            });
        } catch (e) { summary.warnings.push('evaluator_error'); }
        return summary;
    }

    /** Map phase id to legacy content labels for renderer compatibility */
    mapPhaseForContent(phase) {
        try {
            const direct = ['welcome','beginning','middle','end','wisdom'];
            if (direct.includes(phase)) return phase;
            const alias = {
                opening: 'welcome',
                question_1: 'beginning',
                question_2: 'middle',
                question_3: 'end',
                closing: 'wisdom',
                fortune: 'wisdom'
            };
            return alias[phase] || phase;
        } catch { return phase; }
    }

    runPhaseFromDNA(phaseId) {
        const dna = this.currentDNA;
        const phase = dna?.phases?.find(p => p.id === phaseId);
        if (!phase) { console.warn('No PhaseDNA for', phaseId); return; }

        // Speak narration
        const vo = phase?.narration?.voiceOver || '';
        if (vo) this.speak(vo, this.currentVariant.avatar);

        // Apply avatar cue at start
        try {
            const startCue = phase?.avatar?.cues?.find(c => c.at === 'start');
            if (startCue?.expression) this.updateAvatar(this.currentVariant.avatar, startCue.expression);
        } catch {}

        // Structured render into universal overlay containers
        const lessonContentOverlay = document.getElementById('lesson-content-overlay');
        const lessonContent = document.getElementById('lesson-content');
        const lessonText = document.getElementById('lesson-text');
        const phaseLabelEl = document.querySelector('#lesson-content .current-phase-label');
        const qSection = document.querySelector('#lesson-content .question-content');
        const qChoices = document.querySelector('#lesson-content .choices-container');
        const qLabel = document.querySelector('#lesson-content .question-label');
        const feedback = document.querySelector('#lesson-content .choice-feedback');
        if (lessonContentOverlay) lessonContentOverlay.style.display = 'block';
        if (lessonContent) lessonContent.style.display = 'block';
        if (lessonText) {
          const lips = [
            'lipsum lorum glossa morum — elara niven torum. velar umbra seri lumen. lipsum lorum glossa morum — elara niven torum.',
            'lorum ipsen varca miri — selan orum caden. glossa morum — elara niven torum. arcus verum nora.',
            'morum elara niven torum — vox lumen terra. lipsum lorum glossa morum — elara niven torum.',
            'the sun\'s light illuminates everything equally, a metaphor for… (placeholder) repeated for testing.',
            'wisdom: carry brightness; share warmth. lipsum lorum glossa morum — elara niven torum.'
          ];
          lessonText.textContent = lips[this._slideIndex||0] || lips[0];
        }
        if (feedback) { feedback.classList.add('hidden'); feedback.innerHTML = ''; }
        if (phaseLabelEl) {
            const labels = { welcome:'Welcome', beginning:'Beginning', middle:'Middle', end:'End', wisdom:'Wisdom' };
            phaseLabelEl.textContent = labels[phaseId] || phaseId;
        }

        const appendNode = (html) => { if (lessonText) lessonText.innerHTML += html; };
        const showUnits = (units=[]) => {
            units.forEach(u => {
                if (u.type === 'text') appendNode(`<div class=\"content-text\">${u.text||''}</div>`);
                if (u.type === 'fortune') appendNode(`<div class=\"content-text\"><strong>${u.text||''}</strong></div>`);
                if (u.type === 'hint') appendNode(`<div class=\"content-text\" style=\"opacity:.9;\">${u.text||''}</div>`);
            });
        };

        try {
            const startStep = phase?.screen?.steps?.filter(s => s.at === 'start');
            startStep?.forEach(s => showUnits(s.show || []));
        } catch {}

        // Question rendering
        if (['beginning','middle','end'].includes(phaseId)) {
            try {
                if (qSection) qSection.classList.remove('hidden');
                if (qLabel) qLabel.textContent = phase?.question?.text || '';
                if (qChoices) {
                    qChoices.innerHTML = '';
                    const aText = phase?.question?.choices?.find(c=>c.id==='a')?.text || '';
                    const bText = phase?.question?.choices?.find(c=>c.id==='b')?.text || '';
                    const mk = (id, txt) => { const btn = document.createElement('button'); btn.className = `choice-btn choice-${id}`; btn.dataset.choice = id; btn.textContent = txt; btn.addEventListener('click', ()=> this.onPhaseChoice(phaseId, phase, id)); return btn; };
                    qChoices.appendChild(mk('a', aText));
                    qChoices.appendChild(mk('b', bText));
                }
            } catch {}
            this.questionAnswered = false;
            const t = phase?.timing; const ms = Math.max(6000, (t?.maxWait || 12) * 1000);
            clearTimeout(this.phaseTimers.noChoice);
            this.phaseTimers.noChoice = setTimeout(() => {
                if (!this.questionAnswered) this.onPhaseNoChoice(phaseId, phase);
            }, ms);
        } else {
            if (qSection) qSection.classList.add('hidden');
        }

        // Auto-advance after a generic duration for non-questions
        if (!['beginning','middle','end'].includes(phaseId)) {
            const dur = Math.max(6000, (phase?.timing?.minListen || 6) * 1000);
            setTimeout(() => this.nextPhase(), dur);
        }
    }

    onPhaseChoice(phaseId, phase, choiceId) {
        this.questionAnswered = true; clearTimeout(this.phaseTimers.noChoice);
        const correctId = phase?.question?.correct || 'b';
        const correct = String(choiceId).toLowerCase() === String(correctId).toLowerCase();
        const tm = phase?.question?.teachingMoments || {};
        const msg = correct ? (tm[correctId] || '') : (tm[choiceId] || 'Great thinking!');
        this.updateAvatar(this.currentVariant.avatar, correct ? 'happy_celebrating' : 'concerned_thinking');
        this.speak(msg, this.currentVariant.avatar);

        // Structured feedback in overlay
        try {
            const feedback = document.querySelector('#lesson-content .choice-feedback');
            if (feedback) {
                feedback.innerHTML = `<div class=\"feedback-message\">${msg}</div>`;
                feedback.classList.remove('hidden');
            }
        } catch {}

        const after = Math.max(1500, (phase?.timing?.autoAdvanceAfterFeedback || 3) * 1000);
        setTimeout(() => this.nextPhase(), after);
    }

    onPhaseNoChoice(phaseId, phase) {
        if (this.questionAnswered) return;
        const vo = phase?.narration?.onNoChoice || 'Let me point you to the key detail here.';
        this.speak(vo, this.currentVariant.avatar);
        const correctId = phase?.question?.correct || 'b';
        this.onPhaseChoice(phaseId, phase, correctId);
    }

    /**
     * Initialize universal lesson player
     */
    initializeUniversalPlayer() {
        console.log('🌍 Initializing Universal Lesson Player for Humanity...');
        
        // Initialize audio system
        this.audioElement = new Audio();
        this.setupAudioEvents();
        this.setVolume(this.volume);
        
        // Prefer homegrown TTS; allow ElevenLabs only when explicitly enabled (?useELEVEN=1)
        try {
            const u = new URL(window.location.href);
            const allowEleven = u.searchParams.get('useELEVEN') === '1';
            if (allowEleven && typeof ElevenLabsIntegration !== 'undefined') {
                this.elevenLabs = new ElevenLabsIntegration();
                console.log('✅ ElevenLabs integration ready (explicit)');
            }
        } catch {}
        
        // Initialize Flask integration
        if (window.flaskIntegration) {
            this.flaskIntegration = window.flaskIntegration;
            this.useFlaskProgress = true;
            console.log('✅ Flask integration ready');
        }
        
        // Reference to optional avatar video element for talking-head
        try { this.avatarVideoEl = document.getElementById('avatar-video'); } catch {}
        // Real-time rig scene members
        this._three = { renderer:null, scene:null, camera:null, mesh:null, morphDict:null, morphInf:null, leftEye:null, rightEye:null, headBone:null };
        // 2D live compositing rig (mouth/eyes patches)
        this._live2D = { rig:null, images:{}, canvas:null, ctx:null, bbox:null, imgInfo:null, raf:null };

        // Load persisted variant preferences
        this.loadPreferencesFromStorage();

        // Quality mode via URL (?hq=1 or ?quality=1)
        try {
            const u = new URL(window.location.href);
            const hq = (u.searchParams.get('hq') === '1') || (u.searchParams.get('quality') === '1');
            if (hq) { this.talkingHeadEnabled = true; this.useVideoAudioPreferred = true; }
            const uva = u.searchParams.get('useVideoAudio');
            if (uva === '1') this.useVideoAudioPreferred = true;
            if (uva === '0') this.useVideoAudioPreferred = false;
        } catch {}

        // IMMEDIATELY show avatar first (core product experience)
        try { this.ensureAvatarVisible(); } catch {}
        
        console.log('✅ Universal Lesson Player initialized');

        // Read-along setup
        this.readAlong = {
            el: document.getElementById('read-along-player'),
            timer: null,
            words: [],
            index: 0,
            paused: false,
            spans: []
        };

        // Interactive pacing helpers
        this.phaseTimers = { noChoice: null };
        this.questionAnswered = false;

        // Inspectors auto-refresh
        try { if (this.inspectorTimer) clearInterval(this.inspectorTimer); } catch {}
        this.inspectorTimer = setInterval(() => this.updateInspectors(), 500);

        // Enable draggable inspectors (no-op if headers not present)
        this._makeInspectorsDraggable();

        // Autorun override via URL param (?autorun=1|0|true|false)
        try {
            const url = new URL(window.location.href);
            const p = url.searchParams.get('autorun');
            if (p !== null) {
                this.autoplay = (p === '1' || p === 'true');
                console.log(`⚙️ Autorun param detected → autoplay=${this.autoplay}`);
            }
            const live = url.searchParams.get('live');
            if (live === '1') this.setLiveAvatarEnabled(true);
        } catch {}
    }

    /**
     * Enable/disable enhanced talking-head video (SadTalker). Persist preference.
     */
    setTalkingHeadEnabled(enabled) {
        try {
            this.talkingHeadEnabled = !!enabled;
            localStorage.setItem('enhanced_video', this.talkingHeadEnabled ? '1' : '0');
            if (!this.talkingHeadEnabled) this._hideAvatarVideo();
        } catch {}
    }

    /** Enable/disable real-time 3D avatar rig */
    setLiveAvatarEnabled(enabled) {
        try {
            this.liveAvatarEnabled = !!enabled;
            localStorage.setItem('live_avatar', this.liveAvatarEnabled ? '1' : '0');
            if (this.liveAvatarEnabled) {
                // Quality-first: disable video path when live rig is on
                this.setTalkingHeadEnabled(false);
                this._ensureThreeRig();
            } else {
                this._teardownThreeRig();
            }
        } catch {}
    }

    /** Enable/disable full-frame viseme swapping */
    setFullFrameVisemesEnabled(enabled){
        try{
            this.fullFrameVisemesEnabled = !!enabled;
            localStorage.setItem('fullframe_visemes', this.fullFrameVisemesEnabled ? '1' : '0');
            // Preload assets if turning on
            if (this.fullFrameVisemesEnabled) this._ensureLive2DCompositor();
        }catch{}
    }

    /** Initialize Three.js rig if not present */
    _ensureThreeRig() {
        try {
            if (!window.THREE || !window.THREE.GLTFLoader) return;
            const cont = document.getElementById('avatar-container'); if (!cont) return;
            if (!this._three.renderer) {
                const r = new THREE.WebGLRenderer({ antialias:true, alpha:true });
                r.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
                r.setSize(cont.clientWidth, cont.clientHeight);
                cont.appendChild(r.domElement);
                const s = new THREE.Scene();
                const c = new THREE.PerspectiveCamera(28, cont.clientWidth/cont.clientHeight, 0.1, 100);
                c.position.set(0,1.4,3.2);
                const key = new THREE.DirectionalLight(0xffffff,1.1); key.position.set(2,3,2);
                const fill = new THREE.DirectionalLight(0xffffff,0.6); fill.position.set(-2,2,1);
                const rim = new THREE.DirectionalLight(0xffffff,0.4); rim.position.set(0,2,-2);
                const amb = new THREE.AmbientLight(0xffffff,0.25);
                s.add(key,fill,rim,amb);
                this._three.renderer = r; this._three.scene = s; this._three.camera = c;
                window.addEventListener('resize', ()=>{ try { const w=cont.clientWidth,h=cont.clientHeight; r.setSize(w,h); c.aspect=w/h; c.updateProjectionMatrix(); } catch{} });
            }
            if (!this._three.mesh) {
                const loader = new THREE.GLTFLoader();
                const avatar = this.currentVariant.avatar || 'kelly';
                const path = (avatar==='ken') ? '/assets/avatars3d/ken.glb' : '/assets/avatars3d/kelly.glb';
                loader.load(path, (gltf)=>{
                    this._three.scene.add(gltf.scene);
                    gltf.scene.traverse((o)=>{
                        if (o.isSkinnedMesh && o.morphTargetDictionary && o.morphTargetInfluences){ this._three.mesh=o; this._three.morphDict=o.morphTargetDictionary; this._three.morphInf=o.morphTargetInfluences; }
                        if (o.isBone){ const n=o.name.toLowerCase(); if (n.includes('eye_l')) this._three.leftEye=o; if(n.includes('eye_r')) this._three.rightEye=o; if(n.includes('head')) this._three.headBone=o; }
                    });
                });
                const loop = ()=>{
                    if (!this.liveAvatarEnabled) return;
                    requestAnimationFrame(loop);
                    this._driveThreeRigFrame();
                };
                requestAnimationFrame(loop);
            }
        } catch {}
    }

    _teardownThreeRig(){
        try {
            const r = this._three.renderer; if (r && r.domElement && r.domElement.parentNode) r.domElement.parentNode.removeChild(r.domElement);
            this._three = { renderer:null, scene:null, camera:null, mesh:null, morphDict:null, morphInf:null, leftEye:null, rightEye:null, headBone:null };
        } catch {}
    }

    _driveThreeRigFrame(){
        try {
            const t = (this.audioElement && !isNaN(this.audioElement.currentTime)) ? this.audioElement.currentTime : 0;
            const curves = window.__avatar_curves__ || null; // Optional precomputed visemes; otherwise procedural
            const m = this._three.mesh, dict = this._three.morphDict, inf = this._three.morphInf; if (m && dict && inf) {
                // Helper: resolve internal viseme name to morph index using common synonyms (ARKit/VRM/viseme_* conventions)
                const resolveIdx = (targetName)=>{
                    if (!dict) return undefined;
                    if (dict[targetName] !== undefined) return dict[targetName];
                    const map = {
                        'MBP': ['viseme_PBM','mouthClose','mouthPressLeft','mouthPressRight'],
                        'FV': ['viseme_FV','mouthFunnel','mouthNarrow'],
                        'TH': ['viseme_TH','tongueOut'],
                        'DNTL': ['viseme_DD','jawOpen','jawForward'],
                        'KG': ['viseme_kk','viseme_k','mouthNarrow'],
                        'S': ['viseme_SS','mouthStretch','mouthDimpleLeft','mouthDimpleRight'],
                        'WQ': ['viseme_WQ','mouthFunnel','mouthPucker'],
                        'R': ['viseme_RR','mouthShrugUpper'],
                        'A': ['A','a','aa','viseme_aa','vrc.v_a','jawOpen'],
                        'E': ['E','e','eh','viseme_E','vrc.v_e','mouthNarrow'],
                        'I': ['I','i','ih','viseme_I','vrc.v_i','mouthSmile']
                    };
                    const cands = map[targetName] || [];
                    for (const key of cands){ if (dict[key] !== undefined) return dict[key]; }
                    return undefined;
                };
                for (let i=0; i<inf.length; i++) inf[i]=0;
                if (curves?.tracks?.visemes) {
                    const sample1D = (track, tt)=>{ if(!track||!track.length) return 0; if(tt<=track[0].t) return track[0].v; const last=track[track.length-1]; if(tt>=last.t) return last.v; let lo=0,hi=track.length-1; while(hi-lo>1){ const mid=(lo+hi)>>1; (track[mid].t<=tt)?lo=mid:hi=mid; } const A=track[lo],B=track[hi]; const u=(tt-A.t)/Math.max(1e-6,(B.t-A.t)); return A.v*(1-u)+B.v*u; };
                    let total=0;
                    for (const name of Object.keys(curves.tracks.visemes)){
                        const idx = (dict[name] !== undefined) ? dict[name] : resolveIdx(name);
                        if (idx===undefined) continue;
                        const w = sample1D(curves.tracks.visemes[name], t);
                        inf[idx] = Math.min(0.85, w); total += inf[idx];
                    }
                    if (total > 1.25) { const scale = 1.25/total; for (let i=0;i<inf.length;i++) inf[i]*=scale; }
                }
            }
            const L = this._three.leftEye, R = this._three.rightEye, H = this._three.headBone;
            if (L && R){ const yaw = Math.sin(t*0.7)*0.05, pitch = Math.cos(t*0.6)*0.03; L.rotation.y=R.rotation.y=yaw; L.rotation.x=R.rotation.x= -pitch; }
            if (H){ H.rotation.y = Math.sin(t*0.5)*0.03; H.rotation.x = Math.cos(t*0.42)*0.02; }
            if (this._three.renderer && this._three.scene && this._three.camera){ this._three.renderer.render(this._three.scene, this._three.camera); }
        } catch {}
    }

    /**
     * Make inspector panels draggable by their headers
     */
    _makeInspectorsDraggable() {
        try {
            const panels = document.querySelectorAll('.inspector-panel');
            panels.forEach(panel => {
                const header = panel.querySelector('.inspector-header');
                if (!header) return;
                let isDragging = false;
                let startX = 0, startY = 0, startLeft = 0, startTop = 0;
                const onMouseDown = (e) => {
                    isDragging = true;
                    startX = e.clientX; startY = e.clientY;
                    const rect = panel.getBoundingClientRect();
                    startLeft = rect.left; startTop = rect.top;
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                };
                const onMouseMove = (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    panel.style.left = `${Math.max(0, startLeft + dx)}px`;
                    panel.style.top = `${Math.max(0, startTop + dy)}px`;
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                    panel.style.position = 'absolute';
                };
                const onMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                header.addEventListener('mousedown', onMouseDown);
            });
        } catch {}
    }

    /**
     * Load user variant preferences from localStorage
     */
    loadPreferencesFromStorage() {
        try {
            const avatar = localStorage.getItem('variant_avatar');
            const tone = localStorage.getItem('variant_tone');
            const language = localStorage.getItem('variant_language');
            const age = localStorage.getItem('variant_age');
            const enh = localStorage.getItem('enhanced_video');
            if (avatar) this.currentVariant.avatar = avatar;
            if (tone) this.currentVariant.tone = tone;
            if (language) this.currentVariant.language = language;
            if (age) this.currentVariant.age = age;
            if (enh !== null) this.talkingHeadEnabled = (enh === '1' || enh === 'true');
        } catch {}
    }

    /**
     * Ensure avatar is always visible - CORE PRODUCT EXPERIENCE
     */
    ensureAvatarVisible() {
        console.log('🎭 Ensuring avatar is visible...');
        
        const avatarContainer = document.getElementById('avatar-container');
        if (!avatarContainer) {
            console.error('❌ Avatar container not found');
            return;
        }
        
        // Force avatar to be visible and prominent
        avatarContainer.style.display = 'block';
        avatarContainer.style.visibility = 'visible';
        avatarContainer.style.opacity = '1';
        avatarContainer.style.zIndex = '1';
        
        // Set default avatar (Kelly) immediately
        this.updateAvatar('kelly', 'neutral_default');
        this.preloadAvatarAssets('kelly');
        
        console.log('✅ Avatar visibility ensured');
    }

    /**
     * Load universal curriculum (366 days)
     */
    async loadUniversalCurriculum() {
        console.log('📚 Loading universal curriculum for 366 days...');
        
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        try {
            this.universalCurriculum = {};
            
            for (const month of months) {
                const response = await fetch(`data/${month}_curriculum.json`);
                if (response.ok) {
                    this.universalCurriculum[month] = await response.json();
                    console.log(`✅ Loaded ${month} curriculum`);
                } else {
                    console.error(`❌ Failed to load ${month} curriculum`);
                }
            }
            
            console.log('✅ Universal curriculum loaded');
            this.generateUniversalCalendar();
            this.loadCurrentLesson();
            
        } catch (error) {
            console.error('❌ Error loading universal curriculum:', error);
            this.showError('Failed to load universal curriculum');
        }
    }

    /**
     * Generate universal calendar for all 366 days
     */
    generateUniversalCalendar() {
        console.log('📅 Generating universal calendar for 366 days...');
        
        const calendarContainer = document.getElementById('calendar-overlay');
        const calendarGrid = document.getElementById('calendar-grid');
        
        if (!calendarGrid) {
            console.error('❌ Calendar grid not found');
            return;
        }
        
        // Clear existing calendar
        calendarGrid.innerHTML = '';
        
        // Create month navigation
        const monthNavigation = document.createElement('div');
        monthNavigation.className = 'month-navigation';
        monthNavigation.innerHTML = `
            <button onclick="lessonPlayer.previousMonth()">◀</button>
            <span id="current-month">January</span>
            <button onclick="lessonPlayer.nextMonth()">▶</button>
        `;
        calendarContainer.insertBefore(monthNavigation, calendarGrid);
        
        // Generate current month calendar
        this.generateMonthCalendar(this.getCurrentMonth());
    }

    /**
     * Generate calendar for specific month
     */
    generateMonthCalendar(month) {
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthElement = document.getElementById('current-month');
        
        if (!calendarGrid) return;
        
        // Update month display
        if (currentMonthElement) {
            currentMonthElement.textContent = this.getMonthName(month);
        }
        
        // Clear grid
        calendarGrid.innerHTML = '';
        
        // Get days in month
        const daysInMonth = this.getDaysInMonth(month);
        
        // Generate day buttons
        for (let day = 1; day <= daysInMonth; day++) {
            const dayOfYear = this.getDayOfYear(month, day);
            const isToday = dayOfYear === this.currentDay;
            const isSelected = dayOfYear === this.selectedDay;
            
            const dayButton = document.createElement('button');
            dayButton.className = 'calendar-day';
            dayButton.textContent = day;
            
            if (isToday) dayButton.classList.add('today');
            if (isSelected) dayButton.classList.add('selected');
            if (dayOfYear <= 366) dayButton.classList.add('available');
            
            dayButton.onclick = () => this.selectDay(dayOfYear);
            calendarGrid.appendChild(dayButton);
        }
    }

    /**
     * Load lesson for specific day
     */
    async loadLessonByDay(day) {
        console.log(`📚 Loading lesson for day ${day}...`);
        
        try {
            // Get lesson data from curriculum
            const lessonData = this.getLessonDataForDay(day);
            if (!lessonData) {
                throw new Error(`No lesson data for day ${day}`);
            }
            
            // Load DNA data if available
            await this.loadDNALesson(day);
            
            // Set current lesson
            this.currentLesson = lessonData;
            this.selectedDay = day;
            
            // Update display
            this.updateLessonInfo(lessonData);
            this.updateCalendarSelection(day);
            
            console.log(`✅ Lesson loaded for day ${day}: ${lessonData.title}`);
            try { window.dispatchEvent(new CustomEvent('ml:lesson_loaded', { detail: { day } })); } catch {}
            
        } catch (error) {
            console.error(`❌ Failed to load lesson for day ${day}:`, error);
            this.showError(`Failed to load lesson for day ${day}`);
        }
    }

    /**
     * Load DNA lesson data
     */
    async loadDNALesson(day) {
        try {
            // Prefer app-provided DNA resolver (can return PhaseDNA v1)
            if (typeof window.getDNALessonData === 'function') {
                const dna = await window.getDNALessonData(day);
                if (dna) {
                    this.currentDNA = dna;
                    console.log(`✅ DNA (app resolver) loaded for day ${day}`);
                    // Validate PhaseDNA if applicable
                    this.dnaWarnings = this.validatePhaseDNA(this.currentDNA);
                    if (this.dnaWarnings?.length) {
                        console.warn('⚠️ PhaseDNA warnings:', this.dnaWarnings);
                    }
                    // Prewarm first narration for low-latency playback
                    this.prewarmFirstVoice();
                    return;
                }
            }
            // Skip legacy dna_files fetch to avoid 404 noise; rely on app resolver and fallbacks only
            // Fallback
            const fallbackResponse = await fetch('data/the-moon.json');
            if (fallbackResponse.ok) {
                this.currentDNA = await fallbackResponse.json();
                console.log(`✅ Using fallback (moon) DNA for day ${day}`);
                this.dnaWarnings = this.validatePhaseDNA(this.currentDNA);
                this.prewarmFirstVoice();
            }
        } catch (error) {
            console.warn(`⚠️ No DNA data available for day ${day}, using fallback`);
        }
    }

    /**
     * Validate PhaseDNA v1 structure and return warnings array
     */
    validatePhaseDNA(dna) {
        const warnings = [];
        try {
            if (!dna || dna.metadata?.version !== 'phase_v1') return warnings;
            const requiredPhases = ['welcome','beginning','middle','end','wisdom'];
            const phaseById = Object.fromEntries((dna.phases||[]).map(p=>[p.id,p]));
            requiredPhases.forEach(id=>{ if (!phaseById[id]) warnings.push(`Missing phase: ${id}`); });
            ['beginning','middle','end'].forEach(id=>{
                const p = phaseById[id]; if (!p) return;
                if (!p.narration?.voiceOver) warnings.push(`${id}: missing narration.voiceOver`);
                if (!p.question?.text) warnings.push(`${id}: missing question.text`);
                const choices = p.question?.choices || [];
                const hasA = choices.some(c=>c.id==='a'); const hasB = choices.some(c=>c.id==='b');
                if (!hasA || !hasB) warnings.push(`${id}: choices must include ids 'a' and 'b'`);
                if (!p.question?.correct) warnings.push(`${id}: missing question.correct`);
                const tm = p.question?.teachingMoments || {};
                if (!tm.a || !tm.b) warnings.push(`${id}: missing teachingMoments for both 'a' and 'b'`);
                if (!p.timing) warnings.push(`${id}: missing timing`);
            });
            const w = phaseById['welcome'];
            if (w && !w.narration?.voiceOver) warnings.push('welcome: missing narration.voiceOver');
            const z = phaseById['wisdom'];
            if (z && !z.narration?.voiceOver) warnings.push('wisdom: missing narration.voiceOver');
        } catch(e) { warnings.push('Validator error'); }
        return warnings;
    }

    /**
     * Pre-generate audio for the first narration (typically Welcome) for snappy start
     */
    async prewarmFirstVoice() {
        try {
            if (!this.elevenLabs) return;
            if (!this.currentDNA || this.currentDNA?.metadata?.version !== 'phase_v1') return;
            const welcome = (this.currentDNA.phases || []).find(p => p.id === 'welcome');
            const vo = welcome?.narration?.voiceOver;
            if (!vo || this.preSynthCache.has(vo)) return;
            const avatar = this.currentVariant.avatar || 'kelly';
            const url = await this.elevenLabs.generateAudio(vo, avatar);
            if (typeof url === 'string' && url.startsWith('blob:')) {
                this.preSynthCache.set(vo, url);
                console.log('⚡ Prewarmed first VO clip');
            }
        } catch (e) { console.warn('Prewarm failed', e); }
    }

    /**
     * Start universal lesson with 5 phases
     */
    async startUniversalLesson() {
        if (!this.currentLesson) {
            this.showError('No lesson loaded');
            return;
        }

        console.log('🚀 Starting universal lesson with 5 phases...');
        // Hide start overlay if present
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';
        
        // Reset to first phase
        this.currentPhase = 0;
        // Ensure lesson is considered playing so content renders even if audio autoplay is blocked
        this.isPlaying = true;
        this.updatePlayButton();
        
        // Generate personalized content for current variant
        await this.generateUniversalContent();
        
        // Start first phase
        this.playCurrentPhase();
    }

    /**
     * Generate universal content based on current variant
     */
    async generateUniversalContent() {
        console.log('🎨 Generating universal content for variant:', this.currentVariant);
        try {
            // PhaseDNA v1 direct path
            if (this.currentDNA && this.currentDNA?.metadata?.version === 'phase_v1') {
                this.universalContent = this.buildContentFromPhaseDNA(this.currentDNA);
                console.log('✅ PhaseDNA v1 content resolved');
                return;
            }
            // Prefer DNA-driven variant generation
            if (!this.variantGen && typeof CorrectedVariantGeneratorV2 !== 'undefined') {
                this.variantGen = new CorrectedVariantGeneratorV2();
            }
            if (this.variantGen && this.currentDNA && this.hasRichDNASchema(this.currentDNA)) {
                // Keep generator preferences in sync
                this.variantGen.currentPreferences = { ...this.currentVariant };
                const generated = await this.variantGen.generatePersonalizedContent(this.currentVariant);
                // Adapt to universalContent shape expected by player
                const questions = (generated.questions || []).map(q => ({
                    question: q.text || q.question || '',
                    choices: Array.isArray(q.choices) ? q.choices.map(c => (typeof c === 'string' ? c : (c.text || ''))) : []
                }));
                this.universalContent = {
                    introduction: generated.opening || generated.openingText || 'Welcome to today\'s lesson!',
                    questions,
                    conclusion: generated.fortune || generated.conclusion || '',
                    fortune: generated.fortune || ''
                };
                console.log('✅ DNA variant content generated');
                return;
            }
            // If we have DNA but not the rich schema, transform simple DNA
            if (this.currentDNA) {
                const uc = this.transformSimpleDNA(this.currentDNA, this.currentVariant);
                if (uc) { this.universalContent = uc; console.log('✅ Simple DNA transformed to universal content'); return; }
            }
        } catch (e) {
            console.warn('Variant generation failed, using fallback', e);
        }
        // Fallback content
        const dummyLesson = { title: this.currentLesson?.title || 'Learning', learning_objective: this.currentLesson?.learning_objective || '' };
        this.universalContent = this.generateFallbackUniversalContent(dummyLesson);
        console.log('✅ Fallback lesson content generated');
    }

    buildContentFromPhaseDNA(phaseDNA){
        // Reduce 5 phases into current player’s content interface while we migrate UI fully
        const getQ = (id) => {
            const p = phaseDNA.phases.find(x=>x.id===id);
            if (!p) return null;
            const q = p.question?.text || '';
            const a = p.question?.choices?.find(c=>c.id==='a')?.text || '';
            const b = p.question?.choices?.find(c=>c.id==='b')?.text || '';
            return { question: q, choices: [a,b].filter(Boolean) };
        };
        return {
            introduction: phaseDNA.phases.find(x=>x.id==='welcome')?.narration?.voiceOver || '',
            questions: [ getQ('beginning'), getQ('middle'), getQ('end') ].filter(Boolean),
            conclusion: phaseDNA.phases.find(x=>x.id==='wisdom')?.narration?.voiceOver || '',
            fortune: phaseDNA.phases.find(x=>x.id==='wisdom')?.screen?.steps?.find(s=>s.show?.some(u=>u.type==='fortune'))?.show?.find(u=>u.type==='fortune')?.text || ''
        };
    }

    hasRichDNASchema(dna) {
        return !!(dna && dna.tone_delivery_dna && dna.language_translations);
    }

    mapAgeVariantToNumeric(ageVariant) {
        const map = { age_2: '2', age_5: '5', age_8: '8', age_12: '12', age_16: '16', age_25: '25', age_40: '40', age_60: '60', age_80: '80', age_102: '102' };
        return map[ageVariant] || '25';
    }

    transformSimpleDNA(dna, variant) {
        try {
            const tone = variant.tone || 'neutral';
            const dnaAge = this.mapAgeVariantToNumeric(variant.age || 'age_25');
            const concept = dna.age_expressions?.[dnaAge]?.concept_name?.[tone] || dna.age_expressions?.[dnaAge]?.concept_name?.neutral;
            const intro = (concept?.voice_over_script || concept?.display_text || dna.lesson_metadata?.universal_concept || '').toString();

            const q = (idx) => {
                const block = dna.core_lesson_structure?.[`question_${idx}`]?.ages?.[dnaAge];
                if (!block) return null;
                // question text can be string or {tone:{display_text}}
                const qt = block.question || {};
                const qtext = (
                    qt?.[tone]?.display_text || qt?.[tone]?.voice_over_script ||
                    qt?.neutral?.display_text || qt?.neutral?.voice_over_script ||
                    qt?.display_text || qt?.voice_over_script || ''
                ).toString();
                const a = (block.option_a?.display_text || block.option_a?.voice_over_script || '').toString();
                const b = (block.option_b?.display_text || block.option_b?.voice_over_script || '').toString();
                return { question: qtext, choices: [a, b].filter(x=>x && x.trim().length>0) };
            };

            const questions = [q(1), q(2) || q(1), q(3) || q(1)].filter(Boolean);
            const fortune = (
                dna.wisdom_phase_content?.fortune?.[tone]?.voice_over_script ||
                dna.wisdom_phase_content?.fortune?.[tone]?.display_text ||
                dna.wisdom_phase_content?.fortune?.neutral?.voice_over_script ||
                dna.wisdom_phase_content?.fortune?.neutral?.display_text || ''
            ).toString();
            return { introduction: intro, questions, conclusion: fortune, fortune };
        } catch (e) { console.warn('Simple DNA transform failed', e); return null; }
    }

    /**
     * Play current lesson phase
     */
    async playCurrentPhase() {
        if (this.currentPhase >= this.lessonPhases.length) {
            this.onLessonComplete();
            return;
        }

        const phase = this.lessonPhases[this.currentPhase];
        const mappedPhase = this.mapPhaseForContent(phase);
        const phaseNumber = this.currentPhase + 1;
        console.log(`🎵 Playing phase ${phaseNumber}/5: ${phase}`);
        // FSM state set
        this._enterFsmState(phase === 'wisdom' ? 'wisdom' : (['beginning','middle','end'].includes(phase) ? 'question' : 'welcome'));
        
        // Update phase display (label/progress). Content rendering is suppressed for PhaseDNA path to avoid duplication.
        this.updatePhaseDisplay(phase, phaseNumber);

        // Update Flask progress for phase start
        if (this.useFlaskProgress && this.flaskIntegration && this.flaskIntegration.isAuthenticated) {
            try {
                // Save phase start (not completed yet)
                await this.flaskIntegration.updateLessonProgress(
                    this.currentDay,
                    phaseNumber,
                    false,
                    [],
                    0
                );
                console.log(`✅ Phase ${phaseNumber} start saved to Flask`);
            } catch (error) {
                console.warn('⚠️ Failed to save phase start to Flask:', error);
            }
        }

        // Update avatar for current phase
        this.updateAvatarForPhase(phase);

        // If PhaseDNA v1, run direct PhaseRunner and return. Do NOT invoke legacy renderer.
        if (this.currentDNA?.metadata?.version === 'phase_v1') {
            try {
                const lessonText = document.getElementById('lesson-text');
                if (lessonText) lessonText.innerHTML = '';
                const overlay = document.getElementById('lesson-content-overlay');
                const content = document.getElementById('lesson-content');
                if (overlay) overlay.style.display = 'block';
                if (content) content.style.display = 'block';
            } catch {}
            this.runPhaseFromDNA(phase);
            return;
        }

        // Legacy display/content path
        this.showPhaseContent(mappedPhase);
        await this.generateAndPlayPhaseAudio(mappedPhase);
        // Auto-advance for non-question phases happens on audio end now

        // Question phases: arm gentle no-interaction hint
        if (['beginning','middle','end'].includes(mappedPhase)) {
            this.questionAnswered = false;
            const t = this.getPhaseTimingFromPhaseDNA(mappedPhase);
            const ms = Math.max(6000, (t?.maxWait || 12) * 1000);
            clearTimeout(this.phaseTimers.noChoice);
            this.phaseTimers.noChoice = setTimeout(() => {
                if (!this.questionAnswered) this.handleNoChoiceTimeout(mappedPhase);
            }, ms);
        } else {
            this.questionAnswered = true;
            clearTimeout(this.phaseTimers.noChoice);
        }
    }

    /**
     * Update phase display with new visual structure
     */
    updatePhaseDisplay(phase, phaseNumber) {
        // Update phase label
        const phaseLabels = {
            'welcome': 'Welcome',
            'beginning': 'Beginning', 
            'middle': 'Middle',
            'end': 'End',
            'wisdom': 'Wisdom'
        };
        
        // Update current phase in UI
        const phaseLabel = document.querySelector('.current-phase-label');
        if (phaseLabel) {
            phaseLabel.textContent = phaseLabels[phase] || phase;
        }
        
        // Sync left progress rail
        this.updateProgressRail();

        // Show/hide appropriate content sections
        this.showPhaseSpecificContent(phase, phaseNumber);
    }

    /**
     * Update left progress labels and line fill
     */
    updateProgressRail() {
        try {
            const groups = document.querySelectorAll('.progress-label-group');
            groups.forEach((g, idx) => {
                g.classList.toggle('active', idx === this.currentPhase);
                g.classList.toggle('completed', idx < this.currentPhase);
            });
            const fill = document.getElementById('progress-line-fill');
            if (fill) {
                const pct = (this.currentPhase / Math.max(1, this.lessonPhases.length - 1)) * 100;
                fill.style.height = `${pct}%`;
            }
        } catch {}
    }

    /**
     * Show content specific to each phase
     */
    showPhaseSpecificContent(phase, phaseNumber) {
        // If PhaseDNA v1 is active, PhaseRunner handles structured overlay content
        if (this.currentDNA?.metadata?.version === 'phase_v1') {
            try {
                const lessonContentOverlay = document.getElementById('lesson-content-overlay');
                const lessonContent = document.getElementById('lesson-content');
                const lessonText = document.getElementById('lesson-text');
                const qSection = document.querySelector('#lesson-content .question-content');
                const qChoices = document.querySelector('#lesson-content .choices-container');
                const qLabel = document.querySelector('#lesson-content .question-label');
                const feedback = document.querySelector('#lesson-content .choice-feedback');
                if (lessonContentOverlay) lessonContentOverlay.style.display = 'block';
                if (lessonContent) lessonContent.style.display = 'block';
                if (lessonText) lessonText.innerHTML = '';
                if (qSection) qSection.classList.add('hidden');
                if (qChoices) qChoices.innerHTML = '';
                if (qLabel) qLabel.textContent = '';
                if (feedback) { feedback.classList.add('hidden'); feedback.innerHTML = ''; }
            } catch {}
            return;
        }
        // Clear legacy phase content
        document.querySelectorAll('.phase-content').forEach(el => el.classList.add('hidden'));
        
        switch(phase) {
            case 'welcome':
                this.showWelcomeContent();
                break;
            case 'beginning':
                this.showQuestionContent(1, 'Q1');
                break;
            case 'middle':
                this.showQuestionContent(2, 'Q2');
                break;
            case 'end':
                this.showQuestionContent(3, 'Q3');
                break;
            case 'wisdom':
                this.showWisdomContent();
                break;
        }
    }

    /**
     * Show welcome phase content with date/time
     */
    showWelcomeContent() {
        const welcomeSection = document.querySelector('.welcome-content');
        if (welcomeSection) {
            welcomeSection.classList.remove('hidden');
            
            // Update welcome note with current date/time
            const welcomeNote = welcomeSection.querySelector('.welcome-note');
            if (welcomeNote) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const timeStr = now.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
                
                welcomeNote.innerHTML = `
                    <p>Today is ${dateStr}</p>
                    <p>Your local time is ${timeStr}</p>
                    <p>Today's lesson is all about <strong>${this.currentLesson?.title || 'Learning'}</strong>!</p>
                `;
            }
        }
    }

    /**
     * Show question content with A/B choices
     */
    showQuestionContent(questionNumber, questionLabel) {
        const questionSection = document.querySelector('.question-content');
        if (questionSection) {
            questionSection.classList.remove('hidden');
            
            // Update question label
            const qLabel = questionSection.querySelector('.question-label');
            if (qLabel) {
                qLabel.textContent = questionLabel;
            }
            
            // Show A/B choice buttons
            const choicesContainer = questionSection.querySelector('.choices-container');
            if (choicesContainer) {
                // Pull content for this question
                const qKey = ['question_1','question_2','question_3'][questionNumber-1] || 'question_1';
                const age = this.currentVariant.age || 'age_25';
                const dnaAge = this.mapAgeVariantToNumeric(age);
                const blk = this.currentDNA?.core_lesson_structure?.[qKey]?.ages?.[dnaAge];
                const aText = blk?.option_a?.display_text || this.universalContent?.questions?.[questionNumber-1]?.choices?.[0] || 'Option A';
                const bText = blk?.option_b?.display_text || this.universalContent?.questions?.[questionNumber-1]?.choices?.[1] || 'Option B';
                choicesContainer.innerHTML = `
                    <button class="choice-btn choice-a" data-choice="a">${aText}</button>
                    <button class="choice-btn choice-b" data-choice="b">${bText}</button>
                `;
                
                // Add click handlers
                choicesContainer.querySelectorAll('.choice-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const choice = e.target.dataset.choice;
                        this.handleQuestionChoice(questionNumber, choice);
                    });
                });
            }
        }
    }

    /**
     * Show wisdom phase content
     */
    showWisdomContent() {
        const wisdomSection = document.querySelector('.wisdom-content');
        if (wisdomSection) {
            wisdomSection.classList.remove('hidden');
            
            // Show three wisdom sections
            const wisdomSections = wisdomSection.querySelectorAll('.wisdom-section');
            wisdomSections.forEach((section, index) => {
                section.classList.remove('hidden');
                // Add wisdom content based on lesson completion
                section.innerHTML = `<div class="wisdom-placeholder">Wisdom ${index + 1}</div>`;
            });
        }
    }

    /**
     * Handle question choice selection
     */
    handleQuestionChoice(questionNumber, choice) {
        console.log(`Question ${questionNumber} answered: ${choice}`);
        
        // Store answer
        if (!this.userAnswers) this.userAnswers = [];
        this.userAnswers[questionNumber - 1] = choice;
        
        // Provide immediate feedback
        this.showChoiceFeedback(questionNumber, choice);
        
        // Auto-advance after feedback
        setTimeout(() => {
            this.nextPhase();
        }, 2000);
    }

    /**
     * Show feedback for user choice
     */
    showChoiceFeedback(questionNumber, choice) {
        const feedbackContainer = document.querySelector('.choice-feedback');
        if (!feedbackContainer) return;
        feedbackContainer.classList.remove('hidden');

        const idx = questionNumber - 1;
        const correct = this.isSelectedCorrect(idx, choice);
        const message = this.getQuestionFeedback(idx, choice);
        feedbackContainer.innerHTML = `
            <div class="feedback-message">
                <p>You chose option ${String(choice).toUpperCase()}.</p>
                <p>${message}</p>
            </div>
        `;
        this.updateAvatar(this.currentVariant.avatar, correct ? 'happy_celebrating' : 'concerned_thinking');
    }

    /**
     * Update avatar for specific phase
     */
    updateAvatarForPhase(phase) {
        const avatar = this.currentVariant.avatar;
        const tone = this.currentVariant.tone;
        
        // Use test data if available, otherwise fallback
        let expression = 'neutral_default';
        
        if (this.universalContent?.testData?.avatarExpressions) {
            const phaseIndex = this.lessonPhases.indexOf(phase);
            expression = this.universalContent.testData.avatarExpressions[phaseIndex] || 'neutral_default';
            console.log(`🎭 TEST: Setting avatar expression to '${expression}' for phase '${phase}'`);
        } else {
            // Fallback logic
            switch (phase) {
                case 'welcome':
                    expression = tone === 'grandmother' ? 'welcoming_engaging' : 
                               tone === 'fun' ? 'excited_celebrating' : 'teaching_explaining';
                    break;
                case 'beginning':
                case 'middle':
                case 'end':
                    expression = 'question_curious';
                    break;
                case 'wisdom':
                    expression = tone === 'grandmother' ? 'happy_celebrating' : 
                               tone === 'fun' ? 'excited_celebrating' : 'teaching_explaining';
                    break;
            }
        }
        
        this.updateAvatar(avatar, expression);
        console.log(`✅ Avatar updated: ${avatar} with expression: ${expression}`);
    }

    /**
     * Show content for specific phase
     */
    showPhaseContent(phase) {
        console.log(`📝 Showing content for phase: ${phase}`);
        
        const lessonContentOverlay = document.getElementById('lesson-content-overlay');
        const lessonContent = document.getElementById('lesson-content');
        const lessonText = document.getElementById('lesson-text');
        
        // Get phase-specific content
        const phaseContent = this.getPhaseContent(phase);
        
        // Show overlay when there is content
        if (phaseContent && phaseContent !== 'Content not available') {
            // Show the overlay
            if (lessonContentOverlay) {
                lessonContentOverlay.style.display = 'block';
            }
            
            if (!lessonContent || !lessonText) {
                console.error('❌ Lesson content elements not found');
                return;
            }

            // Format and display content
                lessonText.innerHTML = this.formatPhaseContent(phaseContent, phase);
            
            // Show with animation
            lessonContent.style.display = 'block';
            lessonContent.style.opacity = '0';
            lessonContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                lessonContent.style.opacity = '1';
                lessonContent.style.transform = 'translateY(0)';
            }, 100);
        } else {
            // Hide overlay if no content
            if (lessonContentOverlay) {
                lessonContentOverlay.style.display = 'none';
            }
            console.log('📝 No content for phase, keeping overlay hidden');
        }
    }

    /**
     * Get content for specific phase
     */
    getPhaseContent(phase) {
        // Generate content if not available
        if (!this.universalContent) {
            this.generateUniversalContent();
        }
        
        // Use the dummy content from universalContent
        if (this.universalContent) {
            switch (phase) {
                case 'welcome':
                    return this.universalContent.introduction || '';
                case 'beginning':
                    return this.universalContent.questions?.[0] || '';
                case 'middle':
                    return this.universalContent.questions?.[1] || '';
                case 'end':
                    return this.universalContent.questions?.[2] || '';
                case 'wisdom':
                    return this.universalContent.conclusion || '';
                default:
                    return 'Phase content not available';
            }
        }
        
        // Fallback
        return 'Welcome to today\'s lesson!';
    }

    /**
     * Format phase content appropriately
     */
    formatPhaseContent(content, phase) {
        if (['beginning','middle','end'].includes(phase)) {
            return this.formatQuestionContent(content);
        } else {
            return this.formatTextContent(content, phase);
        }
    }

    /**
     * Format question content
     */
    formatQuestionContent(questionData) {
        if (!questionData || typeof questionData === 'string') {
            return `<div class="content-text">${questionData || 'Question content not available'}</div>`;
        }
        
        let html = `<div class="question-container">`;
        html += `<h3 class="question-text">${questionData.question || 'Question'}</h3>`;
        
        if (questionData.choices && questionData.choices.length > 0) {
            html += `<div class="choices-container">`;
            questionData.choices.forEach((choice, index) => {
                html += `
                    <button class="choice-btn jit-choice-btn" disabled data-choice="${index}" onclick="window.lessonPlayer.handleQuestionAnswer(${this.currentPhase - 1}, ${index})">
                        ${choice}
                    </button>
                `;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Format text content
     */
    formatTextContent(text, phase) {
        let formatted = text.replace(/\n/g, '<br>');
        
        // Add emphasis for important points
        if (phase === 'opening') {
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        
        return `<div class="content-text ${phase}-text">${formatted}</div>`;
    }

    /**
     * Generate and play audio for phase
     */
    async generateAndPlayPhaseAudio(phase) {
        try {
            const content = this.getPhaseContent(phase);
            const avatar = this.currentVariant.avatar;
            const vo = this.getVoiceOverForPhase(phase, content);
            await this.speak(vo, avatar);
            // Prefetch next phase assets once playback starts
            try { this._prefetchNextPhaseAssets(); } catch {}
        } catch (error) {
            console.error('❌ Audio generation error:', error);
            this.useFallbackAudio(phase);
        }
    }

    /**
     * Predict and prefetch next phase assets (audio + avatar images)
     */
    async _prefetchNextPhaseAssets(){
        try {
            const nextIndex = this.currentPhase + 1;
            if (nextIndex >= this.lessonPhases.length) return;
            const nextPhase = this.lessonPhases[nextIndex];
            // Prefetch audio (TTS) if available
            const content = this.getPhaseContent(nextPhase);
            const vo = this.getVoiceOverForPhase(nextPhase, content);
            const narration = String(vo||'').trim();
            if (narration && !this.preSynthCache.get(narration) && !window.__forceSpeech && window.tts && typeof window.tts.generateAudio === 'function'){
                const voice = (this.currentVariant?.avatar||'kelly').toLowerCase().includes('ken') ? 'ken' : 'kelly';
                try {
                    const blob = await window.tts.generateAudio(narration, voice, (this.currentVariant?.language||'english'));
                    const url = URL.createObjectURL(blob);
                    try { this.preSynthCache.set(narration, url); } catch {}
                } catch {}
            }
            // Prefetch avatar images for likely expressions
            const avatar = this.currentVariant?.avatar || 'kelly';
            const likely = this._predictExpressionsForPhase(nextPhase);
            likely.forEach(expr=>{ try { this._prefetchAvatarImage(avatar, expr); } catch{} });
        } catch {}
    }

    _predictExpressionsForPhase(phase){
        if (phase === 'welcome') return ['teaching_explaining'];
        if (['beginning','middle','end'].includes(phase)) return ['question_curious','happy_celebrating','concerned_thinking'];
        if (phase === 'wisdom') return ['welcoming_engaging'];
        return ['teaching_explaining'];
    }

    _prefetchAvatarImage(avatar, expression){
        let path;
        switch (expression){
            case 'concerned_thinking':
            case 'happy_celebrating':
                path = `/production-deploy/assets/avatars/${avatar}/emotional-expressions/${avatar}_${expression}.png`; break;
            case 'question_curious':
            case 'teaching_explaining':
                path = `/production-deploy/assets/avatars/${avatar}/lesson-sequence/${avatar}_${expression}.png`; break;
            default:
                path = `/production-deploy/assets/avatars/${avatar}/${avatar}_neutral_default.png`;
        }
        const img = new Image(); img.src = path; img.decoding = 'async';
    }

    getVoiceOverForPhase(phase, content){
        try {
            const tone = this.currentVariant.tone || 'neutral';
            const ageVariant = this.currentVariant.age || 'age_25';
            const age = this.mapAgeVariantToNumeric(ageVariant);
            if (this.currentDNA?.metadata?.version === 'phase_v1') {
                const p = this.currentDNA?.phases?.find(x=>x.id===phase);
                if (p?.narration?.voiceOver) return p.narration.voiceOver;
            }
            if (phase === 'welcome') {
                const vo = this.currentDNA?.age_expressions?.[age]?.concept_name?.[tone]?.voice_over_script || '';
                if (vo) return vo;
                return (typeof content === 'string') ? content : (content?.question || 'Welcome');
            }
            if (['beginning','middle','end'].includes(phase)) {
                const idx = {beginning:1, middle:2, end:3}[phase];
                const qKey = ['question_1','question_2','question_3'][idx-1];
                const blk = this.currentDNA?.core_lesson_structure?.[qKey]?.ages?.[age];
                const qText = blk?.question?.[tone]?.display_text || blk?.question?.neutral?.display_text || content?.question || '';
                const aText = blk?.option_a?.display_text || (content?.choices?.[0] || '');
                const bText = blk?.option_b?.display_text || (content?.choices?.[1] || '');
                return `Question ${idx}. ${qText}. Option A: ${aText}. Option B: ${bText}. Choose when you are ready.`;
            }
            if (phase === 'wisdom') {
                if (this.currentDNA?.metadata?.version === 'phase_v1') {
                    const p = this.currentDNA?.phases?.find(x=>x.id==='wisdom');
                    if (p?.narration?.voiceOver) return p.narration.voiceOver;
                }
                const fortune = this.currentDNA?.wisdom_phase_content?.fortune?.[tone]?.voice_over_script || this.universalContent?.conclusion || '';
                return fortune || 'Well done today.';
            }
        } catch {}
        return (typeof content === 'string') ? content : (content?.question || '');
    }

    startReadAlong(text){
        const ra = this.readAlong; if (!ra || !ra.el) return;
        clearInterval(ra.timer); ra.timer = null; ra.index = 0; ra.paused = false;
        const words = String(text||'').split(/\s+/).filter(Boolean);
        ra.words = words;
        ra.el.innerHTML = words.map((w,i)=>`<span data-w="${i}">${w}</span>`).join(' ');
        const spans = ra.el.querySelectorAll('span'); ra.spans = spans;
        const wps = 180/60 * (this.playbackSpeed || 1.0);
        const intervalMs = Math.max(80, Math.floor(1000 / wps));
        ra.timer = setInterval(()=>{
            if (ra.index>0 && spans[ra.index-1]) spans[ra.index-1].style.background='transparent';
            if (ra.index<spans.length) {
                spans[ra.index].style.background='rgba(0,122,255,0.18)';
                spans[ra.index].style.borderRadius='6px';
                ra.index++;
            } else { clearInterval(ra.timer); ra.timer=null; }
        }, intervalMs);
    }

    resumeReadAlong(){
        const ra = this.readAlong; if (!ra || !ra.el || ra.paused === false) return;
        const spans = ra.spans && ra.spans.length ? ra.spans : ra.el.querySelectorAll('span');
        const wps = 180/60 * (this.playbackSpeed || 1.0);
        const intervalMs = Math.max(80, Math.floor(1000 / wps));
        clearInterval(ra.timer); ra.timer = setInterval(()=>{
            if (ra.index>0 && spans[ra.index-1]) spans[ra.index-1].style.background='transparent';
            if (ra.index<spans.length) {
                spans[ra.index].style.background='rgba(0,122,255,0.18)';
                spans[ra.index].style.borderRadius='6px';
                ra.index++;
            } else { clearInterval(ra.timer); ra.timer=null; }
        }, intervalMs);
        ra.paused = false;
    }

    /**
     * Use fallback audio system
     */
    useFallbackAudio(phase) {
        const duration = this.getPhaseDuration(phase);
        
        // Simulate audio playback; use unified end handler
        setTimeout(() => { this._onAudioEnded(); }, duration * 1000);
        
        console.log('🔊 Using fallback audio simulation for phase:', phase);
    }

    getPhaseTimingFromPhaseDNA(phaseId) {
        try { return this.currentDNA?.phases?.find(p => p.id === phaseId)?.timing || null; } catch { return null; }
    }

    handleNoChoiceTimeout(phaseId) {
        try {
            if (this.questionAnswered) return;
            let vo = '';
            if (this.currentDNA?.metadata?.version === 'phase_v1') {
                const p = this.currentDNA.phases.find(x => x.id === phaseId);
                vo = p?.narration?.onNoChoice || 'Let me show you how to think about this.';
            } else {
                vo = 'Let me walk you through it—notice the key detail that points to the answer.';
            }
            this.speak(vo, this.currentVariant.avatar);
            // Visual hint prompt if present
            try {
                const lessonText = document.getElementById('lesson-text');
                if (lessonText && this.currentDNA?.metadata?.version === 'phase_v1') {
                    const atKey = 'on_incorrect';
                    const p = this.currentDNA.phases.find(x => x.id === phaseId);
                    const steps = (p?.screen?.steps || []).filter(s => s.at === atKey);
                    steps.forEach(s => {
                        (s.show || []).forEach(u => { if (u.type === 'hint') { const div = document.createElement('div'); div.id = u.id||''; div.className = 'content-text'; div.style.opacity='0.9'; div.textContent = u.text || ''; lessonText.appendChild(div); } });
                    });
                }
            } catch {}
        } catch {}
        const idx = { beginning: 0, middle: 1, end: 2 }[phaseId] ?? 0;
        const sel = this.getCorrectChoiceForIndex(idx);
        this.showQuestionFeedback(idx, sel);
    }

    getCorrectChoiceForIndex(questionIndex) {
        try {
            const qKey = ['question_1','question_2','question_3'][questionIndex] || 'question_1';
            const age = this.currentVariant.age || 'age_25';
            const dnaAge = this.mapAgeVariantToNumeric(age);
            const blk = this.currentDNA?.core_lesson_structure?.[qKey]?.ages?.[dnaAge];
            const correct = (blk && blk.correct_option) ? blk.correct_option.toLowerCase() : 'b';
            return correct;
        } catch { return 'b'; }
    }

    previousPhase() {
        if (this.currentPhase <= 0) return;
        this.currentPhase -= 1;
        this.playCurrentPhase();
    }

    restartLesson() {
        this.currentPhase = 0;
        this.playCurrentPhase();
    }

    /**
     * Get duration for phase
     */
    getPhaseDuration(phase) {
        // Use test data if available for comprehensive testing
        if (this.universalContent?.testData?.phaseDurations) {
            const phaseIndex = this.lessonPhases.indexOf(phase);
            const duration = this.universalContent.testData.phaseDurations[phaseIndex] || 5;
            console.log(`⏱️ TEST: Phase '${phase}' duration: ${duration} seconds`);
            return duration;
        }
        // Default durations (fallback only; normal flow is audio-driven)
        switch (phase) {
            case 'welcome': return 4;
            case 'wisdom': return 6;
            default: return 5;
        }
    }

    /**
     * Move to next phase
     */
    nextPhase() {
        this.currentPhase++;
        if (this.currentPhase < this.lessonPhases.length) {
            this.playCurrentPhase();
        } else {
            this.onLessonComplete();
        }
    }

    /**
     * Handle lesson completion
     */
    async onLessonComplete() {
        console.log('🎉 Universal lesson completed!');
        this.isPlaying = false;
        this.updatePlayButton();
        
        // Update Flask progress for lesson completion
        if (this.useFlaskProgress && this.flaskIntegration && this.flaskIntegration.isAuthenticated) {
            try {
                // Save phase 5 (daily fortune) completion
                await this.flaskIntegration.updateLessonProgress(
                    this.currentDay,
                    5,
                    true,
                    [],
                    this.getPhaseDuration(5) * 1000
                );
                console.log(`✅ Lesson completion saved to Flask for day ${this.currentDay}`);
                
                // Get habit status to show streak
                const habitStatus = await this.flaskIntegration.getHabitStatus();
                if (habitStatus) {
                    console.log(`🔥 Current streak: ${habitStatus.streak_days} days`);
                }
            } catch (error) {
                console.warn('⚠️ Failed to save lesson completion to Flask:', error);
            }
        }
        
        // Show completion message
        this.showPhaseContent('closing');
        
        // Show daily fortune
        setTimeout(() => {
            this.showDailyFortune();
        }, 3000);
    }

    /**
     * Show daily fortune
     */
    showDailyFortune() {
        if (this.universalContent && this.universalContent.fortune) {
            this.showPhaseContent('fortune');
        }
    }

    /**
     * Handle question answer
     */
    async handleQuestionAnswer(questionIndex, selectedOption) {
        console.log(`✅ Question ${questionIndex + 1} answered: ${selectedOption}`);
        
        // Update Flask progress if available
        if (this.useFlaskProgress && this.flaskIntegration && this.flaskIntegration.isAuthenticated) {
            try {
                const phase = questionIndex + 2; // Phase 2, 3, 4 for questions
                await this.flaskIntegration.updateLessonProgress(
                    this.currentDay,
                    phase,
                    true,
                    [selectedOption],
                    this.getPhaseDuration(phase) * 1000
                );
                console.log(`✅ Progress saved to Flask for phase ${phase}`);
            } catch (error) {
                console.warn('⚠️ Failed to save progress to Flask:', error);
            }
        }
        
        // Show feedback
        this.showQuestionFeedback(questionIndex, selectedOption);
        
        // Advance to next phase after dwell (teaching moment timing)
        const dwell = Math.max(1500, (this.currentDNA?.phases?.find(p=>p.id===this.lessonPhases[this.currentPhase])?.timing?.teachingMomentMs||3000));
        setTimeout(() => { this.nextPhase(); }, dwell);
    }

    /**
     * Show question feedback
     */
    showQuestionFeedback(questionIndex, selectedOption) {
        const lessonText = document.getElementById('lesson-text');
        if (!lessonText) return;
        
        const feedback = this.getQuestionFeedback(questionIndex, selectedOption);
        
        lessonText.innerHTML = `
            <div class="feedback-container">
                <h3>Great thinking!</h3>
                <p>${feedback}</p>
            </div>
        `;
        // Avatar + speak feedback
        const correct = this.isSelectedCorrect(questionIndex, selectedOption);
        this.updateAvatar(this.currentVariant.avatar, correct ? 'happy_celebrating' : 'concerned_thinking');
        this.speak(feedback, this.currentVariant.avatar);
        this.questionAnswered = true;
        clearTimeout(this.phaseTimers.noChoice);
    }

    /**
     * Get feedback for question answer
     */
    getQuestionFeedback(questionIndex, selectedOption) {
        try {
            const qKey = ['question_1','question_2','question_3'][questionIndex] || 'question_1';
            const age = this.currentVariant.age || 'age_25';
            const dnaAge = this.mapAgeVariantToNumeric(age);
            const blk = this.currentDNA?.core_lesson_structure?.[qKey]?.ages?.[dnaAge];
            if (blk && blk.teaching_moments) {
                const correct = this.isSelectedCorrect(questionIndex, selectedOption);
                return (correct ? blk.teaching_moments.option_b_response : blk.teaching_moments.option_a_response) || "Great thinking!";
            }
        } catch {}
        return "You're thinking about this in a wonderful way! This understanding will help you in many areas of life.";
    }

    isSelectedCorrect(questionIndex, selectedOption) {
        try {
            const qKey = ['question_1','question_2','question_3'][questionIndex] || 'question_1';
            const age = this.currentVariant.age || 'age_25';
            const dnaAge = this.mapAgeVariantToNumeric(age);
            const blk = this.currentDNA?.core_lesson_structure?.[qKey]?.ages?.[dnaAge];
            const correct = (blk && blk.correct_option) ? blk.correct_option.toLowerCase() : 'b';
            const sel = (String(selectedOption).toLowerCase() === 'a' || selectedOption === 0) ? 'a' : 'b';
            return sel === correct;
        } catch { return false; }
    }

    /**
     * Update avatar
     */
    updateAvatar(avatar, expression) {
        const avatarContainer = document.getElementById('avatar-container');
        if (!avatarContainer) return;
        
        // Update avatar container class
        avatarContainer.className = `avatar-container ${avatar}-active`;
        
        // Map expressions to correct image paths
        let imagePath;
        switch (expression) {
            case 'teaching_explaining':
            case 'question_curious':
                imagePath = `/production-deploy/assets/avatars/${avatar}/lesson-sequence/${avatar}_${expression}.png`;
                break;
            case 'concerned_thinking':
            case 'happy_celebrating':
                imagePath = `/production-deploy/assets/avatars/${avatar}/emotional-expressions/${avatar}_${expression}.png`;
                break;
            default:
                imagePath = `/production-deploy/assets/avatars/${avatar}/${avatar}_neutral_default.png`;
        }
        
        avatarContainer.style.backgroundImage = `url('${imagePath}')`;
        // Remember path for 2D compositor mapping
        this.currentAvatarImagePath = imagePath;
        try { this._positionMouthCanvas(); } catch {}
        
        console.log(`🎭 Avatar updated: ${avatar} with expression: ${expression} using path: ${imagePath}`);
    }

    /**
     * Update lesson info display
     */
    updateLessonInfo(lessonData) {
        console.log('📝 Updating lesson info:', lessonData);
        
        // Update the lesson info overlay in index.html
        const lessonInfoTitle = document.getElementById('lesson-info-title');
        const lessonInfoObjective = document.getElementById('lesson-info-objective');
        
        if (lessonInfoTitle) {
            lessonInfoTitle.textContent = lessonData.title;
        }
        
        if (lessonInfoObjective) {
            lessonInfoObjective.textContent = lessonData.learning_objective;
        }
        
        // Lesson content overlay title doesn't exist, so we skip that
        
        console.log('✅ Lesson info updated with:', lessonData.title);
    }

    /**
     * Update calendar selection
     */
    updateCalendarSelection(selectedDay) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add new selection
        const selectedDayElement = document.querySelector(`[onclick*="${selectedDay}"]`);
        if (selectedDayElement) {
            selectedDayElement.classList.add('selected');
        }
    }

    /**
     * Get current day of year
     */
    getCurrentDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    /**
     * Get current month (1-12)
     */
    getCurrentMonth() {
        return new Date().getMonth() + 1;
    }

    /**
     * Get month name
     */
    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || 'Unknown';
    }

    /**
     * Get days in month
     */
    getDaysInMonth(month) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return daysInMonth[month - 1] || 31;
    }

    /**
     * Get day of year for month and day
     */
    getDayOfYear(month, day) {
        const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let dayOfYear = day;
        
        for (let i = 1; i < month; i++) {
            dayOfYear += daysInMonth[i];
        }
        
        return dayOfYear;
    }

    /**
     * Get lesson data for day
     */
    getLessonDataForDay(day) {
        // Use the complete curriculum with 366 daily topics
        if (window.COMPLETE_CURRICULUM && window.COMPLETE_CURRICULUM[day]) {
            const lessonData = window.COMPLETE_CURRICULUM[day];
            console.log(`✅ Found lesson for day ${day}: ${lessonData.title}`);
            return lessonData;
        }
        
        // Fallback to current day if specific day not found
        const currentDay = this.getCurrentDayOfYear();
        if (window.COMPLETE_CURRICULUM && window.COMPLETE_CURRICULUM[currentDay]) {
            console.log(`⚠️ Day ${day} not found, using current day ${currentDay}`);
            return window.COMPLETE_CURRICULUM[currentDay];
        }
        
        console.warn(`❌ No lesson data available for day ${day}`);
        return null;
    }

    /**
     * Load current lesson
     */
    async loadCurrentLesson() {
        console.log(`📚 Loading current lesson for day ${this.currentDay}...`);
        await this.loadLessonByDay(this.currentDay);
        // Prefer a real PhaseDNA demo if today's lesson lacks PhaseDNA
        try {
            const isPhaseDNA = this.currentDNA && this.currentDNA.metadata && this.currentDNA.metadata.version === 'phase_v1';
            if (!isPhaseDNA) {
                console.log('ℹ️ Today\'s topic lacks PhaseDNA. Loading Sun (day 1) demo.');
                await this.loadLessonByDay(1);
            }
        } catch {}
        // Never auto-play - always wait for user interaction
        console.log('⏳ Lesson loaded and ready. Waiting for Start.');
        // Remove autoplay completely to prevent macOS voice
        this.autoplay = false;
    }

    /**
     * Select day
     */
    selectDay(day) {
        console.log(`📅 Selected day ${day}`);
        this.loadLessonByDay(day);
    }

    /**
     * Previous month
     */
    previousMonth() {
        let currentMonth = this.getCurrentMonth();
        currentMonth = currentMonth > 1 ? currentMonth - 1 : 12;
        this.generateMonthCalendar(currentMonth);
    }

    /**
     * Next month
     */
    nextMonth() {
        let currentMonth = this.getCurrentMonth();
        currentMonth = currentMonth < 12 ? currentMonth + 1 : 1;
        this.generateMonthCalendar(currentMonth);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start lesson button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'start-lesson-btn') {
                this.startUniversalLesson();
            }
        });

        // Variant control event listeners
        this.setupVariantEventListeners();

        // Audio controls
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }

        // Play controls
        const playButton = document.getElementById('play-btn');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.togglePlayback();
            });
        }

        // Navigation - REMOVED to avoid conflicts with existing onclick handlers
        // The existing system has onclick handlers that should work

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Setup variant event listeners
     */
    setupVariantEventListeners() {
        // Avatar selection
        const avatarSelect = document.getElementById('avatar-select');
        if (avatarSelect) {
            avatarSelect.addEventListener('change', (e) => {
                this.onAvatarChange(e.target.value);
            });
        }

        // Tone selection
        const toneSelect = document.getElementById('tone-select');
        if (toneSelect) {
            toneSelect.addEventListener('change', (e) => {
                this.onToneChange(e.target.value);
            });
        }

        // Language selection
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.onLanguageChange(e.target.value);
            });
        }

        // Age selection
        const ageSelect = document.getElementById('age-select');
        if (ageSelect) {
            ageSelect.addEventListener('change', (e) => {
                this.onAgeChange(e.target.value);
            });
        }
    }

    /**
     * Handle avatar change
     */
    onAvatarChange(newAvatar) {
        console.log('🎭 Avatar changed to:', newAvatar);
        this.currentVariant.avatar = newAvatar;
        try { localStorage.setItem('variant_avatar', newAvatar); } catch {}
        
        // Update avatar display immediately
        this.updateAvatar(newAvatar, this.getAvatarExpression(this.currentVariant.tone));
        this.preloadAvatarAssets(newAvatar);
        
        // Regenerate content and update display if lesson is active
        if (this.isPlaying) {
            this.generateUniversalContent();
            // Update current phase content immediately
            const currentPhase = this.lessonPhases[this.currentPhase];
            this.showPhaseContent(currentPhase);
        }
    }

    /**
     * Handle tone change
     */
    onToneChange(newTone) {
        console.log('🎨 Tone changed to:', newTone);
        this.currentVariant.tone = newTone;
        try { localStorage.setItem('variant_tone', newTone); } catch {}
        
        // Update avatar expression
        this.updateAvatar(this.currentVariant.avatar, this.getAvatarExpression(newTone));
        
        // Regenerate content and update display if lesson is active
        if (this.isPlaying) {
            this.generateUniversalContent();
            // Update current phase content immediately
            const currentPhase = this.lessonPhases[this.currentPhase];
            this.showPhaseContent(currentPhase);
        }
    }

    /**
     * Handle language change
     */
    onLanguageChange(newLanguage) {
        console.log('🌍 Language changed to:', newLanguage);
        this.currentVariant.language = newLanguage;
        try { localStorage.setItem('variant_language', newLanguage); } catch {}
        
        // Reload DNA for current day so language-specific files are used
        const day = this.selectedDay || this.currentDay;
        this.loadDNALesson(day).then(()=>{
            if (this.isPlaying) {
                this.generateUniversalContent();
                const currentPhase = this.lessonPhases[this.currentPhase];
                if (this.currentDNA?.metadata?.version === 'phase_v1') {
                    this.playCurrentPhase();
                } else {
                    this.showPhaseContent(currentPhase);
                }
            }
        });
    }

    /**
     * Handle age change
     */
    onAgeChange(newAge) {
        console.log('👶 Age changed to:', newAge);
        this.currentVariant.age = newAge;
        try { localStorage.setItem('variant_age', newAge); } catch {}
        
        // Regenerate content and update display if lesson is active
        if (this.isPlaying) {
            this.generateUniversalContent();
            // Update current phase content immediately
            const currentPhase = this.lessonPhases[this.currentPhase];
            this.showPhaseContent(currentPhase);
        }
    }

    /**
     * Get avatar expression for tone
     */
    getAvatarExpression(tone) {
        const expressions = {
            grandmother: 'welcoming_engaging',
            fun: 'excited_celebrating',
            neutral: 'teaching_explaining'
        };
        return expressions[tone] || 'neutral_default';
    }

    /**
     * Setup audio events
     */
    setupAudioEvents() {
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.updateProgressBar();
        });

        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.updateProgressBar();
            // Gate choice reveal for question phases by audio progress and minimum dwell
            try { this._checkChoiceGate(); } catch {}
        });

        this.audioElement.addEventListener('ended', () => { this._onAudioEnded(); });

        this.audioElement.addEventListener('pause', () => {
            const ra = this.readAlong; if (!ra) return;
            ra.paused = true; if (ra.timer) { clearInterval(ra.timer); ra.timer = null; }
        });
        this.audioElement.addEventListener('play', () => {
            const ra = this.readAlong; if (!ra) return; ra.paused = false; this.resumeReadAlong();
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showError('Audio playback failed');
        });
    }

    /**
     * Toggle playback
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.pauseLesson();
        } else {
            this.resumeLesson();
        }
    }

    /** FSM helpers */
    _enterFsmState(state){ this._fsm.state = state; try { window.dispatchEvent(new CustomEvent('ml:fsm_state', { detail:{ state, phaseIndex:this.currentPhase } })); } catch{} }
    _onAudioEnded(){
        // For question phases, audio end should not auto-advance; wait for teaching moment or timeout
        const phase = this.lessonPhases[this.currentPhase];
        if (['beginning','middle','end'].includes(phase)) return; // gated by choice flow
        this.nextPhase();
    }
    _armChoiceGate(minDelayMs, audioThreshold){ this._choiceGate = { enabled:false, minDelayMs, audioThreshold, startTs: performance.now() }; }
    _checkChoiceGate(){
        const g = this._choiceGate; if (!g) return;
        if (g.enabled) return;
        const elapsed = performance.now() - g.startTs;
        const dur = Math.max(0.001, this.audioElement?.duration||0);
        const prog = dur ? (this.audioElement.currentTime / dur) : 0;
        if (elapsed >= g.minDelayMs && prog >= g.audioThreshold) {
            // enable choice buttons
            try { document.querySelectorAll('#lesson-content .choices-container .choice-btn').forEach(b=>{ b.disabled = false; b.classList.add('ready'); }); } catch{}
            g.enabled = true;
        }
    }

    /**
     * Pause lesson
     */
    pauseLesson() {
        this.isPlaying = false;
        this.audioElement.pause();
        this.updatePlayButton();
    }

    /**
     * Resume lesson
     */
    resumeLesson() {
        this.isPlaying = true;
        this.audioElement.play();
        this.updatePlayButton();
    }

    /**
     * Update play button
     */
    updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill && this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    /**
     * Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        console.log(`🔊 Volume set to ${this.volume}`);
    }

    /**
     * Set playback speed
     */
    setSpeed(speed) {
        this.playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
        if (this.audioElement) {
            this.audioElement.playbackRate = this.playbackSpeed;
        }
        console.log(`⚡ Speed set to ${this.playbackSpeed}x`);
        if (this.isPlaying && this.readAlong) {
            this.resumeReadAlong();
        }
    }

    /**
     * Pause lesson
     */
    pauseLesson() {
        this.isPlaying = false;
        if (this.audioElement) {
            this.audioElement.pause();
        }
        console.log('⏸️ Lesson paused');
    }

    /**
     * Resume lesson
     */
    resumeLesson() {
        this.isPlaying = true;
        if (this.audioElement) {
            this.audioElement.play();
        }
        console.log('▶️ Lesson resumed');
    }

    /**
     * Repeat current phase
     */
    repeatCurrentPhase() {
        console.log('🔄 Repeating current phase');
        this.playCurrentPhase();
    }

    /**
     * Handle navigation
     */
    handleNavigation(section) {
        switch (section) {
            case 'calendar':
                this.toggleCalendar();
                break;
            case 'variants':
                this.toggleVariantControls();
                break;
            case 'tone':
                this.toggleToneControls();
                break;
            case 'avatar':
                this.toggleAvatarControls();
                break;
            case 'language':
                this.toggleLanguageControls();
                break;
            case 'age':
                this.toggleAgeControls();
                break;
            default:
                console.log('Navigation:', section);
        }
    }

    /**
     * Toggle calendar
     */
    toggleCalendar() {
        const overlay = document.getElementById('calendar-overlay');
        if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Toggle variant controls
     */
    toggleVariantControls() {
        console.log('📋 Variant controls toggled');
    }

    /**
     * Toggle tone controls
     */
    toggleToneControls() {
        const overlay = document.getElementById('tone-overlay');
        if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Toggle avatar controls
     */
    toggleAvatarControls() {
        const overlay = document.getElementById('avatar-overlay');
        if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Toggle language controls
     */
    toggleLanguageControls() {
        const overlay = document.getElementById('language-overlay');
        if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Toggle age controls
     */
    toggleAgeControls() {
        const overlay = document.getElementById('age-overlay');
        if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayback();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousMonth();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextMonth();
                break;
            case 'Escape':
                this.closeAllOverlays();
                break;
        }
    }

    /**
     * Close all overlays
     */
    closeAllOverlays() {
        const overlays = [
            'calendar-overlay',
            'tone-overlay',
            'avatar-overlay',
            'language-overlay',
            'age-overlay'
        ];
        
        overlays.forEach(overlayId => {
            const overlay = document.getElementById(overlayId);
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    }

    /**
     * Generate fallback universal content
     */
    generateFallbackUniversalContent(lessonData = null) {
        const lesson = lessonData || this.currentLesson;
        const title = lesson?.title || 'Universal Learning System';
        const objective = lesson?.learning_objective || 'testing all system interactions';
        
        // COMPREHENSIVE DUMMY LESSON THAT TESTS EVERYTHING
        return {
            introduction: `🎯 Welcome to the Universal Learning System Test! 

This is a comprehensive test of all system interactions. You'll see:
• Avatar expressions changing per phase
• Interactive questions with choices
• Audio generation (if available)
• Variant controls working
• Progress tracking
• All controls responding

Let's begin our journey through the 5-phase lesson system!`,

            questions: [
                {
                    question: "🎭 PHASE 1 TEST: Avatar Expression Change",
                    choices: [
                        "✅ Kelly should look curious/thinking now",
                        "❌ Avatar expression didn't change",
                        "❌ No avatar visible"
                    ],
                    feedback: "Correct! Kelly's expression should have changed to 'question_curious' for this phase."
                },
                {
                    question: "🎵 PHASE 2 TEST: Audio Generation",
                    choices: [
                        "✅ Audio is playing for this question",
                        "❌ Audio failed to generate",
                        "❌ No audio system available"
                    ],
                    feedback: "The system should attempt to generate audio for each phase using ElevenLabs."
                },
                {
                    question: "🎛️ PHASE 3 TEST: Variant Controls",
                    choices: [
                        "✅ I can change avatar/tone/language/age",
                        "❌ Variant controls don't work",
                        "❌ Controls are not visible"
                    ],
                    feedback: "Try changing the dropdowns in the top-right to see content adapt."
                }
            ],
            
            conclusion: `🎉 CONGRATULATIONS! You've completed the Universal Learning System test!

✅ What worked:
• Lesson progression through 5 phases
• Avatar expression changes
• Interactive question display
• Content formatting
• System responsiveness

🔧 What to test next:
• Audio generation with ElevenLabs
• Variant control interactions
• Calendar lesson selection
• Left-side playback controls
• Progress tracking

The system is ready for real curriculum integration!`,

            fortune: "🌟 Your dedication to testing shows excellent attention to detail. This system will help millions learn!",

            // ADDITIONAL TEST DATA
            testData: {
                avatarExpressions: ['teaching_explaining', 'question_curious', 'question_curious', 'question_curious', 'happy_celebrating'],
                phaseDurations: [5, 8, 8, 8, 5], // seconds per phase
                audioScripts: [
                    "Welcome to the Universal Learning System test. Let's explore all the features together.",
                    "Question one: How is the avatar expression working?",
                    "Question two: Is the audio generation functioning?",
                    "Question three: Can you change the variants?",
                    "Excellent work! You've completed the comprehensive system test."
                ],
                variantTests: {
                    avatar: ['kelly', 'ken'],
                    tone: ['grandmother', 'fun', 'neutral'],
                    language: ['english', 'spanish', 'french'],
                    age: ['age_8', 'age_16', 'age_25', 'age_40']
                }
            }
        };
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌ Error:', message);
        // Could implement toast notification here
    }

    /**
     * Speak text via ElevenLabs if available; fallback otherwise. Also starts read‑along.
     */
    async speak(text, avatar = null) {
        const narration = String(text || '').trim();
        if (!narration) return;
        try { this.startReadAlong(narration); } catch {}
        const chosenAvatar = avatar || this.currentVariant.avatar || 'kelly';
        // Live rig path takes precedence when enabled
        if (this.liveAvatarEnabled) {
            try { await this._speakWithLiveRig(narration, chosenAvatar); } catch {}
            return;
        }
        // Use avatar sync if available
        if (window.avatarSyncPlayer && window.avatarSyncPlayer.play) {
            console.log('🎭 Using avatar sync for speech');
            try {
                await window.avatarSyncPlayer.play(narration, chosenAvatar);
                this.isPlaying = true; 
                this.updatePlayButton();
                return;
            } catch (error) {
                console.error('Avatar sync failed:', error);
            }
        }
        
        // Use pre-synthesized cache if available
        try {
            const cached = this.preSynthCache.get(narration);
            if (cached) {
                this.audioElement.src = cached;
                this.audioElement.playbackRate = this.playbackSpeed;
                try { await this.audioElement.play(); } catch (e) {
                    console.warn('Audio playback failed', e);
                }
                this.isPlaying = true; this.updatePlayButton();
                return;
            }
        } catch {}
        // Prefer homegrown TTS if available via window.tts (unless forced speech)
        try {
            if (!window.__forceSpeech && window.tts && typeof window.tts.generateAudio === 'function') {
                const voice = (chosenAvatar||'kelly').toLowerCase().includes('ken') ? 'ken' : 'kelly';
                const blob = await window.tts.generateAudio(narration, voice, (this.currentVariant?.language||'english'));
                const url = URL.createObjectURL(blob);
                try { this.preSynthCache.set(narration, url); } catch {}
                this.audioElement.src = url;
                this.audioElement.playbackRate = this.playbackSpeed;
                try { await this.audioElement.play(); } catch {}
                this.isPlaying = true; this.updatePlayButton();
                return;
            }
        } catch (err) {
            console.warn('speak() homegrown TTS path failed; falling back', err);
        }
        // No browser speech synthesis fallback - require proper TTS
        // Ken & Kelly voices only
        // Optional ElevenLabs fallback if explicitly enabled earlier
        try {
            if (this.elevenLabs) {
                const result = await this.elevenLabs.generateAudio(narration, chosenAvatar);
                if (typeof result === 'string' && result.startsWith('blob:')) {
                    try { this.preSynthCache.set(narration, result); } catch {}
                    this.audioElement.src = result;
                    this.audioElement.playbackRate = this.playbackSpeed;
                    try { await this.audioElement.play(); } catch {}
                    this.isPlaying = true; this.updatePlayButton();
                    return;
                }
            }
        } catch (err) {
            console.warn('speak() ElevenLabs fallback failed', err);
        }
        try {
            this.isPlaying = true; this.updatePlayButton();
            const approxMs = Math.min(15000, Math.max(2000, narration.split(/\s+/).length * 300));
            setTimeout(()=>{ this.isPlaying = false; this.updatePlayButton(); }, approxMs);
        } catch {}
    }

    async _speakWithLiveRig(narration, avatar) {
        try {
            this._ensureThreeRig();
            this._ensureLive2DCompositor();
            const qp = new URLSearchParams(location.search);
            const mock = qp.get('mockRealtimeVisemes') === '1';
            let audioUrl = null; let phonemes = null; let duration = null;
            if (!mock) {
                try {
                    const res = await this._requestPhonemesBackend(narration, avatar);
                    if (res && (res.audioUrl || res.audio_url) && Array.isArray(res.phonemes)) {
                        audioUrl = res.audioUrl || res.audio_url; phonemes = res.phonemes; duration = res.duration_s || null;
                    }
                } catch {}
            }
            if (!audioUrl || !phonemes) {
                // Fallback to existing TTS and naive phoneme synthesis
                if (!this.elevenLabs) throw new Error('No TTS available for fallback');
                const blobUrl = await this.elevenLabs.generateAudio(narration, avatar);
                if (typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
                    audioUrl = blobUrl;
                    phonemes = this._synthesizePhonemesFromText(narration);
                } else {
                    throw new Error('Audio fallback failed');
                }
            }
            const curves = this._buildVisemeCurvesFromPhonemes(phonemes);
            window.__avatar_curves__ = curves;
            // Start 2D compositor loop bound to audio time
            this._startLive2DLoop(curves);
            this.audioElement.src = audioUrl;
            this.audioElement.playbackRate = this.playbackSpeed;
            try { await this.audioElement.play(); } catch {}
            this.isPlaying = true; this.updatePlayButton();
        } catch (e) {
            console.warn('live rig speak failed', e);
        }
    }

    _ensureLive2DCompositor(){
        try {
            const cont = document.getElementById('avatar-container'); if (!cont) return;
            if (!this._live2D.canvas){
                const c = document.getElementById('avatar-mouth');
                if (c) { this._live2D.canvas = c; this._live2D.ctx = c.getContext('2d'); }
            }
            // Lazy-load rig assets
            if (!this._live2D.rig){
                const avatar = this.currentVariant.avatar || 'kelly';
                const base = `/production-deploy/assets/avatars/${avatar}/2d`;
                fetch(`${base}/rig.json`).then(r=>r.json()).then(j=>{ this._live2D.rig=j; this._live2D.bbox=j.mouth_bbox; this._preloadMouthSprites(base, j.visemes||[]); });
            }
            // Optionally preload full-frame viseme images from Cloudflare or local assets
            if (this.fullFrameVisemesEnabled && !this._live2D.full){
                this._live2D.full = { images:{}, last:null, overlay:null };
                this._loadFullFrameManifest().catch(()=>{});
            }
            this._positionMouthCanvas();
        } catch {}
    }

    async _loadFullFrameManifest(){
        try {
            const avatar = (this.currentVariant.avatar||'kelly').toLowerCase();
            // Allow CDN override: window.VISEME_CDN_BASE = 'https://cdn.example.com/avatars'
            const CDNB = (window.VISEME_CDN_BASE||'').replace(/\/$/,'');
            // Prefer rewritten manifest name when uploaded via tooling; fall back to original
            const tryUrls = CDNB
                ? [
                    `${CDNB}/${avatar}/full/.manifest.rewritten.json`,
                    `${CDNB}/${avatar}/full/manifest.json`
                  ]
                : [
                    `/production-deploy/assets/avatars/${avatar}/2d/full/.manifest.rewritten.json`,
                    `/production-deploy/assets/avatars/${avatar}/2d/full/manifest.json`
                  ];
            let res = null; let manifest = null; let lastErr = null;
            for (const u of tryUrls){
                try {
                    const r = await fetch(u, { cache:'no-cache' });
                    if (r.ok) { res = r; manifest = await r.json(); break; }
                    lastErr = new Error(`manifest ${r.status}`);
                } catch (e) { lastErr = e; }
            }
            if (!manifest) { if (lastErr) throw lastErr; else throw new Error('manifest not found'); }
            const images = this._live2D.full.images || (this._live2D.full.images = {});
            const names = this.VISEMES;
            // Optional frame size for precise patch positioning
            if (manifest && manifest.frame && typeof manifest.frame.w === 'number' && typeof manifest.frame.h === 'number') {
                this._live2D.full.frame = { w: manifest.frame.w, h: manifest.frame.h };
            }
            // Support both simple string arrays and objects with {url,x,y,w,h}
            names.forEach(v=>{
                const arr = manifest[v] || manifest[v.toLowerCase()] || [];
                const first = Array.isArray(arr) ? arr[0] : null;
                if (!first) return;
                if (typeof first === 'string') {
                    const img = new Image(); img.crossOrigin='anonymous'; img.src = first; images[v] = img;
                    // Also set as avatar background for immediate visual feedback
                    // Do not mutate background immediately; only swap during loop to avoid mid-slide jumps
                    try { /* no-op preload visual */ } catch{}
                } else if (first && typeof first === 'object' && first.url) {
                    // Overlay patch mode
                    const img = new Image(); img.crossOrigin='anonymous'; img.src = first.url; images[v] = { image: img, patch: { x:first.x||0, y:first.y||0, w:first.w||0, h:first.h||0 } };
                }
            });
            // Prepare overlay element for patch mode
            if (!this._live2D.full.overlay){
                const host = document.getElementById('avatar-container');
                if (host){
                    const ov = document.createElement('img');
                    ov.id = 'viseme-overlay';
                    ov.style.position = 'absolute';
                    // default full overlay; will be repositioned for patch mode
                    ov.style.left = '0'; ov.style.top = '0';
                    ov.style.width = '100%'; ov.style.height = '100%';
                    ov.style.objectFit = 'cover';
                    ov.style.pointerEvents = 'none';
                    ov.style.zIndex = '2';
                    ov.style.display = 'none';
                    host.appendChild(ov);
                    this._live2D.full.overlay = ov;
                }
            }
        } catch (e) { console.warn('fullframe manifest load failed', e); }
    }

    _preloadMouthSprites(base, names){
        try {
            names.forEach(n=>{
                const img = new Image(); img.crossOrigin='anonymous'; img.src = `${base}/mouth_${n}.png`;
                this._live2D.images[`mouth_${n}`] = img;
            });
            const eyelids = new Image(); eyelids.src = `${base}/eyelids_closed.png`; this._live2D.images['eyelids_closed']=eyelids;
            const pL = new Image(); pL.src = `${base}/pupil_L.png`; this._live2D.images['pupil_L']=pL;
            const pR = new Image(); pR.src = `${base}/pupil_R.png`; this._live2D.images['pupil_R']=pR;
        } catch {}
    }

    _positionMouthCanvas(){
        try {
            const c = this._live2D.canvas; const bbox = this._live2D.bbox; if (!c || !bbox) return;
            // Position canvas approximately over the avatar mouth region
            // Since background is cover, we approximate central placement; refine if needed with calibration.
            c.style.opacity = '1';
        } catch {}
    }

    _startLive2DLoop(curves){
        try {
            const c = this._live2D.canvas; const ctx = this._live2D.ctx; const rig = this._live2D.rig; if (!c||!ctx||!rig) return;
            const sample1D = (track, t)=>{ if(!track||!track.length) return 0; if(t<=track[0].t) return track[0].v; const last=track[track.length-1]; if(t>=last.t) return last.v; let lo=0,hi=track.length-1; while(hi-lo>1){ const mid=(lo+hi)>>1; (track[mid].t<=t)?lo=mid:hi=mid; } const A=track[lo],B=track[hi]; const u=(t-A.t)/Math.max(1e-6,(B.t-A.t)); return A.v*(1-u)+B.v*u; };
            const names = Object.keys(curves.tracks.visemes||{});
            const loop = ()=>{
                if (!this.liveAvatarEnabled) return;
                this._live2D.raf = requestAnimationFrame(loop);
                const a = this.audioElement; const t = a && !isNaN(a.currentTime) ? a.currentTime : 0;
                // Clear
                ctx.clearRect(0,0,c.width,c.height);
                // Choose dominant viseme by weight
                let best = 'REST'; let bw = 0;
                for (const nm of names){ const w = sample1D(curves.tracks.visemes[nm], t); if (w>bw){ bw=w; best=nm; } }
                // If full-frame images are available, swap the background image instead of only mouth
                if (this.fullFrameVisemesEnabled && this._live2D.full && this._live2D.full.images[best]){
                    if (this._live2D.full.last !== best) {
                        const bg = document.getElementById('avatar-background');
                        const entry = this._live2D.full.images[best];
                        if (bg && entry) {
                            // Handle two modes: full-frame URL string OR patch object {image, patch}
                            if (typeof entry === 'object' && entry.image && entry.patch) {
                                // Keep white background; overlay patch image at precise position
                                const ov = this._live2D.full.overlay;
                                const frame = this._live2D.full.frame;
                                if (ov && frame && frame.w > 0 && frame.h > 0) {
                                    ov.src = entry.image.src;
                                    const px = entry.patch.x / frame.w * 100;
                                    const py = entry.patch.y / frame.h * 100;
                                    const pw = entry.patch.w / frame.w * 100;
                                    const ph = entry.patch.h / frame.h * 100;
                                    ov.style.left = px + '%';
                                    ov.style.top = py + '%';
                                    ov.style.width = pw + '%';
                                    ov.style.height = ph + '%';
                                    ov.style.display = 'block';
                                } else if (ov) {
                                    // Fallback: full overlay
                                    ov.src = entry.image.src;
                                    ov.style.left = '0'; ov.style.top = '0';
                                    ov.style.width = '100%'; ov.style.height = '100%';
                                    ov.style.display = 'block';
                                }
                            } else {
                                const im = entry;
                                const url = im.src;
                                bg.style.backgroundImage = `url('${url}')`;
                                if (this._live2D.full.overlay) this._live2D.full.overlay.style.display = 'none';
                            }
                            this._live2D.full.last = best;
                        }
                    }
                } else {
                    const img = this._live2D.images[`mouth_${best}`];
                    if (img && img.complete) {
                        // Draw centered; refine with rig bbox offsets
                        const W = c.width, H=c.height; const iw = img.width, ih=img.height;
                        const scale = Math.min(W/iw, H/ih);
                        const dw = iw*scale, dh=ih*scale;
                        ctx.drawImage(img, (W-dw)/2, (H-dh)/2, dw, dh);
                    }
                }
                // TODO: eyelids/pupils rendering aligned to rig once calibration added
            };
            if (this._live2D.raf) cancelAnimationFrame(this._live2D.raf);
            this._live2D.raf = requestAnimationFrame(loop);
        } catch {}
    }

    async _requestPhonemesBackend(text, avatar) {
        try {
            const lang = this.currentVariant.language || 'english';
            const voiceId = avatar;
            const res = await fetch('/api/tts/phonemes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId, lang, sampleRate: 44100 })
            });
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    }

    _synthesizePhonemesFromText(text) {
        try {
            const words = String(text).split(/\s+/).filter(Boolean);
            const phonemes = [];
            let t = 0;
            for (const w of words) {
                const dur = Math.min(0.7, Math.max(0.18, w.length * 0.06));
                const units = ['A','E','I','DNTL','R'];
                const seg = dur / Math.max(1, units.length);
                let tt = t;
                for (const u of units) { phonemes.push({ p: u, start: tt, end: tt + seg, src: u }); tt += seg; }
                t += dur + 0.06;
            }
            return phonemes;
        } catch { return []; }
    }

    _buildVisemeCurvesFromPhonemes(phonemeList) {
        const tracks = { visemes: {} };
        for (const name of this.VISEMES) tracks.visemes[name] = [];
        const attack = 0.06, decay = 0.08;
        for (const ph of (phonemeList||[])) {
            const src = String(ph.src || ph.p || '').toUpperCase();
            const vname = this.PHONEME_TO_VISEME[src] || src;
            if (!tracks.visemes[vname]) continue;
            const t0 = Math.max(0, Number(ph.start)||0);
            const t1 = Math.max(t0, Number(ph.end)||t0+0.12);
            const peak = Math.min(0.85, vname==='MBP' ? 0.9 : 0.8);
            const a1 = t0 + Math.min(attack, (t1-t0)*0.4);
            const d1 = t1 - Math.min(decay, (t1-t0)*0.4);
            tracks.visemes[vname].push({ t: t0, v: 0 });
            tracks.visemes[vname].push({ t: a1, v: peak });
            tracks.visemes[vname].push({ t: Math.max(a1, d1), v: peak * 0.9 });
            tracks.visemes[vname].push({ t: t1, v: 0 });
        }
        let maxT = 0;
        for (const arr of Object.values(tracks.visemes)) { if (arr.length) maxT = Math.max(maxT, arr[arr.length-1].t||0); }
        return { meta: { avatarId: this.currentVariant.avatar||'kelly', visemeSet: this.VISEMES.join(','), version: '1.0' }, duration: maxT, tracks };
    }

    /**
     * Request a talking‑head generation job and begin polling for completion.
     * audioBlobUrl is a blob: URL for current audio; backend should be able to fetch via relay if needed.
     */
    async _requestTalkingHead(narration, avatar, audioBlobUrl) {
        try {
            if (!this.avatarVideoEl) return;
            // Cancel any prior poll for previous line
            this._cancelTalkingHeadPoll();

            const imageUrl = this._getAvatarNeutralImageUrl(avatar);
            const textHash = await this._sha1(narration + '|' + avatar);
            let uploadedAudioUrl = null;
            try {
                if (audioBlobUrl && String(audioBlobUrl).startsWith('blob:')) {
                    const resp = await fetch(audioBlobUrl);
                    const blob = await resp.blob();
                    const form = new FormData();
                    form.append('file', blob, 'audio.mp3');
                    const up = await fetch('/api/talking-head/upload', { method: 'POST', body: form });
                    if (up.ok) {
                        const uj = await up.json();
                        uploadedAudioUrl = uj.audioUrl || null;
                    }
                }
            } catch {}
            const payload = {
                avatar,
                imageUrl,
                // The client cannot expose blob: URLs cross‑origin; server should accept text and synthesize or the
                // environment should provide a relay to upload the blob. We pass a hint hash for caching.
                text: narration,
                textHash,
                audioUrl: uploadedAudioUrl || undefined,
                fps: 30,
                resolution: 720,
                enhance: { engine: 'gfpgan', strength: 0.35 },
                pose_scale: 0.4,
                expression_scale: 1.0,
                seed: (avatar === 'kelly') ? 221133 : 994411
            };
            // Cache lookup
            const cacheKey = `${avatar}::${textHash}`;
            try {
                const cached = this.talkingHeadCache.get(cacheKey);
                if (cached) { this._playAvatarVideo(cached); return; }
            } catch {}

            const res = await fetch('/api/talking-head/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('talking-head job create failed');
            const j = await res.json();
            const jobId = j.id || j.jobId;
            if (!jobId) return;
            this._talkJob = { id: jobId };
            this._pollTalkingHead(jobId, textHash, cacheKey);
        } catch (e) {
            // Silent fallback; audio continues
        }
    }

    _cancelTalkingHeadPoll() {
        try {
            if (this._talkJob?.timer) clearInterval(this._talkJob.timer);
            this._talkJob = null;
        } catch {}
    }

    _pollTalkingHead(jobId, textHash, cacheKey) {
        try {
            const intervalMs = 1000;
            const maxWaitMs = 30000;
            const start = Date.now();
            this._talkJob = this._talkJob || { id: jobId };
            this._talkJob.timer = setInterval(async () => {
                try {
                    if (Date.now() - start > maxWaitMs) { this._cancelTalkingHeadPoll(); return; }
                    const r = await fetch(`/api/talking-head/jobs/${encodeURIComponent(jobId)}`);
                    if (!r.ok) return; const j = await r.json();
                    if (j.status === 'succeeded' && (j.videoUrl || j.video_url)) {
                        this._cancelTalkingHeadPoll();
                        const url = j.videoUrl || j.video_url;
                        try { if (cacheKey) this.talkingHeadCache.set(cacheKey, url); } catch {}
                        this._playAvatarVideo(url);
                    } else if (j.status === 'failed') {
                        this._cancelTalkingHeadPoll();
                    }
                } catch {}
            }, intervalMs);
        } catch {}
    }

    _getAvatarNeutralImageUrl(avatar) {
        try {
            if (avatar === 'kelly') {
                // Prefer optimized base state if available
                return '/production-deploy/assets/avatars/kelly/optimized/base-states/kelly_neutral_default.png';
            }
            if (avatar === 'ken') {
                return '/production-deploy/assets/avatars/ken/ken_neutral_default.png';
            }
        } catch {}
        return `/production-deploy/assets/avatars/${avatar}/${avatar}_neutral_default.png`;
    }

    /**
     * Optional viseme overlay for debugging: draws per‑viseme weights on #avatar-mouth
     */
    _driveMouthOverlay(){
        try {
            const canvas = document.getElementById('avatar-mouth'); if (!canvas) return;
            const ctx = canvas.getContext('2d'); if (!ctx) return;
            const curves = window.__avatar_curves__ || null; if (!curves?.tracks?.visemes) return;
            const a = this.audioElement; if (!a) return;
            const names = Object.keys(curves.tracks.visemes);
            const w = canvas.width, h = canvas.height; const pad = 20; const barW = (w - pad*2) / Math.max(1, names.length);
            const sample1D = (track, t)=>{
                if (!track || !track.length) return 0;
                if (t<=track[0].t) return track[0].v; const last=track[track.length-1]; if (t>=last.t) return last.v;
                let lo=0,hi=track.length-1; while(hi-lo>1){ const mid=(lo+hi)>>1; (track[mid].t<=t)?lo=mid:hi=mid; }
                const A=track[lo],B=track[hi]; const u=(t-A.t)/Math.max(1e-6,(B.t-A.t)); return A.v*(1-u)+B.v*u;
            };
            const draw = ()=>{
                if (a.paused) return;
                const t = a.currentTime || 0;
                ctx.clearRect(0,0,w,h);
                names.forEach((nm, i)=>{
                    const v = sample1D(curves.tracks.visemes[nm], t);
                    const x = pad + i*barW + 4; const y = h - pad; const bh = (h - pad*2) * v;
                    ctx.fillStyle = '#007AFF'; ctx.globalAlpha = 0.9; ctx.fillRect(x, y - bh, barW - 8, bh);
                    ctx.globalAlpha = 1; ctx.fillStyle = '#222'; ctx.font = '20px -apple-system, BlinkMacSystemFont, Helvetica'; ctx.fillText(nm, x, h - 2);
                });
                requestAnimationFrame(draw);
            };
            canvas.style.opacity = '1';
            requestAnimationFrame(draw);
        } catch {}
    }

    _playAvatarVideo(videoUrl) {
        try {
            const v = this.avatarVideoEl; if (!v) return;
            v.src = String(videoUrl);
            // Choose audio source: prefer unified video audio when flagged
            let useVideoAudio = !!this.useVideoAudioPreferred;
            v.muted = !useVideoAudio;
            v.loop = false;
            v.style.display = 'block';
            const startPlayback = async () => {
                try {
                    const a = this.audioElement;
                    if (useVideoAudio) {
                        // Pause separate audio and let video carry AV sync
                        try { a?.pause(); } catch {}
                        try { v.volume = (typeof a?.volume === 'number') ? a.volume : 1.0; } catch {}
                        await v.play().catch(()=>{});
                    } else {
                        // Align A/V with separate audio
                        if (a && !isNaN(a.currentTime)) {
                            try { v.currentTime = a.currentTime; } catch {}
                        }
                        await v.play().catch(()=>{});
                        this._syncVideoToAudio();
                    }
                    // Fade in the video surface
                    requestAnimationFrame(()=>{ v.style.opacity = '1'; });
                } catch {}
            };
            if (v.readyState >= 2) { startPlayback(); }
            else { v.addEventListener('loadeddata', startPlayback, { once: true }); }
        } catch {}
    }

    _hideAvatarVideo() {
        try {
            const v = this.avatarVideoEl; if (!v) return;
            v.style.opacity = '0';
            v.style.display = 'none';
            try { v.pause(); } catch {}
        } catch {}
    }

    _syncVideoToAudio() {
        try {
            if (this._syncTimer) clearInterval(this._syncTimer);
            const v = this.avatarVideoEl; const a = this.audioElement; if (!v || !a) return;
            this._syncTimer = setInterval(() => {
                try {
                    if (v.paused || a.paused) return;
                    const drift = (v.currentTime || 0) - (a.currentTime || 0);
                    const abs = Math.abs(drift);
                    if (abs > 0.25) {
                        // Hard re-sync on large drift
                        v.currentTime = a.currentTime;
                    } else if (abs > 0.06) {
                        // Micro nudge
                        const adjust = (drift > 0) ? 0.98 : 1.02;
                        v.playbackRate = adjust;
                    } else {
                        v.playbackRate = 1.0;
                    }
                } catch {}
            }, 250);
        } catch {}
    }

    async _sha1(text) {
        try {
            const data = new TextEncoder().encode(text);
            const hash = await crypto.subtle.digest('SHA-1', data);
            return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
        } catch { return String(text).length + '_na'; }
    }

    /**
     * Update inspector panels with live state, content, and DNA
     */
    updateInspectors() {
        try {
            const stateTarget = document.getElementById('state-inspector-content');
            const contentTarget = document.getElementById('content-inspector-content');
            const codeTarget = document.getElementById('code-inspector-content');

            if (stateTarget) {
                const state = {
                    day: this.selectedDay || this.currentDay,
                    phaseIndex: this.currentPhase,
                    phaseId: this.lessonPhases[this.currentPhase] || null,
                    isPlaying: this.isPlaying,
                    playbackSpeed: this.playbackSpeed,
                    volume: this.volume,
                    variant: { ...this.currentVariant },
                    timers: { hasNoChoiceTimer: !!this.phaseTimers?.noChoice },
                    answers: this.userAnswers || []
                };
                stateTarget.textContent = JSON.stringify(state, null, 2);
            }

            if (contentTarget) {
                const preview = {
                    introduction: this.universalContent?.introduction || null,
                    questions: (this.universalContent?.questions || []).map(q => ({
                        question: typeof q === 'string' ? q : q?.question,
                        choices: typeof q === 'string' ? [] : q?.choices
                    })),
                    conclusion: this.universalContent?.conclusion || null,
                    fortune: this.universalContent?.fortune || null
                };
                contentTarget.textContent = JSON.stringify(preview, null, 2);
            }

            if (codeTarget) {
                const dnaView = this.currentDNA ? (
                    this.currentDNA.metadata?.version === 'phase_v1' ? this.currentDNA : { schema: 'legacy_or_normalized', sample: this.currentDNA?.lesson_metadata || this.currentDNA?.metadata || {} }
                ) : { info: 'No DNA loaded yet' };
                const payload = { dna: dnaView, warnings: this.dnaWarnings || [] };
                codeTarget.textContent = JSON.stringify(payload, null, 2);
            }
        } catch {}
    }

    /**
     * Preload avatar assets to reduce flicker
     */
    preloadAvatarAssets(avatar) {
        try {
            const base = `/production-deploy/assets/avatars/${avatar}`;
            const paths = [
                `${base}/${avatar}_neutral_default.png`,
                `${base}/lesson-sequence/${avatar}_teaching_explaining.png`,
                `${base}/lesson-sequence/${avatar}_question_curious.png`,
                `${base}/emotional-expressions/${avatar}_concerned_thinking.png`,
                `${base}/emotional-expressions/${avatar}_happy_celebrating.png`
            ];
            paths.forEach(p => { const img = new Image(); img.src = p; });
        } catch {}
    }

    /**
     * Show loading
     */
    showLoading() {
        console.log('⏳ Loading...');
    }

    /**
     * Hide loading
     */
    hideLoading() {
        console.log('✅ Loading complete');
    }
}

// Lesson player will be initialized by index.html to avoid double initialization 

// Manifest-driven minimal player API (dev + prod)
if (typeof window !== 'undefined') {
  const listeners = new Map();
  const emit = (evt, data) => { (listeners.get(evt) || []).forEach(fn => { try { fn(data); } catch {} }); };
  const on = (evt, fn) => { const arr = listeners.get(evt) || []; arr.push(fn); listeners.set(evt, arr); };
  function prox(url){
    try {
      const p = window.DEV_PROXY_URL;
      if (p && /^https?:/i.test(url)) return `${p}${encodeURIComponent(url)}`;
    } catch {}
    return url;
  }
  async function fetchWithRetry(url, opts={}, retries=3, backoffMs=250){
    let lastErr = null; let attempt = 0; const max = Math.max(0, retries);
    while(attempt <= max){
      try {
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch(e){
        lastErr = e; attempt++;
        if (attempt>max) break;
        const jitter = Math.random()*backoffMs;
        await new Promise(r=>setTimeout(r, backoffMs + jitter));
      }
    }
    throw lastErr || new Error('fetch failed');
  }

  // Unified audio fetch + buffer with Safari fallback from .opus → .m4a
  async function fetchAndBufferAudio(player, url, opts={}){
    const u = String(url);
    const res = await fetchWithRetry(prox(u), opts);
    const ab = await res.arrayBuffer();
    try {
      if (/\.opus($|\?)/i.test(u)) {
        return await player._audio.appendChunk(ab);
      } else {
        const buf = await player._audio.decodeOpus(ab);
        player._audio.scheduleBuffer(buf);
        return player._audio.getBufferedSeconds();
      }
    } catch (e) {
      if (/\.opus($|\?)/i.test(u)) {
        // Try m4a fallback
        const alt = u.replace(/\.opus(\?.*)?$/i, '.m4a$1');
        const r2 = await fetchWithRetry(prox(alt), opts);
        const ab2 = await r2.arrayBuffer();
        const buf2 = await player._audio.decodeOpus(ab2);
        player._audio.scheduleBuffer(buf2);
        return player._audio.getBufferedSeconds();
      }
      throw e;
    }
  }

  // Minimal protobuf reader for specific message shapes (proto3)
  class PbReader {
    constructor(buf){ this.v = new DataView(buf.buffer || buf); this.o = 0; }
    eof(){ return this.o >= this.v.byteLength; }
    uint8(){ const x = this.v.getUint8(this.o); this.o += 1; return x; }
    varint(){ let x = 0n, s = 0n; while(!this.eof()){ const b = BigInt(this.uint8()); x |= (b & 0x7fn) << s; if ((b & 0x80n) === 0n) break; s += 7n; } return Number(x); }
    f32(){ const x = this.v.getFloat32(this.o, true); this.o += 4; return x; }
    bytes(len){ const a = new Uint8Array(this.v.buffer, this.o, len); this.o += len; return a; }
    str(len){ const a = this.bytes(len); try { return new TextDecoder('utf-8').decode(a); } catch { return ''; } }
  }

  function readLen(reader){ const len = reader.varint(); return len; }

  function decodeVisemeTimeline(u8){
    const r = new PbReader(u8);
    const out = { schema_version: '', phoneme_map_id: '', frames: [] };
    while(!r.eof()){
      const tag = r.varint(); const fn = tag >>> 3; const wt = tag & 7;
      if (fn === 1 && wt === 2){ const len = readLen(r); out.schema_version = r.str(len); continue; }
      if (fn === 2 && wt === 2){ const len = readLen(r); out.phoneme_map_id = r.str(len); continue; }
      if (fn === 3 && wt === 2){
        const len = readLen(r); const sub = new PbReader(r.bytes(len));
        const f = { t_ms: 0, viseme_id: 0, weight: 1.0 };
        while(!sub.eof()){
          const t2 = sub.varint(); const fno = t2 >>> 3; const w2 = t2 & 7;
          if (fno === 1 && w2 === 0){ f.t_ms = sub.varint(); continue; }
          if (fno === 2 && w2 === 0){ f.viseme_id = sub.varint(); continue; }
          if (fno === 3 && w2 === 5){ f.weight = sub.f32(); continue; }
          // skip unknown
          if (w2 === 2){ const l = readLen(sub); sub.o += l; } else if (w2 === 0){ sub.varint(); } else if (w2 === 5){ sub.o += 4; } else if (w2 === 1){ sub.o += 8; } else { break; }
        }
        out.frames.push(f); continue;
      }
      // skip unknown field
      if (wt === 2){ const l = readLen(r); r.o += l; } else if (wt === 0){ r.varint(); } else if (wt === 5){ r.o += 4; } else if (wt === 1){ r.o += 8; } else { break; }
    }
    return out;
  }

  function decodeExpressionTracks(u8){
    const r = new PbReader(u8);
    const out = { schema_version: '', channels: [] };
    while(!r.eof()){
      const tag = r.varint(); const fn = tag >>> 3; const wt = tag & 7;
      if (fn === 1 && wt === 2){ const len = readLen(r); out.schema_version = r.str(len); continue; }
      if (fn === 2 && wt === 2){
        const len = readLen(r); const sub = new PbReader(r.bytes(len));
        const ch = { id: '', keys: [] };
        while(!sub.eof()){
          const t2 = sub.varint(); const fno = t2 >>> 3; const w2 = t2 & 7;
          if (fno === 1 && w2 === 2){ const l = readLen(sub); ch.id = sub.str(l); continue; }
          if (fno === 2 && w2 === 2){
            const l2 = readLen(sub); const s2 = new PbReader(sub.bytes(l2));
            const k = { t_ms: 0, v: 0 };
            while(!s2.eof()){
              const t3 = s2.varint(); const f3 = t3 >>> 3; const w3 = t3 & 7;
              if (f3 === 1 && w3 === 0){ k.t_ms = s2.varint(); continue; }
              if (f3 === 2 && w3 === 5){ k.v = s2.f32(); continue; }
              if (w3 === 2){ const l3 = readLen(s2); s2.o += l3; } else if (w3 === 0){ s2.varint(); } else if (w3 === 5){ s2.o += 4; } else if (w3 === 1){ s2.o += 8; } else { break; }
            }
            ch.keys.push(k); continue;
          }
          if (w2 === 2){ const l = readLen(sub); sub.o += l; } else if (w2 === 0){ sub.varint(); } else if (w2 === 5){ sub.o += 4; } else if (w2 === 1){ sub.o += 8; } else { break; }
        }
        out.channels.push(ch); continue;
      }
      if (wt === 2){ const l = readLen(r); r.o += l; } else if (wt === 0){ r.varint(); } else if (wt === 5){ r.o += 4; } else if (wt === 1){ r.o += 8; } else { break; }
    }
    return out;
  }

  const ManifestPlayer = {
    _manifest: null,
    _slideIndex: 0,
    _audio: null,
    _buffers: [],
    _prepared: false,
    _isPlaying: false,
    _slideStartAtAudioTime: 0,
    _currentChunkIndex: 0,
    _prefetchTimer: null,
    _prefetchAbort: null,
    _stallTimer: null,
    _captions: { container: null, cues: [], words: [], raf: null },
    _popup: { host: null, hostRight: null, hostLeft: null, shownId: null, raf: null },
    _timelines: {},
    _resolver: null,
    _applyPhonemesHookInstalled: false,
    setManifestResolver(fn){ this._resolver = typeof fn === 'function' ? fn : null; },
    _emitProgress(type, extra={}){
      try {
        const evt = { type, slide_index: this._slideIndex, ts: Date.now(), ...extra };
        emit('progress_event', evt);
        // Optional POST only when dev proxy is present
        if (window.DEV_PROXY_URL) {
          const url = `${window.DEV_PROXY_URL}${encodeURIComponent('https://api.ilearnhow.com/api/v1/progress')}`;
          fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(evt) }).catch(()=>{});
        }
      } catch {}
    },
    mountCaptions(containerEl){ this._captions.container = containerEl || null; },
    mountPopupHost(hostEl){ this._popup.host = hostEl || null; },
    mountPopupHosts(rightEl, leftEl){ this._popup.hostRight = rightEl || null; this._popup.hostLeft = leftEl || null; },
    _parseVtt(text){
      const lines = String(text||'').split(/\r?\n/);
      const cues = [];
      let i=0; while(i<lines.length){
        const l = lines[i].trim(); i++;
        if (!l || /^WEBVTT/i.test(l)) continue;
        // Expected: 00:00:01.000 --> 00:00:02.500
        const m = l.match(/(\d\d:\d\d:\d\d[.,]\d+|\d+:\d\d[.,]\d+)\s*-->\s*(\d\d:\d\d:\d\d[.,]\d+|\d+:\d\d[.,]\d+)/);
        if (!m) continue;
        const start = m[1]; const end = m[2];
        const toMs = (t)=>{
          const s = t.replace(',', '.');
          const parts = s.split(':').map(Number);
          if (parts.length===3){ return ((parts[0]*3600)+(parts[1]*60)+parts[2]) * 1000; }
          if (parts.length===2){ return ((parts[0]*60)+parts[1]) * 1000; }
          return 0;
        };
        let textLines=[]; while(i<lines.length && lines[i].trim()!==''){ textLines.push(lines[i]); i++; }
        cues.push({ startMs: toMs(start), endMs: toMs(end), text: textLines.join('\n') });
      }
      return cues;
    },
    async _loadCaptionsForSlide(slide){
      try {
        if (!this._captions.container) return;
        const url = slide.captions_vtt_uri; if (!url) return;
        const res = await fetch(prox(url));
        if (!res.ok) return;
        const txt = await res.text();
        this._captions.cues = this._parseVtt(txt);
        // optional words.json for read-along
        this._captions.words = [];
        if (slide.word_timing_json_uri) {
          try { const wr = await fetch(prox(slide.word_timing_json_uri)); if (wr.ok) { const j = await wr.json(); this._captions.words = Array.isArray(j?.words) ? j.words : []; } } catch {}
        }
      } catch {}
    },
     _startCaptionsTicker(){
      if (!this._captions.container) return;
      cancelAnimationFrame(this._captions.raf);
      const tick = ()=>{
        try {
          if (!this._captions.container) return;
          const now = this._audio?.ctx?.currentTime || 0;
          // Gate: don't render read-along until audio actually starts
          if (now < (this._slideStartAtAudioTime - 0.01)) { this._captions.container.textContent=''; this._captions.container.removeAttribute('aria-label'); this._captions.raf = requestAnimationFrame(tick); return; }
          const tMs = Math.max(0, (now - this._slideStartAtAudioTime) * 1000);
          // Micro-adjust using audio RMS onset: if speech starts and we are before first word, nudge
          try {
            const rms = this._audio?.getRms ? this._audio.getRms() : 0;
            if (rms > 0.015 && this._captions.words && this._captions.words.length){
              const first = this._captions.words[0];
              if (tMs + 80 < first.start_ms){
                // align slide start so words catch up to audio
                const deltaMs = (first.start_ms - (tMs+80));
                this._slideStartAtAudioTime -= (deltaMs/1000);
                console.debug('[read-along] onset align: -', deltaMs.toFixed(1),'ms');
              }
            }
          } catch {}
          const slide = this._manifest?.slides?.[this._slideIndex];
          const wordsAll = this._captions.words || [];
          const useReadAlong = wordsAll.length > 0;
          if (useReadAlong && slide && Array.isArray(slide.sentence_boundaries_ms)){
            const bounds = slide.sentence_boundaries_ms;
            let si = 0; for (let i=0;i<bounds.length-1;i++){ if (tMs >= bounds[i] && tMs <= bounds[i+1]) { si = i; break; } }
            const startB = bounds[si] ?? 0; const endB = bounds[si+1] ?? (startB + 4000);
            const tol = 80;
            const words = wordsAll.filter(w=> (w.end_ms >= (startB - tol)) && (w.start_ms <= (endB + tol)));
            const html = words.map(w=>{
              const active = (tMs >= (w.start_ms - 20) && tMs <= (w.end_ms + 20));
              return `<span style="${active? 'background: rgba(255,230,180,.9); border-radius:4px; padding:1px 2px;' : ''}">${String(w.w)}</span>`;
            }).join(' ');
            this._captions.container.innerHTML = html;
            this._captions.container.setAttribute('aria-label', words.map(w=>w.w).join(' '));
            if (window.localStorage.getItem('READALONG_DEBUG')==='1'){
              const ww = words.find(w=> tMs >= w.start_ms && tMs <= w.end_ms);
              console.debug('[read-along]', { tMs: Math.floor(tMs), word: ww?.w, start: ww?.start_ms, end: ww?.end_ms, sentenceIndex: si });
            }
          } else {
            // Fallback to caption cue blocks
            const cue = this._captions.cues.find(c=> tMs >= c.startMs && tMs <= c.endMs);
            if (!cue) { this._captions.container.textContent=''; this._captions.container.removeAttribute('aria-label'); }
            else {
              this._captions.container.textContent = cue.text;
              this._captions.container.setAttribute('aria-label', cue.text);
            }
          }
          // Positioning: center below chin over collar, two-line wrap (avoid face-safe zone)
          try {
            const el = this._captions.container;
            el.style.position = 'fixed';
            el.style.left = '50%';
            el.style.right = 'auto';
            el.style.transform = 'translateX(-50%)';
            el.style.bottom = '21vh'; // stays below the 30–55% face-safe band
            el.style.maxWidth = (document.body.classList.contains('compact') ? '46%' : '52%');
            el.style.textAlign = 'center';
            el.style.lineHeight = (document.body.classList.contains('compact') ? '1.2' : '1.25');
            el.style.fontSize = (document.body.classList.contains('compact') ? '15px' : '16px');
            el.style.color = '#222';
            el.style.background = 'rgba(255,255,255,0.9)';
            el.style.borderRadius = '12px';
            el.style.padding = (document.body.classList.contains('compact') ? '8px 10px' : '10px 12px');
            el.style.boxShadow = '0 6px 20px rgba(0,0,0,.16)';
            el.style.textShadow = 'none';
            el.style.whiteSpace = 'normal';
            el.style.wordBreak = 'break-word';
            // Natural wrap to avoid ellipsis/cutoff (no mask)
            el.style.display = 'block';
            el.style.overflow = 'visible';
            el.style.maxHeight = 'none';
          } catch{}
        } catch {}
        this._captions.raf = requestAnimationFrame(tick);
      };
      this._captions.raf = requestAnimationFrame(tick);
    },
    _stopCaptionsTicker(){ cancelAnimationFrame(this._captions.raf); this._captions.raf=null; if (this._captions.container) this._captions.container.textContent=''; },
    async _loadTimelinesForSlide(slideIndex){
      try {
        const slide = this._manifest.slides[slideIndex];
        const resV = await fetchWithRetry(prox(slide.viseme_timeline_pb_uri));
        const resE = await fetchWithRetry(prox(slide.expression_tracks_pb_uri));
        const u8v = new Uint8Array(await resV.arrayBuffer());
        const u8e = new Uint8Array(await resE.arrayBuffer());
        const vis = decodeVisemeTimeline(u8v);
        const expr = decodeExpressionTracks(u8e);
        this._timelines[slideIndex] = { vis, expr };
      } catch (e) { /* optional: log in dev */ }
    },
    _startAnimTicker(){
      cancelAnimationFrame(this._animRaf);
      const tick = ()=>{
        try {
          const idx = this._slideIndex; const line = this._timelines[idx]; if (!line) { this._animRaf = requestAnimationFrame(tick); return; }
          const tMs = Math.max(0, (this._audio?.ctx?.currentTime - this._slideStartAtAudioTime) * 1000);
          // Viseme
          const frames = line.vis?.frames || [];
          let currentVis = frames.length ? frames[0] : null;
          for (let i=0; i<frames.length; i++){ if (frames[i].t_ms <= tMs) currentVis = frames[i]; else break; }
          // Expression channels (example: blink)
          const chBlink = (line.expr?.channels || []).find(c=>c.id==='blink');
          if (chBlink){
            const k = chBlink.keys.find(k=>k.t_ms>=tMs) || chBlink.keys[chBlink.keys.length-1];
            // noop; could toggle CSS based on k.v
          }
          // Hook: when viseme changes significantly, update avatar expression heuristically
          if (currentVis){
            const v = currentVis.viseme_id;
            if (v === 0) { /* silence */ }
            else if (v % 3 === 0) this.updateAvatar(this.currentVariant.avatar, 'teaching_explaining');
            else this.updateAvatar(this.currentVariant.avatar, 'question_curious');
          }
        } catch {}
        this._animRaf = requestAnimationFrame(tick);
      };
      this._animRaf = requestAnimationFrame(tick);
    },
    _stopAnimTicker(){ cancelAnimationFrame(this._animRaf); this._animRaf = null; },
    // Breathing overlay ticker (box breathing) — optional per slide via overlay_plan
    _startOverlayTicker(){
      cancelAnimationFrame(this._overlayRaf);
      try {
        const slide = this._manifest?.slides?.[this._slideIndex];
        const plan = slide && slide.overlay_plan; // { type:'box_breath', cadence:[ms,ms,ms,ms], cycles:n }
        if (!plan || plan.type !== 'box_breath') { if (this._overlayEl) this._overlayEl.style.display='none'; return; }
        if (!this._overlayEl){
          const d = document.createElement('div');
          d.id = 'breath-overlay';
          d.style.position='fixed'; d.style.left='50%'; d.style.transform='translateX(-50%)';
          d.style.bottom='26vh'; d.style.width='72px'; d.style.height='72px'; d.style.borderRadius='999px';
          d.style.background='rgba(255,255,255,0.96)'; d.style.boxShadow='0 8px 22px rgba(0,0,0,.14)'; d.style.zIndex='3100'; d.style.display='none';
          document.body.appendChild(d); this._overlayEl = d;
        }
        const el = this._overlayEl; el.style.display='block';
        const cadence = Array.isArray(plan.cadence)&&plan.cadence.length===4? plan.cadence : [4000,4000,4000,4000];
        const cycles = Math.max(1, plan.cycles||2);
        const keyframes=[]; for(let i=0;i<cycles;i++){ keyframes.push(...cadence); }
        const total = keyframes.reduce((a,b)=>a+b,0);
        const min=72, max=164, rng=max-min;
        const tick = ()=>{
          try{
            const now = this._audio?.ctx?.currentTime || 0;
            const tMs = Math.max(0, (now - this._slideStartAtAudioTime) * 1000);
            const phase = keyframes.length? (tMs % total) : 0;
            let acc=0, seg=0; for(let i=0;i<keyframes.length;i++){ acc+=keyframes[i]; if (phase<=acc){ seg=i%4; break; } }
            const segDur = keyframes[seg]||1; const segStart = acc - segDur; const segPos = Math.max(0, Math.min(1, (phase - segStart)/segDur));
            let px=min; if (seg===0) px=min+rng*segPos; else if(seg===1) px=max; else if(seg===2) px=max-rng*segPos; else px=min;
            el.style.width=`${Math.floor(px)}px`; el.style.height=`${Math.floor(px)}px`;
          }catch{}
          this._overlayRaf = requestAnimationFrame(tick);
        };
        this._overlayRaf = requestAnimationFrame(tick);
      } catch {}
    },
    _stopOverlayTicker(){ cancelAnimationFrame(this._overlayRaf); this._overlayRaf=null; if (this._overlayEl) this._overlayEl.style.display='none'; },
    _startPopupTicker(){
      cancelAnimationFrame(this._popup.raf);
      const single = this._popup.host && !(this._popup.hostRight || this._popup.hostLeft);
      const hostRight = this._popup.hostRight || (single ? this._popup.host : null);
      const hostLeft = this._popup.hostLeft || null;
      const ensurePos = (el, side)=>{ if (!el) return; el.style.position='fixed'; el.style.zIndex='3200'; el.style.top='8vh'; el.style.bottom='auto'; if (side==='right'){ el.style.right='20px'; el.style.left=''; } else { el.style.left='20px'; el.style.right=''; } };
      ensurePos(hostRight,'right'); ensurePos(hostLeft,'left');
      const tick = ()=>{
        try {
          const slide = this._manifest.slides[this._slideIndex];
          const now = this._audio?.ctx?.currentTime || 0;
          const tMs = Math.max(0, (now - this._slideStartAtAudioTime) * 1000);
          // Clues as hover tooltips only (no auto popups during playback)
          const payload = slide.popup_payload || null; const tpl = slide.popup_template_id || null;
          if (payload && tpl){
            // Time-gate the appearance of the button if at_ms provided
            const ready = typeof payload.at_ms === 'number' ? tMs >= payload.at_ms : true;
            const side = String(payload.side||'right').toLowerCase()==='left' ? 'left' : 'right';
            const target = side==='left' ? (hostLeft || hostRight) : (hostRight || hostLeft || this._popup.host);
            if (target){ ensurePos(target, side); }
            if (target && !target._tooltipInit){
              target._tooltipInit = true;
              const btn = document.createElement('button');
              btn.textContent = 'Learn more';
              btn.style.padding='8px 12px'; btn.style.fontSize='12px'; btn.style.borderRadius='16px'; btn.style.border='1px solid rgba(0,0,0,.12)'; btn.style.background='rgba(255,255,255,0.96)'; btn.style.cursor='pointer';
              btn.onmouseenter = ()=>{ target.innerHTML = renderPopup(tpl, payload); };
              btn.onmouseleave = ()=>{ target.innerHTML = ''; target.appendChild(btn); };
              target.appendChild(btn);
              target._btn = btn;
            }
            // toggle visibility based on time gate
            if (target && target._btn){ target.style.display = ready ? 'block' : 'none'; }
          } else {
            if (hostRight && hostRight.innerHTML) hostRight.innerHTML = '';
            if (hostLeft && hostLeft.innerHTML) hostLeft.innerHTML = '';
          }
          // Render Q&A chips (slides with qa): two horizontally aligned options below captions
          try {
            const s = slide.qa; if (s && Array.isArray(s.choices)){
              let deck = document.getElementById('qa-lower-deck');
              if (!deck){ deck = document.createElement('div'); deck.id='qa-lower-deck'; document.body.appendChild(deck); }
              // Keep Q&A chips away from the face: below captions and slightly lower in compact mode
              deck.style.position='fixed'; deck.style.bottom = (document.body.classList.contains('compact') ? '8vh' : '10vh'); deck.style.left='50%'; deck.style.transform='translateX(-50%)'; deck.style.display='flex'; deck.style.gap='20px'; deck.style.zIndex='3300'; deck.style.flexDirection='row'; deck.style.alignItems='center'; deck.style.pointerEvents='auto';
              if (deck._renderedSlide !== this._slideIndex){
                deck.innerHTML=''; deck._renderedSlide = this._slideIndex;
                s.choices.slice(0,2).forEach((c)=>{
                  const btn = document.createElement('button');
                  btn.textContent = c.text || c.id;
                  btn.style.padding = (document.body.classList.contains('compact') ? '10px 12px' : '14px 18px'); btn.style.fontSize=(document.body.classList.contains('compact') ? '15px' : '17px'); btn.style.borderRadius='999px'; btn.style.border='1px solid rgba(0,0,0,.12)'; btn.style.background='rgba(255,255,255,0.96)'; btn.style.boxShadow='0 8px 20px rgba(0,0,0,.14)'; btn.style.cursor='pointer'; btn.style.minWidth=(document.body.classList.contains('compact') ? '160px' : '220px');
                  btn.onmouseenter=()=>{ btn.style.background='rgba(255,255,255,1)'; };
                  btn.onmouseleave=()=>{ btn.style.background='rgba(255,255,255,0.96)'; };
                  btn.onclick = ()=>{
                    try { this._emitProgress('choice', { slide:this._slideIndex, choice:c.id }); } catch{}
                    // transient feedback bubble
                    try {
                      const fb = document.createElement('div');
                      fb.textContent = String(c.feedback||'');
                      fb.style.position='fixed'; fb.style.left='50%'; fb.style.transform='translateX(-50%)'; fb.style.bottom='16vh'; fb.style.fontSize='15px'; fb.style.padding='10px 14px'; fb.style.background='rgba(255,255,255,0.96)'; fb.style.border='1px solid rgba(0,0,0,.12)'; fb.style.borderRadius='12px'; fb.style.boxShadow='0 8px 22px rgba(0,0,0,.14)'; fb.style.zIndex='3350';
                      document.body.appendChild(fb); setTimeout(()=>{ try { fb.remove(); } catch{} }, 1200);
                    } catch{}
                    // auto-advance shortly after
                    setTimeout(()=>{ try { if (this._slideIndex < 4) this.seekToSlide(this._slideIndex+1); } catch{} }, 1300);
                  };
                  deck.appendChild(btn);
                });
              }
            } else {
              const deck = document.getElementById('qa-lower-deck'); if (deck){ deck.innerHTML=''; deck._renderedSlide = undefined; }
            }
          } catch{}
        } catch {}
        this._popup.raf = requestAnimationFrame(tick);
      };
      this._popup.raf = requestAnimationFrame(tick);
      function renderPopup(tpl, p){
        const withExtra = (inner)=>{
          const extra = p && p.extra_html ? `<div style='margin-top:8px'>${p.extra_html}</div>` : '';
          return `<div style="background:rgba(255,255,255,.92);color:#111;border-radius:12px;padding:12px 14px;max-width:320px;box-shadow:0 6px 24px rgba(0,0,0,.2);font-size:14px;">${inner}${extra}</div>`;
        };
        switch(String(tpl)){
          case 'quote_card': return withExtra(`<div style='font-weight:600'>&ldquo;${p.quote||''}&rdquo;</div>`);
          case 'list_points': {
            const items = Array.isArray(p.items)?p.items:[]; return withExtra(`<ul style='margin-left:18px'>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`);
          }
          case 'number_highlight': return withExtra(`<div style='font-size:26px;font-weight:700'>${p.value||0}<span style='font-size:13px;margin-left:6px'>${p.unit||''}</span></div><div>${p.label||''}</div>`);
          case 'definition_card': return withExtra(`<div><strong>${p.term||''}</strong></div><div>${p.definition||''}</div>`);
          default: return withExtra(`<div>${tpl}</div>`);
        }
      }
    },
    _stopPopupTicker(){ cancelAnimationFrame(this._popup.raf); this._popup.raf=null; if (this._popup.host) this._popup.host.innerHTML=''; },
    async _bufferFirstChunkOfSlide(nextIndex){
      try {
        if (!this._manifest) return false;
        if (nextIndex<0 || nextIndex>4) return false;
        const slide = this._manifest.slides[nextIndex];
        const first = slide?.audio_manifest?.chunks?.[0];
        if (!first) return false;
        await fetchAndBufferAudio(this, first);
        this._slideIndex = nextIndex;
        // Align slide clock to actual scheduled start of the just-scheduled buffer
        try { this._slideStartAtAudioTime = this._audio.getLastStartAt(); } catch { this._slideStartAtAudioTime = this._audio.ctx.currentTime + Math.max(0.01, this._audio.getBufferedSeconds()); }
        await this._loadCaptionsForSlide(slide); this._startCaptionsTicker();
      await this._loadTimelinesForSlide(this._slideIndex); this._startAnimTicker(); this._startPopupTicker(); this._startOverlayTicker();
        emit('slide_started', this._slideIndex);
        this._emitProgress('slide_started', { index: this._slideIndex });
        this._currentChunkIndex = 1; this._schedulePrefetch();
        return true;
      } catch { return false; }
    },
    async prepare(manifest){
      this._manifest = manifest; this._slideIndex = 0; this._prepared = false; this._buffers = [];
      this._audio = new window.BufferedOpusPlayer();
      this._currentChunkIndex = 0;
      // Autoplay policy: only start audio on first user interaction; expose a gate
      try {
        if (!this._autoplayArmed) {
          const arm = ()=>{ this._autoplayArmed = true; window.removeEventListener('click', arm); window.removeEventListener('keydown', arm); };
          window.addEventListener('click', arm, { once:true });
          window.addEventListener('keydown', arm, { once:true });
        }
      } catch {}
      // Dev validation (lightweight)
      try {
        const ok = Array.isArray(manifest?.slides) && manifest.slides.length===5 && manifest.slides.every(s=>s.captions_vtt_uri && s.audio_manifest && Array.isArray(s.audio_manifest.chunks));
        if (!ok) console.warn('Manifest appears incomplete; check api/schemas/manifest.schema.json');
      } catch {}
      // Prefetch first slide: protobufs (ignored here) and first audio chunk
      const slide = manifest.slides[0];
      const firstChunk = slide.audio_manifest?.chunks?.[0];
      if (firstChunk) {
        const buffered = await fetchAndBufferAudio(this, firstChunk);
        try { this._slideStartAtAudioTime = this._audio.getLastStartAt(); } catch { this._slideStartAtAudioTime = this._audio.ctx.currentTime + Math.max(0.01, this._audio.getBufferedSeconds()); }
        this._currentChunkIndex = 1;
        this._schedulePrefetch();
        emit('buffer', Math.floor(buffered * 1000));
      }
      await this._loadCaptionsForSlide(slide); this._startCaptionsTicker();
      await this._loadTimelinesForSlide(0); this._startAnimTicker(); this._startPopupTicker(); this._startOverlayTicker();
      this._prepared = true;
      this._startStallMonitor();
      // Install a global hook for test phoneme provider
      if (!this._applyPhonemesHookInstalled) {
        try {
          window.__applyPhonemes = (payload)=>{
            try {
              if (!payload || !payload.audioUrl || !Array.isArray(payload.phonemes)) return;
              // Ensure live rig path is active
              try { this.setLiveAvatarEnabled(true); } catch {}
              // Adopt provided audio into main audio element so the compositor can time off it
              if (!this.audioElement) this.audioElement = new Audio();
              this.audioElement.src = String(payload.audioUrl);
              this.audioElement.playbackRate = this.playbackSpeed || 1;
              // Autoplay policy: start muted so Safari allows playback; unmute on first user gesture
              try {
                this.audioElement.muted = true;
                const unmuteOnce = ()=>{ try { this.audioElement.muted = false; } catch{} window.removeEventListener('click', unmuteOnce); window.removeEventListener('keydown', unmuteOnce); };
                window.addEventListener('click', unmuteOnce, { once:true });
                window.addEventListener('keydown', unmuteOnce, { once:true });
              } catch{}
              this.audioElement.addEventListener('canplay', ()=>{ if (this._isPlaying || this.autoplay) this.audioElement.play().catch(()=>{}); });
              // Build viseme curves from phonemes and start the 2D loop
              const curves = this._buildVisemeCurvesFromPhonemes(payload.phonemes);
              window.__avatar_curves__ = curves;
              this._ensureLive2DCompositor();
              this._startLive2DLoop(curves);
              console.log('✅ Phonemes applied. frames:', payload.phonemes.length);
            } catch(e){ console.warn('applyPhonemes failed', e); }
          };
          this._applyPhonemesHookInstalled = true;
        } catch{}
      }
    },
    async play(){ if (!this._prepared) return; this._autoplayArmed = true; this._audio.resume(); this._isPlaying = true; emit('slide_started', this._slideIndex); this._emitProgress('play'); },
    pause(){ if (!this._prepared) return; this._audio.pause(); this._isPlaying = false; },
    stop(){ if (!this._prepared) return; this._audio.stop(); this._isPlaying = false; },
    async seekToSlide(i){
      if (!this._manifest) return;
      this._slideIndex = Math.max(0, Math.min(4, i));
      this._audio.stop(); this._currentChunkIndex = 0; this._stopCaptionsTicker();
      clearInterval(this._prefetchTimer); this._prefetchTimer = null; if (this._prefetchAbort) try { this._prefetchAbort.abort(); } catch {}
      const slide = this._manifest.slides[this._slideIndex];
      const firstChunk = slide.audio_manifest?.chunks?.[0];
      if (firstChunk) {
        await fetchAndBufferAudio(this, firstChunk);
        try { this._slideStartAtAudioTime = this._audio.getLastStartAt(); } catch { this._slideStartAtAudioTime = this._audio.ctx.currentTime + Math.max(0.01, this._audio.getBufferedSeconds()); }
        this._currentChunkIndex = 1; this._schedulePrefetch();
      }
      await this._loadCaptionsForSlide(slide); this._startCaptionsTicker();
      await this._loadTimelinesForSlide(this._slideIndex); this._startAnimTicker(); this._startPopupTicker(); this._startOverlayTicker();
      emit('slide_started', this._slideIndex); this._emitProgress('seek', { to: this._slideIndex });
    },
    _schedulePrefetch(){
      clearInterval(this._prefetchTimer);
      this._prefetchAbort = new AbortController();
      this._prefetchTimer = setInterval(async ()=>{
        try {
          const slide = this._manifest.slides[this._slideIndex];
          const chunks = slide.audio_manifest?.chunks || [];
          if (this._currentChunkIndex >= chunks.length) {
            // when last chunk drained, auto-advance to next slide
            const remaining = this._audio.getBufferedSeconds();
            // additional guard: make sure we've passed the end boundary/target duration so content isn't cut
            let pastEnd = true;
            try {
              const now = this._audio?.ctx?.currentTime || 0;
              const tMs = Math.max(0, (now - this._slideStartAtAudioTime) * 1000);
              const lastBoundary = (()=>{
                const arr = Array.isArray(slide.sentence_boundaries_ms) ? slide.sentence_boundaries_ms : [];
                return arr.length ? arr[arr.length-1] : 0;
              })();
              const target = Math.max(lastBoundary, slide.target_duration_ms||0);
              pastEnd = tMs >= (target - 150);
            } catch {}
            if (this._isPlaying && remaining < 0.5 && pastEnd) {
              const next = this._slideIndex + 1;
              if (next <= 4) { clearInterval(this._prefetchTimer); await this._bufferFirstChunkOfSlide(next); return; }
            }
            return;
          }
          const bufferedSec = this._audio.getBufferedSeconds();
          // Maintain ~3s buffer for natural pacing
          if (bufferedSec < 3.0) {
            const url = String(chunks[this._currentChunkIndex++]);
            await fetchAndBufferAudio(this, url, { signal: this._prefetchAbort.signal });
          }
          if (this._currentChunkIndex >= chunks.length) {
            const remaining = this._audio.getBufferedSeconds();
            let pastEnd2 = true;
            try {
              const now = this._audio?.ctx?.currentTime || 0;
              const tMs = Math.max(0, (now - this._slideStartAtAudioTime) * 1000);
              const lastBoundary = (()=>{
                const arr = Array.isArray(slide.sentence_boundaries_ms) ? slide.sentence_boundaries_ms : [];
                return arr.length ? arr[arr.length-1] : 0;
              })();
              const target = Math.max(lastBoundary, slide.target_duration_ms||0);
              pastEnd2 = tMs >= (target - 150);
            } catch {}
            if (this._isPlaying && remaining < 0.75 && pastEnd2) {
              const next = this._slideIndex + 1;
              if (next <= 4) {
                clearInterval(this._prefetchTimer);
                this._emitProgress('slide_completed', { index: this._slideIndex });
                await this._bufferFirstChunkOfSlide(next);
                return;
              } else {
                clearInterval(this._prefetchTimer);
                this._emitProgress('lesson_completed');
              }
            }
          }
        } catch {}
      }, 250);
    },
    _startStallMonitor(){
      clearInterval(this._stallTimer);
      this._stallTimer = setInterval(()=>{
        try {
          const b = this._audio.getBufferedSeconds();
          if (this._isPlaying && b < 0.2) emit('playback_stalled');
        } catch {}
      }, 200);
    },
    async requestVariantChange(partial){
      // Determine next boundary from current slide
      try {
        const slide = this._manifest.slides[this._slideIndex];
        const arr = Array.isArray(slide.sentence_boundaries_ms) ? slide.sentence_boundaries_ms.slice() : [0];
        const nowMs = Math.max(0, (this._audio?.ctx?.currentTime - this._slideStartAtAudioTime) * 1000);
        const next = arr.find(x => x > nowMs) ?? arr[arr.length - 1];
        const appliedBoundaryMs = Math.max(0, next);
        // If we have a resolver and partial, fetch new manifest and swap at boundary
        if (this._resolver) {
          const timeUntil = Math.max(0, appliedBoundaryMs - nowMs);
          const fadeMs = 200;
          setTimeout(async ()=>{
            try {
              const newMan = await this._resolver(partial || {});
              // For simplicity, switch to same slide index and use first chunk from new manifest
              const newSlide = newMan.slides[this._slideIndex];
              const first = newSlide?.audio_manifest?.chunks?.[0];
              if (first) {
                const r = await fetchWithRetry(prox(first)); const ab = await r.arrayBuffer();
                const buf = await this._audio.decodeOpus(ab);
                await this._audio.crossfadeTo([buf]);
                this._manifest = newMan; this._currentChunkIndex = 1; this._schedulePrefetch();
                await this._loadCaptionsForSlide(newSlide);
              }
            } catch {}
          }, Math.max(0, timeUntil - fadeMs));
        }
        emit('variant_changed', { appliedBoundaryMs });
        return { appliedBoundaryMs };
      } catch { return { appliedBoundaryMs: 0 }; }
    },
    on,
  };
  window.ManifestPlayer = ManifestPlayer;
}