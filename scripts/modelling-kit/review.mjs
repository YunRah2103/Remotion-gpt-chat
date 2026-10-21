import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
const quick=process.argv.includes('--quick'),scale=quick?.5:1,fps=quick?12:30;
const out=quick?'out/modelling-kit-v2':'out/modelling-kit-v2-hd';await mkdir(out,{recursive:true});
console.log('Bundling kit review');
const serveUrl=await bundle({entryPoint:'src/yunex/modelling-kit/entry.tsx'});
console.log('Opening software WebGL browser');
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}}),report=[];
try{
 const requested=process.argv.find(v=>v.startsWith('--id='))?.slice(5);
 const ids=process.argv.includes('--compare-only')?[]:requested?[requested]:process.argv.includes('--portrait')?['KitAPortrait','KitBPortrait','KitCPortrait','KitDPortrait','KitEPortrait']:['KitA','KitB','KitC','KitD','KitE'];
 for(const id of ids){
  console.log('Reviewing',id);
  const composition=await selectComposition({serveUrl,id,puppeteerInstance:browser}),duration=composition.durationInFrames/composition.fps;
  if(!process.argv.includes('--video-only'))for(const second of id==='KitBefore'?[.5,1.5]:id.startsWith('KitA')?[.5,3.5,6.5]:id.startsWith('KitB')?[.5,2.4,3.5,5]:[.5,1.8,3.5,5.5]){
   await renderStill({serveUrl,composition,frame:Math.min(composition.durationInFrames-1,Math.floor(second*composition.fps)),output:`${out}/${id}-${second}.png`,scale,puppeteerInstance:browser});
  }
  if(!process.argv.includes('--stills')){
   const review={...composition,fps,durationInFrames:duration*fps},start=Date.now();
   await renderMedia({serveUrl,composition:review,outputLocation:`${out}/${id}.mp4`,imageFormat:'png',codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',scale,crf:18,concurrency:2,puppeteerInstance:browser,chromiumOptions:{gl:'swangle'},onProgress:p=>{if(p.renderedFrames%fps===0)console.log(id,p.renderedFrames,'/',review.durationInFrames);}});
   const result={id,width:composition.width*scale,height:composition.height*scale,fps,duration,renderSeconds:(Date.now()-start)/1000};report.push(result);await writeFile(`${out}/timing-${id}.json`,JSON.stringify(result,null,2));
  }
 }
 if(process.argv.includes('--compare'))for(const baseline of [false,true]){const composition=await selectComposition({serveUrl,id:'KitA',puppeteerInstance:browser,inputProps:{demo:'A',baseline}});for(const [frame,suffix] of [[30,''],[120,'-supercar'],[210,'-formula-modern']])await renderStill({serveUrl,composition,frame,output:`${out}/${baseline?'before':'after'}${suffix}.png`,scale,puppeteerInstance:browser,inputProps:{demo:'A',baseline}});}
 await writeFile(`${out}/render-report${process.argv.includes('--portrait')?'-portrait':''}.json`,JSON.stringify(report,null,2));
}finally{await browser.close({});}
