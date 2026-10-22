import {randomUUID} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createProject} from './studio.mjs';
import {V3_PROOFS,PROOF_COMPARISON_FRAMES,baselineProof} from '../../src/yunex/modelling-kit/v3-proofs.ts';
import {inspectRecipe} from './studio-v3.mjs';
import {productionPlan} from '../../src/yunex/modelling-kit/production.ts';
const id=process.argv.find(a=>a.startsWith('--id='))?.slice(5)??'turbo',landscape=process.argv.includes('--landscape');if(!V3_PROOFS[id])throw Error('Unknown proof');
const out=`out/v3/${id}${landscape?'-landscape':''}`;await mkdir(out,{recursive:true});const recipe=V3_PROOFS[id],report=inspectRecipe(recipe);if(Object.values(report).some(r=>r.errors.length))throw Error(JSON.stringify(report));await writeFile(`${out}/model-report.json`,JSON.stringify(report,null,2));await writeFile(`${out}/recipe.json`,JSON.stringify(recipe,null,2));await writeFile(`${out}/plan.json`,JSON.stringify(productionPlan(recipe),null,2));
const project=createProject(process.cwd(),`v3-proof-${id}${landscape?'-landscape':''}-${randomUUID().slice(0,8)}`,'powertrain');await writeFile(`${project}/recipe.json`,JSON.stringify(recipe,null,2));await mkdir(`${out}/editable-project`,{recursive:true});for(const file of ['entry.tsx','recipe.json','README.md'])await writeFile(`${out}/editable-project/${file}`,await readFile(`${project}/${file}`));await writeFile(`${out}/source-contract.json`,JSON.stringify({project,sourceRevision:process.env.GITHUB_SHA??'local',entry:'entry.tsx',instructions:'Restore editable-project contents under src/yunex/studio-projects/<unique-slug> in this source revision; keep relative kit imports.'},null,2));
const serveUrl=await bundle({entryPoint:`${project}/entry.tsx`}),browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
try{const selected=await selectComposition({serveUrl,id:'StudioEpisode',puppeteerInstance:browser}),composition={...selected,width:landscape?1920:1080,height:landscape?1080:1920};
 for(const frame of [15,45,75,105,135,165])await renderStill({serveUrl,composition,output:`${out}/frame-${frame}.png`,frame,scale:.5,puppeteerInstance:browser});
 if(!landscape){const comparisonFrame=PROOF_COMPARISON_FRAMES[id];await writeFile(`${out}/comparison-frame.json`,JSON.stringify({frame:comparisonFrame,fps:30}));const inputProps={recipe:baselineProof(id)};const before=await selectComposition({serveUrl,id:'StudioEpisode',puppeteerInstance:browser,inputProps});await renderStill({serveUrl,inputProps,composition:before,output:`${out}/before.png`,frame:comparisonFrame,scale:.5,puppeteerInstance:browser});await renderStill({serveUrl,composition,output:`${out}/after.png`,frame:comparisonFrame,scale:.5,puppeteerInstance:browser});}
 if(!process.argv.includes('--stills'))await renderMedia({serveUrl,composition,outputLocation:`${out}/proof.mp4`,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,concurrency:2,puppeteerInstance:browser,chromiumOptions:{gl:'swangle'},onProgress:p=>{if(p.renderedFrames%30===0)console.log(id,p.renderedFrames,'/180');}});
}finally{await browser.close({});}
