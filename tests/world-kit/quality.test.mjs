import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../src/yunex/world-kit/motion.ts';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('tyres have rounded shoulders and preserve the rolling radius',()=>{
 for(const variant of ['saloon','sport-bike','box-truck']){
  const g=createVehicle({variant});const wheel=g.getObjectByName('wheel-roll');const tyre=wheel.getObjectByName('tyre');
  assert.ok(tyre,'named editable tyre mesh');
  const p=tyre.geometry.attributes.position;let maxR=0,edgeR=0,maxZ=0;
  for(let i=0;i<p.count;i++)maxZ=Math.max(maxZ,Math.abs(p.getZ(i)));
  for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getY(i));maxR=Math.max(maxR,r);if(Math.abs(p.getZ(i))>maxZ*.96)edgeR=Math.max(edgeR,r);}
  assert.ok(Math.abs(maxR-wheel.userData.radius)<.001);assert.ok(edgeR<maxR*.95,'shoulder curves inward');disposeObject(g);
 }
});
test('rotors rotate with wheels while calipers remain on the stationary axle',()=>{
 const g=createVehicle({variant:'coupe'});const roll=g.getObjectByName('wheel-roll'),rotor=roll.getObjectByName('brake-rotor'),caliper=roll.parent.getObjectByName('brake-caliper');
 assert.ok(rotor,'visible modelled rotor');assert.ok(caliper);
 g.updateMatrixWorld(true);const beforeRotor=rotor.getWorldQuaternion(new T.Quaternion()),beforeCaliper=caliper.getWorldQuaternion(new T.Quaternion());
 animateVehicle(g,.7);g.updateMatrixWorld(true);
 assert.ok(beforeRotor.angleTo(rotor.getWorldQuaternion(new T.Quaternion()))>.5);assert.ok(beforeCaliper.angleTo(caliper.getWorldQuaternion(new T.Quaternion()))<1e-6);disposeObject(g);
});
test('all upgraded vehicles stay within a reusable geometry budget',()=>{
 for(const s of VEHICLES){const g=createVehicle({variant:s.id});let vertices=0;g.traverse(o=>{if(o.isMesh)vertices+=o.geometry.attributes.position.count;});assert.ok(vertices<250000,`${s.id}: ${vertices}`);disposeObject(g);}
});

test('pickup bed floors remain open between their ribs',()=>{
 for(const variant of ['pickup','single-cab-pickup','crew-pickup']){
  const s=VEHICLES.find(s=>s.id===variant),g=createVehicle({variant});g.updateMatrixWorld(true);
  const floor=g.getObjectByName('bed-floor');const b=new T.Box3().setFromObject(floor,true);
  for(const t of [.2,.5,.8]){
   const x=T.MathUtils.lerp(b.min.x,b.max.x,t),ray=new T.Raycaster(new T.Vector3(x,2,s.width*.0375),new T.Vector3(0,-1,0),0,2);
   const hit=ray.intersectObject(g,true)[0];assert.equal(hit?.object.name,'bed-floor',`${variant} / ${t}: ${hit?.object.name} blocks bed`);
  }
  disposeObject(g);
 }
});

test('heavy-truck handles and seams sit against the cab skin',()=>{
 for(const variant of ['box-truck','tractor-truck']){
  const g=createVehicle({variant});g.updateMatrixWorld(true);const cab=new T.Box3().setFromObject(g.getObjectByName('cab'),true);
  g.traverse(o=>{if(!['cab-handle','cab-door-seam'].includes(o.name))return;const b=new T.Box3().setFromObject(o,true);const gap=b.getCenter(new T.Vector3()).z>0?b.min.z-cab.max.z:cab.min.z-b.max.z;assert.ok(gap<.008,`${variant} ${o.name} floats ${gap}m`);});disposeObject(g);
 }
});
test('the three-door compact has handles only for its two passenger doors',()=>{
 const g=createVehicle({variant:'compact'});let count=0;g.traverse(o=>{if(o.name==='door-handle'||o.name==='rear-door-handle')count++;});assert.equal(count,2);disposeObject(g);
});
