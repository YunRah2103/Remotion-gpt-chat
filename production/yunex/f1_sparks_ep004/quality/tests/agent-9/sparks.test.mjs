import test from 'node:test';
import assert from 'node:assert/strict';
import {getSkidDescriptors} from '../../../mechanics/skids.ts';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import {sampleSkidContacts} from '../../../physics/contacts.ts';
import {sampleContactDrivenSparks} from '../../../physics/sparks.ts';
import {sampleQualitySparkInstances,deriveQualityContactGlows,
  validateAppearanceProvenance} from '../../sparks/appearance.ts';
import {selectRealSparkTakes,sourceTakeAt} from '../../previews/agent-9/SourceTimeline.ts';

const skids=getSkidDescriptors();
const takes=selectRealSparkTakes();
const physics=(take,t=take.sourceSec)=>{
 const motion=sampleDynamics(t,{startDistanceM:take.startDistanceM,speedMps:62,aeroLoad01:1});
 const response=sampleContactDrivenSparks(t,motion,skids);
 return {...response,motion};
};

test('editorially selected opening really starts at approved A2 skid-to-road contact',()=>{
 assert.equal(takes.length,5);
 const start=physics(takes[0]);
 assert.ok(start.contacts.some(c=>c.active&&c.signedGapM<=0),'true opening contact required');
 assert.ok(start.contacts.every(c=>['forward','middle','rear'].includes(c.skidId)));
 const external=sampleSkidContacts(takes[0].sourceSec,start.motion,skids);
 assert.deepEqual(start.contacts,external);
});

test('dry interval is a real non-contact location, not a hidden emitter switch',()=>{
 for(const i of [1,3]){
  const d=physics(takes[i]);
  assert.ok(d.contacts.every(c=>!c.active&&c.signedGapM>0),
    'release marker must have positive clearance in the actual road simulation');
  assert.deepEqual(deriveQualityContactGlows(d.contacts,d.particles),[],
    'no new source light after release, even if aged real particles remain');
 }
});

test('every visual streak is exactly one existing A2 particle, no new ID or changed position',()=>{
 let nonEmpty=0;
 for(const take of [takes[0],takes[2]]){
  for(const delta of [0,.03,.07,.11]){
   const {particles}=physics(take,take.sourceSec+delta);
   const instances=sampleQualitySparkInstances(particles);
   assert.ok(validateAppearanceProvenance(instances,particles));
   assert.ok(instances.length<=particles.length&&instances.length<=260);
   const ids=new Set(particles.map(p=>p.id));
   for(const inst of instances){
    assert.ok(ids.has(inst.id));
    assert.ok(inst.radiusM>=.004&&inst.radiusM<=.024);
    assert.ok(inst.streakLengthM>0&&inst.streakLengthM<=.46);
    assert.ok(inst.directionWorld.every(Number.isFinite));
    assert.ok(inst.trailCentreWorld.every(Number.isFinite));
    const physical=particles.find(p=>p.id===inst.id);
    assert.deepEqual(inst.positionWorld,physical.positionWorld);
   }
   nonEmpty+=instances.length;
  }
 }
 assert.ok(nonEmpty>0,'some genuine hot particles should be camera visible');
});

test('every physical new particle references an ACTUAL metal touch at its birth tick',()=>{
 let checked=0;
 for(const take of [takes[0],takes[2]]){
  for(const dt of [.02,.05,.10,.20]){
   const {particles}=physics(take,take.sourceSec+dt);
   for(const p of particles){
    const birthMotion=sampleDynamics(p.startSec,{startDistanceM:take.startDistanceM,speedMps:62,aeroLoad01:1});
    const birth=sampleSkidContacts(p.startSec,birthMotion,skids).find(c=>c.skidId===p.emitterSkidId);
    assert.ok(birth&&birth.active&&birth.signedGapM<=0,
      'hot particle is traceable to signed gap on approved metal, not composite or exhaust');
    assert.ok(Math.abs(p.ageSec-(take.sourceSec+dt-p.startSec))<1e-6);
    checked++;
   }
  }
 }
 assert.ok(checked>0);
});

test('source-time seek and resulting appearance are deterministic across render order',()=>{
 const take=takes[0],t=take.sourceSec+.085;
 const a=physics(take,t);
 const visuals=sampleQualitySparkInstances(a.particles,.013,125);
 physics(takes[1]);physics(takes[2]);physics(take,t+.2);
 assert.deepEqual(physics(take,t),a);
 assert.deepEqual(sampleQualitySparkInstances(physics(take,t).particles,.013,125),visuals);
});

test('glows are bounded and require BOTH active signed gap and young observed particles',()=>{
 for(const take of [takes[0],takes[2]]){
  const {contacts,particles}=physics(take,take.sourceSec+.05);
  const a=deriveQualityContactGlows(contacts,particles);
  assert.ok(a.length<=2);
  for(const g of a){
   assert.ok(g.intensity>0&&g.intensity<=17);
   assert.ok(contacts.some(c=>c.skidId===g.skidId&&c.active&&c.signedGapM<=0));
   assert.ok(particles.some(p=>p.emitterSkidId===g.skidId&&p.ageSec<=.075));
  }
  const cleared=contacts.map(c=>({...c,active:false,signedGapM:.01}));
  assert.deepEqual(deriveQualityContactGlows(cleared,particles),[]);
 }
});

test('no arbitrary visual emissions and no dynamic particle widening outside caps',()=>{
 assert.deepEqual(sampleQualitySparkInstances([]),[]);
 assert.throws(()=>sampleQualitySparkInstances([], -.1),RangeError);
 assert.throws(()=>sampleQualitySparkInstances([], .01,261),RangeError);
 assert.throws(()=>deriveQualityContactGlows([],[],4),RangeError);
 assert.throws(()=>sampleQualitySparkInstances([{
  id:1,emitterSkidId:'forward',positionWorld:[NaN,0,0],velocityWorld:[1,0,0],
  startSec:0,ageSec:0,lifetimeSec:.5,radiusM:.01,luminance01:1,
 }]));
});

test('both 30fps timeline compositions map to nonnegative authoritative source time',()=>{
 for(const [mode,totalFrames] of [['technical',150],['cinematic',240]]){
  const keys=[0,1,Math.floor(totalFrames/2),totalFrames-1];
  for(const frame of keys){
   const beat=sourceTakeAt(frame/30,mode,takes);
   assert.ok(Number.isFinite(beat.sourceSec)&&beat.sourceSec>=0);
   const actual=physics({startDistanceM:beat.startDistanceM,sourceSec:beat.sourceSec});
   assert.ok(actual.motion.tSec===beat.sourceSec);
  }
 }
});
