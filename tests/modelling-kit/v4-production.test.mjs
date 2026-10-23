import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createV4Production,v4ReviewPlan,V4_DEMONSTRATIONS} from '../../src/yunex/modelling-kit/v4-production.ts';
import {compileRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {createV4Projects} from '../../scripts/modelling-kit/v4-proof.mjs';

test('three independent native portrait demonstrations have purposeful coverage and no invented audio',()=>{
 assert.deepEqual(Object.keys(V4_DEMONSTRATIONS),['supercar','rally','film']);
 for(const kind of Object.keys(V4_DEMONSTRATIONS)){
  const {recipe,storyboard}=createV4Production({kind});
  const compiled=compileRecipe(recipe),plan=v4ReviewPlan(recipe);
  assert.equal(plan.width,1080);assert.equal(plan.height,1920);assert.equal(plan.fps,30);
  assert.equal(recipe.audio,undefined);assert.equal(storyboard.length,recipe.shots.length);
  assert.ok(storyboard.every(s=>s.purpose.length>20));
  assert.equal(plan.motionWindows.length,recipe.shots.length);
  assert.ok(plan.motionWindows.every(s=>s.range[1]-s.range[0]===11));
  assert.ok(plan.previewFrameCount<compiled.durationInFrames/2);
 }
 const a=createV4Production({kind:'supercar'}).recipe;
 for(const camera of ['tracking','chase','overhead','interior','onboard'])assert.ok(a.shots.some(s=>s.camera===camera));
 assert.ok(a.shots.some(s=>s.assembly));
 assert.equal(compileRecipe(a).durationInFrames,420);
 assert.equal(a.presentation,'cinematic');assert.equal(a.vehicle.bodyDetail,'studio');
 const side=a.shots.find(s=>s.id==='side-profile');assert.equal(side.cameraMove.start.position[0],0);
 assert.equal(a.shots.find(s=>s.id==='speed-payoff').speedScale,3);
 const b=createV4Production({kind:'rally'}).recipe;
 assert.equal(b.world.kind,'rally');assert.ok(b.world.roughness>0);assert.ok(b.shots.some(s=>s.camera==='wheel'&&s.action==='cornering'));
 const c=createV4Production({kind:'film'}).recipe;
 assert.ok(compileRecipe(c).durationInFrames>=600&&compileRecipe(c).durationInFrames<=900);
 assert.equal(c.shots[0].context,'inspection');assert.ok(c.shots[0].assembly);assert.match(c.shots.at(-1).caption,/SILENT PROOF/);assert.ok(c.shots.filter(s=>s.caption).length<=3);
});
test('structured edits are isolated and frame budget remains exact',()=>{
 const first=createV4Production({kind:'film',id:'my-film',duration:27,vehicle:{color:'#112233'}});
 assert.equal(compileRecipe(first.recipe).durationInFrames,810);
 first.recipe.shots[0].assembly.nodes[0].id='changed';
 assert.notEqual(createV4Production({kind:'film'}).recipe.shots[0].assembly.nodes[0].id,'changed');
 assert.throws(()=>createV4Production({kind:'film',duration:19}),/20.*30/);
 assert.throws(()=>createV4Production({kind:'rally',world:{kind:'city'}}),/rally/);
 assert.throws(()=>createV4Production({kind:'supercar',duration:NaN}),/duration/);
});
test('source projects use existing entry pipeline and batch refuses any existing target',()=>{
 const root=mkdtempSync(join(tmpdir(),'yunex-v4-'));
 try{
  const created=createV4Projects(root,['supercar']);
  assert.match(readFileSync(join(created[0],'entry.tsx'),'utf8'),/width=\{1080\} height=\{1920\} fps=\{30\}/);
  const before=readFileSync(join(created[0],'recipe.json'),'utf8');
  assert.throws(()=>createV4Projects(root,['rally','supercar']),/overwrite/);
  assert.equal(readFileSync(join(created[0],'recipe.json'),'utf8'),before);
  assert.equal(createV4Projects(root,['rally']).length,1);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('V4 authoring preserves supplied word timing and captions without estimating gaps',()=>{
 const words=[{text:'Air',start:.4,end:.7},{text:'flows',start:1.1,end:1.6}],captions=[{text:'Supplied timing',start:.3,end:2}];const {recipe}=createV4Production({kind:'film',words,captions,audio:{narration:'audio/original.mp3'}});assert.deepEqual(recipe.words,words);assert.deepEqual(recipe.captions,captions);assert.notEqual(recipe.words,words);
});
