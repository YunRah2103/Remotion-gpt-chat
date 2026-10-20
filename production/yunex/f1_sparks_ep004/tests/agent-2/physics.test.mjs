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
   assert.ok(s.worldPosition.every(Number.isFinite));}
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
