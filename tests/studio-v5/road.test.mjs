import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoad, sampleRoad, roadGeometry} from '../../src/yunex/studio-v5/road.ts';
test('road ribbon and sampled driving pose share elevation and bank',()=>{
 const road=createRoad({points:[[0,0,0],[30,2,4],[60,5,-8],[100,6,0]],width:8,bank:.05});
 const g=roadGeometry(road,-4,4,100);
 const p=g.attributes.position;
 for(let i=0;i<=100;i++){
  const pose=sampleRoad(road,road.length*i/100),left=new T.Vector3(p.getX(i*2),p.getY(i*2),p.getZ(i*2)),right=new T.Vector3(p.getX(i*2+1),p.getY(i*2+1),p.getZ(i*2+1));
  assert.ok(left.clone().add(right).multiplyScalar(.5).distanceTo(pose.position)<1e-4);
  assert.ok(Math.abs(left.distanceTo(right)-8)<1e-4);
  assert.ok(pose.forward.dot(pose.normal)<1e-7);
 }
});
test('samples clamp endpoints and reject invalid inputs',()=>{
 const road=createRoad({points:[[0,0,0],[20,0,0],[40,0,10]],width:7});
 assert.deepEqual(sampleRoad(road,-20).position.toArray(),sampleRoad(road,0).position.toArray());
 assert.throws(()=>sampleRoad(road,NaN),/finite/);
 for(const width of [0,-2,Infinity])assert.throws(()=>createRoad({points:[[0,0,0],[2,0,0]],width}),/width/);
 assert.throws(()=>createRoad({points:[[0,0,0],[0,0,0]],width:7}),/distinct/);
});
test('absolute samples are independent of seek order',()=>{
 const r=createRoad({points:[[0,0,0],[30,4,10],[60,0,0]],width:8});
 const first=sampleRoad(r,23).quaternion.toArray();sampleRoad(r,60);sampleRoad(r,2);
 assert.deepEqual(sampleRoad(r,23).quaternion.toArray(),first);
});
test('rough gravel ribbon and sampled wheel elevation remain shared',()=>{
 const r=createRoad({points:[[0,0,0],[50,0,0],[100,0,0]],width:6,roughness:.025});
 const g=roadGeometry(r,-3,3,400),a=g.attributes.position;
 for(let i=0;i<=400;i++){const centre=(a.getY(i*2)+a.getY(i*2+1))/2;assert.ok(Math.abs(centre-sampleRoad(r,i*r.length/400).position.y)<1e-6);}
 assert.throws(()=>createRoad({points:[[0,0,0],[50,0,0]],width:6,roughness:.2}),/roughness/);
});
