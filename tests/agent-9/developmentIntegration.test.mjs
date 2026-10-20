import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleDevelopmentPanicFrame,sampleControlledFrame} from
 '../../production/yunex/tyre_blowout_ep003/rewind/developmentAdapter.ts';
import {sampleTyreFailure} from
 '../../production/yunex/tyre_blowout_ep003/mechanics/sampleTyreFailure.ts';
import {assertMatchingRestart,DEFAULT_BRANCH_REPLAY as S,resolveBranchFrame} from
 '../../production/yunex/tyre_blowout_ep003/rewind/branchReplay.ts';

test('temporary motion-adapter starts at EXACT same complete Agent2 physical state',()=>{
 const original=sampleControlledFrame(S.choiceSourceSec);
 const hypothetical=sampleDevelopmentPanicFrame(S.choiceSourceSec,S.choiceSourceSec,S.impactSourceSec);
 assert.deepEqual(hypothetical,original);
 assertMatchingRestart(hypothetical,original);
});
test('rereading reverse crash frames is random-access and deterministic',()=>{
 const samplers={sampleCorrect:sampleControlledFrame,
  sampleWrong:(t,s)=>sampleDevelopmentPanicFrame(t,s,S.impactSourceSec)};
 const a=resolveBranchFrame(14.68,samplers);
 resolveBranchFrame(15.7,samplers);
 const b=resolveBranchFrame(14.68,samplers);
 assert.deepEqual(a,b);
 assert.equal(a.replay.direction,-1);
});
test('failed front-right rubber never magically heals on good branch',()=>{
 for(const t of [S.choiceSourceSec,S.impactSourceSec,S.choiceSourceSec+.01,6,8]){
  const d=sampleControlledFrame(t);
  const tyre=sampleTyreFailure(t,{angularPhaseRad:d.wheels['front-right'].spinRad});
  assert.ok(tyre.failureProgress>.99);
  assert.ok(tyre.effectiveRadiusM<=.301);
  assert.ok(d.wheels['front-right'].rollingRadiusM<=.301);
 }
});
test('the moving wrong-branch development geometry heads toward near rail, not teleporting',()=>{
 let last;
 for(let i=0;i<=80;i++){
  const t=S.choiceSourceSec+(S.impactSourceSec-S.choiceSourceSec)*i/80;
  const d=sampleDevelopmentPanicFrame(t,S.choiceSourceSec,S.impactSourceSec);
  for(const w of Object.values(d.wheels))assert.ok(w.hubWorldM.every(Number.isFinite));
  if(last)assert.ok(Math.abs(d.positionM[2]-last.positionM[2])<.27,
   'No discontinuous world-Z frame hops');
  last=d;
 }
 assert.ok(last.positionM[2]<-6.5&&last.positionM[2]>-6.8);
 assert.ok(last.driverBrake01>.8,'Bad-reaction adapter labels hard braking');
});
