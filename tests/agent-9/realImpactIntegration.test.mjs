import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_BRANCH_REPLAY as S,assertMatchingRestart,resolveBranchFrame} from
 '../../production/yunex/tyre_blowout_ep003/rewind/branchReplay.ts';
import {sampleControlledFrame} from
 '../../production/yunex/tyre_blowout_ep003/rewind/developmentAdapter.ts';
import {sampleRealAgent8Wrong,sampleRealAgent2Correct} from
 '../../production/yunex/tyre_blowout_ep003/rewind/agent8Integration.ts';
import {sampleTyreFailure} from
 '../../production/yunex/tyre_blowout_ep003/mechanics/sampleTyreFailure.ts';
import {railBuckleAt,MAX_RAIL_BUCKLE_M} from
 '../../production/yunex/tyre_blowout_ep003/impact/Barrier.tsx';

const seq={sampleWrong:sampleRealAgent8Wrong,sampleCorrect:sampleRealAgent2Correct};
test('REAL A8 and A2 fork at precisely identical pose, all hubs and damaged wheel',()=>{
 const bad=sampleRealAgent8Wrong(S.choiceSourceSec,S.choiceSourceSec);
 const good=sampleControlledFrame(S.choiceSourceSec);
 assertMatchingRestart(bad.dynamics,good);
 assert.deepEqual(bad.dynamics,good);
 assert.equal(bad.impact?.contact.occurred,false);
 const tyre=sampleTyreFailure(S.choiceSourceSec,
  {angularPhaseRad:bad.dynamics.wheels['front-right'].spinRad});
 assert.ok(tyre.effectiveRadiusM<=.300001,'first decision happens AFTER real failure');
});
test('REAL A8 actual barrier collision, dent, and contact are visible before freeze',()=>{
 const f=sampleRealAgent8Wrong(S.impactSourceSec,S.choiceSourceSec);
 assert.ok(f.impact);
 assert.equal(f.impact.contact.occurred,true,'impact must exist at actual frozen film moment');
 assert.ok(f.impact.bumperCrushM>.08);
 assert.ok(f.impact.fenderCrushM>.05);
 assert.ok(f.impact.contact.firstContactSec>1.2);
 assert.equal(f.dynamics.positionM[2],f.impact.physicalPositionM[2]);
 assert.ok(f.impact.contact.clearanceM>=.015);
});
test('REAL A8 damaged body/impact is sampled backwards, with no snap-clean frame',()=>{
 let lastClock=Infinity;
 const badContact=resolveBranchFrame(S.freezeEndFilmSec,seq);
 const end=badContact.frame.impact;
 assert.ok(end?.contact.occurred);
 assert.ok(end.bumperCrushM>.08);
 for(let i=0;i<60;i++){
   const ft=S.freezeEndFilmSec+i/60*(S.rewindEndFilmSec-S.freezeEndFilmSec);
   const {replay,frame}=resolveBranchFrame(ft,seq);
   assert.equal(replay.direction,-1);
   assert.ok(replay.sourceTimeSec<=lastClock+1e-10);
   assert.ok(frame.impact);
   lastClock=replay.sourceTimeSec;
 }
 const rewindEnd=sampleRealAgent8Wrong(S.choiceSourceSec,S.choiceSourceSec);
 const clean=sampleControlledFrame(S.choiceSourceSec);
 assertMatchingRestart(rewindEnd.dynamics,clean);
 assert.equal(rewindEnd.impact.bumperCrushM,0);
 assert.equal(rewindEnd.impact.contact.occurred,false);
 const restarted=resolveBranchFrame(S.correctFilmSec,seq);
 assert.equal(restarted.frame.impact,null);
 assertMatchingRestart(rewindEnd.dynamics,restarted.frame.dynamics);
});
test('safe path remains real A2 moving recovery with wheel still failed',()=>{
 const immediate=resolveBranchFrame(S.correctFilmSec,seq);
 const later=resolveBranchFrame(S.correctFilmSec+3.2,seq);
 assert.equal(immediate.frame.impact,null);
 assert.equal(later.frame.impact,null);
 assert.ok(later.frame.dynamics.positionM[0]>immediate.frame.dynamics.positionM[0]+25);
 const tyre=sampleTyreFailure(later.replay.sourceTimeSec);
 assert.ok(tyre.effectiveRadiusM<=.301);
});
test('A8 wrong source is seekable in random order and maintains four transformed hubs',()=>{
 const sourceTimes=[S.choiceSourceSec,S.choiceSourceSec+.7,S.choiceSourceSec+1.4,
   S.choiceSourceSec+2.7,S.impactSourceSec];
 const forward=sourceTimes.map(t=>sampleRealAgent8Wrong(t,S.choiceSourceSec));
 const reverse=[...sourceTimes].reverse().map(t=>sampleRealAgent8Wrong(t,S.choiceSourceSec)).reverse();
 assert.deepEqual(forward,reverse);
 for(const frame of forward){
   const d=frame.dynamics;
   for(const id of ['front-left','front-right','rear-left','rear-right']){
     assert.ok(d.wheels[id].hubWorldM.every(Number.isFinite));
     assert.ok(d.wheels[id].rollingRadiusM>.26&&d.wheels[id].rollingRadiusM<.37);
   }
   assert.ok(d.positionM.every(Number.isFinite));
 }
});

test('approved A8 rail physically bends and unbends with SAME rewound impact frame',()=>{
 const impact=resolveBranchFrame(S.freezeEndFilmSec,seq).frame.impact;
 assert.ok(impact?.contact.occurred,'must have real approved A8 barrier contact');
 const firstX=impact.contact.firstContactX;
 assert.ok(firstX!==null&&Number.isFinite(firstX));
 const atHit=railBuckleAt(firstX,impact);
 assert.ok(atHit>.10,'approved rail MUST be significantly buckled at aftermath');
 assert.ok(atHit<=MAX_RAIL_BUCKLE_M+1e-9,'bounded A8 visual buckling');
 const samples=[.10,.30,.50,.70,.90].map(p=>
  resolveBranchFrame(S.freezeEndFilmSec+
    (S.rewindEndFilmSec-S.freezeEndFilmSec)*p,seq).frame.impact);
 assert.ok(samples.every(f=>f!==null));
 assert.ok(samples.some(f=>railBuckleAt(firstX,f)>.07),
  'steel remains visibly bent for part of real rewind');
 const end=sampleRealAgent8Wrong(S.choiceSourceSec,S.choiceSourceSec).impact;
 assert.equal(railBuckleAt(firstX,end),0,'rail deformation unwinds, never pops clean early');
 assert.equal(end.bumperCrushM,0,'original car and rail restore together');
 assert.equal(end.contact.occurred,false);
 // The original scene cut is shared by the car, all hubs, and A8 first-contact rail.
 const source=sampleRealAgent8Wrong(S.impactSourceSec,S.choiceSourceSec);
 const carX=source.dynamics.positionM[0];
 const first=source.impact.contact.firstContactX;
 const sceneOffset=-86-sampleControlledFrame(S.choiceSourceSec).positionM[0];
 assert.ok(Math.abs(carX+sceneOffset-source.impact.scenePositionM[0])<1e-6);
 assert.ok(Math.abs(first-source.impact.scenePositionM[0])<8,'rail and car same scene coordinates');
});
