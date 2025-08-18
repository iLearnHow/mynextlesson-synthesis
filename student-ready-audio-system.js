/**
 * Student-Ready Audio System
 * Plays actual Ken/Kelly audio from manifest chunks
 */

class StudentReadyAudioSystem {
    constructor() {
        this.currentAudio = null;
        this.currentChunks = [];
        this.currentChunkIndex = 0;
        this.isPlaying = false;
        this.currentManifest = null;
        this.currentSlideIndex = 0;
        
        // Audio context for chunked playback
        this.audioContext = null;
        this.gainNode = null;
        
        this.initializeAudioContext();
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            console.log('✅ Audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    async loadManifest(manifest) {
        this.currentManifest = manifest;
        console.log('📁 Loaded manifest with', manifest.slides.length, 'slides');
    }
    
    async playSlide(slideIndex, onComplete) {
        if (!this.currentManifest || !this.currentManifest.slides[slideIndex]) {
            console.error('No slide data for index:', slideIndex);
            return;
        }
        
        const slide = this.currentManifest.slides[slideIndex];
        this.currentSlideIndex = slideIndex;
        
        console.log(`🎵 Playing slide ${slideIndex}: ${slide.title}`);
        
        // Stop any current playback
        this.stop();
        
        // Check if we have audio chunks
        if (slide.audio_manifest && slide.audio_manifest.chunks) {
            await this.playChunkedAudio(slide.audio_manifest, onComplete);
        } else {
            console.warn('No audio chunks found for slide', slideIndex);
            // Fallback to text content
            this.playFallbackAudio(slide, onComplete);
        }
    }
    
    async playChunkedAudio(audioManifest, onComplete) {
        const chunks = audioManifest.chunks;
        console.log(`🎵 Playing ${chunks.length} audio chunks`);
        
        // Create a single audio element for seamless playback
        const audio = new Audio();
        this.currentAudio = audio;
        
        // Load and concatenate chunks
        try {
            // For now, try the full audio file if it exists
            const slideNum = chunks[0].match(/(\d+)_/)?.[1];
            const fullAudioPath = chunks[0].replace(/\d+_\d+\.opus$/, `${slideNum}_full.mp3`);
            
            // Try full audio first
            const testResponse = await fetch(fullAudioPath);
            if (testResponse.ok) {
                console.log('✅ Using full audio file:', fullAudioPath);
                audio.src = fullAudioPath;
            } else {
                // Fall back to first chunk as a test
                console.log('📦 Using chunked audio');
                audio.src = chunks[0];
            }
            
            // Set up audio controls
            this.setupAudioControls(audio);
            
            // Set up completion handler
            audio.onended = () => {
                console.log('✅ Audio playback completed');
                this.isPlaying = false;
                this.updatePlayButton();
                if (onComplete) onComplete();
            };
            
            // Play the audio
            this.isPlaying = true;
            await audio.play();
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.playFallbackAudio(this.currentManifest.slides[this.currentSlideIndex], onComplete);
        }
    }
    
    setupAudioControls(audio) {
        // Wire up play/pause button
        const playBtn = document.getElementById('play-pause-master');
        if (playBtn) {
            playBtn.onclick = () => {
                if (audio.paused) {
                    audio.play();
                    this.isPlaying = true;
                } else {
                    audio.pause();
                    this.isPlaying = false;
                }
                this.updatePlayButton();
            };
        }
        
        // Wire up volume control
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.oninput = () => {
                audio.volume = volumeSlider.value;
            };
            audio.volume = volumeSlider.value;
        }
        
                    // Update avatar visual
            const avatarBg = document.querySelector('.avatar-background');
            if (avatarBg) {
                avatarBg.classList.add('speaking');
            }
            
            // Remove speaking class when audio ends
            const originalOnEnded = audio.onended;
            audio.onended = () => {
                if (avatarBg) {
                    avatarBg.classList.remove('speaking');
                }
                this.updatePlayButton();
                if (originalOnEnded) originalOnEnded();
            };
    }
    
    playFallbackAudio(slide, onComplete) {
        // Extract narration text
        const text = this.getSlideNarrationText(slide);
        
        // No browser speech fallback - require proper TTS
        console.error('❌ No TTS system available - Ken & Kelly voices required');
        if (window.unifiedTTS) {
            window.unifiedTTS.showTTSError();
        }
        this.isPlaying = false;
        this.updatePlayButton();
        if (onComplete) onComplete();
    }
    
    getSlideNarrationText(slide) {
        // Try to get actual narration from slide data
        if (slide.full_text) return slide.full_text;
        if (slide.script_text) return slide.script_text;
        
        // Build from question if available
        let text = slide.title + '. ';
        if (slide.qa && slide.qa.question) {
            text += slide.qa.question;
        }
        
        return text;
    }
    
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        // No speechSynthesis to cancel - using unified TTS
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    pause() {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }
    
    resume() {
        if (this.currentAudio && this.currentAudio.paused) {
            this.currentAudio.play();
            this.isPlaying = true;
            this.updatePlayButton();
        }
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-master');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸' : '▶';
        }
    }
    
    setVolume(value) {
        if (this.currentAudio) {
            this.currentAudio.volume = value;
        }
        
        // Update gain node for future audio
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }
}

// Make it globally available
window.studentAudioSystem = new StudentReadyAudioSystem();
console.log('🎓 Student-Ready Audio System loaded');
