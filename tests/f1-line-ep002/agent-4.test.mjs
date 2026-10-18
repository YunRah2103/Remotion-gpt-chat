import test from 'node:test';
import assert from 'node:assert/strict';
import {closestRouteDistance,lateralNormal,offsetPose,previewCarPositions,RACE_LOOK,normalizedShadowFocus} from '../../src/yunex/f1-line-ep002/lookdev/layout.ts';
test('known circuit dimensions stay unchanged',()=>{
 assert.equal(RACE_LOOK.trackHalfWidthM,6);
 assert.equal(RACE_LOOK.kerbCentreM,6.4);
 assert.ok(RACE_LOOK.boardSetbackM>13.4);
});
test('yaw-aligned lateral offsets use world +Z as left',()=>{
 const n=lateralNormal(0);assert.deepEqual(n,[0,0,1]);
 const a=offsetPose({position:[1,0,4],yaw:0},4.5);
 assert.deepEqual(a.position,[1,0,8.5]);
 const b=offsetPose({position:[0,0,0],yaw:Math.PI/2},2);
 assert.ok(Math.abs(b.position[0]-2)<1e-10);
 assert.ok(Math.abs(b.position[2])<1e-10);
});
test('route search chooses requested turn, not origin',()=>{
 const sample=d=>({position:[d,0,18],yaw:0});
 const d=closestRouteDistance(sample,100,[65,0,18]);
 assert.ok(Math.abs(d-65)<.15);
});
test('preview is seekable, deterministic and safely staggered',()=>{
 for(const t of [0,.5,2.5,4.5,6]){
  const p=previewCarPositions(t,112);
  assert.deepEqual(previewCarPositions(t,112),p);
  assert.equal(p.shortcut.distanceM-p.racing.distanceM,16);
  assert.ok(Math.abs(p.shortcut.offsetM)<=5.2);
  assert.ok(Math.abs(p.racing.offsetM)<=5.2);
  assert.ok(p.shortcut.offsetM+p.racing.offsetM<9);
 }
 assert.equal(previewCarPositions(2.5,0).racing.offsetM,4.95);
});
test('rejects non-finite inputs and returns stable light target',()=>{
 assert.throws(()=>offsetPose({position:[0,0,0],yaw:0},Infinity));
 assert.throws(()=>previewCarPositions(NaN,0));
 assert.throws(()=>closestRouteDistance(()=>({position:[0,0,0],yaw:0}),-1));
 assert.deepEqual(normalizedShadowFocus([65,0,18]),[65,0,18]);
});
