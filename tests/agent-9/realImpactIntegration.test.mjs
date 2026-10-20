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
import {readFileSync} from 'node:fs';

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


test('approved A8 bend/rail scars follow exact same crash sample in real moving scene',()=>{
 const impact=resolveBranchFrame(S.freezeEndFilmSec,seq).frame.impact;
 assert.ok(impact?.contact.occurred,'approved A8 original rail must have real contact');
 const firstX=impact.contact.firstContactX;
 assert.ok(firstX!==null&&Number.isFinite(firstX));
 assert.ok(impact.bumperCrushM>.10&&impact.fenderCrushM>.05);
 const reverse=[.10,.30,.50,.70,.90].map(p=>
  resolveBranchFrame(S.freezeEndFilmSec+
    (S.rewindEndFilmSec-S.freezeEndFilmSec)*p,seq).frame.impact);
 assert.ok(reverse.every(f=>f!==null));
 assert.ok(reverse.some(f=>f.contact.occurred&&f.bumperCrushM>.02));
 const end=sampleRealAgent8Wrong(S.choiceSourceSec,S.choiceSourceSec).impact;
 assert.equal(end.bumperCrushM,0,'original metal unfolds while steel unwinds');
 assert.equal(end.contact.occurred,false);
 const wrong=sampleRealAgent8Wrong(S.impactSourceSec,S.choiceSourceSec);
 const sceneOffset=-86-sampleControlledFrame(S.choiceSourceSec).positionM[0];
 assert.ok(Math.abs(wrong.dynamics.positionM[0]+sceneOffset-
   wrong.impact.scenePositionM[0])<1e-6,'A8 cut matches rebased A2 car');
 // First contact is an HISTORICAL bumper-corner position (~1.95s).
 // At frozen impact source t=3.5s the car HAS moved onward, so demanding
 // <8m separation would incorrectly invent a stationary collision.
 assert.ok(firstX>-110&&firstX<110,'contact remains on the physical A4 rail');
 assert.ok(wrong.impact.scenePositionM[0]>=firstX-3,
   'car advances beyond the fixed first-contact steel buckle');
 // Verify the ACTUAL native scene uses Agent8-owned damage, steel and scars
 // rather than retaining its old A4 rigid-rail + custom deformation renderer.
 const scene=readFileSync(new URL('../../production/yunex/tyre_blowout_ep003/rewind/EP003Agent9Preview.tsx',import.meta.url),'utf8');
 assert.ok(scene.includes('CrashBarrierWorld frame={impact}'));
 assert.ok(scene.includes('CrashCarRig frame={impact}'));
 assert.ok(scene.includes('ImpactEffects3D frame={impact}'));
 assert.ok(scene.includes('worldFactory={buildEpisodeHighway}'));
});
