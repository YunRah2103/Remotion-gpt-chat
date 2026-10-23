import {bundle} from '@remotion/bundler';import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';import {mkdir,writeFile} from 'node:fs/promises';
import {PROP_KINDS} from '../../src/yunex/world-kit/props.ts';
import {ENVIRONMENT_CATALOG} from '../../src/yunex/world-kit/world-catalog.ts';
const out='out/world-kit-v2';await mkdir(out,{recursive:true});const serveUrl=await bundle({entryPoint:'src/yunex/world-kit/entry.tsx'});const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
try{
 for(let i=0;i<(process.argv.includes('--reel-only')||process.argv.includes('--props-only')?0:ENVIRONMENT_CATALOG.length);i++){
  const spec=ENVIRONMENT_CATALOG[i],inputProps={variant:i%3===1?'boxy-suv':'coupe',environment:spec.id,timeOfDay:spec.timeOfDay,seed:12,wideView:true};const composition=await selectComposition({serveUrl,id:'EnvironmentPreview',inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,frame:15,output:`${out}/${spec.id}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('WORLD',spec.id);
 }
 for(const environment of (process.argv.includes('--reel-only')||process.argv.includes('--props-only')?[]:['tunnel','garage','showroom'])){
  const inputProps={variant:'tractor-truck',environment,timeOfDay:environment==='tunnel'?'night':'day',seed:12};const composition=await selectComposition({serveUrl,id:'DrivingPreviewPortrait',inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,output:`${out}/${environment}-truck-portrait.png`,scale:.4,browserInstance:browser,chromiumOptions:{gl:'swangle'}});
 }
 for(const kind of (process.argv.includes('--reel-only')?[]:PROP_KINDS)){const inputProps={kind};const composition=await selectComposition({serveUrl,id:'PropPreview',inputProps,browserInstance:browser});await renderStill({serveUrl,composition,inputProps,output:`${out}/prop-${kind}.png`,scale:.5,browserInstance:browser,chromiumOptions:{gl:'swangle'}});console.log('PROP',kind);}
 if(!process.argv.includes('--stills-only')){const composition=await selectComposition({serveUrl,id:'EnvironmentReel',browserInstance:browser});await renderMedia({serveUrl,composition,outputLocation:`${out}/YUNEX_ENVIRONMENT_EXPANSION_V2.mp4`,codec:'h264',scale:.5,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},crf:19,onProgress:p=>{if(p.renderedFrames%30===0)console.log('REEL',p.renderedFrames);}});}
 await writeFile(`${out}/environments.json`,JSON.stringify(ENVIRONMENT_CATALOG,null,2));
}finally{await browser.close({silent:true});}
