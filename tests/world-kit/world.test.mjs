import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {VEHICLES,ENVIRONMENTS} from '../../src/yunex/world-kit/catalog.ts';
import {createEnvironment,sampleRoute,routeLength} from '../../src/yunex/world-kit/environments.ts';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle,placeVehicle} from '../../src/yunex/world-kit/motion.ts';
test('all 57 pairings use a finite route, consistent scale and ground plane',()=>{
 for(const env of ENVIRONMENTS){
 const e=createEnvironment({kind:env,seed:42});assert.ok(e.children.length>0);
 for(const v of VEHICLES){const car=createVehicle({variant:v.id});const pose=sampleRoute(env,15);placeVehicle(car,pose);animateVehicle(car,15,.12);car.updateMatrixWorld(true);const b=new T.Box3().setFromObject(car,true);assert.ok(Math.abs(b.min.y)<.025,`${env}/${v.id}: ${b.min.y}`);assert.ok(v.width<3);assert.ok(pose.position.every(Number.isFinite));}
 }
});
test('closed circuit loops seamlessly and exposes a normalized heading',()=>{
 const l=routeLength('track'),a=sampleRoute('track',0),b=sampleRoute('track',l);assert.deepEqual(a,b);
 for(let i=0;i<100;i++){const p=sampleRoute('track',i*l/100);assert.ok(Number.isFinite(p.yaw));}
 assert.deepEqual(sampleRoute('track',-5),sampleRoute('track',l-5));
});
test('wheel movement is deterministic, reverses and does not accumulate drift',()=>{
 const car=createVehicle({variant:'coupe'});animateVehicle(car,12,.2);const w=[];car.traverse(o=>{if(o.userData.wheel)w.push(o);});const a=w.map(o=>o.rotation.z);animateVehicle(car,12,.2);assert.deepEqual(w.map(o=>o.rotation.z),a);animateVehicle(car,-12,-.2);w.forEach((o,i)=>assert.equal(o.rotation.z,-a[i]));
 const steer=[];car.traverse(o=>{if(o.userData.steering)steer.push(o.rotation.y);});assert.ok(steer.every(x=>x===-.2));
});
test('city layout is repeatable by seed and changes with another seed',()=>{
 const layout=seed=>{const g=createEnvironment({kind:'city',seed});const out=[];g.traverse(o=>{if(o.isInstancedMesh)out.push(...o.instanceMatrix.array);});return out;};assert.deepEqual(layout(7),layout(7));assert.notDeepEqual(layout(7),layout(8));
});
test('invalid environment and non-finite motion inputs are rejected',()=>{
 assert.throws(()=>createEnvironment({kind:'bad'}),/environment/i);assert.throws(()=>sampleRoute('track',NaN),/finite/i);assert.throws(()=>animateVehicle(createVehicle({variant:'saloon'}),Infinity),/finite/i);
});
