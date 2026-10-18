import test from 'node:test';
import assert from 'node:assert/strict';
import {
  raceSimulator,AUTHORITATIVE_RACE_PATHS,sampleRaceFrame,makeRaceSimulator,
  REPRESENTATIVE_F1_CONFIG,lateralAccelerationMps2,effectiveNormalLoadN,
  tyreForceLimitN,remainingLongitudinalAccelerationMps2,localSpeedLimitMps
} from '../../src/yunex/f1-line-ep002/physics/index.ts';
import {makeRacingLinePath} from '../../src/yunex/f1-line-ep002/track/racingPaths.ts';
const sim=raceSimulator,c=sim.config,paths=AUTHORITATIVE_RACE_PATHS;
const near=(a,b,epsilon=1e-6)=>assert.ok(Math.abs(a-b)<=epsilon,`expected ${a} ≈ ${b}, tol=${epsilon}`);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
test('uses exact, current Agent 1 authored path objects and IDs',()=>{
  assert.equal(paths.shortcut,makeRacingLinePath('shortcut'));
  assert.equal(paths.racing,makeRacingLinePath('racing'));
  assert.equal(sim.profiles.shortcut.path,paths.shortcut);
  assert.equal(sim.profiles.racing.path,paths.racing);
});
test('identical physical entry and common finish; aligned yaw and curvature',()=>{
  const a=paths.shortcut,b=paths.racing;
  for(const d of [0,1]){
    const sa=a.sampleAtDistance(a.lengthM*d),sb=b.sampleAtDistance(b.lengthM*d);
    near(distance(sa.position,sb.position),0,1e-6);
    near(Math.atan2(Math.sin(sa.yaw-sb.yaw),Math.cos(sa.yaw-sb.yaw)),0,1e-5);
    near(sa.curvatureInvM,sb.curvatureInvM,1e-5);
  }
  near(sim.comparison.finishSeparationM,0,1e-6);
});
test('same configuration AND same feasible initial speed',()=>{
  const vA=sim.profiles.shortcut.nodes[0].speedMps,vB=sim.profiles.racing.nodes[0].speedMps;
  near(vA,vB,1e-4);
  near(vA,c.entrySpeedMps,1e-4);
  assert.ok(vA>0 && vA<=REPRESENTATIVE_F1_CONFIG.entrySpeedMps+1e-5);
});
test('centripetal force v squared / r, and pressure rises with quadratic downforce',()=>{
  near(lateralAccelerationMps2(20,1/40),10);
  near(lateralAccelerationMps2(40,-1/40),40);
  near(effectiveNormalLoadN(30,c)-effectiveNormalLoadN(0,c),c.downforceNPerMps2*900);
  const v=16,k=.025;
  const used=c.massKg*lateralAccelerationMps2(v,k);
  const remaining=c.massKg*remainingLongitudinalAccelerationMps2(v,k,c);
  assert.ok(Math.hypot(used,remaining)<=tyreForceLimitN(v,c)+1e-5);
  assert.ok(localSpeedLimitMps(.09,c)<localSpeedLimitMps(.04,c));
});
test('signed path curvature matches finite difference dyaw/ds',()=>{
  for(const path of Object.values(paths)){
    for(let i=3;i<=97;i++){
      const d=path.lengthM*i/100,h=.22;
      const a=path.sampleAtDistance(d-h),b=path.sampleAtDistance(d+h);
      const measured=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))/(2*h);
      const center=path.sampleAtDistance(d);
      assert.ok(Number.isFinite(center.curvatureInvM));
      near(center.curvatureInvM,measured,.015);
      assert.ok(Math.abs(center.curvatureInvM)<.22,'unexpectedly tight / kinked trajectory');
    }
  }
});
test('curvature/grip bound, monotonic s and time, braking + acceleration caps',()=>{
  for(const p of Object.values(sim.profiles)){
    for(let i=0;i<p.nodes.length;i++){
      const node=p.nodes[i],prev=p.nodes[i-1];
      assert.ok(Number.isFinite(node.speedMps)&&node.speedMps>=0);
      assert.ok(node.speedMps<=localSpeedLimitMps(node.curvatureInvM,c)+1e-5);
      assert.ok(Number.isFinite(node.timeSeconds));
      if(prev){
        const ds=node.distanceM-prev.distanceM;
        assert.ok(ds>0&&node.timeSeconds>prev.timeSeconds);
        const acceleration=(node.speedMps**2-prev.speedMps**2)/(2*ds);
        assert.ok(acceleration<=c.accelerationCapMps2+1e-3,'unphysical drive cap');
        assert.ok(acceleration>=-c.brakingCapMps2-2,'unphysical braking cap');
      }
    }
  }
});
test('frame independence, backwards seeking, SI values and wheel travel',()=>{
  const one=sampleRaceFrame(112,30),two=sampleRaceFrame(11,30),again=sampleRaceFrame(112,30);
  assert.deepEqual(one,again);
  assert.deepEqual(two,sim.sample(11,30));
  for(const frame of [0,13,26,56,112,180,230,300]){
    const st=sampleRaceFrame(frame,30);
    for(const state of Object.values(st.cars)){
      near(state.travelDistanceM,state.pathDistanceM,1e-9);
      near(state.lateralAccelMps2,
        state.speedMps**2*Math.abs(state.worldPose.curvatureInvM),1e-6);
      assert.ok(Number.isFinite(state.speedMps)&&Number.isFinite(state.steerRad));
      assert.ok(state.speedMps>=0);
      assert.ok(state.gripUtilization01>=0 && state.gripUtilization01<=1);
      assert.ok(state.brake01>=0 && state.brake01<=1);
      assert.ok(state.throttle01>=0 && state.throttle01<=1);
      assert.ok(state.steerRad*state.worldPose.curvatureInvM>=-1e-8);
    }
  }
});
test('cars progress monotonically and stop at correct world-space finish',()=>{
  const previous={shortcut:-1,racing:-1};
  for(let f=0;f<=360;f++){
    const frame=sampleRaceFrame(f,30);
    for(const id of ['shortcut','racing']){
      const car=frame.cars[id];
      assert.ok(car.pathDistanceM>=previous[id]-1e-8);
      previous[id]=car.pathDistanceM;
      assert.ok(car.pathDistanceM<=paths[id].lengthM+1e-8);
    }
  }
  const finished=sampleRaceFrame(1200,30);
  for(const id of ['shortcut','racing'])
    near(finished.cars[id].pathDistanceM,paths[id].lengthM,1e-6);
});
test('signed measured race outcome is derived strictly from actual elapsed times',()=>{
  const m=sim.comparison;
  near(m.racingFinishAdvantageSeconds,m.shortcut.finishTimeSeconds-m.racing.finishTimeSeconds);
  const correct=m.racingFinishAdvantageSeconds>1e-6?'racing':
    m.racingFinishAdvantageSeconds< -1e-6?'shortcut':'tie';
  assert.equal(m.fasterAtCommonFinish,correct);
  for(const id of ['shortcut','racing']){
    const metric=m[id],profile=sim.profiles[id];
    near(metric.pathLengthM,paths[id].lengthM);
    near(metric.finishTimeSeconds,profile.elapsedSeconds);
    assert.ok(Number.isFinite(metric.minimumCornerSpeedMps));
    assert.ok(Number.isFinite(metric.exitSpeedMps));
    assert.ok(metric.apexTimeSeconds<=metric.finishTimeSeconds);
  }
});
test('cannot fabricate a finish result by supplying unequal physical checkpoints',()=>{
  const original=paths.racing;
  const shifted={...original,sampleAtDistance:(s)=>{
    const pose=original.sampleAtDistance(s);
    return {...pose,position:[pose.position[0]+1,pose.position[1],pose.position[2]]};
  }};
  assert.throws(()=>makeRaceSimulator({shortcut:paths.shortcut,racing:shifted}),/checkpoints/);
});
test('identical trajectories produce a tie, not a forced wide-line win',()=>{
  const a=paths.shortcut;
  const b={...a,id:'racing'};
  const equal=makeRaceSimulator({shortcut:a,racing:b});
  near(equal.comparison.racingFinishAdvantageSeconds,0);
  assert.equal(equal.comparison.fasterAtCommonFinish,'tie');
});
test('authoritative path injection replays exactly as default and is independent of call order',()=>{
  const one=sampleRaceFrame(76,30,paths);
  const two=sampleRaceFrame(190,30);
  assert.deepEqual(one,sampleRaceFrame(76,30));
  assert.deepEqual(two,sim.sample(190,30));
});
