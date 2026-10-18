import test from 'node:test';
import assert from 'node:assert/strict';
import {BRAKING_EP001,PROVISIONAL_CUES,wheelAnchors} from '../contracts.ts';
import {CAMERA_SHOTS,cameraShotAtFrame,sampleCameraPose,vehicleToWorld} from './cameraRig.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';

const car=vehicleSpec(BRAKING_EP001.vehicleVariant);
const route={position:[5,0,12],yaw:0};
test('all six cinematic cues are covered in order, 750 frames',()=>{
  assert.deepEqual(CAMERA_SHOTS.map(s=>s.id),PROVISIONAL_CUES.map(c=>c.cue));
  for(const cue of PROVISIONAL_CUES){
    assert.equal(cameraShotAtFrame(cue.fromFrame).shot,cue.cue);
    assert.equal(cameraShotAtFrame(cue.toFrameExclusive-1).shot,cue.cue);
  }
  assert.equal(cameraShotAtFrame(-100).shot,'hook');
  assert.equal(cameraShotAtFrame(999).shot,'finale');
  assert.throws(()=>cameraShotAtFrame(NaN),/finite/);
});
test('camera samples remain deterministic, physical and finite on all shots',()=>{
  for(let frame=0;frame<750;frame+=5){
    const p=sampleCameraPose(frame,route,car);
    assert.deepEqual(sampleCameraPose(frame,route,car),p);
    assert.ok(p.fovDeg>=20&&p.fovDeg<=60);
    assert.ok([...p.position,...p.target].every(Number.isFinite));
    const distance=Math.hypot(...p.position.map((v,i)=>v-p.target[i]));
    assert.ok(distance>.2&&distance<40,'camera should frame real subject, not disappear');
  }
});
test('camera is route-locked, including yaw and translation',()=>{
  const base=sampleCameraPose(70,{position:[0,0,0],yaw:0},car);
  const shifted=sampleCameraPose(70,{position:[27,2,-40],yaw:0},car);
  assert.deepEqual(shifted.position.map((v,i)=>v-base.position[i]),[27,2,-40]);
  assert.deepEqual(shifted.target.map((v,i)=>v-base.target[i]),[27,2,-40]);
  const q=vehicleToWorld([1,2,0],{position:[10,0,20],yaw:Math.PI/2});
  assert.ok(Math.abs(q[0]-10)<1e-9);
  assert.ok(Math.abs(q[1]-2)<1e-9);
  assert.ok(Math.abs(q[2]-19)<1e-9);
});
test('mechanism, heat and ABS aim at the actual front-left wheel',()=>{
  const front=wheelAnchors(car).find(w=>w.id==='front-left');
  assert.ok(front);assert.equal(front.center[0],car.wheelbase/2);
  assert.equal(front.center[2],car.width/2-.09);
  for(const f of [180,310,570]){
    const p=sampleCameraPose(f,route,car);
    assert.equal(p.focusId,'front-left');
    assert.ok(Math.abs(p.target[0]-(route.position[0]+front.center[0]))<.3);
    assert.ok(Math.abs(p.target[2]-(route.position[2]+front.center[2]))<.3);
  }
});
test('individual shots move meaningfully, but do not teleport during a shot',()=>{
  for(const cue of PROVISIONAL_CUES){
    const frames=[cue.fromFrame+4,cue.fromFrame+11,cue.fromFrame+18];
    const points=frames.map(f=>sampleCameraPose(f,route,car).position);
    const step=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
    assert.ok(step(points[0],points[2])>.005,'shots must have genuine camera movement');
    assert.ok(step(points[0],points[1])<2,'no intra-shot teleport');
  }
});
