/**
 * Activate Dynamic TTS - Connect the existing ElevenLabs integration
 * This gives you true dynamic voice synthesis with Ken & Kelly
 */

console.log('🎯 Activating Dynamic TTS System...');

// First, check if ElevenLabs is available
if (typeof ElevenLabsIntegration === 'undefined') {
    console.warn('⚠️ ElevenLabs integration not loaded. Loading now...');
    
    // Dynamically load the integration
    const script = document.createElement('script');
    script.src = '/complete-elevenlabs-integration.js';
    script.onload = () => {
        console.log('✅ ElevenLabs integration loaded');
        initializeDynamicTTS();
    };
    document.head.appendChild(script);
} else {
    initializeDynamicTTS();
}

function initializeDynamicTTS() {
    // Create global instance
    window.elevenLabs = new ElevenLabsIntegration();
    
    // Check API key
    const apiKey = window.elevenLabs.apiKey;
    if (!apiKey || apiKey === 'your-elevenlabs-api-key') {
        console.warn('⚠️ ElevenLabs API key not set');
        
        // Provide easy setup
        const setupDiv = document.createElement('div');
        setupDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #FFF3CD;
                border: 2px solid #FFC107;
                border-radius: 8px;
                padding: 15px;
                max-width: 300px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <h4 style="margin: 0 0 10px 0;">🔑 API Key Needed</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    To enable Ken & Kelly's real voices, add your ElevenLabs API key:
                </p>
                <input type="password" id="elevenlabs-key-input" 
                    placeholder="Enter API key" 
                    style="width: 100%; padding: 5px; margin-bottom: 10px;">
                <button onclick="saveElevenLabsKey()" style="
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Save Key</button>
                <button onclick="this.parentElement.remove()" style="
                    margin-left: 10px;
                    background: #6C757D;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Later</button>
            </div>
        `;
        document.body.appendChild(setupDiv);
        
        // Add save function
        window.saveElevenLabsKey = function() {
            const key = document.getElementById('elevenlabs-key-input').value;
            if (key) {
                localStorage.setItem('elevenlabs_api_key', key);
                window.elevenLabs.apiKey = key;
                setupDiv.remove();
                console.log('✅ API key saved! Dynamic TTS ready.');
                
                // Test it
                window.elevenLabs.generateSpeech("API key configured successfully!", 'kelly');
            }
        };
    }
    
    // Override the static TTS approaches with dynamic
    overrideStaticTTS();
}

function overrideStaticTTS() {
    // Override homegrown TTS
    if (window.tts && window.tts.generateAudio) {
        const originalGenerate = window.tts.generateAudio;
        window.tts.generateAudio = async function(text, voice, language) {
            console.log('🔄 Redirecting to ElevenLabs dynamic TTS...');
            
            // Use ElevenLabs if available
            if (window.elevenLabs && window.elevenLabs.apiKey !== 'your-elevenlabs-api-key') {
                try {
                    const audioBlob = await window.elevenLabs.generateSpeech(text, voice.toLowerCase());
                    return audioBlob;
                } catch (error) {
                    console.warn('ElevenLabs failed, falling back:', error);
                    return originalGenerate.call(this, text, voice, language);
                }
            }
            
            return originalGenerate.call(this, text, voice, language);
        };
    }
    
    // Override dynamic TTS to use ElevenLabs
    if (window.dynamicTTS && window.dynamicTTS.speak) {
        const originalSpeak = window.dynamicTTS.speak;
        window.dynamicTTS.speak = async function(text, speaker) {
            console.log('🔄 Using ElevenLabs for speech...');
            
            // Use ElevenLabs if available
            if (window.elevenLabs && window.elevenLabs.apiKey !== 'your-elevenlabs-api-key') {
                try {
                    await window.elevenLabs.speak(text, speaker);
                    return;
                } catch (error) {
                    console.warn('ElevenLabs speak failed, falling back:', error);
                    return originalSpeak.call(this, text, speaker);
                }
            }
            
            return originalSpeak.call(this, text, speaker);
        };
    }
    
    // Override student audio system
    if (window.studentAudioSystem && window.studentAudioSystem.speakSlideContent) {
        const originalSpeak = window.studentAudioSystem.speakSlideContent;
        window.studentAudioSystem.speakSlideContent = async function(text, avatar) {
            console.log('🔄 Student audio using ElevenLabs...');
            
            if (window.elevenLabs && window.elevenLabs.apiKey !== 'your-elevenlabs-api-key') {
                try {
                    await window.elevenLabs.speak(text, avatar.toLowerCase());
                    return;
                } catch (error) {
                    console.warn('ElevenLabs failed for student audio:', error);
                }
            }
            
            return originalSpeak.call(this, text, avatar);
        };
    }
    
    console.log('✅ Dynamic TTS system activated!');
    
    // Add global test function
    window.testDynamicTTS = {
        kelly: () => window.elevenLabs.speak("Hi! I'm Kelly with dynamic voice synthesis!", 'kelly'),
        ken: () => window.elevenLabs.speak("Hello! I'm Ken speaking with real-time generation!", 'ken'),
        status: () => {
            console.log('Dynamic TTS Status:', {
                elevenLabsLoaded: !!window.elevenLabs,
                apiKeySet: window.elevenLabs?.apiKey !== 'your-elevenlabs-api-key',
                voicesConfigured: window.elevenLabs?.voices,
                ready: !!(window.elevenLabs && window.elevenLabs.apiKey !== 'your-elevenlabs-api-key')
            });
        }
    };
    
    console.log('💡 Test with: testDynamicTTS.kelly() or testDynamicTTS.status()');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeDynamicTTS, 1000); // Give other scripts time to load
    });
} else {
    setTimeout(initializeDynamicTTS, 1000);
}
