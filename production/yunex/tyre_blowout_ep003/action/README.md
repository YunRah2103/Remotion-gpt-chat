# Agent 10 — moving action camera integration

Source of truth: [Issue #209](https://github.com/YunRah2103/Remotion-gpt-chat/issues/209). Owned code only under `action/**`, `previews/agent-10/**`, `tests/agent-10/**`, and the dedicated workflow.

## API for Agent 6

```ts
import {sampleActionCamera,selectActionCut,ACTION_CRASH_CUTS} from '../action/cameras.ts';
const {cut,progress01} = selectActionCut(filmTimeSec,ACTION_CRASH_CUTS);
const pose = sampleActionCamera({
  stage:cut.stage,
  sourceTimeSec:sourceTimeFromEditor, // external A2 / A8 / A9 clock
  progress01,
  dynamics:actualVehicleState,
  impactFrame:{actualBarrierContact:impact.contact,contact01:impact.intensity}
});
```

`sampleActionCamera` returns a world pose, lens, and `roadParallaxMps`. It NEVER modifies physical state. Apply to the actual Three camera and original GT rig. For cut-specific road rebases apply the same translation to all four `hubWorldM` centres, body root, impact FX and rail reference in the same world, never yaw/steering/wheel spin. `rebaseActionFrame` provides the body/wheel part of that operation. Never rebase midway through a shot or assume a static barrier follows the moving car.

### Time / continuity

- **filmTimeSec:** where the shot sits in the 800-frame Agent 6 narrative.
- **sourceTimeSec:** absolute sampled physics/impact clock; only Agent 6 + Agent 9 decide the mapping.
- **progress01:** 0–1 within a camera cut. This only dollies the camera. No physics acceleration is generated.
- **impactFrame:** only from actual Agent 8 barrier contact. No shake without an actual contact signal.
- Front-right tyre = negative Z. Camera reveal and driver POV match Agent 3.
- Prefer 35–65° vertical FOV outdoors; 70° cockpit. No camera-roll gimmicks or grain.

Suggested narration-aligned insertions for Agent 6: `emergency-pull` in 0–5s; `barrier-approach` 12.8–14.0s; `impact-side-profile` at the actual A8 first contact around 14–15.3s; `reverse-sweep` on the **genuine A9 time-reversed car and scene** 14.4–16.0s; `steady-driver` with A5 hands 16–19.8s; `moving-recovery-hero` 20–26.7s. Select other angles as needed; never displace the user's original 26.664s Cedar VO.

## Evidence and honesty

The dedicated compositions are **camera-blocking development previews**, not approved full EP003.

- `EP003Agent10CrashAction` (6s) shows a temporary rightward displacement specifically to inspect where the rail is relative to the original moving car. This is **not Agent 8 collision dynamics or damage**. It is watermarked throughout. The last shot is a camera demonstration; there is NO genuine Agent 9 reverse. **Do not represent this as verified A8 impact.**
- `EP003Agent10RecoveryAction` (7s) uses actual Agent 2 sampleDynamics, Agent 1 rubber, Agent 4 road and Agent 5 hands, with independently retimed moving angles. Never infer a successful stationary safe stop.
- Workflow hydrates immutable vetted Agents 1–5 from their individual branches at the approved SHAs. `npm run check`, the agent-specific TS project, kit tests, and native MP4 render must pass. Artifacts include 540×960 30fps H.264 full-decode movies, contact sheets at event times, frame-motion statistics, and branch/commit provenance.
- Final crash+rewind approval is BLOCKED until Agent 8's actual impact and Agent 9's actual reverse mapping are integrated and MP4s rerendered. Only Agent 6 can edit the final 800-frame timeline, then Agent 7 mixes audio.

`previews/agent-10/verify_previews.py` rejects missing/undecodable files, wrong fps/frame count/duration or unacceptably static previews. Human phone-screen visual review is still necessary; numerical FFmpeg motion is not proof of cinematic quality, physics or safety.
