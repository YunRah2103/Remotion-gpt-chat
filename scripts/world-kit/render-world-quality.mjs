import {bundle} from '@remotion/bundler';import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';import {mkdir,writeFile} from 'node:fs/promises';import {ENVIRONMENT_CATALOG} from '../../src/yunex/world-kit/world-catalog.ts';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const out='out/world-kit-scenic';await mkdir(out,{recursive:true});const serveUrl=await bundle({entryPoint:'src/yunex/world-kit/entry.tsx'}),browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
const still=async(id,inputProps,name,frame=15)=>{const composition=await selectComposition({serveUrl,id,inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,frame,output:`${out}/${name}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('STILL',name);};
try{
 if(!process.argv.includes('--reel-only')){
  const specs=process.argv.includes('--smoke')?ENVIRONMENT_CATALOG.filter(e=>['city','track','mountain','forest','coast','garage'].includes(e.id)):ENVIRONMENT_CATALOG.filter(e=>!only||e.id===only);
  for(const e of specs){const p={environment:e.id,seed:12,timeOfDay:e.timeOfDay};await still('EnvironmentPreview',{...p,variant:'coupe',wideView:true},`world-${e.id}`);await still('EnvironmentOverview',p,`overview-${e.id}`,0);}
  if(!process.argv.includes('--smoke')&&!only){
   for(const environment of ['city','highway','service-station','harbour'])await still('EnvironmentPreview',{environment,seed:12,timeOfDay:'night',variant:'saloon',wideView:true},`night-${environment}`);
   for(const environment of ['tunnel','garage','bridge'])await still('DrivingPreviewPortrait',{environment,seed:12,timeOfDay:environment==='tunnel'?'night':'day',variant:'tractor-truck'},`portrait-${environment}`);
  }
 }
 if(!process.argv.includes('--smoke')&&!process.argv.includes('--stills-only')){
  const selected=await selectComposition({serveUrl,id:'EnvironmentReel',browserInstance:browser}),composition={...selected,fps:12,durationInFrames:240};let last=-1;
  await renderMedia({serveUrl,composition,outputLocation:`${out}/YUNEX_20_REBUILT_ENVIRONMENTS.mp4`,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',scale:.5,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},crf:18,onProgress:p=>{const sec=Math.floor(p.renderedFrames/12);if(sec!==last){last=sec;console.log('REEL',sec,'seconds');}}});
 }
 await writeFile(`${out}/review.json`,JSON.stringify({environments:ENVIRONMENT_CATALOG,nativeStills:47,reviewFPS:12,reviewFrames:240,sourceFPS:30,sourceFrames:600},null,2));
}finally{await browser.close({});}
