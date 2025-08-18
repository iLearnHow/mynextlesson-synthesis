/**
 * Enhanced Avatar Sync Player - 48-Viseme System
 * Handles expanded viseme set including emotional and contextual variants
 * Enhanced version of the original avatar-sync-player.js
 */

class EnhancedAvatarSyncPlayer {
    constructor() {
        this.audio = document.getElementById('tts-audio') || this.createAudioElement();
        this.avatarBg = document.getElementById('avatar-background');
        this.cdnBase = (window.VISEME_CDN_BASE || 'https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev').replace(/\/$/, '');
        this.visemeFrames = new Map(); // Cache loaded images
        this.phonemeTimeline = [];
        this.currentVisemeIndex = -1;
        this.animationFrame = null;
        this.isPlaying = false;
        this.currentSpeaker = 'kelly';
        this.currentEmotion = 'neutral';
        this.currentContext = 'default';
        
        // Enhanced viseme system - 48 total visemes
        this.visemeSystem = {
            basic: ['REST', 'MBP', 'FV', 'TH', 'DNTL', 'KG', 'S', 'WQ', 'R', 'A', 'E', 'I'],
            enhanced: ['OO', 'UH', 'AW', 'AY', 'OY', 'NG', 'CH', 'SH', 'ZH', 'Y', 'L', 'H'],
            emotional: ['A_HAPPY', 'A_SERIOUS', 'A_EXCITED', 'E_HAPPY', 'E_SERIOUS', 'E_EXCITED', 'I_HAPPY', 'I_SERIOUS', 'I_EXCITED'],
            contextual: ['A_TEACH', 'A_QUESTION', 'A_EMPHASIS', 'E_TEACH', 'E_QUESTION', 'E_EMPHASIS', 'I_TEACH', 'I_QUESTION', 'I_EMPHASIS']
        };
        
        // All visemes flattened
        this.allVisemes = [
            ...this.visemeSystem.basic,
            ...this.visemeSystem.enhanced,
            ...this.visemeSystem.emotional,
            ...this.visemeSystem.contextual
        ];
        
        // Default frames for each avatar
        this.defaultFrames = {
            kelly: `${this.cdnBase}/avatars/kelly/full/REST/frame_01.webp`,
            ken: `${this.cdnBase}/avatars/ken/full/REST/frame_01.webp`
        };
        
        // Local fallback frames
        this.localFrames = {
            kelly: '/r2-upload-ready/kelly/full/REST.png',
            ken: '/r2-upload-ready/ken/full/REST.png'
        };
        
        // TTS server URL
        this.ttsUrl = this.detectTTSUrl();
        
        // Bind methods
        this.updateFrame = this.updateFrame.bind(this);
        this.onAudioEnded = this.onAudioEnded.bind(this);
        this.selectOptimalViseme = this.selectOptimalViseme.bind(this);
    }
    
    createAudioElement() {
        const audio = document.createElement('audio');
        audio.id = 'tts-audio';
        audio.style.display = 'none';
        document.body.appendChild(audio);
        return audio;
    }
    
    detectTTSUrl() {
        const host = window.location.hostname;
        const isProduction = /ilearnhow\.com$/i.test(host);
        
        // Check query param override
        const qp = new URLSearchParams(window.location.search);
        const ttsOverride = qp.get('tts');
        if (ttsOverride) {
            return ttsOverride;
        }
        
        // Use unified TTS base if available
        if (window.unifiedTTS?.baseUrl) {
            return window.unifiedTTS.baseUrl;
        }
        
        // Always prefer Railway server (our new production TTS)
        return 'https://tts-server-production-61b7.up.railway.app';
    }
    
    async getTTSWithPhonemes(text, speaker) {
        const candidates = [];
        const unique = new Set();
        const push = (u)=>{ if (u && !unique.has(u)) { unique.add(u); candidates.push(u); } };
        
        // Priority 1: Query param override
        const qp = new URLSearchParams(window.location.search);
        const ttsOverride = qp.get('tts');
        if (ttsOverride) push(ttsOverride);
        
        // Priority 2: Production Railway server
        push('https://tts-server-production-61b7.up.railway.app');
        
        // Priority 3: Current TTS URL
        push(this.ttsUrl);
        
        // Priority 4: Unified TTS base
        push(window.unifiedTTS?.baseUrl);
        
        // Priority 5: Fallback to localhost for development
        if (window.location.hostname === 'localhost') {
            push('http://localhost:5002');
        }
        
        let lastError = null;
        for (const base of candidates) {
            try {
                const response = await fetch(`${base}/api/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        speaker: speaker.toLowerCase(),
                        include_phonemes: true
                    })
                });
                if (!response.ok) {
                    lastError = new Error(`TTS request failed: ${response.status} from ${base}`);
                    console.warn(`⚠️ TTS endpoint ${base} failed: ${response.status}`);
                    continue;
                }
                const data = await response.json();
                
                // Convert base64 audio to blob
                const audioData = atob(data.audio);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }
                const mimeType = data.audio_format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
                const audioBlob = new Blob([audioArray], { type: mimeType });
                
                // Remember working endpoint
                this.ttsUrl = base;
                console.log(`✅ TTS working from: ${base}`);
                console.log(`📊 Got ${(data.phonemes || []).length} phonemes, duration: ${data.duration || 0}s`);
                
                return {
                    audio: audioBlob,
                    phonemes: data.phonemes || [],
                    duration: data.duration || 0
                };
            } catch (err) {
                lastError = err;
                continue;
            }
        }
        throw lastError || new Error('No TTS endpoints reachable');
    }
    
    buildVisemeTimeline(phonemes) {
        // Enhanced timeline building with emotional and contextual awareness
        const timeline = [];
        let currentGroup = null;
        
        for (const phoneme of phonemes) {
            const optimalViseme = this.selectOptimalViseme(phoneme.viseme, phoneme.text);
            
            if (!currentGroup || currentGroup.viseme !== optimalViseme) {
                currentGroup = {
                    viseme: optimalViseme,
                    start: phoneme.start,
                    end: phoneme.end,
                    original: phoneme.viseme,
                    text: phoneme.text
                };
                timeline.push(currentGroup);
            } else {
                // Extend the current group
                currentGroup.end = phoneme.end;
            }
        }
        
        return timeline;
    }
    
    selectOptimalViseme(baseViseme, text) {
        // Enhanced viseme selection based on context and emotion
        let selectedViseme = baseViseme;
        
        // Check for emotional context in text
        const emotionalWords = {
            'HAPPY': ['great', 'wonderful', 'amazing', 'excellent', 'fantastic', 'awesome'],
            'SERIOUS': ['important', 'critical', 'serious', 'careful', 'attention', 'warning'],
            'EXCITED': ['wow', 'incredible', 'unbelievable', 'amazing', 'fantastic', 'wonderful']
        };
        
        // Check for question context
        const isQuestion = text.includes('?') || text.toLowerCase().includes('what') || 
                          text.toLowerCase().includes('how') || text.toLowerCase().includes('why');
        
        // Check for emphasis context
        const hasEmphasis = text.includes('**') || text.includes('__') || 
                           text.includes('!') || text.includes('"');
        
        // Determine emotion
        let detectedEmotion = 'neutral';
        for (const [emotion, words] of Object.entries(emotionalWords)) {
            if (words.some(word => text.toLowerCase().includes(word))) {
                detectedEmotion = emotion;
                break;
            }
        }
        
        // Select optimal viseme
        if (baseViseme in ['A', 'E', 'I']) {
            if (detectedEmotion !== 'neutral') {
                selectedViseme = `${baseViseme}_${detectedEmotion}`;
            } else if (isQuestion) {
                selectedViseme = `${baseViseme}_QUESTION`;
            } else if (hasEmphasis) {
                selectedViseme = `${baseViseme}_EMPHASIS`;
            } else if (detectedEmotion === 'neutral' && !isQuestion && !hasEmphasis) {
                selectedViseme = `${baseViseme}_TEACH`;
            }
        }
        
        // Fallback to basic viseme if enhanced version doesn't exist
        if (!this.allVisemes.includes(selectedViseme)) {
            selectedViseme = baseViseme;
        }
        
        return selectedViseme;
    }
    
    async ensureCDNBaseAccessible() {
        const tryLoad = (url) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
        
        try {
            await tryLoad(`${this.cdnBase}/avatars/kelly/full/REST/frame_01.webp`);
            return;
        } catch {}
        
        try {
            await tryLoad(`${this.cdnBase}/kelly/full/REST/frame_01.webp`);
            return;
        } catch {}
        
        const onLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (onLocalhost) {
            console.warn('R2 CDN not reachable, falling back to local viseme frames');
            this.cdnBase = '/r2-upload-ready'.replace(/\/$/, '');
        }
    }
    
    async preloadVisemeFrames(speaker) {
        await this.ensureCDNBaseAccessible();
        const promises = [];
        
        // Preload all 48 visemes
        for (const viseme of this.allVisemes) {
            const key = `${speaker}_${viseme}`;
            
            if (!this.visemeFrames.has(key)) {
                const promise = new Promise((resolve) => {
                    // Try multiple path formats for enhanced visemes
                    const urls = [
                        `${this.cdnBase}/avatars/${speaker}/2d/visemes/enhanced/mouth_${viseme}.png`,
                        `${this.cdnBase}/avatars/${speaker}/2d/visemes/emotional/mouth_${viseme}.png`,
                        `${this.cdnBase}/avatars/${speaker}/2d/visemes/contextual/mouth_${viseme}.png`,
                        `${this.cdnBase}/avatars/${speaker}/full/${viseme}.png`,
                        `${this.cdnBase}/avatars/${speaker}/full/${viseme}/frame_01.webp`,
                        `/r2-upload-ready/${speaker}/full/${viseme}.png`,
                        `/r2-upload-ready/${speaker}/full/${viseme}.png`
                    ];
                    
                    let urlIndex = 0;
                    
                    const tryNextUrl = () => {
                        if (urlIndex >= urls.length) {
                            console.warn(`Failed to load viseme: ${viseme} from all sources`);
                            resolve();
                            return;
                        }
                        
                        const url = urls[urlIndex];
                        const img = new Image();
                        
                        img.onload = () => {
                            this.visemeFrames.set(key, url);
                            console.log(`✅ Loaded viseme: ${speaker}-${viseme} from ${url}`);
                            resolve();
                        };
                        
                        img.onerror = () => {
                            urlIndex++;
                            tryNextUrl();
                        };
                        
                        img.src = url;
                    };
                    
                    tryNextUrl();
                });
                promises.push(promise);
            }
        }
        
        await Promise.all(promises);
        console.log(`✅ Preloaded ${this.visemeFrames.size} viseme frames for ${speaker}`);
    }
    
    buildHeuristicTimeline(text, totalDurationSec) {
        // Enhanced heuristic timeline with emotional awareness
        const cycle = ['MBP', 'A_TEACH', 'E_TEACH', 'I_TEACH', 'REST'];
        const timeline = [];
        const minStep = 0.08;
        const maxStep = 0.14;
        const approxCharsPerSec = 13;
        const estimatedDur = totalDurationSec && totalDurationSec > 0 
            ? totalDurationSec 
            : Math.max(1.5, text.length / approxCharsPerSec);
        const step = Math.max(minStep, Math.min(maxStep, estimatedDur / Math.max(8, Math.round(text.length / 6))));
        
        let t = 0;
        let idx = 0;
        while (t < estimatedDur) {
            const viseme = cycle[idx % cycle.length];
            const next = Math.min(estimatedDur, t + step);
            timeline.push({ viseme, start: t, end: next });
            t = next;
            idx += 1;
        }
        return timeline;
    }
    
    getCurrentViseme(currentTime) {
        for (let i = 0; i < this.phonemeTimeline.length; i++) {
            const item = this.phonemeTimeline[i];
            if (currentTime >= item.start && currentTime < item.end) {
                return { viseme: item.viseme, index: i };
            }
        }
        return { viseme: 'REST', index: -1 };
    }
    
    updateAvatarFrame(viseme, speaker) {
        const key = `${speaker}_${viseme}`;
        let url = this.visemeFrames.get(key);
        
        if (!url) {
            // Try local fallback
            url = `/r2-upload-ready/${speaker}/full/${viseme}.png`;
            console.log(`🎭 Using local fallback for ${viseme}: ${url}`);
        }
        
        if (this.avatarBg && url) {
            this.avatarBg.style.backgroundImage = `url('${url}')`;
            console.log(`🎭 Frame updated: ${speaker} ${viseme} -> ${url}`);
        } else {
            console.warn(`No frame found for ${speaker} ${viseme}`);
        }
    }
    
    updateFrame() {
        if (!this.isPlaying) return;
        
        const currentTime = this.audio.currentTime;
        const { viseme, index } = this.getCurrentViseme(currentTime);
        const speaker = this.currentSpeaker;
        
        if (index !== this.currentVisemeIndex) {
            this.currentVisemeIndex = index;
            this.updateAvatarFrame(viseme, speaker);
            
            if (viseme !== 'REST') {
                this.avatarBg?.classList.add('speaking');
            } else {
                this.avatarBg?.classList.remove('speaking');
            }
        }
        
        this.animationFrame = requestAnimationFrame(this.updateFrame);
    }
    
    async play(text, speaker = 'kelly', emotion = 'neutral', context = 'default') {
        try {
            this.currentSpeaker = speaker;
            this.currentEmotion = emotion;
            this.currentContext = context;
            
            console.log(`🎭 Starting avatar sync for ${speaker} (${emotion}, ${context})`);
            
            // Preload viseme frames
            await this.preloadVisemeFrames(speaker);
            
            // Get TTS with phonemes
            const ttsData = await this.getTTSWithPhonemes(text, speaker);
            
            // Build viseme timeline
            this.phonemeTimeline = this.buildVisemeTimeline(ttsData.phonemes);
            
            if (this.phonemeTimeline.length === 0) {
                console.warn('No phonemes available, using heuristic timeline');
                this.phonemeTimeline = this.buildHeuristicTimeline(text, ttsData.duration);
            }
            
            // Set up audio
            this.audio.src = URL.createObjectURL(ttsData.audio);
            this.audio.onended = this.onAudioEnded;
            
            // Start playback
            this.isPlaying = true;
            this.currentVisemeIndex = -1;
            this.audio.play();
            
            // Start frame updates
            this.updateFrame();
            
            console.log(`✅ Avatar sync started with ${this.phonemeTimeline.length} viseme transitions`);
            
        } catch (error) {
            console.error('❌ Error starting avatar sync:', error);
            throw error;
        }
    }
    
    stop() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.currentVisemeIndex = -1;
        this.avatarBg?.classList.remove('speaking');
        console.log('🛑 Avatar sync stopped');
    }
    
    onAudioEnded() {
        this.isPlaying = false;
        this.currentVisemeIndex = -1;
        this.avatarBg?.classList.remove('speaking');
        console.log('✅ Avatar sync completed');
    }
    
    // Enhanced methods for emotional and contextual control
    setEmotion(emotion) {
        this.currentEmotion = emotion;
        console.log(`🎭 Emotion set to: ${emotion}`);
    }
    
    setContext(context) {
        this.currentContext = context;
        console.log(`🎭 Context set to: ${context}`);
    }
    
    getVisemeStats() {
        return {
            totalVisemes: this.allVisemes.length,
            categories: this.visemeSystem,
            loadedFrames: this.visemeFrames.size,
            currentSpeaker: this.currentSpeaker,
            currentEmotion: this.currentEmotion,
            currentContext: this.currentContext
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAvatarSyncPlayer;
} else {
    window.EnhancedAvatarSyncPlayer = EnhancedAvatarSyncPlayer;
}
