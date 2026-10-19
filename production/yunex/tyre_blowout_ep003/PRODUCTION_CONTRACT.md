# YUNEX EP003 — Shared production contract (Phase 1)

**Project:** WHAT HAPPENS WHEN A TYRE BLOWS OUT AT SPEED?
**Authority:** Agent 0 (production manager); changes to shared API require manager approval.
**Locked asset provenance:** `YunRah2103/Remotion-gpt-chat`, PR #145 `feat/yunex-reusable-world-kit`, commit **`d31fbaa0f95abc468a3294ef2a1b2f6baa84bccb`**.
**Branch:** `production/yunex-ep003-base` (from exact kit commit). Five visual branches descend from this production branch and submit PRs **into this branch**, not directly into `main`. DO NOT merge PR #145 or overwrite main.
**Integration warning:** 2026-10-19 verification: main and PR #145 have diverged (kit ahead 12, behind 8); main reconciliation is separate work after visual acceptance.

## Art direction and scene truth
- Hero: `grand-tourer` generic road car, midnight slate blue `#4A667E`, modest warm accents; one consistent body, wheels, side, lighting and time of day. Alternative model requires approval.
- Stage: existing `highway` environment and `day` lighting with balanced warm highlights; bright legible rubber and paint, premium stylised-game render, no grain/no washed-out grade/no heavy vignette.
- Incident: **front-right** rapid loss of air pressure. The tyre visibly deflates and deforms **without automatically exploding into fragments**. Demonstrate controlled, conditional recovery; no mandatory spin, roll, or guaranteed outcome.
- Visual hook: clear observable tyre damage **inside first second** at legible scale; camera reveals the forward-moving vehicle promptly.
- Explanatory cutaway and force graphics must agree with mechanics and authoritative Agent 2 path; labels are short and optional.
- User-provided narration is a provisional Agent 6 contract, not a Phase 1 audio deliverable. No final edit, music or voice production in Phase 1. Clips remain retimeable.

## Shared 3D model frame and positions
- Three.js world **metres**; **+X forward, +Y up, +Z vehicle-left**; ground y=0. Positive Z is car left; right side is -Z. Yaw about +Y, radians.
- `vehicleSpec('grand-tourer')`: length=4.94m; width=1.94m; height=1.34m; wheelbase=2.92m; wheel radius=0.36m; 2 axles.
- Existing road-car wheel anchors are x = ±wheelbase/2; z = ±(width/2 - .09); wheel-pivot y=radius. **Front-right tyre pivot local position = [1.46, .36, -.88] m.**
- `createVehicle` has wheel hierarchy **steering pivot → `wheel-roll` → rubber/rim**, `userData.steering` pivot and `userData.wheel` rolling groups; steering pivot rotates Y, roll rotates Z. Existing `animateVehicle(root,distance,steer)` spins **all** wheels with angle `-distance/radius`. Ensure failed-wheel custom geometry can be driven separately *without visually replacing the whole wheel*; if replacing its tyre surface, preserve the rim/axle/caliper and explicit ownership.
- `sampleRoute('highway',d)` returns `{position:[x,y,z],yaw}`, highway follows default z=-1.85 and the straight route **wraps at 180m**. NEVER show a visible teleport/repeated gantry: keep shots within a valid range or explicitly design a continuous extension/cut.
- Existing highway road z approximately [-7.5,7.5], median around z=0, edge lines z=±7.05, guardrails z=±7.8; thus the space beyond the outer lane does **not** provide a full vehicle-width hard shoulder. A believable final safe stopping location requires an approved lay-by/emergency-refuge/exit extension or a shot clearly established elsewhere; never park a car inside the guardrail or in a live traffic lane as a safe ending.
- Avoid assuming roads have rigid-body/tyre-suspension physics: world kit route is kinematic, parts kit is illustrative. All episode vehicle dynamics and tyre deformation must be implemented independently and honestly labelled illustrative.

## Common timeline and deterministic mechanics
- **Local source-clip time** `tSec >= 0` in seconds. Intended **reference incident** `failureStartSec=0.75` in a reusable preview scene, pressure-loss ramp ~0.30s; **not** a final film time. Visual sequences accept a remappable `tSec`/event-relative time and can start/end with handles. Agent 6 sets final timing only after recording the voiceover.
- Illustrative dry straight road, stable straight travel before failure, nominal starting speed **27.78 m/s (~100 km/h)**, a single failed **front-right** tyre. This is a chosen scene parameter, not an experimentally measured outcome or a claim about all tyre failures.
- No exact force, yaw, stopping-distance, pressure or speed numbers should appear onscreen unless derived from documented assumptions and cross-checked. Never tune physics to guarantee an exaggerated spin or predetermined side-pull.
- All physics is **absolute-frame deterministic**: no wall clock, `useFrame`, unseeded random, accumulated updates, timeline-delta integration, or hidden mutable state. Repeated calls at t=any seconds yield identical results, regardless of order.
- Agent 2 is sole authority for `sampleDynamics(tSec, params): VehicleDynamicsFrame`. All other departments consume its actual output for location, yaw, steering, roll, pitch, hub compression, longitudinal distance, tyre spin phase and per-wheel contact/load values. Do not invent independent vehicle trajectories in cinematography or graphics.
- Agent 1 is authority for damage/deformation and `sampleTyreFailure(tSec,...)`; coordinate with Agent 2 on changing rolling radius/contact support. Depict pressure loss rather than treating the tyre as vanishing. No impossible re-inflation when scrubbed backwards.
- Kinematic/braking responses are illustrative with clearly documented assumptions, units, bounded values, sensitivity tests, plausible sign conventions and frame-independent integration (precomputed fixed-step sampled table with interpolation is acceptable).

## Required episode module boundaries
All contributions under `production/yunex/tyre_blowout_ep003/`; imports from untouched `src/yunex/world-kit` and `src/yunex/parts-kit`.
- `shared/contract.ts` and `PRODUCTION_CONTRACT.md` / `STATUS.md`: **Agent 0 only**. No agent edits those files without coordination.
- `mechanics/**`: Agent 1 only; export `TyreFailureWheel`, `TyreCutaway`, `sampleTyreFailure`, independently previewable scenes.
- `dynamics/**`: Agent 2 only; export `sampleDynamics` and scenario parameters; other agents consume the returned pose.
- `cinema/**`: Agent 3 only; export shot presets and cinematic camera components **taking dynamics state**, not inventing it.
- `look/**`: Agent 4 only; export `EpisodeWorld` scene/lighting/material helpers and setting extension if justified.
- `story/**`: Agent 5 only; export animated pressure/forces/reaction/transition graphics driven by actual state.
- `previews/agent-N/**` and `tests/agent-N/**`: individual agent-owned; do not touch someone else's.
- Integration root composition, registration and core dependencies are **reserved to Agent 6**, after visual approval; do not independently edit `src/Root.tsx`, `src/index.ts`, `package.json`, kit source, prior episodes, or shared scripts.
- Until Agent 2 has a PR, other previews may use a **clearly marked temporary static/demo motion fixture** to build and render isolated components, but do not call it validated physics. Replace before approval.

## Episode interface
See `shared/contract.ts` for `EpisodeParams`, `VehicleDynamicsFrame`, `WheelFrame`, `TyreFrame`, camera and overlay requests. Every layer declares its required inputs and does not duplicate physics. Manager to review any change request to public interfaces.

## Deliverables per agent (Phase 1 only)
- Working committed TypeScript/Three.js/Remotion code on own branch and a PR targeting **`production/yunex-ep003-base`**.
- At least **two** genuine moving native Remotion MP4 previews: one tight source demo and one full/mobile-context demo, plus frame grabs/contact sheet showing temporal continuity. If native render unavailable, report exact blocker, and **do not claim moving MP4 verified**.
- 1080×1920, 30fps source composition with deterministic frame functions; lightweight review renders may use lower resolution but MUST specify settings, rendering path, frames, duration, SHA/URL/file accessibility. `--gl=swangle` software GL is the baseline; test actual installs.
- `npm ci`, `npm run check`, `npm run worldkit:test`, `npm run partskit:test` plus agent tests where feasible. Provide actual exits and errors, not simulated reports.
- Validate frame 0, pre-/at-/post-failure frames, recovery, and final preview frames, including full video FFprobe+FFmpeg decoding and visual inspection. No black frames, flat/lost geometry, grain, clipping, broken continuity or impossible wheel spin.
- Exports must support arbitrary starts/durations, material and colour continuity, mobile safe area, 30 FPS, alternative camera timing. No narration/audio needed.

## Safety and scientific constraints
- Narrative reflects a **possible** vehicle response: one tyre rapidly deflates, contact and rolling resistance change, transient yaw/steering correction may be needed; real results vary.
- Show two hands steadying the wheel (if driver included), **avoid sudden harsh brake/steer inputs**, stabilise and gradually decelerate to a suitable place *if conditions permit*. NHTSA blowout guidance notes abrupt braking **or abruptly removing accelerator** can destabilise; include a brief initial stabilisation before gradual easing of the throttle. See https://www.nhtsa.gov/vehicle-safety/tires ; consult UK Highway Code for general vehicle control: https://www.gov.uk/guidance/the-highway-code/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158
- Not a live driving simulation or one-size-fits-all emergency instruction. Avoid false certainty about wheel pull direction, grip, steering and stopping distance.

## Review and promotion
Agent 0 reviews **actual MP4 playback and branch diffs** before status becomes APPROVED. Five usable department packages are necessary before Agent 6; Agent 7 waits for Agent 6 picture-lock-with-VO. All reports distinguish: CREATED vs LAUNCHED vs ACTIVE vs PR OPEN vs RENDER VERIFIED vs APPROVED.
