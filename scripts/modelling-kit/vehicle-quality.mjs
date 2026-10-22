/** Uses existing project creation, inspect, preview, scene and handoff commands. */
import {mkdirSync,writeFileSync,readFileSync,copyFileSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createProject} from './studio.mjs';
import {main} from './studio-v3.mjs';
import {sourceFingerprint} from './assemble.mjs';
import {vehicleQualityRecipe} from '../../src/yunex/modelling-kit/vehicle-quality.ts';
const variant=process.argv.find(a=>a.startsWith('--vehicle='))?.slice(10)??'rally-hatch';
const style=process.argv.find(a=>a.startsWith('--style='))?.slice(8)??'coachbuilt';if(!['legacy','coachbuilt'].includes(style))throw Error('Unknown body style');
const recipe=vehicleQualityRecipe(variant,style,process.argv.includes('--cabin')),name=recipe.id,folder=createProject(process.cwd(),name,'braking');writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');
await main(['inspect',name]);await main(['preview',name]);await main(['preview',name,'--landscape',`--shot=${recipe.shots[0].id}`]);await main(['render',name]);await main(['handoff',name]);
const out=resolve('out/studio',name),plan=JSON.parse(readFileSync(resolve(out,'plan.json'),'utf8'));copyFileSync(resolve(out,'render-full.mp4'),resolve(out,'proof.mp4'));
for(let i=0;i<plan.shots.length;i++)copyFileSync(resolve(out,`preview-shot-${i}.png`),resolve(out,`frame-${plan.shots[i].previewFrames[1]}.png`));
cpSync(folder,resolve(out,'editable-project'),{recursive:true});
writeFileSync(resolve(out,'source-contract.json'),JSON.stringify({revision:process.env.GITHUB_SHA??'local',source:sourceFingerprint(process.cwd(),folder),recipe:recipe.id,sha256:createHash('sha256').update(readFileSync(resolve(out,'proof.mp4'))).digest('hex')},null,2)+'\n');
execFileSync('ffmpeg',['-v','error','-y','-i',resolve(out,'proof.mp4'),'-vf','fps=2,scale=270:480,tile=4x3','-frames:v','1',resolve(out,'moving-timeline.jpg')]);
console.log(out);
