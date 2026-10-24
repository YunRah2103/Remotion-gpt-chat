import test from 'node:test';
import assert from 'node:assert/strict';
import {
 EP006_CORNERS,EP006_GRAVITY_MPS2,EP006_JUMP_EVENTS,EP006_JUMPS,
 EP006_SUSPENSION_LIMITS_M,ep006SurfaceHeightM,sampleEp006Motion
} from '../../src/yunex/ep006/dynamics/motion.ts';
import {sampleEp006Effects} from '../../src/yunex/ep006/fx/contact-effects.ts';
const near=(a,b,tolerance=.0001)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} not near ${b} (±${tolerance})`);
test('authoritative airborne spans, events and deterministic absolute frames',()=>{
 assert.equal(sampleEp006Motion(0).phase,'takeoff');
 assert.equal(sampleEp006Motion(71).phase,'airborne');
 assert.equal(sampleEp006Motion(72).event,'J1_TOUCHDOWN');
 assert.equal(sampleEp006Motion(684).event,'J2_LAUNCH');
 assert.equal(sampleEp006Motion(749).phase,'airborne');
 assert.equal(sampleEp006Motion(750).event,'J2_TOUCHDOWN');
 assert.deepEqual(sampleEp006Motion(75),sampleEp006Motion(75));
 for(const frame of [0,1,42,71,684,702,749]){
  const s=sampleEp006Motion(frame);
  assert.ok(EP006_CORNERS.every(c=>!s.wheels[c].contact));
  assert.ok(EP006_CORNERS.every(c=>s.wheels[c].normalLoad01===0));
 }
 assert.throws(()=>sampleEp006Motion(-1));
 assert.throws(()=>sampleEp006Motion(.6));
});
test('airborne motion uses gravitational vertical velocity and quadratic height',()=>{
 for(const j of EP006_JUMPS){
  const a=sampleEp006Motion(j.launchFrame+5),b=sampleEp006Motion(j.launchFrame+35);
  const dt=(b.frame-a.frame)/30;
  near((b.velocityMps[1]-a.velocityMps[1])/dt,-EP006_GRAVITY_MPS2);
  near(b.positionM[1]-a.positionM[1],a.velocityMps[1]*dt-.5*EP006_GRAVITY_MPS2*dt*dt);
  const landing=sampleEp006Motion(j.landingFrame);
  near(landing.positionM[1],ep006SurfaceHeightM(landing.positionM[0]),.11);
  assert.ok(b.positionM[1]>landing.positionM[1]+1.0);
 }
});
test('four tyres stay on same sampled collision surface while grounded',()=>{
 for(const f of [72,73,75,79,84,95,130,480,670,750,751,754,770,800]){
  const s=sampleEp006Motion(f);
  for(const c of EP006_CORNERS){
   const w=s.wheels[c];
   assert.equal(w.contact,true);
   // chassis vertical datum, corrected axle travel and flattened tyre contact patch.
   const axle=c.startsWith('front')?1.31:-1.31,side=c.endsWith('left')?.82:-.82;
   near(s.positionM[1]+w.compressionM+w.tyreSquishM+axle*Math.sin(s.rotationRad[2])-side*Math.sin(s.rotationRad[0]),w.surfaceHeightM,.009);
   near(w.contactPointM[1],ep006SurfaceHeightM(w.contactPointM[0],w.contactPointM[2]));
   assert.ok(w.compressionM<=EP006_SUSPENSION_LIMITS_M.bump);
   assert.ok(w.compressionM>=EP006_SUSPENSION_LIMITS_M.droop);
   assert.ok(w.tyreSquishM<=EP006_SUSPENSION_LIMITS_M.tyreSquishMax);
  }
 }
});
test('each landing compresses, damps and rebounds rather than freezing',()=>{
 for(const j of EP006_JUMPS){
  const c=(offset)=>sampleEp006Motion(j.landingFrame+offset).wheels['front-left'].compressionM;
  assert.ok(c(3)>.045,'landing shock must substantially compress');
  assert.ok(c(7)>-.035,'chassis remains within damped travel after impact');
  assert.ok(c(12)<0,'suspension must extend into rebound');
  assert.ok(Math.abs(c(29))<Math.abs(c(12)),'rebound envelope must decay');
  assert.ok(sampleEp006Motion(j.landingFrame).impact01>.99);
 }
});
test('FX originate at physical contact and do not emit before touchdown',()=>{
 assert.equal(sampleEp006Effects(71).dust.length,0);
 assert.equal(sampleEp006Effects(749).gravel.length,0);
 for(const frame of [76,754]){
  const fx=sampleEp006Effects(frame);
  assert.ok(fx.dust.length>5);
  assert.ok(fx.gravel.length>5);
  assert.deepEqual(fx,sampleEp006Effects(frame));
  assert.ok(fx.gravel.every(g=>g.positionM[1]>=ep006SurfaceHeightM(g.positionM[0],g.positionM[2])));
 }
 assert.equal(EP006_JUMP_EVENTS.length,2);
});
