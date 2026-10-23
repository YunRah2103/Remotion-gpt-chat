import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';import * as systems from '../../src/yunex/modelling-kit/systems.ts';
test('regeneration markers connect actual motor and battery and reverse without seek history',()=>{
 const car=createCinematicVehicle({variant:'city-ev',quality:'hero',optimize:false});animateCinematicVehicle(car,{frame:15,fps:30,speed:12,cutaway:1});
 assert.equal(typeof systems.animateEnergyFlow,'function');systems.animateEnergyFlow(car,'regenerate',.25);const flow=car.getObjectByName('energy-flow');assert.ok(flow?.visible);assert.equal(flow.children.length,7);const first=flow.children[0].position.clone();systems.animateEnergyFlow(car,'regenerate',1);systems.animateEnergyFlow(car,'regenerate',.25);assert.ok(first.distanceTo(flow.children[0].position)<1e-9);
 systems.animateEnergyFlow(car,'drive',.25);assert.ok(first.distanceTo(flow.children[0].position)>.01);systems.animateEnergyFlow(car,undefined,0);assert.equal(flow.visible,false);
 const motor=car.getObjectByName('traction-motor'),battery=car.getObjectByName('traction-battery');assert.deepEqual(flow.userData.endpoints,[car.worldToLocal(motor.getWorldPosition(new T.Vector3())).toArray(),car.worldToLocal(battery.getWorldPosition(new T.Vector3())).toArray()]);
});
