/** Native V4 proofs reuse the existing source guards, shot contracts and silent assembler. */
import {resolve} from 'node:path';
import {readFileSync,writeFileSync,cpSync,copyFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createV4Production} from '../../src/yunex/modelling-kit/v4-production.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {auditVehicleGeometry} from '../../src/yunex/modelling-kit/visual-quality.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
import {prepareProofProject} from './proof-project.mjs';
import {main} from './studio-v3.mjs';
import {assemble,sourceFingerprint,renderInputFingerprint} from './assemble.mjs';
const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const kind=arg('kind')??'supercar',shot=arg('shot'),{recipe,storyboard}=createV4Production({kind});
const root=process.cwd(),folder=prepareProofProject(root,recipe),out=resolve('out/studio',recipe.id);mkdirSync(out,{recursive:true});
const vehicle=createCinematicVehicle({...recipe.vehicle,quality:'hero',optimize:false});
try{writeFileSync(resolve(out,'geometry-report.json'),JSON.stringify(auditVehicleGeometry(vehicle),null,2)+'\n');}finally{disposeObject(vehicle);}
await main(['plan',recipe.id]);
writeFileSync(resolve(out,'storyboard.json'),JSON.stringify(storyboard,null,2)+'\n');
if(process.argv.includes('--inspect'))await main(['inspect',recipe.id]);
if(process.argv.includes('--render'))await main(['render',recipe.id,...(shot?[`--shot=${shot}`]:[])]);
if(process.argv.includes('--assemble')||process.argv.includes('--render')&&!shot){
 const before=renderInputFingerprint(root,folder);if(process.argv.includes('--assemble'))assemble(root,recipe.id);
 const source=sourceFingerprint(root,folder),video=resolve(out,process.argv.includes('--assemble')?'complete-silent.mp4':'render-full.mp4');
 await main(['handoff',recipe.id]);copyFileSync(video,resolve(out,'proof.mp4'));cpSync(folder,resolve(out,'editable-project'),{recursive:true});
 if(renderInputFingerprint(root,folder)!==before)throw Error('Source/recipe changed while packaging; reject this proof.');
 const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();writeFileSync(resolve(out,'source-contract.json'),JSON.stringify({revision,source,recipe:recipe.id,sha256:createHash('sha256').update(readFileSync(resolve(out,'proof.mp4'))).digest('hex')},null,2)+'\n');
 execFileSync('python',['scripts/modelling-kit/showcase-verify.py',out],{stdio:'inherit'});
}
