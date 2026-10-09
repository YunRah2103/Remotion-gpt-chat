'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require(process.env.BRAKE_MOTION_MODULE);
const {brakeStateAt, brakePoseAt, frictionTrackHeat01At} = m;
const frames = Array.from({length:750},(_,f)=>brakeStateAt(f));
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} vs ${b}`);

test('750 finite bounded full-frame states',()=>{
  assert.equal(frames.length,750);
  for(const [f,s] of frames.entries()){
    for(const value of Object.values(s)) assert.ok(Number.isFinite(value),`not finite at ${f}`);
    assert.ok(s.rotorSpeedRadPerSec>=0 && s.rotorSpeedRadPerSec<=62.001);
    assert.ok(s.brakePressure01>=0 && s.brakePressure01<=1);
    assert.ok(s.heat01>=0 && s.heat01<=1);
    assert.ok(s.padGapMetres>=0.0002999 && s.padGapMetres<=0.006001);
    near(s.timeSeconds,f/30);
  }
});
test('rotor angle monotone; speed nonincreasing and smooth under braking',()=>{
  for(let i=1;i<750;i++){
    const a=frames[i-1],b=frames[i];
    assert.ok(b.rotorAngleRad>=a.rotorAngleRad,`rotor reversed ${i}`);
    assert.ok(b.rotorSpeedRadPerSec<=a.rotorSpeedRadPerSec+1e-9,`accelerated ${i}`);
    assert.ok(a.rotorSpeedRadPerSec-b.rotorSpeedRadPerSec<0.26,`instant speed jump ${i}`);
    const visualRate=(b.rotorAngleRad-a.rotorAngleRad)*30;
    assert.ok(Math.abs(visualRate-(a.rotorSpeedRadPerSec+b.rotorSpeedRadPerSec)/2)<0.35);
  }
  assert.ok(frames[598].rotorSpeedRadPerSec<0.03);
  assert.ok(frames[690].rotorSpeedRadPerSec<0.03);
});
test('two clamps; inner +X, outer -X, zero caliper rotation',()=>{
  let cycles=0,active=false;
  for(let f=0;f<750;f++){
    const s=frames[f],now=s.brakePressure01>1e-6;
    if(now&&!active)cycles++;
    active=now;
    const p=brakePoseAt(f);
    near(p.innerPadLocalXMetres,-p.outerPadLocalXMetres);
    near(p.innerPadLocalXMetres,0.006-s.padGapMetres);
    near(p.rotorXRotationRad,p.hubXRotationRad);
    assert.equal(p.fixedCaliperXRotationRad,0);
  }
  assert.equal(cycles,2);
  assert.ok(frames[210].padGapMetres<frames[380].padGapMetres);
  assert.ok(frames[515].padGapMetres<frames[440].padGapMetres);
});
test('first and second heat rise; release and hero cool; annulus-only heat',()=>{
  assert.ok(frames[345].heat01>frames[120].heat01+0.15);
  assert.ok(frames[445].heat01<frames[390].heat01);
  assert.ok(frames[590].heat01>frames[458].heat01);
  assert.ok(frames[735].heat01<frames[620].heat01);
  for(const f of [0,321,531,705]){
    near(frictionTrackHeat01At(f,0.1),0);
    near(frictionTrackHeat01At(f,0.195),0);
    near(frictionTrackHeat01At(f,0.16),frames[f].heat01);
  }
});
test('no discontinuities at shot boundaries; deterministic out of order',()=>{
  for(const f of [120,270,450,630]){
    const a=frames[f-1],b=frames[f];
    assert.ok(Math.abs(b.heat01-a.heat01)<0.015);
    assert.ok(Math.abs(b.brakePressure01-a.brakePressure01)<0.06);
    assert.ok(Math.abs(b.padGapMetres-a.padGapMetres)<0.0004);
  }
  for(const f of [531,48,705,321,168,531,0,749])assert.deepEqual(brakeStateAt(f),frames[f]);
  assert.throws(()=>brakeStateAt(NaN),RangeError);
});
