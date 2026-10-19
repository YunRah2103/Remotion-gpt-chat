import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {EP003_SCENE} from '../../production/yunex/tyre_blowout_ep003/shared/contract.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../../production/yunex/tyre_blowout_ep003/mechanics/tyreRig.ts';
import {samplePreviewState} from '../../production/yunex/tyre_blowout_ep003/cinema/previewState.ts';

test('real A1 tyre rig applies A2 nonzero X-pitch/Z-roll before world-ground deformation',()=>{
 const state=samplePreviewState(.7,'opening');
 const d={...state.dynamics,pitchRad:.033,rollRad:-.025,yawRad:.049};
 const rig=prepareTyreRig(EP003_SCENE.failedWheel,0);
 try{
  const pivotById={};
  rig.vehicle.traverse(o=>{
   if(!(o instanceof T.Group)||!o.children.some(c=>c.userData.wheel))return;
   const id=(o.position.x>0?'front':'rear')+'-'+(o.position.z<0?'right':'left');
   assert.ok(!pivotById[id],'duplicate mechanical wheel '+id);
   pivotById[id]=o;
  });
  assert.deepEqual(Object.keys(pivotById).sort(),['front-left','front-right','rear-left','rear-right']);
  applyTyreFrame(rig,state.tyre,{dynamics:d,exposure:0});
  assert.equal(rig.vehicle.rotation.order,'YXZ');
  assert.equal(rig.vehicle.rotation.x,d.pitchRad);
  assert.equal(rig.vehicle.rotation.y,d.yawRad);
  assert.equal(rig.vehicle.rotation.z,d.rollRad);
  rig.vehicle.updateMatrixWorld(true);
  for(const [id,o] of Object.entries(pivotById)){
   const target=d.wheels[id];
   const p=o.getWorldPosition(new T.Vector3());
   assert.ok(p.distanceTo(new T.Vector3(...target.hubWorldM))<1e-7,id+' hub is detached');
   assert.equal(o.rotation.y,target.steeringRad);
   assert.equal(o.children.find(c=>c.userData.wheel).rotation.z,target.spinRad);
  }
  assert.ok(rig.meshes.length>0,'rubber still uses original car wheel mesh');
  for(const m of rig.meshes){
   const a=m.mesh.geometry.attributes.position.array;
   assert.ok(Array.from(a).every(Number.isFinite),'road-ground deformation finite');
  }
 }finally{disposeTyreRig(rig)}
});
