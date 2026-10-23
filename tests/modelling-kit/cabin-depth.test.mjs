import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('cabin detail adds bounded surface controls and upholstery once',async()=>{
 const {enhanceCabin}=await import('../../src/yunex/modelling-kit/cabin-depth.ts');
 const g=createVehicle({variant:'hot-hatch'}),s=vehicleSpec('hot-hatch');enhanceCabin(g,s,{});
 for(const n of ['seat-perforations','door-switch-bank','steering-button','column-stalk','pedal-tread'])assert.ok(g.getObjectByName(n),n);
 let count=0;g.traverse(o=>{if(o.userData.cabinDetail)count++;});assert.ok(count>25&&count<200);const before=g.getObjectByName('interior').children.length;enhanceCabin(g,s,{});assert.equal(g.getObjectByName('interior').children.length,before);disposeObject(g);
});
test('powertrain selection distinguishes heavy diesel, SUV, compact and EV',async()=>{
 const {engineConfiguration}=await import('../../src/yunex/modelling-kit/powertrain.ts');
 for(const [id,variant] of [['tractor-truck','inline-6'],['boxy-suv','v6'],['pickup','v8'],['compact','inline-3'],['formula-modern','v6']]){const c=engineConfiguration(vehicleSpec(id));assert.equal(c.variant,variant);assert.ok(c.scale>0&&c.scale<2);assert.ok(c.position.every(Number.isFinite));}
 assert.equal(engineConfiguration(vehicleSpec('city-ev')),undefined);
});
test('hands orient with rotating steering hardware and soles meet pedal surface',()=>{
 for(const variant of ['hot-hatch','formula-modern'])for(const steeringSide of ['left','right']){const g=createCinematicVehicle({variant,steeringSide,driver:true});animateCinematicVehicle(g,{frame:20,fps:30,steer:.3,braking:1});
 const wheel=g.getObjectByName(variant==='formula-modern'?'racing-steering-wheel':'steering-wheel');
 for(const side of ['left','right']){const hand=g.getObjectByName(`hand-${side}`),q=hand.getWorldQuaternion(new T.Quaternion());assert.ok(q.angleTo(wheel.getWorldQuaternion(new T.Quaternion()))<1e-5,'hand follows wheel orientation');
 const foot=g.getObjectByName(`foot-${side}`),target=g.getObjectByName(`pedal-target-${side}`),pad=new T.Box3().setFromObject(target.parent),sole=new T.Box3().setFromObject(foot);assert.ok(Math.abs(sole.min.y-pad.max.y)<.006,'sole contacts pedal top');}
 disposeObject(g);}
});

test('heavy inline-six fits below the raised cab floor with real part geometry',async()=>{
 const {engineConfiguration}=await import('../../src/yunex/modelling-kit/powertrain.ts');
 const {createPart}=await import('../../src/yunex/parts-kit/models.ts');
 const {interiorLayout}=await import('../../src/yunex/world-kit/interiors.ts');
 for(const id of ['tractor-truck','box-truck']){const s=vehicleSpec(id),c=engineConfiguration(s),engine=createPart({variant:c.variant,cutaway:true});engine.scale.setScalar(c.scale);engine.position.fromArray(c.position);const b=new T.Box3().setFromObject(engine);assert.ok(b.max.y<interiorLayout(s).floor-.01,'heavy engine must clear cab floor');assert.ok(b.min.y>.08);assert.ok(b.max.x<s.length/2&&b.min.x>-s.length/2);disposeObject(engine);}
});
