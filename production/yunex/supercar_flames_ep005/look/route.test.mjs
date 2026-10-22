import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {EP005_ROUTE,previewDistance,sampleEP005Route} from "./route.ts";
import {createEP005NightBoulevard} from "./NightBoulevard.ts";
import {disposeObject} from "../../../../src/yunex/world-kit/geometry.ts";
test("EP005 road is single V3 +X sampler, flat tyre plane, no wrap",()=>{
  assert.equal(EP005_ROUTE.kind,"city");assert.equal(EP005_ROUTE.roadY,0);
  let last=-Infinity;
  for(let d=-78;d<=76;d+=2){
    const p=sampleEP005Route(d);
    assert.ok(p.position[0]>last,"x must monotonically increase");last=p.position[0];
    assert.equal(p.position[1],0);assert.equal(p.position[2],-1.85);assert.equal(p.yaw,0);
  }
  assert.throws(()=>sampleEP005Route(91),/outside reviewed/);
  assert.equal(previewDistance(0),-48);
  assert.equal(previewDistance(180),24);
});
test("EP005 premium adds own named instanced parts without replacing V3 boulevard",()=>{
 const b=createEP005NightBoulevard({premium:false}),p=createEP005NightBoulevard({premium:true});
 try{
  const before=b.getObjectByName("boulevard"),after=p.getObjectByName("boulevard");
  assert.ok(before&&after,"underlying V3 city asphalt preserved");
  assert.equal(before.geometry.attributes.position.count,after.geometry.attributes.position.count);
  assert.ok(p.getObjectByName("ep005-premium-environment"));
  assert.ok(p.getObjectByName("ep005-tunnel-portal-heads"));
  assert.ok(p.getObjectByName("ep005-lamp-warm-luminaires"));
  for(const n of ["ep005-lamp-masts","ep005-road-reflectors","ep005-tunnel-portal-columns"]){
    const obj=p.getObjectByName(n);assert.ok(obj?.isInstancedMesh,n);
  }
  const road=p.getObjectByName("ep005-edge-markings");
  for(let i=0;i<road.count;i++){
    const m=new T.Matrix4();road.getMatrixAt(i,m);
    assert.ok(Math.abs(m.elements[14])>=5.6,"road stripes outside car lane");
  }
  assert.equal(p.userData.ep005.route.canonicalSampler,"sampleRoute('city', metres)");
 }finally{disposeObject(b);disposeObject(p);}
});
