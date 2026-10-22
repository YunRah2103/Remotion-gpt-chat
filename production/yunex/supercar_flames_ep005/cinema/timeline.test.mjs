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
