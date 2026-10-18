/** Run once Agent 1's unmodified pinned source is staged in CI. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleBrakingSimulation,BRAKING_MODEL} from './simulation.ts';
import {mapAbsInsertFrameToSimulationSec,mapFilmFrameToSimulationSec} from './timeline.ts';
import {poseFromSimulation,padFaceGapM,MAX_PAD_TRAVEL_M} from '../engineering/mechanics.ts';
const ids=['front-left','front-right','rear-left','rear-right'];
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,String(a)+' != '+String(b));
test('A1 pad and rotor derive from the same authoritative four-wheel A2 state',()=>{
 for(const t of [0,.72,1.2,2.15,4,7,11]){
  const s=sampleBrakingSimulation(t);
  for(const id of ids){
   const pose=poseFromSimulation(s,id,.75,.02),w=s.wheel[id];
   near(pose.wheelRotationRad,-w.rotationRad);
   near(pose.pressure01,w.brakePressure01);
   near(pose.padTravelM,w.brakePressure01*MAX_PAD_TRAVEL_M);
   assert.ok(pose.padTravelM>=0&&pose.padTravelM<=.0012);
   assert.ok(padFaceGapM(pose)>=-1e-8);
  }
 }
});
test('dry track never triggers ABS during 25-second editorial mapping',()=>{
 for(let f=0;f<=750;f++){
  const s=sampleBrakingSimulation(mapFilmFrameToSimulationSec(f));
  assert.ok(ids.every(id=>!s.wheel[id].absIntervening));
 }
});
test('labelled lower-grip insert genuinely reduces A1 pad pressure',()=>{
 const pressure=[],interventions=[];
 for(let f=0;f<=145;f++){
  const s=sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(f),'low-grip-abs');
  const p=poseFromSimulation(s,'front-left');
  near(p.pressure01,s.wheel['front-left'].brakePressure01);
  pressure.push(p.pressure01);
  if(s.wheel['front-left'].absIntervening)interventions.push(f);
  assert.ok(s.wheel['front-left'].roadLongitudinalForceN<=
    s.wheel['front-left'].normalLoadN*BRAKING_MODEL.dryGripCoefficient+1e-5);
 }
 assert.ok(interventions.length>0,'must show real pressure-release event');
 assert.ok(pressure.some((p,i)=>i>0&&p<pressure[i-1]-.0001),'pressure must decrease');
});
test('arbitrary seeking maintains phase and pad state',()=>{
 const t=mapFilmFrameToSimulationSec(488),a=sampleBrakingSimulation(t);
 sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(72),'low-grip-abs');
 sampleBrakingSimulation(0);
 const b=sampleBrakingSimulation(t);
 assert.deepEqual(a,b);
 for(const id of ids)near(poseFromSimulation(a,id).wheelRotationRad,
   poseFromSimulation(b,id).wheelRotationRad);
});
