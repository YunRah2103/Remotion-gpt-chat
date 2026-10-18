import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
const output='out/world-kit';await mkdir(output,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/yunex/world-kit/entry.tsx'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
try{
 for(const v of (process.argv.includes('--scenes-only')?[]:VEHICLES)){
  const inputProps={variant:v.id,angle:.67};const composition=await selectComposition({serveUrl,id:'VehiclePreview',inputProps,browserInstance:browser});
  await renderStill({serveUrl,composition,inputProps,output:`${output}/${v.id}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('MODEL',v.id);
 }
 for(const [environment,variant,timeOfDay] of [['highway','coupe','day'],['city','saloon','dusk'],['track','formula-modern','day']]){
  const inputProps={variant,environment,timeOfDay,seed:12};const composition=await selectComposition({serveUrl,id:'DrivingPreview',inputProps,browserInstance:browser});
  await renderStill({serveUrl,composition,inputProps,frame:45,output:`${output}/environment-${environment}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('ENVIRONMENT',environment);
 }
 for(const variant of (process.argv.includes('--scenes-only')?[]:['hatchback','pickup','box-truck','sport-bike','supercar'])){
  const inputProps={variant,angle:2.55};const composition=await selectComposition({serveUrl,id:'VehiclePreview',inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,output:`${output}/${variant}-rear.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});
 }
 for(const variant of ['tractor-truck','naked-bike']){
  const inputProps={variant,angle:.67};const composition=await selectComposition({serveUrl,id:'VehiclePreviewPortrait',inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,output:`${output}/${variant}-portrait.png`,scale:.4,browserInstance:browser,chromiumOptions:{gl:'swangle'}});
 }
 const composition=await selectComposition({serveUrl,id:'WorldKitReel',browserInstance:browser});
 console.log('REEL START');
 await renderMedia({serveUrl,composition,codec:'h264',outputLocation:`${output}/YUNEX_WORLD_KIT_PREVIEW.mp4`,scale:.5,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},crf:19,onProgress:p=>{if(p.renderedFrames%30===0)console.log('REEL',p.renderedFrames);}});
 await writeFile(`${output}/render-manifest.json`,JSON.stringify({variants:VEHICLES.map(v=>v.id),environments:['highway','city','track'],preview:{width:960,height:540,fps:30,frames:570}},null,2));
}finally{await browser.close({silent:true});}
