/**
 * Avatar Sync Player - Real-time TTS to Avatar Frame Synchronization
 * Plays TTS audio while switching avatar frames based on phoneme timing
 */

class AvatarSyncPlayer {
    constructor() {
        this.audio = document.getElementById('tts-audio') || this.createAudioElement();
        this.avatarBg = document.getElementById('avatar-background');
        // Expect base to include /avatars; add if missing
        this.cdnBase = (window.VISEME_CDN_BASE || 'https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev').replace(/\/$/, '');
        this.visemeFrames = new Map(); // Cache loaded images
        this.phonemeTimeline = [];
        this.currentVisemeIndex = -1;
        this.animationFrame = null;
        this.isPlaying = false;
        
        // Preload REST frame for each avatar
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
    }
    
    createAudioElement() {
        const audio = document.createElement('audio');
        audio.id = 'tts-audio';
        audio.style.display = 'none';
        document.body.appendChild(audio);
        return audio;
    }
    
    detectTTSUrl() {
        // Use the same logic as unified TTS handler
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
        // Try multiple endpoints in order until one works
        const candidates = [];
        const unique = new Set();
        const push = (u)=>{ if (u && !unique.has(u)) { unique.add(u); candidates.push(u); } };
        
        // Priority 1: Query param override
        const qp = new URLSearchParams(window.location.search);
        const ttsOverride = qp.get('tts');
        if (ttsOverride) push(ttsOverride);
        
        // Priority 2: Production Railway server (our new TTS)
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
        // Group consecutive same visemes for smoother animation
        const timeline = [];
        let currentGroup = null;
        
        for (const phoneme of phonemes) {
            if (!currentGroup || currentGroup.viseme !== phoneme.viseme) {
                currentGroup = {
                    viseme: phoneme.viseme,
                    start: phoneme.start,
                    end: phoneme.end
                };
                timeline.push(currentGroup);
            } else {
                // Extend the current group
                currentGroup.end = phoneme.end;
            }
        }
        
        return timeline;
    }
    
    async ensureCDNBaseAccessible() {
        // Verify CDN; try PNG layout first, then WEBP directory layout, else fall back (dev only)
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
        const visemes = ['REST', 'MBP', 'FV', 'TH', 'DNTL', 'KG', 'S', 'WQ', 'R', 'A', 'E', 'I'];
        const promises = [];
        
        for (const viseme of visemes) {
            // Try multiple path formats
            const urls = [
                `${this.cdnBase}/avatars/${speaker}/full/${viseme}.png`,
                `${this.cdnBase}/avatars/${speaker}/full/${viseme}/frame_01.webp`,
                `/r2-upload-ready/${speaker}/full/${viseme}.png`,  // Local fallback
                `/r2-upload-ready/${speaker}/full/${viseme}.png`   // Direct local
            ];
            const key = `${speaker}_${viseme}`;
            
            if (!this.visemeFrames.has(key)) {
                const promise = new Promise((resolve) => {
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
        console.log(`✅ Preloaded ${this.visemeFrames.size} viseme frames`);
    }

    buildHeuristicTimeline(text, totalDurationSec) {
        // Fallback when phonemes are unavailable: generate a natural cycle
        const cycle = ['MBP', 'A', 'E', 'I', 'REST'];
        const timeline = [];
        const minStep = 0.08;  // 80ms per viseme step
        const maxStep = 0.14;  // 140ms per viseme step
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
        // Find the viseme that should be displayed at the current time
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
            // Use CSS background-image for smoother transitions
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
        
        // Only update if viseme changed
        if (index !== this.currentVisemeIndex) {
            this.currentVisemeIndex = index;
            this.updateAvatarFrame(viseme, speaker);
            
            // Add speaking class for additional animation
            if (viseme !== 'REST') {
                this.avatarBg?.classList.add('speaking');
            } else {
                this.avatarBg?.classList.remove('speaking');
            }
        }
        
        // Continue animation loop
        this.animationFrame = requestAnimationFrame(this.updateFrame);
    }
    
    startFrameSync() {
        this.isPlaying = true;
        this.currentVisemeIndex = -1;
        this.updateFrame();
    }
    
    stopFrameSync() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Reset to REST frame
        if (this.currentSpeaker && this.avatarBg) {
            this.updateAvatarFrame('REST', this.currentSpeaker);
            this.avatarBg.classList.remove('speaking');
        }
    }
    
    onAudioEnded() {
        this.stopFrameSync();
        
        // Clean up blob URL
        if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
        }
    }
    
    async play(text, speaker = 'kelly') {
        try {
            // Stop any current playback
            this.stop();
            
            // Store current speaker
            this.currentSpeaker = speaker.toLowerCase();
            
            // Show loading state
            if (this.avatarBg) {
                this.avatarBg.classList.add('loading');
            }
            
            console.log(`🎤 Getting TTS with phonemes for ${speaker}: "${text.substring(0, 50)}..."`);
            
            // Get TTS with phoneme data
            const { audio, phonemes } = await this.getTTSWithPhonemes(text, speaker);
            
            // Build viseme timeline (fallback to heuristic if phonemes missing)
            this.phonemeTimeline = this.buildVisemeTimeline(phonemes);
            if (!this.phonemeTimeline.length) {
                // If server did not return duration, we will compute after audio metadata loads
                const tentative = this.buildHeuristicTimeline(text, 0);
                this.phonemeTimeline = tentative;
                this._needsDurationRefine = true;
                this._heuristicText = text;
            }
            console.log(`📊 Built timeline with ${this.phonemeTimeline.length} viseme groups`);
            
            // Preload viseme frames
            await this.preloadVisemeFrames(speaker);
            
            // Set up audio
            this.currentAudioUrl = URL.createObjectURL(audio);
            this.audio.src = this.currentAudioUrl;
            
            // Set up event listeners
            this.audio.onended = this.onAudioEnded;
            this.audio.onerror = (e) => {
                console.error('Audio playback error:', e);
                this.stopFrameSync();
            };
            this.audio.onloadedmetadata = () => {
                if (this._needsDurationRefine) {
                    // Rebuild heuristic timeline with actual duration
                    this.phonemeTimeline = this.buildHeuristicTimeline(this._heuristicText || text, this.audio.duration || 0);
                    this._needsDurationRefine = false;
                }
            };
            
            // Remove loading state
            if (this.avatarBg) {
                this.avatarBg.classList.remove('loading');
            }
            
            // Start synchronized playback
            this.startFrameSync();
            await this.audio.play();
            
            console.log('✅ Avatar sync playback started');
            
        } catch (error) {
            console.error('❌ Avatar sync error:', error);
            this.stopFrameSync();
            
            // Remove loading state
            if (this.avatarBg) {
                this.avatarBg.classList.remove('loading');
            }
            
            throw error;
        }
    }
    
    pause() {
        this.audio.pause();
        this.stopFrameSync();
    }
    
    resume() {
        if (this.audio.paused && this.audio.src) {
            this.startFrameSync();
            this.audio.play();
        }
    }
    
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.stopFrameSync();
        
        // Clean up
        if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
        }
    }
    
    get isPaused() {
        return this.audio.paused;
    }
    
    get currentTime() {
        return this.audio.currentTime;
    }
    
    get duration() {
        return this.audio.duration;
    }
}

// Create global instance
window.avatarSyncPlayer = new AvatarSyncPlayer();

// Override unified TTS to use avatar sync when available
if (window.unifiedTTS) {
    const originalSpeak = window.unifiedTTS.speak;
    window.unifiedTTS.speak = async function(text, speaker) {
        // Check if we should use avatar sync
        const useAvatarSync = window.lessonPlayer?.fullFrameVisemesEnabled || 
                             window.location.search.includes('avatarsync=1');
        
        if (useAvatarSync && window.avatarSyncPlayer) {
            console.log('🎭 Using Avatar Sync Player');
            return await window.avatarSyncPlayer.play(text, speaker);
        } else {
            // Fall back to regular TTS
            return await originalSpeak.call(this, text, speaker);
        }
    };
}

// Add CSS for loading state
const style = document.createElement('style');
style.textContent = `
    .avatar-background.loading {
        filter: brightness(0.7);
        transition: filter 0.3s ease;
    }
    
    .avatar-background.loading::after {
        content: 'Loading...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: white;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
`;
document.head.appendChild(style);

// Test functions
window.testAvatarSync = {
    kelly: () => window.avatarSyncPlayer.play("Hi! I'm Kelly with synchronized lip movements!", 'kelly'),
    ken: () => window.avatarSyncPlayer.play("Hello! I'm Ken and my mouth moves with my voice!", 'ken'),
    status: () => {
        console.log('🎭 Avatar Sync Status:', {
            ttsUrl: window.avatarSyncPlayer.ttsUrl,
            cdnBase: window.avatarSyncPlayer.cdnBase,
            cachedFrames: window.avatarSyncPlayer.visemeFrames.size,
            isPlaying: window.avatarSyncPlayer.isPlaying,
            currentSpeaker: window.avatarSyncPlayer.currentSpeaker
        });
    }
};

console.log('✅ Avatar Sync Player loaded - test with: testAvatarSync.kelly()');
