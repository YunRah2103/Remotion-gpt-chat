# YUNEX EP004 — Binding visual production contract (v1, 20 October 2026)

**Film:** WHY DO F1 CARS SHOOT SPARKS? — original, Formula 1-*inspired* 3D motorsport short, no real logos/liveries.
**Authority:** Agent 0; all five departments read this and `shared/contract.ts` before coding. **EP003 and `main` are out of scope.**
**Isolated production branch:** `production/yunex-ep004-base` from **PR #145**, `feat/yunex-reusable-world-kit`, commit `d31fbaa0f95abc468a3294ef2a1b2f6baa84bccb`. PR #145 is OPEN, unmerged and its mergeability is false at setup; **do not merge/rebase it or overwrite main**. Adapt its original model and circuit *within EP004 only*. Kit capabilities are stylised 3D, not certified F1 CAD or simulation.

## Art direction and storyboard
Premium high-contrast **night racing**, legible gorgeous teal/graphite original single-seater with restrained warm accents, race circuit lighting, spectacular white-gold metal sparks. Spectacle → Mystery → Hidden mechanism → Explanation → spectacular payoff. A car moves naturally in every racing shot. No branded teams; no random spark overlay; no static slideshow/HUD.
- Opening ~0–3s: dramatic car-wide close low pass and coherent skid-generated sparks within first second.
- ~3–6s: rear moving pursuit, mystery.
- ~6–11s: moving underbody reveal; clearly distinguish composite plank, discrete metallic skids, surrounding structural floor.
- ~11–16s: moving aerodynamic-load/suspension/ride-height comparison; show *plausible illustrative* model not false physics certainty.
- ~16–21s: macro metallic skid/asphalt contact with physically anchored emission, particles inherit speed and direction.
- ~21–28s: varied, premium racing payoff, controlled spark shower, car moving into end frame, no logo or outro.
All beats are **retimeable shot modules**, not final locked edit. **Actual recorded British male VO sets picture length** (target ~25–28 seconds) after visual approval.

## Fixed asset / frame / geometry
- Existing factory **`vehicleSpec('formula-modern')`**, `createVehicle({variant:'formula-modern', ...})`, `animateVehicle(root,distance,steer)`. Preserve the source kit. Specifications observed in PR #145: **length 5.40 m, width 1.98 m, height 1.04 m, wheelbase 3.42 m, wheel radius 0.36 m**.
- Coordinates use **metres**, right-handed **+X car-forward, +Y up, +Z vehicle-left**; ground reference **Y=0**, yaw about +Y in radians. Camera must follow that sign convention. The kit's two wheel axles at local **X=±1.71 m**, left/right centers **Z=±0.83 m**, pivot **Y=0.36 m**. Front-right = `[1.71,0.36,-0.83]`. Wheel roll rotates about Z with angular phase `-distance/0.36` (factory animator).
- Kit environment: **`createEnvironment({kind:'track',timeOfDay:'night',seed:12})`** and **`sampleRoute('track',distanceM)`** closed circuit (distance wraps); route angle is the authority for vehicle heading. Existing kit's track base is principally flat and requires EP004 circuit-night enhancements by Agent 4.
- EP004 vehicle adaptation: a distinct **structural floor**, a central **plank** and discrete **flush metallic skid pieces** fitted *in plank positions*. The **forward metallic skid is obligatory** in the technical reference; middle/rear optional. Agent 1 implements a clear, visible **forward skid** and may add visibly distinct optional rear skids. The approved pre-contact lower reference height for the forward skid, at baseline car pose and nominal suspension, is **0.065 m above flat road** as an *illustrative cinematic geometry datum* (not an FIA dimensional claim). Adapt kit floor/plank locally so this is mechanically connected and visible, never a floating slab. New geometry must replace/occlude incompatible shot-local body floor where necessary.
- Share car paint, wheel structure, plank and skid nodes across all shots. Model fidelity can improve **within Agent 1 ownership only**; no department may rebuild its own hero car.

## Mechanical accuracy — binding
**2026 FIA Formula 1 Regulations, Section C Technical, Issue 21, 19 Oct 2026, Art. C3.6**: https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf ; **C3.6.1** Plank Assembly = plank + skids + mountings; **C3.6.2** plank is a separate specified material/geometry; **C3.6.3** forward metallic skid mandatory, optional metallic middle/rear skids; allowed metallic skid materials include **Ti6Al4V titanium alloy OR 17-4PH stainless steel** subject to competition-specific material FIA-F1-DOC-041. Avoid saying every modern car always uses titanium regardless of event.
Additional primary explanation: https://www.fia.com/news/fia-race-director-charlie-whiting-media-briefing ; https://www.formula1.com/en/latest/article/watch-why-do-f1-cars-spark-tech-expert-albert-fabrega-has-the-answers.2Fja1yvqN9ZgPdyVkUDkDn.2Fja1yvqN9ZgPdyVkUDkDn.2Fja1yvqN9ZgPdyVkUDkDn
**Truth conditions:** metallic contact comes from skid piece, not plank wood, floor scraping in full, or exhaust; aerodynamics/low setup, compressions, kerbs and bumps *can* contribute; more sparks ≠ always more downforce/speed; sporadic sparks ≠ proof of damage; sparks cease when no contact. Never claim accurate full CFD, suspension telemetry, material thermal spectra or legally homologated dimensions. This is an explicitly **illustrative but defensible** physically coupled render.

## Single deterministic timing and route contract
- Global source time `tSec>=0` seconds. EP004 preview fixtures may use a consistent **moving reference** start distance `72 m`, nominal speed `62 m/s` (~223 km/h) as an illustrative cinematic choice, **not a measured F1 telemetry value**. All shot modules accept arbitrary `tSec`, speed/episode beat controls and trim handles; editor owns global VO sync.
- Authoritative centreline `sampleRoute('track',distanceM)` and authoritative **road profile** `shared/track.ts:sampleTrackSurface(distanceM)`. It has a gentle deterministic profile near 72 m and 138 m; Agent 4 must mesh the matching drivable surface so the visual road and Agent 2's contact surface coincide. Distances and height sampled *on centreline*; support per-skid track-height sampling by projection/lookup on centreline with documented approximation. Y=0 baseline elsewhere. No invisible road intersections.
- Agent **2 alone** implements `sampleDynamics(tSec,params):VehicleMotionState`, `sampleSkidContacts(tSec,motion,skids):SkidContact[]` and `sampleSparkParticles(tSec,motion,contacts):SparkParticle[]`. Sample all state from absolute time (or seeded closed-form / fixed-step precomputed trajectories) regardless of render order. Road height plus vehicle heave, pitch and roll plus actual world skid positions determine signed gap. Emit sparks **only** for real negative/zero gap with movement; contact origin = actual skid-track intersection; provide reproducible speed-dependent ejection and finite particle lifetime, plausible rearward trajectory in world, no backwards flight relative to wheel motion mistakes. No random/wall clock/`useFrame` integration.
- Agent **1 alone** owns hero car and exports `F1HeroVehicle` / `UnderfloorReveal` and `getSkidDescriptors()` (skid IDs, local contact coordinates), receives authoritative motion. Agent 3 owns `sampleShotCamera`; Agent 4 owns `NightCircuitWorld` and road ribbon matching `sampleTrackSurface`; Agent 5 owns `StorySequence`/minimal labels based on shared data. Exact type definitions in `shared/contract.ts`. Agents **must not** mutate the manager contract, independent physics path, or their colleagues' owned source.
- Suggested hero state: baseline skid bottom 65mm off nominal ground; illustrative aerodynamic heave and short geometry bump may close this gap; Agent 2 documents parameter calibration and shows actual signed-gap/contact logs proving each spark burst. Do not hardcode a particle emitter to a manually chosen timestamp.

## Boundaries / integration
Everything episode-specific under `production/yunex/f1_sparks_ep004/`:
- `shared/**`, this contract, `STATUS.md`, `HANDOFF.md`, `LAUNCH_PROMPTS.md`: **Agent 0 only**.
- `mechanics/**`: Agent 1 only. 
- `physics/**`: Agent 2 only.
- `cinema/**`: Agent 3 only.
- `look/**`: Agent 4 only.
- `story/**`: Agent 5 only.
- `previews/agent-N/**` and `tests/agent-N/**`: same numbered agent only.
- Integration-only `entry.tsx`, `integration/**`, `editor/**`, `audio/**`: Agent 0 / later Agent 6 / Agent 7 by explicit delegation. No one changes `src/Root.tsx`, main workflows, third-party or EP003 code.
All specialist branches start from EP004 base; each PR targets **`production/yunex-ep004-base`** and documents any interface change *before* proposing a cross-ownership alteration.

## Mandatory proof and production gates
Each visual specialist must deliver code + branch commits + PR/handoff, **two genuine moving MP4s** (an illustrative tight mechanics/shot preview AND a portrait 1080x1920 source-context clip), accessible Actions artifact or Release URL, `ffprobe` width/height/fps/frame/duration and full `ffmpeg -f null -` decode, with at least frame 0/middle/end screenshots and actual reviewed time-evolving motion. Lower-res proxy only if native composition is verified separately. Use Remotion H.264/yuv420p with `--gl=swangle` on Linux where needed, deterministic frame evaluation. Run `npm run check`, appropriate tests and exact render command. Do not call a still render moving footage.
Agent 0 checks 3D geometry, contact coupling, visual quality and PR merge compatibility before **APPROVED** / **INTEGRATED**. Allowed statuses **NOT STARTED → WORKING → PREVIEW READY → REVIEWED → APPROVED → INTEGRATED**; PR creation alone ≠ approval. Agent 6 blocked until visuals integrate; Agent 7 blocked until picture lock. Only a verified playable final MP4 is delivery.
