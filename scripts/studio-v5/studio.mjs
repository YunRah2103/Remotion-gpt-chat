import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';import {dirname} from 'node:path';
import {resolveConfig,PRESETS,createStudioEnvironment} from '../../src/yunex/studio-v5/environment.ts';
import {createRoad} from '../../src/yunex/studio-v5/road.ts';
import {resolveShot,sampleStudioShot} from '../../src/yunex/studio-v5/shot.ts';
import {sampleProofMotion} from '../../src/yunex/studio-v5/proof-motion.ts';
import {createStudioVehicle,poseStudioVehicle} from '../../src/yunex/studio-v5/vehicle.ts';
import {auditCameraClearance} from '../../src/yunex/modelling-kit/camera-clearance.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const [command,preset='mountain',file=`out/v5/${preset}.json`]=process.argv.slice(2);
if(command==='create'){
 if(existsSync(file))throw Error('Refusing to overwrite '+file);
 const config={preset};resolveConfig(config);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify({config},null,2)+'\n');console.log(file);
}else if(['validate','render','audit'].includes(command)){
 const props=JSON.parse(readFileSync(file,'utf8')),resolved=resolveConfig(props.config),validationRoad=createRoad(resolved.road);resolveShot(props.camera);sampleProofMotion(validationRoad.length,0,30,resolved.preset==='rally'?10:13);
 for(const key of ['baseline','scanned'])if(props[key]!==undefined&&typeof props[key]!=='boolean')throw Error(key+' must be boolean');
 for(const key of Object.keys(props))if(!['config','camera','baseline','scanned'].includes(key))throw Error('Unknown driving-shot property '+key);
 if(command==='validate')console.log('Valid V5 configuration and camera shot');
 else if(command==='audit'){
  if(props.baseline)throw Error('V5 audit requires baseline:false; legacy footage uses its own route');
  const world=createStudioEnvironment(props.config),p=world.config.preset,car=createStudioVehicle(p==='city'?'coupe':p==='rally'?'rally-hatch':'supercar'),report=[];
  try{for(const frame of [0,60,120,180,239]){
   const motion=sampleProofMotion(world.road.length,frame,30,p==='rally'?10:13);poseStudioVehicle(car,world.road,motion.distance,frame,30,motion.speed);
   const view=sampleStudioShot(world.road,motion.distance,frame,30,{side:p==='mountain'?'left':'right',...props.camera});
   report.push({frame,...auditCameraClearance(car,world.group,view,9/16)});
  }}finally{disposeObject(car);disposeObject(world.group);}
  console.log(JSON.stringify({report,limitations:'Five sparse frame samples. Alpha foliage is conservatively solid; no texture-alpha test. Inspect the actual moving preview.'},null,2));
  if(report.some(x=>x.state==='fail'))process.exitCode=1;
 }else {const r=spawnSync('npx',['remotion','render','src/yunex/studio-v5/Film.tsx','V5-'+props.config.preset,`out/v5/${preset}.mp4`,'--props='+file,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--color-space=bt709','--crf=18','--concurrency=2'],{stdio:'inherit'});process.exit(r.status??1);}
}else if(command==='presets')console.log(JSON.stringify(PRESETS,null,2));
else throw Error('Use create <preset> [json], validate <name> <json>, audit <name> <json>, render <name> <json>, or presets');
