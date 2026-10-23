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
const REJECTED_AG6_CANDIDATE_A = 'bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4';
const OWNER_APPROVED_HERO_SHA = '9052a539e10a7cb97487c1435455bb9962ad58e1';
const OWNER_APPROVED_PREVIEW_SHA = '1654a5efd3a3403871b0a52a3140a9e7aeb1222a2e4bd4242e6edaa8d879cd88';
const REJECTED_VIDEO_SHA = new Set([
  '0797444a04513418593b72cd6aaf58c1e2cbfc64574ae8d33c316ec4f7fddc81',
  'b409370aab6cc68b4641abc4dc53b6c05c32f052c25411cb5dc0bea5d934e860',
]);
const hasApprovedSourceRef = (s) => typeof s === 'string' &&
  /^https:\/\/github\.com\/YunRah2103\/Remotion-gpt-chat\/(issues|pull)\/(247|265|266|267|268|269|270)(?:#issuecomment-\d+)$/.test(s);
const isRejectedCandidate = (m) => [m.sourceCommit,m.agent6Commit].some(s => s === REJECTED_AG6_CANDIDATE_A) ||
  REJECTED_VIDEO_SHA.has(m.sha256);
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
  requireGate(s.fps === 30 && s.width === 1080 && s.height === 1920 && (s.totalFrames === 750 || s.totalFrames === 767),
    'native format must be 1080x1920 / 30fps / 750f or original Cedar 767f');
  // The user approved the car exterior only; never interpret that as permission to
  // reuse the old 14-second demo or to approve arbitrary replacement vehicles.
  const hero = manifest.approvedHero || {};
  requireGate(hero.appearanceApproved === true &&
    hero.approvalScope === 'CAR_APPEARANCE_ONLY__NOT_FULL_FILM_OR_MOVING_SHOTS' &&
    hero.referenceProject === 'v4-a-supercar' &&
    hero.sourceCommit === OWNER_APPROVED_HERO_SHA &&
    hero.vehicle?.variant === 'supercar' &&
    hero.vehicle?.bodyDetail === 'studio' &&
    hero.vehicle?.color === '#18636b' &&
    hero.sourceVideo?.sha256 === OWNER_APPROVED_PREVIEW_SHA &&
    hero.sourceVideo?.runId === 39866437063 &&
    hero.sourceVideo?.artifactId === 12465297894 &&
    hasApprovedSourceRef(hero.approvalRef),
    'owner-approved V4 appearance reference is absent or changed');
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
      isCommit(m.sourceCommit) && hasApprovedSourceRef(m.approvalRef) &&
      Number.isInteger(m.artifactRunId) && m.artifactRunId > 0 &&
      typeof m.artifactName === 'string' && /^[\w.-]+$/.test(m.artifactName) &&
      m.producerIssue === (beat.role === 'vehicle' ? 265 : 266) &&
      !isRejectedCandidate(m),
      'unapproved/unpinned media for ' + beat.id);
    requireGate(int(m.sourceInFrame) && m.sourceInFrame >= 0, 'missing source trim frame for ' + beat.id);
    requireGate(typeof m.assetProvenance === 'string' && m.assetProvenance.trim().length > 5,
      'missing original footage provenance for ' + beat.id);
    if (beat.role === 'vehicle' || beat.role === 'integrated') {
      requireGate(m.approvedHeroSourceCommit === OWNER_APPROVED_HERO_SHA &&
        m.approvedHeroReferenceProject === 'v4-a-supercar',
        'missing approved V4 hero appearance proof on moving footage: ' + beat.id);
    }
    if (beat.role === 'integrated') {
      requireGate(isCommit(m.agent6Commit) && isCommit(m.agent7Commit) && isSha(m.portManifestSha256) &&
        typeof m.portManifestVersion === 'string' && /^v4[-_.]/i.test(m.portManifestVersion) &&
        /^https:\/\/github\.com\/YunRah2103\/Remotion-gpt-chat\//.test(m.portManifestRef || '') &&
        !isRejectedCandidate(m),
        'integrated footage must lock BOTH Agent 6 and Agent 7 + exhaust port ABI for ' + beat.id);
    }
    if (beat.title != null) {
      const t = beat.title;
      requireGate(typeof t.text === 'string' && t.text.length <= 50 &&
        int(t.start) && int(t.end) && t.start >= beat.start && t.end <= beat.end && t.start < t.end,
        'invalid on-screen visual fact label at ' + beat.id);
    }
  }
  requireGate(cursor === s.totalFrames, 'editor must cover all '+s.totalFrames+' frames, no gap or tail trim');
  const voice = manifest.voice || {};
  if (voice.approved) {
    requireGate(safeLocal(voice.path) && isSha(voice.sha256) &&
      hasApprovedSourceRef(voice.approvalRef) && (
        (isCommit(voice.sourceCommit) && Number.isInteger(voice.artifactRunId) &&
         voice.artifactRunId > 0 && typeof voice.artifactName === 'string' &&
         /^[\\w.-]+$/.test(voice.artifactName)) ||
        (voice.userProvidedOriginal === true && voice.sourceName === 'openai-fm-cedar-audio.mp3' &&
         voice.path === 'out/ep005-agent8-sources/user-cedar/openai-fm-cedar-audio.mp3' &&
         voice.sha256 === '90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8' &&
         voice.verifiedDurationSeconds === 25.56)
      ) &&
      Number.isFinite(voice.verifiedDurationSeconds) &&
      voice.verifiedDurationSeconds > 0 &&
      Math.ceil(voice.verifiedDurationSeconds * s.fps) === s.totalFrames,
      'voice provenance, checksum, source commit and approval required');
    requireGate(voice.captionsVerified === true &&
      Array.isArray(manifest.captions) && manifest.captions.length > 0,
      'real narration requires verified actual caption timings');
    let previousCaptionEnd = 0;
    for (const c of manifest.captions || []) {
      requireGate(int(c.start) && int(c.end) && c.start >= 0 && c.end <= s.totalFrames &&
        c.end > c.start && c.verified === true && typeof c.text === 'string' &&
        c.text.length > 0 && c.text.length <= 88,
        'subtitle must have actual approved frame times + short readable text');
      requireGate(c.start >= previousCaptionEnd, 'spoken caption overlap is not permitted');
      requireGate(c.end / 30 <= voice.verifiedDurationSeconds + 0.06,
        'spoken caption must not extend beyond original recording');
      previousCaptionEnd = c.end;
    }
  } else {
    requireGate(!manifest.captions?.length, 'must not pretend silent review has timed narration captions');
  }
  for (const b of manifest.optionalAudioBeds || []) {
    requireGate(voice.approved && b.approved === true && safeLocal(b.path) && isSha(b.sha256) &&
      isCommit(b.sourceCommit) && hasApprovedSourceRef(b.approvalRef) &&
      Number.isInteger(b.artifactRunId) && b.artifactRunId > 0 &&
      typeof b.artifactName === 'string' && /^[\w.-]+$/.test(b.artifactName) &&
      typeof b.provenance === 'string' && b.provenance.trim().length >= 8 &&
      int(b.startFrame) && b.startFrame >= 0 && b.startFrame < s.totalFrames &&
      Number.isFinite(b.gainDb) && b.gainDb >= -48 && b.gainDb <= -10,
      'optional sound beds must be licensed, approved and safely ducked beneath real narration');
  }
  return {ready:blockers.length === 0, mode:voice.approved ? 'FINAL_WITH_APPROVED_AUDIO' : 'SILENT_PICTURE_REVIEW',
    frameCount:s.totalFrames, fps:30, blockers};
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
async function validateMedia(p, checksum, neededFrames = null, approvedVoiceDuration = null) {
  if (!fs.existsSync(p)) throw new Error('Approved media missing: '+p);
  if (await sha256(p) !== checksum.toLowerCase()) throw new Error('MEDIA SHA256 MISMATCH: '+p);
  const probe = JSON.parse(run('ffprobe',['-v','error','-count_frames','-select_streams','v:0',
    '-show_entries','stream=width,height,r_frame_rate,nb_read_frames','-of','json',p],true));
  if (neededFrames != null) {
    const v = probe.streams?.[0];
    if (!v || v.width !== 1080 || v.height !== 1920 || v.r_frame_rate !== '30/1' ||
        Number(v.nb_read_frames) < neededFrames) throw new Error('Non-native/wrong fps/truncated media: '+p);
  }
  if (approvedVoiceDuration != null) {
    const audioprobe=JSON.parse(run('ffprobe',['-v','error','-show_entries',
      'stream=codec_type,sample_rate,channels,duration:format=duration','-of','json',p],true));
    const streams=audioprobe.streams || [];
    const voice=streams.find(v=>v.codec_type === 'audio');
    const actual=Number(voice?.duration || audioprobe.format?.duration);
    if (!voice || !Number.isFinite(actual) || Math.abs(actual-approvedVoiceDuration) > 0.08 ||
      actual > s.totalFrames/s.fps + 0.02 || Number(voice.sample_rate) < 16000 || voice.channels < 1)
      throw new Error('Approved VO duration/sample rate mismatch: no silent audio trimming: '+p);
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
  return text.replace(/[{}\\]/g,'').replace(/\r?\n/g,'\\N');
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
  if (!manifest.voice.approved) events.push(ev('Review',0,manifest.settings.totalFrames,'SILENT PICTURE REVIEW  /  VO PENDING'));
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
  await validateMedia(p,manifest.voice.sha256,null,manifest.voice.verifiedDurationSeconds);
  inputs.push(p);
}
for(const bed of manifest.optionalAudioBeds||[]) {
  const p=local(bed.path);
  await validateMedia(p,bed.sha256);
  inputs.push(p);
}
const filmDuration=manifest.settings.totalFrames/manifest.settings.fps;
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
  // Original approved VO is preserved at original rate-of-speech and pitch;
  // duration is pre-verified. Only the silence after its natural ending is extended.
  videoFilters.push('['+voiceIndex+':a:0]aresample=48000,asetpts=PTS-STARTPTS,apad,atrim=duration='+filmDuration+'[originalVoice]');
  const streams=[];
  for(let i=0;i<(manifest.optionalAudioBeds||[]).length;i++) {
    const bed=manifest.optionalAudioBeds[i], idx=voiceIndex+1+i;
    videoFilters.push('['+idx+':a:0]aresample=48000,volume='+bed.gainDb+'dB,adelay='+
      Math.round(bed.startFrame*1000/30)+':all=1,atrim=duration='+filmDuration+'[bed'+i+']');
    streams.push('[bed'+i+']');
  }
  if(streams.length) {
    videoFilters.push('[originalVoice]asplit=2[voiceMain][voiceKey]');
    videoFilters.push(streams.join('')+'amix=inputs='+streams.length+
      ':duration=longest:dropout_transition=0:normalize=0[bedSum]');
    videoFilters.push('[bedSum][voiceKey]sidechaincompress=threshold=0.02:ratio=6:attack=7:release=220[ducked]');
    videoFilters.push('[voiceMain][ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,'+
      'loudnorm=I=-16:LRA=9:TP=-1.5:linear=false[aout]');
  } else {
    videoFilters.push('[originalVoice]loudnorm=I=-16:LRA=9:TP=-1.5:linear=false[aout]');
  }
  audioOut='[aout]';
}
const output=path.join(outDir,manifest.voice.approved?'EP005-FINAL-CANDIDATE.mp4':'EP005-SILENT-PICTURE-REVIEW.mp4');
const args=['-hide_banner','-y'];
for(const p of inputs) args.push('-i',p);
args.push('-filter_complex',videoFilters.join(';'),'-map','[vout]');
if(audioOut) args.push('-map',audioOut,'-c:a','aac','-b:a','192k','-ar','48000','-ac','2');
else args.push('-an');
args.push('-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p',
  '-r','30','-frames:v',String(manifest.settings.totalFrames),'-movflags','+faststart','-t',String(filmDuration),output);
run('ffmpeg',args);
const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',output],true));
const vid=probe.streams.find(s=>s.codec_type==='video');
const aud=probe.streams.filter(s=>s.codec_type==='audio');
if(vid?.width!==1080 || vid?.height!==1920 || vid?.r_frame_rate!=='30/1' ||
  Number(vid?.nb_read_frames)!==manifest.settings.totalFrames) throw new Error('OUTPUT QA FAIL: native format/frame count');
if(manifest.voice.approved ? aud.length<1 : aud.length!==0) throw new Error('OUTPUT QA FAIL: audio integrity');
run('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-i',output,'-f','null','-']);
const last=manifest.settings.totalFrames-1;
const samples=new Set([0,1,5,14,29,30,last-75,last-74,last-50,last-25,last-1,last]);
for(const beat of manifest.beats) {
  samples.add(Math.max(0,beat.start-2)); samples.add(beat.start); samples.add(Math.min(last,beat.start+2));
  samples.add(Math.max(0,beat.end-2)); samples.add(Math.min(last,beat.end-1));
}
const sampleFrames=[...samples].sort((a,b)=>a-b);
const expr=sampleFrames.map(n=>'eq(n\\,'+n+')').join('+');
run('ffmpeg',['-hide_banner','-loglevel','error','-i',output,'-vf','select='+expr,
  '-vsync','0',path.join(outDir,'review-%03d.png')]);
// Export EVERY opening frame and EVERY final 75-frame payoff frame for real
// moving-image visual review, instead of claiming that a few stills prove quality.
run('ffmpeg',['-hide_banner','-loglevel','error','-i',output,
  '-vf','select=lte(n\\,29)+gte(n\\,'+(manifest.settings.totalFrames-75)+'),scale=270:-2',
  '-vsync','0','-q:v','4',path.join(outDir,'mandatory-visual-%03d.jpg')]);
const visualFiles=(await fsp.readdir(outDir)).filter(x=>/^mandatory-visual-\d+\.jpg$/.test(x)).sort();
if(visualFiles.length!==105) throw new Error('MANDATORY QA FAIL: expected exactly first 30 + last 75 review frames');
const visualHashes=[];
for(const f of visualFiles) visualHashes.push(await sha256(path.join(outDir,f)));
const openingUnique=new Set(visualHashes.slice(0,30)).size;
const endingUnique=new Set(visualHashes.slice(30)).size;
if(openingUnique<5 || endingUnique<12)
  throw new Error('MANDATORY QA FAIL: opening or ending looks frame-static; inspect replacement source');
const report={
  episode:'EP005',candidate:true,humanVisualApproval:'PENDING',
  mode:status.mode,frameCount:manifest.settings.totalFrames,width:1080,height:1920,fps:30,
  sha256:await sha256(output),videoPath:output,
  audioStreamCount:aud.length,sourceCommitHashes:manifest.beats.map(b=>({id:b.id,commit:b.media.sourceCommit,sha256:b.media.sha256,approval:b.media.approvalRef})),
  sampleFrames,mandatoryVisualFrames:105,openingUniqueFrames:openingUnique,endingUniqueFrames:endingUnique,
  fullDecode:'PASS',note:'Inspect full-speed film, each cut and all extracted first/last samples before calling picture lock.'
};
await fsp.writeFile(path.join(outDir,'render-proof.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
