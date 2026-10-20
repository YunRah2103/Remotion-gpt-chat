import test from 'node:test';
import assert from 'node:assert/strict';
import {lensForHydratedTime,lensForCloseTime,sampleCrashCamera} from '../../production/yunex/tyre_blowout_ep003/impact/Camera.ts';
import {sampleCrashOutcome,PREVIEW_INCIDENT} from '../../production/yunex/tyre_blowout_ep003/impact/model.ts';

const sample=t=>sampleCrashOutcome(t,{incident:PREVIEW_INCIDENT});
test('right rail contact shot is traffic-side, close, and low enough for phone',()=>{
 for(const t of [1.7,1.90,1.95,2.05,2.20]){
  const frame=sample(t),lens=sampleCrashCamera(frame,lensForHydratedTime(t));
  assert.equal(lens.lens,'contact');
  assert.ok(lens.position[2]>frame.scenePositionM[2]+4);
  assert.ok(lens.position[1]<2.7);
  assert.ok(lens.fov<=45);
  const d=Math.hypot(...lens.position.map((v,i)=>v-frame.scenePositionM[i]));
  assert.ok(d<9.0&&d>6.0,'camera should fill vertical screen, no telephoto drone');
  assert.ok(lens.target[0]>frame.scenePositionM[0]&&lens.target[0]<frame.scenePositionM[0]+2.0);
 }
});
test('actual impact and damage remain visible across deterministic perspective cuts',()=>{
 const before=lensForHydratedTime(1.39),at=lensForHydratedTime(1.95),after=lensForHydratedTime(2.5);
 assert.deepEqual([before,at,after],['establish','contact','damage']);
 assert.equal(lensForCloseTime(2.05),'contact');
 assert.equal(lensForCloseTime(2.5),'damage');
 const afterLens=sampleCrashCamera(sample(2.5),after);
 assert.ok(afterLens.position[1]>1.8&&afterLens.position[1]<3);
 assert.ok(afterLens.position[2]<sample(2.5).scenePositionM[2]-2,'rail-side aftermath angle');
 const backward=sampleCrashCamera(sample(1.95),lensForHydratedTime(1.95));
 assert.deepEqual(backward,sampleCrashCamera(sample(1.95),lensForHydratedTime(1.95)));
});
