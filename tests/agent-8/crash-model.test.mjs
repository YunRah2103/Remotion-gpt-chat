import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleCrashOutcome,PREVIEW_INCIDENT,impactRailZ,
 crashIncidentFromDynamics} from '../../production/yunex/tyre_blowout_ep003/impact/model.ts';
const frame=t=>sampleCrashOutcome(t,{incident:PREVIEW_INCIDENT});
test('random access is identical forward and reversed',()=>{
 const a=[0,.3,1.2,1.8,2.4,4].map(frame);
 assert.deepEqual(a,[4,2.4,1.8,1.2,.3,0].map(frame).reverse());
});
test('panic control provokes real rail contact with bounded deformation',()=>{
 assert.equal(frame(.2).contact.occurred,false);
 assert.ok(frame(1.0).driverBrake01>.7);
 assert.ok(frame(1.0).driverSteerRad>.03);
 const f=frame(3);
 assert.equal(f.contact.occurred,true);
 assert.ok(f.contact.firstContactSec>1.2&&f.contact.firstContactSec<3);
 assert.ok(f.contact.impactSpeedMps>5);
 assert.ok(f.bumperCrushM>0&&frame(.2).bumperCrushM===0);
});
test('rigid barrier is not penetrated, car progresses, body Euler axes remain finite',()=>{
 let lastX=-Infinity,lastD=-Infinity,moving=0;
 for(let i=0;i<=135;i++){
  const f=frame(i/30);
  assert.ok(f.contact.clearanceM>=.015,'rail penetration at frame '+i);
  assert.ok(f.scenePositionM[0]>=lastX-1e-7);
  assert.ok(f.distanceTravelledM>=lastD-1e-7);
  if(f.scenePositionM[0]>lastX+1e-6&&i>0)moving++;
  lastX=f.scenePositionM[0];lastD=f.distanceTravelledM;
  assert.equal(f.contact.barrierZ,impactRailZ(f.scenePositionM[0]));
  for(const v of [f.headingRad,f.pitchRad,f.rollRad,f.speedMps])assert.ok(Number.isFinite(v));
  assert.ok(f.bumperCrushM<=.24001&&f.fenderCrushM<=.15001&&f.lampCrushM<=.11001);
 }
 assert.ok(moving>90);
 assert.ok(Math.abs(frame(1.5).rollRad)>0);
 assert.ok(Math.abs(frame(1.5).pitchRad)>0);
 assert.ok(Math.abs(frame(1.5).headingRad)>0);
});
test('missing panic manoeuvre does not create early barrier crash',()=>{
 const natural=t=>sampleCrashOutcome(t,{reaction:'no-panic-control'});
 assert.equal(natural(3).contact.occurred,false);
 assert.ok(natural(2.5).scenePositionM[2]>frame(2.5).scenePositionM[2]);
});
test('editor can supply original Agent 2 incident with independent absolute time',()=>{
 assert.throws(()=>frame(-.01));
 assert.throws(()=>frame(5));
 const fake={tSec:1.2,positionM:[22,0,-2.3],yawRad:.02,
  worldSpeedMps:26,pitchRad:.004,rollRad:-.007,
  wheels:{'front-right':{spinRad:-30}}};
 const actual=crashIncidentFromDynamics(fake);
 assert.equal(actual.sourceTimeSec,1.2);
 assert.deepEqual(actual.positionM,[22,0,-2.3]);
 assert.equal(actual.wheelSpinRad,-30);
 assert.ok(Math.abs(sampleCrashOutcome(0,{incident:actual}).scenePositionM[2]+2.3)<.01);
});
