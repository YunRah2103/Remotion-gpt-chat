import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
const out='out/world-kit-quality';await mkdir(out,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/yunex/world-kit/entry.tsx'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
const still=async(id,inputProps,file)=>{
 const composition=await selectComposition({serveUrl,id,inputProps,browserInstance:browser});
 await renderStill({serveUrl,composition,inputProps,frame:0,output:`${out}/${file}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('STILL',file);
};
try{
 if(!process.argv.includes('--reel-only')){
  const variants=process.argv.includes('--smoke')?VEHICLES.filter(v=>['coupe','box-truck','sport-bike','formula-modern','saloon','boxy-suv','minivan'].includes(v.id)):VEHICLES;
  for(const v of variants)await still('VehiclePreview',{variant:v.id,angle:.67},`vehicle-${v.id}`);
  if(!process.argv.includes('--smoke')){
   for(const variant of ['saloon','coupe','boxy-suv','sport-bike','formula-modern','box-truck','tractor-truck','single-cab-pickup','camper-van'])await still('VehiclePreview',{variant,angle:2.50},`rear-${variant}`);
   for(const variant of ['saloon','supercar','boxy-suv','box-truck','minivan']){
    await still('InteriorPreview',{variant,mode:'cutaway'},`interior-${variant}`);
    await still('InteriorDriver',{variant,mode:'driver'},`driver-${variant}`);
   }
   for(const variant of ['coupe','tractor-truck'])await still('VehiclePreviewPortrait',{variant,angle:.67},`portrait-${variant}`);
  }
 }
 if(!process.argv.includes('--stills-only')&&!process.argv.includes('--smoke')){
  const selected=await selectComposition({serveUrl,id:'VehicleQualityReel',browserInstance:browser}),composition={...selected,fps:12,durationInFrames:252};let last=-1;
  await renderMedia({serveUrl,composition,outputLocation:`${out}/YUNEX_VEHICLE_QUALITY_PREVIEW.mp4`,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',scale:.5,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},crf:18,onProgress:p=>{const sec=Math.floor(p.renderedFrames/12);if(sec!==last){last=sec;console.log('REEL',sec,'seconds rendered');}}});
 }
 await writeFile(`${out}/review.json`,JSON.stringify({vehicles:VEHICLES.length,reviewFPS:12,sourceFPS:30,sourceDurationFrames:630,reviewDurationFrames:252},null,2));
}finally{await browser.close({});}
