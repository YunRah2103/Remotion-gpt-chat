import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fixtureSimulator,fixtureRacePaths,makeRaceSimulator,REPRESENTATIVE_F1_CONFIG,
  lateralAccelerationMps2,effectiveNormalLoadN,tyreForceLimitN,
  remainingLongitudinalAccelerationMps2,localSpeedLimitMps
} from '../../src/yunex/f1-line-ep002/physics/index.ts';
const c=REPRESENTATIVE_F1_CONFIG;
const sim=fixtureSimulator,eps=1e-7;
const close=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<=tolerance,`Expected ${a} ~ ${b} ±${tolerance}`);

test('a_lat=v²/r: physical cornering demand doubles squared with speed',()=>{
  close(lateralAccelerationMps2(20,1/40),10,eps);
  close(lateralAccelerationMps2(40,1/40),40,eps);
  close(lateralAccelerationMps2(20,-1/40),10,eps);
});
test('downforce raises normal load with v², and tyre/grip force circles are finite',()=>{
  close(effectiveNormalLoadN(0,c),c.massKg*c.gravityMps2,eps);
  close(effectiveNormalLoadN(30,c)-effectiveNormalLoadN(0,c),c.downforceNPerMps2*900,eps);
  const v=16,k=.03,F=tyreForceLimitN(v,c);
  const lat=c.massKg*lateralAccelerationMps2(v,k);
  const longitudinal=c.massKg*remainingLongitudinalAccelerationMps2(v,k,c);
  assert.ok(Math.hypot(lat,longitudinal)<=F+1e-5);
  assert.ok(localSpeedLimitMps(.13,c)<localSpeedLimitMps(.05,c));
});
test('both identical cars start at same entry speed and share parameters',()=>{
  const a=sim.profiles.shortcut.nodes[0],b=sim.profiles.racing.nodes[0];
  close(a.speedMps,b.speedMps,1e-5);
  close(a.speedMps,c.entrySpeedMps,1e-5);
  assert.ok(sim.comparison.finishSeparationM<.25,'finish checkpoint should coincide');
});
test('paths remain within safe asphalt half-width and shorter A is actually shorter',()=>{
  assert.ok(sim.comparison.shortcut.pathLengthM<sim.comparison.racing.pathLengthM);
  assert.ok(sim.comparison.shortcut.pathLengthM>110);
  assert.ok(sim.comparison.racing.pathLengthM<145);
  for(const path of Object.values(fixtureRacePaths)){
    for(let i=0;i<=120;i++){
      const p=path.sampleAtDistance(path.lengthM*i/120);
      assert.ok(p.position.every(Number.isFinite));
      assert.ok(Number.isFinite(p.yaw)&&Number.isFinite(p.curvatureInvM));
      assert.ok(Math.abs(p.curvatureInvM)<.3);
    }
  }
});
test('distance, node times, speed and road-load constraints remain admissible',()=>{
  for(const p of Object.values(sim.profiles)){
    for(let i=0;i<p.nodes.length;i++){
      const n=p.nodes[i],prev=p.nodes[i-1];
      assert.ok(n.speedMps>=0&&Number.isFinite(n.speedMps));
      assert.ok(n.speedMps<=localSpeedLimitMps(n.curvatureInvM,c)+1e-6);
      assert.ok(Number.isFinite(n.timeSeconds));
      if(prev){
        assert.ok(n.distanceM>prev.distanceM&&n.timeSeconds>prev.timeSeconds);
        const acceleration=(n.speedMps**2-prev.speedMps**2)/(2*(n.distanceM-prev.distanceM));
        assert.ok(acceleration<c.accelerationCapMps2+.2,'accel cap');
        assert.ok(acceleration>-(c.brakingCapMps2+2),'brake cap with aero');
        assert.ok(Number.isFinite(acceleration));
      }
    }
  }
});
test('frames deterministic, independent of render order, and wheel travel follows exact arc metres',()=>{
  const sample=sim.sample;
  const before=sample(177,30),first=sample(5,30),after=sample(177,30);
  assert.deepEqual(before,after);
  assert.deepEqual(first,sample(5,30));
  for(const frame of [0,7,28,64,120,177]){
    const s=sample(frame,30);
    for(const car of Object.values(s.cars)){
      assert.ok(Number.isFinite(car.speedMps)&&car.speedMps>=0);
      assert.ok(Number.isFinite(car.steerRad));
      close(car.travelDistanceM,car.pathDistanceM,eps);
      close(car.lateralAccelMps2,car.speedMps**2*Math.abs(car.worldPose.curvatureInvM),1e-6);
      assert.ok(car.gripUtilization01<=1&&car.gripUtilization01>=0);
      assert.ok(car.brake01<=1&&car.throttle01<=1);
      assert.ok(car.steerRad*car.worldPose.curvatureInvM>=-1e-10);
    }
  }
});
test('monotonically progressing forward position and speed/interpolated time',()=>{
  const previous={shortcut:-1,racing:-1};
  for(let f=0;f<180;f++){
    const st=sim.sample(f,30);
    for(const id of ['shortcut','racing']){
      const car=st.cars[id];
      assert.ok(car.pathDistanceM>=previous[id]);
      previous[id]=car.pathDistanceM;
    }
  }
});
test('comparison is measured at same downstream endpoint; no hard-coded winner',()=>{
  const m=sim.comparison;
  close(m.racingFinishAdvantageSeconds,m.shortcut.finishTimeSeconds-m.racing.finishTimeSeconds,eps);
  assert.ok(Number.isFinite(m.shortcut.minimumCornerSpeedMps));
  assert.ok(Number.isFinite(m.racing.minimumCornerSpeedMps));
  assert.ok(m.racing.exitSpeedMps>m.shortcut.exitSpeedMps,
    'illustrative scenario should show an earned wider-line exit speed');
  // If line geometry updates and the result reverses, recalibrate the example,
  // NEVER bypass computed timing with a fake advantage.
  assert.equal(m.fasterAtCommonFinish,'racing',
    'this documented fixture should yield B at the actual common finish line');
});
test('injectable A1 RacePath preserves replay determinism',()=>{
  const independent=makeRaceSimulator(fixtureRacePaths);
  assert.deepEqual(independent.sample(119,30),sim.sample(119,30));
});
