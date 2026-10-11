#!/usr/bin/env node
/**
 * Agent B GT3 shotmap QA. Structural preflight is NOT a source-media PASS.
 * Usage:
 *   node validate-shotmap.mjs --plan
 *   node validate-shotmap.mjs --strict
 * --strict verifies actual bytes, ffprobe, crop-effective native resolution,
 * SHA256, in/out trim safety, and source-film diversity.
 */
import {readFileSync,existsSync,createReadStream,statSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const directory=resolve(fileURLToPath(new URL('.',import.meta.url)));
export const shotmapPath=join(directory,'shotmap.json');
export const projectRoot=resolve(directory,'../../../..');
export const load=()=>JSON.parse(readFileSync(shotmapPath,'utf8'));

export function validateStructure(map){
  const errors=[],warnings=[];
  if(map.width!==1920||map.height!==1080||map.fps!==30||map.durationInFrames!==316)
    errors.push('Master must be 1920x1080, 30fps, 316 frames');
  if(!Array.isArray(map.shots)||map.shots.length<18||map.shots.length>26)
    errors.push('Must schedule 18–26 shots');
  let previous=0;
  const ids=new Set(),planMakes=new Set();
  for(const s of map.shots||[]){
    if(ids.has(s.id))errors.push('Duplicate shot ID '+s.id);
    ids.add(s.id);
    if(s.from!==previous)errors.push('Timeline gap/overlap at '+s.id+': expected '+previous+', got '+s.from);
    if(!Number.isInteger(s.from)||!Number.isInteger(s.to)||s.to-s.from<6)
      errors.push('Invalid or dangerously short duration at '+s.id);
    if(!s.transition||!Number.isInteger(s.transition.frames)||s.transition.frames<0||s.transition.frames>3)
      errors.push('Transition overlap must be 0–3 frames for '+s.id);
    if(s.from<(s.transition?.frames||0))errors.push('Negative starting overlap for '+s.id);
    if(!s.edit||!(s.edit.speed>=0.65&&s.edit.speed<=1.6))
      errors.push('Unsafe playback speed at '+s.id);
    if(s.edit&&(!(s.edit.cropX>=0&&s.edit.cropX<=100)||!(s.edit.cropY>=0&&s.edit.cropY<=100)))
      errors.push('Invalid crop anchor '+s.id);
    previous=s.to;
    planMakes.add(s.targetMake);
  }
  if(previous!==316)errors.push('Timeline ends at '+previous+' not 316');
  if(planMakes.size<6)errors.push('Multi-marque planning mix requires >=6 makes');
  if(!Array.isArray(map.impactFrames)||map.impactFrames.some(f=>!Number.isInteger(f)||f<0||f>=316))
    errors.push('Invalid impact frames');
  for(const f of map.impactFrames||[]){
    if(!map.shots?.some(s=>s.from===f))warnings.push('Impact at '+f+' has no matching cut');
  }
  const unfilled=(map.shots||[]).filter(s=>!s.source||s.sourceInFrame===null||!s.verifiedMake||!s.sourceFilmId||!s.sourceSha256);
  if(unfilled.length)warnings.push(unfilled.length+' REAL SOURCE SLOTS PENDING — never claim Gate B PASS');
  return {errors,warnings,shotCount:map.shots?.length||0,plannedMakes:[...planMakes],unfilledSlots:unfilled.map(s=>s.id)};
}

const sha256=path=>new Promise((done,reject)=>{
  const h=createHash('sha256');const stream=createReadStream(path);
  stream.on('data',c=>h.update(c));stream.on('error',reject);
  stream.on('end',()=>done(h.digest('hex')));
});
function probe(path){
  const res=spawnSync('ffprobe',['-v','error','-show_entries',
    'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate',
    '-of','json',path],{encoding:'utf8',maxBuffer:1024*1024});
  if(res.status!==0)throw Error('ffprobe '+(res.stderr||'failed'));
  const data=JSON.parse(res.stdout);
  return {video:data.streams?.find(s=>s.codec_type==='video'),duration:Number(data.format?.duration),bytes:Number(data.format?.size)};
}
function cropPixels(w,h){
  const target=16/9,ratio=w/h;
  return ratio>=target?{w:h*target,h}:{w,h:w/target};
}
export async function validateStrict(map){
  const check=validateStructure(map); const errors=[...check.errors],warnings=[...check.warnings];
  const verifiedMakes=new Set(),films=new Set(),used=[];
  const root=resolve(projectRoot,'public');
  for(const s of map.shots||[]){
    if(!s.source||!Number.isInteger(s.sourceInFrame)||s.sourceInFrame<0||!s.verifiedMake||!s.verifiedModel||!s.sourceFilmId||!s.sourceSha256){
      errors.push(s.id+' lacks verified actual source, trim, model, filmId or SHA256');
      continue;
    }
    if(!/^gt3-multicar-001\/[a-zA-Z0-9_./-]+\.mp4$/i.test(s.source)||s.source.includes('..')){
      errors.push(s.id+' unsafe/unexpected source path '+s.source);continue;
    }
    const path=resolve(root,s.source);
    if(!path.startsWith(root+sep)||!existsSync(path)){errors.push(s.id+' real clip missing: '+path);continue;}
    if(!/^[a-f0-9]{64}$/i.test(s.sourceSha256)){errors.push(s.id+' invalid SHA256');continue;}
    try{
      const p=probe(path);
      if(!p.video||!Number.isFinite(p.duration)||p.duration<=0)throw Error('No valid video stream');
      const crop=cropPixels(p.video.width,p.video.height);
      if(crop.w<1920||crop.h<1080)errors.push(s.id+' is below native 1080p 16:9 crop: '+p.video.width+'x'+p.video.height);
      const needed=(s.sourceInFrame+(s.to-s.from+s.transition.frames)*s.edit.speed)/30 +.08;
      if(p.duration<needed)errors.push(s.id+' source too short ('+p.duration+'s vs '+needed.toFixed(3)+'s required)');
      if(p.bytes<100000)errors.push(s.id+' implausibly small video');
      const digest=await sha256(path);
      if(digest.toLowerCase()!==s.sourceSha256.toLowerCase())errors.push(s.id+' source SHA mismatch');
      if(s.verifiedMake.toLowerCase()!==s.targetMake.toLowerCase())errors.push(s.id+' verified make differs from cut plan');
      verifiedMakes.add(s.verifiedMake);
      films.add(s.sourceFilmId);
      used.push({id:s.id,source:s.source,sha256:digest,sourceInFrame:s.sourceInFrame,
        sourceOutFrame:s.sourceInFrame+(s.to-s.from+s.transition.frames)*s.edit.speed});
    }catch(e){errors.push(s.id+' '+String(e));}
  }
  if(verifiedMakes.size<6)errors.push('Fewer than six VERIFIED GT3 makes: '+verifiedMakes.size);
  if(films.size<3)errors.push('Fewer than three independent SOURCE FILMS/FEEDS: '+films.size);
  for(let i=0;i<used.length;i++)for(let j=i+1;j<used.length;j++){
    const a=used[i],b=used[j];
    if(a.sha256===b.sha256 && Math.max(a.sourceInFrame,b.sourceInFrame)<Math.min(a.sourceOutFrame,b.sourceOutFrame))
      errors.push('Overlapping repeated original frames '+a.id+' and '+b.id);
  }
  if(used.length<18)errors.push('Fewer than 18 verified unique media shots');
  warnings.push('Automated checks cannot certify GT3 identity, clean watermarks, dynamic camera action or colour; real visual inspection still required');
  return {...check,errors,warnings,verifiedMakes:[...verifiedMakes],sourceFilmCount:films.size,verifiedMediaCount:used.length};
}

async function main(){
  const strict=process.argv.includes('--strict');
  const map=load();
  const result=strict?await validateStrict(map):validateStructure(map);
  console.log(JSON.stringify({mode:strict?'STRICT_MEDIA':'PLAN_ONLY_NOT_MEDIA_APPROVAL',...result},null,2));
  if(result.errors.length)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{console.error(e);process.exitCode=2;});
}
