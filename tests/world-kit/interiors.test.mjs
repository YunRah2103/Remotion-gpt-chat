import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {VEHICLES,ENVIRONMENTS} from '../../src/yunex/world-kit/catalog.ts';import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';import {interiorLayout,interiorCamera} from '../../src/yunex/world-kit/interiors.ts';import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('expanded kit contains 35 vehicles and 20 environments',()=>{assert.equal(VEHICLES.length,35);assert.equal(ENVIRONMENTS.length,20);});
test('every enclosed vehicle has a fitted modelled interior and driver controls',()=>{
 for(const s of VEHICLES.filter(s=>s.family!=='bike'&&s.family!=='formula')){const g=createVehicle({variant:s.id});for(const name of ['interior','front-seat-left','front-seat-right','dashboard','steering-wheel','pedals','console','door-panel-left','door-panel-right'])assert.ok(g.getObjectByName(name),`${s.id}/${name}`);g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g.getObjectByName('interior'),true);assert.ok(b.min.z>=-s.width*.49&&b.max.z<=s.width*.49,s.id);assert.ok(b.max.y<s.height+.02,s.id);disposeObject(g);}
});
test('driver view is inside the cabin and looks through an unobstructed windscreen',()=>{
 for(const id of ['saloon','supercar','boxy-suv','panel-van','box-truck']){const g=createVehicle({variant:id});g.updateMatrixWorld(true);const spec=VEHICLES.find(s=>s.id===id),view=interiorCamera(spec);const direction=new T.Vector3(...view.target).sub(new T.Vector3(...view.position)).normalize();const ray=new T.Raycaster(new T.Vector3(...view.position),direction,.03,3);const hits=ray.intersectObject(g,true).filter(h=>!String(h.object.name).includes('glass')&&!['windshield','windscreen','roof-liner'].includes(h.object.name));assert.equal(hits.length,0,`${id}: camera blocked by ${hits[0]?.object.name}`);disposeObject(g);}
});
test('cutaway and optional interior preserve a reusable full exterior model',()=>{const a=createVehicle({variant:'saloon',cutaway:true});assert.equal(a.getObjectByName('roof').visible,false);assert.ok(a.getObjectByName('interior').visible);const b=createVehicle({variant:'saloon',interior:false});assert.equal(b.getObjectByName('interior'),undefined);disposeObject(a);disposeObject(b);});
test('truck cutaways remove the cab roof while full models keep it',()=>{
 const a=createVehicle({variant:'box-truck',cutaway:true}),b=createVehicle({variant:'box-truck'});a.updateMatrixWorld(true);b.updateMatrixWorld(true);
 const s=VEHICLES.find(v=>v.id==='box-truck'),l=interiorLayout(s),origin=new T.Vector3(l.frontSeat,5,0),direction=new T.Vector3(0,-1,0);const ray=new T.Raycaster(origin,direction,0,3.3);
 assert.equal(ray.intersectObject(a.getObjectByName('cab'),true).length,0);assert.ok(ray.intersectObject(b.getObjectByName('cab'),true).length>0);disposeObject(a);disposeObject(b);
});

test('seat headrests fit inside the sloping rear glass on every cabin',()=>{
 for(const s of VEHICLES.filter(s=>s.family!=='bike'&&s.family!=='formula')){const g=createVehicle({variant:s.id});g.updateMatrixWorld(true);const l=interiorLayout(s);g.traverse(o=>{if(o.name!=='headrest')return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y<=l.belt)continue;const t=T.MathUtils.clamp((v.y-l.belt)/(l.roof-l.belt),0,1),rear=l.rearBase+(l.rearRoof-l.rearBase)*t;assert.ok(v.x>=rear-.005,`${s.id}: headrest crosses rear glass by ${rear-v.x}`);}});disposeObject(g);}
});
test('passenger seating matches the specified capacity',()=>{
 for(const id of ['saloon','minivan','long-suv','crew-pickup']){const s=VEHICLES.find(v=>v.id===id),g=createVehicle({variant:id});let count=0;g.traverse(o=>{if(o.isGroup&&/^(front|rear|third)-seat-/.test(o.name))count++;});assert.equal(count,s.seats??5,id);disposeObject(g);}
});
