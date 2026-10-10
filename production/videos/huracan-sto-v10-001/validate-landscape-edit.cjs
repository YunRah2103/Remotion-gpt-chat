#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');
const {spawnSync}=require('node:child_process');
const p=path.join(__dirname,'shot-map-landscape.json');
const map=JSON.parse(fs.readFileSync(p,'utf8'));
function assert(ok,msg){if(!ok)throw Error(msg)}
function validate({assembly=false,release=false,root=path.resolve(__dirname,'../../..')}={}){
 const {output,shots}=map;assert(output.width===1920&&output.height===1080&&output.fps===30&&output.durationFrames===316,'format must be FULL HD 16:9 landscape');
 assert(map.revealFrame===78,'frame-78 reveal altered');
 assert(shots.length===14,'expected 14 unique cut slots');
 let cursor=0;let keys=new Set();let moving=0;
 for(const [index,s] of shots.entries()){
  const duration=s.endFrameExclusive-s.startFrame;
  assert(s.startFrame===cursor&&duration>=5,'gap / overlap / invalid cut '+s.id);
  assert(s.file==='shot-'+String(index+1).padStart(2,'0')+'.mp4','incorrect fixed clip identity '+s.id);
  assert(!s.sourceOriginal.includes('/')&&s.sourceOriginal.endsWith('.mp4'),'untrusted path '+s.id);
  assert(s.sourceStartSeconds>=0&&s.sourceEndSeconds>s.sourceStartSeconds,'source in/out invalid '+s.id);
  const src=map.sourceFiles[s.sourceOriginal.slice(0,-4)];
  assert(!!src,'missing source manifest '+s.id);
  assert(src.width===1920&&[810,1080].includes(src.height),'unapproved original source dimensions '+s.id);
  assert(Number.isFinite(s.sourceCropX)&&s.sourceCropX>=0&&s.sourceCropX<=1,'out-of-frame cinema crop '+s.id);
  const nonNative=src.height===810;
  assert(s.aspectTreatment===(nonNative?'UNIFORM_1.333X_SCALE_THEN_HORIZONTAL_CROP_1920X1080':'NATIVE_1920X1080_UNSCALED'),'uncleared source crop treatment '+s.id);
  assert(s.cropKeyframes.length>=2,'missing crop tracking '+s.id);
  assert(s.cropKeyframes[0].frame===0&&s.cropKeyframes.at(-1).frame===duration-1,'crop out of range '+s.id);
  for(const k of s.cropKeyframes)assert(k.x>=.08&&k.x<=.92&&k.y>=.08&&k.y<=.92&&k.zoom>=1&&k.zoom<=1.18,'crop too aggressive '+s.id);
  if(assembly||release){
   const file=path.join(root,map.mediaDirectory,s.file);
   assert(fs.existsSync(file),'missing physical shot file '+file);
   const probe=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries',
      'stream=width,height,nb_read_frames,avg_frame_rate','-of','json',file],{encoding:'utf8'});
   assert(probe.status===0,'probe failure '+file);
   const v=JSON.parse(probe.stdout).streams[0];
   assert(v.width===1920&&v.height===1080&&v.avg_frame_rate==='30/1'&&Number(v.nb_read_frames)===duration,'bad frame count/res '+s.id);
  }
  if(s.movingAngleVerified&&typeof s.uniqueMovingAngleKey==='string'){
   keys.add(s.uniqueMovingAngleKey);moving++;
  }
  cursor=s.endFrameExclusive;
 }
 assert(cursor===316&&shots[4].startFrame===78,'incorrect total or reveal');
 if(release){
  assert(map.sourceGatePassed===true,'source gate not passed');
  assert(keys.size>=10,'insufficient verified distinct moving STO angles');
  assert(moving>=10,'insufficient genuinely moving angle approvals');
 }
 return {mode:release?'RELEASE':assembly?'PHYSICAL_CLIP_ASSEMBLY':'STRUCTURE',frames:cursor,format:'1920x1080',fps:30,
  scenes:shots.length,uniqueVerifiedMovingAngles:keys.size,sourceGatePassed:map.sourceGatePassed,
  state:release?'RELEASE_REQUIREMENTS_MET':'CANDIDATE_ONLY_NOT_GATE_A_PASS'};
}
if(require.main===module){try{console.log(JSON.stringify(validate({assembly:process.argv.includes('--assembly'),release:process.argv.includes('--release')}),null,2))}
 catch(e){console.error('STO_EDIT_FAIL',e.message);process.exitCode=1}}
module.exports={validate};
