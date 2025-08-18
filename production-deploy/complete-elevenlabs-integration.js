/**
 * Complete TTS Integration for iLearnHow
 * Using local Coqui TTS server for Kelly and Ken avatars
 * Browser-safe implementation with fallback mechanisms
 */

class TTSService {
    constructor() {
        // Environment detection
        this.isBrowser = typeof window !== 'undefined';
        this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
        
        // Server configuration
        this.baseUrl = 'http://localhost:5002';
        this.maxRetries = 3;
        this.retryDelay = 1000; // ms
        
        // Voice settings
        this.voices = {
            kelly: 'kelly',
            ken: 'ken'
        };
        
        // Audio cache (simple in-memory cache for browser)
        this.audioCache = new Map();
        
        // Health check tracking
        this.serverHealthy = true;
        this.lastHealthCheck = 0;
        
        console.log(`🎵 TTS Service initialized (${this.isBrowser ? 'Browser' : 'Node.js'} environment)`);
    }

    /**
     * Health check for TTS server
     */
    async checkServerHealth() {
        const now = Date.now();
        if (now - this.lastHealthCheck < 30000) { // 30s cache
            return this.serverHealthy;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                timeout: 2000
            });
            
            this.serverHealthy = response.ok;
            this.lastHealthCheck = now;
            return this.serverHealthy;
        } catch (error) {
            this.serverHealthy = false;
            this.lastHealthCheck = now;
            return false;
        }
    }

    /**
     * Generate audio with retry logic
     */
    async generateAudio(text, avatar = 'kelly', retryCount = 0) {
        // Check cache first
        const cacheKey = `${avatar}:${text.substring(0, 100)}`;
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }
        
        // Check server health
        const isHealthy = await this.checkServerHealth();
        if (!isHealthy) {
            return this.generatePlaceholderAudio(text, avatar);
        }
        
        try {
            const voiceId = this.voices[avatar];
            if (!voiceId) {
                throw new Error(`Voice not found for avatar: ${avatar}`);
            }
            
            const response = await fetch(`${this.baseUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    speaker_id: voiceId,
                    language_id: 'en'
                })
            });
            
            if (!response.ok) {
                throw new Error(`TTS request failed: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Cache the result
            this.audioCache.set(cacheKey, audioUrl);
            
            console.log(`✅ Audio generated successfully for ${avatar}`);
            return audioUrl;
            
        } catch (error) {
            console.error(`❌ TTS generation failed (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.generateAudio(text, avatar, retryCount + 1);
            }
            
            return this.generatePlaceholderAudio(text, avatar);
        }
    }

    /**
     * Generate placeholder audio when no audio system is available
     */
    generatePlaceholderAudio(text, avatar) {
        console.log(`🎵 Generating placeholder audio for ${avatar}: "${text.substring(0, 50)}..."`);
        
        return new Promise((resolve) => {
            // Create a simple beep sound as placeholder
            if (this.isBrowser) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                
                setTimeout(() => {
                    resolve('placeholder_audio_completed');
                }, 500);
            } else {
                // Node.js environment - just return success
                setTimeout(() => {
                    resolve('placeholder_audio_completed');
                }, 100);
            }
        });
    }

    /**
     * Generate audio with streaming for better performance
     */
    async generateStreamingAudio(text, avatar = 'kelly', onChunk) {
        try {
            console.log(`🎵 Generating streaming audio for ${avatar}...`);
            
            // Check if we're in a browser environment
            if (!this.isBrowser) {
                console.warn('⚠️ Streaming audio not available in Node.js environment');
                return this.generatePlaceholderAudio(text, avatar);
            }
            
            // Check if API key is valid
            if (this.apiKey === 'your-elevenlabs-api-key') {
                console.warn('⚠️ Using fallback audio (no valid API key)');
                return this.fallbackAudio?.speak(text, avatar) || this.generatePlaceholderAudio(text, avatar);
            }
            
            const voiceId = this.voices[avatar];
            if (!voiceId) {
                throw new Error(`Voice ID not found for avatar: ${avatar}`);
            }

            const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}/stream`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: this.voiceSettings,
                    output_format: 'mp3_44100_128'
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.warn(`⚠️ ElevenLabs streaming API error: ${response.status} - ${error}`);
                console.warn('⚠️ Falling back to browser TTS');
                return this.fallbackAudio?.speak(text, avatar) || this.generatePlaceholderAudio(text, avatar);
            }

            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                
                if (onChunk) {
                    onChunk(value);
                }
            }

            const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            console.log(`✅ Streaming audio generated successfully for ${avatar}`);
            return audioUrl;
            
        } catch (error) {
            console.error('❌ ElevenLabs streaming audio generation failed:', error);
            console.warn('⚠️ Using fallback audio system');
            return this.fallbackAudio?.speak(text, avatar) || this.generatePlaceholderAudio(text, avatar);
        }
    }

    /**
     * Get available voices from ElevenLabs
     */
    async getVoices() {
        try {
            if (!this.isBrowser) {
                console.warn('⚠️ Voice listing not available in Node.js environment');
                return this.voices;
            }
            
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Available voices:', data.voices);
            return data.voices;
            
        } catch (error) {
            console.error('❌ Failed to get voices:', error);
            return this.voices;
        }
    }

    /**
     * Test voice synthesis
     */
    async testVoiceSynthesis(avatar = 'kelly') {
        try {
            console.log(`🧪 Testing voice synthesis for ${avatar}...`);
            
            const testText = `Hello! I'm ${avatar === 'kelly' ? 'Kelly' : 'Ken'}, and this is a test of the voice synthesis system.`;
            
            const result = await this.generateAudio(testText, avatar);
            
            console.log(`✅ Voice synthesis test completed for ${avatar}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Voice synthesis test failed for ${avatar}:`, error);
            throw error;
        }
    }

    /**
     * Generate audio for complete lesson
     */
    async generateLessonAudio(lesson, avatar = 'kelly') {
        try {
            console.log(`🎵 Generating lesson audio for ${avatar}...`);
            
            const formattedLesson = this.formatLessonForAudio(lesson);
            const audioUrl = await this.generateAudio(formattedLesson, avatar);
            
            console.log(`✅ Lesson audio generated successfully for ${avatar}`);
            return audioUrl;
            
        } catch (error) {
            console.error(`❌ Lesson audio generation failed for ${avatar}:`, error);
            throw error;
        }
    }

    /**
     * Format lesson content for audio generation
     */
    formatLessonForAudio(lesson) {
        let formattedText = '';
        
        if (lesson.voiceOver) {
            formattedText += lesson.voiceOver + ' ';
        }
        
        if (lesson.onScreen) {
            formattedText += lesson.onScreen + ' ';
        }
        
        if (lesson.lessonLogic) {
            formattedText += lesson.lessonLogic + ' ';
        }
        
        if (lesson.questions && lesson.questions.length > 0) {
            formattedText += 'Now for some questions. ';
            lesson.questions.forEach((question, index) => {
                formattedText += `Question ${index + 1}: ${question.question} `;
                if (question.optionA) formattedText += `Option A: ${question.optionA} `;
                if (question.optionB) formattedText += `Option B: ${question.optionB} `;
            });
        }
        
        if (lesson.fortune) {
            formattedText += `And here's your daily fortune: ${lesson.fortune}`;
        }
        
        return formattedText.trim();
    }

    /**
     * Get audio duration (placeholder implementation)
     */
    async getAudioDuration(audioUrl) {
        if (!this.isBrowser) {
            return 30; // Default duration for Node.js
        }
        
        return new Promise((resolve) => {
            const audio = new Audio(audioUrl);
            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
            });
            audio.addEventListener('error', () => {
                resolve(30); // Default duration on error
            });
        });
    }

    /**
     * Clean up audio URL to prevent memory leaks
     */
    cleanupAudioUrl(audioUrl) {
        if (this.isBrowser && audioUrl && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
            console.log('✅ Audio URL cleaned up');
        }
    }

    /**
     * Set API key (for browser environment)
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        if (this.isBrowser) {
            localStorage.setItem('elevenlabs_api_key', apiKey);
        }
        console.log('✅ API key updated');
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            environment: this.isBrowser ? 'browser' : 'nodejs',
            apiKeyConfigured: this.apiKey !== 'your-elevenlabs-api-key',
            fallbackAvailable: this.fallbackAudio !== null,
            voices: Object.keys(this.voices)
        };
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSService;
} else if (typeof window !== 'undefined') {
    window.TTSService = TTSService;
}

// Dev/production shared buffered Opus player (minimal)
if (typeof window !== 'undefined') {
  window.BufferedOpusPlayer = (function(){
    class BufferedOpusPlayer {
      constructor() {
        this.ctx = null;
        this.queue = [];
        this.playHead = 0;
        this.minBufferSec = 2.0;
        this.crossfadeMs = 200;
        this.gain = null;
        this.isPlaying = false;
        this._lastStartAt = 0;
        this._lastDuration = 0;
      }
      ensureCtx(){
        if (!this.ctx) {
          const C = window.AudioContext || window.webkitAudioContext;
          this.ctx = new C();
          this.gain = this.ctx.createGain();
          // Attach an analyser for RMS/onset detection and route audio through it
          this.analyser = this.ctx.createAnalyser();
          this.analyser.fftSize = 2048;
          this.analyser.smoothingTimeConstant = 0.05;
          this.gain.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
        }
      }
      async decodeOpus(arrayBuffer){
        this.ensureCtx();
        return await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      }
      getBufferedSeconds(){
        const now = this.ctx ? this.ctx.currentTime : 0;
        return Math.max(0, this.playHead - now);
      }
      scheduleBuffer(audioBuffer){
        this.ensureCtx();
        const src = this.ctx.createBufferSource();
        src.buffer = audioBuffer;
        const node = this.ctx.createGain();
        node.gain.value = 1;
        src.connect(node).connect(this.gain);
        const startAt = Math.max(this.ctx.currentTime + 0.01, this.playHead || this.ctx.currentTime + 0.01);
        src.start(startAt);
        this.playHead = startAt + audioBuffer.duration;
        this.queue.push({ src, node, startAt, duration: audioBuffer.duration });
        this._lastStartAt = startAt;
        this._lastDuration = audioBuffer.duration;
        return startAt;
      }
      async appendChunk(opusArrayBuffer){
        const ab = await this.decodeOpus(opusArrayBuffer);
        this.scheduleBuffer(ab);
        return this.getBufferedSeconds();
      }
      getLastStartAt(){ return this._lastStartAt || (this.ctx ? this.ctx.currentTime : 0); }
      getRms(){
        try {
          if (!this.analyser) return 0;
          const len = this.analyser.fftSize;
          const buf = new Float32Array(len);
          this.analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i=0;i<len;i++){ const v = buf[i]; sum += v*v; }
          const rms = Math.sqrt(sum/len);
          return rms;
        } catch { return 0; }
      }
      async crossfadeTo(newBuffers){
        // Simple crossfade: ramp down current, ramp up new first buffer
        const now = this.ctx.currentTime;
        const fade = this.crossfadeMs / 1000;
        if (this.queue.length) {
          try {
            const last = this.queue[this.queue.length - 1];
            last.node.gain.cancelScheduledValues(now);
            last.node.gain.setValueAtTime(last.node.gain.value, now);
            last.node.gain.linearRampToValueAtTime(0.0001, now + fade);
          } catch {}
        }
        for (const buf of newBuffers) {
          this.scheduleBuffer(buf);
        }
        // ramp in the first of new buffers
        try {
          const first = this.queue[this.queue.length - newBuffers.length];
          first.node.gain.setValueAtTime(0.0001, now);
          first.node.gain.linearRampToValueAtTime(1.0, now + fade);
        } catch {}
      }
      pause(){ try { this.ctx && this.ctx.suspend(); this.isPlaying = false; } catch {}
      }
      resume(){ try { this.ctx && this.ctx.resume(); this.isPlaying = true; } catch {}
      }
      setVolume(vol){
        try { if (this.gain) { const v = Math.max(0, Math.min(1, vol)); this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01); } } catch {}
      }
      stop(){
        try {
          this.queue.forEach(q => { try { q.src.stop(); } catch {} });
        } catch {}
        this.queue = [];
        this.playHead = this.ctx ? this.ctx.currentTime : 0;
        this.isPlaying = false;
      }
    }
    return BufferedOpusPlayer;
  })();
}
