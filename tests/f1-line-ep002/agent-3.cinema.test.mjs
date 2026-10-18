import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {CINEMA_SHOT_LIST,getRaceCamera,previewShotAt,PREVIEW_A_SHOTS,PREVIEW_B_SHOTS} from '../../src/yunex/f1-line-ep002/cinema/cameras.ts';
import {sampleAgent3Fixture} from '../../src/yunex/f1-line-ep002/agent-3-preview/fixture.ts';
import {magnitude,subtract} from '../../src/yunex/f1-line-ep002/cinema/math.ts';

test('ten deliberately different camera shot types, including eight useful racing perspectives',()=>{
 const ids=CINEMA_SHOT_LIST.map(s=>s.id);
 assert.equal(new Set(ids).size,10);
 for(const id of ['opening','shortcut','wide-entry','apex','onboard','duel','overhead','exit','final','force'])assert.ok(ids.includes(id));
});
test('A and B reels produce four deliberate two-second camera beats each',()=>{
 assert.deepEqual(PREVIEW_A_SHOTS,['opening','shortcut','onboard','exit']);
 assert.deepEqual(PREVIEW_B_SHOTS,['duel','wide-entry','overhead','final']);
 for(const reel of ['A','B']){
  const shots=[0,60,120,180].map(frame=>previewShotAt(frame,30,reel));
  assert.equal(new Set(shots).size,4);
  assert.equal(previewShotAt(239,30,reel),shots[3]);
 }
});
test('fixture keeps car centre separation safely nonzero and wheel travel physical',()=>{
 for(let frame=0;frame<=239;frame+=7){
  const s=sampleAgent3Fixture(frame,30),a=s.cars.shortcut,b=s.cars.racing;
  const clearance=magnitude(subtract(a.worldPose.position,b.worldPose.position));
  assert.ok(clearance>5.8,'two identical cars must not occupy identical space at '+frame+': '+clearance);
  assert.ok(Math.abs(a.travelDistanceM-14.5*frame/30)<1e-8);
  assert.ok(Math.abs(b.travelDistanceM-14.5*frame/30)<1e-8);
  assert.ok(Number.isFinite(a.steerRad)&&Number.isFinite(b.steerRad));
 }
});
test('camera projections stay inside the portrait image for pair-reveal shot centres',()=>{
 // Validate three-dimensional projection (not merely distances in world coordinates).
 for(const shot of ['opening','duel','overhead','final']){
  for(const frame of [0,20,40,80,120,160,200,239]){
   const state=sampleAgent3Fixture(frame,30),pose=getRaceCamera(shot,state,frame);
   const cam=new PerspectiveCamera(pose.fov,540/960,.12,450);
   cam.position.set(...pose.position);cam.lookAt(new Vector3(...pose.target));cam.updateProjectionMatrix();cam.updateMatrixWorld();
   for(const id of ['shortcut','racing']){
    const car=state.cars[id].worldPose.position;
    const projected=new Vector3(car[0],car[1]+.6,car[2]).project(cam);
    assert.ok(projected.z>-1&&projected.z<1,shot+' '+id+' depth @'+frame);
    assert.ok(Math.abs(projected.x)<.98,shot+' '+id+' horizontal crop @'+frame+': '+projected.x);
    assert.ok(Math.abs(projected.y)<.98,shot+' '+id+' vertical crop @'+frame+': '+projected.y);
    // F1 body corners capture actual front wings and tyres, not merely car centres.
    const yaw=state.cars[id].worldPose.yaw;
    for(const f of [-2.72,2.72])for(const lateral of [-1.03,1.03]){
     const c=Math.cos(yaw),s=Math.sin(yaw);
     const corner=new Vector3(car[0]+c*f+s*lateral,car[1]+.6,car[2]-s*f+c*lateral).project(cam);
     assert.ok(Math.abs(corner.x)<.995,shot+' '+id+' wing/wheel horizontal crop @'+frame+': '+corner.x);
    }
   }
  }
 }
});
test('camera is deterministic, moving and safe to seek in arbitrary order',()=>{
 const shots=CINEMA_SHOT_LIST.map(s=>s.id);
 for(const frame of [239,19,109,0,160,44,239]){
  const state=sampleAgent3Fixture(frame,30);
  for(const shot of shots){
   const a=getRaceCamera(shot,state,frame),b=getRaceCamera(shot,state,frame);
   assert.deepEqual(a,b);
   assert.ok(a.position.every(Number.isFinite));
   assert.ok(a.target.every(Number.isFinite));
   assert.ok(magnitude(subtract(a.position,a.target))>1);
  }
 }
 const s0=sampleAgent3Fixture(0,30),s1=sampleAgent3Fixture(30,30);
 assert.ok(magnitude(subtract(s0.cars.racing.worldPose.position,s1.cars.racing.worldPose.position))>8);
 assert.ok(magnitude(subtract(getRaceCamera('exit',s0,0).position,getRaceCamera('exit',s1,30).position))>8);
});
test('all preview evaluators reject invalid time and do not simulate car race victory',()=>{
 assert.throws(()=>previewShotAt(20,0,'A'));
 assert.throws(()=>sampleAgent3Fixture(Number.NaN));
 assert.equal(sampleAgent3Fixture(0).cars.racing.speedMps,sampleAgent3Fixture(0).cars.shortcut.speedMps);
 assert.equal(sampleAgent3Fixture(200).cars.racing.speedMps,sampleAgent3Fixture(200).cars.shortcut.speedMps);
});
