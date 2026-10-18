import test from 'node:test';
import assert from 'node:assert/strict';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../src/yunex/world-kit/motion.ts';
import {CORNER_GEOMETRY,RACING_CORNER,getRacingLineData,makeRacingLinePath,offsetFromCentre,projectOntoCornerRoad,sampleCornerCentre} from '../../src/yunex/f1-line-ep002/track/racingPaths.ts';
import {FORMULA_RIG,samplePreviewRaceFrame,steerFromCurvature,wheelRotationFromTravel} from '../../src/yunex/f1-line-ep002/cars/motion.ts';

const A=getRacingLineData('shortcut'),B=getRacingLineData('racing');
const horizontal=(p,q)=>Math.hypot(p[0]-q[0],p[2]-q[2]);
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

test('identical modern car specifications and two legal distinct trajectories',()=>{
 assert.equal(FORMULA_RIG.variant,'formula-modern');
 assert.equal(A.id,'shortcut');assert.equal(B.id,'racing');
 assert.ok(Math.abs(RACING_CORNER.centreApex[0]-65)<1.5);
 assert.ok(Math.abs(RACING_CORNER.centreApex[2]-18)<1.5);
 assert.ok(A.lengthM>80&&A.lengthM<110, 'A road-matched length');
 assert.ok(B.lengthM>A.lengthM+2.5, 'Shortcut must actually be shorter');
 assert.ok(B.lengthM<120);
 assert.equal(A.entryDistanceM,0);assert.equal(B.entryDistanceM,0);
 assert.equal(A.exitDistanceM,A.lengthM);assert.equal(B.exitDistanceM,B.lengthM);
 assert.ok(offsetFromCentre('shortcut',.5)<offsetFromCentre('racing',.5));
 assert.ok(offsetFromCentre('racing',0)>offsetFromCentre('racing',.5));
 assert.ok(offsetFromCentre('racing',1)>offsetFromCentre('racing',.5));
});
test('arc length, finite curvature and tangent continuity are deterministic',()=>{
 for(const path of [A,B]){
  const stations=path.knots;let previous=stations[0];
  for(const p of stations.slice(1)){
   assert.ok(p.arcM>previous.arcM,'strictly increasing arc metres');
   assert.ok(Math.abs(p.yaw-previous.yaw)<.06,'heading continuous');
   assert.ok(Number.isFinite(p.curvatureInvM));
   assert.ok(Math.abs(p.curvatureInvM)<.17,'corner curvature within illustrative roadway bounds');
   previous=p;
  }
  for(let i=0;i<=100;i++){
   const s=path.lengthM*i/100,p=path.sampleAtDistance(s),repeat=makeRacingLinePath(path.id).sampleAtDistance(s);
   assert.deepEqual(p,repeat);
   assert.ok(p.position.every(Number.isFinite));
   assert.ok(Number.isFinite(steerFromCurvature(p.curvatureInvM)));
   if(i<100){
    const q=path.sampleAtDistance(s+path.lengthM/100);
    assert.ok(horizontal(p.position,q.position)<path.lengthM/100+.05);
   }
  }
  assert.throws(()=>path.sampleAtDistance(NaN),/finite/i);
 });
 assert.ok(Math.abs(A.sampleAtDistance(A.apexDistanceM).curvatureInvM)>
           Math.abs(B.sampleAtDistance(B.apexDistanceM).curvatureInvM)*1.10,
           'inside apex is tighter than wide apex');
});
test('full 5.4 x 1.98m car footprint remains on the real 12m circuit',()=>{
 const halfL=CORNER_GEOMETRY.carLengthM/2,halfW=CORNER_GEOMETRY.carWidthM/2;
 for(const path of [A,B])for(let i=0;i<=20;i++){
  const p=path.sampleAtDistance(path.lengthM*i/20);
  for(const x of [-halfL,halfL])for(const z of [-halfW,halfW]){
   const corner=[p.position[0]+Math.cos(p.yaw)*x+Math.sin(p.yaw)*z,0,
     p.position[2]-Math.sin(p.yaw)*x+Math.cos(p.yaw)*z];
   const proj=projectOntoCornerRoad(corner);
   assert.ok(proj.lateralDistanceM<=CORNER_GEOMETRY.roadHalfWidthM-.20,
    `${path.id} station ${i} body corner off asphalt: ${proj.lateralDistanceM.toFixed(2)}m`);
  }
 }
});
test('kit handles measured wheel travel and curvature steering without rig duplication',()=>{
 const car=createVehicle({variant:'formula-modern',color:'#25AFA8'});
 const positions=[];car.traverse(o=>{if(o.userData.wheel)positions.push(o);});
 assert.equal(positions.length,4);
 for(const dist of [0,2.5,16,34]){
  animateVehicle(car,dist,steerFromCurvature(.03));
  for(const obj of positions)assert.ok(Math.abs(obj.rotation.z+dist/obj.userData.radius)<1e-10);
  assert.ok(Math.abs(wheelRotationFromTravel(dist)+dist/.36)<1e-10);
 }
 assert.ok(steerFromCurvature(.04)>0);
 assert.ok(steerFromCurvature(-.04)<0);
 assert.ok(Math.abs(steerFromCurvature(100))<=.65);
});
test('8-second moving preview retains safe physical spacing, not a staged overtake',()=>{
 let movedA=false,movedB=false,was=samplePreviewRaceFrame(0,30);
 for(let f=0;f<240;f+=3){
   const state=samplePreviewRaceFrame(f,30);
   const a=state.cars.shortcut,b=state.cars.racing;
   assert.ok(horizontal(a.worldPose.position,b.worldPose.position)>FORMULA_RIG.lengthM+.2,
     `car clearance failed at frame ${f}`);
   assert.ok(a.pathDistanceM<=A.lengthM&&b.pathDistanceM<=B.lengthM);
   assert.ok(a.pathDistanceM>=was.cars.shortcut.pathDistanceM-1e-9);
   assert.ok(b.pathDistanceM>=was.cars.racing.pathDistanceM-1e-9);
   assert.ok(Number.isFinite(a.steerRad)&&Number.isFinite(b.steerRad));
   if(horizontal(a.worldPose.position,was.cars.shortcut.worldPose.position)>0.1)movedA=true;
   if(horizontal(b.worldPose.position,was.cars.racing.worldPose.position)>0.1)movedB=true;
   assert.deepEqual(state,samplePreviewRaceFrame(f,30));
   was=state;
 }
 assert.ok(movedA&&movedB,'both cars genuinely travel');
});
