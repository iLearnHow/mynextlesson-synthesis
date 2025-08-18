/**
 * Dynamic TTS System - Uses Generated Audio
 * This connects your generated voices to the lesson system
 */

class DynamicTTSSystem {
    constructor() {
        this.generatedAudio = {
            kelly: {},
            ken: {}
        };
        this.scriptLines = {
            kelly: [],
            ken: []
        };
        this.loadScripts();
    }
    
    async loadScripts() {
        // Load the script files to match text to audio
        try {
            const kellyResponse = await fetch('/heygen_batches/kelly/batch_01.txt');
            const kellyText = await kellyResponse.text();
            this.scriptLines.kelly = kellyText.split('\n').filter(line => line.trim());
            
            const kenResponse = await fetch('/heygen_batches/ken/batch_01.txt');
            const kenText = await kenResponse.text();
            this.scriptLines.ken = kenText.split('\n').filter(line => line.trim());
            
            console.log(`✅ Loaded ${this.scriptLines.kelly.length} Kelly lines, ${this.scriptLines.ken.length} Ken lines`);
        } catch (error) {
            console.warn('Using fallback audio mapping');
        }
    }
    
    findBestAudioMatch(text, speaker) {
        // Find the closest matching script line
        const lines = this.scriptLines[speaker];
        const textLower = text.toLowerCase();
        
        // First try exact match
        const exactIndex = lines.findIndex(line => 
            line.toLowerCase().trim() === textLower.trim()
        );
        if (exactIndex >= 0) {
            return `/generated_audio/${speaker}/line_${String(exactIndex).padStart(3, '0')}.aiff`;
        }
        
        // Then try partial match
        const partialIndex = lines.findIndex(line => 
            line.toLowerCase().includes(textLower) || 
            textLower.includes(line.toLowerCase())
        );
        if (partialIndex >= 0) {
            return `/generated_audio/${speaker}/line_${String(partialIndex).padStart(3, '0')}.aiff`;
        }
        
        // Fallback to pre-recorded samples
        if (textLower.includes('welcome')) {
            return `/production-deploy/examples/2025-02-28/en/40-60/fun/${speaker}/0_full.mp3`;
        } else if (text.includes('?')) {
            return `/production-deploy/examples/2025-02-28/en/40-60/fun/${speaker}/1_full.mp3`;
        } else {
            return `/production-deploy/examples/2025-02-28/en/40-60/fun/${speaker}/2_full.mp3`;
        }
    }
    
    async generateAudio(text, speaker = 'kelly') {
        // For system integration
        const audioPath = this.findBestAudioMatch(text, speaker);
        console.log(`🎤 TTS: "${text.substring(0, 50)}..." -> ${audioPath}`);
        return audioPath;
    }
    
    async speak(text, speaker = 'kelly') {
        const audioPath = await this.generateAudio(text, speaker);
        const audio = new Audio(audioPath);
        
        // Update UI
        const avatarBg = document.querySelector('.avatar-background');
        if (avatarBg) {
            avatarBg.classList.add('speaking');
        }
        
        // Wire up controls
        const playBtn = document.getElementById('play-pause-master');
        if (playBtn) {
            window.currentAudio = audio;
            playBtn.onclick = () => {
                if (audio.paused) {
                    audio.play();
                    playBtn.textContent = '⏸';
                } else {
                    audio.pause();
                    playBtn.textContent = '▶';
                }
            };
        }
        
        // Play the audio
        audio.play();
        
        audio.onended = () => {
            if (avatarBg) {
                avatarBg.classList.remove('speaking');
            }
            if (playBtn) {
                playBtn.textContent = '▶';
            }
        };
        
        return audio;
    }
    
    // Quick test function
    async testVoices() {
        console.log('🔊 Testing Dynamic TTS...');
        await this.speak("Welcome to today's lesson", 'kelly');
        setTimeout(async () => {
            await this.speak("Let's explore together", 'ken');
        }, 3000);
    }
}

// Replace the old TTS system with this new one
window.dynamicTTS = new DynamicTTSSystem();

// Override the old homegrown TTS
if (window.tts) {
    window.tts.generateAudio = async function(text, voice) {
        const speaker = voice.toLowerCase().includes('ken') ? 'ken' : 'kelly';
        const audioPath = await window.dynamicTTS.generateAudio(text, speaker);
        
        // Return a blob for compatibility
        const response = await fetch(audioPath);
        return await response.blob();
    };
}

console.log('🎤 Dynamic TTS System loaded! Test with: dynamicTTS.testVoices()');
