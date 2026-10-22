/** Assemble verified silent native shot files. Never reuse stale source/recipe artifacts. */
import {readFileSync,writeFileSync,existsSync,mkdirSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateProject} from './studio.mjs';
import {compileRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {productionPlan} from '../../src/yunex/modelling-kit/production.ts';
const digest=data=>createHash('sha256').update(data).digest('hex');
export function sourceFingerprint(root,projectFolder){
 const hash=createHash('sha256');const folders=['src','src/yunex/modelling-kit','src/yunex/world-kit','src/yunex/parts-kit','scripts','production','public'];
 for(const dir of folders){const base=resolve(root,dir);if(!existsSync(base))continue;for(const entry of readdirSync(base,{recursive:true}).sort()){
 const path=resolve(base,entry);if(path.includes('/src/yunex/studio-projects/'))continue;
 if(statSync(path).isFile()&&(dir==='public'||dir==='src'||/\.(ts|tsx|js|mjs|json|glb|gltf|bin|png|jpg|jpeg|webp|mp4|mp3|wav|m4a|ogg|wasm)$/.test(path)))hash.update(dir+'/'+entry).update(readFileSync(path));
 }}
 if(projectFolder)for(const entry of readdirSync(projectFolder,{recursive:true}).sort()){const path=resolve(projectFolder,entry);if(statSync(path).isFile()&&!['recipe.json','README.md','brief.json'].includes(entry))hash.update('project/'+entry).update(readFileSync(path));}
 for(const file of ['package.json','package-lock.json','tsconfig.json'])if(existsSync(resolve(root,file)))hash.update(file).update(readFileSync(resolve(root,file)));
 return hash.digest('hex');
}
/** Full render inputs include recipe bytes; shared source identity deliberately does not. */
export function renderInputFingerprint(root,projectFolder){return digest(sourceFingerprint(root,projectFolder)+'\n'+readFileSync(resolve(projectFolder,'recipe.json'),'utf8'));}
export function shotContract(root,recipe,shotIndex,file,dimensions,entry=resolve(root,'src/yunex/studio-projects',recipe.id,'entry.tsx')){const plan=productionPlan(recipe),shot=plan.shots[shotIndex],{shots,...global}=compileRecipe(recipe);return {schema:2,source:sourceFingerprint(root,dirname(entry)),renderHash:digest(JSON.stringify({global,shot:shots[shotIndex]})),entry:digest(readFileSync(entry)),shot:shot.id,shotHash:shot.hash,range:shot.range,dimensions,fps:30,sha256:digest(readFileSync(file)),file:relative(root,file)};}
export function verifyShot(root,recipe,index,file,dimensions,entry){
 const expected=shotContract(root,recipe,index,file,dimensions,entry),actual=JSON.parse(readFileSync(file+'.json','utf8'));
 for(const key of ['source','entry','shot','renderHash','sha256'])if(actual[key]!==expected[key])throw Error(`Stale or altered shot ${index}: ${key}`);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',file])),video=meta.streams.find(s=>s.codec_type==='video');
 if(meta.streams.some(s=>s.codec_type==='audio'))throw Error('Shot assembly currently requires silent clips; export supplied audio in a complete render');
 const count=expected.range[1]-expected.range[0]+1;
 if(!video||video.width!==dimensions.width||video.height!==dimensions.height||video.r_frame_rate!=='30/1'||Number(video.nb_frames)!==count)throw Error(`Native shot format/frame mismatch: ${index}`);
 execFileSync('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-'],{stdio:'pipe'});return expected;
}
export function assemble(root,name,inputDir){
 const {folder,compiled}=validateProject(root,name),recipe=JSON.parse(readFileSync(resolve(folder,'recipe.json'),'utf8'));
 if(recipe.audio?.narration||recipe.audio?.music)throw Error('Use full render for original audio; assembly is explicitly silent');
 const dir=resolve(root,inputDir??`out/studio/${name}`),dimensions={width:1080,height:1920};
 const files=compiled.shots.map((_,i)=>resolve(dir,`render-shot-${i}.mp4`));const proofs=files.map((file,i)=>verifyShot(root,recipe,i,file,dimensions,resolve(folder,'entry.tsx')));
 mkdirSync(dir,{recursive:true});const list=resolve(dir,'concat.txt');writeFileSync(list,files.map(file=>`file '${file.replaceAll("'","'\\''")}'`).join('\n')+'\n');
 const output=resolve(dir,'complete-silent.mp4');execFileSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);
 execFileSync('ffmpeg',['-v','error','-xerror','-i',output,'-f','null','-'],{stdio:'pipe'});
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output]));
 const v=meta.streams.find(s=>s.codec_type==='video');if(Number(v.nb_frames)!==compiled.durationInFrames||Math.abs(Number(meta.format.duration)-compiled.durationInFrames/30)>.05)throw Error('Assembled duration/frame mismatch');
 const report={file:relative(root,output),sha256:digest(readFileSync(output)),dimensions,fps:30,frames:Number(v.nb_frames),duration:Number(meta.format.duration),audio:'silent',fullDecode:'pass',source:sourceFingerprint(root,folder),shots:proofs,visualReview:'pending actual moving-frame inspection'};
 writeFileSync(resolve(dir,'complete-report.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(assemble(process.cwd(),process.argv[2],process.argv[3]),null,2));
