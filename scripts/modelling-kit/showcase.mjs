import {writeFileSync,readFileSync,cpSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {SHOWCASES} from '../../src/yunex/modelling-kit/showcases.ts';
import {createProject} from './studio.mjs';
import {main} from './studio-v3.mjs';
import {sourceFingerprint} from './assemble.mjs';
const id=process.argv.find(a=>a.startsWith('--demo='))?.slice(7)??'B';
const recipe=SHOWCASES[id];if(!recipe)throw Error('Choose --demo=A through F');
const folder=createProject(process.cwd(),recipe.id,'braking');writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');
await main(['plan',recipe.id]);await main(['inspect',recipe.id]);
if(process.argv.includes('--render')){
 const source=sourceFingerprint(process.cwd(),folder);
 await main(['preview',recipe.id]);await main(['render',recipe.id]);
 if(sourceFingerprint(process.cwd(),folder)!==source)throw Error('Source changed during render; output is unapproved. Render again from a stable checkpoint.');
 await main(['handoff',recipe.id]);
 const out=resolve('out/studio',recipe.id);copyFileSync(resolve(out,'render-full.mp4'),resolve(out,'proof.mp4'));cpSync(folder,resolve(out,'editable-project'),{recursive:true});
 const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 writeFileSync(resolve(out,'source-contract.json'),JSON.stringify({revision,source,recipe:recipe.id,sha256:createHash('sha256').update(readFileSync(resolve(out,'proof.mp4'))).digest('hex')},null,2)+'\n');
 execFileSync('ffmpeg',['-v','error','-y','-i',resolve(out,'proof.mp4'),'-vf','fps=1,scale=216:384,tile=5x5','-frames:v','1',resolve(out,'moving-timeline.jpg')]);
}
