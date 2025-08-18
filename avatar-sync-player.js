/**
 * Avatar Sync Player - Real-time TTS to Avatar Frame Synchronization
 * Plays TTS audio while switching avatar frames based on phoneme timing
 */

class AvatarSyncPlayer {
    constructor() {
        this.audio = document.getElementById('tts-audio') || this.createAudioElement();
        this.avatarBg = document.getElementById('avatar-background');
        this.cdnBase = window.VISEME_CDN_BASE || 'https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars';
        this.visemeFrames = new Map(); // Cache loaded images
        this.phonemeTimeline = [];
        this.currentVisemeIndex = -1;
        this.animationFrame = null;
        this.isPlaying = false;
        
        // Preload REST frame for each avatar
        this.defaultFrames = {
            kelly: `${this.cdnBase}/kelly/full/REST.png`,
            ken: `${this.cdnBase}/ken/full/REST.png`
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
        
        // Production endpoints
        if (isProduction) {
            // Try Railway first since it has phoneme support
            return 'https://tts-server-production-61b7.up.railway.app';
        }
        
        // Local development
        return 'http://localhost:5002';
    }
    
    async getTTSWithPhonemes(text, speaker) {
        const response = await fetch(`${this.ttsUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                speaker: speaker.toLowerCase(),
                include_phonemes: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`TTS request failed: ${response.status}`);
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
        
        return {
            audio: audioBlob,
            phonemes: data.phonemes || [],
            duration: data.duration || 0
        };
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
    
    async preloadVisemeFrames(speaker) {
        const visemes = ['REST', 'MBP', 'FV', 'TH', 'DNTL', 'KG', 'S', 'WQ', 'R', 'A', 'E', 'I'];
        const promises = [];
        
        for (const viseme of visemes) {
            const url = `${this.cdnBase}/${speaker}/full/${viseme}.png`;
            const key = `${speaker}_${viseme}`;
            
            if (!this.visemeFrames.has(key)) {
                const promise = new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        this.visemeFrames.set(key, url);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load viseme: ${url}`);
                        resolve();
                    };
                    img.src = url;
                });
                promises.push(promise);
            }
        }
        
        await Promise.all(promises);
        console.log(`✅ Preloaded ${this.visemeFrames.size} viseme frames`);
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
        const url = this.visemeFrames.get(key) || this.defaultFrames[speaker];
        
        if (this.avatarBg && url) {
            // Use CSS background-image for smoother transitions
            this.avatarBg.style.backgroundImage = `url('${url}')`;
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
            
            // Build viseme timeline
            this.phonemeTimeline = this.buildVisemeTimeline(phonemes);
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
