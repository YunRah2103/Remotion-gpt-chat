import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Vector3} from 'three';
import {sampleDynamics,previewRebasedPosition,previewRebasedHubWorld}
  from '../../production/yunex/tyre_blowout_ep003/dynamics/model.ts';

const IDs=['front-left','front-right','rear-left','rear-right'];
const anchors={
 'front-left':[1.46,.36,.88],
 'front-right':[1.46,.36,-.88],
 'rear-left':[-1.46,.36,.88],
 'rear-right':[-1.46,.36,-.88],
};
function at(t,sourceAnchor,sceneX){
  const f=sampleDynamics(t),anchor=sampleDynamics(sourceAnchor).positionM[0];
  const root=new Group();
  root.position.set(...previewRebasedPosition(f,anchor,sceneX));
  root.rotation.set(f.pitchRad,f.yawRad,f.rollRad,'YXZ');
  root.updateMatrixWorld(true);
  return {f,root,anchor};
}
test('every wheel follows the EXACT same hard-cut translation as its body',()=>{
  for(const [t,sourceAnchor,sceneX] of [[0.12,0.12,-58],[1.2,0.12,-58],
    [3.79,1.2,-42],[3.8,3.8,-35],[5.9,3.8,-35],[6.55,6.55,-35],[9.1,6.55,-35]]){
    const {f,root,anchor}=at(t,sourceAnchor,sceneX);
    const dx=root.position.x-f.positionM[0];
    for(const id of IDs){
      const h=f.wheels[id].hubWorldM;
      const rebased=previewRebasedHubWorld(f,id,anchor,sceneX);
      assert.ok(Math.abs((rebased[0]-h[0])-dx)<1e-10,id);
      assert.equal(rebased[1],h[1]);
      assert.equal(rebased[2],h[2]);
      // Three.js model worldToLocal is the actual preview rig operation.
      const local=root.worldToLocal(new Vector3(...rebased));
      const expected=anchors[id];
      assert.ok(Math.abs(local.x-expected[0])<.09,
        `${id}@${t} wrong X hub: ${local.x}`);
      assert.ok(Math.abs(local.z-expected[2])<.09,
        `${id}@${t} wrong Z hub: ${local.z}`);
      assert.ok(local.y>.23&&local.y<.42,
        `${id}@${t} suspension hub outside reasonable travel: ${local.y}`);
    }
  }
});
test('rebasing does not alter the authoritative yaw, wheel spin, or distances',()=>{
  const before=sampleDynamics(8),frame=sampleDynamics(8);
  const x=previewRebasedPosition(frame,sampleDynamics(6.55).positionM[0],-35);
  assert.deepEqual(frame,before);
  assert.ok(Math.abs(x[0]-frame.positionM[0])>100);
  for(const id of IDs){
    assert.equal(frame.wheels[id].spinRad,before.wheels[id].spinRad);
    assert.equal(frame.wheels[id].steeringRad,before.wheels[id].steeringRad);
  }
});
test('reverse-seeking across cuts does not accumulate state',()=>{
  const times=[9.1,1.15,6.55,.2,3.8,9.1,.2];
  const values=times.map(t=>at(t,t<3?0.12:t<6.55?3.8:6.55,-35).f);
  for(let i=times.length-1;i>=0;i--)assert.deepEqual(
    at(times[i],times[i]<3?0.12:times[i]<6.55?3.8:6.55,-35).f,values[i]);
});
