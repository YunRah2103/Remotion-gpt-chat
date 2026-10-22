import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file)=>readFileSync(new URL(file,import.meta.url),'utf8');
const core=read('./hero.ts');
const quality=read('./coachbuilt-overhaul.ts');
const episode=read('./HeroEpisode.tsx');
const recipe=JSON.parse(read('../../../../src/yunex/studio-projects/ep005-a1-hero/recipe.json'));
const mounts=JSON.parse(read('./exhaust-contract.json')).ports;
test('V3 coachbuilt hero is assembled on a fresh original rig',()=>{
 assert.match(core,/createCinematicVehicle\(/);
 assert.match(core,/applyEp005PremiumDetails\(hero\)/);
 assert.match(core,/applyEp005CoachbuiltOverhaul\(hero\)/);
 assert.match(quality,/getObjectByName\('body-shell'\)/);
 assert.match(quality,/getObjectByName\('wheel-roll'\)/);
 assert.match(quality,/getObjectByName\('driver-rig'\)/);
 assert.match(quality,/getObjectByName\('engine'\)/);
 assert.doesNotMatch(quality,/editModel\(|clone\(true\)/);
});
test('wheel details parent to wheel-roll while driver remains articulated',()=>{
 assert.match(quality,/add\(roll,'overhaul-forged-spoke-/);
 assert.match(quality,/add\(roll,'overhaul-ventilated-rotor-/);
 assert.match(quality,/getObjectByName\('driver-rig'\)/);
 assert.match(quality,/o.name==='bucket-seat-shell'/);
});
test('actual exhaust ports and A2 radii unchanged',()=>{
 assert.equal(mounts.length,2);
 for(const p of mounts){
  assert.equal(p.innerRadius,.085);
  assert.equal(p.outerRadius,.105);
  assert.deepEqual(p.direction,[-1,0,0]);
  assert.equal(p.position[0],-2.465);
 }
 assert.match(quality,/NEVER modify, mask or reparent mount:exhaust-tip-left\/right/);
 assert.match(core,/resolveEp005ExhaustPorts/);
});
test('render studies true rolling road motion under night-circuit cinematography',()=>{
 assert.equal(recipe.vehicle.variant,'supercar');
 assert.equal(recipe.vehicle.driver,true);
 assert.equal(recipe.world.kind,'track');
 assert.equal(recipe.world.timeOfDay,'night');
 assert.equal(recipe.shots.length,5);
 assert.equal(recipe.shots.reduce((n,s)=>n+Math.round(s.duration*30),0),300);
 assert.match(episode,/sampleRoute\(/);
 assert.match(episode,/animateCinematicVehicle\(/);
 assert.match(episode,/applyEp005CoachbuiltOverhaul|createEp005Hero/);
});
