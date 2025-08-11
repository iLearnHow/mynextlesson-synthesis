#!/usr/bin/env node
/**
 * PhaseDNA v1 Linter
 * Validates data/*.phased.json files for required fields and phrasing rules.
 */
const fs = require('fs');
const path = require('path');

function readJSON(file){
  try{ return JSON.parse(fs.readFileSync(file, 'utf8')); }catch(e){ return null; }
}

function lintFile(file){
  const warnings = [];
  const j = readJSON(file);
  if (!j) return { file, ok:false, warnings:[`Invalid JSON`] };
  if (j.metadata?.version !== 'phase_v1') warnings.push('metadata.version should be "phase_v1"');
  const phases = Array.isArray(j.phases) ? j.phases : [];
  const byId = Object.fromEntries(phases.map(p=>[p.id,p]));
  const need = ['welcome','beginning','middle','end','wisdom'];
  need.forEach(id=>{ if(!byId[id]) warnings.push(`Missing phase: ${id}`); });
  ['beginning','middle','end'].forEach(id=>{
    const p = byId[id]; if(!p) return;
    if (!p.timing) warnings.push(`${id}: missing timing`);
    const q = p.question || {}; const ch = Array.isArray(q.choices) ? q.choices : [];
    if (!q.text) warnings.push(`${id}: missing question.text`);
    if (!ch.some(c=>c.id==='a') || !ch.some(c=>c.id==='b')) warnings.push(`${id}: choices must include ids 'a' and 'b'`);
    if (!q.correct) warnings.push(`${id}: missing question.correct`);
    const tm = q.teachingMoments || {}; if (!tm.a || !tm.b) warnings.push(`${id}: missing teachingMoments for both 'a' and 'b'`);
  });
  if (!byId.welcome?.narration?.voiceOver) warnings.push('welcome: missing narration.voiceOver');
  if (!byId.wisdom?.narration?.voiceOver) warnings.push('wisdom: missing narration.voiceOver');
  // Phrasing rule
  phases.forEach(p=>{
    const vo = p?.narration?.voiceOver || '';
    if (/\bOption\s+[ABab]|true|false\b/.test(vo)) warnings.push(`${p.id}: voiceOver should avoid literal labels like 'Option A/B' or 'true/false'`);
  });
  return { file, ok: warnings.length===0, warnings };
}

function main(){
  const dataDir = path.resolve(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter(f=>/\.phased\.json$/.test(f)).map(f=>path.join(dataDir,f));
  let hadError = false;
  const out = files.map(f=>lintFile(f));
  out.forEach(r=>{
    if (r.ok) { console.log(`OK  ${path.basename(r.file)}`); }
    else { console.log(`WARN ${path.basename(r.file)}`); r.warnings.forEach(w=>console.log('  -', w)); hadError = true; }
  });
  if (hadError) process.exit(1);
}

if (require.main === module) main();


