#!/usr/bin/env node
'use strict';
/** Machine gate for scene positions, identity evidence, source duration and crop limits.
 * Provisional validation proves structure only; `--final` rejects all missing media.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const DEFAULT_MAP=path.join(__dirname,'shot-map.json');
function requireValue(cond,message){if(!cond)throw Error(message);}
function probeMedia(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height,avg_frame_rate','-of','json',file],{encoding:'utf8'});
 requireValue(p.status===0,'ffprobe failed for '+file+': '+p.stderr);
 const parsed=JSON.parse(p.stdout);
 const video=(parsed.streams||[]).find(s=>s.codec_type==='video');
 requireValue(video&&video.width>0&&video.height>0,'no valid video stream: '+file);
 return {width:video.width,height:video.height,duration:Number(parsed.format?.duration),fps:video.avg_frame_rate};
}
function validate(map,{final=false,repoRoot=path.resolve(__dirname,'../../..')}={}){
 const messages=[],ids=new Set(),angles=new Set();
 requireValue(map.schemaVersion===1,'unexpected map schema');
 requireValue(map.fps===30&&map.width===1080&&map.height===1920&&map.durationFrames===316,'locked format altered');
 requireValue(map.revealFrame===78,'reveal must occur at 2.60 seconds, frame 78');
 requireValue(map.shots.length>=10&&map.shots.length<=18,'need 10–18 scene cuts');
 let cursor=0,verified=0,realFiles=0;
 const legalCuts=new Set(['cut','whip-left','whip-right','punch','flash','rgb-edge','film-burn','shutter']);
 for(const [n,shot] of map.shots.entries()){
  const label=shot.id||'shot '+n;
  requireValue(!ids.has(label),'duplicate id '+label);ids.add(label);
  requireValue(Number.isInteger(shot.startFrame)&&Number.isInteger(shot.endFrameExclusive),'noninteger shot range '+label);
  requireValue(shot.startFrame===cursor,'gap or overlap at '+label+', expected '+cursor);
  const frames=shot.endFrameExclusive-shot.startFrame;
  requireValue(frames>=5,'too short / inverted '+label);
  requireValue(legalCuts.has(shot.cutStyle),'unsupported cut effect '+label);
  requireValue(shot.cropKeyframes.length>=2,'missing crop keyframes '+label);
  let lastKey=-1;
  for(const k of shot.cropKeyframes){
    requireValue(Number.isInteger(k.frame)&&k.frame>lastKey&&k.frame<frames,'bad crop frame '+label);
    requireValue([k.x,k.y,k.zoom].every(Number.isFinite),'invalid crop values '+label);
    requireValue(k.x>=.08&&k.x<=.92&&k.y>=.08&&k.y<=.92,'crop focal outside safe range '+label);
    requireValue(k.zoom>=1&&k.zoom<=1.18,'excessive zoom / softness risk '+label);
    lastKey=k.frame;
  }
  requireValue(shot.cropKeyframes[0].frame===0&&lastKey===frames-1,'crop not keyed on first and last frames: '+label);
  const s=shot.source;
  requireValue(s&&typeof s==='object','source record missing '+label);
  if(s.file!==null){
    requireValue(typeof s.file==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]+\\.(mp4|mov|webm)$/i.test(s.file),'unsafe/invalid source filename '+label);
    const actual=path.join(repoRoot,map.mediaDirectory,s.file);
    if(final){
      requireValue(fs.existsSync(actual),'missing approved file '+actual);
      const bytes=fs.readFileSync(actual);
      const digest=crypto.createHash('sha256').update(bytes).digest('hex');
      requireValue(digest===s.mediaSha256,'SHA mismatch '+label);
      const p=probeMedia(actual);
      requireValue(p.duration>0&&Number.isFinite(p.duration),'no media duration '+label);
      requireValue(s.sourceStartSeconds>=0&&s.sourceEndSeconds<=p.duration+.02,'invalid media in/out '+label);
      requireValue(s.sourceEndSeconds-s.sourceStartSeconds>=frames/map.fps-.04,'source segment too short '+label);
      // 1920x1080 landscape yields only ~608 pixels after portrait crop.
      if(p.width/p.height>1.2&&p.width<3000)messages.push('LOW_HORIZONTAL_CROP_RESOLUTION '+label+' '+p.width+'x'+p.height);
    }
    realFiles++;
  }else if(final)throw Error('source filename pending: '+label);
  if(final){
    requireValue(s.stoIdentityVerified===true,'STO identity unverified '+label);
    requireValue(typeof s.sourceUrl==='string'&&s.sourceUrl.startsWith('http'),'missing traceable URL '+label);
    requireValue(typeof s.mediaSha256==='string'&&/^[a-f0-9]{64}$/.test(s.mediaSha256),'missing SHA256 '+label);
    requireValue(Number.isFinite(s.sourceStartSeconds)&&Number.isFinite(s.sourceEndSeconds),'missing exact source in/out '+label);
    requireValue(s.sourceEndSeconds>s.sourceStartSeconds,'nonpositive source duration '+label);
    requireValue(typeof s.uniqueAngleKey==='string'&&s.uniqueAngleKey.length>=3,'unverified camera angle '+label);
    angles.add(s.uniqueAngleKey);verified++;
  }
  cursor=shot.endFrameExclusive;
 }
 requireValue(cursor===316,'timeline covers '+cursor+' rather than 316 frames');
 requireValue(map.shots.find(s=>s.startFrame===78)?.id.includes('reveal'),'frame-78 scene must be reveal');
 if(final)requireValue(angles.size>=10,'fewer than 10 independently verified angles: '+angles.size);
 return {mode:final?'FINAL':'PROVISIONAL',frameCount:cursor,shotCount:map.shots.length,revealFrame:78,sourceFilesDeclared:realFiles,verifiedShots:verified,verifiedUniqueAngles:angles.size,warnings:messages,gate:final?'STRUCTURAL_AND_SOURCE_CHECKS_PASSED_NOT_VISUAL_SIGNOFF':'PROVISIONAL_STRUCTURE_PASS_MEDIA_NOT_APPROVED'};
}
if(require.main===module){
 const final=process.argv.includes('--final');
 try{const result=validate(JSON.parse(fs.readFileSync(DEFAULT_MAP,'utf8')),{final});console.log(JSON.stringify(result,null,2));}
 catch(e){console.error('STO_EDIT_VALIDATION_FAILED:',e.message);process.exitCode=1;}
}
module.exports={validate,probeMedia};
