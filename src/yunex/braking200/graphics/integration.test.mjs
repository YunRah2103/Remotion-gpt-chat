import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleBrakingSimulation,BRAKING_MODEL} from '../physics/simulation.ts';
import {sampleCameraPose} from '../cameras/cameraRig.ts';
import {mapAbsInsertFrameToSimulationSec} from '../physics/timeline.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {projectWorldPoint,heatVisual01,shouldShowAbs,speedText} from './logic.ts';

test('A2 speed and thermal energy feed A5 without second speed curve',()=>{
 const start=sampleBrakingSimulation(0,'dry-track');
 assert.equal(start.speedMps,BRAKING_MODEL.initialSpeedMps);
 assert.equal(speedText(start),'200');
 const more=sampleBrakingSimulation(2,'dry-track');
 assert.ok(more.speedMps<start.speedMps);
 assert.ok(more.brakeHeatJ>=start.brakeHeatJ);
 assert.ok(heatVisual01(more,1700000)>=0);
 assert.deepEqual(more,sampleBrakingSimulation(2,'dry-track'));
});
test('A2 never fires dry-road ABS; explicit low-grip example is conditional',()=>{
 for(let t=0;t<9;t+=.20){
  const state=sampleBrakingSimulation(t,'dry-track');
  assert.equal(shouldShowAbs(state,'front-left'),false);
 }
 const active=Array.from({length:75},(_,i)=>sampleBrakingSimulation(1.05+i*.025,'low-grip-abs'))
  .some(s=>shouldShowAbs(s,'front-left')||shouldShowAbs(s,'front-right'));
 assert.ok(active,'A2 low-grip intervention must really occur in teaching insert');
});
test('A3 actual moving camera projects its physical aim point on screen',()=>{
 const spec=vehicleSpec('grand-tourer');
 const state=sampleBrakingSimulation(.65,'dry-track');
 const route=sampleRoute('track',75+state.traveledM);
 const camera=sampleCameraPose(45,route,spec,{
  cues:[{cue:'mechanism',fromFrame:0,toFrameExclusive:150}],
 });
 const p=projectWorldPoint(camera.target,camera);
 assert.ok(p.visible);
 assert.ok(Math.abs(p.x-540)<.00001);
 assert.ok(Math.abs(p.y-960)<.00001);
});

test('A5 ABS slow-motion window contains real sampled pressure intervention',()=>{
 const hits=Array.from({length:145},(_,frame)=>{
  const t=mapAbsInsertFrameToSimulationSec(frame);
  return Number(sampleBrakingSimulation(t,'low-grip-abs').wheel['front-left'].absIntervening);
 });
 const windows=Array.from({length:116},(_,i)=>
  hits.slice(i,i+30).reduce((a,b)=>a+b,0));
 const max=Math.max(...windows);
 assert.ok(max>=2,'Low-grip sequence has no legible intervention samples');
 assert.ok(windows.indexOf(max)>=0);
});
