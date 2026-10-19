# Agent 10 — native impact and rewind cinematography

Scope: [Issue #209](https://github.com/YunRah2103/Remotion-gpt-chat/issues/209).
Separate DRAFT [PR #210](https://github.com/YunRah2103/Remotion-gpt-chat/pull/210)
targets `production/yunex-ep003-base`. No Agent 6 editor/timeline/root edits.

## Real integrated video paths

- `EP003Agent10CrashAction` 180 frames at 30fps (6s; 1080×1920 source, 540×960 review encode) integrates **Agent 8's real** `sampleCrashOutcome` via Agent 9's `resolveBranchFrame` / `sampleRealAgent8Wrong`. Same A8 collision event controls heading, rail contact, dent amounts and sparks/particles. The original A1 deforming front-right rubber, real kit GT, A4 original highway/daylight and A3 Three.js camera remain intact. No mock sideways movement, placeholder crash or fabricated collision state.
- `EP003Agent10RecoveryAction` 210 frames (7s) uses **Agent 2's real** controlled response and A5 original wheel + driver hands. Variable outside camera shots and road parallax show the still-moving car slowing down; it does NOT imply guaranteed refuge stopping.
- A9 playback explicitly reverses the physical collision source clock, including damage and particles; then resets to the exact A2 choice state with tyre still damaged. No fake repair.
- Keep the informative **HYPOTHETICAL WRONG REACTION** disclaimer and Rewind/TRY AGAIN cue. Heavy braking does not *always* cause a collision.

## Immutable department pins for review reproducibility

- A1 mechanics: `7d47746d2fc584e935b5a9766eb1150e5b3dac38`
- A2 dynamics: `e724786fc087b080e9de19e9e26bda6a815ce276`
- A3 cinema: `938628271f9b50d975ee55491881a8fd2d4807a5`
- A4 world: `a44f1b6c9c31105edd1a9b0d2de7f233d1223952`
- A5 hands: `cd03c64f77705aa03ee5d5071e5cf18c669fa4ea`
- A8 impact: `9aa1a092591336e4b6a2b1944e3e817c71e99271`
- A9 rewind: `6b767e381418f51ace0aea53fbb7bf3f071a5f8d`

The dedicated workflow Git-restores each pinned source directory without touching their PR branches or adding their code to the Agent 10 PR. A final merge of all departments is Agent 0/6 responsibility.

## Exact API for Agent 6

```ts
import {sampleActionCamera,ACTION_CRASH_CUTS,selectActionCut}
  from '../action/cameras.ts';
import {actionPreviewState} from '../action/previewState.ts';

// Preview action film uses its own 0..6s clock.
// Final master instead supplies the *real* A9 sampleBranchReplay()
// movie->sourceTime mapping and true A8 sampleRealAgent8Wrong() state.
const {cut,progress01}=selectActionCut(localShotTime,ACTION_CRASH_CUTS);
const pose=sampleActionCamera({
  stage:cut.stage,progress01,
  sourceTimeSec:actualReplay.sourceTimeSec,
  dynamics:actualVehicleFrame,
  impactFrame:{
    actualBarrierContact:Boolean(actualA8Impact?.contact.occurred),
    contact01:actualA8Impact?actualA8Impact.bumperCrushM/.24:0
  }
});
```

`ActionPreviewState` is a dedicated **review** edit sampler: local 0..6s preview maps to the A9 editorial span 12.83..16.015s, preserving the true A8 source clock rather than inventing a collision. The last preview frames return to the same safe-reaction choice state. The final Agent 6 master retains 800 frames/26.664s Cedar narration and is not created here.

- `sampleActionCamera` is deterministic, controls only camera pose/lens/shake and never changes physics or VO.
- +X vehicle forward, -Z right rail, A4 upstream rail approx Z=-7.8.
- All 4 hub X coordinates, car and A8 FX share the same cut rebase. Agent9's `rebaseDynamicsX` is used for the impact branch; independent A8 effect contact is already in scene world X.
- True collision body/damage uses `Agent10DamagedOriginalCar`, which clones the original kit mesh before applying A8 bumper/fender/lamp state; A1 wheel remains the only failed wheel.

## Verification

Workflow `.github/workflows/yunex-ep003-agent10-action.yml` runs native Remotion, FFprobe frame and H264 codec checks, complete FFmpeg decode, sampled temporal-motion statistics and impact/rewind contact sheets. Green workflow and inspectable artifact are mandatory before claiming playable delivery; code commits alone do not satisfy that. Visual phone review is required before Agent 6 picture lock. No accepted final mixed MP4 is implied by these independent previews.
