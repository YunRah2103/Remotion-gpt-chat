import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  SHOT_ORDER,
  CAPTION_SAFE_BOTTOM_PX,
  CAPTION_MAX_WIDTH_PX,
  buildPicturePlan,
  captionAtFrame,
  missingPicturePrerequisites,
  shotAtFrame,
} from '../../editor/timing.ts';

const words = Array.from({length: 18}, (_, i) => ({
  text: ['Why', 'do', 'racing', 'cars', 'shoot', 'sparks?', 'Under', 'the', 'floor', 'metal', 'skids', 'touch', 'the', 'track', 'and', 'light', 'flies', 'off.'][i],
  startSec: i * .41 + .05,
  endSec: i * .41 + .35,
}));
const cuts = SHOT_ORDER.map((shot, i) => ({shot, wordIndex: i * 3}));
const input = {audioSrc: 'ep004/original-british-voice.wav', audioDurationSec: 8, words, cuts};

test('locked edit starts at frame zero and ends on actual recording end', () => {
  const plan = buildPicturePlan(input);
  assert.equal(plan.totalFrames, 240);
  assert.equal(plan.cuts[0].startFrame, 0);
  assert.equal(plan.cuts.at(-1).endFrameExclusive, 240);
  assert.equal(plan.cuts.length, 6);
  for (let i = 0; i < 240; i++) {
    const match = shotAtFrame(i, plan.cuts);
    assert.ok(match.durationFrames > 0);
  }
});

test('cut points depend on real word starts, not predefined film timings', () => {
  const a = buildPicturePlan(input);
  const shiftedWords = words.map((word, i) => i >= 9 ? {...word, startSec: word.startSec + .12, endSec: word.endSec + .12} : word);
  const b = buildPicturePlan({...input, words: shiftedWords});
  assert.notEqual(a.cuts[3].startFrame, b.cuts[3].startFrame);
  assert.equal(a.cuts[1].startFrame, b.cuts[1].startFrame);
});

test('the six required beats are enforced', () => {
  assert.throws(() => buildPicturePlan({...input, cuts: cuts.slice(0, 5)}), /exactly six/);
  assert.throws(() => buildPicturePlan({...input, cuts: cuts.toReversed()}), /wrong shot ordering/);
  assert.throws(() => buildPicturePlan({...input, cuts: cuts.map(c => ({...c, wordIndex: 0}))}), /increase/);
});

test('refuses guessed, invalid or EP003 speech evidence', () => {
  assert.throws(() => buildPicturePlan({...input, words: []}), /verified original word timings/);
  assert.throws(() => buildPicturePlan({...input, audioSrc: 'ep003/cedar.mp3'}), /EP003 media is forbidden/);
  assert.throws(() => buildPicturePlan({...input, audioDurationSec: 6}), /beyond original audio/);
  assert.throws(() => buildPicturePlan({...input, words: [{text: 'Oops', startSec: NaN, endSec: 2}, ...words.slice(1)]}), /nonfinite/);
});

test('word-highlight groups remain short, deterministic and safe from clipped bottom', () => {
  const a = buildPicturePlan(input);
  const b = buildPicturePlan(input);
  assert.deepEqual(a.captions, b.captions);
  assert.ok(a.captions.every(c => c.wordIndices.length <= 3 && c.text.length <= 24));
  assert.ok(CAPTION_SAFE_BOTTOM_PX >= 280 && CAPTION_MAX_WIDTH_PX <= 930);
  assert.ok(captionAtFrame(5, a.captions) !== null);
  assert.equal(captionAtFrame(239, a.captions), null);
});

test('picture gate stays closed until all 5 approved visual modules and real VO exist', () => {
  const none = missingPicturePrerequisites({
    approvedAgents: [], integrationCommitSha: null, allSixMovingScenesIntegrated: false,
    originalRecordedNarrationPresent: false, wordTimestampsVerifiedAgainstRecording: false,
  });
  assert.equal(none.length, 9);
  const ready = missingPicturePrerequisites({
    approvedAgents: [1,2,3,4,5], integrationCommitSha: 'f'.repeat(40), allSixMovingScenesIntegrated: true,
    originalRecordedNarrationPresent: true, wordTimestampsVerifiedAgainstRecording: true,
  });
  assert.deepEqual(ready, []);
});
