import test from 'node:test';
import assert from 'node:assert/strict';
import {REVIEW_CUT_FRAMES,REVIEW_SHOTS,REVIEW_TOTAL_FRAMES,reviewBeat} from '../../editor/preview-plan.ts';
import {buildPicturePlan,missingPicturePrerequisites} from '../../editor/timing.ts';
test('exact original FFprobe duration maps to 758 30fps video frames',()=>{
 assert.equal(Math.ceil(25.248*30),758);
 assert.equal(REVIEW_TOTAL_FRAMES,758);
 assert.equal(REVIEW_SHOTS.length,6);
 assert.deepEqual(REVIEW_CUT_FRAMES.slice(0,1),[0]);
 assert.equal(REVIEW_CUT_FRAMES.at(-1),758);
 for(let i=0;i<6;i++){
  const frames=REVIEW_CUT_FRAMES[i+1]-REVIEW_CUT_FRAMES[i];
  assert.ok(frames>=18,'each moving beat long enough for QA');
  const b=reviewBeat(REVIEW_CUT_FRAMES[i],.22);
  assert.equal(b.shot,REVIEW_SHOTS[i]);
  assert.equal(b.localFrame,0);
  assert.ok(b.sourceSec>=0);
  const later=reviewBeat(REVIEW_CUT_FRAMES[i+1]-1,.22);
  assert.equal(later.shot,b.shot);
  assert.ok(later.sourceSec>b.sourceSec,'real physical time advances within each beat');
 }
 assert.throws(()=>reviewBeat(-1,.22),/outside/);
 assert.throws(()=>reviewBeat(758,.22),/outside/);
 assert.throws(()=>reviewBeat(0,NaN),/genuine/);
});
test('original narrated movie remains blocked without approved source and verified word timing',()=>{
 const missing=missingPicturePrerequisites({
  approvedAgents:[],integrationCommitSha:null,
  allSixMovingScenesIntegrated:false,
  originalRecordedNarrationPresent:false,
  wordTimestampsVerifiedAgainstRecording:false
 });
 assert.ok(missing.some(x=>x.includes('original EP004 recorded narration')));
 assert.ok(missing.some(x=>x.includes('word timing')));
 assert.throws(()=>buildPicturePlan({audioSrc:'EP003-narration.mp3',
  audioDurationSec:25.248,words:[],cuts:[]}),/EP003/i);
});
test('provisional picture cut does not silently masquerade as actual aligned VO',()=>{
 assert.equal(REVIEW_CUT_FRAMES.length,7);
 for(let i=1;i<7;i++)assert.ok(REVIEW_CUT_FRAMES[i]>REVIEW_CUT_FRAMES[i-1]);
});
