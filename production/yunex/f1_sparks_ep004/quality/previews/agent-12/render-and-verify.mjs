/** Native QA is REQUIRED before creative approval. This command is intentionally
 * explicit: PR CI alone does not prove native Agent12 previews were rendered.
 * Run from repository root on installed Node/Chromium/FFmpeg environment.
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root='production/yunex/f1_sparks_ep004/quality/previews/agent-12';
const entry=root+'/entry.tsx',out='out/ep004-agent12';
fs.mkdirSync(out,{recursive:true});
function exec(cmd,args,returnText=false){
 const v=spawnSync(cmd,args,{encoding:'utf8',stdio:returnText?'pipe':'inherit',maxBuffer:32*1024*1024});
 if(v.error||v.status!==0)throw new Error(cmd+' failed: '+String(v.error??v.stderr??v.status));
 return v.stdout??'';
}
const samples=[['technical','EP004A12Technical',180],['ui','EP004A12UI',270]];
const evidence={};
for(const [label,id,total] of samples){
 const file=path.join(out,label+'.mp4');
 exec('npx',['remotion','render',entry,id,file,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--log=error']);
 const meta=JSON.parse(exec('ffprobe',['-v','error','-select_streams','v:0','-count_frames',
  '-show_entries','stream=width,height,avg_frame_rate,nb_read_frames,codec_name','-of','json',file],true)).streams[0];
 if(meta.width!==1080||meta.height!==1920||meta.avg_frame_rate!=='30/1'||Number(meta.nb_read_frames)!==total)
  throw new Error(label+': wrong native dimensions/fps/count: '+JSON.stringify(meta));
 exec('ffmpeg',['-v','error','-xerror','-i',file,'-map','0:v:0','-f','null','-']);
 const proof=[];
 for(const frame of [0,Math.round(total*.25),Math.floor(total/2),Math.round(total*.8),total-1]){
  const filename=path.join(out,label+'-f'+frame+'.jpg');
  exec('ffmpeg',['-v','error','-y','-i',file,'-vf','select=eq(n\\,'+frame+')',
    '-vsync','vfr','-frames:v','1',filename]);
  if(fs.statSync(filename).size<1000)throw new Error('empty screenshot '+filename);
  proof.push(filename);
 }
 const frameHash=exec('ffmpeg',['-v','error','-i',file,'-vf','fps=2','-f','framemd5','-'],true)
  .split('\n').filter(s=>s&&!s.startsWith('#')).map(s=>s.split(',').at(-1)?.trim());
 if(new Set(frameHash).size<3)throw new Error(label+': static not moving');
 evidence[label]={file,meta,motionHashCount:new Set(frameHash).size,screenshots:proof};
}
fs.writeFileSync(out+'/native-evidence.json',JSON.stringify(evidence,null,2));
console.log('Native MP4 proof complete',out);
