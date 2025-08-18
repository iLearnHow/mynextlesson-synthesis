#!/usr/bin/env node

/**
 * Deploy Demo - Quick Live URL Deployment
 * Deploys unified player to real URL for testing
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Unified Player Demo...');

// Create minimal deployment package
const deploymentFiles = [
    'index.html',
    'unified-player-controls.js', 
    'demo-lesson-the-sun.json',
    'complete-curriculum.js',
    'complete-elevenlabs-integration.js',
    'corrected-variant-generator-v2.js',
    'complete-lesson-player.js',
    'dna-file-loader.js'
];

// Check if all required files exist
console.log('📋 Checking required files...');
let allFilesExist = true;

deploymentFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - exists`);
    } else {
        console.log(`❌ ${file} - missing`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('❌ Deployment aborted - missing files');
    process.exit(1);
}

// Create deployment directory
if (!fs.existsSync('deploy-temp')) {
    fs.mkdirSync('deploy-temp');
}

// Helper: copy a directory recursively
function copyDir(src, dest){
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)){
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.statSync(s);
        if (stat.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
    }
}

// Copy files to deployment directory
console.log('📦 Preparing deployment package...');
deploymentFiles.forEach(file => {
    fs.copyFileSync(file, path.join('deploy-temp', file));
});

// Include data directory needed by curriculum loader
if (fs.existsSync('data')){
    console.log('📦 Including data/ directory');
    copyDir('data', path.join('deploy-temp', 'data'));
}

// Create simple deployment info
const deploymentInfo = {
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    description: 'Unified Player Demo - The Sun Lesson',
    files: deploymentFiles,
    features: [
        'Bottom control stack (Menu, Play/Pause, Volume, Code)',
        'Right rail icons (Age, Language, Tone, Model, Calendar, Settings, Find)',
        '35% right overlay popup system',
        'Manual playback control (no autoplay)',
        'Demo lesson: The Sun - Our Star',
        'Age progression system (2-102)',
        'iOS glass morphism styling'
    ]
};

fs.writeFileSync(path.join('deploy-temp', 'deployment-info.json'), JSON.stringify(deploymentInfo, null, 2));

console.log('✅ Deployment package ready in deploy-temp/');
console.log('\n📋 Deployment Info:');
console.log(JSON.stringify(deploymentInfo, null, 2));

// Instructions for manual deployment
console.log('\n🌐 Manual Deployment Options:');
console.log('1. Netlify Drop: Drag deploy-temp folder to https://app.netlify.com/drop');
console.log('2. Surge.sh: cd deploy-temp && npx surge');
console.log('3. Vercel: cd deploy-temp && npx vercel --prod');
console.log('4. GitHub Pages: Push deploy-temp contents to gh-pages branch');
console.log('\n🎯 Ready for live demo testing!');
