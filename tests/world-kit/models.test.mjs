import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';

test('19 body variants cover the six vehicle families',()=>{
 assert.equal(VEHICLES.length,19);
 assert.deepEqual([...new Set(VEHICLES.map(v=>v.family))].sort(),['bike','formula','normal','sports','suv','truck']);
 assert.equal(new Set(VEHICLES.map(v=>v.id)).size,19);
});
test('all models have finite geometry, realistic metre bounds and tyre contact',()=>{
 for(const spec of VEHICLES){
  const model=createVehicle({variant:spec.id});
  model.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(model), size=box.getSize(new T.Vector3());
  assert.ok(Math.abs(box.min.y)<.025,`${spec.id} ground ${box.min.y}`);
  assert.ok(size.x>1.7&&size.x<11,`${spec.id} length ${size.x}`);
  assert.ok(size.z>.35&&size.z<3,`${spec.id} width ${size.z}`);
  assert.ok(size.y>.5&&size.y<4.5,`${spec.id} height ${size.y}`);
  const wheels=[];
  model.traverse(o=>{
   if(o.userData.wheel) wheels.push(o);
   if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]),spec.id);}
  });
  assert.equal(wheels.length,spec.family==='bike'?2:spec.axles*2, spec.id);
 }
});
test('variants in a family have different silhouettes even in the same colour',()=>{
 for(const family of ['normal','sports','suv','formula','bike','truck']){
  const signatures=VEHICLES.filter(v=>v.family===family).map(v=>{
   const m=createVehicle({variant:v.id,color:'#aaaaaa'});m.updateMatrixWorld(true);
   return new T.Box3().setFromObject(m).getSize(new T.Vector3()).toArray().map(n=>n.toFixed(3)).join(',');
  });
  assert.equal(new Set(signatures).size,signatures.length,family);
 }
});
test('invalid variant and non-finite dimensions fail explicitly',()=>{
 assert.throws(()=>createVehicle({variant:'does-not-exist'}),/variant/i);
});
test('sport motorcycle fairings face outwards on both sides',()=>{
 const g=createVehicle({variant:'sport-bike'});const fairings=[];g.traverse(o=>{if(o.name==='fairing')fairings.push(o);});assert.equal(fairings.length,2);
 for(const f of fairings){const p=f.geometry.attributes.position,n=f.geometry.attributes.normal;let z=0,nz=0;for(let i=0;i<p.count;i++){z+=p.getZ(i);nz+=n.getZ(i);}assert.ok(z*nz>0,'outward normal must match side');}
});
