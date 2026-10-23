import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('rally engineering adds recessed vent blades, formed skid plate and connected exhaust routing',()=>{
 const car=createCinematicVehicle({variant:'rally-hatch',optimize:false});
 for(const name of ['rally-bonnet-vent-well','rally-bonnet-vent-blade','rally-sump-guard','rally-exhaust-route','rally-exhaust-tip'])assert.ok(car.getObjectByName(name),name);
 const guard=car.getObjectByName('rally-sump-guard');assert.ok(guard.geometry.attributes.position.count>12);
 const route=car.getObjectByName('rally-exhaust-route'),tip=car.getObjectByName('rally-exhaust-tip');car.updateMatrixWorld(true);
 const end=new T.Vector3(...route.userData.endpoint).applyMatrix4(route.matrixWorld);assert.ok(end.distanceTo(tip.getWorldPosition(new T.Vector3()))<.15);
 disposeObject(car);
});
test('rally racing occupant keeps shared grips and pedal hardpoints with a shaped helmet',()=>{
 const car=createCinematicVehicle({variant:'rally-hatch',driver:true,optimize:false});
 assert.ok(car.getObjectByName('racing-helmet-shell'));assert.ok(car.getObjectByName('racing-helmet-visor'));assert.ok(car.getObjectByName('grip-target-left'));assert.ok(car.getObjectByName('pedal-target-right'));disposeObject(car);
});
