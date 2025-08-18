#!/usr/bin/env node
/*
Create 30‑minute script batches for HeyGen from real lesson lines.
Input: tts_scripts/ken.txt, tts_scripts/kelly.txt (one line per sentence; header allowed).
Output: heygen_batches/{ken,kelly}/batch_XX.txt (~30 min each at ~150 wpm).
We batch by target word count (default ~4,200 words ≈ 28–30 min) and insert blank lines for natural pauses.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'tts_scripts');
const OUT_DIR = path.join(ROOT, 'heygen_batches');
const TARGET_WORDS = parseInt(process.env.TARGET_WORDS || '4200', 10);
const PARAGRAPH_EVERY = parseInt(process.env.PARAGRAPH_EVERY || '5', 10); // insert blank line after N lines

function loadLines(filePath){
  const txt = fs.readFileSync(filePath, 'utf8');
  return txt.split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('#'));
}

function batchLines(lines){
  const batches = [];
  let cur = [];
  let words = 0;
  let paraCount = 0;
  for (const line of lines){
    const w = line.split(/\s+/).length;
    if (words + w > TARGET_WORDS && cur.length){
      batches.push(cur.join('\n') + '\n');
      cur = [];
      words = 0;
      paraCount = 0;
    }
    cur.push(line);
    words += w;
    paraCount++;
    if (paraCount >= PARAGRAPH_EVERY){
      cur.push('');
      paraCount = 0;
    }
  }
  if (cur.length){ batches.push(cur.join('\n') + '\n'); }
  return batches;
}

function writeBatches(name){
  const src = path.join(SRC_DIR, `${name}.txt`);
  if (!fs.existsSync(src)) { console.error(`Missing ${src}`); return; }
  const lines = loadLines(src);
  const batches = batchLines(lines);
  const dir = path.join(OUT_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  batches.forEach((text, i) => {
    const fp = path.join(dir, `batch_${String(i+1).padStart(2,'0')}.txt`);
    fs.writeFileSync(fp, text, 'utf8');
  });
  console.log(`${name}: ${lines.length} lines → ${batches.length} batch(es) at ~${TARGET_WORDS} words each`);
}

function writeReadme(){
  const body = `HeyGen Batches

Use these to render long-form 30-minute videos per batch:
- Choose avatar Ken or Kelly, neutral pose; disable music; keep head steady.
- Paste the entire batch text into the script field.
- Render at normal speed.
- Download the output and export Audio as WAV mono 24 kHz if available (or download MP4 and we will extract audio).

Next, place outputs here when ready:
- Audio: ~/tts_corpus/ken/ken_batch_XX.wav (or .mp4)
- Audio: ~/tts_corpus/kelly/kelly_batch_XX.wav (or .mp4)
- Transcript: use the exact text of batch_XX.txt as the .lab transcript.

We will align with MFA and auto-segment into utterances.
`;
  fs.writeFileSync(path.join(OUT_DIR, 'README.txt'), body, 'utf8');
}

function main(){
  writeBatches('ken');
  writeBatches('kelly');
  writeReadme();
}

if (require.main === module) main();


