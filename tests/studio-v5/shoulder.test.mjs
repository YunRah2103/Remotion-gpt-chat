import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRoad,sampleRoad} from '../../src/yunex/studio-v5/road.ts';
import {createShoulderGeometry} from '../../src/yunex/studio-v5/shoulder.ts';
test('natural shoulders share the road edge and settle onto the terrain on both sides',()=>{
 const road=createRoad({points:[[0,0,0],[30,3,10],[80,7,-10]],width:7,bank:.06});
 const height=(x,z)=>-.2+x*.015+z*.01;
 for(const side of [-1,1]){
  const geo=createShoulderGeometry(road,side,height,'gravel',100),p=geo.getAttribute('position'),uv=geo.getAttribute('uv');
  let minWidth=Infinity,maxWidth=0;
  for(let i=0;i<=100;i++){
   const edge=sampleRoad(road,road.length*i/100,side*road.width/2).position,inner=new T.Vector3().fromBufferAttribute(p,i*3),outer=new T.Vector3().fromBufferAttribute(p,i*3+2);
   assert.ok(inner.distanceTo(edge)<.004,'no exposed road/shoulder seam');assert.ok(Math.abs(outer.y-height(outer.x,outer.z))<.004,'outer verge meets terrain');
   const width=Math.hypot(outer.x-edge.x,outer.z-edge.z);minWidth=Math.min(minWidth,width);maxWidth=Math.max(maxWidth,width);assert.ok(Number.isFinite(uv.getX(i*3)));
  }
  assert.ok(maxWidth-minWidth>.15,'irregular verge silhouette rather than repeated constant ribbon');
  for(const v of geo.getAttribute('normal').array)assert.ok(Number.isFinite(v));
 }
});
test('terrain placement height follows visible triangles, including between grid vertices',async()=>{
 const {createTerrain}=await import('../../src/yunex/studio-v5/terrain.ts');const road=createRoad({points:[[0,0,0],[40,7,20],[100,12,-20]],width:7,bank:.05}),terrain=createTerrain(road,'mountain');terrain.mesh.updateMatrixWorld(true);
 for(const d of [15,33,60,90])for(const side of [-1,1]){const p=sampleRoad(road,d,side*4.2).position,ray=new T.Raycaster(new T.Vector3(p.x,100,p.z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(terrain.mesh)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-terrain.height(p.x,p.z))<.001,'scenery/verge samples must lie on the rendered terrain');}
});
