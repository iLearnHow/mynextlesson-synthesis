/**
 * Fix Live Issues - Clean UI & Better Audio
 */

// 1. Fix Modal Position - Don't cover avatars
function fixModalPosition() {
    const style = document.createElement('style');
    style.textContent = `
        /* Move lesson selector to not block avatar */
        #lesson-variant-selector {
            top: 20px !important;
            right: 20px !important;
            left: auto !important;
            transform: none !important;
            max-width: 350px !important;
        }
        
        /* Ensure avatars are always visible */
        .avatar-background {
            z-index: 1 !important;
        }
        
        /* Keep modals above avatar but positioned better */
        #lesson-variant-selector {
            z-index: 1000 !important;
        }
        
        /* Make close button more obvious */
        #lesson-variant-selector .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #FF3B30;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

// 2. Fix TTS - Use generated audio files
function fixTTSSystem() {
    // Override the fallback system
    if (window.dynamicTTS) {
        // Ensure it's using our generated audio
        window.dynamicTTS.useFallback = false;
        
        // Fix the audio loading
        window.dynamicTTS.loadScripts = async function() {
            // Force reload the script mappings
            try {
                const kellyResponse = await fetch('/heygen_batches/kelly/batch_01.txt');
                const kellyText = await kellyResponse.text();
                this.scriptLines.kelly = kellyText.split('\n').filter(line => line.trim());
                
                const kenResponse = await fetch('/heygen_batches/ken/batch_01.txt');
                const kenText = await kenResponse.text();
                this.scriptLines.ken = kenText.split('\n').filter(line => line.trim());
                
                console.log('✅ TTS Scripts Reloaded:', {
                    kelly: this.scriptLines.kelly.length,
                    ken: this.scriptLines.ken.length
                });
            } catch (error) {
                console.warn('Script loading failed, using pre-recorded only');
            }
        };
        
        // Reload scripts
        window.dynamicTTS.loadScripts();
    }
}

// 3. Fix Autoplay - Add user interaction handler
function fixAutoplay() {
    // Add click-to-start overlay
    const startOverlay = document.createElement('div');
    startOverlay.id = 'audio-start-overlay';
    startOverlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
            color: white;
            font-size: 24px;
            cursor: pointer;
        ">
            <div style="text-align: center;">
                <p>🔊 Click anywhere to enable audio</p>
                <button style="
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 20px;
                    cursor: pointer;
                ">Start Learning with Audio</button>
            </div>
        </div>
    `;
    
    startOverlay.onclick = function() {
        // Enable audio context
        if (window.studentAudioSystem && window.studentAudioSystem.audioContext) {
            window.studentAudioSystem.audioContext.resume();
        }
        
        // Remove overlay
        startOverlay.remove();
        
        // Start first audio
        if (window.lessonFix && window.lessonFix.currentSlideIndex !== undefined) {
            window.lessonFix.playSlideAudio();
        }
    };
    
    // Only show if audio context is suspended
    if (window.AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            document.body.appendChild(startOverlay);
        }
    }
}

// 4. Clean up UI elements
function cleanupUI() {
    // Hide debug elements
    const debugElements = document.querySelectorAll('[class*="debug"], [id*="debug"]');
    debugElements.forEach(el => el.style.display = 'none');
    
    // Ensure lesson content is properly positioned
    const manifestViewer = document.querySelector('#manifest-slide-viewer');
    if (manifestViewer) {
        manifestViewer.style.marginTop = '80px'; // Below variant selector
    }
    
    // Auto-close lesson selector after selection
    const originalLoadVariant = window.lessonFix?.loadVariant;
    if (originalLoadVariant) {
        window.lessonFix.loadVariant = async function(variant) {
            await originalLoadVariant.call(this, variant);
            
            // Auto-close the selector
            setTimeout(() => {
                const selector = document.getElementById('lesson-variant-selector');
                if (selector) {
                    selector.style.display = 'none';
                }
            }, 500);
        };
    }
}

// 5. Verify what audio is actually playing
function verifyAudioSource() {
    // Intercept audio creation to log source
    const OriginalAudio = window.Audio;
    window.Audio = function(src) {
        console.log('🎵 Audio source:', src);
        
        // Check if it's our generated audio or fallback
        if (src && src.includes('generated_audio')) {
            console.log('✅ Using generated Ken/Kelly audio');
        } else if (src && src.includes('production-deploy')) {
            console.log('⚠️ Using pre-recorded audio');
        } else {
            console.log('❌ Using unknown audio source');
        }
        
        return new OriginalAudio(src);
    };
    
    // Check speech synthesis usage
    if (window.speechSynthesis) {
        const originalSpeak = window.speechSynthesis.speak;
        window.speechSynthesis.speak = function(utterance) {
            console.log('🤖 Using browser TTS (robot voice):', utterance.text.substring(0, 50) + '...');
            return originalSpeak.call(this, utterance);
        };
    }
}

// Apply all fixes
console.log('🔧 Applying live site fixes...');
fixModalPosition();
fixTTSSystem();
fixAutoplay();
cleanupUI();
verifyAudioSource();
console.log('✅ Fixes applied');

// Export for manual testing
window.audioTest = {
    testKelly: () => {
        if (window.dynamicTTS) {
            window.dynamicTTS.speak("Hello, I'm Kelly. Welcome to today's lesson!", 'kelly');
        }
    },
    testKen: () => {
        if (window.dynamicTTS) {
            window.dynamicTTS.speak("Hi there! I'm Ken. Let's learn together!", 'ken');
        }
    },
    checkStatus: () => {
        console.log('TTS Status:', {
            dynamicTTS: !!window.dynamicTTS,
            scriptLines: window.dynamicTTS?.scriptLines,
            audioFiles: !!document.querySelector('audio[src*="generated_audio"]'),
            speechSynthesis: 'speechSynthesis' in window
        });
    }
};
