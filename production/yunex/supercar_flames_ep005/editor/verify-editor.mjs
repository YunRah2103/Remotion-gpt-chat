import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
export const load=()=>{
 const manifest=JSON.parse(readFileSync(resolve(here,'source-approval.json'),'utf8'));
 const recipe=JSON.parse(readFileSync(resolve(here,'../../../../src/yunex/studio-projects/ep005-a5-editor/recipe.json'),'utf8'));
 return {manifest,recipe};
};
const SHA40=/^[a-f0-9]{40}$/i,SHA64=/^[a-f0-9]{64}$/i;
const beats=['flame-hook','moving-reveal','engine-reveal','fuel-path','afterfire-exit','driving-payoff'];
export function inspect({manifest,recipe},requireApproved=false){
 const problems=[];
 if(recipe.id!=='ep005-a5-editor')problems.push('Editor project ID changed');
 if(!Array.isArray(recipe.shots)||recipe.shots.length!==beats.length)problems.push('Editor requires six provisional beats');
 const frames=(recipe.shots??[]).reduce((n,s)=>n+Math.round(s.duration*30),0);
 if(frames!==780)problems.push('Blockout timing must total 780 frames at 30fps');
 (recipe.shots??[]).forEach((s,i)=>{if(s.id!==beats[i])problems.push('Shot order changed at '+i);if(!Number.isFinite(s.duration)||s.duration<=0)problems.push('Invalid duration at '+i);});
 if(recipe.audio?.narration&&!manifest.originalNarration?.supplied)problems.push('Recipe references narration without origin attestation');
 if(recipe.words?.length&&!manifest.originalNarration?.verifiedWordTimings)problems.push('Word timing requires independently verified original audio');
 if(requireApproved){
  for(const id of ['1','2','3','4']){
   const a=manifest.agents?.[id];
   if(!a?.approved||!SHA40.test(a.headSha??'')||!SHA64.test(a.artifactSha256??''))problems.push('Agent '+id+' lacks explicit approval, pinned head and artifact hash');
  }
 }
 return {ok:problems.length===0,status:requireApproved?'APPROVED-SOURCE-GATE':'BLOCKOUT-CONTRACT',frames,fps:30,problems};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=inspect(load(),process.argv.includes('--require-approved'));
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
