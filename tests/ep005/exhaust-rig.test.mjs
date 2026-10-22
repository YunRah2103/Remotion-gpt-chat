import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {validateModel} from '../../src/yunex/modelling-kit/authoring.ts';
import {addProvisionalPreviewExhaust,readExhaustMounts,createAfterfireRig,animateAfterfireRig,createAfterfireCutaway} from '../../production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts';
import {sampleAfterfire} from '../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
test('flame path refuses missing mounts and requires explicit preview opt-in',()=>{
 const car=new T.Group();
 assert.throws(()=>readExhaustMounts(car),/Agent 1/);
 const car2=createCinematicVehicle({variant:'supercar',quality:'hero',optimize:false});
 addProvisionalPreviewExhaust(car2);
 assert.throws(()=>createAfterfireRig(car2),/provisional/);
 const fx=createAfterfireRig(car2,{requireAuthoritative:false});
 assert.equal(fx.elements.length,2);
 const hot={throttle:.1,unburntFuel:1,exhaustTemperatureC:800,overrun:true};
 animateAfterfireRig(fx,sampleAfterfire(0,30,hot,readExhaustMounts(car2)));
 assert.ok(fx.elements.some(e=>e.root.visible));
 const p=fx.elements[0].socket.getWorldPosition(new T.Vector3());
 car2.position.set(9,0,4);car2.rotation.y=.65;car2.updateMatrixWorld(true);
 const moved=fx.elements[0].socket.getWorldPosition(new T.Vector3());
 assert.ok(moved.distanceTo(p)>4);
 assert.ok(fx.elements[0].root.parent===fx.elements[0].socket);
});
test('exhaust cutaway uses V3 genuine port-connected assembly',()=>{
 const g=createAfterfireCutaway(),r=validateModel(g);
 assert.ok(g.userData.assembly);assert.ok(g.getObjectByName('ep005-muffler-baffle-0'));
 assert.equal(r.errors.length,0,JSON.stringify(r.errors));
 assert.ok(g.getObjectByName('connection-0'));
});

test('Agent 1 draft port positions and JSON radius contract are supported without fake userData.radius',()=>{
 const car=new T.Group(),body=new T.Group();body.name='body-shell';car.add(body);
 for(const [name,z] of [['exhaust-tip-left',.57],['exhaust-tip-right',-.57]]){
  const mount=new T.Object3D();mount.name='mount:'+name;mount.position.set(-2.465,.42,z);
  mount.userData={mount:true,mountName:name,direction:[-1,0,0]};body.add(mount);
 }
 const radii={'exhaust-tip-left':.085,'exhaust-tip-right':.085};
 assert.throws(()=>readExhaustMounts(car),/Missing direction\/radius/);
 const ports=readExhaustMounts(car,radii);
 assert.deepEqual(ports.map(p=>p.position),[[-2.465,.42,.57],[-2.465,.42,-.57]]);
 const rig=createAfterfireRig(car,{radii});
 assert.equal(rig.provisional,false);
 const f=sampleAfterfire(0,30,{throttle:.05,unburntFuel:1,exhaustTemperatureC:850,overrun:true},ports);
 animateAfterfireRig(rig,f);
 assert.ok(rig.elements.some(x=>x.root.visible));
 const origin=rig.elements[0].socket.getWorldPosition(new T.Vector3()).clone();
 car.position.set(12,0,3);car.rotation.y=.3;car.updateMatrixWorld(true);
 assert.ok(rig.elements[0].socket.getWorldPosition(new T.Vector3()).distanceTo(origin)>11);
});
