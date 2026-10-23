import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createEnvironment,sampleRoute} from '../../src/yunex/world-kit/environments.ts';
import {ENVIRONMENTS} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('every environment has reusable surface detail and distinct scenery layers',()=>{
 for(const kind of ENVIRONMENTS){const g=createEnvironment({kind,seed:12});let textured=0;g.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];textured+=mats.filter(m=>m.map?.isDataTexture).length;}});assert.ok(textured>0,`${kind} lacks procedural surface texture`);assert.ok(g.getObjectByName('environment-detail'),`${kind} lacks authored detail layer`);disposeObject(g);}
});
test('shared texture resources are disposed exactly once',()=>{
 const g=createEnvironment({kind:'highway'}),textures=new Set();g.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});assert.ok(textures.size>0);let count=0;textures.forEach(t=>t.addEventListener('dispose',()=>count++));disposeObject(g);assert.equal(count,textures.size);
});
test('upgraded scenery preserves the complete vehicle driving envelope',()=>{
 for(const kind of ENVIRONMENTS){const g=createEnvironment({kind,seed:12});g.updateMatrixWorld(true);const ray=new T.Raycaster();ray.near=0;ray.far=4.14;
  for(let d=-72;d<=72;d+=8){const pose=sampleRoute(kind,d);for(const side of [-1.4,0,1.4]){ray.set(new T.Vector3(pose.position[0]+Math.sin(pose.yaw)*side,4.2,pose.position[2]+Math.cos(pose.yaw)*side),new T.Vector3(0,-1,0));const hit=ray.intersectObject(g,true)[0];assert.equal(hit,undefined,`${kind}/${d}: ${hit?.object.name}`);}}
  disposeObject(g);
 }
});
test('airfield architectural headers attach to existing hangar fronts',()=>{
 const g=createEnvironment({kind:'airfield'}),headers=[],doors=[];g.traverse(o=>{if(o.name==='hangar-door-header')headers.push(o);if(o.name==='hangar-door')doors.push(o);});assert.equal(headers.length,doors.length);
 for(const header of headers){const door=doors.find(o=>o.position.x===header.position.x);assert.ok(door);assert.ok(Math.abs(header.position.z-door.position.z)<.1,'unsupported header outside hangar front');}
 disposeObject(g);
});
