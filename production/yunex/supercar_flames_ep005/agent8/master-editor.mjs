#!/usr/bin/env node
/**
 * EP005 Agent 8 — approved-source-only editorial assembly.
 * This is deliberately fail-closed: no stock/rejected footage or invented VO.
 * Usage: node .../master-editor.mjs --check [manifest.json]
 *        node .../master-editor.mjs --render [manifest.json]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();
const HERE = path.dirname(new URL(import.meta.url).pathname);
const mode = process.argv[2] || '--check';
const manifestPath = path.resolve(process.argv[3] || path.join(HERE, 'edit-manifest.json'));
const outDir = path.resolve(process.env.EP005_OUTPUT_DIR || path.join(ROOT, 'out', 'ep005-agent8'));
const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));

const isSha = (s) => typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
const isCommit = (s) => typeof s === 'string' && /^[0-9a-f]{40}$/i.test(s);
const int = (n) => Number.isInteger(n);
const safeLocal = (p) => typeof p === 'string' &&
  p.length > 0 && !path.isAbsolute(p) &&
  !p.split(/[\\/]/).includes('..') && !p.includes('\0');
const local = (p) => {
  if (!safeLocal(p)) throw new Error('Unsafe or missing local path: ' + String(p));
  const resolved = path.resolve(ROOT, p);
  if (!resolved.startsWith(ROOT + path.sep)) throw new Error('Path leaves repository');
  return resolved;
};
const blockers = [];
function requireGate(ok, message) { if (!ok) blockers.push(message); }

function plan() {
  const s = manifest.settings || {};
  requireGate(manifest.schemaVersion === 1, 'manifest schema version must be 1');
  requireGate(s.fps === 30 && s.width === 1080 && s.height === 1920 && s.totalFrames === 750,
    'native format must remain 1080x1920 / 30fps / 750 frames');
  requireGate(Array.isArray(manifest.beats) && manifest.beats.length >= 6, 'missing editorial beats');
  let cursor = 0;
  for (const beat of manifest.beats || []) {
    requireGate(typeof beat.id === 'string' && /^[a-z0-9-]+$/.test(beat.id), 'invalid beat ID');
    requireGate(int(beat.start) && int(beat.end) && beat.start === cursor && beat.end > beat.start,
      'non-contiguous/invalid beat range at ' + beat.id);
    cursor = beat.end;
    requireGate(['vehicle','science','integrated'].includes(beat.role), 'invalid visual source role at ' + beat.id);
    const m = beat.media || {};
    requireGate(m.approved === true && safeLocal(m.path) && isSha(m.sha256) &&
      isCommit(m.sourceCommit) && /^https:\/\/github\.com\//.test(m.approvalRef || ''),
      'unapproved/unpinned media for ' + beat.id);
    requireGate(int(m.sourceInFrame) && m.sourceInFrame >= 0, 'missing source trim frame for ' + beat.id);
    requireGate(typeof m.assetProvenance === 'string' && m.assetProvenance.trim().length > 5,
      'missing original footage provenance for ' + beat.id);
    if (beat.role === 'integrated') {
      requireGate(isCommit(m.agent6Commit) && isCommit(m.agent7Commit) && isSha(m.portManifestSha256),
        'integrated footage must lock BOTH Agent 6 and Agent 7 + exhaust port ABI for ' + beat.id);
    }
    if (beat.title != null) {
      const t = beat.title;
      requireGate(typeof t.text === 'string' && t.text.length <= 50 &&
        int(t.start) && int(t.end) && t.start >= beat.start && t.end <= beat.end && t.start < t.end,
        'invalid on-screen visual fact label at ' + beat.id);
    }
  }
  requireGate(cursor === s.totalFrames, 'editor must cover all 750 frames, no gap or tail trim');
  const voice = manifest.voice || {};
  if (voice.approved) {
    requireGate(safeLocal(voice.path) && isSha(voice.sha256) &&
      isCommit(voice.sourceCommit) && /^https:\/\/github\.com\//.test(voice.approvalRef || ''),
      'voice provenance, checksum, source commit and approval required');
    requireGate(voice.captionsVerified === true &&
      Array.isArray(manifest.captions) && manifest.captions.length > 0,
      'real narration requires verified actual caption timings');
    for (const c of manifest.captions || []) {
      requireGate(int(c.start) && int(c.end) && c.start >= 0 && c.end <= 750 &&
        c.end > c.start && c.verified === true && typeof c.text === 'string' &&
        c.text.length > 0 && c.text.length <= 88,
        'subtitle must have actual approved frame times + short readable text');
    }
  } else {
    requireGate(!manifest.captions?.length, 'must not pretend silent review has timed narration captions');
  }
  for (const b of manifest.optionalAudioBeds || []) {
    requireGate(voice.approved && b.approved === true && safeLocal(b.path) && isSha(b.sha256) &&
      typeof b.provenance === 'string' && int(b.startFrame) &&
      b.startFrame >= 0 && b.startFrame < 750 &&
      typeof b.gainDb === 'number' && b.gainDb <= -10,
      'optional sound beds must be licensed, approved and safely ducked beneath real narration');
  }
  return {ready:blockers.length === 0, mode:voice.approved ? 'FINAL_WITH_APPROVED_AUDIO' : 'SILENT_PICTURE_REVIEW',
    frameCount:750, fps:30, blockers};
}
const status = plan();
if (mode === '--check') {
  process.stdout.write(JSON.stringify(status,null,2) + '\n');
  process.exit(0);
}
if (mode !== '--render') throw new Error('Use --check or --render');
if (!status.ready) {
  console.error('BLOCKED — no speculative render or rejected footage fallback:\n' + blockers.map(x=>' - '+x).join('\n'));
  process.exit(2);
}

function run(exe, args, quiet = false) {
  const r = spawnSync(exe, args, {cwd:ROOT, encoding:'utf8', maxBuffer:20*1024*1024, stdio: quiet ? 'pipe' : 'inherit'});
  if (r.error || r.status !== 0) throw new Error(exe + ' failed: ' + (r.stderr || String(r.error || r.status)));
  return r.stdout || '';
}
async function sha256(p) {
  return await new Promise((resolve,reject)=>{
    const hash=crypto.createHash('sha256');
    const stream=fs.createReadStream(p);
    stream.on('data', d=>hash.update(d));
    stream.on('error', reject);
    stream.on('end', ()=>resolve(hash.digest('hex')));
  });
}
async function validateMedia(p, checksum, neededFrames = null) {
  if (!fs.existsSync(p)) throw new Error('Approved media missing: '+p);
  if (await sha256(p) !== checksum.toLowerCase()) throw new Error('MEDIA SHA256 MISMATCH: '+p);
  const probe = JSON.parse(run('ffprobe',['-v','error','-count_frames','-select_streams','v:0',
    '-show_entries','stream=width,height,r_frame_rate,nb_read_frames','-of','json',p],true));
  if (neededFrames != null) {
    const v = probe.streams?.[0];
    if (!v || v.width !== 1080 || v.height !== 1920 || v.r_frame_rate !== '30/1' ||
        Number(v.nb_read_frames) < neededFrames) throw new Error('Non-native/wrong fps/truncated media: '+p);
  }
  run('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-i',p,
    ...(neededFrames == null ? [] : ['-map','0:v:0']),'-f','null','-']);
  return probe;
}
function assTime(frame) {
  const centi=Math.round(frame*100/30);
  const h=Math.floor(centi/360000), m=Math.floor(centi/6000)%60, s=Math.floor(centi/100)%60;
  return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(centi%100).padStart(2,'0');
}
function escapeAss(text) {
  return text.replace(/[{}\\]/g,'').replace(/\r?\n/g,' ');
}
function createAss() {
  const header = [
    '[Script Info]','ScriptType: v4.00+','PlayResX: 1080','PlayResY: 1920','WrapStyle: 2',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Fact,DejaVu Sans,48,&H00FFFFFF,&H00000000,&H9A050507,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,8,86,86,340,1',
    'Style: Spoken,DejaVu Sans,61,&H00FFFFFF,&H00000000,&H98000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,92,92,315,1',
    'Style: Review,DejaVu Sans,27,&H00FFFFFF,&H00000000,&H9A000000,&H90000000,0,0,0,0,100,100,0,0,1,2,0,8,80,80,80,1',
    '[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];
  const ev = (style,a,b,text) => 'Dialogue: 0,'+assTime(a)+','+assTime(b)+','+style+',,0,0,0,,'+escapeAss(text);
  const events = [];
  if (!manifest.voice.approved) events.push(ev('Review',0,750,'SILENT PICTURE REVIEW  /  VO PENDING'));
  for (const beat of manifest.beats) if (beat.title) events.push(ev('Fact',beat.title.start,beat.title.end,beat.title.text));
  if (manifest.voice.approved) for (const c of manifest.captions) events.push(ev('Spoken',c.start,c.end,c.text));
  return header.concat(events).join('\n')+'\n';
}

await fsp.mkdir(outDir,{recursive:true});
const inputs=[];
for(const beat of manifest.beats) {
  const p=local(beat.media.path);
  await validateMedia(p,beat.media.sha256,beat.media.sourceInFrame + beat.end - beat.start);
  inputs.push(p);
}
if(manifest.voice.approved) {
  const p=local(manifest.voice.path);
  await validateMedia(p,manifest.voice.sha256);
  inputs.push(p);
}
for(const bed of manifest.optionalAudioBeds||[]) {
  const p=local(bed.path);
  await validateMedia(p,bed.sha256);
  inputs.push(p);
}
const assPath=path.join(outDir,'approved-caption-overlay.ass');
await fsp.writeFile(assPath,createAss());
const videoFilters=manifest.beats.map((beat,i)=>{
  const inFrame=beat.media.sourceInFrame;
  return '['+i+':v:0]trim=start_frame='+inFrame+':end_frame='+(inFrame+beat.end-beat.start)+
    ',setpts=PTS-STARTPTS,format=yuv420p[s'+i+']';
});
videoFilters.push(manifest.beats.map((_,i)=>'[s'+i+']').join('')+
  'concat=n='+manifest.beats.length+':v=1:a=0[whole]');
const safeAss=assPath.replaceAll('\\','/').replace(/[:']/g,(c)=>'\\'+c);
videoFilters.push("[whole]ass='"+safeAss+"'[vout]");
let audioOut=null;
if(manifest.voice.approved) {
  const voiceIndex=manifest.beats.length;
  videoFilters.push('['+voiceIndex+':a:0]aresample=48000,atrim=duration=25,asetpts=PTS-STARTPTS,apad=pad_dur=25,atrim=duration=25[voice]');
  const streams=['[voice]'];
  for(let i=0;i<(manifest.optionalAudioBeds||[]).length;i++) {
    const bed=manifest.optionalAudioBeds[i], idx=voiceIndex+1+i;
    videoFilters.push('['+idx+':a:0]aresample=48000,volume='+bed.gainDb+'dB,adelay='+
      Math.round(bed.startFrame*1000/30)+':all=1,atrim=duration=25[bed'+i+']');
    streams.push('[bed'+i+']');
  }
  videoFilters.push(streams.join('')+'amix=inputs='+streams.length+':duration=first:dropout_transition=0,alimiter=limit=0.89[aout]');
  audioOut='[aout]';
}
const output=path.join(outDir,manifest.voice.approved?'EP005-FINAL-CANDIDATE.mp4':'EP005-SILENT-PICTURE-REVIEW.mp4');
const args=['-hide_banner','-y'];
for(const p of inputs) args.push('-i',p);
args.push('-filter_complex',videoFilters.join(';'),'-map','[vout]');
if(audioOut) args.push('-map',audioOut,'-c:a','aac','-b:a','192k','-ar','48000');
else args.push('-an');
args.push('-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p',
  '-r','30','-frames:v','750','-movflags','+faststart','-t','25',output);
run('ffmpeg',args);
const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',output],true));
const vid=probe.streams.find(s=>s.codec_type==='video');
const aud=probe.streams.filter(s=>s.codec_type==='audio');
if(vid?.width!==1080 || vid?.height!==1920 || vid?.r_frame_rate!=='30/1' ||
  Number(vid?.nb_read_frames)!==750) throw new Error('OUTPUT QA FAIL: native format/frame count');
if(manifest.voice.approved ? aud.length<1 : aud.length!==0) throw new Error('OUTPUT QA FAIL: audio integrity');
run('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-i',output,'-f','null','-']);
const samples=new Set([0,1,5,14,29,30,674,675,700,724,748,749]);
for(const beat of manifest.beats) {
  samples.add(Math.max(0,beat.start-2)); samples.add(beat.start); samples.add(Math.min(749,beat.start+2));
  samples.add(Math.max(0,beat.end-2)); samples.add(Math.min(749,beat.end-1));
}
const sampleFrames=[...samples].sort((a,b)=>a-b);
const expr=sampleFrames.map(n=>'eq(n\\,'+n+')').join('+');
run('ffmpeg',['-hide_banner','-loglevel','error','-i',output,'-vf','select='+expr,
  '-vsync','0',path.join(outDir,'review-%03d.png')]);
const report={
  episode:'EP005',candidate:true,humanVisualApproval:'PENDING',
  mode:status.mode,frameCount:750,width:1080,height:1920,fps:30,
  sha256:await sha256(output),videoPath:output,
  audioStreamCount:aud.length,sourceCommitHashes:manifest.beats.map(b=>({id:b.id,commit:b.media.sourceCommit,sha256:b.media.sha256,approval:b.media.approvalRef})),
  sampleFrames,fullDecode:'PASS',note:'Inspect full-speed film, each cut and all extracted first/last samples before calling picture lock.'
};
await fsp.writeFile(path.join(outDir,'render-proof.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
