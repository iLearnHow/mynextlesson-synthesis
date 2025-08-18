#!/usr/bin/env node

/**
 * Verify TTS deployment on ilearnhow.com
 * Run this after deploying to check everything works
 */

const https = require('https');

console.log('🔍 Verifying ilearnhow.com deployment...\n');

const checks = [
    {
        name: 'Homepage loads',
        path: '/',
        expected: 'iLearn How'
    },
    {
        name: 'TTS system loaded',
        path: '/dynamic-tts-system.js',
        expected: 'DynamicTTSSystem'
    },
    {
        name: 'Kelly audio available',
        path: '/generated_audio/kelly/line_000.aiff',
        expected: null,
        checkStatus: true
    },
    {
        name: 'Ken audio available', 
        path: '/generated_audio/ken/line_000.aiff',
        expected: null,
        checkStatus: true
    },
    {
        name: 'Models loaded',
        path: '/models/ken-kelly-tts.js',
        expected: 'KenKellyTTS'
    }
];

let passed = 0;
let failed = 0;

function checkResource(check, callback) {
    const options = {
        hostname: 'ilearnhow.com',
        path: check.path,
        method: check.checkStatus ? 'HEAD' : 'GET'
    };
    
    https.request(options, (res) => {
        if (check.checkStatus) {
            // Just check status code
            if (res.statusCode === 200) {
                console.log(`✅ ${check.name}`);
                passed++;
            } else {
                console.log(`❌ ${check.name} (Status: ${res.statusCode})`);
                failed++;
            }
            callback();
        } else {
            // Check content
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes(check.expected)) {
                    console.log(`✅ ${check.name}`);
                    passed++;
                } else {
                    console.log(`❌ ${check.name}`);
                    failed++;
                }
                callback();
            });
        }
    }).on('error', (err) => {
        console.log(`❌ ${check.name} (Error: ${err.message})`);
        failed++;
        callback();
    }).end();
}

// Run checks sequentially
let index = 0;
function runNextCheck() {
    if (index < checks.length) {
        checkResource(checks[index], () => {
            index++;
            runNextCheck();
        });
    } else {
        // Summary
        console.log('\n📊 Deployment Verification Summary:');
        console.log(`   Passed: ${passed}/${checks.length}`);
        console.log(`   Failed: ${failed}/${checks.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 SUCCESS! Your TTS system is live on ilearnhow.com!');
        } else {
            console.log('\n⚠️  Some checks failed. Audio may need to be uploaded separately.');
            console.log('   Try: npx wrangler pages deploy generated_audio --project-name=ilearnhow');
        }
    }
}

runNextCheck();
