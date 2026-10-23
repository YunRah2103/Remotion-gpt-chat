import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {fitModelCamera} from '../../src/yunex/modelling-kit/model-framing.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';import {drivingCamera} from '../../src/yunex/modelling-kit/driving.ts';import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('actual-model fitting moves closer while retaining phone-safe visible geometry',()=>{
 for(const variant of ['city-ev','supercar','crossover','formula-modern','rally-hatch']){
 const root=createCinematicVehicle({variant,driver:true}),camera=drivingCamera('tracking',{position:[0,0,0],yaw:0},vehicleSpec(variant),1080/1920,0),fitted=fitModelCamera(root,camera,1080/1920);assert.ok(new T.Vector3(...fitted.position).distanceTo(new T.Vector3(...fitted.target))<new T.Vector3(...camera.position).distanceTo(new T.Vector3(...camera.target)),variant+' closer');
 const c=new T.PerspectiveCamera(fitted.fov,1080/1920,.025,500);c.position.fromArray(fitted.position);c.lookAt(new T.Vector3(...fitted.target));c.updateMatrixWorld(true);root.updateMatrixWorld(true);let checked=0;root.traverseVisible(o=>{if(o.isMesh&&!o.isInstancedMesh){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=Math.max(1,Math.floor(a.count/100))){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(c);assert.ok(Math.abs(p.x)<=.861&&Math.abs(p.y)<=.641&&p.z<1,variant+' cropped model');checked++;}}});assert.ok(checked>100);disposeObject(root);
 }
});
