import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('GT lamps have recessed three-dimensional optics, separate from the body shell',()=>{
 const car=createCinematicVehicle({variant:'grand-tourer',bodyDetail:'fleet',optimize:false});
 const optics=[];car.traverse(o=>{if(o.name==='headlamp-projector')optics.push(o);});
 assert.equal(optics.length,4);
 for(const optic of optics){const b=new T.Box3().setFromObject(optic);assert.ok(b.getSize(new T.Vector3()).x>.02);}
 assert.ok(car.getObjectByName('bonnet-shut-line'));
 assert.ok(car.getObjectByName('rear-diffuser-fin'));
 disposeObject(car);
});
test('road greenhouse has a structural divider and painted quarter sail instead of uninterrupted side glass',()=>{
 const car=createCinematicVehicle({variant:'grand-tourer',bodyDetail:'fleet',optimize:false});
 assert.ok(car.getObjectByName('b-pillar'));
 const sail=car.getObjectByName('quarter-sail');assert.ok(sail);
 assert.ok(new T.Box3().setFromObject(sail).getSize(new T.Vector3()).x>.1);
 const glass=car.getObjectByName('side-glass');assert.equal(glass.material.side,T.FrontSide);
 disposeObject(car);
});
test('GT and rally receive different intake architecture and genuine side vent apertures',()=>{
 for(const [variant,face] of [['grand-tourer','gt'],['rally-hatch','rally']]){
  const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false});
  assert.equal(car.getObjectByName('radiator-recess').userData.fasciaFamily,face);
  const vent=car.getObjectByName('side-intake-recess');assert.ok(vent);
  car.updateMatrixWorld(true);const b=new T.Box3().setFromObject(vent),p=b.getCenter(new T.Vector3());
  const ray=new T.Raycaster(new T.Vector3(p.x+1,p.y,p.z),new T.Vector3(-1,0,0));
  const hit=ray.intersectObject(car.getObjectByName('arched-body')).find(x=>x.point.x>p.x+.03);
  assert.equal(hit,undefined,'side intake must not be backed by uncut bodywork');
  disposeObject(car);
 }
});
test('GT roof has curved plan-view ends rather than a rectangular slab',()=>{
 const car=createCinematicVehicle({variant:'grand-tourer',bodyDetail:'fleet',optimize:false});
 const p=car.getObjectByName('roof').geometry.attributes.position;
 let frontCentre=-Infinity,frontCorner=-Infinity;
 for(let i=0;i<p.count;i++){
  if(Math.abs(p.getZ(i))<.03)frontCentre=Math.max(frontCentre,p.getX(i));
  if(Math.abs(p.getZ(i))>.60)frontCorner=Math.max(frontCorner,p.getX(i));
 }
 assert.ok(frontCentre>frontCorner+.025,'roof corners must sweep back from the centre');
 disposeObject(car);
});
test('GT corner intakes stay inside the tapered nose width',()=>{
 const car=createCinematicVehicle({variant:'grand-tourer',bodyDetail:'fleet',optimize:false});
 car.updateMatrixWorld(true);
 car.traverse(o=>{if(o.name==='side-intake-surround'){
  const b=new T.Box3().setFromObject(o);
  assert.ok(Math.max(Math.abs(b.min.z),Math.abs(b.max.z))<1.94*.415,'intake frame must fit within the front body width');
 }});
 disposeObject(car);
});
test('wide utility and muscle fascias keep their central and corner intake frames separate',()=>{
 for(const variant of ['long-suv','muscle-coupe']){
  const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false});car.updateMatrixWorld(true);
  const main=new T.Box3().setFromObject(car.getObjectByName('sculpted-intake-surround'));
  car.traverse(o=>{if(o.name==='side-intake-surround'){
   const corner=new T.Box3().setFromObject(o);
   assert.ok(corner.min.z>main.max.z||corner.max.z<main.min.z,'intake frames must not intersect');
  }});disposeObject(car);
 }
});
