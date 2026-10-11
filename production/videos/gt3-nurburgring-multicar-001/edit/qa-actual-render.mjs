#!/usr/bin/env node
/**
 * Actual-media QA ONLY. Refuses a source-less, partial, silent or malformed
 * preview. Use after Agent A clips have been integrated and real edit rendered.
 * Does not grant aesthetic PASS: native frame review is still necessary.
 *
 * node qa-actual-render.mjs path/to/real-visual-master.mp4 output-directory
 */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const video=process.argv[2],destination=resolve(process.argv[3]||'out/gt3-media-qa');
if(!video||!existsSync(video)){console.error('FAIL: supply an ACTUAL rendered MP4; no synthetic slates accepted');process.exit(2);}
mkdirSync(destination,{recursive:true});
const exec=(cmd,args)=>{
  const p=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:5*1024*1024});
  if(p.status!==0)throw new Error(cmd+' failed: '+p.stderr?.slice(-2000));
  return p;
};
const data=JSON.parse(exec('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,pix_fmt:format=duration',
  '-of','json',video]).stdout);
const v=data.streams?.find(s=>s.codec_type==='video');
const errors=[];
if(!v)errors.push('no video stream');
if(v&&(v.width!==1920||v.height!==1080))errors.push('not exact native 1920x1080');
if(v&&v.r_frame_rate!=='30/1')errors.push('not 30fps');
if(v&&v.codec_name!=='h264')errors.push('not H264');
if(v&&v.pix_fmt!=='yuv420p')errors.push('not yuv420p');
if(v&&v.nb_frames&&Number(v.nb_frames)!==316)errors.push('not exactly 316 frames');
if(Math.abs(Number(data.format?.duration)-316/30)>0.04)errors.push('wrong duration');
if(data.streams?.some(s=>s.codec_type==='audio'))errors.push('Agent B visual master should be silent; Agent C mixes exact song');
if(errors.length){console.error('FAILED media geometry: '+JSON.stringify(errors));process.exit(1);}
exec('ffmpeg',['-hide_banner','-v','error','-i',video,'-f','null','-']);
const sheet=join(destination,'ACTUAL-RENDER-20-PANEL.png');
exec('ffmpeg',['-hide_banner','-v','error','-i',video,'-vf',
  'fps=2,scale=480:270:flags=lanczos,tile=5x4','-frames:v','1','-y',sheet]);
const black=exec('ffmpeg',['-hide_banner','-v','info','-i',video,
  '-vf','blackdetect=d=0.066:pix_th=0.07','-an','-f','null','-']);
const detections=[...black.stderr.matchAll(/black_start:([0-9.]+) black_end:([0-9.]+)/g)].map(m=>({start:+m[1],end:+m[2]}));
if(detections.length)errors.push('Black video intervals: '+JSON.stringify(detections));
const report={
  visualGate:'AUTOMATED MEDIA QA ONLY — ACTUAL HUMAN FRAME/SHOT REVIEW STILL REQUIRED',
  input:resolve(video),stream:v,duration:Number(data.format.duration),blackIntervals:detections,
  contactSheet:sheet,fullyDecoded:true,errors,
};
writeFileSync(join(destination,'actual-media-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
