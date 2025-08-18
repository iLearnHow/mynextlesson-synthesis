#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = (() => {
  const out = {};
  for (let i = 2; i < process.argv.length; i += 1) {
    const k = process.argv[i];
    const v = process.argv[i + 1];
    if (k === '--voice') out.voice = v;
    if (k === '--dir') out.dir = v;
  }
  return out;
})();

const ROOT = process.cwd();
const BASE = args.dir || (args.voice ? path.join(ROOT, '..', 'tts_dataset', args.voice) : null);
if (!BASE) { console.error('Provide --voice or --dir'); process.exit(1); }
const CLIPS = path.join(BASE, 'clips');
const REJECTED = path.join(BASE, 'rejected');
fs.mkdirSync(REJECTED, { recursive: true });

const manifestPath = path.join(BASE, 'manifest.json');
let manifest = { voice: args.voice || path.basename(BASE), clips: [] };
if (fs.existsSync(manifestPath)) { try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch {} }

function listWavs() {
  if (!fs.existsSync(CLIPS)) return [];
  const files = fs.readdirSync(CLIPS).filter(f => f.toLowerCase().endsWith('.wav'));
  files.sort();
  return files.map(f => ({ file: f }));
}

function ffprobeJSON(file) {
  const cmd = `ffprobe -v error -show_entries stream=sample_rate,channels -show_entries format=duration -of json ${JSON.stringify(file)}`;
  const out = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(out);
}

function ffmpegAstats(file) {
  const cmd = `ffmpeg -hide_banner -nostats -v error -i ${JSON.stringify(file)} -af astats=metadata=1:reset=1 -f null - 2>&1 | tail -n 50`;
  const out = execSync(cmd, { shell: '/bin/zsh', encoding: 'utf8' });
  const rms = /Overall RMS level:\s*([-+\d\.]+) dB/m.exec(out)?.[1];
  const peak = /Peak level:\s*([-+\d\.]+) dB/m.exec(out)?.[1];
  return { rmsLevel: rms ? Number(rms) : null, peakLevel: peak ? Number(peak) : null };
}

function auditOne(fRel) {
  const fAbs = path.join(CLIPS, fRel);
  try {
    const meta = ffprobeJSON(fAbs);
    const stream = (meta.streams || [])[0] || {};
    const duration = Number((meta.format || {}).duration || 0);
    const sample_rate = Number(stream.sample_rate || 0);
    const channels = Number(stream.channels || 0);
    let stats = { rmsLevel: null, peakLevel: null };
    try { stats = ffmpegAstats(fAbs); } catch {}
    return { file: fRel, duration, sample_rate, channels, ...stats };
  } catch (e) { return { file: fRel, error: e.message }; }
}

function accept(s) {
  if (s.error) return false;
  if (![24000, 44100].includes(s.sample_rate)) return false;
  if (s.channels !== 1) return false;
  if (!(s.duration >= 1.2 && s.duration <= 14.0)) return false;
  if (s.rmsLevel == null || s.peakLevel == null) return false;
  if (!(s.rmsLevel >= -33 && s.rmsLevel <= -8)) return false;
  if (!(s.peakLevel <= -0.1)) return false;
  return true;
}

function main() {
  if (!fs.existsSync(CLIPS)) { console.error(`No clips dir: ${CLIPS}`); process.exit(2); }
  const files = listWavs();
  const stats = files.map(f => auditOne(f.file));
  const accepted = stats.filter(accept);
  const rejected = stats.filter(s => !accept(s));
  // If all rejected solely due to sample rate mismatch, resample in-place to 24000 and re-audit quickly
  const needsResample = rejected.length > 0 && accepted.length === 0 && rejected.every(s => !s.error && s.channels === 1 && [44100].includes(s.sample_rate));
  if (needsResample) {
    for (const r of rejected) {
      const src = path.join(CLIPS, r.file);
      try {
        execSync(`ffmpeg -y -v error -i ${JSON.stringify(src)} -ac 1 -ar 24000 -c:a pcm_s16le ${JSON.stringify(src)}.tmp && mv ${JSON.stringify(src)}.tmp ${JSON.stringify(src)}`, { shell: '/bin/zsh' });
      } catch {}
    }
  }
  const stats2 = needsResample ? files.map(f => auditOne(f.file)) : stats;
  const accepted2 = stats2.filter(accept);
  const rejected2 = stats2.filter(s => !accept(s));
  for (const r of rejected2) {
    try { const src = path.join(CLIPS, r.file); const dst = path.join(REJECTED, r.file); if (fs.existsSync(src)) fs.renameSync(src, dst); } catch {}
  }
  const clipMap = new Map((manifest.clips || []).map(c => [c.file, c]));
  const cleanClips = accepted2.map(s => { const c = clipMap.get(s.file) || { file: s.file, transcript: '' }; return { ...c, duration: s.duration }; });
  const clean = { ...manifest, clips: cleanClips, filteredAt: new Date().toISOString(), totals: { count: cleanClips.length, minutes: Math.round((cleanClips.reduce((a,b)=>a+(b.duration||0),0)/60)*10)/10 } };
  fs.writeFileSync(path.join(BASE, 'clip_stats.json'), JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(BASE, 'clean_manifest.json'), JSON.stringify(clean, null, 2));
  console.log(JSON.stringify({ base: BASE, accepted: accepted2.length, rejected: rejected2.length, minutes: clean.totals.minutes }, null, 2));
}

main();


