import test from 'node:test';
import assert from 'node:assert/strict';
import {EDIT,VO_CUES,EP003_DURATION_FRAMES,EP003_FPS,sourceTime,cutAt,pictureFrame} from '../../production/yunex/tyre_blowout_ep003/editor/timeline.ts';

test('narration is genuine 26.664s and fits exact 800-frame 30fps film',()=>{
 assert.equal(VO_CUES.length,16);
 assert.equal(EP003_DURATION_FRAMES,800);
 assert.ok(EP003_DURATION_FRAMES/EP003_FPS-26.664<.004);
 for(let i=1;i<VO_CUES.length;i++)assert.ok(VO_CUES[i-1].end<VO_CUES[i].start,'Cues cannot overlap');
});
test('hard cuts tile the entire film with no unedited tail',()=>{
 assert.equal(EDIT[0].from,0);
 assert.equal(EDIT.at(-1).to,EP003_DURATION_FRAMES/EP003_FPS);
 for(let i=1;i<EDIT.length;i++)assert.equal(EDIT[i-1].to,EDIT[i].from,'Missing cut coverage');
 for(const e of EDIT)assert.ok(e.to>e.from);
});
test('all film frames map monotonically to ONE absolute simulation source',()=>{
 let previous=-1;
 for(let i=0;i<800;i++){
  const t=sourceTime(i/30);
  assert.ok(t>=previous&&t<32);
  previous=t;
 }
});
test('all cuts rebase all hub positions rigidly, retaining real damaged radius and nonzero movement',()=>{
 for(const t of [0,.3,.7,1.754,1.756,3.81,6.35,9.65,16.015,21.905,26.6]){
  const s=pictureFrame(t);
  assert.ok(Number.isFinite(s.sourceTimeSec));
  assert.equal(s.tyre.tSec,s.dynamics.tSec);
  assert.ok(s.dynamics.worldSpeedMps>0,'Never stage an unproven parked car');
  assert.ok(s.dynamics.wheels['front-right'].rollingRadiusM<=.36+1e-4);
  const original=s.dynamics.positionM;
  for(const wheel of Object.values(s.dynamics.wheels)){
   assert.ok(wheel.hubWorldM.every(Number.isFinite));
   assert.ok(Math.abs(wheel.hubWorldM[0]-original[0])<4,'wheel and body need same X rebase');
  }
 }
});
test('shot sections align to first failure, forces, cockpit and moving refuge',()=>{
 assert.equal(cutAt(0).edit.shot,'tyre-hook');
 assert.equal(cutAt(8.5).edit.segment,'forces');
 assert.equal(cutAt(17).edit.shot,'driver-cockpit');
 assert.equal(cutAt(22.0).edit.shot,'safe-stop');
 assert.ok(cutAt(26.6).edit.shot==='chase-recovery');
});
