#!/usr/bin/env node
/** EP004 Agent 3. Render BOTH real native Remotion clips, probe and decode.
 * Run from repository root after npm ci; artifact output is untracked /out/.
 * This is a reproducibility tool, not a claim that native render has occurred.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const ROOT=process.cwd();
const output=resolve(ROOT,'out/ep004/agent-3-native');
const entry='production/yunex/f1_sparks_ep004/previews/agent-3/entry.tsx';
const samples=[
  {id:'EP004Agent3Hook',name:'hook',frames:150,times:[.1,2.5,4.8]},
  {id:'EP004Agent3Sequence',name:'sequence',frames:330,times:[.1,5.5,10.8]},
];
mkdirSync(output,{recursive:true});
function run(cmd,args,label){
  const r=spawnSync(cmd,args,{cwd:ROOT,stdio:['inherit','pipe','pipe'],encoding:'utf8',maxBuffer:8*1024*1024,timeout:45*60*1000});
  if(r.error)throw new Error(label+': '+r.error.message);
  if(r.status!==0)throw new Error(label+' failed (exit '+r.status+'): '+r.stderr?.slice(-1800));
  return r.stdout.trim();
}
const proofs=[];
for(const shot of samples){
  const movie=resolve(output,shot.name+'.mp4');
  const args=['remotion','render',entry,shot.id,movie,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--concurrency=2','--log=error'];
  run(process.platform==='win32'?'npx.cmd':'npx',args,'render '+shot.id);
  const metadata=JSON.parse(run('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames','-of','json',movie],'ffprobe '+shot.id));
  const video=metadata.streams?.[0];
  if(!video||video.width!==1080||video.height!==1920||video.avg_frame_rate!=='30/1'||Number(video.nb_read_frames)!==shot.frames||video.codec_name!=='h264')throw Error('Native frame validation failed '+shot.id+': '+JSON.stringify(video));
  run('ffmpeg',['-v','error','-xerror','-i',movie,'-f','null','-'],'full decode '+shot.id);
  const frameFiles=[];
  for(const [i,sec] of shot.times.entries()){
    const filename=resolve(output,shot.name+'-sample-'+i+'.png');
    run('ffmpeg',['-v','error','-y','-ss',String(sec),'-i',movie,'-frames:v','1',filename],'sample '+shot.id);
    frameFiles.push(filename);
  }
  proofs.push({composition:shot.id,movie,metadata:video,decodedAllFrames:true,samples:frameFiles});
  process.stdout.write('VERIFIED native Remotion '+shot.id+' '+shot.frames+' full frames\n');
}
writeFileSync(resolve(output,'proof.json'),JSON.stringify({referenceFixture:'PROVISIONAL; Agent 1/2/4 integration pending',proofs},null,2)+'\n');
