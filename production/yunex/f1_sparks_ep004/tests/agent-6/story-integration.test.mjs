import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildRealStoryRequest} from '../../editor/story-request.ts';
import {getStoryVisualCue} from '../../story/visual-cues.ts';
import {contactCaption} from '../../story/scene-captions.ts';
import {DEFAULT_BEATS} from '../../story/beats.ts';
import {SHOT_ORDER,buildPicturePlan} from '../../editor/timing.ts';
import {deriveCameraHandoff} from '../../editor/camera-handoff.ts';
import {findAuthenticSparkMoment} from '../../editor/contact-hook.ts';

const props=(shot='rear-mystery',sourceSec=.9)=>({
 shot,globalFrame:0,globalSec:0,sourceSec,shotLocalSec:0,shotDurationSec:2,sourceWordIndex:0,
});
const words=Array.from({length:30},(_,i)=>({text:'word'+i,startSec:i*.38+.05,endSec:i*.38+.27}));
const input=(sourceStartSec)=>{
 const cuts=SHOT_ORDER.map((shot,i)=>({shot,wordIndex:i*5,...(i===0&&sourceStartSec!==undefined?{sourceStartSec}:{})}));
 return {audioSrc:'ep004/REAL-RECORDED-AUDIO-PATH.wav',audioDurationSec:12,words,cuts};
};

test('all 6 Agent 5 story beats correspond 1:1 to authoritative Agent 6 narration cuts',()=>{
 assert.deepEqual(DEFAULT_BEATS.map(b=>b.shot),Array.from(SHOT_ORDER));
 const plan=buildPicturePlan(input());
 const handoff=deriveCameraHandoff(plan);
 assert.equal(handoff.length,6);
 assert.equal(handoff[0].startFrame,0);
 assert.equal(handoff.at(-1).endFrameExclusive,360);
 assert.ok(handoff.every(x=>x.hasApprovedRecordedTiming&&x.frameCount>=18));
});

test('integrated story source samples merged real motion, skid contacts and particles, not narration clock',()=>{
 const t=findAuthenticSparkMoment({endSec:12,minimumVisibleParticles:2}).sourceSec;
 const p=props('spark-hook',t);
 const req=buildRealStoryRequest(p);
 assert.equal(req.tSec,t);
 assert.equal(req.motion.tSec,t);
 assert.equal(req.shot,p.shot);
 assert.ok(req.contacts.length>0);
 assert.ok(req.contacts.some(c=>c.active&&c.signedGapM<=0));
 assert.ok(req.particles.some(x=>x.luminance01>.12));
 assert.deepEqual(req,buildRealStoryRequest(p));
 const cue=getStoryVisualCue(req);
 assert.equal(cue.keepWorldTrajectory,true);
 assert.equal(cue.activeContact,true);
 assert.equal(cue.allowedToShowParticles,true);
 assert.equal(contactCaption(req),'ACTUAL METAL SPARKS');
});

test('Agent 5 cannot introduce false contact/spark story labels on dry roadway',()=>{
 const req=buildRealStoryRequest(props('contact-macro',0));
 const cue=getStoryVisualCue(req);
 assert.equal(cue.keepWorldTrajectory,true);
 if (!cue.activeContact && !cue.allowedToShowParticles){
   assert.equal(contactCaption(req),'NO CONTACT. NO SPARKS.');
 }
 assert.throws(()=>buildRealStoryRequest({...props(),sourceSec:-1}),/invalid VO\/source-time/);
 assert.throws(()=>buildRealStoryRequest({...props(),shotDurationSec:0}),/invalid VO\/source-time/);
});

test('real spark-flashforward hook forces a hard cut back to original story clock',()=>{
 const hook=findAuthenticSparkMoment({endSec:12,minimumVisibleParticles:2});
 const plan=buildPicturePlan(input(hook.sourceSec));
 const shots=deriveCameraHandoff(plan);
 assert.equal(shots[0].physicsStartSec,hook.sourceSec);
 assert.equal(shots[1].incomingCut,'hard-time-jump');
 assert.equal(shots[1].incomingBlendFrames,0);
 assert.equal(shots[2].incomingCut,'continuous-match');
 assert.ok(shots[2].incomingBlendFrames>0);
 assert.ok(shots[2].incomingHandleSec<=.18);
 assert.ok(shots.every(s=>s.voEndSec>s.voStartSec));
});

test('forbid interpolating unsupported camera transitions or invalid short source clips',()=>{
 const plan=buildPicturePlan(input());
 assert.throws(()=>deriveCameraHandoff(plan,.5),/invalid source-verified blend handle/);
 const damaged={...plan,cuts:plan.cuts.map((c,i)=>i===2?{...c,startFrame:c.startFrame+1}:c)};
 assert.throws(()=>deriveCameraHandoff(damaged),/missing, discontinuous or too-short shot/);
});
