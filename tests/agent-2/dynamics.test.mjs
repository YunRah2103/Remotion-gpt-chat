import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleDynamics, failureProgressAt, DYNAMICS_DEFAULTS, DYNAMICS_ASSUMPTIONS, timestepSensitivityAt} from '../../production/yunex/tyre_blowout_ep003/dynamics/model.ts';

const sample=t=>sampleDynamics(t);
const wheels=['front-left','front-right','rear-left','rear-right'];

test('vehicle is straight, rolling forward, with positive normal loads before rupture',()=>{
  const a=sample(0),b=sample(.5);
  assert.equal(a.stage,'pre-failure');
  assert.ok(Math.abs(a.yawRad)<1e-12);
  assert.ok(Math.abs(b.yawRad)<1e-9);
  assert.ok(Math.abs(b.positionM[2]+1.85)<1e-8);
  assert.ok(b.positionM[0]>10);
  for(const id of wheels){
    assert.equal(b.wheels[id].rollingRadiusM,.36);
    assert.ok(b.wheels[id].normalLoadN>1500);
    assert.ok(b.wheels[id].spinRad<0,'forward wheel spin must be negative');
  }
});
test('only front-right pressure/radius changes after failure',()=>{
  assert.equal(failureProgressAt(.74),0);
  assert.equal(failureProgressAt(1.06),1);
  const mid=sample(.89),post=sample(1.20);
  assert.ok(mid.wheels['front-right'].rollingRadiusM<.36);
  assert.ok(post.wheels['front-right'].rollingRadiusM<mid.wheels['front-right'].rollingRadiusM);
  for(const id of ['front-left','rear-left','rear-right']){
    assert.equal(post.wheels[id].rollingRadiusM,.36);
  }
});
test('right-sided drag creates rightward positive yaw without forced spin',()=>{
  const post=sample(1.20);
  assert.ok(post.yawRad>0,'positive yaw is right in +X,+Y,+Z-left convention');
  assert.ok(post.positionM[2]<-1.85,'initial trajectory should favour negative-Z');
  assert.ok(Math.abs(sample(8).yawRad)<.25,'no huge theatrical spin');
});
test('model is deterministic after arbitrary seek ordering',()=>{
  const times=[9.71,0.33,2.50,7.34,1.12,8.3,4.27];
  const expected=times.map(sample);
  for(let i=times.length-1;i>=0;i--)assert.deepEqual(sample(times[i]),expected[i]);
  assert.deepEqual(sample(3.14),sample(3.14));
});
test('bounded control transition: stabilise before accelerator easing or braking',()=>{
  const a=sample(.75),b=sample(1.4),c=sample(3.4),d=sample(8);
  assert.ok(a.driverThrottle01>.20);
  assert.ok(b.driverThrottle01>.20);
  assert.ok(c.driverThrottle01<a.driverThrottle01);
  assert.equal(a.driverBrake01,0);
  assert.equal(c.driverBrake01,0);
  assert.equal(c.stage,'gradual-slowdown');
  assert.ok(d.driverBrake01>0&&d.driverBrake01<.15);
  for(const t of [0,1,2,4,6,8,10])assert.ok(Math.abs(sample(t).driverSteerRad)<=.055+1e-9);
});
test('motion remains finite, forward, road-bounded and slowly decelerates',()=>{
  let old=sample(0);
  for(let t=.1;t<=10;t+=.1){
    const x=sample(t);
    for(const v of [x.yawRad,x.rollRad,x.pitchRad,x.worldSpeedMps,...x.positionM])
      assert.ok(Number.isFinite(v),'no NaN or Infinity');
    assert.ok(x.distanceTravelledM>old.distanceTravelledM);
    assert.ok(x.positionM[0]>old.positionM[0]);
    assert.ok(Math.abs(x.yawRad)<.08);
    assert.ok(Math.abs(x.positionM[2]+1.85)<.70,'recover in initial lane without invented run-off');
    assert.ok(Math.abs(x.rollRad)<.045);
    assert.ok(Math.abs(x.pitchRad)<.045);
    for(const id of wheels){
      assert.ok(x.wheels[id].spinRad<old.wheels[id].spinRad);
      assert.ok(x.wheels[id].normalLoadN>0);
    }
    old=x;
  }
  assert.ok(sample(10).worldSpeedMps<sample(2).worldSpeedMps);
  assert.ok(sample(10).worldSpeedMps>10,'not a stop within ten seconds');
});
test('damaged wheel can be moved to opposite side: yaw sign reverses',()=>{
  const left=sampleDynamics(1.22,{...DYNAMICS_DEFAULTS,failedWheel:'front-left'});
  const right=sampleDynamics(1.22,{...DYNAMICS_DEFAULTS,failedWheel:'front-right'});
  assert.ok(left.yawRad<0);
  assert.ok(right.yawRad>0);
});
test('input validation and assumption introspection',()=>{
  assert.equal(DYNAMICS_ASSUMPTIONS.integrationHz,240);
  assert.throws(()=>sampleDynamics(-1));
  assert.throws(()=>sampleDynamics(Number.NaN));
  assert.throws(()=>sampleDynamics(33));
  assert.throws(()=>sampleDynamics(1,{...DYNAMICS_DEFAULTS,roadGripScale:3}));
});

test('120Hz / 480Hz independent integrations converge over incident and recovery',()=>{
  for(const t of [1.25,4.25,8.25]){
    const diff=timestepSensitivityAt(t);
    assert.ok(diff.yawDeltaRad<.01,JSON.stringify({t,diff}));
    assert.ok(diff.lateralDeltaM<.25,JSON.stringify({t,diff}));
    assert.ok(diff.longitudinalDeltaM<.25,JSON.stringify({t,diff}));
    assert.ok(diff.speedDeltaMps<.20,JSON.stringify({t,diff}));
  }
});
