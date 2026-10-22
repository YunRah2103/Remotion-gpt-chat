#!/usr/bin/env node
/**
 * Independent native Remotion render/QA runner for Agent 9's TWO real MP4s.
 * This script is NOT a claim that it has already executed in GitHub Actions.
 * Run on a checkout of agent/ep004-09-spark-look with npm ci and ffmpeg.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../../../../..');
const entry=join(root,'production/yunex/f1_sparks_ep004/quality/previews/agent-9/entry.tsx');
const dir=join(root,'out/ep004-quality-agent9');
mkdirSync(dir,{recursive:true});
const exec=(cmd,args)=>execFileSync(cmd,args,{cwd:root,stdio:'inherit'});
function capture(cmd,args){return execFileSync(cmd,args,{cwd:root,encoding:'utf8'});}
const jobs=[['contact-macro','EP004A9ContactMacro',150],['kit-v2-race-pass','EP004A9KitV2RacePass',240]];
for(const [name,composition,frames] of jobs){
 const file=join(dir,name+'.mp4');
 console.log('RENDER',composition);
 exec('npx',['remotion','render',entry,composition,file,'--gl=swangle',
  '--codec=h264','--pixel-format=yuv420p','--concurrency=2','--log=error']);
 const meta=JSON.parse(capture('ffprobe',['-v','error','-count_frames','-select_streams','v:0',
  '-show_entries','stream=codec_name,width,height,avg_frame_rate,nb_read_frames,duration',
  '-of','json',file])).streams[0];
 if(meta.codec_name!=='h264'||meta.width!==1080||meta.height!==1920||
   meta.avg_frame_rate!=='30/1'||Number(meta.nb_read_frames)!==frames)
  throw new Error('BAD native file: '+name+' '+JSON.stringify(meta));
 // The full stream must decode without one warning, not merely have a probe header.
 exec('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-']);
 for(const n of [0,Math.floor(frames/2),frames-1]){
  const dst=join(dir,name+'-frame-'+n+'.png');
  exec('ffmpeg',['-v','error','-y','-i',file,'-vf','select=eq(n\\,'+n+')',
    '-vsync','vfr','-frames:v','1',dst]);
  if(statSync(dst).size<1000)throw new Error('Missing full-res visual proof '+dst);
 }
 const rows=capture('ffmpeg',['-v','error','-i',file,'-map','0:v:0',
  '-vf','fps=5','-f','framemd5','-']).split('\n')
  .filter(line=>line&&!line.startsWith('#'));
 const hashes=new Set(rows.map(line=>line.split(',').at(-1).trim()));
 if(hashes.size<5)throw new Error(name+' is near-static, only '+hashes.size+' distinct 5fps frames');
 writeFileSync(join(dir,name+'-proof.json'),JSON.stringify({
  composition,filename:file,meta,fullDecode:true,framesInspected:[0,Math.floor(frames/2),frames-1],
  motionHashes5fps:hashes.size,stillScreenshotsAreAutomatic:true,
  visualCreativeApproval:false,
 },null,2)+'\n');
 console.log('PASS',name,JSON.stringify(meta),'moving hashes',hashes.size);
}
console.log('Manual shot/frame inspection and old V4 A/B remain required before creative approval.');
