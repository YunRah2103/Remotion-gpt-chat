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

test('authoritative dynamics drives all four spins, hubs and steering independently',()=>{
  const rig=prepareTyreRig();
  try{
    const names=['front-left','front-right','rear-left','rear-right'];
    const wheels=Object.fromEntries(names.map((id,i)=>{
      const front=id.startsWith('front'),right=id.endsWith('right');
      const x=(front?1.46:-1.46),z=(right?-.88:.88);
      return [id,{wheel:id,hubWorldM:[15+x,.35,-1.85+z],
        spinRad:-91-i,steeringRad:front?.02+i*.01:0,
        rollingRadiusM:id==='front-right'?.3:.36,
        verticalCompressionM:0}];
    }));
    const dynamics={tSec:1.2,positionM:[15,0,-1.85],yawRad:0,pitchRad:0,rollRad:0,
      worldSpeedMps:27,distanceTravelledM:31,driverSteerRad:.3,
      driverThrottle01:.1,driverBrake01:0,wheels,stage:'rapid-deflation'};
    applyTyreFrame(rig,params(1.2,-3),{dynamics});
    let found=0;
    rig.vehicle.traverse(o=>{
      if(!o.children?.some(v=>v.userData.wheel))return;
      const x=o.position.x,z=o.position.z;
      const id=`${x>0?'front':'rear'}-${z<0?'right':'left'}`;
      const state=wheels[id],spin=o.children.find(v=>v.userData.wheel);
      assert.ok(Math.abs(o.position.y-.35)<1e-9);
      assert.equal(o.rotation.y,state.steeringRad);
      assert.equal(spin.rotation.z,state.spinRad);
      found++;
    });
    assert.equal(found,4);
  }finally {disposeTyreRig(rig);}
});
