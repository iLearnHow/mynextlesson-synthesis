#!/usr/bin/env node
/**
 * Quick integration patch for UniversalLessonPlayer
 * Adds HeyGen phoneme support to existing player
 */

const fs = require('fs').promises;
const path = require('path');

async function createIntegrationPatch() {
  console.log('Creating HeyGen integration patch...\n');
  
  const patchCode = `
/**
 * HeyGen Phoneme Integration Patch
 * Add this to your complete-lesson-player.js after line 2456
 */

// Add to UniversalLessonPlayer class:

// Initialize HeyGen provider in constructor
constructor() {
  // ... existing code ...
  
  // Add HeyGen phoneme provider
  this.heygenProvider = null;
  this.initHeyGenProvider();
}

async initHeyGenProvider() {
  try {
    // Load HeyGen phoneme database
    const response = await fetch('/phoneme_data/phoneme_database.json');
    const database = await response.json();
    
    this.heygenProvider = {
      database,
      cache: new Map(),
      
      async getPhonemes(text, avatar) {
        const cacheKey = \`\${avatar}::\${text}\`;
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }
        
        // For now, do simple substring matching
        // You can enhance this with fuzzy matching later
        const avatarData = this.database[avatar];
        if (!avatarData) return null;
        
        // Look for exact text match in our phoneme segments
        // This is where you'd search your aligned utterances
        
        return null; // Will fall back to synthesis
      }
    };
    
    console.log('✅ HeyGen phoneme provider initialized');
  } catch (error) {
    console.warn('HeyGen phoneme provider not available:', error);
  }
}

// Replace the existing _requestPhonemesBackend method (around line 2456):
async _requestPhonemesBackend(narration, avatar) {
  // First, try HeyGen pre-recorded phonemes
  if (this.heygenProvider) {
    try {
      const heygenResult = await this.heygenProvider.getPhonemes(narration, avatar);
      if (heygenResult) {
        console.log('Using HeyGen phonemes for:', narration.substring(0, 50) + '...');
        return heygenResult;
      }
    } catch (error) {
      console.warn('HeyGen lookup failed:', error);
    }
  }
  
  // Original backend request code continues here...
  try {
    const response = await fetch('/api/phonemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: narration, voice: avatar })
    });
    
    if (!response.ok) throw new Error(\`Phoneme API error: \${response.status}\`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Phoneme backend request failed:', error);
    return null;
  }
}
`;

  // Save patch file
  await fs.writeFile('heygen_integration_patch.js', patchCode);
  
  console.log('✅ Integration patch created: heygen_integration_patch.js');
  console.log('\nTo apply:');
  console.log('1. Open complete-lesson-player.js');
  console.log('2. Add the initHeyGenProvider() call to constructor');
  console.log('3. Replace _requestPhonemesBackend method with patched version');
  console.log('4. Place phoneme_database.json in /phoneme_data/ directory');
}

// Quick test to verify integration
async function testIntegration() {
  console.log('\n📋 Quick Integration Test Commands:\n');
  
  console.log('# 1. Make sure MFA is installed:');
  console.log('conda create -n aligner -c conda-forge montreal-forced-aligner');
  console.log('conda activate aligner');
  console.log('mfa model download acoustic english_us_arpa');
  console.log('mfa model download dictionary english_us_arpa\n');
  
  console.log('# 2. Process your videos:');
  console.log('mkdir ~/heygen_videos');
  console.log('# Copy your MP4 files to ~/heygen_videos/');
  console.log('node tools/process_heygen_videos.js\n');
  
  console.log('# 3. Test in browser console:');
  console.log('lessonPlayer.heygenProvider.getPhonemes("Welcome to today\'s lesson", "ken");\n');
}

// Main
async function main() {
  await createIntegrationPatch();
  await testIntegration();
}

if (require.main === module) {
  main().catch(console.error);
}
