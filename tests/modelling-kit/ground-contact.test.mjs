import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createGroundContactShadows,updateGroundContactShadows} from '../../src/yunex/modelling-kit/ground-contact.ts';
const car=()=>{const root=new T.Group();root.userData.variant='supercar';for(const x of [-1.2,1.2])for(const z of [-.7,.7]){const m=new T.Group();m.name='mount-'+(x>0?'front':'rear')+'-'+(z>0?'left':'right');m.position.set(x,.34,z);root.add(m);}return root;};
test('opt-in ground contact has four wheel shadows and a lightweight central falloff',()=>{
 const vehicle=car(),before=vehicle.children.length,contact=createGroundContactShadows(vehicle);
 assert.equal(vehicle.children.length,before,'the source vehicle is untouched');
 assert.equal(contact.children.length,5);
 assert.ok(contact.children.every(m=>m.material.transparent&&!m.material.depthWrite&&!m.castShadow));
 for(const m of contact.children){assert.ok(m.geometry.attributes.position.count>=4);assert.ok(m.position.toArray().every(Number.isFinite));}
 assert.ok(contact.children.some(m=>m.name==='contact-front-left'));
});
test('absolute contact follows transformed wheel hardpoints without cumulative drift',()=>{
 const vehicle=car(),contact=createGroundContactShadows(vehicle,{opacity:.2});
 const wheel=contact.getObjectByName('contact-front-left');
 const before=wheel.position.clone();
 vehicle.position.set(8,0,-3);vehicle.rotation.y=.6;
 updateGroundContactShadows(contact,vehicle,0);
 assert.ok(wheel.position.distanceTo(before)>7);
 assert.ok(Math.abs(wheel.position.y-.004)<1e-8);
 const snapshot=contact.children.map(m=>m.position.toArray());
 updateGroundContactShadows(contact,vehicle,0);
 assert.deepEqual(contact.children.map(m=>m.position.toArray()),snapshot);
 updateGroundContactShadows(contact,vehicle,1.25);
 assert.ok(Math.abs(wheel.position.y-1.254)<1e-8);
});
test('invalid rig or optical parameters fail before modifying the source',()=>{
 const source=car();
 assert.throws(()=>createGroundContactShadows(source,{opacity:.9}),/0\.45/);
 assert.throws(()=>createGroundContactShadows(source,{groundHeight:NaN}),/finite/);
 source.children.pop();
 assert.throws(()=>createGroundContactShadows(source),/intact mounted wheel rig/);
});
