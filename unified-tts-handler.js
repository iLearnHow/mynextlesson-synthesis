/**
 * Unified TTS Handler - Single source of truth for all text-to-speech
 * Uses Ken & Kelly voices via local/railway TTS servers
 * NO FALLBACK TO MACOS VOICES
 */

class UnifiedTTSHandler {
    constructor() {
        this.baseUrl = null;
        this.isAvailable = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        const host = window.location.hostname;
        const isProduction = /ilearnhow\.com$/i.test(host);
        
        // Check query param override
        const qp = new URLSearchParams(window.location.search);
        const ttsOverride = qp.get('tts');
        
        // Candidate endpoints
        const railway = 'https://tts-server-production-61b7.up.railway.app';
        const candidates = isProduction ? [
            'https://tts.ilearnhow.com',
            'https://api.ilearnhow.com/api/tts',  // Try subdirectory
            'https://api.ilearnhow.com',
            railway
        ] : [
            'http://localhost:5002'
        ];
        
        // Try override first, then candidates
        const tryList = ttsOverride ? [ttsOverride, ...candidates] : candidates;
        
        for (const url of tryList) {
            const status = await this.checkHealth(url);
            if (status && (status.status === 'ready' || status.status === 'healthy')) {
                this.baseUrl = url;
                this.isAvailable = true;
                console.log(`✅ TTS connected to: ${url} (${status.status})`);
                return true;
            }
        }
        
        // If railway is initializing, wait a bit and try again
        if (!this.isAvailable) {
            const railwayStatus = await this.checkHealth(railway);
            if (railwayStatus && railwayStatus.status === 'initializing') {
                console.log('⏳ Railway TTS is initializing, waiting 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                const retryStatus = await this.checkHealth(railway);
                if (retryStatus && (retryStatus.status === 'ready' || retryStatus.status === 'healthy')) {
                    this.baseUrl = railway;
                    this.isAvailable = true;
                    console.log(`✅ TTS connected to Railway after wait`);
                    return true;
                }
            }
        }
        
        console.error('❌ No TTS servers available');
        this.showTTSError();
        return false;
    }

    async checkHealth(url) {
        try {
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async generateSpeech(text, speaker = 'kelly') {
        await this.initPromise;
        
        if (!this.isAvailable) {
            console.error('TTS not available');
            this.showTTSError();
            throw new Error('TTS not available');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text, 
                    speaker: speaker.toLowerCase()
                })
            });
            
            if (!response.ok) {
                throw new Error(`TTS request failed: ${response.status}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.error('TTS generation error:', error);
            this.showTTSError();
            throw error;
        }
    }

    async speak(text, speaker = 'kelly') {
        try {
            const audioBlob = await this.generateSpeech(text, speaker);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Use unified audio element
            let audio = document.getElementById('tts-audio');
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = 'tts-audio';
                audio.style.display = 'none';
                document.body.appendChild(audio);
            }
            
            // Clean up previous URL
            if (window.__tts_active_object_url) {
                URL.revokeObjectURL(window.__tts_active_object_url);
            }
            window.__tts_active_object_url = audioUrl;
            
            audio.src = audioUrl;
            
            // Handle avatar animation
            const avatarBg = document.querySelector('.avatar-background');
            if (avatarBg) {
                avatarBg.classList.add('speaking');
                audio.onended = () => {
                    avatarBg.classList.remove('speaking');
                    URL.revokeObjectURL(audioUrl);
                    window.__tts_active_object_url = null;
                };
            }
            
            await audio.play();
            return audio;
        } catch (error) {
            console.error('TTS speak error:', error);
            throw error;
        }
    }

    showTTSError() {
        // Only show error once per session
        if (window.__tts_error_shown) return;
        window.__tts_error_shown = true;
        
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #FFE5E5;
                border: 2px solid #FF3333;
                border-radius: 8px;
                padding: 15px;
                max-width: 300px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <h4 style="margin: 0 0 10px 0; color: #CC0000;">⚠️ TTS Server Error</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    Ken & Kelly voices are unavailable. Please ensure the TTS server is running.
                </p>
                <p style="margin: 0; font-size: 12px; color: #666;">
                    Local: ./start-tts-server.sh<br>
                    Production: Check Railway deployment
                </p>
                <button onclick="this.parentElement.remove(); window.__tts_error_shown = false;" style="
                    margin-top: 10px;
                    background: #CC0000;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Dismiss</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Create global instance
window.unifiedTTS = new UnifiedTTSHandler();

// Override ALL existing TTS methods to use unified handler
// This prevents ANY fallback to macOS voices

// Override window.tts
if (window.tts) {
    window.tts.generateAudio = async function(text, voice) {
        const blob = await window.unifiedTTS.generateSpeech(text, voice);
        return blob;
    };
    
    window.tts.speak = async function(text, voice) {
        return await window.unifiedTTS.speak(text, voice);
    };
}

// Override localTTS
if (window.localTTS) {
    window.localTTS.speak = async function(text, speaker) {
        return await window.unifiedTTS.speak(text, speaker);
    };
    
    window.localTTS.generateSpeech = async function(text, speaker) {
        return await window.unifiedTTS.generateSpeech(text, speaker);
    };
}

// Override elevenLabs
if (window.elevenLabs) {
    window.elevenLabs.speak = async function(text, avatar) {
        return await window.unifiedTTS.speak(text, avatar);
    };
    
    window.elevenLabs.generateSpeech = async function(text, voice) {
        return await window.unifiedTTS.generateSpeech(text, voice);
    };
}

// Override dynamicTTS
if (window.dynamicTTS) {
    window.dynamicTTS.speak = async function(text, speaker) {
        return await window.unifiedTTS.speak(text, speaker);
    };
}

// Override studentAudioSystem
if (window.studentAudioSystem) {
    window.studentAudioSystem.speakSlideContent = async function(text, avatar) {
        return await window.unifiedTTS.speak(text, avatar);
    };
}

// Prevent ANY speechSynthesis usage
Object.defineProperty(window, 'speechSynthesis', {
    get: function() {
        console.warn('⛔ speechSynthesis blocked - use unifiedTTS instead');
        return {
            speak: () => console.error('Use unifiedTTS.speak() instead'),
            cancel: () => {},
            getVoices: () => [],
            pending: false,
            speaking: false,
            paused: false
        };
    }
});

// Test functions
window.testTTS = {
    kelly: () => window.unifiedTTS.speak("Hi! I'm Kelly with our custom voice synthesis!", 'kelly'),
    ken: () => window.unifiedTTS.speak("Hello! I'm Ken using our trained voice model!", 'ken'),
    status: async () => {
        await window.unifiedTTS.initPromise;
        console.log('🎤 Unified TTS Status:', {
            baseUrl: window.unifiedTTS.baseUrl,
            isAvailable: window.unifiedTTS.isAvailable,
            noMacOSFallback: true
        });
    }
};

console.log('✅ Unified TTS Handler loaded - test with: testTTS.kelly() or testTTS.status()');
