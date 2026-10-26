import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRoad,sampleRoad} from '../../src/yunex/studio-v5/road.ts';
import {sampleStudioShot,resolveShot} from '../../src/yunex/studio-v5/shot.ts';
test('tracking shot keeps authored side after road rotation and absolute seeking',()=>{
 const road=createRoad({points:[[0,2,0],[0,7,100]],width:8});
 const get=f=>sampleStudioShot(road,35,f,30,{side:'left',height:3,distance:16});const a=get(75);get(210);assert.deepEqual(get(75),a);
 const pose=sampleRoad(road,35),delta=new T.Vector3(...a.position).sub(pose.position);assert.ok(delta.dot(pose.left)>8);assert.ok(delta.dot(pose.forward)>8);assert.ok(a.target[1]>pose.position.y);assert.ok(a.position.every(Number.isFinite));
 for(const value of [{side:'up'},{distance:2},{height:NaN},{orbit:3},{lookHeight:8},{engineerOnly:true}])assert.throws(()=>resolveShot(value),/shot|camera/i);
});
test('default structured camera preserves the existing V5 tracking path',()=>{
 const road=createRoad({points:[[0,0,0],[40,4,15],[100,9,-8]],width:8,bank:.03,roughness:.018});
 for(const frame of [0,75,120,239])for(const side of ['left','right']){
  const t=frame/30,d=35+frame/3,pose=sampleRoad(road,d),smooth=sampleRoad({...road,roughness:0},d),a=.78+.12*Math.sin(t*.32);
  const expected=new T.Vector3(Math.cos(a)*13.8,2.5+Math.sin(t*.35)*.18,(side==='left'?1:-1)*Math.sin(a)*13.8).applyQuaternion(smooth.quaternion).add(pose.position);
  const view=sampleStudioShot(road,d,frame,30,{side});assert.ok(new T.Vector3(...view.position).distanceTo(expected)<1e-10);
 }
});
