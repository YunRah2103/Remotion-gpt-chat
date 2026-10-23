import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRoad,sampleRoad} from '../../src/yunex/studio-v5/road.ts';
import {poseStudioVehicle,createStudioVehicle} from '../../src/yunex/studio-v5/vehicle.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('four wheels follow graded banked road within 5mm and reverse seeking is exact',()=>{
 const road=createRoad({points:[[0,0,0],[40,6,8],[80,9,-10],[130,12,0]],width:8,bank:.06});
 const car=createStudioVehicle('rally-hatch');
 const positions=()=>{car.updateMatrixWorld(true);const p=[];car.traverse(o=>{if(/^mount-(front|rear)-(left|right)$/.test(o.name))p.push(o.getWorldPosition(new T.Vector3()).toArray());});return p;};
 poseStudioVehicle(car,road,55,90,30,12);const first=positions();
 const origin=sampleRoad(road,55),inv=origin.quaternion.clone().invert();
 car.traverse(o=>{if(!/^mount-(front|rear)-(left|right)$/.test(o.name))return;const rest=o.userData.restPosition,p=sampleRoad(road,55+rest[0],rest[2]),local=p.position.clone().sub(origin.position).applyQuaternion(inv);assert.ok(Math.abs(o.position.y-.36-local.y)<.005);});
 poseStudioVehicle(car,road,80,160,30,12);poseStudioVehicle(car,road,55,90,30,12);assert.deepEqual(positions(),first);disposeObject(car);
});
test('unsupported model gives clear guidance',()=>assert.throws(()=>createStudioVehicle('truck'),/supercar/));
test('front wheel steering follows the actual yaw change in both bend directions',()=>{
 for(const side of [-1,1]){const road=createRoad({points:[[0,0,0],[30,0,side*10],[60,0,side*35],[100,0,side*40]],width:8});const car=createStudioVehicle('coupe');const a=sampleRoad(road,30),b=sampleRoad(road,30.5);poseStudioVehicle(car,road,30,60,30,12);assert.equal(Math.sign(car.getObjectByName('mount-front-left').rotation.y),Math.sign(b.yaw-a.yaw));disposeObject(car);}
});
