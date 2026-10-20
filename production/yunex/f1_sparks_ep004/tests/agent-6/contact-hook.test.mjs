import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findAuthenticSparkMoment,assertGenuineSparkHook} from '../../editor/contact-hook.ts';
import {buildPicturePlan,sourceTimeAtFrame,SHOT_ORDER} from '../../editor/timing.ts';

test('flash-forward searches only approved actual skid-contact spark births',()=>{
  const hook=findAuthenticSparkMoment({startSec:0,endSec:12,minimumVisibleParticles:2});
  assert.ok(hook.contactParticleCount>=2);
  assert.ok(hook.minSignedGapM<=0);
  assert.ok(hook.activeMetalSkids.length>0);
  assert.deepEqual(assertGenuineSparkHook(hook.sourceSec,2),hook);
});
test('do not accept nonexistent or invented contact time',()=>{
  assert.throws(()=>assertGenuineSparkHook(-5),/invalid contact source time/);
  assert.throws(()=>findAuthenticSparkMoment({startSec:2,endSec:1}),/bounded contact search/);
});
test('retime source spark teaser without retiming a single VO word',()=>{
  const hook=findAuthenticSparkMoment({startSec:0,endSec:12,minimumVisibleParticles:2});
  const words=Array.from({length:24},(_,i)=>({text:'word'+i,startSec:i*0.3,endSec:i*0.3+0.2}));
  const cuts=SHOT_ORDER.map((shot,i)=>({shot,wordIndex:i*4,...(i===0?{sourceStartSec:hook.sourceSec}:{})}));
  const plan=buildPicturePlan({audioSrc:'ep004-actual-recorded-original-voice.wav',audioDurationSec:7.5,words,cuts});
  assert.equal(sourceTimeAtFrame(0,plan.cuts),hook.sourceSec);
  assert.equal(sourceTimeAtFrame(15,plan.cuts),hook.sourceSec+0.5);
  const second=plan.cuts[1].startFrame;
  assert.equal(sourceTimeAtFrame(second,plan.cuts),second/30);
  assert.equal(plan.words[0].startSec,0);
  assert.equal(plan.totalFrames,225);
  assert.throws(()=>buildPicturePlan({audioSrc:'ep004-actual.wav',audioDurationSec:7.5,words,
    cuts:cuts.map((c,i)=>i===0?{...c,sourceStartSec:-1}:c)}),/invalid real physics source time/);
});
