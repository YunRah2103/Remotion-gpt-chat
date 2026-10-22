import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {bodyTop,bodyHalfWidth} from '../../src/yunex/world-kit/vehicle-body.ts';
import {interiorLayout} from '../../src/yunex/world-kit/interiors.ts';
import {coachworkField} from '../../src/yunex/modelling-kit/coachwork.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('coachwork gives bonnet a continuous crown and preserves the arch envelope',()=>{
 for(const variant of ['hot-hatch','supercar','crossover','panel-van','pickup']){
  const s=vehicleSpec(variant),l=interiorLayout(s),x=(l.frontBase+s.length/2-.2)/2,y=bodyTop(s,x);
  const centre=new T.Vector3(x,y+.04,0),edge=new T.Vector3(x,y,bodyHalfWidth(s,x,y)*.85);
  assert.ok(coachworkField(centre.clone(),s).y-centre.y>.006,variant+' bonnet crown');
  for(const offset of [-1,-.5,0,.5,1]){
   const arch=new T.Vector3(s.wheelbase/2+offset*s.radius,s.radius*1.8,s.width/2);
   assert.ok(coachworkField(arch.clone(),s).distanceTo(arch)<1e-7,variant+' arch clearance');
  }
  const a=coachworkField(edge.clone(),s),b=coachworkField(edge.clone().add(new T.Vector3(.0001,0,0)),s);
  assert.ok(a.distanceTo(b)<.001,'no shoulder discontinuity');
 }
});
test('hero lamps retain recessed apertures and new coachwork remains reversible under damage/cutaway',()=>{
 for(const variant of ['hot-hatch','supercar']){
  const g=createCinematicVehicle({variant,optimize:false}),body=g.getObjectByName('arched-body');
  const p=Array.from(body.geometry.attributes.position.array),n=Array.from(body.geometry.attributes.normal.array);
  assert.ok(g.getObjectByName('rear-light-guide'));assert.ok(g.getObjectByName('bonnet-shutline'));
  const aperture=g.getObjectByName('sculpted-intake-surround');assert.ok(aperture.geometry.parameters.shapes.holes.length>0);
  animateCinematicVehicle(g,{frame:45,fps:30,bodyDamage:1,cutaway:1});animateCinematicVehicle(g,{frame:0,fps:30});
  assert.deepEqual(Array.from(body.geometry.attributes.position.array),p);assert.deepEqual(Array.from(body.geometry.attributes.normal.array),n);
  for(const v of n)assert.ok(Number.isFinite(v));disposeObject(g);
 }
});
