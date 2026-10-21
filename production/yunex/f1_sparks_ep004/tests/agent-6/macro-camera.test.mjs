import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextualContactCamera} from '../../editor/macro-camera.ts';
import {sampleDynamics} from '../../physics/index.ts';
import {sampleRetimedShotCamera} from '../../cinema/cameras.ts';
import {previewFrame,authenticSparkTime} from '../../editor/preview-plan.ts';

test('V3 macro camera reveals real car/road instead of hiding inside car carbon',()=>{
 const cue=authenticSparkTime();
 for(const frame of [222,241,258,275,289]){
  const p=previewFrame(frame,cue);
  assert.equal(p.shot,'contact-macro');
  const m=sampleDynamics(p.sourceSec,{aeroLoad01:1});
  const approved=sampleRetimedShotCamera(p.shot,p.localSec,p.durationSec,m);
  const crop=contextualContactCamera(approved);
  assert.deepEqual(crop.targetWorld,approved.targetWorld);
  const distance=Math.hypot(...crop.positionWorld.map((v,i)=>v-crop.targetWorld[i]));
  assert.ok(distance>3.2,'must keep camera safely beyond real F1 carbon and front wheel');
  assert.ok(crop.positionWorld[1]-crop.targetWorld[1]<=1.121,'camera remains low trackside');
  assert.ok(crop.positionWorld.every(Number.isFinite));
  assert.ok(crop.fovDeg>25 && crop.fovDeg<80);
 }
});
test('reject an invalid A3 camera position instead of substituting an invented lens',()=>{
 assert.throws(()=>contextualContactCamera({positionWorld:[0,0,0],targetWorld:[0,0,0],fovDeg:45,rollRad:0}),/valid approved/);
});
