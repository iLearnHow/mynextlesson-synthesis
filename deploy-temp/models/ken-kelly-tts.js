/**
 * Ken & Kelly TTS Interface
 * Bridges between pre-recorded samples and future dynamic TTS
 */

class KenKellyTTS {
    constructor() {
        this.manifest = null;
        this.preRecordedPaths = {
            ken: {
                welcome: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/0_000.opus',
                question: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/1_000.opus',
                feedback: '/production-deploy/examples/2025-02-28/en/40-60/fun/ken/2_000.opus'
            },
            kelly: {
                welcome: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/0_full.mp3',
                question: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/1_full.mp3',
                feedback: '/production-deploy/examples/2025-02-28/en/40-60/fun/kelly/2_full.mp3'
            }
        };
        this.loadManifest();
    }
    
    async loadManifest() {
        try {
            const response = await fetch('/models/tts_manifest.json');
            this.manifest = await response.json();
            console.log('✅ TTS manifest loaded:', this.manifest);
        } catch (error) {
            console.warn('Using pre-recorded samples only');
        }
    }
    
    async generateAudio(text, speaker = 'kelly') {
        // Phase 1: Use pre-recorded samples (current)
        // Phase 2: Use trained models (future)
        
        const textLower = text.toLowerCase();
        
        // Match to closest pre-recorded sample
        if (textLower.includes('welcome') || textLower.includes('hello')) {
            return this.preRecordedPaths[speaker].welcome;
        } else if (text.includes('?')) {
            return this.preRecordedPaths[speaker].question;
        } else {
            return this.preRecordedPaths[speaker].feedback;
        }
    }
    
    isModelReady(speaker) {
        // Check if we have a trained model
        return false; // Will be true after training
    }
    
    async playAudio(text, speaker = 'kelly') {
        const audioUrl = await this.generateAudio(text, speaker);
        const audio = new Audio(audioUrl);
        
        // Update UI
        const avatarBg = document.querySelector('.avatar-background');
        if (avatarBg) {
            avatarBg.classList.add('speaking');
        }
        
        audio.play();
        
        audio.onended = () => {
            if (avatarBg) {
                avatarBg.classList.remove('speaking');
            }
        };
        
        return audio;
    }
}

// Make globally available
window.kenKellyTTS = new KenKellyTTS();
console.log('🎤 Ken & Kelly TTS Foundation loaded');
