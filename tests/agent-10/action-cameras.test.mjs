import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleActionCamera,actionVehicleToWorld,rebaseActionFrame,
  selectActionCut,ACTION_CRASH_CUTS,ACTION_RECOVERY_CUTS
} from '../../production/yunex/tyre_blowout_ep003/action/cameras.ts';
import {actionPreviewState} from '../../production/yunex/tyre_blowout_ep003/action/previewState.ts';
const stages=[
  'emergency-pull','barrier-approach','impact-side-profile',
  'impact-overhead','damage-scrape','reverse-sweep',
  'steady-driver','moving-recovery-hero'
];
function fakeFrame(t=1){
 const hubs=Object.fromEntries([
  ['front-left',1.46,.88],['front-right',1.46,-.88],
  ['rear-left',-1.46,.88],['rear-right',-1.46,-.88]
 ].map(([id,x,z])=>[id,{wheel:id,hubWorldM:[x,.36,z],
    steeringRad:0,spinRad:-t*31/.36,rollingRadiusM:.36,
    verticalCompressionM:0}]));
 return {tSec:t,positionM:[0,0,-1.85],yawRad:0,pitchRad:0,
   rollRad:0,worldSpeedMps:31.2928,distanceTravelledM:t*31,
   driverSteerRad:0,driverThrottle01:.15,driverBrake01:0,
   wheels:hubs,stage:'rapid-deflation'};
}
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const req=(stage,p=.5,t=1)=>({
 stage,progress01:p,sourceTimeSec:t,dynamics:fakeFrame(t)
});
test('uses correct +X forward / -Z front-right convention',()=>{
 const d=fakeFrame();
 assert.deepEqual(actionVehicleToWorld([1,0,-1],d),[1,0,-2.85]);
});
test('camera geography: every stage is finite with viable portrait FOV',()=>{
 for(const stage of stages)for(const p of [0,.15,.5,.9,1]){
  const pose=sampleActionCamera(req(stage,p));
  assert.equal(pose.stage,stage);
  assert.ok([...pose.position,...pose.target,pose.fovDeg,
   pose.roadParallaxMps].every(Number.isFinite));
  assert.ok(pose.position[1]>=.15);
  assert.ok(distance(pose.position,pose.target)>.38);
  assert.ok(pose.fovDeg>=35&&pose.fovDeg<=72);
  assert.ok(pose.nearM>0&&pose.farM>pose.nearM);
  assert.equal(pose.roadParallaxMps,31.2928);
 }
});
test('wide crash has clear median-side sightline toward right-hand rail',()=>{
 const p=sampleActionCamera(req('impact-side-profile',.6));
 assert.ok(p.position[2]>3);
 assert.ok(p.target[2]<-3);
 assert.ok(distance(p.position,p.target)>12);
});
test('moving camera not a static hold during same source car movement',()=>{
 for(const stage of stages){
  const a=sampleActionCamera(req(stage,.2,1));
  const b=sampleActionCamera(req(stage,.8,1.45));
  assert.ok(distance(a.position,b.position)>(stage==='steady-driver'?.005:.09),stage);
 }
});
test('deterministic random seek, no accidental contact shake',()=>{
 const input=req('impact-side-profile',.4);
 const a=sampleActionCamera(input);
 sampleActionCamera(req('moving-recovery-hero',.85,4));
 assert.deepEqual(a,sampleActionCamera(input));
 assert.equal(a.shakeM,0);
 assert.equal(sampleActionCamera({...input,impactFrame:{
   contact01:1,actualBarrierContact:false}}).shakeM,0);
 const actual=sampleActionCamera({...input,impactFrame:{
   contact01:1,actualBarrierContact:true}});
 assert.ok(Math.abs(actual.shakeM)<=.033);
});
test('root+wheel hubs share identical rigid X rebase',()=>{
 const d=fakeFrame(2),rebased=rebaseActionFrame(d,-45);
 assert.equal(rebased.positionM[0]-d.positionM[0],-45);
 for(const id of Object.keys(d.wheels)){
  assert.equal(rebased.wheels[id].hubWorldM[0]-
    d.wheels[id].hubWorldM[0],-45);
  assert.equal(rebased.wheels[id].hubWorldM[2],
    d.wheels[id].hubWorldM[2]);
  assert.equal(rebased.wheels[id].spinRad,d.wheels[id].spinRad);
 }
 assert.equal(d.positionM[0],0);
});
test('cut boundaries contiguous and no >3-second hold',()=>{
 for(const cuts of [ACTION_CRASH_CUTS,ACTION_RECOVERY_CUTS]){
  assert.equal(cuts[0].fromSec,0);
  for(let k=0;k<cuts.length;k++){
   assert.ok(cuts[k].toSec-cuts[k].fromSec>0);
   assert.ok(cuts[k].toSec-cuts[k].fromSec<3);
   if(k)assert.equal(cuts[k].fromSec,cuts[k-1].toSec);
  }
  const max=cuts.at(-1).toSec;
  for(let frame=0;frame<Math.round(max*30);frame++){
   const t=frame/30,{cut,progress01}=selectActionCut(t,cuts);
   assert.ok(cut.fromSec<=t&&t<cut.toSec);
   assert.ok(progress01>=0&&progress01<=1);
  }
 }
 assert.equal(ACTION_CRASH_CUTS.at(-1).toSec,6);
 assert.equal(ACTION_RECOVERY_CUTS.at(-1).toSec,7);
});
test('rejects invalid source clock, world data, camera progress and impact',()=>{
 for(const v of [-.1,NaN,Infinity]){
  assert.throws(()=>sampleActionCamera({...req('barrier-approach'),sourceTimeSec:v}));
 }
 assert.throws(()=>sampleActionCamera({...req('barrier-approach'),progress01:2}));
 assert.throws(()=>sampleActionCamera({...req('impact-side-profile'),impactFrame:{
  contact01:1.5,actualBarrierContact:true}}));
 assert.throws(()=>rebaseActionFrame(fakeFrame(),NaN));
});
test('recovery preview uses real A2 source progression, not a reset',()=>{
 let previous=null;
 for(let f=0;f<210;f+=5){
  const s=actionPreviewState(f/30,'recovery');
  assert.equal(s.provisionalCrash,false);
  assert.equal(s.contact01,0);
  assert.ok(s.dynamics.worldSpeedMps>0);
  assert.ok(s.dynamics.wheels['front-right'].rollingRadiusM>0);
  if(previous)assert.ok(s.sourceTimeSec>previous.sourceTimeSec);
  previous=s;
 }
});
test('crash fixture is unambiguously PROVISIONAL; not falsely A8-verified',()=>{
 const a=actionPreviewState(1.9,'crash-blocking');
 const b=actionPreviewState(4.3,'crash-blocking');
 assert.equal(a.provisionalCrash,true);
 assert.equal(b.provisionalCrash,true);
 assert.ok(b.dynamics.positionM[2]<a.dynamics.positionM[2]-2);
 assert.ok(b.contact01>0);
 for(const id of Object.keys(b.dynamics.wheels)){
  const rootB=b.dynamics.positionM[2]-b.dynamics.wheels[id].hubWorldM[2];
  assert.ok(Number.isFinite(rootB));
 }
});
