import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as dynamics from '../../src/yunex/modelling-kit/dynamics.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('class response rolls outward and acceleration raises the nose, with bounded travel',()=>{
 assert.equal(typeof dynamics.sampleDynamics,'function');
 const input={speed:15,acceleration:3,curvature:.025,distance:20};
 const sports=dynamics.sampleDynamics(vehicleSpec('supercar'),input),suv=dynamics.sampleDynamics(vehicleSpec('crossover'),input),formula=dynamics.sampleDynamics(vehicleSpec('formula-modern'),input);
 assert.ok(sports.pitch>0);assert.ok(sports.roll>0);assert.ok(suv.roll>sports.roll&&sports.roll>formula.roll);
 assert.ok(dynamics.sampleDynamics(vehicleSpec('supercar'),{...input,acceleration:-3}).pitch<0);
 assert.equal(dynamics.sampleDynamics(vehicleSpec('supercar'),{...input,speed:0,acceleration:0}).roll,0);
});
test('Ackermann inner wheel turns further and reverses symmetrically',()=>{
 assert.equal(typeof dynamics.sampleDynamics,'function');
 const s=vehicleSpec('supercar'),a=dynamics.sampleDynamics(s,{speed:10,curvature:.08,distance:0}),b=dynamics.sampleDynamics(s,{speed:10,curvature:-.08,distance:0});
 assert.ok(a.steeringRight>a.steeringLeft);assert.ok(Math.abs(a.steeringRight+b.steeringLeft)<1e-10);
 assert.throws(()=>dynamics.sampleDynamics(s,{speed:NaN,curvature:0,distance:0}));
});
test('rally road samples depend on distance, differ across axles and stop when distance stops',()=>{
 assert.equal(typeof dynamics.sampleDynamics,'function');
 const s=vehicleSpec('rally-hatch'),input={speed:12,curvature:.02,distance:20,roughness:1};
 const a=dynamics.sampleDynamics(s,input);assert.deepEqual(a,dynamics.sampleDynamics(s,input));
 assert.notEqual(a.roadHeights[0],a.roadHeights[2]);assert.ok(a.roadHeights.every(h=>Math.abs(h)<.04));
 assert.deepEqual(dynamics.sampleDynamics(s,{...input,speed:0}).roadHeights,a.roadHeights);
});
test('rig applies dynamics reversibly while tyres retain their road contact height',()=>{
 const car=createCinematicVehicle({variant:'supercar',quality:'standard'});
 const state={frame:90,fps:30,distance:30,speed:15,acceleration:3,curvature:.025};
 animateCinematicVehicle(car,state);const shell=car.getObjectByName('body-shell'),pose=[...shell.position.toArray(),...shell.rotation.toArray()];
 assert.ok(shell.rotation.x>0&&shell.rotation.z>0);
 for(const name of ['front-left','front-right','rear-left','rear-right']){const m=car.getObjectByName(`mount-${name}`);assert.equal(m.position.y,m.userData.restPosition[1]);}
 animateCinematicVehicle(car,{frame:0,fps:30});assert.equal(shell.rotation.x,0);assert.equal(shell.rotation.z,0);
 animateCinematicVehicle(car,state);assert.deepEqual([...shell.position.toArray(),...shell.rotation.toArray()],pose);disposeObject(car);
});
test('mechanical shafts stay attached after simultaneous body roll and pitch',()=>{
 const car=createCinematicVehicle({variant:'supercar',quality:'standard'});
 animateCinematicVehicle(car,{frame:90,fps:30,distance:30,speed:15,acceleration:3,curvature:.025});car.updateMatrixWorld(true);
 car.traverse(o=>{if(!o.userData.wheelEndpoint)return;const end=o.localToWorld(new (o.position.constructor)(0,.5,0)),wheel=car.getObjectByName(o.userData.wheelEndpoint).getWorldPosition(new (o.position.constructor)());assert.ok(end.distanceTo(wheel)<1e-6);});disposeObject(car);
});
test('invalid dynamics reject atomically and require a complete wheel-height quartet',()=>{
 const car=createCinematicVehicle({variant:'supercar',quality:'standard'}),snapshot=()=>{const a=[];car.traverse(o=>a.push([...o.position,...o.quaternion,...o.scale]));return JSON.stringify(a);};
 animateCinematicVehicle(car,{frame:20,fps:30,distance:10,compression:.04});const before=snapshot();
 for(const input of [{speed:-1},{roughness:2},{roadFrontLeft:.02},{roadFrontRight:.02}]){assert.throws(()=>animateCinematicVehicle(car,{frame:60,fps:30,distance:20,...input}));assert.equal(snapshot(),before);}
 disposeObject(car);
});
