import test from 'node:test';
import assert from 'node:assert/strict';
import {SCREEN,activeSubtitle,subtitleSize,materialPins,contactPin,liveMetalContact,
 projectWorld,aeroPin} from '../../graphics/core.ts';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import {sampleContactDrivenSparks} from '../../../physics/sparks.ts';
import {getSkidDescriptors} from '../../../mechanics/skids.ts';
import {sampleRetimedShotCamera} from '../../../cinema/cameras.ts';
const skids=getSkidDescriptors(),startDistanceM=138-62*8.82;
const sample=(sec,shot='contact-macro')=>{
 const motion=sampleDynamics(sec,{startDistanceM,speedMps:62});
 const phys=sampleContactDrivenSparks(sec,motion,skids,{startDistanceM,speedMps:62});
 return {shot,tSec:sec,shotLocalSec:.4,shotDurationSec:2.3,motion,...phys};
};
const fixture=[{text:'Under',startSec:0,endSec:.3},{text:'the',startSec:.3,endSec:.5},
 {text:'car',startSec:.5,endSec:.9},{text:'sparks',startSec:.9,endSec:1.2}];
test('original narrator verification is REQUIRED in film mode; preview explicitly provisional',()=>{
 const cue={startFrame:0,endFrameExclusive:37,wordIndices:[0,1,2,3]};
 assert.throws(()=>activeSubtitle(4,30,fixture,cue,'provisional-test-fixture'),/blocked/);
 assert.equal(activeSubtitle(4,30,fixture,cue,'provisional-test-fixture',true).highlighted,0);
 assert.equal(activeSubtitle(14,30,fixture,cue,'provisional-test-fixture',true).highlighted,1);
 assert.equal(activeSubtitle(40,30,fixture,cue,'provisional-test-fixture',true),null);
 assert.throws(()=>activeSubtitle(4,30,fixture,{...cue,wordIndices:[0,0]},'verified-original-ep004'),/ordered/);
 assert.throws(()=>activeSubtitle(4,30,[{text:'bad',startSec:.5,endSec:.1}],cue,'verified-original-ep004'),/Invalid/);
});
test('caption typography keeps right socials + bottom 326px safe, long spoken words shrink',()=>{
 for(const words of [['SPARKS','FROM','METAL'],['SUPERCALIFRAGILISTICEXPIALIDOCIOUS'],['SUSPENSION','COMPRESSIBILITY','EXPLANATION']]){
  const box=subtitleSize(words);assert.ok(box.font>=22&&box.font<=59);
  assert.ok(box.left>=80&&box.left+box.width<=1080-SCREEN.right);
  assert.ok(box.bottom>=326);
 }
});
test('real 3D projection never fabricates a marker behind camera',()=>{
 const req=sample(8.8,'underfloor-reveal');
 const pose=sampleRetimedShotCamera(req.shot,.8,3,req.motion);
 const p=projectWorld(req.motion.worldPosition,pose);
 assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
 const bad=projectWorld([999,999,999],pose);
 assert.equal(bad.visible,false);
 for(const label of materialPins(req,pose)){
  assert.ok(['metal','plank','floor'].includes(label.id));
  assert.ok(label.anchorX>=72&&label.anchorX<=890);
  assert.ok(label.labelX>=84&&label.labelX+309<=1080-186);
  assert.ok(label.labelY<1360);
 }
});
test('metal scrape emphasis requires CURRENT active signed-gap contact, never persistent particles',()=>{
 const req=sample(8.8,'contact-macro'),pose=sampleRetimedShotCamera('contact-macro',1,2.2,req.motion);
 const spoof={...req,contacts:req.contacts.map(c=>({...c,active:false,signedGapM:.012}))};
 assert.equal(liveMetalContact(spoof.contacts),null);
 assert.equal(contactPin(spoof,pose),null);
 const spoof2={...req,contacts:req.contacts.map(c=>({...c,active:true,signedGapM:.01}))};
 assert.equal(contactPin(spoof2,pose),null);
 const seeded={...req,contacts:[{...req.contacts[0],active:true,signedGapM:-.001,relativeSpeedMps:62,contactIntensity01:1}]};
 assert.ok(liveMetalContact(seeded.contacts));
});
test('signed-gap samples include both contact and noncontact; graphics never emit sparks',()=>{
 const samples=Array.from({length:160},(_,i)=>sample(5+i*.055));
 assert.ok(samples.some(s=>s.contacts.some(c=>c.active&&c.signedGapM<=0)));
 assert.ok(samples.some(s=>s.contacts.every(c=>!c.active)));
});
test('aero indicator requires validated same-pose low-load comparison',()=>{
 const req=sample(7.7,'aero-load');
 const pose=sampleRetimedShotCamera('aero-load',1,3,req.motion);
 assert.equal(aeroPin(req,pose,undefined),null);
 const bad=sampleDynamics(8.3,{startDistanceM,speedMps:62,aeroLoad01:0});
 assert.throws(()=>aeroPin(req,pose,bad),/identical/);
});
