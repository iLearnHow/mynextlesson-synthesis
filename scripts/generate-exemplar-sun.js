/* Generate “The Sun” exemplar (adult 40-60, fun, avatar Kelly)
   - Writes VTTs, minimal protobuf timelines, ElevenLabs VO -> mp3 -> 48k Opus chunks
   - Emits manifest.json and copies to api/examples for sandbox
   Usage:
     export ELEVENLABS_API_KEY=YOUR_KEY
     node scripts/generate-exemplar-sun.js
*/
const fs=require('fs'); const path=require('path'); const cp=require('child_process');
const fetch=(...a)=>import('node-fetch').then(({default:f})=>f(...a));
const VOICES={ kelly:'wAdymQH5YucAkXwmrdL0', ken:'fwrgq8CiDS7IPcDlFxgd' };
const CFG={ moduleId:'2025-02-28', dateKey:'2025-02-28', lang:'en', ageBand:'40-60', tone:'fun', avatar:process.env.EXEMPLAR_AVATAR||'kelly', sampleRate:48000, chunkMs:2000 };
// Compute output paths per avatar
CFG.outBase = path.resolve(`production-deploy/examples/${CFG.moduleId}/en/${CFG.ageBand}/${CFG.tone}/${CFG.avatar}`);
CFG.apiCopy = path.resolve(`api/examples/manifests/${CFG.moduleId}_en_${CFG.ageBand}_${CFG.tone}_${CFG.avatar}.json`);
// Rich, sentence-bounded exemplar (~5 minutes total)
 const S=[
  {t:'Welcome',on:'Lesson orientation',segs:[
   {ms:7000,text:'Welcome to this lesson about the powerful Sun.'},
   {ms:9000,text:'In the next few minutes, you’ll explore three quick questions and then a daily dose of wisdom.'},
   {ms:9000,text:'Notice how small sunlight cues shape mood, energy, and bone health.'},
   {ms:8000,text:'Let’s begin.'}
  ], popups:[{template:'definition_card',payload:{term:'Circadian rhythm',definition:'Your 24‑hour internal clock that syncs with light and dark.',at_ms:9000,side:'right'}}]},
  {t:'Beginning',on:'Vitamin cue',segs:[
   {ms:6000,text:'Question one: Which vitamin does sunlight help your body make most directly?'},
   {ms:9000,text:'As you consider it, think about bone strength and immune balance.'},
   {ms:9000,text:'Coaching: sunlight triggers vitamin D in skin.'},
   {ms:8000,text:'Food provides vitamin C; daylight does not.'}
  ], qa:{ question:'Which vitamin does sunlight most directly help you make?', choices:[{id:'A',text:'Vitamin D',feedback:'Vitamin D supports bones and immune balance.'},{id:'B',text:'Vitamin C',feedback:'Vitamin C comes from food; sunlight triggers vitamin D.'}] }, popups:[{template:'number_highlight',payload:{value:10,unit:'–20 min',label:'typical safe daylight window',at_ms:15000,side:'right'}}]},
  {t:'Middle',on:'Timing habit',segs:[
   {ms:7000,text:'Question two: Which timing is safer and more helpful for most days?'},
   {ms:9000,text:'Short morning light most days, or a long midday session once a week?'},
   {ms:9000,text:'Coaching: morning light resets your body clock and supports mood with lower burn risk.'},
   {ms:9000,text:'If midday is the only option, shorten the exposure and add shade.'},
   {ms:8000,text:'Micro‑habit: ten minutes before 10 a.m., without sunglasses if comfortable and safe.'}
  ], qa:{ question:'Which pattern is more helpful most days?', choices:[{id:'A',text:'Short morning light most days',feedback:'Morning light supports circadian rhythm with lower burn risk.'},{id:'B',text:'One long midday session weekly',feedback:'Midday is harsher; shorter morning sessions are safer for rhythm.'}] }, popups:[{template:'list_points',payload:{items:['Clock reset','Mood lift','Gentler on skin'],at_ms:17000,side:'right'}}]},
  {t:'End',on:'Cloudy/indoor fixes',segs:[
   {ms:8000,text:'Question three: Cloudy day or office hours—what’s the best move?'},
   {ms:9000,text:'Consider whether brief time outdoors beats window light.'},
   {ms:9000,text:'Coaching: glass filters brightness; even two minutes outside can help the brain register daylight.'},
   {ms:9000,text:'Barrier coach: link it to coffee, a voice memo, or a quick call—one cue, two wins.'}
  ], qa:{ question:'Cloudy or office day—what’s the best move?', choices:[{id:'A',text:'Two minutes outside',feedback:'Even brief outdoor light gives your brain a clear daylight signal.'},{id:'B',text:'Sit by a window',feedback:'Glass reduces brightness; outside light reaches your eye better.'}] }, popups:[
   {template:'definition_card',payload:{term:'Lux',definition:'Measurement of brightness that reaches your eye.',at_ms:15000,side:'left'}},
   {template:'number_highlight',payload:{value:1000,unit:' lux',label:'cloudy day outdoors',at_ms:21000,side:'right'}}
 ]},
 {t:'Wisdom',on:'Close + plan',segs:[
   {ms:8000,text:'Small, safe daylight is a signal, not a chore. It tells your brain: “It’s daytime—be steady.”'},
   {ms:9000,text:'This week, aim for short morning light most days. On cloudy or busy days, step out for two minutes.'},
   {ms:9000,text:'You can link it to coffee or your first message of the day—tiny, consistent, and doable.'},
   {ms:8000,text:'Tomorrow we’ll connect light to sleep timing, so nights feel calmer and mornings feel easier.'}
 ], popups:[{template:'quote_card',payload:{quote:'Plan with light, work with ease.',at_ms:2000,side:'right'}}]}
];
function mkd(p){fs.mkdirSync(p,{recursive:true});} function w(p,s){mkd(path.dirname(p)); fs.writeFileSync(p,s);} function ff(){try{cp.execSync('ffmpeg -version',{stdio:'ignore'});return true;}catch{return false;}}
function fmtTime(ms){const s=(ms/1000).toFixed(3); const [sec,f]=s.split('.'); const hh=String(Math.floor(sec/3600)).padStart(2,'0'); const mm=String(Math.floor(sec%3600/60)).padStart(2,'0'); const ss=String(sec%60).padStart(2,'0'); return `${hh}:${mm}:${ss}.${f}`;}
function vttFromSegs(segs){let t=0; let out='WEBVTT\n\n'; for(let i=0;i<segs.length;i++){const st=t; const en=t+Math.max(800,segs[i].ms); out+=`${fmtTime(st)} --> ${fmtTime(en)}\n${segs[i].text}\n\n`; t=en;} return out;}
function transformSegsForSlowdown(segs){
  const factor = 1/0.9; const interGap = Math.floor(250*factor);
  let t=0; const boundaries=[0]; let out='WEBVTT\n\n';
  for(let i=0;i<segs.length;i++){
    const dur = Math.max(800,segs[i].ms) * factor;
    const st = t; const en = t + dur;
    out += `${fmtTime(st)} --> ${fmtTime(en)}\n${segs[i].text}\n\n`;
    boundaries.push(Math.floor(en));
    t = en + (i<segs.length-1 ? interGap : 0);
  }
  return { vttText: out, boundaries, total: Math.floor(boundaries[boundaries.length-1]) + 0 };
}
function wordsTimingFromSegs(segs, perSegDurMs=null, interGapMs=250){
  // If perSegDurMs provided, it already includes slowdown; use it. Otherwise, fallback to estimates + slowdown.
  const out=[]; let t=0; const gap = perSegDurMs ? Math.floor(250*(1/0.9)) : interGapMs;
  for(let idx=0; idx<segs.length; idx++){
    const seg = segs[idx];
    const segDur = perSegDurMs ? Math.max(60, perSegDurMs[idx]||0) : Math.max(800, Math.floor(seg.ms*(1/0.9)));
    const tokens = String(seg.text).split(/\s+/).filter(Boolean);
    if (tokens.length === 0){ t += segDur + interGapMs; continue; }
    const weights = tokens.map(tok=> Math.max(1, tok.replace(/[^A-Za-z0-9']/g,'').length || 1));
    const totalW = weights.reduce((a,b)=>a+b,0);
    let cursor = t;
    for(let i=0;i<tokens.length;i++){
      const alloc = Math.floor(segDur * (weights[i]/totalW));
      const st = cursor; const en = Math.max(st+60, Math.min(t+segDur, st + alloc));
      out.push({ w: tokens[i], start_ms: st, end_ms: en });
      cursor = en;
    }
    t += segDur + (idx<segs.length-1 ? gap : 0);
  }
  return out;
}
function ffprobeDurationSeconds(file){
  try{
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${JSON.stringify(file)}`;
    const out = cp.execSync(cmd, {encoding:'utf8'}).trim();
    const sec = parseFloat(out);
    if (isFinite(sec) && sec > 0) return sec;
  }catch{}
  return 0;
}
function deriveSlide(slide){ if (slide.segs && slide.segs.length){ const tr=transformSegsForSlowdown(slide.segs); const d=tr.total; const b=tr.boundaries; const vtt=tr.vttText; const vo=slide.segs.map(s=>s.text); const popup=Array.isArray(slide.popups)&&slide.popups.length? slide.popups[0]: (slide.popup||null); return { d, b, vo, vttText:vtt, popup }; } else { const lines=slide.vtt||slide.vo||[]; const d=slide.d||Math.max(9000, lines.length*3000); const seg=Math.floor(d/Math.max(1,lines.length)); const b=[0]; for(let i=1;i<=lines.length;i++) b.push(Math.min(d,i*seg)); const vtt=vttFromSegs(lines.map(l=>({ms:seg,text:l}))); return { d, b, vo:lines, vttText:vtt, popup:slide.popup||null }; } }
function seg(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.opus'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a libopus -b:a 64k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} function silent(outBase,ms,d){if(!ff())return; const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.opus'); const secs=Math.max(1,Math.ceil(d/1000)); const cmd=`ffmpeg -y -f lavfi -t ${secs} -i anullsrc=r=48000:cl=mono -c:a libopus -b:a 64k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 
function segAAC(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.m4a'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a aac -b:a 96k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} function silentAAC(outBase,ms,d){if(!ff())return; const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.m4a'); const secs=Math.max(1,Math.ceil(d/1000)); const cmd=`ffmpeg -y -f lavfi -t ${secs} -i anullsrc=r=48000:cl=mono -c:a aac -b:a 96k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 
async function tts(txt,avatar){
  const key=process.env.ELEVENLABS_API_KEY||''; if(!key) return null;
  const id=VOICES[avatar]||VOICES.kelly;
  const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`,
    {method:'POST',headers:{'Accept':'audio/mpeg','Content-Type':'application/json','xi-api-key':key},
     body:JSON.stringify({text:txt,model_id:'eleven_monolingual_v1',voice_settings:{stability:0.4,similarity_boost:0.7,style:0,use_speaker_boost:false}})});
  if(!r.ok) return null; return Buffer.from(await r.arrayBuffer());
}
function toUri(f){const rel=path.relative(path.resolve('production-deploy'),path.join(CFG.outBase,f)).replace(/\\/g,'/'); return `/production-deploy/${rel}`;} function listChunks(i){const fsx=fs.readdirSync(CFG.outBase).filter(f=>f.startsWith(`${i}_`)&&f.endsWith('.opus')).sort(); return fsx.map(toUri);} 

// --- Minimal protobuf encoders (proto3) for viseme/expression timelines ---
function _V(n){ const a=[]; let v=n>>>0; while(v>=0x80){ a.push((v&0x7f)|0x80); v>>>=7; } a.push(v); return Buffer.from(a); }
function _F32(x){ const b=Buffer.alloc(4); b.writeFloatLE(x,0); return b; }
function _L(b){ return Buffer.concat([_V(b.length), b]); }
function encodeVT(frames){ const parts=[]; parts.push(_V((1<<3)|2), _L(Buffer.from('1.0'))); parts.push(_V((2<<3)|2), _L(Buffer.from('arpabet_v1'))); for(const f of frames){ const inner=[]; inner.push(_V((1<<3)|0), _V(f.t_ms>>>0)); inner.push(_V((2<<3)|0), _V(f.viseme_id>>>0)); inner.push(_V((3<<3)|5), _F32(f.weight??1)); const ib=Buffer.concat(inner); parts.push(_V((3<<3)|2), _L(ib)); } return Buffer.concat(parts); }
function encodeEX(channels){ const parts=[]; parts.push(_V((1<<3)|2), _L(Buffer.from('1.0'))); for(const c of channels){ const inner=[]; inner.push(_V((1<<3)|2), _L(Buffer.from(String(c.id)))); for(const k of (c.keys||[])){ const kb=Buffer.concat([ _V((1<<3)|0), _V(k.t_ms>>>0), _V((2<<3)|5), _F32(k.v??0) ]); inner.push(_V((2<<3)|2), _L(kb)); } const ib=Buffer.concat(inner); parts.push(_V((2<<3)|2), _L(ib)); } return Buffer.concat(parts); }
(async()=>{ mkd(CFG.outBase);
  // Build derived structure
  const DER=S.map(deriveSlide);
  // VTTs
  for(let i=0;i<S.length;i++){const d=DER[i]; w(path.join(CFG.outBase,`${i}.vtt`), d.vttText); }
  // Audio (per-sentence TTS → concat with 250ms gaps → global slowdown 0.90x → chunking)
  const can=ff();
  // prepare reusable 250ms silence (mp3 to match concat demuxer expectations)
  const silPath = path.join(CFG.outBase,'sil_250ms.mp3');
  try { if (can && !fs.existsSync(silPath)) { cp.execSync(`ffmpeg -y -f lavfi -t 0.25 -i anullsrc=r=48000:cl=mono -c:a libmp3lame -q:a 2 ${JSON.stringify(silPath)}`, {stdio:'ignore'}); } } catch {}
  for(let i=0;i<S.length;i++){
    const d=DER[i]; const slide=S[i]; const base=path.join(CFG.outBase,String(i));
    if (process.env.ELEVENLABS_API_KEY && can) {
      try{
        const segFiles=[];
        const segDurationsMs=[];
        for(let j=0;j<(slide.segs||[]).length;j++){
          const seg = slide.segs[j]; const mp3 = await tts(seg.text, CFG.avatar);
          const p = path.join(CFG.outBase,`${i}_s${j}.mp3`);
          if (mp3) { fs.writeFileSync(p, mp3); } else {
            // fallback: synthesize silence of seg.ms
            const sec = Math.max(0.8, seg.ms/1000);
            const p2 = path.join(CFG.outBase,`${i}_s${j}_sil.mp3`);
            cp.execSync(`ffmpeg -y -f lavfi -t ${sec} -i anullsrc=r=48000:cl=mono -c:a libmp3lame -q:a 2 ${JSON.stringify(p2)}`);
            fs.renameSync(p2, p);
          }
          segFiles.push(p);
          // Measure raw TTS duration and apply slowdown factor (~1/0.9)
          const durSec = ffprobeDurationSeconds(p);
          const slowedMs = Math.floor(durSec * 1000 / 0.90);
          segDurationsMs.push(slowedMs);
        }
        // build concat list with 250ms silences
        const listFile = path.join(CFG.outBase,`${i}_concat.txt`);
        const q = (p)=> `file '${String(p).replace(/'/g, "'\\''")}'\n`;
        let listContent = '';
        segFiles.forEach((p,idx)=>{ listContent += q(p); if (idx < segFiles.length-1) listContent += q(silPath); });
        fs.writeFileSync(listFile, listContent);
        const fullMp3 = path.join(CFG.outBase,`${i}_full.mp3`);
        cp.execSync(`ffmpeg -y -f concat -safe 0 -i ${JSON.stringify(listFile)} -c:a libmp3lame -q:a 2 ${JSON.stringify(fullMp3)}`);
        const slowMp3 = path.join(CFG.outBase,`${i}.mp3`);
        cp.execSync(`ffmpeg -y -i ${JSON.stringify(fullMp3)} -filter:a "atempo=0.90,aresample=48000" ${JSON.stringify(slowMp3)}`);
        seg(slowMp3,base,CFG.chunkMs); segAAC(slowMp3,base,CFG.chunkMs);

        // Persist word timings based on measured durations post-slowdown
        const words = wordsTimingFromSegs(slide.segs||[], segDurationsMs, 250);
        w(path.join(CFG.outBase,`${i}_words.json`), JSON.stringify({ words }, null, 2));
      } catch {
        silent(base,CFG.chunkMs,d.d); silentAAC(base,CFG.chunkMs,d.d);
      }
    } else if (can) { silent(base,CFG.chunkMs,d.d); silentAAC(base,CFG.chunkMs,d.d); }
  }
  // Dense but light timelines (visemes every 120ms; expressions: blink/smile/brow/head_nod)
  for(let i=0;i<S.length;i++){
    const s=S[i]; const d=DER[i];
    // word-driven viseme approximation: vowels -> open (id 4), consonants -> mid (id 2)
    const wlist = wordsTimingFromSegs(s.segs||[]);
    const frames=[]; const step=80;
    for(const w of wlist){
      const hasVowel = /[aeiouAEIOU]/.test(w.w);
      for(let t=w.start_ms; t<=w.end_ms; t+=step){ frames.push({ t_ms:t, viseme_id: hasVowel?4:2, weight: hasVowel?0.9:0.6 }); }
    }
    w(path.join(CFG.outBase,`${i}_vi.pb`), encodeVT(frames));
    const blinks=[1200,5200,8600].filter(ms=>ms<s.d).flatMap(ms=>[{t_ms:ms,v:1},{t_ms:ms+100,v:0}]);
    const smileOn=Math.max(600, Math.floor(s.d*0.5)); const smilePeak=Math.max(800, Math.floor(s.d*0.7));
    const expr=encodeEX([
      {id:'blink',keys:blinks},
      {id:'smile',keys:[{t_ms:smileOn,v:0.2},{t_ms:smilePeak,v:0.6}]},
      {id:'brow_raise',keys:[{t_ms:Math.max(500,Math.floor(s.d*0.35)),v:0.5},{t_ms:Math.max(900,Math.floor(s.d*0.35)+400),v:0.1}]},
      {id:'head_nod',keys:[{t_ms:Math.max(1000,s.d-1200),v:0.6},{t_ms:Math.max(1300,s.d-900),v:0.0}]}
    ]);
    w(path.join(CFG.outBase,`${i}_ex.pb`), expr);
    // words.json per slide
    if (!process.env.ELEVENLABS_API_KEY || !ff()){
      const wlist2 = wordsTimingFromSegs(s.segs||[]);
      w(path.join(CFG.outBase,`${i}_words.json`), JSON.stringify({ words: wlist2 }, null, 2));
    }
  }
  const manifest={ schema_version:'1.1', module_id:CFG.moduleId, date_key_utc:CFG.dateKey, content_version:'v2', language:CFG.lang, age_band:CFG.ageBand, tone:CFG.tone, avatar_id:CFG.avatar, slides:S.map((s,i)=>{ const d=DER[i]; return { slide_index:i, title:s.t, script_text:s.on, captions_vtt_uri:toUri(`${i}.vtt`), word_timing_json_uri:toUri(`${i}_words.json`), captions_region:'right', captions_offset_px:0, target_duration_ms:d.d, sentence_boundaries_ms:d.b, prosody_plan_pb_uri:null, viseme_timeline_pb_uri:toUri(`${i}_vi.pb`), expression_tracks_pb_uri:toUri(`${i}_ex.pb`), audio_manifest:{ codec:'opus', sample_rate:CFG.sampleRate, chunk_duration_ms:CFG.chunkMs, chunks:listChunks(i) }, qa:s.qa||null, popup_template_id:(s.popups&&s.popups[0]?.template)||s.popup?.template||null, popup_payload:(s.popups&&s.popups[0]?.payload)||s.popup?.payload||null, asset_hashes:{} }; }), integrity:{ manifest_sig:'hmac256:demo', created_at:new Date().toISOString() } };
  w(path.join(CFG.outBase,'manifest.json'), JSON.stringify(manifest,null,2)); w(CFG.apiCopy, JSON.stringify(manifest,null,2)); console.log('✅ Exemplar generated at', CFG.outBase); })().catch(e=>{ console.error(e); process.exit(1); });
