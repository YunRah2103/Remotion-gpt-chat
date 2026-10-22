import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {CINEMA_FPS,CINEMA_FRAMES,CINEMA_SHOTS,sampleCinema,shotAtFrame,speedAt,distanceAt,afterfireAt} from './timeline.ts';

test('six camera cuts tile exact native 750 frames without overlaps or gaps',()=>{
 assert.equal(CINEMA_FPS,30);assert.equal(CINEMA_FRAMES,750);
 assert.equal(CINEMA_SHOTS.length,6);assert.equal(CINEMA_SHOTS[0].start,0);
 assert.equal(CINEMA_SHOTS.at(-1).end,CINEMA_FRAMES);
 for(let i=1;i<CINEMA_SHOTS.length;i++)assert.equal(CINEMA_SHOTS[i-1].end,CINEMA_SHOTS[i].start);
 for(const shot of CINEMA_SHOTS){
  assert.equal(shotAtFrame(shot.start).id,shot.id);
  assert.equal(shotAtFrame(shot.end-1).id,shot.id);
 }
});
test('analytic speed integrates travelled distance, including across cuts',()=>{
 let prior=sampleCinema(0);
 for(let f=1;f<750;f++){
  const now=sampleCinema(f);
  assert.ok(now.distanceMeters>prior.distanceMeters);
  assert.ok(now.routeDistanceMeters>prior.routeDistanceMeters);
  assert.ok(now.speedMps>=12&&now.speedMps<30);
  const approx=(now.distanceMeters-prior.distanceMeters)*30;
  assert.ok(Math.abs(approx-now.speedMps)<.06);
  if(shotAtFrame(f).id!==shotAtFrame(f-1).id)
   assert.ok(now.distanceMeters-prior.distanceMeters<1,'jump across edit boundary');
  prior=now;
 }
 assert.equal(distanceAt(0),0);assert.ok(distanceAt(25)>400);
 assert.ok(Math.abs((distanceAt(9.001)-distanceAt(8.999))/.002-speedAt(9))<.001);
});
test('reverse seeks deterministic; tyre steering derives from road tangent',()=>{
 for(const f of [0,10,23,29,44,45,164,165,284,285,419,420,554,555,674,709,749]){
  const a=sampleCinema(f),b=sampleCinema(f);
  assert.deepEqual(a,b);
  assert.ok(Math.abs(a.steerRadians)<=.38);
  assert.deepEqual(a.pose,sampleRoute('track',a.routeDistanceMeters));
  assert.equal(a.pose.position[1],0);
  assert.ok(a.camera.position.every(Number.isFinite));
 }
 assert.throws(()=>sampleCinema(9,0));
 assert.throws(()=>sampleCinema(9,60));
});
test('afterfire is brief and f0-visible, not a permanent exhaust torch',()=>{
 assert.ok(afterfireAt(0)>.7);
 assert.ok(afterfireAt(.35)>.7);
 assert.equal(afterfireAt(2),0);
 assert.equal(afterfireAt(12),0);
 assert.ok(afterfireAt(15)>.7);
 assert.equal(afterfireAt(18),0);
 assert.ok(afterfireAt(23)>.7);
 assert.equal(afterfireAt(24),0);
 assert.ok(sampleCinema(0).throttle<.2);
 assert.ok(sampleCinema(300).throttle>.4);
});
test('portrait hero centre and three whole-car views stay in-frame across cuts',()=>{
 const spec=vehicleSpec('supercar'),aspect=9/16;
 for(const shot of CINEMA_SHOTS){
  for(const f of [shot.start,Math.floor((shot.start+shot.end-1)/2),shot.end-1]){
   const sampled=sampleCinema(f),view=sampled.camera;
   const camera=new T.PerspectiveCamera(view.fov,aspect,.025,600);
   camera.position.fromArray(view.position);
   camera.lookAt(new T.Vector3(...view.target));camera.updateMatrixWorld(true);
   const centre=new T.Vector3(...sampled.pose.position)
    .add(new T.Vector3(0,spec.height*.5,0)).project(camera);
   assert.ok(Math.abs(centre.x)<.60&&Math.abs(centre.y)<.60,shot.id+' centre is outside frame');
   if(['hook','launch','payoff'].includes(shot.id)){
    for(const x of [-spec.length/2,spec.length/2])for(const y of [.08,spec.height])
     for(const z of [-spec.width/2,spec.width/2]){
      const p=new T.Vector3(x,y,z).applyAxisAngle(new T.Vector3(0,1,0),sampled.pose.yaw)
       .add(new T.Vector3(...sampled.pose.position)).project(camera);
      assert.ok(Math.abs(p.x)<.99&&Math.abs(p.y)<.99,shot.id+' cropped vehicle');
     }
   }
  }
 }
});

test('planted vehicle load cues are finite, smooth and independent of shot cuts',()=>{
 let prev=sampleCinema(0),activeCorners=0;
 for(let f=1;f<750;f++){
  const now=sampleCinema(f);
  for(const key of ['longitudinalAcceleration','lateralAcceleration','curvature',
   'bodyPitch','bodyRoll','suspensionCompression']){
   assert.ok(Number.isFinite(now[key]),`frame ${f}: ${key} must be finite`);
  }
  assert.ok(Math.abs(now.bodyRoll)<=.044001,'body roll must stay planted');
  assert.ok(Math.abs(now.bodyPitch)<=.013001,'body pitch must stay planted');
  assert.ok(now.suspensionCompression>=.003&&now.suspensionCompression<=.022001,
   'tyre travel must not cause visibly floating vehicle');
  assert.ok(Math.abs(now.bodyRoll-prev.bodyRoll)<.025,'avoid per-frame sway snaps');
  assert.ok(Math.abs(now.suspensionCompression-prev.suspensionCompression)<.01,
   'avoid per-frame suspension jumps');
  assert.ok(now.distanceMeters>prev.distanceMeters,'rolling distance is monotonic');
  if(Math.abs(now.curvature)>.001)activeCorners++;
  if(now.shot.id!==prev.shot.id){
   assert.ok(Math.abs(now.bodyRoll-prev.bodyRoll)<.025,'camera cut cannot reset chassis state');
  }
  prev=now;
 }
 assert.ok(activeCorners>60,'driving route must contain visible corners');
});
test('cinematic camera dollies are genuine, deliberate and portrait-safe',()=>{
 const spec=vehicleSpec('supercar');
 let totalMotion=0;
 for(const shot of CINEMA_SHOTS){
  const a=sampleCinema(shot.start),b=sampleCinema(shot.end-1);
  // Camera position relative to the road/car must advance within shots, not be
  // glued to a frozen hero while scenery scrolls past.
  const relative=sample=>new T.Vector3(...sample.camera.position)
   .sub(new T.Vector3(...sample.pose.position))
   .applyAxisAngle(new T.Vector3(0,1,0),-sample.pose.yaw);
  const move=relative(a).distanceTo(relative(b));totalMotion+=move;
  assert.ok(move>.25,`${shot.id} is a frozen rigid chase camera`);
  for(const f of [shot.start,Math.floor((shot.start+shot.end-1)/2),shot.end-1]){
   const sample=sampleCinema(f);
   const cam=new T.PerspectiveCamera(sample.camera.fov,9/16,.025,600);
   cam.position.fromArray(sample.camera.position);
   cam.lookAt(new T.Vector3(...sample.camera.target));cam.updateMatrixWorld(true);
   const origin=new T.Vector3(...sample.pose.position)
    .add(new T.Vector3(0,spec.height/2,0)).project(cam);
   assert.ok(Math.abs(origin.x)<.55&&Math.abs(origin.y)<.55,
    `${shot.id} loses the actual driving supercar`);
   assert.ok(sample.camera.position[1]>sample.pose.position[1]+.9,
    `${shot.id} camera hit the tarmac`);
  }
 }
 assert.ok(totalMotion>5,'shots need significant cinematic movement');
 const first=sampleCinema(0),last=sampleCinema(749);
 assert.ok(first.afterfireDemand>.7,'hook must command the real exhaust effect at f0');
 assert.ok(last.speedMps>first.speedMps,'final payoff must be genuine accelerating motion');
});

test('hook prioritises actual exhaust and closing shot crosses behind the moving car',()=>{
 const hook=sampleCinema(0),hookEnd=sampleCinema(44);
 const closingStart=sampleCinema(555),closingEnd=sampleCinema(749);
 // Compare inverse-rotated camera displacement in vehicle coordinates:
 // f0 is a lower, tighter tailpipe inspection than earlier A3 baseline.
 const local=(v)=>new T.Vector3(...v.camera.position)
  .sub(new T.Vector3(...v.pose.position))
  .applyAxisAngle(new T.Vector3(0,1,0),-v.pose.yaw);
 const a=local(hook),b=local(hookEnd),c=local(closingStart),d=local(closingEnd);
 assert.ok(a.x< -6&&a.y<2.05&&a.z>3.2,'first frame should expose rear exhaust');
 assert.ok(b.x< -6.5&&b.z>2,'hero rear should remain clear through f44');
 assert.ok(c.z>3&&d.z< -2,'payoff camera must cross to opposite rear quarter');
 assert.ok(c.x< -6&&d.x< -6,'moving finale jib must never cut through the car');
 for(let i=556;i<750;i++){
  const cur=sampleCinema(i),prior=sampleCinema(i-1);
  const p=local(cur),q=local(prior);
  assert.ok(p.distanceTo(q)<.12,'final jib should be a smooth camera track, not a teleport');
  assert.ok(cur.speedMps>0,'car continues to physically travel through finale');
 }
});
