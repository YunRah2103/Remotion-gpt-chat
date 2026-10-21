import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as studio from '../../src/yunex/modelling-kit/driving.ts';
import {sampleRoute} from '../../src/yunex/world-kit/environments.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';

test('acceleration integrates speed without discontinuities and is frame-rate independent',()=>{
 assert.equal(typeof studio.drivingState,'function');
 const a=studio.drivingState('acceleration',90,30),b=studio.drivingState('acceleration',180,60);
 assert.equal(a.distance,b.distance);assert.ok(a.distance>studio.drivingState('acceleration',89,30).distance);
 assert.ok(a.distance<studio.drivingState('acceleration',91,30).distance);
 assert.equal(studio.drivingState('acceleration',-30,30).distance,0);
 assert.throws(()=>studio.drivingState('acceleration',1,0));
});
test('braking reaches a true stop and does not restart after six seconds',()=>{
 const a=studio.drivingState('braking',180,30),b=studio.drivingState('braking',300,30);assert.equal(a.distance,b.distance);
 assert.equal(a.speed,0);assert.equal(b.speed,0);
});
test('route camera follows vehicle tangent and keeps entire hero inside portrait overview frustum',()=>{
 const spec=vehicleSpec('supercar');
 for(const distance of [0,20,50,100]){
  const pose=sampleRoute('track',distance),shot=studio.drivingCamera('tracking',pose,spec,9/16,1);
  const camera=new T.PerspectiveCamera(shot.fov,9/16,.05,400);camera.position.set(...shot.position);camera.lookAt(...shot.target);camera.updateMatrixWorld();
  const rot=new T.Matrix4().makeRotationY(pose.yaw);
  for(const x of [-spec.length/2,spec.length/2])for(const y of [0,spec.height])for(const z of [-spec.width/2,spec.width/2]){
   const p=new T.Vector3(x,y,z).applyMatrix4(rot).add(new T.Vector3(...pose.position)).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.9,`${distance}: ${p.toArray()}`);
  }
 }
});
test('all reusable shots seek deterministically and reject invalid parameters',()=>{
 const pose=sampleRoute('highway',15),spec=vehicleSpec('hot-hatch');
 for(const name of ['tracking','chase','wheel','interior','onboard','overhead','reveal']){
  const a=studio.drivingCamera(name,pose,spec,9/16,3),b=studio.drivingCamera(name,pose,spec,9/16,3);assert.deepEqual(a,b);assert.ok([...a.position,...a.target,a.fov].every(Number.isFinite));
 }
 assert.throws(()=>studio.drivingCamera('tracking',pose,spec,0,0));
});
