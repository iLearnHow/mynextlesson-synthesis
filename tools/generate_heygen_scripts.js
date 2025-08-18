#!/usr/bin/env node
/*
Generate HeyGen-ready script lines from real lesson data.
Outputs two files with identical content for now: ken.txt and kelly.txt.
Sources: phased lesson JSONs and monthly curriculum titles.
*/
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const OUT_DIR = path.resolve(__dirname, '..', 'tts_scripts');

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function collectTexts() {
  const texts = new Set();
  const add = (s) => {
    if (!s) return; const t = String(s).replace(/\s+/g, ' ').trim();
    if (!t) return; if (t.length < 12) return; if (t.length > 220) return; // bound per line
    texts.add(t);
  };

  // Phased lessons (English)
  const phased = ['the-sun.en.phased.json','the-moon.en.phased.json','earths-magnificent-oceans.en.phased.json','puppies.en.phased.json'];
  for (const f of phased) {
    const j = readJsonSafe(path.join(DATA_DIR, f)); if (!j) continue;
    add(j?.metadata?.title);
    for (const ph of j.phases || []) {
      add(ph?.narration?.voiceOver);
      // Screen steps
      (ph?.screen?.steps || []).forEach(st => {
        (st?.show || []).forEach(el => add(el?.text));
      });
      // Question blocks
      const q = ph?.question;
      if (q) {
        add(q.text);
        (q.choices || []).forEach(c => add(c.text));
        if (q.teachingMoments) { Object.values(q.teachingMoments).forEach(add); }
      }
    }
  }

  // Monthly curricula titles
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  for (const m of months) {
    const j = readJsonSafe(path.join(DATA_DIR, `${m}_curriculum.json`));
    if (!j) continue;
    (j.days||[]).forEach(d => add(d.title));
  }

  return Array.from(texts);
}

function splitToSentences(text) {
  const parts = String(text).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return [];
  // Merge very short fragments
  const out = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + ' ' + p).trim().length <= 160) { buf = (buf ? buf + ' ' : '') + p; }
    else { if (buf) out.push(buf); buf = p; }
  }
  if (buf) out.push(buf);
  return out;
}

function buildLines() {
  const raw = collectTexts();
  const sentences = raw.flatMap(splitToSentences).map(s => s.replace(/[\u2010-\u2015]/g, '-'));
  // De-duplicate again post-split
  const uniq = Array.from(new Set(sentences));
  // Shuffle for phoneme variety
  for (let i = uniq.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [uniq[i], uniq[j]] = [uniq[j], uniq[i]]; }

  // Trim to a target count for ~45–60 min total when read at ~140–160 wpm
  // Aim ~900–1100 lines of ~12–18 words each; we cap by length already. We'll take first 900.
  const target = Math.min(900, uniq.length);
  return uniq.slice(0, target);
}

function main() {
  const lines = buildLines();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const header = '# Paste lines into HeyGen in batches. Keep WAV mono 24 kHz. One line per take.\n\n';
  fs.writeFileSync(path.join(OUT_DIR, 'ken.txt'), header + lines.join('\n') + '\n', 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'kelly.txt'), header + lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${lines.length} lines to ${OUT_DIR}/ken.txt and kelly.txt`);
}

if (require.main === module) main();


