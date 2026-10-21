import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
const out='out/modelling-kit-v2';await mkdir(out,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/yunex/modelling-kit/entry.tsx'});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}}),report=[];
try{
 const requested=process.argv.find(v=>v.startsWith('--id='))?.slice(5);
 const ids=requested?[requested]:process.argv.includes('--portrait')?['KitAPortrait','KitBPortrait','KitCPortrait']:['KitA','KitB','KitC'];
 for(const id of ids){
  const composition=await selectComposition({serveUrl,id,browserInstance:browser}),duration=composition.durationInFrames/24;
  for(const second of id.startsWith('KitA')?[.5,3.5,6.5]:id.startsWith('KitB')?[.5,2.4,3.5,5]:[.5,1.8,3.5,5.5]){
   await renderStill({serveUrl,composition,frame:Math.floor(second*24),output:`${out}/${id}-${second}.png`,scale:.5,browserInstance:browser});
  }
  if(!process.argv.includes('--stills')){
   const review={...composition,fps:12,durationInFrames:duration*12},start=Date.now();
   await renderMedia({serveUrl,composition:review,outputLocation:`${out}/${id}.mp4`,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',scale:.5,crf:18,concurrency:2,browserInstance:browser,chromiumOptions:{gl:'swangle'},onProgress:p=>{if(p.renderedFrames%12===0)console.log(id,p.renderedFrames,'/',review.durationInFrames);}});
   const result={id,width:composition.width/2,height:composition.height/2,fps:12,duration,renderSeconds:(Date.now()-start)/1000};report.push(result);await writeFile(`${out}/timing-${id}.json`,JSON.stringify(result,null,2));
  }
 }
 if(process.argv.includes('--compare'))for(const baseline of [false,true]){const composition=await selectComposition({serveUrl,id:'KitA',browserInstance:browser,inputProps:{demo:'A',baseline}});await renderStill({serveUrl,composition,frame:24,output:`${out}/${baseline?'before':'after'}.png`,scale:.5,browserInstance:browser,inputProps:{demo:'A',baseline}});}
 await writeFile(`${out}/render-report${process.argv.includes('--portrait')?'-portrait':''}.json`,JSON.stringify(report,null,2));
}finally{await browser.close({});}
