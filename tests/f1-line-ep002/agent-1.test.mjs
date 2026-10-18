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
   assert.ok(Math.abs(p.curvatureInvM)<.17, `curvature limit ${path.id} at u=${p.progress01.toFixed(5)}: ${p.curvatureInvM.toFixed(5)} 1/m`);
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
 }
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

test('identical world entry and finish checkpoints: position, heading and curvature',()=>{
 const startA=A.sampleAtDistance(A.entryDistanceM);
 const startB=B.sampleAtDistance(B.entryDistanceM);
 const finishA=A.sampleAtDistance(A.exitDistanceM);
 const finishB=B.sampleAtDistance(B.exitDistanceM);
 // This deliberately uses exact equality: offsets vanish at BOTH checkpoints,
 // including the final spatial smoothing pass, not just at a gate plane.
 assert.deepEqual(startA,startB,'same initial pose and tangent on the same asphalt');
 assert.deepEqual(finishA,finishB,'same physical finish point and tangent');
 assert.deepEqual(startA.position,sampleCornerCentre(0).position);
 assert.deepEqual(finishA.position,sampleCornerCentre(1).position);
 assert.deepEqual(A.markers.entry.position,B.markers.entry.position);
 assert.deepEqual(A.markers.exit.position,B.markers.exit.position);
 assert.deepEqual(A.markers.entry.position,startA.position);
 assert.deepEqual(B.markers.exit.position,finishB.position);
 assert.ok(horizontal(startA.position,finishA.position)>30,'genuine sector between gates');
 for(const id of ['shortcut','racing']){
  assert.ok(Math.abs(offsetFromCentre(id,0))<1e-15);
  assert.ok(Math.abs(offsetFromCentre(id,1))<1e-15);
  assert.ok(Math.abs(offsetFromCentre(id,.00001))<1e-9, 'C2 smooth departure from checkpoint');
  assert.ok(Math.abs(offsetFromCentre(id,.99999))<1e-9, 'C2 smooth return to checkpoint');
 }
});

test('separated corner lines retain smoother wide apex without an endpoint kink',()=>{
 const aEntry=A.sampleAtDistance(0),bEntry=B.sampleAtDistance(0);
 const aExit=A.sampleAtDistance(A.lengthM),bExit=B.sampleAtDistance(B.lengthM);
 assert.ok(Math.abs(angleDelta(aEntry.yaw,bEntry.yaw))<1e-10);
 assert.ok(Math.abs(angleDelta(aExit.yaw,bExit.yaw))<1e-10);
 for(const u of [.25,.35,.5,.65,.75]){
  assert.ok(offsetFromCentre('racing',u)>offsetFromCentre('shortcut',u)+.9,
   `wide line must be outside shortcut at u=${u}`);
 }
 const curvatureAtApex=id=>{
  const path=id==='shortcut'?A:B;
  return Math.abs(path.sampleAtDistance(path.apexDistanceM).curvatureInvM);
 };
 assert.ok(curvatureAtApex('shortcut')>curvatureAtApex('racing')*1.1,
  'the tighter inside apex requires more lateral acceleration at equal speed');
 for(const id of ['shortcut','racing']){
  for(const boundary of [.04,.23,.77,.96]){
   const h=.00001;
   const left=(offsetFromCentre(id,boundary)-offsetFromCentre(id,boundary-h))/h;
   const right=(offsetFromCentre(id,boundary+h)-offsetFromCentre(id,boundary))/h;
   assert.ok(Math.abs(left-right)<.15, `no lateral slope discontinuity at ${boundary}: left=${left}, right=${right}`);
  }
 }
});

test('signed inverse-metre curvature is the measured path yaw derivative dyaw/ds',()=>{
 for(const path of [A,B]){
  const ds=.25;
  for(let s=1;s<path.lengthM-1;s+=.61){
   const p=path.sampleAtDistance(s),ahead=path.sampleAtDistance(s+ds),behind=path.sampleAtDistance(s-ds);
   // Path headings are continuously unwrapped; direct signed difference is dyaw.\n   const numerical=(ahead.yaw-behind.yaw)/(2*ds);
   assert.ok(Number.isFinite(numerical), `yaw derivative nonfinite: ${path.id} s=${s} forwardYaw=${ahead.yaw} backYaw=${behind.yaw} arc=${path.lengthM} declared=${p.curvatureInvM}`);
   assert.ok(Math.abs(numerical-p.curvatureInvM)<.04,
    `${path.id} at s=${s.toFixed(2)}m: finite diff ${numerical.toFixed(4)}, declared ${p.curvatureInvM.toFixed(4)}`);
   if(Math.abs(numerical)>.008 && Math.abs(p.curvatureInvM)>.008)
    assert.ok(numerical*p.curvatureInvM>0, 'actual turn sign must match wheel steering');
  }
  const apex=path.sampleAtDistance(path.apexDistanceM);
  assert.ok(apex.curvatureInvM>0, `${path.id} turns right by positive yaw`);
  assert.ok(steerFromCurvature(apex.curvatureInvM)>0);
 }
});

test('all 240 preview frames preserve separated car bodies and rolling travel',()=>{
 let prev=samplePreviewRaceFrame(0,30);
 for(let frame=0;frame<240;frame++){
  const state=samplePreviewRaceFrame(frame,30);
  const a=state.cars.shortcut,b=state.cars.racing;
  assert.ok(horizontal(a.worldPose.position,b.worldPose.position)>FORMULA_RIG.lengthM+.1,
    `frame ${frame} cars too close`);
  for(const id of ['shortcut','racing']){
   const car=state.cars[id],old=prev.cars[id];
   assert.ok(car.pathDistanceM+1e-8>=old.pathDistanceM);
   assert.equal(car.travelDistanceM,car.pathDistanceM);
   assert.ok(Math.abs(car.steerRad)<=.65);
   assert.ok(Number.isFinite(wheelRotationFromTravel(car.travelDistanceM)));
  }
  prev=state;
 }
});
