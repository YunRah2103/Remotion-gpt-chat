import test from 'node:test';
import assert from 'node:assert/strict';
import {
  poseFromSimulation,padFaceGapM,padCenterZ,MAX_PAD_TRAVEL_M,
  MAX_CUTAWAY_EXPLOSION_M,clamp01,
} from './mechanics.ts';

function simulation(pressure=0.7,rotation=-12.25){
  const wheel={rotationRad:rotation,brakePressure01:pressure};
  return {wheel:{
    'front-left':wheel,'front-right':wheel,
    'rear-left':wheel,'rear-right':wheel,
  }};
}
test('pressure is clamped and never inflates pad travel',()=>{
  for(const pressure of [-7,0,.5,1,12,NaN]){
    const pose=poseFromSimulation(simulation(pressure),'front-left');
    assert.ok(pose.padTravelM>=0 && pose.padTravelM<=MAX_PAD_TRAVEL_M);
    assert.ok(padFaceGapM(pose)>=0);
  }
  assert.equal(poseFromSimulation(simulation(1),'front-left').padTravelM,.0012);
  assert.equal(padFaceGapM(poseFromSimulation(simulation(1),'front-left')),0);
});
test('physics supplies the exact rotor rotation without remapping',()=>{
  assert.equal(poseFromSimulation(simulation(.6,-815.2),'rear-right').wheelRotationRad,-815.2);
});
test('symmetric opposed pads and educational explosion are separate',()=>{
  for(const cutaway of [0,.1,.5,1]){
    const pose=poseFromSimulation(simulation(.8),'front-left',cutaway);
    assert.equal(padCenterZ(pose,1),-padCenterZ(pose,-1));
    assert.ok(Math.abs(padCenterZ(pose,1))<.2);
  }
  const rest=poseFromSimulation(simulation(1),'front-left',0);
  const exposed=poseFromSimulation(simulation(1),'front-left',1);
  assert.equal(exposed.padTravelM,rest.padTravelM);
  assert.ok(Math.abs(padCenterZ(exposed,1)-padCenterZ(rest,1)-MAX_CUTAWAY_EXPLOSION_M)<1e-9);
});
test('non-finite angle rejected and view inputs clamped',()=>{
  assert.throws(()=>poseFromSimulation(simulation(.5,Infinity),'front-left'));
  assert.equal(clamp01(Infinity),0);
  assert.equal(clamp01(-.5),0);
  assert.equal(clamp01(8),1);
});
