/* Generate Cryptography exemplar (Nov 22) with Kelly/Ken support.
   Produces: manifest.json, per-slide VTT + words.json, viseme/expression placeholders,
   and dual audio formats (.opus/.m4a) chunked for the player.
*/
const fs=require('fs'); const path=require('path'); const cp=require('child_process');
const fetch=(...a)=>import('node-fetch').then(({default:f})=>f(...a));
const VOICES={ kelly:'wAdymQH5YucAkXwmrdL0', ken:'fwrgq8CiDS7IPcDlFxgd' };
const AVATAR=process.env.EXEMPLAR_AVATAR||'kelly';
const CFG={ dateKey:'2025-11-22', moduleId:'2025-11-22', lang:'en', ageBand:'40-60', tone:'neutral', avatar:AVATAR, sampleRate:48000, chunkMs:2000 };
CFG.outBase = path.resolve(`production-deploy/examples/${CFG.moduleId}/en/${CFG.ageBand}/${CFG.tone}/${CFG.avatar}`);
CFG.apiCopy = path.resolve(`api/examples/manifests/${CFG.moduleId}_en_${CFG.ageBand}_${CFG.tone}_${CFG.avatar}.json`);

// Inline SVG extras used inside popups (self-contained, no external CSS)
const SVG = {
  lockPulse: `<svg width="140" height="90" viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="50%"><stop offset="0%" stop-color="#34c759" stop-opacity=".8"/><stop offset="100%" stop-color="#34c759" stop-opacity="0"/></radialGradient></defs>
    <circle cx="70" cy="45" r="10" fill="#34c759"/>
    <circle cx="70" cy="45" r="10" fill="url(#g)">
      <animate attributeName="r" values="10;40;10" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite"/>
    </circle>
    <rect x="55" y="35" width="30" height="24" rx="6" fill="#fff" stroke="#111"/>
    <path d="M62 35 a8 8 0 0 1 16 0 v8 h-4 v-8 a4 4 0 0 0 -8 0 v8 h-4 z" fill="#fff" stroke="#111"/>
  </svg>`,
  diffie: `<svg width="220" height="80" viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#007aff"/></marker></defs>
    <circle cx="20" cy="40" r="12" fill="#fff" stroke="#111"/><text x="16" y="44" font-size="10">A</text>
    <circle cx="200" cy="40" r="12" fill="#fff" stroke="#111"/><text x="196" y="44" font-size="10">B</text>
    <line x1="36" y1="40" x2="184" y2="40" stroke="#007aff" stroke-width="2" marker-end="url(#arrow)">
      <animate attributeName="x2" values="60;184;60" dur="3s" repeatCount="indefinite"/>
    </line>
    <circle cx="110" cy="40" r="10" fill="#ffcc00" opacity=".8"><animate attributeName="r" values="10;13;10" dur="1.2s" repeatCount="indefinite"/></circle>
  </svg>`,
  hashAvalanche: `<svg width="220" height="80" viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="15" width="90" height="50" rx="8" fill="#fff" stroke="#111"/>
    <text x="15" y="35" font-size="10">input</text>
    <rect x="120" y="15" width="90" height="50" rx="8" fill="#fff" stroke="#111"/>
    <text x="125" y="35" font-size="10">hash</text>
    <g>
      <circle cx="105" cy="40" r="3" fill="#007aff"><animate attributeName="cx" values="105;120;105" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="115" cy="40" r="3" fill="#ff3b30"><animate attributeName="cx" values="115;130;115" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="110" cy="50" r="3" fill="#5856d6"><animate attributeName="cy" values="50;22;50" dur="2s" repeatCount="indefinite"/></circle>
    </g>
  </svg>`
};

const S=[
 // Slide 0 — Welcome
 {t:'Welcome', on:'Cryptography in daily life', segs:[
  {ms:8000, text:'Today, you and I will unlock how modern cryptography protects nearly everything we do online.'},
  {ms:8000, text:'You will leave with a clear picture of keys, hashes, and signatures—plus a mental model you can trust.'},
  {ms:6000, text:'We’ll move quickly, but gently.'}
 ], popups:[{template:'definition_card', payload:{term:'November 22 • Cryptography', definition:'The mathematics of secrets: confidentiality, integrity, authenticity.', at_ms:800, side:'right', extra_html: SVG.lockPulse}}]},
 // Slide 1 — Keys
 {t:'Keys', on:'Public key vs private key', segs:[
  {ms:6500, text:'Two keys. One is public, one is private. Public locks; private unlocks.'},
  {ms:7000, text:'Share your public key freely. Guard your private key like your passport and face combined.'},
  {ms:6500, text:'Together, they enable encrypted messages and verifiable signatures.'}
 ], qa:{question:'Which statement is safest?', choices:[
   {id:'pub_share', text:'Share your public key widely', feedback:'Yes—public keys are designed to be public.'},
   {id:'priv_share', text:'Share the private key with trusted apps', feedback:'Never—private keys must remain exclusively yours.'}
 ]}, popups:[{template:'list_points', payload:{items:['Public key ≈ address you can post','Private key ≈ power of attorney—never share'], at_ms:1000, side:'right', extra_html: SVG.diffie}}]},
 // Slide 2 — Hashes
 {t:'Hashes', on:'One-way fingerprints', segs:[
  {ms:7000, text:'A hash turns any input into a short fingerprint. Small input changes produce totally different hashes.'},
  {ms:7000, text:'Good hashes are one-way, fast to compute, and wildly sensitive to change—called the avalanche effect.'}
 ], qa:{question:'Which claim is true?', choices:[
   {id:'avalanche', text:'A tiny edit flips many hash bits', feedback:'Right—the avalanche effect is a feature.'},
   {id:'reversible', text:'Hashes can be reversed to get the original', feedback:'No—cryptographic hashes are designed to be one-way.'}
 ]}, popups:[{template:'number_highlight', payload:{value:'2^256', unit:'states', label:'SHA‑256 space', at_ms:1200, side:'right', extra_html: SVG.hashAvalanche}}]},
 // Slide 3 — Signatures
 {t:'Signatures', on:'Prove “I wrote this”', segs:[
  {ms:7500, text:'Digital signatures prove authorship. You sign with your private key; anyone can verify with your public key.'},
  {ms:7000, text:'The message stays readable if you want, but the signature lets others check it was you and unchanged.'}
 ], qa:{question:'What does a valid signature prove?', choices:[
   {id:'auth_integrity', text:'Authorship and integrity', feedback:'Exactly—who signed and that the content hasn’t changed.'},
   {id:'secrecy', text:'Secrecy of the message', feedback:'Encryption protects secrecy; signatures protect authenticity.'}
 ]}, popups:[{template:'definition_card', payload:{term:'Zero‑Knowledge', definition:'Prove a statement is true without revealing the secret itself.', at_ms:1600, side:'right'}}]},
 // Slide 4 — Wisdom / Plan
 {t:'Apply it', on:'Use it in your day', segs:[
  {ms:7000, text:'You now hold three mental tools: keys, hashes, and signatures.'},
  {ms:9000, text:'Today, verify one download by checking its published hash. This habit protects you from tampered files.'},
  {ms:7000, text:'And skim your password manager’s security report. Tighten one weak spot.'}
 ], qa:{question:'Wrap up?', choices:[
   {id:'hash_now', text:'Check a file’s hash today', feedback:'Great. We learn by doing—this takes one minute.'},
   {id:'manager_audit', text:'Review my password manager', feedback:'Solid. One fix per day adds up.'}
 ]}}
];

function mkd(p){fs.mkdirSync(p,{recursive:true});}
function w(p,s){mkd(path.dirname(p)); fs.writeFileSync(p,s);} 
function ff(){try{cp.execSync('ffmpeg -version',{stdio:'ignore'});return true;}catch{return false;}}
function fmtTime(ms){const s=(ms/1000).toFixed(3); const [sec,f]=s.split('.'); const hh=String(Math.floor(sec/3600)).padStart(2,'0'); const mm=String(Math.floor(sec%3600/60)).padStart(2,'0'); const ss=String(sec%60).padStart(2,'0'); return `${hh}:${mm}:${ss}.${f}`;}
function vttFromSegs(segs){let t=0, out='WEBVTT\n\n'; for(const s of segs){const st=t, en=t+Math.max(900,s.ms); out+=`${fmtTime(st)} --> ${fmtTime(en)}\n${s.text}\n\n`; t=en;} return out;}
function wordsTimingFromSegs(segs){ const out=[]; let t=0; const inter=220; for(const s of segs){ const ms=Math.max(900,s.ms); const tokens=String(s.text).split(/\s+/).filter(Boolean); const weights=tokens.map(tok=>Math.max(1,tok.replace(/[^A-Za-z0-9']/g,'').length||1)); const tot=weights.reduce((a,b)=>a+b,0); let cur=t; for(let i=0;i<tokens.length;i++){ const dur=Math.floor(ms*(weights[i]/tot)); const st=cur; const en=cur+Math.max(60,dur-20); out.push({w:tokens[i], start_ms:st, end_ms:en}); cur=en; } t+= ms + inter; } return out; }

async function tts(txt,avatar){ const key=process.env.ELEVENLABS_API_KEY||''; if(!key) return null; const id=VOICES[avatar]||VOICES.kelly; const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`,{method:'POST',headers:{'Accept':'audio/mpeg','Content-Type':'application/json','xi-api-key':key},body:JSON.stringify({text:txt,model_id:'eleven_monolingual_v1',voice_settings:{stability:0.45,similarity_boost:0.7,style:0,use_speaker_boost:false}})}); if(!r.ok) return null; return Buffer.from(await r.arrayBuffer()); }
function seg(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.opus'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a libopus -b:a 64k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 
function segAAC(inFile,outBase,ms){const patt=path.join(path.dirname(outBase),path.basename(outBase)+'_%03d.m4a'); const cmd=`ffmpeg -y -i ${JSON.stringify(inFile)} -ar 48000 -ac 1 -c:a aac -b:a 96k -f segment -segment_time ${ms/1000} -reset_timestamps 1 ${JSON.stringify(patt)}`; cp.execSync(cmd,{stdio:'inherit'});} 

function toUri(f){const rel=path.relative(path.resolve('production-deploy'),path.join(CFG.outBase,f)).replace(/\\/g,'/'); return `/production-deploy/${rel}`;}
function listChunks(i){const fsx=fs.readdirSync(CFG.outBase).filter(f=>f.startsWith(`${i}_`)&&f.endsWith('.opus')).sort(); return fsx.map(toUri);}

(async()=>{
  mkd(CFG.outBase);
  for(let i=0;i<S.length;i++){
    const s=S[i];
    w(path.join(CFG.outBase,`${i}.vtt`), vttFromSegs(s.segs));
    w(path.join(CFG.outBase,`${i}_words.json`), JSON.stringify({words: wordsTimingFromSegs(s.segs)},null,2));
    w(path.join(CFG.outBase,`${i}_vi.pb`), Buffer.from(''));
    w(path.join(CFG.outBase,`${i}_ex.pb`), Buffer.from(''));
  }
  const can=ff();
  for(let i=0;i<S.length;i++){
    const base=path.join(CFG.outBase,String(i));
    if (process.env.ELEVENLABS_API_KEY && can){
      const segFiles=[]; for(let j=0;j<S[i].segs.length;j++){ const b=await tts(S[i].segs[j].text, CFG.avatar); const p=path.join(CFG.outBase,`${i}_s${j}.mp3`); if(b){ fs.writeFileSync(p,b);} else { const sec=Math.max(0.9,S[i].segs[j].ms/1000); cp.execSync(`ffmpeg -y -f lavfi -t ${sec} -i anullsrc=r=48000:cl=mono -c:a libmp3lame -q:a 2 ${JSON.stringify(p)}`);} segFiles.push(p);} 
      const listFile=path.join(CFG.outBase,`${i}_concat.txt`); const q=p=>`file '${String(p).replace(/'/g,"'\\''")}'\n`; fs.writeFileSync(listFile, segFiles.map(q).join(''));
      const full=path.join(CFG.outBase,`${i}_full.mp3`); cp.execSync(`ffmpeg -y -f concat -safe 0 -i ${JSON.stringify(listFile)} -c:a libmp3lame -q:a 2 ${JSON.stringify(full)}`);
      const slow=path.join(CFG.outBase,`${i}.mp3`); cp.execSync(`ffmpeg -y -i ${JSON.stringify(full)} -filter:a "atempo=0.98,aresample=48000" ${JSON.stringify(slow)}`);
      seg(slow,base,CFG.chunkMs); segAAC(slow,base,CFG.chunkMs);
    } else if (can){ const d=S[i].segs.reduce((a,s)=>a+Math.max(900,s.ms),0); const secs=Math.max(1,Math.ceil(d/1000)); cp.execSync(`ffmpeg -y -f lavfi -t ${secs} -i anullsrc=r=48000:cl=mono -c:a libopus -b:a 64k -f segment -segment_time ${CFG.chunkMs/1000} -reset_timestamps 1 ${JSON.stringify(path.join(CFG.outBase,`${i}_%03d.opus`))}`); }
  }

  const manifest={ schema_version:'1.1', module_id:CFG.moduleId, date_key_utc:CFG.dateKey, content_version:'v1', language:CFG.lang, age_band:CFG.ageBand, tone:CFG.tone, avatar_id:CFG.avatar,
    slides:S.map((s,i)=>({ slide_index:i, title:s.t, script_text:s.on, captions_vtt_uri:toUri(`${i}.vtt`), word_timing_json_uri:toUri(`${i}_words.json`), captions_region:'right', captions_offset_px:0, target_duration_ms:s.segs.reduce((a,x)=>a+Math.max(900,x.ms),0)+1200, sentence_boundaries_ms:(()=>{let t=0; const arr=[0]; for(const g of s.segs){ t+=Math.max(900,g.ms); arr.push(t);} return arr;})(), prosody_plan_pb_uri:null, viseme_timeline_pb_uri:toUri(`${i}_vi.pb`), expression_tracks_pb_uri:toUri(`${i}_ex.pb`), overlay_plan:null, audio_manifest:{ codec:'opus', sample_rate:CFG.sampleRate, chunk_duration_ms:CFG.chunkMs, chunks:listChunks(i) }, qa:s.qa||null, popup_template_id:(s.popups&&s.popups[0]?.template)||null, popup_payload:(s.popups&&s.popups[0]?.payload)||null, asset_hashes:{} })), integrity:{ manifest_sig:'hmac256:demo', created_at:new Date().toISOString() } };
  w(path.join(CFG.outBase,'manifest.json'), JSON.stringify(manifest,null,2));
  w(CFG.apiCopy, JSON.stringify(manifest,null,2));
  console.log('✅ Cryptography exemplar generated at', CFG.outBase);
})();



