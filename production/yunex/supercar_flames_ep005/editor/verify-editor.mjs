import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
export const load=()=>({
 manifest:JSON.parse(readFileSync(resolve(here,'source-approval.json'),'utf8')),
 map:JSON.parse(readFileSync(resolve(here,'timing-map.json'),'utf8')),
 recipe:JSON.parse(readFileSync(resolve(here,'../../../../src/yunex/studio-projects/ep005-a5-editor/recipe.json'),'utf8'))
});
const SHA40=/^[a-f0-9]{40}$/i,SHA64=/^[a-f0-9]{64}$/i;
const ids=['flame-hook','moving-reveal','engine-reveal','fuel-path','afterfire-exit','driving-payoff'];
const close=(a,b)=>Math.abs(a-b)<1e-6;
export function inspect({manifest,recipe,map},requireApproved=false){
 const problems=[];
 if(recipe.id!=='ep005-a5-editor')problems.push('Editor project ID changed');
 if(recipe.world?.kind!=='track')problems.push('Review baseline must match Agent 3/A4 track');
 if(!Array.isArray(recipe.shots)||recipe.shots.length!==ids.length)problems.push('Must have six semantic beats');
 if(!Array.isArray(map?.beats)||map.beats.length!==ids.length)problems.push('Missing reversible six-beat retime');
 let cursor=0;const b=map?.beats??[];
 (recipe.shots??[]).forEach((s,i)=>{
  const m=b[i],frames=Math.round(s.duration*30);
  if(s.id!==ids[i]||m?.editorBeat!==s.id)problems.push('Beat/order drift '+i);
  if(!Number.isFinite(s.duration)||frames<1)problems.push('Invalid shot duration '+i);
  if(!m||m.to[0]!==cursor||m.to[1]!==cursor+frames)problems.push('Agent 3 boundary drift '+i);
  cursor+=frames;
 });
 if(cursor!==750||map?.target?.frames!==750)problems.push('Silent review target must be exactly 750 frames');
 if(!close(cursor/30,25))problems.push('Review must be 25s');
 if(map?.target?.route!=='track')problems.push('Route mismatch');
 if(JSON.stringify(map?.afterfireDemand)!==JSON.stringify([[0,30],[430,490],[674,710]]))
   problems.push('Afterfire demands shifted from Agent 3 absolute frames');
 if(map?.captionLane?.topPercent!==82||map?.captionLane?.bottomPercent!==94)
   problems.push('Subtitle safe lane changed without review');
 if(recipe.audio?.narration&&!manifest.originalNarration?.supplied)
   problems.push('Recipe references unauthenticated narration');
 if(recipe.words?.length&&!manifest.originalNarration?.verifiedWordTimings)
   problems.push('Word timing requires independently verified original speech');
 if(!recipe.words&&!recipe.audio?.narration&&recipe.captions?.length)
   problems.push('Do not invent fake subtitle lane for unsupplied voice');
 if(requireApproved){
  for(const id of ['1','2','3','4']){
   const a=manifest.agents?.[id];
   if(!a?.approved||!SHA40.test(a.headSha??'')||!SHA64.test(a.artifactSha256??''))
     problems.push('Agent '+id+' missing explicit manager approval, SHA and MP4 hash');
  }
 }
 return {ok:problems.length===0,status:requireApproved?'APPROVED-SOURCE-GATE':'SILENT-EDITOR-BLOCKOUT',
   frames:cursor,fps:30,cutBoundaries:(b??[]).map(s=>s.to[0]).concat([cursor]),problems};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=inspect(load(),process.argv.includes('--require-approved'));
 console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}
