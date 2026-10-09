# AUTOMOTIVE ENGINEERING 002 — Carbon-ceramic brake heat film
## Production contract v1 · 4 specialists + 1 Master

Source repository: YunRah2103/Remotion-gpt-chat ONLY.
Base SHA: 25a83c4e58e60c909624494745158385b7f962d9
Master branch: automotive-brakes-001/master
Specialist branches: automotive-brakes-001/a-hardware, automotive-brakes-001/b-motion-thermal, automotive-brakes-001/c-cinema-xray, automotive-brakes-001/d-graphics-qa.

### Film scope

One 25.0-second original film, 750 frames, 30 fps, 1080×1920 (vertical), H.264 MP4. DO NOT model a complete car. The ghosted/line-based performance-car outline is ONLY minimal context at the beginning and possible ending, not an automotive asset/model-building task. Spend the vast majority of detail on one front brake assembly.

Model a plausible road-car carbon-ceramic friction ring with internal ventilation, separate hat/hub interface, paired pads, pistons/caliper body, fasteners, mounting bracket and minimal upright context. Physically correct basics: disc/hat rotate together; caliper body remains stationary; opposing pads move toward the disc faces; braking decelerates the disc; heat emerges from friction surfaces. Do not claim precision temperatures or cooling simulation without external data. False colour must be labelled illustrative.

Shot boundaries (inclusive): 0–119 context; 120–269 close mechanical reveal; 270–449 friction/thermal heat; 450–629 repeated braking/fade resistance and lightweight benefit; 630–749 hero brake assembly. Proof frame targets 48,168,321,531,705. Moving proof sequences 135–195 and 300–360. Avoid empty frame space, excessive screen text, toy proportions and cheap glowing-rotor shortcuts.

### Mechanical interface and scale

- Three.js axes: Y up; define X as global axle/rotor axis; rotor disc plane YZ. GLB export must explicitly document any Blender-to-glTF axis and scale conversion.
- Illustrative, non-manufacturer-specific rotor OD 0.39 m, 0.195 m friction ring outer radius. No exact hardware brand or CAD attribution.
- A provides named stable nodes: RotorAssembly, FrictionRing, RotorHat, CaliperBody, PadInner, PadOuter, Hub, UprightSupport, plus rig-manifest.json documenting rest positions, pivots, bounds, axis and separate moving pieces.
- B provides pure frame-deterministic brakeStateAt(frame) returning rotorAngleRad, rotorSpeedRadPerSec, brakePressure01, padGapMetres, heat01, cooling01, timeSeconds. No wall-clock randomness; ensure continuous deceleration, meaningful pad travel, heat generation under contact, cooling when released, and rotor stop.
- C provides separate components for GhostCarOutline and BrakeCameraRig/BrakeLighting, with optional shotId/frame; never directly change brake kinematics or model pivots.
- D provides TitleOverlays, PartLabels, QA rules/report; no arbitrary exact temperatures or stopping distance claims.

### Strict ownership: do not edit other agent work

A owns: src/brakes001/hardware/** and production/videos/carbon-ceramic-001/hardware/**.
B owns: src/brakes001/motion/** and production/videos/carbon-ceramic-001/physics/**.
C owns: src/brakes001/cinema/** and production/videos/carbon-ceramic-001/lookdev/**.
D owns: src/brakes001/graphics/** and production/videos/carbon-ceramic-001/qa/**.
Each specialist ALSO owns only its respective handoffs/agent-[a-d].json + .md.
MASTER alone owns src/brakes001/CarbonCeramic001.tsx, src/Root.tsx, shared adapters, full-film workflows, central package/dependency changes, release, and shared contract/voiceover files. No existing videos should be modified.
Never access or modify YunRah2103/yunus-video-lab.

### Handoff and integration

1. Master publishes this contract first. Specialists branch from the master head and read their own prompt.
2. All specialist work is separate GitHub chat sessions, NOT auto-launched by these docs.
3. Each agent commits real files and real proofs, documents source SHA, and writes/validates its own handoff JSON with existing production/tools/handoff.py.
4. Role mapping for the existing validator: A hardware; B engineering; C director; D qa. Master release.
5. A first: real Blender original hard-surface asset + GLB export/inspection + close-up lighting proof; preserve geometry nodes and materials. No giant binaries committed.
6. B first: deterministic kinematic/thermal proof with stand-in geometry; Master later replaces the stand-in with A's real nodes.
7. C first: original lightweight x-ray silhouette/camera rigs and full-story shot frames using simple placeholders, then replace with A.
8. D first: legible 9:16 graphics and engineering acceptance rubric; final independent visual QA AFTER Master integrates real native footage.
9. Master reviews SHA, tests and artifact links; integrate with real verified work, render moving previews, then final 750 frames with native FFprobe exact-frame and full FFmpeg decode.
10. Passing automated tests is not a substitute for watching frames and video. Deliver one real MP4, not a plan.

### Independent review criteria

- Brake friction ring, vanes/vents and thickness credible and detailed at 1080 pixels.
- Disc orientation/rotational axis and pad closing direction correct.
- Caliper remains fixed, both pads clamp both friction faces; no intersection flicker.
- Thermal illustration tracks braking phase and visibly cools after release; not constant red glow or an asserted calibrated temperature.
- Ghost outline clearly secondary and occupies <30% of the film.
- Full 25 seconds, intentional camera motion/shot changes and graphics placement.
- Real VO only if user approves; never fabricated narration/transcript.
- Reviewer D signs off visual + technical issues honestly; Master reports any unresolved problems.
- Background engineering references available at manufacturer Brembo and Porsche links in VOICEOVER.md.

Status: PREPRODUCTION. This repository contains the plan and agent handoffs, NOT a completed 3D film or finished MP4.
