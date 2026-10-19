import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleCinemaCamera,selectCut,OPENING_CUTS,MONTAGE_CUTS,vehicleLocalToWorld} from '../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts';
import {fixtureDynamics,fixtureTyre} from '../../production/yunex/tyre_blowout_ep003/cinema/fixture.ts';
const input=(t,shot,progress01=0)=>({tSec:t,shot,progress01,dynamics:fixtureDynamics(t),tyre:fixtureTyre(t)});
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
test('camera +X forward and negative-Z right flank',()=>{
 const d=fixtureDynamics(0);
 assert.deepEqual(vehicleLocalToWorld([1,0,-1],d),[d.positionM[0]+1,0,d.positionM[2]-1]);
});
test('macro-to-moving-hero reveal',()=>{
 const a=sampleCinemaCamera(input(.1,'tyre-hook',0));
 const b=sampleCinemaCamera(input(1.3,'tyre-hook',.98));
 assert.ok(dist(a.position,a.target)<1.7);
 assert.ok(dist(b.position,b.target)>5);
 assert.ok(a.fovDeg>=30&&a.fovDeg<50);
});
test('all 10 cameras are nondegenerate, finite, off the road plane',()=>{
 for(const shot of ['tyre-hook','front-three-quarter','low-tracking','wheel-cutaway','underbody','overhead-dynamics','driver-cockpit','chase-recovery','rear-three-quarter','safe-stop']){
  for(const t of [0,.75,1,3,5,8.79]){
   const v=sampleCinemaCamera(input(t,shot,.5));
   assert.ok(v.position.every(Number.isFinite)&&v.target.every(Number.isFinite));
   assert.ok(v.position[1]>.105);
   assert.ok(dist(v.position,v.target)>.3);
   assert.ok(v.nearM>0&&v.farM>v.nearM);
  }
 }
});
test('out-of-order seek deterministic; position follows provided dynamics',()=>{
 const a=input(2.24,'chase-recovery',.48),p=sampleCinemaCamera(a);
 sampleCinemaCamera(input(1.2,'tyre-hook',.62));
 assert.deepEqual(sampleCinemaCamera(a),p);
 const offset=[-10,0,-4],shift=sampleCinemaCamera({...a,dynamics:{...a.dynamics,positionM:offset}});
 assert.ok(Math.abs(shift.position[0]-p.position[0]-(-10-a.dynamics.positionM[0]))<1e-9);
 assert.ok(Math.abs(shift.position[2]-p.position[2]-(-4-a.dynamics.positionM[2]))<1e-9);
});
test('two continuous camera timelines and >5 distinct montage shots',()=>{
 assert.equal(OPENING_CUTS.at(-1).toSec,5);
 assert.equal(MONTAGE_CUTS.at(-1).toSec,8.8);
 assert.ok(new Set(MONTAGE_CUTS.map(x=>x.shot)).size>=5);
 for(const cuts of [OPENING_CUTS,MONTAGE_CUTS]){
  for(let i=1;i<cuts.length;i++)assert.equal(cuts[i-1].toSec,cuts[i].fromSec);
  for(let frame=0;frame<cuts.at(-1).toSec*30;frame++){
   const t=frame/30,{cut,progress01}=selectCut(t,cuts);
   assert.ok(cut.fromSec<=t&&t<cut.toSec);
   assert.ok(progress01>=0&&progress01<=1);
  }
 }
});
test('demo fixture never wraps or teleports inside preview duration',()=>{
 let prev=fixtureDynamics(0);
 for(let i=1;i<264;i++){
  const now=fixtureDynamics(i/30);
  assert.ok(now.positionM[0]>prev.positionM[0]);
  assert.ok(now.worldSpeedMps<=27.78&&now.worldSpeedMps>0);
  assert.ok(now.positionM[0]<105);
  prev=now;
 }
});
test('reject invalid time and progress',()=>{
 assert.throws(()=>fixtureDynamics(NaN));
 assert.throws(()=>sampleCinemaCamera({...input(1,'tyre-hook'),tSec:-1}));
 assert.throws(()=>sampleCinemaCamera({...input(1,'tyre-hook'),progress01:Infinity}));
});
