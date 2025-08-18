/**
 * Local TTS Integration - Works with any available engine
 */
class LocalTTSIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:5002';
        this.isAvailable = false;
        this.checkAvailability();
    }
    
    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            this.isAvailable = data.status === 'healthy';
            console.log('🎤 Local TTS:', data);
            return data;
        } catch (error) {
            this.isAvailable = false;
            return null;
        }
    }
    
    async generateSpeech(text, speaker = 'kelly') {
        const response = await fetch(`${this.baseUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speaker })
        });
        
        if (!response.ok) throw new Error('TTS failed');
        return await response.blob();
    }
    
    async speak(text, speaker = 'kelly') {
        try {
            const audioBlob = await this.generateSpeech(text, speaker);
            const audioUrl = URL.createObjectURL(audioBlob);

            if (window.currentAudio) {
                window.currentAudio.pause();
            }

            const audio = new Audio(audioUrl);
            window.currentAudio = audio;

            const avatarBg = document.querySelector('.avatar-background');
            if (avatarBg) {
                avatarBg.classList.add('speaking');
                audio.onended = () => {
                    avatarBg.classList.remove('speaking');
                    URL.revokeObjectURL(audioUrl);
                };
            }

            return audio.play();
        } catch (error) {
            console.error('TTS error:', error);
            // Do NOT fall back to macOS voice; surface a user-visible error instead
            if (window.__ml_toast) {
                window.__ml_toast('TTS unavailable. Ensure local server is running or deploy /api/tts.');
            }
            throw error;
        }
    }
}

window.localTTS = new LocalTTSIntegration();

// Override existing TTS
if (window.tts && window.tts.generateAudio) {
    const original = window.tts.generateAudio;
    window.tts.generateAudio = async function(text, voice) {
        if (window.localTTS.isAvailable) {
            return await window.localTTS.generateSpeech(text, voice.toLowerCase());
        }
        return original.call(this, text, voice);
    };
}

// Test functions
window.testLocalTTS = {
    kelly: () => window.localTTS.speak("Hi! I'm Kelly with free local voice synthesis!", 'kelly'),
    ken: () => window.localTTS.speak("Hello! I'm Ken using your local TTS server!", 'ken'),
    status: () => window.localTTS.checkAvailability()
};
