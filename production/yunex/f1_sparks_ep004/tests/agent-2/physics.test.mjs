import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleDynamics,localToWorld,worldToLocal} from '../../physics/dynamics.ts';
import {sampleSkidContacts} from '../../physics/contacts.ts';
import {sampleSparkParticles} from '../../physics/sparks.ts';

const forward={id:'forward',metal:true,localBottomPoint:[1.05,.065,0]}; // fixture ONLY until Agent 1 exports exact mesh
const some=[forward];
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,JSON.stringify([a,b]));

test('arbitrary-frame seek returns identical full vehicle and wheel states',()=>{
 const times=[0,1.75,.23,.67,0,1.75,.23];
 const sampled=times.map(t=>sampleDynamics(t,{startDistanceM:70.6}));
 assert.deepEqual(sampled[0],sampled[4]);
 assert.deepEqual(sampled[1],sampled[5]);
 assert.deepEqual(sampled[2],sampled[6]);
 for(const s of sampled){assert.ok(s.heaveM>=-.085);assert.ok(s.heaveM<=.12);
   assert.ok(s.worldPosition.every(Number.isFinite));
   assert.ok(!('wheelCompression' in s),'do not emit old typo; Agent 1 needs wheelCompressionM');
   assert.deepEqual(Object.keys(s.wheelCompressionM).sort(),['front-left','front-right','rear-left','rear-right']);
   assert.ok(Object.values(s.wheelCompressionM).every(v=>Number.isFinite(v)&&v>=0&&v<=.032));
 }
});
test('world transform round-trips under combined yaw pitch roll',()=>{
 for(const t of [.01,.2,1.67]){const m=sampleDynamics(t);
  const local=[1.05,.065,.32];
  const roundtrip=worldToLocal(localToWorld(local,m),m);
  for(let i=0;i<3;i++)near(local[i],roundtrip[i]);
 }
});
test('positive deliberate clearance produces NO contacts or new sparks',()=>{
 const m=sampleDynamics(0,{startDistanceM:94,rideHeightOffsetM:.16,speedMps:40});
 const contacts=sampleSkidContacts(0,m,some);
 assert.ok(contacts[0].signedGapM>.08);
 assert.equal(contacts[0].active,false);
 assert.deepEqual(sampleSparkParticles(0,m,contacts,some,{rideHeightOffsetM:.16}),[]);
});
test('metal contact emerges near profile rise and releases over flat tarmac',()=>{
 let negative=0,positive=0;
 for(let i=0;i<250;i++){
  const t=i/100;
  const m=sampleDynamics(t,{startDistanceM:69});
  const c=sampleSkidContacts(t,m,some)[0];
  if(c.signedGapM<=0){negative++;assert.ok(c.active);near(c.pointWorld[1],c.pointWorld[1]);}
  else positive++;
 }
 assert.ok(negative>0, 'expect actual metal contact');
 assert.ok(positive>0, 'expect visible release');
});
test('each active birth traces to actual metal-road contact and finite lifetime',()=>{
 const startDistanceM=69;
 let total=0;
 for(let i=0;i<=180;i+=5){
  const t=i/100,m=sampleDynamics(t,{startDistanceM});
  const contacts=sampleSkidContacts(t,m,some);
  const particles=sampleSparkParticles(t,m,contacts,some);
  for(const p of particles){
   const birthMotion=sampleDynamics(p.startSec,{startDistanceM});
   const birth=sampleSkidContacts(p.startSec,birthMotion,some)[0];
   assert.equal(p.emitterSkidId,'forward');
   assert.ok(birth.active&&birth.signedGapM<=0);
   assert.ok(p.ageSec>=0&&p.ageSec<=p.lifetimeSec);
   assert.ok(p.positionWorld.every(Number.isFinite));
   assert.ok(p.velocityWorld.every(Number.isFinite));
   assert.ok(p.radiusM>0&&p.luminance01>=0&&p.luminance01<=1);
   total++;
  }
 }
 assert.ok(total>0,'need an actual visible spark event');
});
test('particle array is deterministic, bounded and has no non-metal emitters',()=>{
 const at=.04,opts={startDistanceM:70.6};
 const m=sampleDynamics(at,opts),c=sampleSkidContacts(at,m,some);
 const a=sampleSparkParticles(at,m,c,some);
 sampleSparkParticles(1.2,sampleDynamics(1.2,opts),sampleSkidContacts(1.2,sampleDynamics(1.2,opts),some),some);
 assert.deepEqual(a,sampleSparkParticles(at,m,c,some));
 assert.ok(a.length<=260);
 assert.throws(()=>sampleSkidContacts(at,m,[{id:'forward',metal:false,localBottomPoint:[1,.065,0]}]));
});

import {getSkidDescriptors} from '../../mechanics/skids.ts';
import {PREVIEW_SHOTS,samplePreviewShot} from '../../previews/agent-2/shot-plan.ts';

test('V2 cinematic passes import actual metal descriptors, show dry road and real contact-born glints',()=>{
 const skids=getSkidDescriptors();
 assert.deepEqual(skids.map(s=>s.id),['forward','middle','rear']);
 for(const [mode,frames] of [['technical',150],['portrait',210]]){
  const events=new Map();
  for(let frame=0;frame<frames;frame++){
   const {shot,sourceTimeSec}=samplePreviewShot(mode,frame);
   const data=events.get(shot.id)??{contact:0,clear:0,sparks:0,release:0};
   const motion=sampleDynamics(sourceTimeSec,{startDistanceM:shot.startDistanceM});
   const contacts=sampleSkidContacts(sourceTimeSec,motion,skids);
   const particles=sampleSparkParticles(sourceTimeSec,motion,contacts,skids);
   const active=contacts.some(c=>c.active);
   if(active)data.contact++;else data.clear++;
   if(particles.length)data.sparks++;
   if(!active&&particles.length)data.release++;
   for(const p of particles){
    const atBirth=sampleSkidContacts(p.startSec,sampleDynamics(p.startSec,
     {startDistanceM:shot.startDistanceM}),skids).find(c=>c.skidId===p.emitterSkidId);
    assert.ok(atBirth?.active&&atBirth.signedGapM<=0,'Every particle must be born at a sliding METAL skid');
   }
   events.set(shot.id,data);
  }
  assert.equal(events.size,PREVIEW_SHOTS[mode].length);
  for(const [id,stat] of events){
   assert.ok(stat.contact>=1,mode+'/'+id+' must have genuine contact '+JSON.stringify(stat));
   assert.ok(stat.clear>=1,mode+'/'+id+' must have clear road '+JSON.stringify(stat));
   assert.ok(stat.sparks>=2,mode+'/'+id+' must have visible glints '+JSON.stringify(stat));
   assert.ok(stat.release>=1,mode+'/'+id+' must retain airborne glints after release '+JSON.stringify(stat));
  }
 }
});
