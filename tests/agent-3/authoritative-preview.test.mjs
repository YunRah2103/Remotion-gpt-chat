import test from 'node:test';
import assert from 'node:assert/strict';
import {samplePreviewState,CAMERA_PREVIEW_SOURCE_OFFSET_SEC} from '../../production/yunex/tyre_blowout_ep003/cinema/previewState.ts';
import {sampleDynamics} from '../../production/yunex/tyre_blowout_ep003/dynamics/model.ts';
import {OPENING_CUTS,MONTAGE_CUTS} from '../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts';
test('preview is genuinely backed by Agent 2, at the same absolute source time',()=>{
 for(const mode of ['opening','montage']){
  for(const t of [0,.28,.55,.92,1.5,3.28,4.6,6.1,7.45,8.77]){
   if(mode==='opening'&&t>=5)continue;
   const p=samplePreviewState(t,mode);
   const real=sampleDynamics(t+CAMERA_PREVIEW_SOURCE_OFFSET_SEC);
   assert.equal(p.sourceTimeSec,t+CAMERA_PREVIEW_SOURCE_OFFSET_SEC);
   assert.equal(p.dynamics.yawRad,real.yawRad);
   assert.equal(p.dynamics.worldSpeedMps,real.worldSpeedMps);
   assert.equal(p.dynamics.distanceTravelledM,real.distanceTravelledM);
   assert.equal(p.dynamics.wheels['front-right'].spinRad,real.wheels['front-right'].spinRad);
   assert.equal(p.tyre.angularPhaseRad,real.wheels['front-right'].spinRad);
   for(const id of Object.keys(real.wheels)){
    const w=real.wheels[id],frame=p.dynamics.wheels[id];
    assert.equal(frame.hubWorldM[0]-w.hubWorldM[0],p.cameraWorldRebaseXM);
    assert.equal(frame.hubWorldM[1],w.hubWorldM[1]);
    assert.equal(frame.hubWorldM[2],w.hubWorldM[2]);
   }
  }
 }
});
test('failed tyre starts deforming during first preview second, not on title card',()=>{
 const start=samplePreviewState(0,'opening');
 const failing=samplePreviewState(.62,'opening');
 assert.equal(start.tyre.failureProgress,0);
 assert.ok(failing.tyre.failureProgress>.95);
 assert.ok(failing.tyre.effectiveRadiusM<.33);
});
test('every native shot stays within unwrapped 220-m source road',()=>{
 for(const [mode,cuts] of [['opening',OPENING_CUTS],['montage',MONTAGE_CUTS]]){
  for(let frame=0;frame<cuts.at(-1).toSec*30;frame++){
   const p=samplePreviewState(frame/30,mode);
   assert.ok(p.dynamics.positionM[0]>-108&&p.dynamics.positionM[0]<105,
    mode+' road extent violation at frame '+frame+': '+p.dynamics.positionM[0]);
  }
 }
});
test('end region is geometric refuge context, not fabricated lane switch or safe stop',()=>{
 const p=samplePreviewState(8.77,'montage');
 assert.equal(p.cut.shot,'safe-stop');
 assert.ok(p.dynamics.positionM[0]>36&&p.dynamics.positionM[0]<105);
 assert.ok(p.dynamics.worldSpeedMps>1);
 assert.ok(p.dynamics.positionM[2]>-7.05); // stays on travel side until Agent 2 designs real lane transition
});

test('premium opening visibly collapses real front-right tyre within first 0.5s',()=>{
 const intact=samplePreviewState(0,'opening');
 const emerging=samplePreviewState(.28,'opening');
 const collapsed=samplePreviewState(.45,'opening');
 assert.equal(intact.tyre.failureProgress,0);
 assert.ok(emerging.tyre.failureProgress>.5);
 assert.ok(collapsed.tyre.failureProgress>.99);
 assert.ok(collapsed.tyre.effectiveRadiusM<intact.tyre.effectiveRadiusM-.04);
});
test('elevated median-side recovery view exposes the right-hand refuge',async()=>{
 const {sampleCinemaCamera}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const p=samplePreviewState(8.1,'montage');
 const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:p.cut.shot,
  dynamics:p.dynamics,tyre:p.tyre,progress01:p.progress01});
 assert.equal(p.cut.shot,'safe-stop');
 assert.ok(pose.position[2]>p.dynamics.positionM[2]+4.5);
 assert.ok(pose.target[2]<p.dynamics.positionM[2]-2.7);
 assert.ok(pose.position[1]>2.8&&pose.fovDeg>=55);
 assert.ok(p.dynamics.worldSpeedMps>1);
});

test("real driver's camera avoids headrest and seat shell",async()=>{
 const {sampleCinemaCamera,vehicleLocalToWorld}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const p=samplePreviewState(5.6,'montage');
 const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:'driver-cockpit',
  dynamics:p.dynamics,tyre:p.tyre,progress01:.5});
 const eye=vehicleLocalToWorld([0,1.15,-.456],p.dynamics);
 assert.ok(Math.hypot(...pose.position.map((v,i)=>v-eye[i]))<.12);
 assert.ok(pose.position[1]>1.12&&pose.position[1]<1.20);
 assert.ok(pose.fovDeg>=68&&pose.fovDeg<=70);
});
