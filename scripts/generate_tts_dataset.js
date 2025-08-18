#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const args = (() => {
  const out = { minutes: 45, concurrency: 2, seed: 42 };
  for (let i = 2; i < process.argv.length; i += 1) {
    const k = process.argv[i];
    const v = process.argv[i + 1];
    if (k === '--voice') out.voice = v;
    if (k === '--voiceId') out.voiceId = v;
    if (k === '--minutes') out.minutes = Number(v);
    if (k === '--concurrency') out.concurrency = Number(v);
    if (k === '--seed') out.seed = Number(v);
  }
  return out;
})();

if (!args.voice || !args.voiceId) {
  console.error('Missing --voice or --voiceId');
  process.exit(1);
}
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_API_KEY) {
  console.error('Missing ELEVEN_API_KEY');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, '..', 'tts_dataset', args.voice);
const CLIPS_DIR = path.join(OUT_DIR, 'clips');
fs.mkdirSync(CLIPS_DIR, { recursive: true });

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function* iterCurriculumFiles() {
  if (!fs.existsSync(DATA_DIR)) throw new Error(`Curriculum dir not found: ${DATA_DIR}`);
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_curriculum.json'));
  for (const f of files) yield path.join(DATA_DIR, f);
}

function pick(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

function sentenceVariants(topic) {
  const base = topic.title?.trim() || topic.topic?.trim() || "Today's concept";
  const day = topic.day || topic.date || '';
  const start = [
    `Welcome! Today is Day ${day}. Let's explore ${base}.`,
    `Hey, I'm ${args.voice === 'ken' ? 'Ken' : 'Kelly'}. Ready to dive into ${base}?`,
    `${base} sounds simple, but there's a twist. Let's uncover it together.`,
  ];
  const q = [
    `Here's a quick question: What's one everyday example of ${base.toLowerCase()} in your life?`,
    `Try this: If ${base.toLowerCase()} were a superpower, what would its first move be?`,
    `Your turn—how would you explain ${base.toLowerCase()} to a curious friend?`,
  ];
  const teach = [
    `Let's lock it in: ${base} becomes easier when you break it into small, clear steps.`,
    `Here's the trick: notice patterns, make a tiny prediction, check it, repeat.`,
    `Keep it playful: ask a tiny question, try a tiny experiment, celebrate tiny wins.`,
  ];
  const fortune = [
    `Daily fortune: A patient step today makes ${base.toLowerCase()} feel natural tomorrow.`,
    `Daily fortune: Curiosity x courage = momentum. Keep going with ${base.toLowerCase()}.`,
    `Daily fortune: When you teach someone ${base.toLowerCase()}, you learn it twice.`,
  ];
  const lists = [
    `Three beat steps: notice, name, nudge—try it now with ${base.toLowerCase()}.`,
    `Quick checklist for ${base.toLowerCase()}: look closely, try gently, reflect briefly.`,
  ];
  return [...start, ...q, ...teach, ...fortune, ...lists].map(t => t.replace(/\s+/g, ' ').trim());
}

function collectLines(targetClips) {
  const topics = [];
  for (const file of iterCurriculumFiles()) {
    try {
      const j = readJSON(file);
      if (Array.isArray(j.days)) j.days.forEach(d => topics.push({ day: d.day, title: d.title }));
    } catch {}
  }
  if (topics.length === 0) topics.push({ day: 1, title: 'The Sun - Our Star' });
  const lines = [];
  for (const t of topics) for (const s of sentenceVariants(t)) lines.push({ text: s, topic: t.title, day: t.day });
  const desired = targetClips;
  const picked = pick(lines, Math.min(desired * 2, lines.length));
  const filtered = picked.filter(l => l.text.length >= 40 && l.text.length <= 180);
  return filtered.slice(0, desired);
}

async function synthesizeClip({ text, idx }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(args.voiceId)}`;
  const payload = {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    output_format: 'pcm_24000',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/wav' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`ElevenLabs ${res.status}: ${err}`); }
  const ab = await res.arrayBuffer();
  const outPath = path.join(CLIPS_DIR, `${String(idx).padStart(4, '0')}.wav`);
  fs.writeFileSync(outPath, Buffer.from(ab));
  return outPath;
}

async function pLimit(n, tasks) {
  const ret = []; const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(task); ret.push(p); executing.add(p);
    const clean = () => executing.delete(p); p.then(clean, clean);
    if (executing.size >= n) await Promise.race(executing);
  }
  return Promise.allSettled(ret);
}

async function main() {
  const targetClips = Math.max(60, Math.floor(args.minutes * 10));
  const lines = collectLines(targetClips + 20);
  console.log(`[${args.voice}] Preparing ${lines.length} lines → ${targetClips} clips`);
  const manifest = { voice: args.voice, voiceId: args.voiceId, sr: 24000, createdAt: new Date().toISOString(), clips: [] };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  let i = 0; const tasks = [];
  for (const line of lines) {
    const idx = i; i += 1;
    tasks.push(async () => {
      try {
        const out = await synthesizeClip({ text: line.text, idx });
        manifest.clips.push({ file: path.relative(OUT_DIR, out), transcript: line.text, topic: line.topic, day: line.day });
        if (manifest.clips.length % 10 === 0) fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log(`[${args.voice}] ${idx.toString().padStart(4, '0')} ✓`);
      } catch (e) {
        console.warn(`[${args.voice}] ${idx.toString().padStart(4, '0')} ✗ ${e.message}`);
      }
    });
  }
  await pLimit(args.concurrency, tasks);
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const tsv = ['file\ttranscript\ttopic\tday'].concat(manifest.clips.map(c => `${c.file}\t${c.transcript.replaceAll('\t',' ').replaceAll('\n',' ')}\t${c.topic||''}\t${c.day||''}`)).join(os.EOL);
  fs.writeFileSync(path.join(OUT_DIR, 'transcripts.tsv'), tsv);
  console.log(`[${args.voice}] Done. ${manifest.clips.length} clips at ${OUT_DIR}`);
}

{ let s = (args.seed >>> 0) || 1; Math.random = function(){ s = (1664525 * s + 1013904223) % 4294967296; return s / 4294967296; }; }
main().catch(e => { console.error(e); process.exit(1); });


