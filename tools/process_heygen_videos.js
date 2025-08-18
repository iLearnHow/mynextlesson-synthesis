#!/usr/bin/env node
/**
 * Process HeyGen Videos for Phoneme Extraction
 * Processes 60 minutes of Ken/Kelly videos into phoneme database
 * Total processing time: 2-3 hours (not days!)
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  videoDir: path.join(process.env.HOME, 'heygen_videos'),
  outputDir: path.join(process.env.HOME, 'ilearn_how', 'phoneme_data'),
  audioFormat: {
    sampleRate: 16000,  // MFA works best with 16kHz
    channels: 1         // Mono
  }
};

/**
 * Step 1: Extract audio from MP4 files (5-10 minutes)
 */
async function extractAudio() {
  console.log('📹 Step 1: Extracting audio from videos...');
  
  const videos = await fs.readdir(CONFIG.videoDir);
  const mp4Files = videos.filter(f => f.endsWith('.mp4'));
  
  for (const video of mp4Files) {
    const inputPath = path.join(CONFIG.videoDir, video);
    const outputPath = path.join(CONFIG.outputDir, video.replace('.mp4', '.wav'));
    
    const cmd = `ffmpeg -i "${inputPath}" -ac ${CONFIG.audioFormat.channels} -ar ${CONFIG.audioFormat.sampleRate} "${outputPath}" -y`;
    
    console.log(`  Extracting: ${video} → ${path.basename(outputPath)}`);
    execSync(cmd);
  }
  
  console.log('✅ Audio extraction complete!\n');
}

/**
 * Step 2: Prepare transcripts from batch files
 */
async function prepareTranscripts() {
  console.log('📝 Step 2: Preparing transcripts...');
  
  // Load your batch text files
  const batchFiles = [
    'heygen_batches/ken/batch_01.txt',
    'heygen_batches/ken/batch_02.txt',
    'heygen_batches/kelly/batch_01.txt',
    'heygen_batches/kelly/batch_02.txt'
  ];
  
  for (const batchFile of batchFiles) {
    const content = await fs.readFile(batchFile, 'utf8');
    const avatar = batchFile.includes('ken') ? 'ken' : 'kelly';
    const batchNum = batchFile.match(/batch_(\d+)/)[1];
    
    // Create .lab file for MFA
    const labPath = path.join(CONFIG.outputDir, `${avatar}_${batchNum}.lab`);
    const cleanContent = content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    await fs.writeFile(labPath, cleanContent);
    console.log(`  Created transcript: ${path.basename(labPath)}`);
  }
  
  console.log('✅ Transcripts ready!\n');
}

/**
 * Step 3: Run MFA alignment (30-60 minutes for 60 min of audio)
 */
async function runMFAAlignment() {
  console.log('🎯 Step 3: Running forced alignment...');
  console.log('  This will take 30-60 minutes for 60 minutes of audio');
  
  const cmd = `mfa align "${CONFIG.outputDir}" english_us_arpa english_us_arpa "${CONFIG.outputDir}/aligned" --clean`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Alignment complete!\n');
  } catch (error) {
    console.error('❌ MFA alignment failed. Make sure MFA is installed:');
    console.error('  conda install -c conda-forge montreal-forced-aligner');
    process.exit(1);
  }
}

/**
 * Step 4: Parse TextGrid files to extract phonemes (5-10 minutes)
 */
async function extractPhonemes() {
  console.log('🔍 Step 4: Extracting phoneme timings...');
  
  const textgridDir = path.join(CONFIG.outputDir, 'aligned');
  const files = await fs.readdir(textgridDir);
  const textgrids = files.filter(f => f.endsWith('.TextGrid'));
  
  const phonemeDatabase = {
    ken: { phonemes: [], utterances: [] },
    kelly: { phonemes: [], utterances: [] }
  };
  
  for (const file of textgrids) {
    const avatar = file.includes('ken') ? 'ken' : 'kelly';
    const content = await fs.readFile(path.join(textgridDir, file), 'utf8');
    
    // Parse TextGrid (simplified - you may want to use a proper parser)
    const phonemes = parseTextGrid(content);
    phonemeDatabase[avatar].phonemes.push(...phonemes);
    
    console.log(`  Extracted ${phonemes.length} phonemes from ${file}`);
  }
  
  // Save database
  const dbPath = path.join(CONFIG.outputDir, 'phoneme_database.json');
  await fs.writeFile(dbPath, JSON.stringify(phonemeDatabase, null, 2));
  
  console.log('✅ Phoneme database created!\n');
  return phonemeDatabase;
}

/**
 * Simple TextGrid parser (you may want to use a proper library)
 */
function parseTextGrid(content) {
  const phonemes = [];
  const lines = content.split('\n');
  
  let inPhoneTier = false;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes('name = "phones"')) {
      inPhoneTier = true;
    }
    
    if (inPhoneTier && line.includes('intervals [')) {
      // Extract interval data
      const startLine = lines[i + 1];
      const endLine = lines[i + 2];
      const textLine = lines[i + 3];
      
      if (startLine && endLine && textLine) {
        const start = parseFloat(startLine.split('=')[1]);
        const end = parseFloat(endLine.split('=')[1]);
        const text = textLine.split('=')[1].replace(/"/g, '').trim();
        
        if (text && text !== 'sp' && text !== 'sil') {
          phonemes.push({
            p: text.toUpperCase(),
            start: start,
            end: end
          });
        }
      }
      
      i += 4;
    } else {
      i++;
    }
  }
  
  return phonemes;
}

/**
 * Step 5: Create integration module for your player (30 minutes)
 */
async function createIntegrationModule(database) {
  console.log('🔧 Step 5: Creating player integration...');
  
  const integrationCode = `/**
 * HeyGen Phoneme Integration for UniversalLessonPlayer
 * Auto-generated from processed HeyGen videos
 */

class HeyGenPhonemeProvider {
  constructor() {
    this.database = ${JSON.stringify(database, null, 2)};
    this.cache = new Map();
  }
  
  /**
   * Find phonemes for given text and avatar
   */
  async getPhonemes(text, avatar) {
    const cacheKey = \`\${avatar}::\${text}\`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Search for exact or close matches in utterances
    const utterances = this.database[avatar].utterances;
    const match = this.findBestMatch(text, utterances);
    
    if (match) {
      const result = {
        audioUrl: match.audioFile,
        phonemes: match.phonemes,
        duration_s: match.duration
      };
      this.cache.set(cacheKey, result);
      return result;
    }
    
    return null;
  }
  
  findBestMatch(targetText, utterances) {
    // Simple fuzzy matching - you can improve this
    const normalized = targetText.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    
    for (const utterance of utterances) {
      const uttNorm = utterance.text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      if (uttNorm === normalized) {
        return utterance;
      }
    }
    
    // Could add fuzzy matching here
    return null;
  }
}

// Export for use in lesson player
window.HeyGenPhonemeProvider = HeyGenPhonemeProvider;
`;
  
  const outputPath = path.join(CONFIG.outputDir, 'heygen-phoneme-provider.js');
  await fs.writeFile(outputPath, integrationCode);
  
  console.log('✅ Integration module created!\n');
}

/**
 * Main process
 */
async function main() {
  console.log('🚀 HeyGen Video Processing Pipeline');
  console.log('===================================\n');
  
  // Create output directory
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  
  // Step 1: Extract audio (5-10 minutes)
  await extractAudio();
  
  // Step 2: Prepare transcripts
  await prepareTranscripts();
  
  // Step 3: Run MFA alignment (30-60 minutes)
  await runMFAAlignment();
  
  // Step 4: Extract phonemes (5-10 minutes)
  const database = await extractPhonemes();
  
  // Step 5: Create integration module
  await createIntegrationModule(database);
  
  console.log('🎉 Processing complete!');
  console.log('\nNext steps:');
  console.log('1. Include heygen-phoneme-provider.js in your index.html');
  console.log('2. Update UniversalLessonPlayer to use HeyGenPhonemeProvider');
  console.log('3. Test with a few sample phrases');
  console.log('\nTotal processing time: ~2-3 hours');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
