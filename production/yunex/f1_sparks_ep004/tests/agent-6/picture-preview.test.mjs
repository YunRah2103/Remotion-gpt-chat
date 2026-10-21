import assert from 'node:assert/strict';
import {test} from 'node:test';
import {authenticSparkTime,previewFrame,PREVIEW_TOTAL_FRAMES,PREVIEW_SHOTS,PREVIEW_CUT_FRAMES} from '../../editor/preview-plan.ts';
import {assertGenuineSparkHook} from '../../editor/contact-hook.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {getSkidDescriptors} from '../../mechanics/skids.ts';
import {sampleRetimedShotCamera} from '../../cinema/cameras.ts';
import {getStoryVisualCue} from '../../story/visual-cues.ts';

test('real video-only six-shot picture has contiguous 420 frames and starts with sparks',()=>{
 const hook=authenticSparkTime();
 assert.ok(assertGenuineSparkHook(hook).contactParticleCount>=6);
 assert.equal(PREVIEW_TOTAL_FRAMES,420);
 assert.equal(PREVIEW_CUT_FRAMES.length,7);
 assert.equal(PREVIEW_SHOTS.length,6);
 assert.equal(previewFrame(0,hook).shot,'spark-hook');
 assert.equal(previewFrame(419,hook).shot,'racing-payoff');
 for(let f=0;f<PREVIEW_TOTAL_FRAMES;f++){
  const shot=previewFrame(f,hook);
  assert.ok(shot.sourceSec>=0 && shot.sourceSec<30);
  assert.equal(shot.frame,f);
  assert.ok(shot.endFrameExclusive>f && shot.startFrame<=f);
 }
});
test('physical event shower is actually present in first-second source frames',()=>{
 const cue=authenticSparkTime(),skids=getSkidDescriptors();
 let real=0;
 for(const frame of [0,3,8,14,20]){
  const part=previewFrame(frame,cue),m=sampleDynamics(part.sourceSec);
  const {contacts,particles}=sampleContactDrivenSparks(part.sourceSec,m,skids);
  const request={shot:part.shot,tSec:part.sourceSec,shotLocalSec:part.localSec,shotDurationSec:part.durationSec,motion:m,contacts,particles};
  if(particles.some(p=>p.luminance01>.12))real++;
  assert.equal(getStoryVisualCue(request).keepWorldTrajectory,true);
 }
 assert.ok(real>=2,'first-second particles must be visible at multiple actual source times');
});
test('approved Agent 3 cinematic poses exist in all six beats',()=>{
 const cue=authenticSparkTime();
 for(let i=0;i<PREVIEW_SHOTS.length;i++){
  const f=PREVIEW_CUT_FRAMES[i]+Math.floor((PREVIEW_CUT_FRAMES[i+1]-PREVIEW_CUT_FRAMES[i])/2);
  const part=previewFrame(f,cue),motion=sampleDynamics(part.sourceSec);
  const pose=sampleRetimedShotCamera(part.shot,part.localSec,part.durationSec,motion);
  assert.ok(pose.positionWorld.every(Number.isFinite));
  assert.ok(pose.targetWorld.every(Number.isFinite));
  assert.ok(pose.fovDeg>30 && pose.fovDeg<90);
 }
});
test('video-only picture cut times are not fabricated narrator timecodes',()=>{
 const cue=authenticSparkTime();
 assert.deepEqual(PREVIEW_CUT_FRAMES,[0,24,75,159,222,258,420]);
 assert.ok(previewFrame(0,cue).timeScale<1);
 assert.equal(previewFrame(130,cue).timeScale,1);
 assert.equal(previewFrame(210,cue).shot,'aero-load');
 assert.throws(()=>previewFrame(420,cue),/outside real six-shot/);
});
