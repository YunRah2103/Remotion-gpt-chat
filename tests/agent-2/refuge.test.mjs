import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleDynamics,DYNAMICS_ASSUMPTIONS} from '../../production/yunex/tyre_blowout_ep003/dynamics/model.ts';
import {assessRefugeFrame,auditRefugeTimeline} from '../../production/yunex/tyre_blowout_ep003/dynamics/refuge.ts';

// Snapshot of Agent 4 PR #200 exported REFUGE geometry. During final
// integration pass the real exported REFUGE object, do not duplicate source.
const bay=Object.freeze({
  startX:4,fullWidthX:40,endX:110,mainRoadEdgeZ:-7.05,
  originalRailZ:-7.8,outerRailZ:-14,
  markedStartX:48,markedEndX:101,safeStopCentreZ:-10.5,
  vehicleLengthM:4.94,vehicleWidthM:1.94,reserveM:0.55,
});
test('failed tyre has exactly Agent 1 current 0.300m full-loss loaded radius',()=>{
  const f=sampleDynamics(1.2);
  assert.ok(Math.abs(f.wheels['front-right'].rollingRadiusM-0.300)<1e-10);
  assert.ok(DYNAMICS_ASSUMPTIONS.failedRadiusLossM===0.060);
  for(const id of ['front-left','rear-left','rear-right'])
    assert.equal(f.wheels[id].rollingRadiusM,.36);
});
test('live-lane travel at highway speed does not count as safe refuge arrival',()=>{
  for(const t of [0,1.5,2.5,4,7,10]){
    const state=assessRefugeFrame(sampleDynamics(t),bay);
    assert.equal(state.safelyStoppedInBay,false);
  }
});
test('full footprint can fit a hypothetical parked GT but actual trajectory never produces it',()=>{
  const scene=sampleDynamics(12);
  const stopped={...scene,positionM:[74,0,-10.5],worldSpeedMps:0,yawRad:0};
  const pass=assessRefugeFrame(stopped,bay);
  assert.equal(pass.safelyStoppedInBay,true);
  const live=auditRefugeTimeline(bay);
  assert.equal(live.firstSafeTimeSec,null);
  assert.equal(live.hasDemonstratedStop,false);
  assert.ok(live.firstBayPassTimeSec!==null);
  assert.ok(live.passSpeedMps>20);
});
test('invalid or impossible geometry never silently approves',()=>{
  assert.throws(()=>assessRefugeFrame(sampleDynamics(1),{...bay,fullWidthX:1}));
  assert.throws(()=>assessRefugeFrame(sampleDynamics(1),{...bay,reserveM:-1}));
});
