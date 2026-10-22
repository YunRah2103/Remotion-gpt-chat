import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {EP005_ROUTE,previewDistance,sampleEP005Route,trackPoint} from "./route.ts";
import {createEP005NightCircuit} from "./NightCircuit.ts";
import {disposeObject} from "../../../../src/yunex/world-kit/geometry.ts";
test("A3/A4 canonical V3 closed-loop track has continuous position/yaw and absolute distance",()=>{
 assert.equal(EP005_ROUTE.kind,"track");assert.equal(EP005_ROUTE.roadY,0);
 const len=EP005_ROUTE.lapMetres;assert.ok(len>180);
 for(const d of [-17,0,1,13,90,len-.01,len,len+.01,len*2+42]){
  const p=sampleEP005Route(d),q=sampleEP005Route(d+len);
  assert.ok(p.position.every(Number.isFinite));assert.ok(Number.isFinite(p.yaw));
  assert.equal(p.position[1],0);
  assert.ok(new T.Vector3(...p.position).distanceTo(new T.Vector3(...q.position))<.0005,"loop should repeat");
 }
 const a=sampleEP005Route(len-.01),b=sampleEP005Route(len+.01);
 assert.ok(new T.Vector3(...a.position).distanceTo(new T.Vector3(...b.position))<.1,"lap seam motion continuous");
 assert.equal(previewDistance(0),18);assert.equal(previewDistance(180),90);
 assert.throws(()=>sampleEP005Route(Infinity),/finite/);
});
test("Night circuit uses existing V3 track and off-road instanced fixtures",()=>{
 const b=createEP005NightCircuit({premium:false}),p=createEP005NightCircuit({premium:true});
 try{
  const road=b.getObjectByName("circuit-asphalt"),roadAfter=p.getObjectByName("circuit-asphalt");
  assert.ok(road&&roadAfter,"V3 track road remains present");
  assert.equal(road.geometry.attributes.position.count,roadAfter.geometry.attributes.position.count);
  for(const id of ["ep005-premium-environment","ep005-track-lamp-masts","ep005-paddock-canopy-roofs","ep005-barrier-retroreflectors"])
   assert.ok(p.getObjectByName(id),id);
  assert.equal(p.userData.ep005.route.kind,"track");
  assert.equal(p.getObjectByName("ep005-premium-environment").userData.routeMeshUnchanged,true);
  const lights=p.getObjectByName("ep005-track-lamp-masts");
  assert.ok(lights.isInstancedMesh);
  const expected=[];
  for(let i=0;i<12;i++)for(const side of [-1,1])
   expected.push(trackPoint(EP005_ROUTE.lapMetres*(i+.07)/12,side*20.8,3.55).position);
  assert.equal(lights.count,expected.length);
  for(let i=0;i<lights.count;i++){
   const m=new T.Matrix4();lights.getMatrixAt(i,m);
   const x=m.elements[12],y=m.elements[13],z=m.elements[14];
   assert.ok(Math.hypot(x-expected[i][0],y-expected[i][1],z-expected[i][2])<1e-4,
    "tall props follow actual route normals");
  }
 }finally{disposeObject(b);disposeObject(p);}
});
