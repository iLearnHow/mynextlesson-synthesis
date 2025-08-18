// Force avatar sync to work immediately
console.log('🎭 Forcing avatar sync activation...');

// Override the speak function to use avatar sync
if (window.unifiedTTS && window.avatarSyncPlayer) {
    window.unifiedTTS.speak = async function(text, speaker = 'kelly') {
        console.log(`🎤 Avatar sync speaking: ${speaker} - "${text.substring(0, 50)}..."`);
        
        // Use avatar sync player
        try {
            await window.avatarSyncPlayer.play(text, speaker);
            return true;
        } catch (error) {
            console.error('Avatar sync failed:', error);
            
            // Fallback to audio only
            const audio = new Audio();
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Block macOS voice
            console.warn('❌ TTS unavailable, no fallback allowed');
            return false;
        }
    };
}

// Ensure lesson player uses avatar sync
if (window.lessonPlayer) {
    window.lessonPlayer.fullFrameVisemesEnabled = true;
    window.lessonPlayer.speak = async function(text, speaker) {
        return window.unifiedTTS.speak(text, speaker);
    };
}

// Override student audio system to prevent auto-play
if (window.studentAudioSystem) {
    const originalPlaySlide = window.studentAudioSystem.playSlide;
    window.studentAudioSystem.playSlide = function(slideIndex) {
        console.log(`🔇 Blocked auto-play of slide ${slideIndex}`);
        // Don't auto-play
    };
    
    // Add manual play function
    window.studentAudioSystem.playSlideManual = originalPlaySlide;
}

console.log('✅ Avatar sync forced active');
