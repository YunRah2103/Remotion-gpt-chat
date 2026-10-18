import test from 'node:test';
import assert from 'node:assert/strict';
import {BRAKING_MODEL,sampleBrakingSimulation} from './simulation.ts';
import {mapFilmFrameToSimulationSec,mapAbsInsertFrameToSimulationSec} from './timeline.ts';
const ids=['front-left','front-right','rear-left','rear-right'];
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,String(a)+' != '+String(b));
test('200 km/h SI and arbitrary out-of-order seek yields identical state',()=>{
 near(sampleBrakingSimulation(0).speedMps,200/3.6);
 const before=sampleBrakingSimulation(2.345);
 sampleBrakingSimulation(7);sampleBrakingSimulation(0);sampleBrakingSimulation(1.08);
 assert.deepEqual(sampleBrakingSimulation(2.345),before);
 assert.deepEqual(sampleBrakingSimulation(2.345,'low-grip-abs'),sampleBrakingSimulation(2.345,'low-grip-abs'));
});
test('bounded force and speed, traveled distance and wheel angle never reverse',()=>{
 let previous=sampleBrakingSimulation(0);
 for(let f=1;f<=14*30;f++){
  const s=sampleBrakingSimulation(f/30);
  assert.ok(s.speedMps>=0&&s.speedMps<=previous.speedMps+1e-7);
  assert.ok(s.traveledM>=previous.traveledM-1e-7);
  assert.ok(s.decelerationMps2>=0&&s.decelerationMps2<2*BRAKING_MODEL.gravityMps2);
  for(const id of ids){
   const w=s.wheel[id],p=previous.wheel[id];
   assert.ok(w.angularSpeedRadPerSec>=0&&w.rotationRad>=p.rotationRad-1e-7);
   assert.ok(w.slipRatio>=0&&w.slipRatio<=1);
   assert.ok(w.brakePressure01>=0&&w.brakePressure01<=1);
   assert.ok(w.roadLongitudinalForceN>=0);
  }
  previous=s;
 }
 near(previous.speedMps,0);
});
test('load transfer adds front normal load, removes rear, conserves total normal',()=>{
 const before=sampleBrakingSimulation(0),during=sampleBrakingSimulation(2);
 const total=s=>ids.reduce((n,id)=>n+s.wheel[id].normalLoadN,0);
 near(total(before),BRAKING_MODEL.illustrativeMassKg*BRAKING_MODEL.gravityMps2,.001);
 near(total(during),total(before),.001);
 assert.ok(during.wheel['front-left'].normalLoadN>before.wheel['front-left'].normalLoadN);
 assert.ok(during.wheel['rear-left'].normalLoadN<before.wheel['rear-left'].normalLoadN);
});
test('cumulative brake work grows but is below kinetic energy because of other losses',()=>{
 const a=sampleBrakingSimulation(0),b=sampleBrakingSimulation(2),c=sampleBrakingSimulation(8);
 assert.equal(a.brakeHeatJ,0);
 assert.ok(b.brakeHeatJ>0&&c.brakeHeatJ>b.brakeHeatJ);
 assert.ok(c.brakeHeatJ<.5*BRAKING_MODEL.illustrativeMassKg*a.speedMps**2);
});
test('no invented dry ABS; low-grip ABS only during incipient lock transient',()=>{
 const dry=Array.from({length:210},(_,f)=>sampleBrakingSimulation(f/30));
 assert.ok(!dry.some(s=>ids.some(id=>s.wheel[id].absIntervening)));
 const low=Array.from({length:150},(_,f)=>sampleBrakingSimulation(f/30,'low-grip-abs'));
 assert.ok(low.some(s=>ids.some(id=>s.wheel[id].absIntervening)));
 for(const s of low)for(const id of ids)if(s.wheel[id].absIntervening){
  assert.ok(s.simTimeSec>=1.05&&s.simTimeSec<2.90);
  assert.ok(s.speedMps>3&&s.wheel[id].slipRatio>.10);
 }
 assert.ok(sampleBrakingSimulation(3,'low-grip-abs').speedMps>sampleBrakingSimulation(3).speedMps);
});
test('no tyre force exceeds load multiplied by available friction coefficient',()=>{
 for(const scenario of ['dry-track','low-grip-abs'])for(let f=0;f<280;f++){
  const s=sampleBrakingSimulation(f/30,scenario);
  const mu=scenario==='low-grip-abs'&&s.simTimeSec>=1.05&&s.simTimeSec<2.90?.30:.96;
  for(const id of ids)assert.ok(s.wheel[id].roadLongitudinalForceN<=mu*s.wheel[id].normalLoadN+1e-6);
 }
});
test('independent monotone dry-film and labelled ABS-insert maps',()=>{
 let previous=-1;
 for(let f=0;f<=750;f++){const t=mapFilmFrameToSimulationSec(f);assert.ok(t>=previous);previous=t;}
 previous=-1;
 for(let f=0;f<=145;f++){const t=mapAbsInsertFrameToSimulationSec(f);assert.ok(t>=previous);previous=t;}
 assert.ok(mapAbsInsertFrameToSimulationSec(145)<mapFilmFrameToSimulationSec(650));
});
test('bad sampler seconds rejected',()=>{
 for(const t of [-.1,Infinity,NaN])assert.throws(()=>sampleBrakingSimulation(t));
});

test('after physical stop: zero travel, no rotation, smooth pitch and load settlement',()=>{
 for(const scenario of ['dry-track','low-grip-abs']){
  let stopped;
  for(let frame=1;frame<=420;frame++){
   const state=sampleBrakingSimulation(frame/30,scenario);
   if(state.speedMps===0){stopped=state;break;}
  }
  assert.ok(stopped,'car must stop within the simulated horizon');
  const later=sampleBrakingSimulation(stopped.simTimeSec+.50,scenario);
  const atRest=sampleBrakingSimulation(14,scenario);
  near(later.traveledM,stopped.traveledM,.0001);
  near(atRest.traveledM,stopped.traveledM,.0001);
  near(later.brakeHeatJ,stopped.brakeHeatJ,.0001);
  assert.ok(later.pitchRad<=stopped.pitchRad+.0000001);
  assert.ok(atRest.pitchRad<.0001);
  for(const id of ids){
   const old=stopped.wheel[id],next=later.wheel[id],last=atRest.wheel[id];
   const fraction=id.startsWith('front')?BRAKING_MODEL.staticFrontLoadFraction:1-BRAKING_MODEL.staticFrontLoadFraction;
   const staticN=BRAKING_MODEL.illustrativeMassKg*BRAKING_MODEL.gravityMps2*fraction/2;
   near(next.rotationRad,old.rotationRad,.00001);
   assert.equal(next.angularSpeedRadPerSec,0);
   assert.ok(next.brakePressure01<=old.brakePressure01+1e-7);
   assert.ok(Math.abs(next.normalLoadN-staticN)<=Math.abs(old.normalLoadN-staticN)+1e-6);
   near(last.normalLoadN,staticN,.01);
  }
 }
});
