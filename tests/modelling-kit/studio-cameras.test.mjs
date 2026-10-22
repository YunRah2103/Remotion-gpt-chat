import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {partInspectionCamera,driverPovCamera} from '../../src/yunex/modelling-kit/studio-camera.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';import {createPart} from '../../src/yunex/parts-kit/models.ts';import {PARTS} from '../../src/yunex/parts-kit/catalog.ts';import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('portrait component close-ups fit every real part without the previous excess distance',()=>{for(const p of PARTS){const g=createPart({variant:p.id,cutaway:true});const view=partInspectionCamera(g,1080/1920),camera=new T.PerspectiveCamera(view.fov,1080/1920,.025,500);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.updateMatrixWorld(true);const box=new T.Box3().setFromObject(g);let edge=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const q=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(q.x)<=.861&&Math.abs(q.y)<=.861,p.id);edge=Math.max(edge,Math.abs(q.x),Math.abs(q.y));}assert.ok(edge>.65,p.id+' should fill its close-up');disposeObject(g);}});
test('onboard mounts follow route transforms and road mounts sit ahead of the head',()=>{for(const variant of ['hot-hatch','supercar','formula-modern']){const g=createCinematicVehicle({variant,driver:true});g.position.set(15,0,-8);g.rotation.y=.7;g.updateMatrixWorld(true);const head=g.getObjectByName('head'),view=driverPovCamera(g);const local=g.worldToLocal(new T.Vector3(...view.position));const center=g.worldToLocal(head.getWorldPosition(new T.Vector3()));if(variant!=='formula-modern')assert.ok(local.x>center.x+.10,variant);else assert.ok(local.y>center.y+.20,variant);assert.ok(view.position.every(Number.isFinite));assert.ok(view.target.every(Number.isFinite));disposeObject(g);}});

test('driverless road cars retain a fitted cabin POV',()=>{const g=createCinematicVehicle({variant:'hot-hatch',driver:false});const view=driverPovCamera(g);assert.ok(view.position.every(Number.isFinite));assert.ok(view.position[1]<1.42);assert.ok(view.target[0]>view.position[0]);disposeObject(g);});

test('onboard central and upper sightlines clear opaque roof and halo geometry',()=>{
 for(const variant of ['hot-hatch','supercar','formula-modern']){
  const g=createCinematicVehicle({variant,driver:true}),view=driverPovCamera(g);
  const camera=new T.PerspectiveCamera(view.fov,1080/1920,.025,500);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.updateMatrixWorld(true);
  for(const y of [0,.25]){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(0,y),camera);ray.far=3;
   const hits=ray.intersectObject(g,true).filter(hit=>{let node=hit.object;while(node){if(!node.visible)return false;node=node.parent;}const mats=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];return mats.some(m=>m&&(!m.transparent||m.opacity>.95));});
   assert.deepEqual(hits.map(h=>h.object.name),[],variant+' opaque onboard obstruction at '+y);
  }disposeObject(g);
 }
});

test('cabin cutaway removes opaque headliner and restores it after reverse seeks',()=>{const g=createCinematicVehicle({variant:'supercar',driver:true}),liner=g.getObjectByName('roof-liner');assert.ok(liner);animateCinematicVehicle(g,{frame:400,fps:30,cutaway:.92});assert.equal(liner.visible,false);assert.equal(g.getObjectByName('head').visible,true);animateCinematicVehicle(g,{frame:20,fps:30,cutaway:0});assert.equal(liner.visible,true);animateCinematicVehicle(g,{frame:400,fps:30,cutaway:.92});assert.equal(liner.visible,false);disposeObject(g);});
