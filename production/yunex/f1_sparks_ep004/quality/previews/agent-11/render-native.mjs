#!/usr/bin/env node
/**
 * Two genuine Remotion renders. Fail closed on H.264/fps/dimensions, FFmpeg
 * full decode, sampled 5fps motion hashes, missing first/middle/end shot frames.
 *
 * Root command:
 * node production/yunex/f1_sparks_ep004/quality/previews/agent-11/render-native.mjs
 * Optional: --baseline=/absolute/path/to/approved-agent6-V4.mp4
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, basename} from 'node:path';
import {createHash} from 'node:crypto';

const root = 'production/yunex/f1_sparks_ep004/quality';
const entry = root + '/previews/agent-11/entry.tsx';
const out = resolve('out/ep004-agent11-native');
const videos = [
  {id:'EP004Agent11DayNight', name:'agent11-day-night-1080p.mp4', frames:180,
    shots:[[0,89],[90,179]]},
  {id:'EP004Agent11NightCinema', name:'agent11-night-cinema-1080p.mp4', frames:240,
    shots:[[0,119],[120,239]]},
];
function run(cmd,args,capture=false) {
  const result=spawnSync(cmd,args,{encoding:'utf8',stdio:capture?'pipe':'inherit',
    maxBuffer:24*1024*1024});
  if(result.error || result.status!==0)
    throw new Error(cmd+' failed '+result.status+': '+(result.stderr||result.error||''));
  return (result.stdout||'').trim();
}
function probe(path) {
  const streams=JSON.parse(run('ffprobe',['-v','error','-select_streams','v:0',
    '-count_frames','-show_entries',
    'stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames,duration',
    '-of','json',path],true)).streams;
  if(streams.length!==1)throw new Error('No video stream in '+path);
  return streams[0];
}
function stillAt(path,n,name) {
  const dest=resolve(out,name+'.png');
  run('ffmpeg',['-v','error','-y','-i',path,'-vf','select=eq(n\\,'+n+')',
    '-vsync','vfr','-frames:v','1',dest]);
  if(!existsSync(dest))throw new Error('Missing inspected evidence '+dest);
  return basename(dest);
}
function motionCheck(path,duration) {
  const md5=run('ffmpeg',['-v','error','-i',path,
    '-vf','fps=5,scale=80:144:flags=area','-an','-f','framemd5','-'],true);
  const hashes=md5.split('\n').filter(row=>row&&!row.startsWith('#'))
    .map(row=>row.split(',').at(-1).trim());
  const expected=duration*5;
  if(Math.abs(hashes.length-expected)>1)throw new Error('5fps sampled frame count '+hashes.length);
  const unique=new Set(hashes).size;
  if(unique<Math.ceil(hashes.length*.70))throw new Error('Too few genuinely different video frames '+unique+'/'+hashes.length);
  return {sampleFps:5, sampled:hashes.length, uniqueHashes:unique};
}
mkdirSync(out,{recursive:true});
const report={
  generatedBy:'Remotion + native ffprobe/ffmpeg, NEVER synthetic clips',
  approved:false, physicsSurface:'original A4 / shared/sampleTrackSurface',
  sparks:'original A2 sampleContactDrivenSparks(getSkidDescriptors())',
  sourceEntry:entry, videos:[],
};
for(const video of videos) {
  const path=resolve(out,video.name);
  run('npx',['--no-install','remotion','render',entry,video.id,path,
    '--frames=0-'+(video.frames-1),'--gl=swangle','--codec=h264',
    '--pixel-format=yuv420p','--concurrency=1','--log=error']);
  const meta=probe(path);
  if(meta.codec_name!=='h264'||meta.pix_fmt!=='yuv420p'||
    meta.width!==1080||meta.height!==1920||meta.avg_frame_rate!=='30/1'||
    Number(meta.nb_read_frames)!==video.frames)
    throw new Error('Native video spec mismatch '+video.id+': '+JSON.stringify(meta));
  const durationSec=Number(meta.duration);
  if (!Number.isFinite(durationSec) ||
      Math.abs(durationSec - video.frames/30) > 0.06) {
    throw new Error('Duration does not match declared frames: '+JSON.stringify(meta));
  }
  run('ffmpeg',['-v','error','-xerror','-i',path,'-f','null','-']);
  const motion=motionCheck(path,video.frames/30);
  const frameEvidence=[];
  for(let i=0;i<video.shots.length;i++){
    const [first,last]=video.shots[i];
    const middle=Math.floor((first+last)/2);
    for(const frame of [first,middle,last])
      frameEvidence.push(stillAt(path,frame,video.id+'-shot'+(i+1)+'-'+frame));
  }
  report.videos.push({composition:video.id,file:video.name,
    frameCount:video.frames,durationSec:video.frames/30,probe:meta,
    fullDecode:'passed',motion,frameEvidence,
    sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
}
const flag=process.argv.find(x=>x.startsWith('--baseline='));
if(flag) {
  const source=resolve(flag.slice('--baseline='.length));
  if(!existsSync(source))throw new Error('Missing owner-approved V4 baseline '+source);
  const meta=probe(source);
  const n=Number(meta.nb_read_frames);
  if(!Number.isInteger(n)||n<4)throw new Error('Invalid baseline frame count');
  report.baseline={
    source,sha256:createHash('sha256').update(readFileSync(source)).digest('hex'),
    frameEvidence:[0,Math.floor(n/3),Math.floor(n*2/3),n-1]
      .map(frame=>stillAt(source,frame,'original-agent6-V4-'+frame)),
    caution:'Baseline has different original edit/motion; appearance comparison only.',
  };
}
writeFileSync(resolve(out,'proof.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
