# YUNEX EP004 — Agent 10 / quality camera action

**Branch:** `agent/ep004-10-camera-action`  
**Target:** `production/yunex-ep004-quality-v2` (draft, NO merge)  
**Issue:** #237 / director #234

## Integrator API

```ts
import {sampleQualityCamera, sampleRetimedQualityCamera, QUALITY_SHOTS} from './cameras.ts';
import {SHOT_SOURCE_TABLE, sampleQualitySource} from './shot-plan.ts';

// Exact Agent 2 vehicle state — never resimulated by a camera:
const pose = sampleQualityCamera('racing-payoff', shotLocalSec, motion);
// When aligning original 25.248s VO, use explicit source-time and cut handles:
const retimed = sampleRetimedQualityCamera('spark-hook', shotLocalSec, editorShotDurationSec, motion);
```

The six distinct shots are `spark-hook`, `rear-mystery`, `underfloor-reveal`, `aero-load`, `contact-macro` and `racing-payoff`. Per-shot lengths, handles, separate source clocks and first/last frame are exported from `QUALITY_SHOTS` and `SHOT_SOURCE_TABLE`. All cameras use only passed Agent 2 `VehicleMotionState`, preserve yaw/world position and keep the lens outside the actual vehicle width/tyre envelope. No body-penetrating lens, final orbit, engine tone, shake, or fake global vehicle resets.

**Editor:** Camera-local retiming is NOT physical retiming. Sample the original physics state at the agreed signed-gap source clock, then pass that exact state to the camera. Preview source jumps at HARD EDITORIAL CUTS are separately disclosed; they do not pretend to be one continuous race. Preserve the 326px caption region. Do not invent spoken word timings; final 25.248s Cedar audio is solely Agent 6's task.

## Preview-only V2 facade

`quality/previews/agent-10/KitFacade.tsx` instantiates the user's **actual modelling kit V2** via `createCinematicVehicle({variant:'formula-modern',quality:'hero',...})`. It hides the kit's synthetic `contact-sparks` *after each animation update*, hides generic `metal-skid` inserts, and fits the exact approved EP004 three discrete physical skid meshes on the SAME hero root: longitudinal X=(1.18,0.10,-1.03), metal bottom Y=0.065. Kit's original floor/composite is reused; no second road or plank is created. PREVIEW adapter is NOT intended to supersede Agent 8's production `QualityF1Vehicle`. When Agent 8 is independently approved, Agent 0 should replace the facade with that API and rerun all film evidence.

The scene consumes only `sampleDynamics`, `getSkidDescriptors`, `sampleContactDrivenSparks` and the canonical `NightCircuitWorld`. Its short glints are 3D representations of returned Agent 2 particles and actual computed velocity. There is no kit emitter. All 6 shots are genuinely animated with source rate 0.16–0.43; previous near-frozen section rates ~0.0015 are avoided. The technical cutaways use the V2 mesh's actual material optically faded, not a detached proxy or duplicated carbon slab. Night-world upgrade belongs to Agent 11, spark shading upgrade to Agent 9.

## Run strict checks and BOTH native films

From repo root on a runner with Node/npm, FFmpeg and the repo's package dependencies:

```bash
npm ci
npx tsc -p production/yunex/f1_sparks_ep004/quality/tests/agent-10/tsconfig.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/quality/tests/agent-10/*.test.mjs
node --experimental-strip-types production/yunex/f1_sparks_ep004/quality/previews/agent-10/render-native.mjs
```

Expected real film compositions, **not claimed delivered until this script passes**:

| Composition | Frames | Duration | Video |
|---|---:|---:|---|
| `EP004A10SixShotV2` | 288 | 9.6 sec | `out/ep004/agent-10-native/six-shots.mp4` |
| `EP004A10BeforeAfter` | 240 | 8 sec | `out/ep004/agent-10-native/a-b-comparison.mp4` |

The A/B reel shows Agent 3's original pose then Agent 10's upgraded camera at the **exact same physical moments**, first hook then payoff; time deliberately repeats in each clearly-labelled pair. The native proof script requires 1080×1920 H.264 30/1, exact counted frames, full `ffmpeg -xerror` decode, a **5fps moving-frame hash check of each shot**, and **three PNGs per shot** (start, middle, end). Artifacts include shot source-time table and machine-readable QA.

**Current runtime limitation:** local checkout cannot connect to github.com; connected GitHub can commit source/PR but cannot trigger workflow_dispatch or run Remotion/FFmpeg in an Actions runner. The pre-existing `yunex-ep004-review.yml` is NOT configured for the new quality target/Agent 10 branch. Therefore neither native encode nor creative review may be claimed on GitHub until an operator or Agent 0 adds an authorised Actions invocation. Technical source is not creative approval.

**User/director acceptance remains required.** No edits to EP003, main, original editor PR, other visual agents, production kit V2 branch or the shared physics.
