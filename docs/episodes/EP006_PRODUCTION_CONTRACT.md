# YUNEX EP006 — Shared production contract (2026-10-24)

**Episode:** How Do Rally Cars Survive Huge Jumps?  
**Status:** preproduction; no approved/recorded narration. **Do not invent voiceover or render a claimed final master.**

## Frozen initial source and compatibility
- Base repository: `YunRah2103/Remotion-gpt-chat`, `main`; latest inspected head before this setup was `629063aefea9b305c0e03ba41e2208b6234fde42`. Re-check `main` before work; preserve unrelated changes.
- Read `docs/YUNEX_MAIN_STUDIO_QUICKSTART.md`, `docs/YUNEX_V4_AGENT_GUIDE.md`, `docs/YUNEX_V3_AGENT_GUIDE.md`, and `docs/YUNEX_AGENT_STUDIO.md`.
- Hero car: **existing** `rally-hatch` (4.25 m × 1.94 m × 1.52 m, wheelbase 2.62 m, nominal wheel radius 0.36 m); use `createCinematicVehicle({variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true})`. Keep original shell, fitted named parts, axle/wheel anchors, tire roll and driver rig. Never substitute a generic box, unrelated imported car, or rebuild compatible assets.
- Stage: `world.kind:'rally'` (gravel stage), `roughness:0.8` as a starting point. Geometry and contact sampling must use one agreed road/jump surface function; existing `rallySurfaceHeight` and `roughRallyRoad` support rough-road movement, **not** airborne takeoffs or ballistic landings.
- World coordinates: metres; **+X forward, +Y up, +Z left**, right-handed. Frames are absolute 0-based integers, fps=30. Deterministic evaluation: no dependence on prior rendered frame or nondeterministic randomness.
- V4 is merged on main and was technically demonstrated with a real 10-second silent rally MP4. That proof is **not** a realistic validated jump simulation, aesthetic approval, or EP006 footage.
- Fresh imported GLB catalogues have separate licence checks; use the already-integrated procedural rally car for EP006.

## Deliverable constraints
Portrait `1080×1920`, exactly `30/1 fps`, H.264 MP4; film **target** 25–30 seconds. Initial storyboard budget **27.0 seconds / 810 frames**, *provisional until genuine approved narration*. Silent visual-agent previews are encouraged; no manufactured narration or subtitle timings. Final editor re-times only against provided actual word/audio timestamps.

| Beat ID | Provisional frames [start,end) | Objective |
|---|---|---|
| `hook` | [0,66) | Car launches within first 30 frames; foreground-scale dynamic hero angle |
| `landing` | [66,192) | Clear touchdown, large suspension compression, dust/gravel, believable rebound |
| `reveal` | [192,375) | Replay/camera dive below car; follow four wheel, spring and damper movements |
| `engineering` | [375,555) | Tyre flex + controlled spring compression/damper energy dissipation + strong chassis |
| `recovery` | [555,675) | Stabilise, regain traction and blast through scenic gravel stage |
| `finale` | [675,810) | Second visible launch, clean landing, fast low-angle getaway, no text outro |

**Events are authored in absolute project seconds**; for initial integration target J1 visibly airborne immediately, first touchdown around 2.4 s, J2 takeoff around 22.8 s and touchdown around 25 s. Agent 2 documents exact committed event frame values and passes them to other agents. Any timing changes require manager/editor coordination, and **must remain consistently sampled across all deliverables**.

## Shared animation / physical interface
Agent 2 owns the canonical deterministic function `sampleEp006Motion(frame:number)` in `src/yunex/ep006/dynamics/`. It must return (all SI units, validated finite values):
- `frame`, `timeSeconds`, `phase` (`approach|takeoff|airborne|touchdown|rebound|driving`), `jumpId` (`J1|J2|null`);
- `positionM:[x,y,z]`, `rotationRad:[rollX,yawY,pitchZ]`, `velocityMps:[x,y,z]`;
- `wheels` with stable keys `front-left`, `front-right`, `rear-left`, `rear-right` and, per wheel, `compressionM`, `steerRad`, `spinRad`, `contact:boolean`, `surfaceHeightM`;
- `impact01`, `dust01`, `gravel01` in 0..1 and `event`/event IDs where relevant.

Physics must include airborne gravity, launch velocity, a trajectory crossing the actual landing surface, coordinated touchdown, bounded progressive spring/tyre deflection, rate-dependent damping, controlled rebound and receding dust. Do **not** fake flight by moving the car along a generic constant-height road, apply tyre-ground forces while airborne, detach wheels, or claim engineering calibration absent measured parameters. Agent 1 and Agent 2 agree suspension geometry and practical compression bounds in writing before declaring readiness. Engineering sequences may use stylised slowed/replayed samples but must keep causal order and clearly be a visual replay, not a second contradictory landing.

## Ownership and integration API
Each agent edits **only their named namespace, own tests, own unique studio project** and own render/evidence folder; no two agents edit the same recipe, global modelling-kit file, shared contract or older episode source. If shared-kit changes are unavoidable, propose a narrowly scoped PR or manager-reviewed follow-up. Never force-push another agent's branch.

| Agent | Branch | Owned sources | Unique proof ID |
|---|---|---|---|
| 1 | `agent/ep006-01-rally-vehicle` | `src/yunex/ep006/vehicle/**` | `ep006-a1-vehicle` |
| 2 | `agent/ep006-02-jump-physics` | `src/yunex/ep006/dynamics/**`, `src/yunex/ep006/fx/**` | `ep006-a2-jump` |
| 3 | `agent/ep006-03-cameras` | `src/yunex/ep006/cameras/**` | `ep006-a3-cameras` |
| 4 | `agent/ep006-04-rally-stage` | `src/yunex/ep006/environment/**` | `ep006-a4-world` |
| 5 | `agent/ep006-05-mechanical-story` | `src/yunex/ep006/mechanical/**` | `ep006-a5-mechanics` |

Each agent supplies an exported API with sample usage, using the above motion data contract, and declares coordinate frames and whether the API works before the other agent modules are available. Do not bake a competing car, road mesh or second motion simulator into camera/mechanical scenes. Use private `src/yunex/studio-projects/<proof-id>/` only if not already present; output `out/ep006/agent-0N/` for local MP4s/contracts and upload shareable CI artifacts. Native previews must show **actual movement**, not stills, static screenshots, dry runs or passing tests.

## Scene, visual and engineering acceptance
- Car silhouette must be sculpted and detailed, not flat/boxy; wheels roll in coherent direction, align to suspension and stay in arches at full articulation.
- Contact on the same meshed gravel surface as physics; the wheels must be airborne in flight, and the landing must visibly compress before rebounding. Ground-to-tyre penetration/tunnelling is failure.
- Impact effects originate at contact points with shadows, speed-based motion, layered dust and gravel; avoid generic particle fog.
- Stage must have a believable jump crest, terrain depth, rocks/vegetation variation, atmospheric lighting and clear readable travel corridor, not an empty plane.
- Cameras track the hero at useful phone-scale; balanced lens/angles, no repeated overhead, jitter, crop, fence obstruction or stationary 'moving' clips. First-second and finale must be particularly strong.
- Mechanical reveal shows springs/dampers/tyres doing different jobs; tyre deforms, damper moderates oscillations and chassis keeps aligned assembly. No unsupported claims that suspension eliminates impact energy or that the chassis simply 'absorbs' all force.
- Keep overlays minimal; no generic HUD. Final subtitles held until approved narration.
- Scope sign-off requires a **real playable moving MP4**, native 1080×1920 30fps, `ffprobe` metadata, full `ffmpeg` decode, SHA256, source commit, listed issues/limitations and evidence frames/camera/contacts checked visually. Source code passing tests is not quality approval.

## Handoff cadence
1. Agent 1 publishes geometry/suspension attachment details; Agent 2 publishes physically coherent absolute-sample poses/events; Agent 4 publishes the matching ground-height/jump profile.
2. Agents 3/5 consume those interfaces (or documented test fixtures while waiting), then regenerate previews from final source after integration.
3. Manager reviews PRs plus actual MP4s; commits and CI alone never equal PASS.
4. **Only after user-supplied voiceover**: Agent 6 builds `src/yunex/ep006/editor/**`, stitches approved footage at actual speech timing, produces phone-safe subtitles; Agent 7 mixes engines, suspension thud, gravel, wind, music below narration. Neither is launched now.
5. Keep full provenance and source/recipe hashes. Do not combine clips from mismatched renderer versions or bypass shot-contract checks.
