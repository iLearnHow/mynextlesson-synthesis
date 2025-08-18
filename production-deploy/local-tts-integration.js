/**
 * Local TTS Integration - Works with any available engine
 */
class LocalTTSIntegration {
    constructor() {
        const host = (typeof location !== 'undefined' ? location.hostname : '');
        const isProduction = /ilearnhow\.com$/i.test(host);

        // Optional override via query param (?tts=<url>) or window.ILH_TTS_URL
        const qp = (typeof location !== 'undefined') ? new URLSearchParams(location.search) : null;
        const qpOverride = qp?.get('tts');
        const globalOverride = (typeof window !== 'undefined' && window.ILH_TTS_URL) ? String(window.ILH_TTS_URL) : null;

        // Candidate endpoints; first healthy wins. Cache per origin.
        const railway = 'https://tts-server-production-61b7.up.railway.app';
        const candidates = isProduction ? [
            'https://tts.ilearnhow.com',
            'https://api.ilearnhow.com',
            railway
        ] : [
            'http://localhost:5002'
        ];

        const cacheKey = '__ilh_tts_base_url_' + (host || 'local');
        let cached = null; try { cached = localStorage.getItem(cacheKey); } catch {}
        this.baseUrl = qpOverride || globalOverride || cached || candidates[0];

        this.isAvailable = false;
        this._resolveBaseUrl(candidates, cacheKey).catch(()=>{});
    }

    async _resolveBaseUrl(candidates, cacheKey){
        const tried = new Set();
        const tryList = [this.baseUrl, ...candidates].filter(u => { if (tried.has(u)) return false; tried.add(u); return true; });
        for (const url of tryList){
            if (await this._check(url)){
                this.baseUrl = url; this.isAvailable = true; try { localStorage.setItem(cacheKey, url); } catch {}
                return true;
            }
        }
        this.isAvailable = false; return false;
    }

    async _check(base){
        try{
            const r = await fetch(`${base}/health`, { method: 'GET', headers: { 'Accept':'application/json' }, cache: 'no-store' });
            if (!r.ok) return false; const data = await r.json().catch(()=>({}));
            const s = String(data?.status || '').toLowerCase();
            return ['ready','healthy','initializing'].includes(s);
        }catch{ return false; }
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
            // Route all playback through the unified #tts-audio element so
            // timing, analysis, and volume/mute are centralized.
            const audio = document.getElementById('tts-audio');
            if (!audio) throw new Error('#tts-audio element not found');
            try { audio.crossOrigin = 'anonymous'; } catch {}
            // Revoke previous object URL if we owned it
            try {
                if (window.__tts_active_object_url && window.__tts_active_object_url !== audioUrl) {
                    URL.revokeObjectURL(window.__tts_active_object_url);
                }
            } catch {}
            window.__tts_active_object_url = audioUrl;
            audio.src = audioUrl;
            const avatarBg = document.querySelector('.avatar-background');
            if (avatarBg) {
                avatarBg.classList.add('speaking');
                audio.onended = () => {
                    avatarBg.classList.remove('speaking');
                    try { if (window.__tts_active_object_url === audioUrl) { URL.revokeObjectURL(audioUrl); window.__tts_active_object_url = null; } } catch {}
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
