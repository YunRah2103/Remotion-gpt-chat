import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileRecipe,sampleRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {V3_PROOFS} from '../../src/yunex/modelling-kit/v3-proofs.ts';
const recipe=()=>{const r=structuredClone(V3_PROOFS.sports);r.shots[0].jointTracks={'v3-rear-wing':[{time:0,value:0},{time:1,value:1},{time:2,value:0}]};return r;};
test('joint animation samples local seconds deterministically, including reverse frame order',()=>{
 const r=compileRecipe(recipe());
 assert.equal(sampleRecipe(r,15).joints['v3-rear-wing'],.5);
 assert.equal(sampleRecipe(r,30).joints['v3-rear-wing'],1);
 assert.equal(sampleRecipe(r,0).joints['v3-rear-wing'],0);
 assert.equal(sampleRecipe(r,15).joints['v3-rear-wing'],.5);
});
test('joint tracks reject duplicate times, values outside joint limits, and keys beyond shot duration',()=>{
 for(const track of [[{time:0,value:0},{time:0,value:1}],[{time:0,value:2}],[{time:3,value:.5}]]){
 const r=recipe();r.shots[0].jointTracks={'v3-rear-wing':track};assert.throws(()=>compileRecipe(r),/joint track/i);
 }
});
import {partInspectionCamera} from '../../src/yunex/modelling-kit/studio-camera.ts';
import * as T from 'three';
test('component orbit changes angle while retaining portrait fit and fixed target',()=>{
 const model=new T.Mesh(new T.BoxGeometry(2,1,3));
 const a=partInspectionCamera(model,9/16,{azimuth:0,elevation:.3});
 const b=partInspectionCamera(model,9/16,{azimuth:1,elevation:.3});
 assert.notDeepEqual(a.position,b.position);assert.deepEqual(a.target,b.target);
 for(const c of [a,b]){const camera=new T.PerspectiveCamera(c.fov,9/16,.025,500);camera.position.fromArray(c.position);camera.lookAt(new T.Vector3(...c.target));camera.updateMatrixWorld(true);for(const x of [-1,1])for(const y of [-.5,.5])for(const z of [-1.5,1.5]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.87&&Math.abs(p.y)<=.87);}}
});
import {drivingCamera} from '../../src/yunex/modelling-kit/driving.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
test('chase camera stays on the selected carriageway side after route rotation',()=>{
 const pose={position:[4,0,-10],yaw:.8};const car=vehicleSpec('supercar');
 const local=c=>new T.Vector3(...c.position).sub(new T.Vector3(...pose.position)).applyAxisAngle(new T.Vector3(0,1,0),-pose.yaw);
 assert.ok(local(drivingCamera('chase',pose,car,9/16,23,{side:-1})).z<0);
 assert.ok(local(drivingCamera('chase',pose,car,9/16,23,{side:1})).z>0);
});
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
test('cutaway opacity mode changes invalidate the compiled material in both seek directions',()=>{
 const car=createCinematicVehicle({variant:'supercar',quality:'hero',driver:true});const material=car.getObjectByName('arched-body').material;
 const a=material.version;animateCinematicVehicle(car,{frame:75,fps:30,cutaway:.92});assert.ok(material.version>a);
 const b=material.version;animateCinematicVehicle(car,{frame:76,fps:30,cutaway:.92});assert.equal(material.version,b);
 animateCinematicVehicle(car,{frame:15,fps:30,cutaway:0});assert.ok(material.version>b);assert.equal(material.transparent,false);
});
