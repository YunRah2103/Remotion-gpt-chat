import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BRANCH_REPLAY as S,sampleBranchReplay,resolveBranchFrame,
  assertMatchingRestart,rebaseDynamicsX,rebasePointX,validateReplaySettings,
} from '../../production/yunex/tyre_blowout_ep003/rewind/branchReplay.ts';

test('source-clock phase contract respects locked Cedar timing',()=>{
 const marks=[
  [12.82,'pre-choice'],[12.83,'wrong-outcome'],[14.22,'freeze-impact'],
  [14.439,'freeze-impact'],[14.44,'reverse-crash'],[15.829,'reverse-crash'],
  [15.83,'reset-to-choice'],[16.014,'reset-to-choice'],
  [16.015,'correct-response'],
 ];
 for(const [t,phase] of marks) assert.equal(sampleBranchReplay(t).phase,phase,t);
 assert.equal(sampleBranchReplay(16.015).sourceTimeSec,S.choiceSourceSec);
 assert.equal(sampleBranchReplay(15.83).sourceTimeSec,S.choiceSourceSec);
 assert.equal(sampleBranchReplay(S.choiceFilmSec).sourceTimeSec,S.choiceSourceSec);
 assert.equal(sampleBranchReplay(S.impactFilmSec).sourceTimeSec,S.impactSourceSec);
});
test('reverse crash really traverses collision SOURCE frames BACKWARDS, not just overlay',()=>{
 let previous=Infinity;
 const a=sampleBranchReplay(S.freezeEndFilmSec);
 assert.equal(a.sourceTimeSec,S.impactSourceSec);
 for(let frame=0;frame<=40;frame++){
   const t=S.freezeEndFilmSec+(S.rewindEndFilmSec-S.freezeEndFilmSec)*frame/40;
   const shot=sampleBranchReplay(t);
   assert.ok(shot.sourceTimeSec<=previous+1e-10, 'rewind source clock cannot increase');
   assert.equal(shot.direction,frame===40?0:-1);
   previous=shot.sourceTimeSec;
 }
 assert.equal(sampleBranchReplay(S.rewindEndFilmSec).sourceTimeSec,S.choiceSourceSec);
});
test('bad and good alternatives sample same choice state via distinct samplers',()=>{
 const wrongTimes=[],correctTimes=[];
 const samplers={
  sampleWrong:(t,seed)=>{wrongTimes.push([t,seed]);return {t,seed,source:'A8'};},
  sampleCorrect:t=>{correctTimes.push(t);return {t,source:'A2'};},
 };
 const c=resolveBranchFrame(13.35,samplers);
 assert.equal(c.replay.branchChoice,'panic-brake-hypothetical');
 assert.equal(c.frame.source,'A8');
 const reverse=resolveBranchFrame(15,samplers);
 assert.equal(reverse.frame.source,'A8');
 const good=resolveBranchFrame(16.015,samplers);
 assert.equal(good.frame.source,'A2');
 assert.equal(good.frame.t,S.choiceSourceSec);
 assert.ok(wrongTimes.length===2&&correctTimes.length===1);
});
test('every phase retains damaged-wheel requirement',()=>{
 for(let i=0;i<250;i++){
   const e=sampleBranchReplay(12+i/30);
   assert.equal(e.failedTyreMustPersist,true);
   assert.ok(Number.isFinite(e.sourceTimeSec)&&e.sourceTimeSec>=0);
   assert.ok(e.reversedSourceProgress01>=0&&e.reversedSourceProgress01<=1);
 }
});
test('retiming allowed but malformed phase order is rejected',()=>{
 const s={...S,choiceFilmSec:10,impactFilmSec:12,freezeEndFilmSec:12.2,rewindEndFilmSec:13.1,correctFilmSec:14};
 validateReplaySettings(s);
 assert.equal(sampleBranchReplay(14,s).phase,'correct-response');
 assert.throws(()=>validateReplaySettings({...S,correctFilmSec:15.7}));
 assert.throws(()=>sampleBranchReplay(-.1));
 assert.throws(()=>sampleBranchReplay(Infinity));
});
test('reset equality covers BODY orientation ALL hub positions and failed-wheel radius',()=>{
 const wheel=(id)=>({wheel:id,hubWorldM:[1,.3,-.9],rollingRadiusM:.30});
 const wheels=Object.fromEntries(['front-left','front-right','rear-left','rear-right'].map(id=>[id,wheel(id)]));
 const a={positionM:[1,0,-2],yawRad:.1,pitchRad:.02,rollRad:-.02,wheels};
 assert.doesNotThrow(()=>assertMatchingRestart(a,structuredClone(a)));
 assert.throws(()=>assertMatchingRestart(a,{...a,positionM:[1.01,0,-2]}));
 const b=structuredClone(a);
 b.wheels['front-right'].rollingRadiusM=.36;
 assert.throws(()=>assertMatchingRestart(a,b),/magically repaired/);
 const c=structuredClone(a);
 c.wheels['rear-left'].hubWorldM[2]+=.02;
 assert.throws(()=>assertMatchingRestart(a,c),/hub/);
});
test('world X rebasing includes ALL four hubs and keeps world Z',()=>{
 const d={positionM:[24,0,-2],wheels:Object.fromEntries(
 ['front-left','front-right','rear-left','rear-right']
 .map((id,i)=>[id,{hubWorldM:[25+i,.3,-2-i]}]))};
 const x=rebaseDynamicsX(d,-79);
 assert.equal(x.positionM[0],-55);
 assert.equal(x.positionM[2],d.positionM[2]);
 for(const id of Object.keys(d.wheels)){
   assert.equal(x.wheels[id].hubWorldM[0]-d.wheels[id].hubWorldM[0],-79);
   assert.equal(x.wheels[id].hubWorldM[2],d.wheels[id].hubWorldM[2]);
 }
 assert.deepEqual(rebasePointX([1,2,3],-5),[-4,2,3]);
 assert.equal(d.positionM[0],24,'never mutate Agent2 state');
});
