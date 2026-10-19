import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../../production/yunex/tyre_blowout_ep003/mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../../production/yunex/tyre_blowout_ep003/mechanics/sampleTyreFailure.ts';

const snap=(a)=>Array.from(a);
const rubber=(r)=>r.meshes.find(x=>x.kind==='tyre').mesh;
const params=(t,spin)=>sampleTyreFailure(t,{angularPhaseRad:spin});
test('rig edits original rubber on original wheel and never removes alloy or brake',()=>{
  const rig=prepareTyreRig();
  try{
    assert.equal(rig.vehicle.name,'YUNEX-grand-tourer');
    assert.equal(rig.steering.userData.steering,true);
    assert.equal(rig.steering.position.x,1.46);
    assert.equal(rig.steering.position.z,-.88);
    assert.equal(rig.roll.name,'wheel-roll');
    assert.equal(rig.roll.userData.radius,.36);
    assert.equal(rig.meshes.filter(m=>m.kind==='tyre').length,1);
    assert.ok(rig.roll.children.some(o=>o.name==='rim-lip'));
    assert.ok(rig.roll.children.some(o=>o.name==='alloy-spoke'));
    assert.ok(rig.roll.children.some(o=>o.name==='brake-rotor'));
    assert.ok(rig.steering.children.some(o=>o.name==='brake-caliper'));
    const tyre=rubber(rig);
    const rest=snap(tyre.geometry.attributes.position.array);
    applyTyreFrame(rig,params(1.3,-84));
    assert.equal(rig.roll.rotation.z,-84);
    assert.ok(Math.abs(rig.steering.position.y-.30)<1e-10);
    assert.notDeepEqual(snap(tyre.geometry.attributes.position.array),rest);
    // Out-of-order render must reconstruct from immutable rest geometry.
    applyTyreFrame(rig,params(0,0));
    assert.deepEqual(snap(tyre.geometry.attributes.position.array),rest);
    applyTyreFrame(rig,params(1.3,-84));
    const first=snap(tyre.geometry.attributes.position.array);
    applyTyreFrame(rig,params(.9,-60));
    applyTyreFrame(rig,params(1.3,-84));
    assert.deepEqual(snap(tyre.geometry.attributes.position.array),first);
  } finally {disposeTyreRig(rig);}
});
test('real wheel hierarchy accepts arbitrary failure side, with the shared GT preserved',()=>{
  const rig=prepareTyreRig('rear-left');
  try {
    assert.equal(rig.wheelId,'rear-left');
    assert.equal(rig.steering.position.x,-1.46);
    assert.equal(rig.steering.position.z,.88);
    assert.equal(rig.steering.userData.steering,false);
    assert.ok(rig.roll.children.some(o=>o.name==='rim-barrel'));
  } finally {disposeTyreRig(rig);}
});
test('standalone wheel frame overrides preview fixture hub and steer',()=>{
  const rig=prepareTyreRig();
  try {
    const f=params(1.2,-3);
    const wheelFrame={wheel:'front-right',hubWorldM:[1.46,.325,-.88],
      steeringRad:.035,spinRad:-91,rollingRadiusM:.30,verticalCompressionM:.035};
    applyTyreFrame(rig,f,{wheelFrame});
    assert.ok(Math.abs(rig.steering.position.y-.325)<1e-10);
    assert.equal(rig.steering.rotation.y,.035);
    assert.equal(rig.roll.rotation.z,-91);
  } finally {disposeTyreRig(rig);}
});
