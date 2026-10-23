import {bundle} from '@remotion/bundler';import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';import {mkdir,writeFile} from 'node:fs/promises';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';import {ENVIRONMENT_CATALOG} from '../../src/yunex/world-kit/world-catalog.ts';
const out='out/world-kit-v3';await mkdir(out,{recursive:true});const serveUrl=await bundle({entryPoint:'src/yunex/world-kit/entry.tsx'});const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
const still=async(id,inputProps,file,frame=0)=>{const composition=await selectComposition({serveUrl,id,inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,frame,output:`${out}/${file}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('STILL',file);};
try{
 if(!process.argv.includes('--reels-only')){
  for(const v of VEHICLES)await still('VehiclePreview',{variant:v.id,angle:.67},`vehicle-${v.id}`);
  for(let i=0;i<ENVIRONMENT_CATALOG.length;i++){const e=ENVIRONMENT_CATALOG[i];await still('EnvironmentPreview',{variant:i%3===1?'boxy-suv':'coupe',environment:e.id,timeOfDay:e.timeOfDay,seed:12,wideView:true},`world-${e.id}`,15);}
  for(const variant of ['saloon','supercar','boxy-suv','panel-van','minivan','camper-van','box-truck','crew-pickup','muscle-coupe'])await still('InteriorPreview',{variant,mode:'cutaway'},`interior-${variant}`);
  for(const variant of ['saloon','supercar','boxy-suv','panel-van','box-truck'])await still('InteriorDriver',{variant,mode:'driver'},`driver-${variant}`);
 }
 if(!process.argv.includes('--stills-only'))for(const [id,seconds,file] of [['EnvironmentReel',20,'YUNEX_20_ENVIRONMENTS_V3'],['InteriorReel',6,'YUNEX_INTERIORS_V3']]){
  const selected=await selectComposition({serveUrl,id,browserInstance:browser});const composition={...selected,fps:15,durationInFrames:seconds*15};let last=-1;
  await renderMedia({serveUrl,composition,outputLocation:`${out}/${file}.mp4`,codec:'h264',scale:.5,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},crf:19,onProgress:p=>{const progress=Math.floor(p.renderedFrames/15);if(progress!==last){last=progress;console.log(file,progress,'seconds rendered');}}});
 }
 await writeFile(`${out}/catalog.json`,JSON.stringify({vehicles:VEHICLES,environments:ENVIRONMENT_CATALOG,reviewFPS:15},null,2));
}finally{await browser.close({silent:true});}
