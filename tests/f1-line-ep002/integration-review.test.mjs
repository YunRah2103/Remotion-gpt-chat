import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {portraitOverlayScale} from '../../src/yunex/f1-line-ep002/graphics/layout.ts';
import {AUTHORITATIVE_RACE_PATHS,raceSimulator,sampleRaceFrame,getRaceComparison}
 from '../../src/yunex/f1-line-ep002/physics/index.ts';
import {makeRacingLinePath,CORNER_GEOMETRY,projectOntoCornerRoad}
 from '../../src/yunex/f1-line-ep002/track/racingPaths.ts';
import {getRaceCamera} from '../../src/yunex/f1-line-ep002/cinema/cameras.ts';
import {measureCommonSector,compareApexCurvature}
 from '../../src/yunex/f1-line-ep002/graphics/model.ts';

const ids=['shortcut','racing'];
const p=AUTHORITATIVE_RACE_PATHS;
const near=(a,b,tolerance=1e-4)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} within ${tolerance}`);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

test('graphics preserve text scale at real 1080x1920 production dimensions',()=>{
 near(portraitOverlayScale(540,960),1);
 near(portraitOverlayScale(1080,1920),2);
 near(portraitOverlayScale(720,1280),4/3);
 near(portraitOverlayScale(540,1920),1);
 assert.throws(()=>portraitOverlayScale(0,960),/viewport/i);
 assert.throws(()=>portraitOverlayScale(Infinity,960),/viewport/i);
});

test('integrated packages use exactly the authored A1 objects and the A2 source of truth',()=>{
 for(const id of ids){
  assert.equal(p[id],makeRacingLinePath(id));
  assert.equal(raceSimulator.profiles[id].path,p[id]);
  assert.equal(p[id].entryDistanceM,0);
  assert.equal(p[id].exitDistanceM,p[id].lengthM);
 }
 near(distance(p.shortcut.sampleAtDistance(0).position,p.racing.sampleAtDistance(0).position),0,1e-8);
 near(distance(p.shortcut.sampleAtDistance(p.shortcut.lengthM).position,
   p.racing.sampleAtDistance(p.racing.lengthM).position),0,1e-8);
});

test('real physics, world graphics and timing agree without a scripted winner',()=>{
 const sim=getRaceComparison();
 assert.equal(sim.fasterAtCommonFinish,
  sim.racingFinishAdvantageSeconds>1e-6?'racing':
   sim.racingFinishAdvantageSeconds< -1e-6?'shortcut':'tie');
 near(sim.racingFinishAdvantageSeconds,
  sim.shortcut.finishTimeSeconds-sim.racing.finishTimeSeconds,1e-8);
 assert.ok(sim.finishSeparationM<.01);
 assert.ok(sim.racing.pathLengthM>sim.shortcut.pathLengthM);
 const measured=measureCommonSector(p,sampleRaceFrame,30,0,210);
 assert.ok(measured,'time gate comparator must read the real A2 simulation');
 near(measured.shortcut.elapsedSeconds,sim.shortcut.finishTimeSeconds,.04);
 near(measured.racing.elapsedSeconds,sim.racing.finishTimeSeconds,.04);
 assert.equal(measured.winner,sim.fasterAtCommonFinish);
 assert.equal(compareApexCurvature(p),'racing-gentler');
 // Regression for THIS approved illustrative scenario only; not a claim that
 // all wide racing lines win, nor a hard-coded video result.
 assert.equal(sim.fasterAtCommonFinish,'racing');
 assert.ok(sim.racingFinishAdvantageSeconds>.08 && sim.racingFinishAdvantageSeconds<.3);
});

test('physical positions, steering and tyre distance stay continuous through the actual duel',()=>{
 let last=sampleRaceFrame(0,30);
 for(let frame=1;frame<=210;frame++){
  const s=sampleRaceFrame(frame,30);
  assert.deepEqual(s,sampleRaceFrame(frame,30));
  for(const id of ids){
   const car=s.cars[id],prev=last.cars[id];
   assert.ok(car.pathDistanceM>=prev.pathDistanceM-1e-8);
   assert.ok(car.pathDistanceM<=p[id].lengthM+1e-8);
   near(car.travelDistanceM,car.pathDistanceM,1e-8);
   assert.ok(car.speedMps>=0&&Number.isFinite(car.speedMps));
   assert.ok(car.steerRad*car.worldPose.curvatureInvM>=-1e-7);
   assert.ok(Number.isFinite(car.lateralAccelMps2));
   near(car.lateralAccelMps2,car.speedMps*car.speedMps*Math.abs(car.worldPose.curvatureInvM),1e-6);
  }
  last=s;
 }
});

test('vehicle width and wheelbase stay inside the approved asphalt at denser checkpoints',()=>{
 const halfLength=CORNER_GEOMETRY.carLengthM/2;
 const halfWidth=CORNER_GEOMETRY.carWidthM/2;
 for(const id of ids)for(let i=0;i<=55;i++){
  const pose=p[id].sampleAtDistance(p[id].lengthM*i/55);
  const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
  for(const f of [-halfLength,halfLength])for(const side of [-halfWidth,halfWidth]){
   const corner=[pose.position[0]+f*c+side*s,0,pose.position[2]-f*s+side*c];
   const projection=projectOntoCornerRoad(corner);
   assert.ok(projection.lateralDistanceM<CORNER_GEOMETRY.roadHalfWidthM-.2,
    `${id} station ${i} vehicle corner ${projection.lateralDistanceM.toFixed(2)}m off road`);
  }
 }
});

test('A3 portrait cameras are driven by REAL A2 positions, including both-car wing corners',()=>{
 const pairShots=['opening','duel','overhead','final'];
 const check=(camera,car,shot,frame)=>{
  const position=car.worldPose.position,yaw=car.worldPose.yaw;
  const c=Math.cos(yaw),s=Math.sin(yaw);
  for(const front of [-2.9,2.9])for(const side of [-1.18,1.18])
   for(const high of [.13,1.45]){
    const point=new Vector3(position[0]+front*c+side*s,
      position[1]+high,position[2]-front*s+side*c).project(camera);
    assert.ok(point.z>-1&&point.z<1,`${shot} frame ${frame}: formula car behind lens/depth plane`);
    assert.ok(Math.abs(point.x)<.94&&Math.abs(point.y)<.96,
      `${shot} frame ${frame}: wing clipped x=${point.x.toFixed(3)} y=${point.y.toFixed(3)}`);
   }
 };
 for(const shot of pairShots){
  for(const frame of [0,5,15,30,45,60,90,120,150,165,180]){
   const state=sampleRaceFrame(frame,30),pose=getRaceCamera(shot,state,frame);
   const cam=new PerspectiveCamera(pose.fov,9/16,.1,500);
   cam.position.set(...pose.position);cam.lookAt(new Vector3(...pose.target));
   cam.updateProjectionMatrix();cam.updateMatrixWorld();
   for(const id of ids)check(cam,state.cars[id],shot,frame);
  }
 }
});
