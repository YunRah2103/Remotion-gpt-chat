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
