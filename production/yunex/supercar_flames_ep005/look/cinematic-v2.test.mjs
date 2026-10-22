import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {createEP005NightCircuit} from "./NightCircuit.ts";
import {createEP005CinematicNightCircuit,sampleEP005CinematicRoute} from "./CinematicNight.ts";
import {sampleEP005Route,EP005_ROUTE} from "./route.ts";
import {disposeObject} from "../../../../src/yunex/world-kit/geometry.ts";
test("Cinematic A4 V2 uses A3 closed track position and yaw on repeated laps",()=>{
 assert.equal(EP005_ROUTE.kind,"track");
 const lap=EP005_ROUTE.lapMetres;
 for(const d of [55,58,90,lap-.04,lap+.04,lap*3+74]){
  assert.deepEqual(sampleEP005CinematicRoute(d),sampleEP005Route(d));
  const a=sampleEP005Route(d),b=sampleEP005CinematicRoute(d+lap);
  assert.ok(new T.Vector3(...a.position).distanceTo(new T.Vector3(...b.position))<.0001);
 }
});
test("Road vertices not touched; studio architecture outside 12m camera corridor",()=>{
 const base=createEP005NightCircuit({premium:true}),v2=createEP005CinematicNightCircuit();
 try{
  const road=base.getObjectByName("circuit-asphalt"),next=v2.getObjectByName("circuit-asphalt");
  assert.ok(road?.isMesh&&next?.isMesh);
  const p=road.geometry.getAttribute("position"),q=next.geometry.getAttribute("position");
  assert.equal(p.count,q.count);
  for(let i=0;i<p.count;i++)
   assert.ok(Math.abs(p.getX(i)-q.getX(i))<1e-6&&Math.abs(p.getY(i)-q.getY(i))<1e-6&&Math.abs(p.getZ(i)-q.getZ(i))<1e-6);
  const group=v2.getObjectByName("ep005-v2-environment");
  assert.ok(group?.userData.routeMeshUnchanged);
  assert.equal(group.userData.clearCameraNormalToMetres,12);
  assert.ok(group.userData.minArchitectureNormalMetres>19);
  for(const name of ["ep005-v2-twilight-gradient-sky","ep005-v2-pit-building-walls","ep005-v2-armco-posts","ep005-v2-rubber-accumulation"])
   assert.ok(v2.getObjectByName(name),name);
  assert.equal(v2.userData.ep005CinemaV2.route,"track");
  assert.equal(group.userData.noFakeFlames,true);
 }finally{disposeObject(base);disposeObject(v2);}
});
