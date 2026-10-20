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
- A8 **user-approved original bent right rail and front-right body**: `8e703e70218e9c0b9e9b7768112f2d8388ae31c8`
- A9 updated approved-A8 pin (same verified rewind source): `6884664e265c680e314b3d44b81d33b6d6439977`

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
- True collision body/damage uses `Agent10DamagedOriginalCar` as an adapter around Agent 8's approved `CrashCarRig` on the original A1 prepared blue GT: exact bumper/fender/lamp/crease geometry and the A1 rubber/hub phase on the same object. No second car.
- The bad branch alone renders `CrashBarrierWorld({frame,worldFactory:buildEpisodeHighway})` instead of the static A4 highway instance, so there is ONE original right steel rail. `ImpactEffects3D` draws the same-source-time A8 rail scratches/dust/sparks; Agent9's reversed `CrashOutcomeFrame` unwinds rail buckle and damage. The correct branch keeps unchanged A4 highway and still-moving A2 recovery.

## Verification

Workflow `.github/workflows/yunex-ep003-agent10-action.yml` runs native Remotion, FFprobe frame and H264 codec checks, complete FFmpeg decode, sampled temporal-motion statistics and impact/rewind contact sheets. Green workflow and inspectable artifact are mandatory before claiming playable delivery; code commits alone do not satisfy that. Visual phone review is required before Agent 6 picture lock. No accepted final mixed MP4 is implied by these independent previews.

## 20 October final combined-source checkpoint

- The original approved Agent 8 geometry, 0.18m rail buckle and reversible rail-scars are preserved. A10 `PreviewFilm.tsx` uses exactly one `CrashBarrierWorld(frame,buildEpisodeHighway)` **instead of** the regular world road in the bad/reverse phase, and original A1 rubber via `CrashCarRig` + `Agent10DamagedOriginalCar` as one object.
- A9 updated owner commit `6884664e265c680e314b3d44b81d33b6d6439977` pins the SAME approved A8 SHA, with `rewind/branchReplay.ts` and `rewind/agent8Integration.ts` unchanged from its already genuine H264 backward-time baseline. A10 uses this exact A9 snapshot without reauthoring A9-owned code.
- Agent10 camera aims on the traffic (+Z) side of the damaged right-front blue GT to keep the approved bent -Z steel rail behind the nose. Tests are updated to protect this verified unobscured framing rather than the obsolete rail-side viewpoint.
- The camera branch/pose exports, A2 moving safe-response, A5 hands, 800-frame master VO timing, and original GT geometry remain unchanged. Final rendering acceptance requires exact-head two-MP4 H264, full decode, frame count and direct 9:16 mobile inspection. DO NOT treat this document as actual video proof.

## Final native mobile-frustum protection

The approved car model remains untouched. In the final Agent10 preview only, the impact-wide and immediate metal-damage camera offsets were pulled back and their aim moved from the nose/rail to the car centre. This avoids the **visually observed left-side clipping** at exact native still frames 43 and 79 while retaining traffic-side (+Z) unobscured blue GT front-right damage, A8 bent (-Z) steel barrier, sparks, road parallax, and source-time rewind. A deterministic 9:16 rectangle-frustum regression projects 16 corners of the original GT at every cut boundary and verifies neither shot crops the original full vehicle. Neither A8 original collision nor A9 physical playback is redesigned.
