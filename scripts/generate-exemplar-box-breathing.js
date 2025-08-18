/* Generate Box Breathing exemplar (neutral 40-60) for 2025-08-14
   Produces: manifest.json, per-slide VTT + words.json, viseme/expression placeholders,
   and dual audio formats (.opus/.m4a) chunked for the player.
*/
const fs=require('fs'); const path=require('path'); const cp=require('child_process');
const fetch=(...a)=>import('node-fetch').then(({default:f})=>f(...a));
const VOICES={ kelly:'wAdymQH5YucAkXwmrdL0', ken:'fwrgq8CiDS7IPcDlFxgd' };
const AVATAR=process.env.EXEMPLAR_AVATAR||'kelly';
const CFG={ dateKey:'2025-08-14', moduleId:'2025-08-14', lang:'en', ageBand:'40-60', tone:'neutral', avatar:AVATAR, sampleRate:48000, chunkMs:2000 };
CFG.outBase = path.resolve(`production-deploy/examples/${CFG.moduleId}/en/${CFG.ageBand}/${CFG.tone}/${CFG.avatar}`);
CFG.apiCopy = path.resolve(`api/examples/manifests/${CFG.moduleId}_en_${CFG.ageBand}_${CFG.tone}_${CFG.avatar}.json`);

const S=[
 // Slide 0 — Welcome
 {t:'Welcome', on:'Box breathing orientation', segs:[
  {ms:8500, text:'Welcome. Today we’ll practice box breathing—a steady rhythm to calm your body and steady your attention.'},
  {ms:7500, text:'It’s four parts: breathe in for four, hold for four, breathe out for four, hold for four.'},
  {ms:10000,text:'You don’t need to count out loud. A circle on the screen will expand, pause, contract, and pause with you.'},
  {ms:7000, text:'We’ll try a short round together, then set a tiny plan for your day.'}
 ], popups:[{template:'definition_card', payload:{term:'August 14 • Box Breathing', definition:'A five‑minute breathing ritual for calm focus.', at_ms:1000, side:'right'}}], overlay_plan:{ type:'box_breath', cadence:[0,0,0,0], cycles:0 }},
 // Slide 1 — First round
 {t:'First round', on:'Learn the rhythm', segs:[
  {ms:3500,text:'Sit comfortably. Shoulders relaxed.'},
  {ms:5500,text:'We’ll do two gentle cycles together. Watch the circle and let it guide you.'},
  {ms:4000,text:'In… two… three… four.'},
  {ms:4000,text:'Hold… two… three… four.'},
  {ms:4000,text:'Out… two… three… four.'},
  {ms:4000,text:'Hold… two… three… four.'},
  {ms:2500,text:'One more cycle, a touch softer.'},
  {ms:4000,text:'In… two… three… four.'},
  {ms:4000,text:'Hold… two… three… four.'},
  {ms:4000,text:'Out… two… three… four.'},
  {ms:4000,text:'Hold… two… three… four.'}
 ], qa:{question:'How did that feel?', choices:[
   {id:'ok', text:'This pace felt good', feedback:'Great. You can keep this cadence.'},
   {id:'calmer', text:'I’d like a calmer pace', feedback:'We’ll try a slightly gentler rhythm next time.'}
 ]}, overlay_plan:{ type:'box_breath', cadence:[4000,4000,4000,4000], cycles:2 }},
 // Slide 2 — Choose cadence/posture
 {t:'Choose', on:'Pick cadence and posture', segs:[
  {ms:6500,text:'Choose the pace that matches your day. You can change it anytime.'},
  {ms:4000,text:'Also choose how your body sits best.'}
 ], qa:{question:'Pick your pace and posture', choices:[
   {id:'pace_4444', text:'4‑4‑4‑4', feedback:'Classic box rhythm—balanced and steady.'},
   {id:'pace_345', text:'3‑4‑5', feedback:'Longer exhale can feel more calming.'}
 ]}, overlay_plan:{ type:'box_breath', cadence:[4000,4000,4000,4000], cycles:1 }},
 // Slide 3 — Second round
 {t:'Practice', on:'Your way', segs:[
  {ms:3500,text:'Let’s breathe with your choices.'},
  {ms:4500,text:'Two more cycles—calm, steady, kind to yourself.'},
  {ms:32000,text:'[guided cycles]'}
 ], qa:{question:'Add a third cycle?', choices:[
   {id:'more', text:'Add a third cycle now', feedback:'One more—easy does it.'},
   {id:'wrap', text:'I’m ready to wrap up', feedback:'Nice work.'}
 ]}, overlay_plan:{ type:'box_breath', cadence:[4000,4000,4000,4000], cycles:2 }},
 // Slide 4 — Wisdom
 {t:'Wisdom', on:'Plan', segs:[
  {ms:4000,text:'Steady breath is a tool you carry everywhere.'},
  {ms:11000,text:'This week, link two quiet cycles to something you already do—opening your laptop, waiting for a call to start, or stepping outside.'},
  {ms:8000,text:'If a moment feels sharp today, do one gentle cycle. You’ll feel the edges soften.'},
  {ms:2500,text:'I’ll see you tomorrow.'}
 ], qa:{question:'Finish?', choices:[
   {id:'rem', text:'Save a reminder for tomorrow', feedback:'Saved. We’ll nudge you gently.'},
   {id:'repeat', text:'Repeat two cycles now', feedback:'Let’s do two more calm cycles together.'}
 ]}, overlay_plan:{ type:'box_breath', cadence:[4000,4000,4000,4000], cycles:0 }}
];

function mkd(p){fs.mkdirSync(p,{recursive:true});}
function w(p,s){mkd(path.dirname(p)); fs.writeFileSync(p,s);} 
function ff(){try{cp.execSync('ffmpeg -version',{stdio:'ignore'});return true;}catch{return false;}}
function fmtTime(ms){const s=(ms/1000).toFixed(3); const [sec,f]=s.split('.'); const hh=String(Math.floor(sec/3600)).padStart(2,'0'); const mm=String(Math.floor(sec%3600/60)).padStart(2,'0'); const ss=String(sec%60).padStart(2,'0'); return `${hh}:${mm}:${ss}.${f}`;}
function vttFromSegs(segs){let t=0, out='WEBVTT\n\n'; for(const s of segs){const st=t, en=t+Math.max(800,s.ms); out+=`${fmtTime(st)} --> ${fmtTime(en)}\n${s.text}\n\n`; t=en;} return out;}
function wordsTimingFromSegs(segs){ const out=[]; let t=0; const inter=250; const factor=1; for(const s of segs){ const ms=Math.max(800,s.ms); const tokens=String(s.text).split(/\s+/).filter(Boolean); const weights=tokens.map(tok=>Math.max(1,tok.replace(/[^A-Za-z0-9']/g,'').length||1)); const tot=weights.reduce((a,b)=>a+b,0); let cur=t; for(let i=0;i<tokens.length;i++){ const dur=Math.floor(ms*(weights[i]/tot)); const st=cur; const en=cur+Math.max(60,dur-20); out.push({w:tokens[i], start_ms:st, end_ms:en}); cur=en; } t+= ms + inter; } return out; }

async function tts(txt,avatar){ const key=process.env.ELEVENLABS_API_KEY||''; if(!key) return null; const id=VOICES[avatar]||VOICES.kelly; const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`,{method:'POST',headers:{'Accept':'audio/mpeg','Content-Type':'application/json','xi-api-key':key},body:JSON.stringify({text:txt,model_id:'eleven_monolingual_v1',voice_settings:{stability:0.45,similarity_boost:0.7,style:0,use_speaker_boost:false}})}); if(!r.ok) return null; return Buffer.from(await r.arrayBuffer()); }
function seg(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.opus'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a libopus -b:a 64k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 
function segAAC(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.m4a'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a aac -b:a 96k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 

function toUri(f){const rel=path.relative(path.resolve('production-deploy'),path.join(CFG.outBase,f)).replace(/\\/g,'/'); return `/production-deploy/${rel}`;}
function listChunks(i){const fsx=fs.readdirSync(CFG.outBase).filter(f=>f.startsWith(`${i}_`)&&f.endsWith('.opus')).sort(); return fsx.map(toUri);}

(async()=>{
  mkd(CFG.outBase);
  // Build slides
  const V=[]; // per slide derived
  for(let i=0;i<S.length;i++){
    const s=S[i];
    const vtt=vttFromSegs(s.segs); w(path.join(CFG.outBase,`${i}.vtt`), vtt);
    const words=wordsTimingFromSegs(s.segs); w(path.join(CFG.outBase,`${i}_words.json`), JSON.stringify({words},null,2));
    // placeholder protobufs
    w(path.join(CFG.outBase,`${i}_vi.pb`), Buffer.from(''));
    w(path.join(CFG.outBase,`${i}_ex.pb`), Buffer.from(''));
  }
  // Audio synthesis
  const can=ff();
  for(let i=0;i<S.length;i++){
    const base=path.join(CFG.outBase,String(i));
    if (process.env.ELEVENLABS_API_KEY && can){
      const segFiles=[]; for(let j=0;j<S[i].segs.length;j++){ const b=await tts(S[i].segs[j].text, CFG.avatar); const p=path.join(CFG.outBase,`${i}_s${j}.mp3`); if(b){ fs.writeFileSync(p,b);} else { const sec=Math.max(0.8,S[i].segs[j].ms/1000); cp.execSync(`ffmpeg -y -f lavfi -t ${sec} -i anullsrc=r=48000:cl=mono -c:a libmp3lame -q:a 2 ${JSON.stringify(p)}`);} segFiles.push(p);} 
      const listFile=path.join(CFG.outBase,`${i}_concat.txt`); const q=p=>`file '${String(p).replace(/'/g,"'\\''")}'\n`; fs.writeFileSync(listFile, segFiles.map(q).join(''));
      const full=path.join(CFG.outBase,`${i}_full.mp3`); cp.execSync(`ffmpeg -y -f concat -safe 0 -i ${JSON.stringify(listFile)} -c:a libmp3lame -q:a 2 ${JSON.stringify(full)}`);
      const slow=path.join(CFG.outBase,`${i}.mp3`); cp.execSync(`ffmpeg -y -i ${JSON.stringify(full)} -filter:a "atempo=0.98,aresample=48000" ${JSON.stringify(slow)}`);
      seg(slow,base,CFG.chunkMs); segAAC(slow,base,CFG.chunkMs);
    } else if (can){ const d=S[i].segs.reduce((a,s)=>a+Math.max(800,s.ms),0); const secs=Math.max(1,Math.ceil(d/1000)); cp.execSync(`ffmpeg -y -f lavfi -t ${secs} -i anullsrc=r=48000:cl=mono -c:a libopus -b:a 64k -f segment -segment_time ${CFG.chunkMs/1000} -reset_timestamps 1 ${JSON.stringify(path.join(CFG.outBase,`${i}_%03d.opus`))}`); }
  }

  const manifest={ schema_version:'1.1', module_id:CFG.moduleId, date_key_utc:CFG.dateKey, content_version:'v1', language:CFG.lang, age_band:CFG.ageBand, tone:CFG.tone, avatar_id:CFG.avatar,
    slides:S.map((s,i)=>({ slide_index:i, title:s.t, script_text:s.on, captions_vtt_uri:toUri(`${i}.vtt`), word_timing_json_uri:toUri(`${i}_words.json`), captions_region:'right', captions_offset_px:0, target_duration_ms:s.segs.reduce((a,x)=>a+Math.max(800,x.ms),0)+1200, sentence_boundaries_ms:(()=>{let t=0; const arr=[0]; for(const g of s.segs){ t+=Math.max(800,g.ms); arr.push(t);} return arr;})(), prosody_plan_pb_uri:null, viseme_timeline_pb_uri:toUri(`${i}_vi.pb`), expression_tracks_pb_uri:toUri(`${i}_ex.pb`), overlay_plan:s.overlay_plan||null, audio_manifest:{ codec:'opus', sample_rate:CFG.sampleRate, chunk_duration_ms:CFG.chunkMs, chunks:listChunks(i) }, qa:s.qa||null, popup_template_id:(s.popups&&s.popups[0]?.template)||null, popup_payload:(s.popups&&s.popups[0]?.payload)||null, asset_hashes:{} })), integrity:{ manifest_sig:'hmac256:demo', created_at:new Date().toISOString() } };
  w(path.join(CFG.outBase,'manifest.json'), JSON.stringify(manifest,null,2));
  w(CFG.apiCopy, JSON.stringify(manifest,null,2));
  console.log('✅ Box Breathing exemplar generated at', CFG.outBase);
})();



