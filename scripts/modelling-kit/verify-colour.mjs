/** Regression for the first-frame lighting jump: compare a later decoded frame with a fresh still. */
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='out/modelling-kit-v2-hd/diagnostics';await mkdir(out,{recursive:true});
const serveUrl=await bundle({entryPoint:'src/yunex/modelling-kit/entry.tsx'}),browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
try{
 const composition=await selectComposition({serveUrl,id:'KitA',puppeteerInstance:browser});
 await renderStill({serveUrl,composition,frame:17,imageFormat:'png',output:`${out}/reference.png`,puppeteerInstance:browser});
 await renderMedia({serveUrl,composition,frameRange:[15,17],imageFormat:'png',outputLocation:`${out}/moving.mp4`,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',concurrency:1,puppeteerInstance:browser,crf:18});
 const crop='crop=iw*.8:ih*.60:iw*.1:ih*.18,scale=96:54,format=rgb24';
 const raw=(path,video)=>execFileSync('ffmpeg',['-v','error','-i',path,'-vf',(video?'select=eq(n\\,2),':'')+crop,'-frames:v','1','-f','rawvideo','-']);
 const a=raw(`${out}/reference.png`,false),b=raw(`${out}/moving.mp4`,true);assert.equal(a.length,b.length);let error=0;for(let i=0;i<a.length;i++)error+=Math.abs(a[i]-b[i]);error/=a.length;
 const result={meanAbsoluteRGBError:error,threshold:4,referenceFrame:17,decodedSequenceFrame:2,pass:error<4};await writeFile(`${out}/colour-qa.json`,JSON.stringify(result,null,2));console.log(result);assert.ok(result.pass,'First-frame/later-frame lighting mismatch');
}finally{await browser.close({});}
