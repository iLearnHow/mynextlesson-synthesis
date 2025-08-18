// STOP ALL AUTO-PLAY AND FIX AVATAR SYNC
console.log('🛑 Stopping all auto-play and fixing avatar sync...');

// Block all auto-play attempts
(function() {
    // Override play methods to require user interaction
    const blockAutoPlay = function(methodName) {
        console.log(`❌ Blocked auto-play attempt from ${methodName}`);
        return Promise.resolve();
    };
    
    // Block student audio system auto-play
    if (window.studentAudioSystem) {
        const originalPlaySlide = window.studentAudioSystem.playSlide;
        let userInteracted = false;
        
        window.studentAudioSystem.playSlide = function(slideIndex, onComplete) {
            if (!userInteracted) {
                console.log(`🛑 Blocked auto-play of slide ${slideIndex} - waiting for user interaction`);
                return;
            }
            return originalPlaySlide.call(this, slideIndex, onComplete);
        };
        
        // Allow play only after user clicks
        document.addEventListener('click', () => { userInteracted = true; }, { once: true });
    }
    
    // Block any speech synthesis
    if (window.speechSynthesis) {
        window.speechSynthesis.speak = function() {
            console.log('🛑 Blocked speechSynthesis.speak');
        };
    }
    
    // Fix manifest URLs
    if (window.avatarSyncPlayer) {
        const originalGetVisemeUrl = window.avatarSyncPlayer.getVisemeUrl;
        window.avatarSyncPlayer.getVisemeUrl = function(speaker, viseme) {
            // Direct CDN URL without manifest files
            return `https://pub-16cb321dba5c429a8acbbacbc2f64d64.r2.dev/avatars/${speaker.toLowerCase()}/full/${viseme}/frame_01.webp`;
        };
    }
    
    // Ensure avatar sync is used for all TTS
    if (window.unifiedTTS && window.avatarSyncPlayer) {
        window.unifiedTTS.speak = async function(text, speaker = 'kelly') {
            console.log(`🎭 Using avatar sync for: "${text.substring(0, 30)}..."`);
            try {
                await window.avatarSyncPlayer.play(text, speaker);
                return true;
            } catch (error) {
                console.error('Avatar sync error:', error);
                return false;
            }
        };
    }
    
    // Fix lesson player speak method
    if (window.lessonPlayer) {
        window.lessonPlayer.speak = async function(text, speaker) {
            if (window.unifiedTTS) {
                return window.unifiedTTS.speak(text, speaker);
            }
        };
    }
    
    // Remove any pending auto-play
    setTimeout(() => {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.muted = true;
        });
    }, 100);
})();

console.log('✅ Auto-play blocked, avatar sync fixed');
