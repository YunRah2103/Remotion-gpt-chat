#!/usr/bin/env node
/**
 * One agent command for real imported YUNEX GLBs: list, fetch and native
 * 6-second model-inspection render. No third-party GLBs checked into Git.
 *
 * npm ci
 * node scripts/yunex-agent-car.mjs list [--filter=ferrari]
 * node scripts/yunex-agent-car.mjs preview ferrari-f40
 * node scripts/yunex-agent-car.mjs preview external:bugatti-2019-bugatti-divo --private-review
 */
import {readFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const known=JSON.parse(readFileSync(join(root,'production/assets/imported-cars/catalog.json'),'utf8')).vehicles;
const external=JSON.parse(readFileSync(join(root,'production/asset-library/external-car-catalogue.json'),'utf8')).assets;
const command=process.argv[2]||'list';
const id=process.argv[3]||'';
const privateReview=process.argv.includes('--private-review');
const overwrite=process.argv.includes('--overwrite');
const dryRun=process.argv.includes('--dry-run');
const filter=process.argv.find(a=>a.startsWith('--filter='))?.slice(9).toLowerCase()||'';
function fail(message){throw Error(message);}
function run(executable,args){
 const result=spawnSync(executable,args,{cwd:root,stdio:'inherit',encoding:'utf8'});
 if(result.error)throw result.error;
 if(result.status!==0)fail(executable+' exited with status '+result.status);
}
function select(name){
 const externalId=name.startsWith('external:')?name.slice('external:'.length):null;
 const record=externalId?external.find(x=>x.id===externalId):known.find(x=>x.id===name);
 if(!record)fail('Unknown car ID: '+name+'. Run list to discover available assets.');
 const restricted=!!externalId||record.readiness==='review-only';
 if(restricted&&!privateReview)fail('PRIVATE REVIEW ONLY: '+name+'. Rerun with --private-review solely for non-public inspection.');
 return {record,externalId,restricted};
}
function installDraco(){
 const decoder=join(root,'public/yunex/imported-cars/draco');
 const source=join(root,'node_modules/three/examples/jsm/libs/draco');
 mkdirSync(decoder,{recursive:true});
 for(const file of ['draco_decoder.js','draco_wasm_wrapper.js','draco_decoder.wasm']){
  if(!existsSync(join(source,file)))fail('npm ci required: missing '+file);
  copyFileSync(join(source,file),join(decoder,file));
 }
}
function fetch(id,selection){
 if(dryRun)return;
 if(selection.externalId){
  run('python3',['production/asset-library/fetch_cars.py','--id',selection.externalId,'--allow-unverified']);
 }else{
  run(process.execPath,['scripts/imported-cars.mjs','fetch',id,...(selection.restricted?['--allow-review-only']:[])]);
 }
 installDraco();
}
try{
 if(command==='list'){
  for(const x of known.concat(external.map(e=>({...e,id:'external:'+e.id,readiness:'unverified',kind:e.category})))){
   const name=x.name||x.id;
   if(filter&&!((x.id+' '+name+' '+(x.kind||'')).toLowerCase().includes(filter)))continue;
   console.log(x.id+'\t'+(x.readiness==='attribution-required'?'ATTRIBUTION REQUIRED':'PRIVATE REVIEW ONLY')+'\t'+name);
  }
 }else if(command==='fetch'||command==='preview'){
  if(!id)fail('Specify an asset ID from list');
  const choice=select(id);
  if(choice.restricted)console.warn('UNVERIFIED PRIVATE REVIEW: do not publish, monetize or upload this GLB or preview without checking the original creator licence and source.');
  fetch(id,choice);
  if(command==='preview'){
   const lengthArg=process.argv.find(a=>a.startsWith('--length='));
   const lengthMeters=lengthArg?Number(lengthArg.slice(9)):4.7;
   if(!(Number.isFinite(lengthMeters)&&lengthMeters>0&&lengthMeters<30))fail('Length must be >0 and <30m');
   const slug=id.replace(/[^A-Za-z0-9-]/g,'-');
   const path=join(root,'out/imported-cars',slug+'-inspection.mp4');
   if(!dryRun&&existsSync(path)&&!overwrite)fail('Refusing to replace '+path+'; add --overwrite to rerender');
   const args=['--no-install','remotion','render','src/yunex/imported-cars/entry.tsx',
    'YunexImportedCarPreview',path,
    '--props='+JSON.stringify({carId:id,privateReview,lengthMeters}),
    '--gl=swangle','--codec=h264','--pixel-format=yuv420p','--timeout=120000'];
   if(dryRun)console.log('DRY RUN: npx '+args.map(JSON.stringify).join(' '));
   else{
    mkdirSync(join(root,'out/imported-cars'),{recursive:true});
    run('npx',args);
    const result=JSON.parse(execFileSync('ffprobe',[
      '-v','error','-count_frames','-select_streams','v:0',
      '-show_entries','stream=width,height,nb_read_frames,avg_frame_rate',
      '-of','json',path],{encoding:'utf8'}));
    const video=result.streams?.[0];
    if(!video||video.width!==1080||video.height!==1920||video.avg_frame_rate!=='30/1'||Number(video.nb_read_frames)!==180)
      fail('Preview failed native resolution/fps/frame-count audit: '+JSON.stringify(video));
    execFileSync('ffmpeg',['-v','error','-i',path,'-f','null','-'],{stdio:'inherit'});
    console.log('VERIFIED 180-frame 1080x1920 moving GLB review (NOT production clearance): '+path);
   }
  }
 }else fail('Usage: list [--filter=text] | fetch <id> [--private-review] | preview <id> [--length=4.7] [--private-review] [--overwrite] [--dry-run]');
}catch(error){console.error('YUNEX car agent:',error.message);process.exitCode=1;}
