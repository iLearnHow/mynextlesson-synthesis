#!/usr/bin/env node
/**
 * scripts/generate-phased-from-normalized.js
 * Deterministically convert our normalized DNA into PhaseDNA v1 files.
 * Usage:
 *   node scripts/generate-phased-from-normalized.js --input data/sun_normalized.json --outbase data/the-sun --lang en
 * Produces: data/the-sun.en.phased.json (and if --clone-es-fr, also .es and .fr copies)
 */

const fs = require('fs');
const path = require('path');

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2)); console.log('✅ wrote', p); }

function buildPhaseFromQ(id, qBlock){
  const qtext = qBlock.question?.neutral?.display_text || '';
  const a = qBlock.option_a?.display_text || 'A';
  const b = qBlock.option_b?.display_text || 'B';
  const correct = (qBlock.correct_option || 'b').toLowerCase();
  const tm = qBlock.teaching_moments || {};
  return {
    id,
    timing: { minListen: 8, maxWait: 16, autoAdvanceAfterFeedback: 3 },
    narration: {
      voiceOver: `Question. ${qtext}. I will read both choices, then you choose. Option A: ${a}. Option B: ${b}. If you're unsure, I'll guide you.`,
      onNoChoice: `Notice the key idea here: ${correct==='a'?a:b}. Let's select that and see why.`
    },
    screen: {
      steps: [
        { at: 'start', show: [ { type: 'text', region: 'question_deck', id: `${id}_q`, text: qtext } ] },
        { at: 'start', show: [ { type: 'choices', region: 'lower_deck', id: `${id}_choices`, text: '', extra: { a, b } } ] },
        { at: 'on_correct', show: [ { type: 'hint', region: 'right_shoulder', id: `${id}_tm_${correct}`, text: (correct==='a'?tm.option_a_response:tm.option_b_response) || '' } ] },
        { at: 'on_incorrect', show: [ { type: 'hint', region: 'right_shoulder', id: `${id}_tm_${correct==='a'?'b':'a'}`, text: (correct==='a'?tm.option_b_response:tm.option_a_response) || '' } ] }
      ]
    },
    question: {
      text: qtext,
      choices: [ { id: 'a', text: a }, { id: 'b', text: b } ],
      correct,
      teachingMoments: { a: tm.option_a_response || '', b: tm.option_b_response || '' }
    },
    avatar: { cues: [ { at: 'start', expression: 'question_curious' }, { at: 'on_correct', expression: 'happy_celebrating' }, { at: 'on_incorrect', expression: 'concerned_thinking' } ] }
  };
}

function generatePhased(normalized){
  const age = '25'; // use age_25 neutral as canonical copy for PhaseDNA v1 execution
  const q1 = normalized.core_lesson_structure?.question_1?.ages?.[age] || {};
  const q2 = normalized.core_lesson_structure?.question_2?.ages?.[age] || q1;
  const q3 = normalized.core_lesson_structure?.question_3?.ages?.[age] || q1;
  const welcomeVO = normalized.age_expressions?.[age]?.concept_name?.neutral?.voice_over_script || normalized.age_expressions?.[age]?.concept_name?.neutral?.display_text || 'Welcome.';
  const fortuneVO = normalized.wisdom_phase_content?.fortune?.neutral?.voice_over_script || normalized.wisdom_phase_content?.fortune?.neutral?.display_text || 'Carry this with you today.';

  return {
    metadata: { version: 'phase_v1', lessonId: normalized.lesson_metadata?.lesson_id || 'lesson', title: normalized.lesson_metadata?.universal_concept || 'Lesson' },
    phases: [
      {
        id: 'welcome',
        timing: { minListen: 6 },
        narration: { voiceOver: welcomeVO },
        screen: { steps: [ { at: 'start', show: [ { type: 'text', region: 'right_shoulder', id: 'intro', text: normalized.lesson_metadata?.universal_concept || '' } ] } ] },
        avatar: { cues: [ { at: 'start', expression: 'teaching_explaining' } ] }
      },
      buildPhaseFromQ('beginning', q1),
      buildPhaseFromQ('middle', q2),
      buildPhaseFromQ('end', q3),
      {
        id: 'wisdom',
        timing: { minListen: 6 },
        narration: { voiceOver: fortuneVO },
        screen: { steps: [ { at: 'start', show: [ { type: 'fortune', region: 'right_shoulder', id: 'fortune', text: fortuneVO } ] } ] },
        avatar: { cues: [ { at: 'start', expression: 'happy_celebrating' } ] }
      }
    ]
  };
}

function main(){
  const args = process.argv.slice(2);
  const get = (k, d=null) => { const i = args.indexOf(`--${k}`); return i>=0 ? args[i+1] : d; };
  const input = get('input');
  const outbase = get('outbase');
  const lang = get('lang','en');
  const clone = args.includes('--clone-es-fr');
  if (!input || !outbase) { console.error('Usage: --input data/x_normalized.json --outbase data/the-x --lang en [--clone-es-fr]'); process.exit(1); }
  const normalized = readJson(input);
  const phased = generatePhased(normalized);
  const out = `${outbase}.${lang}.phased.json`;
  writeJson(out, phased);
  if (clone) {
    for (const l of ['es','fr']) writeJson(`${outbase}.${l}.phased.json`, phased);
  }
}

if (require.main === module) main();




