import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const pose=g=>{const a=[];g.getObjectByName('driver-rig').traverse(o=>a.push([o.name,...o.position,...o.quaternion]));return JSON.stringify(a);};
test('opt-in articulated driver has jointed limbs and returns exactly after impact seek',()=>{
 const g=createCinematicVehicle({variant:'hot-hatch',driver:true});assert.ok(g.getObjectByName('driver-rig'));
 for(const name of ['head','neck','thorax','pelvis','hand-left','hand-right','foot-left','foot-right','belt-diagonal','belt-lap'])assert.ok(g.getObjectByName(name),name);
 animateCinematicVehicle(g,{frame:0,fps:30});const rest=pose(g);
 animateCinematicVehicle(g,{frame:90,fps:30,braking:1,impact:1,steer:.3});assert.notEqual(pose(g),rest);
 animateCinematicVehicle(g,{frame:0,fps:30});assert.equal(pose(g),rest);disposeObject(g);
});
test('hands stay attached to steering grips during full supported wheel movement',()=>{
 for(const variant of ['hot-hatch','supercar','formula-modern']){const g=createCinematicVehicle({variant,driver:true});
 for(const steer of [-.45,0,.45]){animateCinematicVehicle(g,{frame:30,fps:30,steer,braking:1,impact:.8});for(const side of ['left','right']){const hand=g.getObjectByName(`hand-${side}`),grip=g.getObjectByName(`grip-target-${side}`);assert.ok(hand.getWorldPosition(new T.Vector3()).distanceTo(grip.getWorldPosition(new T.Vector3()))<1e-5,variant);}}
 disposeObject(g);}
});
test('driver is opt-in and invalid reaction input does not mutate a vehicle',()=>{
 const a=createCinematicVehicle({variant:'hot-hatch'});assert.ok(!a.getObjectByName('driver-rig'));disposeObject(a);
 const g=createCinematicVehicle({variant:'supercar',driver:true}),before=pose(g);for(const impact of [-1,2,NaN])assert.throws(()=>animateCinematicVehicle(g,{frame:30,fps:30,impact}));assert.equal(pose(g),before);disposeObject(g);
});

test('Formula grips lie in the actual steering torus plane',()=>{const g=createCinematicVehicle({variant:'formula-modern',driver:true}),wheel=g.getObjectByName('racing-steering-wheel'),centre=wheel.getWorldPosition(new T.Vector3()),grip=wheel.getObjectByName('grip-target-left').getWorldPosition(new T.Vector3());assert.ok(Math.abs(grip.x-centre.x)<1e-5);assert.ok(Math.abs(Math.abs(grip.z-centre.z)-.11)<1e-5);disposeObject(g);});

test('Formula seated head clears the roll-hoop height and feet meet real pedal targets',()=>{for(const variant of ['hot-hatch','supercar','formula-modern']){const g=createCinematicVehicle({variant,driver:true});if(variant==='formula-modern')assert.ok(new T.Box3().setFromObject(g.getObjectByName('head')).max.y<1.05);for(const side of ['left','right']){const foot=g.getObjectByName(`foot-${side}`),pad=g.getObjectByName(`pedal-target-${side}`);assert.ok(foot.getWorldPosition(new T.Vector3()).distanceTo(pad.getWorldPosition(new T.Vector3()))<.10,variant);}disposeObject(g);}});
