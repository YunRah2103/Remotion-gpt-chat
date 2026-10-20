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
  'steady-driver','moving-recovery-hero','safe-slowdown-follow'
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
test('first-contact camera reveals A8 front-right nose from above the rail',()=>{
 const d=fakeFrame(),p=sampleActionCamera(req('impact-side-profile',.6));
 assert.ok(p.position[0]>d.positionM[0]+8,
   'front three-quarter lens looks toward the real crumple corner');
 assert.ok(p.position[2]<d.positionM[2]-5,
   'lens is on failed front-right / right-rail side');
 assert.ok(p.position[1]>4.9,'lens clears steel rail');
 assert.ok(distance(p.position,p.target)>8.5,
   'portrait framing must show the whole car, not a cropped bumper');
 const scrape=sampleActionCamera(req('damage-scrape',.6));
 assert.ok(scrape.position[0]>d.positionM[0]+6,
   'aftermath must NOT show only the undamaged rear');
 assert.ok(scrape.position[2]<d.positionM[2]-4,
   'damage is on failed right side');
});
test('safe-branch final recovery shot stays on visible carriageway side',()=>{
 const s=actionPreviewState(6.68,'recovery');
 assert.equal(s.stage,'safe-slowdown-follow');
 const pose=sampleActionCamera({stage:s.stage,progress01:s.progress01,
   sourceTimeSec:s.sourceTimeSec,dynamics:s.dynamics});
 assert.ok(pose.position[2]<s.dynamics.positionM[2]-2.5,
   'camera must face from NEGATIVE Z carriageway, not giant central divider');
 assert.ok(pose.position[2]>-7.8,
   'camera stays INSIDE actual signed right-hand steel rail');
 assert.ok(pose.position[1]>3.2,'lens clears roadside geometry');
 assert.ok(pose.position[0]<s.dynamics.positionM[0]-10,
   'portrait lens must be far enough BACK to fit full original GT');
 assert.ok(Math.hypot(...pose.position.map((v,i)=>v-s.dynamics.positionM[i]))>11,
   'full-car framing must not repeat earlier bumper clip');
 assert.ok(s.dynamics.worldSpeedMps>0,'still moving, no fictitious safe stop');
});
test('rewind view remains higher rear-three-quarter, never side-on clipping',()=>{
 const s=actionPreviewState(4.78,'crash-action');
 assert.equal(s.stage,'reverse-sweep');
 assert.equal(s.replay.direction,-1);
 const pose=sampleActionCamera({stage:s.stage,sourceTimeSec:s.sourceTimeSec,
   progress01:s.progress01,dynamics:s.dynamics});
 const longitudinal=pose.position[0]-s.dynamics.positionM[0];
 assert.ok(longitudinal<-4,'rewind camera stays BEHIND original GT');
 assert.ok(pose.position[1]>4.4,'camera rises above guardrail');
 assert.ok(pose.fovDeg>=55,'phone portrait lens wide enough for full car');
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
test('Agent 8 actual collision and Agent 9 reversed-time A8 damage',()=>{
 const forward=actionPreviewState(2.55,'crash-action');
 const freeze=actionPreviewState(2.83,'crash-action');
 const backward=actionPreviewState(4.65,'crash-action');
 const restart=actionPreviewState(5.98,'crash-action');
 assert.equal(forward.provisionalCrash,false);
 assert.ok(forward.replay);
 assert.ok(forward.impact);
 assert.ok(freeze.impact);
 assert.equal(backward.replay.direction,-1);
 assert.ok(backward.impact);
 assert.ok(backward.sourceTimeSec<freeze.sourceTimeSec);
 assert.ok(backward.impact.relativeTimeSec<freeze.impact.relativeTimeSec);
 assert.ok(backward.impact.bumperCrushM<=freeze.impact.bumperCrushM);
 assert.equal(restart.replay.direction,0);
 assert.equal(restart.impact,null);
 assert.ok(restart.tyre.failureProgress>.9,
   'A9 restart must NOT magically repair the front-right tyre');
});
test('FIRST Agent8 contact occurs in wide rail-impact camera, not aftermath cut',()=>{
  let first=null;
  for(let i=0;i<95;i++){
    const sample=actionPreviewState(i/30,'crash-action');
    if(sample.impact?.contact.occurred){first=sample;break;}
  }
  assert.ok(first,'Agent8 actual contact must be sampled inside review');
  assert.equal(first.stage,'impact-side-profile',
    'wide full-car view must show actual FIRST CONTACT, not aftermath');
  assert.ok(first.filmTimeSec>=1.21&&first.filmTimeSec<2.43);
});
test('A8 rail strike is real and not a fake script-driven camera event',()=>{
 let foundContact=false,foundDamage=false,earlier=null;
 for(let i=0;i<180;i++){
   const s=actionPreviewState(i/30,'crash-action');
   if(s.impact?.contact.occurred){
     foundContact=true;
     assert.ok(s.impact.contact.clearanceM>=0);
     if(s.impact.bumperCrushM>.01)foundDamage=true;
   }
   if(s.replay?.phase==='reverse-crash'){
     if(earlier)assert.ok(s.sourceTimeSec<=earlier+.00001);
     earlier=s.sourceTimeSec;
   }
   assert.ok(s.dynamics.positionM.every(Number.isFinite));
 }
 assert.ok(foundContact,'A8 actual rail collision must occur on camera');
 assert.ok(foundDamage,'A8 actual body crush must be visible');
});
test('crash camera and rail share A8 world X rebasing and front-right side',()=>{
 const s=actionPreviewState(2.50,'crash-action');
 assert.ok(s.impact);
 assert.ok(Math.abs(s.dynamics.positionM[0]-
   s.impact.scenePositionM[0])<.00001);
 assert.ok(Math.abs(s.dynamics.positionM[2]-
   s.impact.scenePositionM[2])<.00001);
 assert.ok(s.impact.contact.barrierZ<-7.0);
 for(const id of Object.keys(s.dynamics.wheels)){
   assert.ok(s.dynamics.wheels[id].hubWorldM.every(Number.isFinite));
 }
 const actual=sampleActionCamera({stage:s.stage,sourceTimeSec:s.sourceTimeSec,
   progress01:s.progress01,dynamics:s.dynamics,
   impactFrame:{actualBarrierContact:s.impact.contact.occurred,
     contact01:s.contact01}});
 assert.ok(actual.position[2]<s.dynamics.positionM[2]-4,
   'camera must expose the A8 damaged right corner');
});
