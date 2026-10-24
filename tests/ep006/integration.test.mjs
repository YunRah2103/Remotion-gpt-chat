import test from 'node:test';
import assert from 'node:assert/strict';
import {heightAt} from '../../src/yunex/ep006/environment/surface.ts';
import {
  ep006SurfaceHeightM,sampleEp006Motion,EP006_JUMPS,EP006_CORNERS,
  EP006_SUSPENSION_LIMITS_M
} from '../../src/yunex/ep006/dynamics/motion.ts';
import {EP006_RALLY_SUSPENSION} from '../../src/yunex/ep006/vehicle/index.ts';
import {cameraShotAt,sampleEp006Camera} from '../../src/yunex/ep006/cameras/shot-motion.ts';
import {
  EP006_INTEGRATED_PROOF_FRAMES,integratedFrameAt
} from '../../src/yunex/studio-projects/ep006-integrated-review/timeline.ts';

test('one authoritative road/hillside sampler everywhere (including camera)',()=>{
  for(let x=-50;x<790;x+=17.33)for(const z of [-79,-42,-15,-4.5,-.82,0,.82,4.5,15,42,79])
    assert.equal(ep006SurfaceHeightM(x,z),heightAt(x,z),`surface diverged at ${x},${z}`);
  const motion=sampleEp006Motion(72);
  const camera=sampleEp006Camera(72,motion,{terrainHeightM:heightAt});
  assert.equal(camera.shotId,'first-touchdown');
  assert.ok(camera.estimatedSafe||camera.warnings.length===0 || camera.warnings.every(x=>typeof x==='string'));
});
test('both touchdown camera transitions match physics exact frame',()=>{
  assert.deepEqual(EP006_JUMPS.map(j=>j.landingFrame),[72,750]);
  assert.equal(cameraShotAt(71).id,'flight-profile');
  assert.equal(cameraShotAt(72).id,'first-touchdown');
  assert.equal(cameraShotAt(749).id,'final-apex');
  assert.equal(cameraShotAt(750).id,'final-touchdown');
});
test('Agent 1 travel stops match canonical A2 for all 810 absolute frames',()=>{
  assert.equal(EP006_SUSPENSION_LIMITS_M.bump,EP006_RALLY_SUSPENSION.maximumCompressionM);
  assert.equal(-EP006_SUSPENSION_LIMITS_M.droop,EP006_RALLY_SUSPENSION.maximumDroopM);
  assert.equal(EP006_SUSPENSION_LIMITS_M.tyreSquishMax,EP006_RALLY_SUSPENSION.maximumTyreDeflectionM);
  for(let frame=0;frame<810;frame++){
    const pose=sampleEp006Motion(frame);
    assert.equal(pose.frame,frame);
    assert.ok([...pose.positionM,...pose.rotationRad,...pose.velocityMps].every(Number.isFinite));
    const flying=frame<72||(frame>=684&&frame<750);
    for(const corner of EP006_CORNERS){
      const wheel=pose.wheels[corner];
      assert.equal(wheel.contact,!flying,`contact error at frame ${frame} on ${corner}`);
      assert.ok(wheel.compressionM>=-EP006_RALLY_SUSPENSION.maximumDroopM-1e-6);
      assert.ok(wheel.compressionM<=EP006_RALLY_SUSPENSION.maximumCompressionM+1e-6);
      assert.ok(wheel.tyreSquishM<=EP006_RALLY_SUSPENSION.maximumTyreDeflectionM+1e-6);
      assert.equal(wheel.surfaceHeightM,heightAt(wheel.contactPointM[0],wheel.contactPointM[2]));
      assert.equal(wheel.contactPointM[1],wheel.surfaceHeightM);
    }
    const view=sampleEp006Camera(frame,pose,{terrainHeightM:heightAt});
    assert.ok([...view.position,...view.target].every(Number.isFinite),`bad camera ${frame}`);
  }
});
test('350-frame integrated review includes J1, undercar replay, road sprint, J2',()=>{
  assert.equal(EP006_INTEGRATED_PROOF_FRAMES,350);
  assert.deepEqual(integratedFrameAt(0),{source:0,camera:0,replay:false});
  assert.deepEqual(integratedFrameAt(72),{source:72,camera:72,replay:false});
  assert.deepEqual(integratedFrameAt(125),{source:72,camera:192,replay:true});
  assert.deepEqual(integratedFrameAt(189),{source:88,camera:256,replay:true});
  assert.deepEqual(integratedFrameAt(190),{source:610,camera:610,replay:false});
  assert.deepEqual(integratedFrameAt(218),{source:678,camera:678,replay:false});
  assert.deepEqual(integratedFrameAt(290),{source:750,camera:750,replay:false});
  assert.deepEqual(integratedFrameAt(349),{source:809,camera:809,replay:false});
  for(let f=0;f<350;f++){
    const t=integratedFrameAt(f),pose=sampleEp006Motion(t.source);
    const cam=sampleEp006Camera(t.camera,{...pose,frame:t.camera},{terrainHeightM:heightAt});
    assert.ok(cam.clearanceM>0);
    assert.ok(t.source<810);
  }
  for(const bad of [-1,350,1.5])assert.throws(()=>integratedFrameAt(bad));
});
