/**
 * Quick verification script to check TTS system health
 * Run this in the browser console to verify the fixes
 */

console.log('🔍 TTS System Verification Starting...\n');

// Check 1: Verify unified TTS is loaded
console.log('1️⃣ Checking Unified TTS:');
if (window.unifiedTTS) {
    console.log('✅ Unified TTS loaded');
    console.log(`   Base URL: ${window.unifiedTTS.baseUrl || 'Not connected'}`);
    console.log(`   Available: ${window.unifiedTTS.isAvailable}`);
} else {
    console.log('❌ Unified TTS not loaded');
}

// Check 2: Verify speechSynthesis is blocked
console.log('\n2️⃣ Checking speechSynthesis blocking:');
try {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        console.log('✅ speechSynthesis successfully blocked');
    } else {
        console.log('❌ speechSynthesis still accessible - found', voices.length, 'voices');
    }
} catch (e) {
    console.log('✅ speechSynthesis blocked with error:', e.message);
}

// Check 3: Check start button
console.log('\n3️⃣ Checking start button:');
const startBtn = document.getElementById('start-lesson-btn');
const startOverlay = document.getElementById('start-overlay');
if (startBtn) {
    console.log('✅ Start button found');
    console.log(`   onclick: ${startBtn.onclick}`);
    console.log(`   __mlStart defined: ${typeof window.__mlStart === 'function'}`);
} else {
    console.log('❌ Start button not found');
}
if (startOverlay) {
    const isVisible = startOverlay.style.display !== 'none';
    console.log(`   Overlay visible: ${isVisible}`);
} else {
    console.log('❌ Start overlay not found');
}

// Check 4: Check lesson player
console.log('\n4️⃣ Checking lesson player:');
if (window.lessonPlayer) {
    console.log('✅ Lesson player loaded');
    console.log(`   Current day: ${window.lessonPlayer.currentDay}`);
    console.log(`   Selected day: ${window.lessonPlayer.selectedDay}`);
    console.log(`   Current avatar: ${window.lessonPlayer.currentVariant?.avatar}`);
    
    // Calculate what day August 18, 2025 is
    const aug18 = new Date(2025, 7, 18); // Month is 0-indexed
    const start = new Date(2025, 0, 0);
    const diff = aug18 - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    console.log(`   August 18, 2025 is day: ${dayOfYear}`);
} else {
    console.log('❌ Lesson player not loaded');
}

// Check 5: Check TTS systems
console.log('\n5️⃣ Checking TTS systems loaded:');
const ttsSystems = [
    'window.tts',
    'window.localTTS', 
    'window.elevenLabs',
    'window.dynamicTTS',
    'window.studentAudioSystem',
    'window.kenKellyTTS',
    'window.unifiedTTS'
];

ttsSystems.forEach(sys => {
    const exists = eval(`typeof ${sys} !== 'undefined'`);
    console.log(`   ${sys}: ${exists ? '✅' : '❌'}`);
});

// Check 6: Test TTS
console.log('\n6️⃣ Testing TTS (press T to test):');
console.log('   Press T to test Kelly voice');
console.log('   Press K to test Ken voice');
console.log('   Press S to start lesson');

document.addEventListener('keydown', async (e) => {
    if (e.key.toLowerCase() === 't') {
        console.log('Testing Kelly voice...');
        try {
            await window.unifiedTTS.speak("Testing Kelly's voice. No robot voices allowed!", 'kelly');
        } catch (err) {
            console.error('Kelly test failed:', err);
        }
    }
    if (e.key.toLowerCase() === 'k') {
        console.log('Testing Ken voice...');
        try {
            await window.unifiedTTS.speak("Testing Ken's voice. Only human voices here!", 'ken');
        } catch (err) {
            console.error('Ken test failed:', err);
        }
    }
    if (e.key.toLowerCase() === 's') {
        console.log('Starting lesson...');
        if (window.__mlStart) {
            window.__mlStart();
        } else {
            console.error('__mlStart not defined');
        }
    }
});

console.log('\n✅ Verification script loaded. Check results above.');
