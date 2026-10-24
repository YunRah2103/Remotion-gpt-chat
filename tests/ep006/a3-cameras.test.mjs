import assert from 'node:assert/strict';
import test from 'node:test';
import {EP006_CAMERA_SHOTS,cameraShotAt,sampleEp006Camera} from '../../src/yunex/ep006/cameras/shot-motion.ts';
const wheels=Object.fromEntries(['front-left','front-right','rear-left','rear-right'].map(k=>[k,{compressionM:0,steerRad:0,spinRad:0,contact:true,surfaceHeightM:0}]));
const pose=(frame,positionM=[0,0,0],phase='driving')=>({frame,timeSeconds:frame/30,positionM,rotationRad:[0,0,0],velocityMps:[21,0,0],wheels,phase,jumpId:null,impact01:0,dust01:0,gravel01:0});
test('all shots cover exact provisional duration with no gap or overlap',()=>{
 assert.equal(EP006_CAMERA_SHOTS[0].start,0);
 assert.equal(EP006_CAMERA_SHOTS.at(-1).end,810);
 for(let i=0;i<EP006_CAMERA_SHOTS.length;i++){
  const s=EP006_CAMERA_SHOTS[i];assert.ok(s.end>s.start);
  if(i)assert.equal(s.start,EP006_CAMERA_SHOTS[i-1].end);
  assert.equal(cameraShotAt(s.start).id,s.id);
  assert.equal(cameraShotAt(s.end-1).id,s.id);
 }
 for(const f of [-1,810,1.5])assert.throws(()=>cameraShotAt(f));
});
test('absolute pose translates camera and target without altering choreography',()=>{
 const a=sampleEp006Camera(22,pose(22),{terrainHeightM:()=>-1});
 const b=sampleEp006Camera(22,pose(22,[10,3,-7]),{terrainHeightM:()=>-1});
 for(let k=0;k<3;k++)assert.ok(Math.abs((b.position[k]-a.position[k])-[10,3,-7][k])<1e-6);
 assert.deepEqual(a,sampleEp006Camera(22,pose(22),{terrainHeightM:()=>-1}));
});
test('deterministic finite camera coverage for all 810 frames',()=>{
 for(let f=0;f<810;f++){
  const p=pose(f,[f*.01,(f<74?2:0),0],f<74?'airborne':'driving');
  const camera=sampleEp006Camera(f,p,{terrainHeightM:()=>0});
  assert.ok([...camera.position,...camera.target,camera.fov,camera.clearanceM].every(Number.isFinite),String(f));
  assert.ok(camera.fov>=35&&camera.fov<60,String(f));
  assert.ok(camera.clearanceM>=.22-.0001,String(f));
  assert.ok(camera.vehicleFrameWidth01>0&&camera.vehicleFrameWidth01<=1,String(f));
 }
});
test('portrait fit pushes camera out for wider body and avoids camera intersection',()=>{
 const p=pose(45,[5,2,4],'airborne');
 const small=sampleEp006Camera(45,p,{terrainHeightM:()=>0,vehicleBoundsM:{length:4.25,width:1.94,height:1.52}});
 const large=sampleEp006Camera(45,p,{terrainHeightM:()=>0,vehicleBoundsM:{length:6.8,width:2.4,height:1.9}});
 assert.ok(Math.hypot(...large.position.map((x,i)=>x-large.target[i]))>Math.hypot(...small.position.map((x,i)=>x-small.target[i])));
});
test('camera rejects mismatched and nonfinite pose samples',()=>{
 assert.throws(()=>sampleEp006Camera(10,pose(11)));
 assert.throws(()=>sampleEp006Camera(10,pose(10,[NaN,0,0])));
});
