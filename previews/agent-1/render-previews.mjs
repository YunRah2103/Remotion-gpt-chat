#!/usr/bin/env node
/**
 * Native Remotion-only previews. Run at repository root after npm ci.
 * This helper verifies that BOTH files are genuinely moving, playable MP4s.
 * Passing machine checks is NOT a substitute for watching their frames.
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const entry='production/yunex/tyre_blowout_ep003/mechanics/preview-entry.tsx';
const output='out/ep003-agent-1';
const scale=process.env.REVIEW_SCALE??'0.5';
if(!/^0\.(25|5|75)$|^1$/.test(scale))throw Error('REVIEW_SCALE must be 0.25, 0.5, 0.75 or 1');
mkdirSync(output,{recursive:true});
const run=(bin,args)=>{
  const r=spawnSync(bin,args,{encoding:'utf8',stdio:'inherit'});
  if(r.status!==0)throw Error(`Failed (${r.status}): ${bin} ${args.join(' ')}`);
};
const capture=(bin,args)=>{
  const r=spawnSync(bin,args,{encoding:'utf8'});
  if(r.status!==0)throw Error(r.stderr);
  return r.stdout;
};
const results=[];
for(const [composition,seconds,samples] of [
  ['EP003TyreMacro',4,[.2,.8,1.3,2.3,3.6]],
  ['EP003TyrePortrait',6.8,[.2,.8,1.2,3,6.0]]
]){
  const filename=join(output,`${composition}.mp4`);
  run('npx',['--no-install','remotion','render',entry,composition,filename,
    '--gl=swangle','--codec=h264','--pixel-format=yuv420p','--concurrency=1',
    `--scale=${scale}`]);
  const meta=JSON.parse(capture('ffprobe',['-v','error','-select_streams','v:0',
    '-show_entries','stream=codec_name,pix_fmt,width,height,nb_frames,avg_frame_rate:format=duration',
    '-of','json',filename]));
  const stream=meta.streams?.[0];
  const expectedWidth=Math.round(1080*Number(scale));
  const expectedHeight=Math.round(1920*Number(scale));
  if(!stream||stream.codec_name!=='h264'||!['yuv420p','yuvj420p'].includes(stream.pix_fmt)||
    stream.width!==expectedWidth||stream.height!==expectedHeight||
    Number(stream.nb_frames)!==Math.round(seconds*30)||
    stream.avg_frame_rate!=='30/1'||Math.abs(Number(meta.format.duration)-seconds)>.075)
    throw Error('Native clip stream/frame validation failed: '+composition+' '+JSON.stringify(meta));
  run('ffmpeg',['-v','error','-xerror','-i',filename,'-f','null','-']);
  const hashes=[];
  for(const sec of samples){
    const dest=join(output,`${composition}-${sec.toFixed(1)}s.png`);
    run('ffmpeg',['-v','error','-y','-ss',String(sec),'-i',filename,'-frames:v','1',dest]);
    hashes.push(createHash('sha256').update(readFileSync(dest)).digest('hex'));
  }
  if(new Set(hashes).size<3)throw Error('No verified moving frame changes: '+composition);
  results.push({composition,filename,...meta,frameSampleHashes:hashes,scale,
    sourceComposition:{width:1080,height:1920,fps:30},automatedMotionPass:true,
    artisticAndPhysicalApproval:'NOT YET REVIEWED'});
}
writeFileSync(join(output,'preview-validation.json'),JSON.stringify(results,null,2)+'\n');
console.log('NATIVE MP4 decode + frame changes verified:',results.map(x=>x.filename).join(', '));
