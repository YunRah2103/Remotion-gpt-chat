import test from 'node:test';
import assert from 'node:assert/strict';
import {samplePreviewState,CAMERA_PREVIEW_SOURCE_OFFSET_SEC} from '../../production/yunex/tyre_blowout_ep003/cinema/previewState.ts';
import {sampleDynamics} from '../../production/yunex/tyre_blowout_ep003/dynamics/model.ts';
import {OPENING_CUTS,MONTAGE_CUTS} from '../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts';
test('preview is genuinely backed by Agent 2, at the same absolute source time',()=>{
 for(const mode of ['opening','montage']){
  for(const t of [0,.28,.55,.92,1.5,3.28,4.6,6.1,7.45,8.77]){
   if(mode==='opening'&&t>=5)continue;
   const p=samplePreviewState(t,mode);
   const real=sampleDynamics(t+CAMERA_PREVIEW_SOURCE_OFFSET_SEC);
   assert.equal(p.sourceTimeSec,t+CAMERA_PREVIEW_SOURCE_OFFSET_SEC);
   assert.equal(p.dynamics.yawRad,real.yawRad);
   assert.equal(p.dynamics.worldSpeedMps,real.worldSpeedMps);
   assert.equal(p.dynamics.distanceTravelledM,real.distanceTravelledM);
   assert.equal(p.dynamics.wheels['front-right'].spinRad,real.wheels['front-right'].spinRad);
   assert.equal(p.tyre.angularPhaseRad,real.wheels['front-right'].spinRad);
   for(const id of Object.keys(real.wheels)){
    const w=real.wheels[id],frame=p.dynamics.wheels[id];
    assert.equal(frame.hubWorldM[0]-w.hubWorldM[0],p.cameraWorldRebaseXM);
    assert.equal(frame.hubWorldM[1],w.hubWorldM[1]);
    assert.equal(frame.hubWorldM[2],w.hubWorldM[2]);
   }
  }
 }
});
test('failed tyre starts deforming during first preview second, not on title card',()=>{
 const start=samplePreviewState(0,'opening');
 const failing=samplePreviewState(.62,'opening');
 assert.equal(start.tyre.failureProgress,0);
 assert.ok(failing.tyre.failureProgress>.95);
 assert.ok(failing.tyre.effectiveRadiusM<.33);
});
test('every native shot stays within unwrapped 220-m source road',()=>{
 for(const [mode,cuts] of [['opening',OPENING_CUTS],['montage',MONTAGE_CUTS]]){
  for(let frame=0;frame<cuts.at(-1).toSec*30;frame++){
   const p=samplePreviewState(frame/30,mode);
   assert.ok(p.dynamics.positionM[0]>-108&&p.dynamics.positionM[0]<105,
    mode+' road extent violation at frame '+frame+': '+p.dynamics.positionM[0]);
  }
 }
});
test('end region is geometric refuge context, not fabricated lane switch or safe stop',()=>{
 const p=samplePreviewState(8.77,'montage');
 assert.equal(p.cut.shot,'safe-stop');
 assert.ok(p.dynamics.positionM[0]>36&&p.dynamics.positionM[0]<105);
 assert.ok(p.dynamics.worldSpeedMps>1);
 assert.ok(p.dynamics.positionM[2]>-7.05); // stays on travel side until Agent 2 designs real lane transition
});

test('premium opening visibly collapses real front-right tyre within first 0.5s',()=>{
 const intact=samplePreviewState(0,'opening');
 const emerging=samplePreviewState(.28,'opening');
 const collapsed=samplePreviewState(.45,'opening');
 assert.equal(intact.tyre.failureProgress,0);
 assert.ok(emerging.tyre.failureProgress>.5);
 assert.ok(collapsed.tyre.failureProgress>.99);
 assert.ok(collapsed.tyre.effectiveRadiusM<intact.tyre.effectiveRadiusM-.04);
});
test('elevated median-side recovery view exposes the right-hand refuge',async()=>{
 const {sampleCinemaCamera}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const p=samplePreviewState(8.1,'montage');
 const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:p.cut.shot,
  dynamics:p.dynamics,tyre:p.tyre,progress01:p.progress01});
 assert.equal(p.cut.shot,'safe-stop');
 assert.ok(pose.position[2]>p.dynamics.positionM[2]+4.5);
 assert.ok(pose.target[2]<p.dynamics.positionM[2]-2.7);
 assert.ok(pose.position[1]>2.8&&pose.fovDeg>=55);
 assert.ok(p.dynamics.worldSpeedMps>1);
});

test("real driver's camera avoids headrest and seat shell",async()=>{
 const {sampleCinemaCamera,vehicleLocalToWorld}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const p=samplePreviewState(5.6,'montage');
 const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:'driver-cockpit',
  dynamics:p.dynamics,tyre:p.tyre,progress01:.5});
 const eye=vehicleLocalToWorld([0,1.15,-.456],p.dynamics);
 assert.ok(Math.hypot(...pose.position.map((v,i)=>v-eye[i]))<.12);
 assert.ok(pose.position[1]>1.12&&pose.position[1]<1.20);
 assert.ok(pose.fovDeg>=68&&pose.fovDeg<=70);
});

test('authoritative pitch(X)/yaw(Y)/roll(Z) and all four hub world poses survive cinematic binding',async()=>{
 const T=await import('three');
 const {alignCinematicBodyAndHubs}=await import('../../production/yunex/tyre_blowout_ep003/cinema/axes.ts');
 const d={...sampleDynamics(2.12),positionM:[13,0,-1.85],pitchRad:.034,rollRad:-.027,yawRad:.061};
 const g=new T.Group();
 for(const id of ['front-left','front-right','rear-left','rear-right']){
  const o=new T.Group();
  o.name='steer-'+id;o.position.set(id.startsWith('front')?1.46:-1.46,.36,id.endsWith('right')?-.88:.88);
  const rot=new T.Group();rot.userData.wheel=true;o.add(rot);g.add(o);
 }
 alignCinematicBodyAndHubs(g,d);
 assert.equal(g.rotation.order,'YXZ');
 assert.equal(g.rotation.x,d.pitchRad);
 assert.equal(g.rotation.y,d.yawRad);
 assert.equal(g.rotation.z,d.rollRad);
 for(const id of ['front-left','front-right','rear-left','rear-right']){
  const o=g.getObjectByName('steer-'+id);
  const world=o.getWorldPosition(new T.Vector3()).toArray();
  assert.ok(Math.hypot(...world.map((v,i)=>v-d.wheels[id].hubWorldM[i]))<1e-8,id+' hub detached');
  assert.equal(o.children[0].rotation.z,d.wheels[id].spinRad);
 }
});

test('the tyre-to-car dolly clears macro scale by 0.47s without jumping',async()=>{
 const {sampleCinemaCamera}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const at=(t)=>{const p=samplePreviewState(t,'opening');return sampleCinemaCamera({
  tSec:p.sourceTimeSec,shot:p.cut.shot,dynamics:p.dynamics,tyre:p.tyre,progress01:p.progress01
 });};
 const near=at(.15),underPressure=at(.30),full=at(.47);
 const distance=(p)=>Math.hypot(...p.position.map((x,i)=>x-p.target[i]));
 assert.equal(near.shot,'tyre-hook');
 assert.equal(full.shot,'tyre-hook');
 assert.ok(distance(near)<3,'macro retains wheel-level framing');
 assert.ok(distance(underPressure)<3.3,'macro stays close while actual tyre loses pressure');
 assert.ok(distance(full)>5.5,'0.47s camera reveals substantial vehicle');
});
test('rear chase lens stays behind and near centerline with clear forward target',async()=>{
 const {sampleCinemaCamera}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 for(const t of [2.25,3.4,4.96]){
  const p=samplePreviewState(t,'opening');
  const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:p.cut.shot,
   dynamics:p.dynamics,tyre:p.tyre,progress01:p.progress01});
  assert.equal(pose.shot,'chase-recovery');
  assert.ok(pose.position[0]<p.dynamics.positionM[0]-6);
  assert.ok(Math.abs(pose.position[2]-p.dynamics.positionM[2])<2.2);
  assert.ok(pose.position[1]>1.9);
 }
});

test('full-car 9:16 camera framings keep the original 4.94m grand-tourer on screen',async()=>{
 const T=await import('three');
 const {sampleCinemaCamera}=await import('../../production/yunex/tyre_blowout_ep003/cinema/cameras.ts');
 const situations=[
  ['opening',.62,'tyre-hook'],['opening',1.02,'tyre-hook'],
  ['opening',1.42,'front-three-quarter'],['opening',2.12,'front-three-quarter'],
  ['opening',2.45,'chase-recovery'],['opening',4.97,'chase-recovery'],
  ['montage',1.36,'low-tracking'],['montage',2.15,'low-tracking'],
  ['montage',2.36,'rear-three-quarter'],['montage',3.10,'rear-three-quarter']
 ];
 for(const [mode,t,expected] of situations){
  const p=samplePreviewState(t,mode);
  assert.equal(p.cut.shot,expected,'check requested video shot');
  const pose=sampleCinemaCamera({tSec:p.sourceTimeSec,shot:p.cut.shot,
   dynamics:p.dynamics,tyre:p.tyre,progress01:p.progress01});
  const camera=new T.PerspectiveCamera(pose.fovDeg,540/960,pose.nearM,pose.farM);
  camera.position.set(...pose.position);camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const root=new T.Group();root.position.set(...p.dynamics.positionM);
  root.rotation.set(p.dynamics.pitchRad,p.dynamics.yawRad,p.dynamics.rollRad,'YXZ');
  root.updateMatrixWorld(true);
  for(const x of [-2.47,2.47])for(const y of [.10,1.34])for(const z of [-.97,.97]){
   const point=root.localToWorld(new T.Vector3(x,y,z)).project(camera);
   assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y),'finite projection');
   assert.ok(Math.abs(point.x)<1.01,
     mode+' '+t+'s '+expected+' clips original car in portrait X: '+point.x);
  }
 }
});
