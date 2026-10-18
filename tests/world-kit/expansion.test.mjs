import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {ENVIRONMENTS,VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {ENVIRONMENT_CATALOG,environmentSpec} from '../../src/yunex/world-kit/world-catalog.ts';
import {PROP_KINDS,createProp} from '../../src/yunex/world-kit/props.ts';
import {createEnvironment,sampleRoute} from '../../src/yunex/world-kit/environments.ts';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {placeVehicle} from '../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('15 environments include distinct roads and stationary sets',()=>{
 assert.equal(ENVIRONMENTS.length,15);assert.equal(ENVIRONMENT_CATALOG.length,15);assert.equal(new Set(ENVIRONMENTS).size,15);
 for(const id of ENVIRONMENTS){const spec=environmentSpec(id);assert.ok(spec.label);assert.ok(['drive','display'].includes(spec.mode));}
 assert.equal(environmentSpec('showroom').mode,'display');assert.equal(environmentSpec('garage').mode,'display');
});
test('14 reusable props have finite geometry and correct ground contact',()=>{
 assert.equal(PROP_KINDS.length,14);
 for(const kind of PROP_KINDS){const p=createProp({kind});p.updateMatrixWorld(true);const b=new T.Box3().setFromObject(p,true);assert.ok(Math.abs(b.min.y)<.025,`${kind}: ${b.min.y}`);p.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n),kind);}});disposeObject(p);}
 assert.throws(()=>createProp({kind:'fake'}),/prop/i);
});
test('all 285 vehicle/world pairs share a finite ground-level pose',()=>{
 let pairs=0;for(const kind of ENVIRONMENTS){const e=createEnvironment({kind,seed:17});assert.ok(e.children.length>0);for(const v of VEHICLES){const g=createVehicle({variant:v.id});placeVehicle(g,sampleRoute(kind,-25));g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g,true);assert.ok(Math.abs(b.min.y)<.025,`${kind}/${v.id}`);pairs++;disposeObject(g);}disposeObject(e);}assert.equal(pairs,285);
});
test('new scenic routes follow curved road centres and stage sets stay parked',()=>{
 for(const kind of ['coast','mountain','forest','desert','snow']){const a=sampleRoute(kind,-40),b=sampleRoute(kind,20);assert.notEqual(a.position[2],b.position[2],kind);assert.ok(Math.abs(a.position[2])<12);}
 for(const kind of ['showroom','garage'])assert.deepEqual(sampleRoute(kind,0),sampleRoute(kind,60));
});
test('new scenes are repeatable by seed',()=>{
 const signature=e=>{const arr=[];e.updateMatrixWorld(true);e.traverse(o=>{if(o.isMesh){arr.push(o.name,...o.position.toArray());if(o.isInstancedMesh)arr.push(...o.instanceMatrix.array);}});return arr;};
 for(const kind of ENVIRONMENTS.slice(3)){const a=createEnvironment({kind,seed:5}),b=createEnvironment({kind,seed:5});assert.deepEqual(signature(a),signature(b),kind);disposeObject(a);disposeObject(b);}
});
test('new world routes have a clear corridor for the widest and tallest vehicle',()=>{
 const ray=new T.Raycaster();ray.near=0;ray.far=4.14;
 for(const kind of ENVIRONMENTS.slice(3)){
  const g=createEnvironment({kind,seed:12});g.updateMatrixWorld(true);
  for(let d=-60;d<=60;d+=12){const pose=sampleRoute(kind,d);for(const side of [-1.35,0,1.35]){const x=pose.position[0]+Math.sin(pose.yaw)*side,z=pose.position[2]+Math.cos(pose.yaw)*side;ray.set(new T.Vector3(x,4.2,z),new T.Vector3(0,-1,0));const hits=ray.intersectObject(g,true);assert.equal(hits.length,0,`${kind} at ${d}, offset ${side} obstructed by ${hits[0]?.object.name}`);}}
  disposeObject(g);
 }
});
test('disposing an environment releases instanced GPU buffers as well as geometry',()=>{
 const g=createEnvironment({kind:'forest'});let instances=0,disposed=0;
 g.traverse(o=>{if(o.isInstancedMesh){instances++;o.addEventListener('dispose',()=>disposed++);}});
 assert.ok(instances>0);disposeObject(g);assert.equal(disposed,instances);
});
