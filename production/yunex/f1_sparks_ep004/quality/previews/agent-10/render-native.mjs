#!/usr/bin/env node
/** Run on a GitHub Actions runner / checkout with npm ci and FFmpeg installed.
 * No proxy video, still-image slideshow or invented success verdicts.
 * Native evidence is produced ONLY after successful genuine Remotion encoding.
 */
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {SHOT_SOURCE_TABLE} from '../../cinema/shot-plan.ts';

const DIR='out/ep004/agent-10-native',entry='production/yunex/f1_sparks_ep004/quality/previews/agent-10/entry.tsx';
const comps=[
 {id:'EP004A10SixShotV2',file:'six-shots.mp4',frames:288,cuts:SHOT_SOURCE_TABLE.map(s=>[s.shot,s.startFrame,s.endFrameExclusive])},
 {id:'EP004A10BeforeAfter',file:'a-b-comparison.mp4',frames:240,cuts:[
   ['hook-before',0,60],['hook-after',60,120],['payoff-before',120,180],['payoff-after',180,240],
 ]},
];
mkdirSync(DIR,{recursive:true});
function run(cmd,args,action){
 const p=spawnSync(cmd,args,{cwd:process.cwd(),encoding:'utf8',maxBuffer:16e6,timeout:50*60*1000});
 if(p.error||p.status!==0)throw Error(action+' failed: '+(p.error?.message??p.stderr?.slice(-3000)));
 return p.stdout;
}
const evidence={status:'NATIVE VERIFIED AFTER THIS SCRIPT COMPLETES',kit:'real V2 formula rig; built-in generic sparks disabled',
 science:'existing physical Agent2 contacts/particles; original EP004 skid coordinates',
 originalVoice:'not included: 25.248 second original recording and word alignment held by Agent6',
 video:[],sourceTimeTable:SHOT_SOURCE_TABLE};
for(const item of comps){
 const filename=resolve(DIR,item.file);
 run('npx',['remotion','render',entry,item.id,filename,'--gl=swangle','--codec=h264',
   '--pixel-format=yuv420p','--concurrency=2','--log=error'],'native '+item.id);
 const probe=JSON.parse(run('ffprobe',['-v','error','-select_streams','v:0','-count_frames',
   '-show_entries','stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames,duration',
   '-of','json',filename],'ffprobe '+item.id)).streams?.[0];
 if(!probe||probe.codec_name!=='h264'||probe.width!==1080||probe.height!==1920||
   probe.avg_frame_rate!=='30/1'||Number(probe.nb_read_frames)!==item.frames||
   Math.abs(Number(probe.duration)-item.frames/30)>.06)
     throw Error('Wrong real video probe '+item.id+': '+JSON.stringify(probe));
 run('ffmpeg',['-v','error','-xerror','-i',filename,'-f','null','-'],'full FFmpeg decode '+item.id);
 const shots=[];
 for(const [shot,start,end] of item.cuts){
   const stamps=[start,Math.floor((start+end-1)/2),end-1];
   const stills=[];
   for(const frame of stamps){
     const img=resolve(DIR,item.id+'-'+shot+'-frame-'+frame+'.png');
     run('ffmpeg',['-v','error','-y','-ss',(frame/30).toFixed(5),'-i',filename,
       '-frames:v','1',img],'frame '+frame);
     if(statSync(img).size<2000)throw Error('Image absent/blank file '+img);
     stills.push(img);
   }
   const hashes=run('ffmpeg',['-v','error','-ss',(start/30).toFixed(5),'-i',filename,
     '-t',((end-start)/30).toFixed(5),'-vf','fps=5','-f','framemd5','-'],
     '5fps motion '+shot).split('\n').filter(line=>line&&!line.startsWith('#'))
       .map(line=>line.split(',').at(-1)?.trim());
   const uniqueHashes=new Set(hashes).size;
   if(uniqueHashes<2)throw Error('Cut has no observed moving native frames: '+shot);
   shots.push({shot,firstFrame:start,lastFrame:end-1,stills,framesSampled:hashes.length,uniqueHashes});
 }
 evidence.video.push({composition:item.id,path:filename,probe,decodedAllFrames:true,shots});
 process.stdout.write('VERIFIED actual native '+item.id+' '+item.frames+' frames, '+shots.length+' moving cuts\n');
}
writeFileSync(resolve(DIR,'QA-EVIDENCE.json'),JSON.stringify(evidence,null,2)+'\n');
writeFileSync(resolve(DIR,'SHOT-TIMING.json'),JSON.stringify(SHOT_SOURCE_TABLE,null,2)+'\n');
