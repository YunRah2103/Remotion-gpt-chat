import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {VEHICLES,ENVIRONMENTS} from '../../src/yunex/world-kit/catalog.ts';
import {PARTS} from '../../src/yunex/parts-kit/catalog.ts';
import {STUDIO_RECIPES} from '../../src/yunex/modelling-kit/studio-recipes.ts';
import {compileRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
export function createProject(root,name,template='braking'){
 if(typeof name!=='string'||!/^[a-z][a-z0-9-]{1,60}$/.test(name)||/ep00[34]/i.test(name))throw Error('Use a new lowercase slug; EP003/EP004 are protected');
 if(!STUDIO_RECIPES[template])throw Error(`Templates: ${Object.keys(STUDIO_RECIPES).join(', ')}`);
 const folder=resolve(root,'src/yunex/studio-projects',name);if(existsSync(folder))throw Error('Project already exists; refusing to overwrite');
 const recipe=structuredClone(STUDIO_RECIPES[template]);recipe.id=name;compileRecipe(recipe);
 mkdirSync(dirname(folder),{recursive:true});mkdirSync(folder);writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');
 writeFileSync(resolve(folder,'entry.tsx'),`import React from 'react';\nimport {Composition,registerRoot} from 'remotion';\nimport input from './recipe.json';\nimport {StudioEpisode} from '../../modelling-kit/StudioEpisode';\nimport {compileRecipe} from '../../modelling-kit/recipe';\nimport type {EpisodeRecipe} from '../../modelling-kit/recipe';\nconst recipe=input as EpisodeRecipe;\nconst compiled=compileRecipe(recipe);\nconst Root=()=> <Composition id="StudioEpisode" component={StudioEpisode} width={1080} height={1920} fps={30} durationInFrames={compiled.durationInFrames} defaultProps={{recipe}}/>;\nregisterRoot(Root);\n`);
 writeFileSync(resolve(folder,'README.md'),`# ${name}\n\nEdit recipe.json. Keep durations in seconds and use kit:catalog for valid assets.\n\nRun from repository root:\n\n\`npm run kit:validate -- ${name}\`\n\n\`npm run kit:preview -- ${name}\`\n\n\`npm run kit:render -- ${name}\`\n\nNarration/music are optional public-relative audio paths; supply original audio yourself. Review every cut and caption before handoff.\n`);
 return folder;
}
export function validateProject(root,name){
 if(typeof name!=='string'||!/^[a-z][a-z0-9-]{1,60}$/.test(name))throw Error('Invalid project slug');
 const folder=resolve(root,'src/yunex/studio-projects',name),recipe=JSON.parse(readFileSync(resolve(folder,'recipe.json'),'utf8')),compiled=compileRecipe(recipe);
 for(const asset of [recipe.audio?.narration,recipe.audio?.music])if(asset&&!existsSync(resolve(root,'public',asset)))throw Error(`Missing public audio: ${asset}`);
 return {folder,compiled};
}
export function renderArguments(root,name){const {folder,compiled}=validateProject(root,name);return ['remotion','render',relative(root,resolve(folder,'entry.tsx')),'StudioEpisode',`out/studio/${name}.mp4`,'--gl=swangle','--codec=h264','--pixel-format=yuv420p','--concurrency=2'];}
/** Preview one midpoint per compiled shot; numeric names keep arbitrary shot ids out of paths. */
export function previewArguments(root,name){
 const {folder,compiled}=validateProject(root,name);
 return compiled.shots.map((shot,index)=>{const frame=shot.startFrame+Math.floor((shot.endFrame-shot.startFrame)/2);return {shot:shot.id,frame,args:['remotion','still',relative(root,resolve(folder,'entry.tsx')),'StudioEpisode',`out/studio/${name}/previews/${String(index+1).padStart(2,'0')}.png`,`--frame=${frame}`,'--scale=.5','--gl=swangle']};});
}
export function main(args=process.argv.slice(2),root=process.cwd()){
 const [command,name,template]=args;
 if(command==='catalog')return console.log(JSON.stringify({vehicles:VEHICLES.map(v=>({...v,driverSupported:v.family!=='bike'})),environments:ENVIRONMENTS,parts:PARTS,templates:Object.keys(STUDIO_RECIPES)},null,2));
 if(command==='create')return console.log(createProject(root,name,template));
 if(command==='validate'){const {compiled}=validateProject(root,name);return console.log(JSON.stringify({id:compiled.id,fps:30,width:1080,height:1920,frames:compiled.durationInFrames,shots:compiled.shots.map(s=>({id:s.id,start:s.startFrame,end:s.endFrame,part:s.part,camera:s.camera}))},null,2));}
 if(command==='preview'){const plan=previewArguments(root,name);if(args.includes('--dry-run'))return console.log(JSON.stringify(plan,null,2));const output=resolve(root,'out/studio',name,'previews');mkdirSync(output,{recursive:true});for(const shot of plan){const result=spawnSync('npx',shot.args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0){process.exitCode=result.status??1;return;}}writeFileSync(resolve(output,'shots.json'),JSON.stringify(plan.map(({shot,frame,args})=>({shot,frame,file:args[4]})),null,2)+'\n');return console.log(output);}
 if(command==='render'){const argv=renderArguments(root,name);if(args.includes('--dry-run'))return console.log(JSON.stringify({command:'npx',args:argv}));const result=spawnSync('npx',argv,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1;return;}
 throw Error('Usage: studio.mjs catalog | create <slug> [braking|powertrain|f1-downforce|rain-drive] | validate <slug> | preview <slug> [--dry-run] | render <slug> [--dry-run]');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
