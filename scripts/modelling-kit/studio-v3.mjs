import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createProject,validateProject} from './studio.mjs';
import {compileBrief,productionPlan} from '../../src/yunex/modelling-kit/production.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../src/yunex/modelling-kit/environments.ts';
import {applyEdits,buildComponents,createAssembly,validateModel,modelCatalogue} from '../../src/yunex/modelling-kit/authoring.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
export function inspectRecipe(recipe){const reports={};for(const scope of ['vehicle','world']){const config=recipe[scope],root=scope==='vehicle'?createCinematicVehicle({...config,optimize:false,quality:'hero'}):createCinematicEnvironment({...config,quality:'hero'});try{if(config.components)buildComponents(root,config.components);if(config.model)applyEdits(root,config.model);reports[scope]={...validateModel(root),catalogue:modelCatalogue(root)};}finally{disposeObject(root);}}for(const shot of recipe.shots)if(shot.assembly){const root=createAssembly(shot.assembly);try{reports[shot.id]=validateModel(root);}finally{disposeObject(root);}}return reports;}
export function createFromBrief(root,file){const brief=JSON.parse(readFileSync(file,'utf8')),recipe=compileBrief(brief);const folder=createProject(root,recipe.id,'powertrain');writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');writeFileSync(resolve(folder,'brief.json'),JSON.stringify(brief,null,2)+'\n');return folder;}
export async function main(args=process.argv.slice(2),root=process.cwd()){
 const [command,name]=args;
 if(command==='brief')return console.log(createFromBrief(root,resolve(root,name)));
 const {folder,compiled}=validateProject(root,name),recipe=JSON.parse(readFileSync(resolve(folder,'recipe.json'),'utf8'));
 const out=resolve(root,'out/studio',name);mkdirSync(out,{recursive:true});
 const priorPath=args.find(a=>a.startsWith('--previous='))?.slice(11),previous=priorPath?JSON.parse(readFileSync(resolve(root,priorPath),'utf8')):undefined;
 const plan=productionPlan(recipe,previous);writeFileSync(resolve(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
 if(command==='plan')return console.log(JSON.stringify(plan,null,2));
 if(command==='inspect'){const report=inspectRecipe(recipe);writeFileSync(resolve(out,'model-report.json'),JSON.stringify(report,null,2)+'\n');console.log(resolve(out,'model-report.json'));if(Object.values(report).some(r=>r.errors.length))process.exitCode=1;return;}
 if(command==='handoff'){const contract={schema:1,id:compiled.id,recipe:relative(root,resolve(folder,'recipe.json')),entry:relative(root,resolve(folder,'entry.tsx')),sha256:createHash('sha256').update(readFileSync(resolve(folder,'recipe.json'))).digest('hex'),fps:30,frames:compiled.durationInFrames,audio:recipe.audio??null,source:'Editable TypeScript factories plus project JSON; GLB exports are baked interchange',plan,verification:'Source contract only. Attach actual MP4 hash/decode/visual review before approval.'};writeFileSync(resolve(out,'handoff.json'),JSON.stringify(contract,null,2)+'\n');return console.log(resolve(out,'handoff.json'));}
 if(!['render','preview'].includes(command))throw Error('Use brief <json> | plan/inspect/handoff/preview/render <slug> [--landscape] [--shot=id] [--moving] [--dry-run]');
 const selected=args.find(a=>a.startsWith('--shot='))?.slice(7),shots=selected?plan.shots.filter(s=>s.id===selected):plan.shots;if(!shots.length)throw Error('Unknown shot');
 const landscape=args.includes('--landscape'),dimensions=landscape?{width:1920,height:1080}:{width:1080,height:1920},moving=args.includes('--moving'),tasks=command==='render'?[{id:selected??'full',range:selected?shots[0].range:[0,plan.frames-1]}]:shots;
 const operations=tasks.map((s,i)=>({id:s.id,range:s.range,file:resolve(out,`${command}-${command==='render'&&!selected?'full':`shot-${plan.shots.findIndex(x=>x.id===s.id)}`}${landscape?'-landscape':''}${command==='render'||moving?'.mp4':'.png'}`)}));
 if(args.includes('--dry-run'))return console.log(JSON.stringify({entry:relative(root,resolve(folder,'entry.tsx')),dimensions,fps:30,operations},null,2));
 const {bundle}=await import('@remotion/bundler'),{openBrowser,selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');const serveUrl=await bundle({entryPoint:resolve(folder,'entry.tsx')}),browser=await openBrowser('chrome',{chromiumOptions:{gl:'swangle'}});
 try{const base=await selectComposition({serveUrl,id:'StudioEpisode',puppeteerInstance:browser}),composition={...base,...dimensions};for(const op of operations){if(command==='render'||moving)await renderMedia({serveUrl,composition,outputLocation:op.file,frameRange:op.range,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',crf:18,imageFormat:'png',concurrency:2,puppeteerInstance:browser,chromiumOptions:{gl:'swangle'}});else await renderStill({serveUrl,composition,output:op.file,frame:Math.floor((op.range[0]+op.range[1])/2),scale:.5,puppeteerInstance:browser});}writeFileSync(resolve(out,'render-manifest.json'),JSON.stringify({plan,dimensions,operations},null,2)+'\n');}finally{await browser.close({});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e);process.exitCode=1;});
