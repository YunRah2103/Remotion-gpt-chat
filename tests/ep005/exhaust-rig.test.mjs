import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {validateModel} from '../../src/yunex/modelling-kit/authoring.ts';
import {addProvisionalPreviewExhaust,readExhaustMounts,createAfterfireRig,animateAfterfireRig,createAfterfireCutaway} from '../../production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts';
import {sampleAfterfire} from '../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
import {createEp005Hero} from '../../production/yunex/supercar_flames_ep005/flames/hero-reference/hero.ts';
import exhaustContract from '../../production/yunex/supercar_flames_ep005/flames/hero-reference/exhaust-contract.ts';
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
  const tube=new T.Group();tube.name='ep005-'+(z>0?'left':'right')+'-exhaust-tube';body.add(tube);
  const mount=new T.Object3D();mount.name='mount:'+name;mount.position.set(-2.465,.42,z);
  mount.userData={mount:true,mountName:name,direction:[-1,0,0]};tube.add(mount);
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

test('real A1 source-pinned hero geometry anchors tapered 3D flames on metal tip bores',()=>{
 const hero=createEp005Hero(),fx=createAfterfireRig(hero);
 assert.equal(fx.provisional,false);
 assert.equal(fx.elements.length,2);
 const ports=readExhaustMounts(hero);
 assert.deepEqual(ports.map(p=>p.radius),[.085,.085]);
 for(const [i,p] of ports.entries()){
  const contract=exhaustContract.ports[i];
  assert.equal(p.name,contract.id);
  assert.deepEqual(p.position.map(n=>Number(n.toFixed(3))),contract.position);
  assert.deepEqual(p.direction.map(n=>Number(n.toFixed(3))),contract.direction);
  const mount=hero.getObjectByName(contract.node);
  assert.equal(mount?.parent?.name,contract.component);
  assert.ok(hero.getObjectByName('ep005-'+(i===0?'left':'right')+'-rolled-lip'));
  assert.ok(fx.elements[i].root.parent===mount);
  assert.equal(fx.elements[i].envelopes.length,4);
  assert.equal(fx.elements[i].cores.length,2);
  for(const mesh of [...fx.elements[i].envelopes,...fx.elements[i].cores]){
   assert.ok(mesh.geometry instanceof T.BufferGeometry);
   assert.equal(mesh.geometry.type,'BufferGeometry');
   assert.equal(mesh.geometry.attributes.position.count,26*15);
   assert.equal(mesh.geometry.attributes.aAlpha.count,26*15);
   assert.ok(!(mesh.geometry instanceof T.SphereGeometry),'no blob sphere flame');
  }
 }
 const state={throttle:.05,unburntFuel:.99,exhaustTemperatureC:840,overrun:true};
 animateAfterfireRig(fx,sampleAfterfire(0,30,state,ports));
 assert.ok(fx.elements.every(e=>e.root.visible));
 const attrs=fx.elements[0].envelopes[0].geometry.attributes.position.array.slice();
 animateAfterfireRig(fx,sampleAfterfire(9,30,state,ports));
 animateAfterfireRig(fx,sampleAfterfire(0,30,state,ports));
 assert.deepEqual(fx.elements[0].envelopes[0].geometry.attributes.position.array,attrs);
 hero.position.set(8,0,-4);hero.rotation.y=.52;hero.updateMatrixWorld(true);
 const outlet=hero.getObjectByName('mount:exhaust-tip-left');
 assert.ok(outlet?.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(-2.465,.42,.57))>6);
});
