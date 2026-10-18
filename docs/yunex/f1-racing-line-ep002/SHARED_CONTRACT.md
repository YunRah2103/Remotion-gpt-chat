# YUNEX F1 Racing Line — EP002 / Shared Production Contract (v1)

## Authority & scope
Production: **WHY DO F1 CARS TAKE THIS RACING LINE?** 26s reference cut / 780 frames at 30fps, 1080x1920 vertical. Final length may be 24–27s after Agent 7 narration. This is a separate original 3D composition; do not alter or replace prior films, especially 200 km/h braking. Five parallel visual packages feed Agent 6 picture edit, then Agent 7 sound master.

**Base:** all five branches originate from `production/f1-racing-line-ep002-contract`, itself derived from `feat/yunex-reusable-world-kit` (PR #145, still unmerged at contract creation). Never accidentally branch from older `main`. Do not assume PR #145 is merged. Check whether kit changes were superseded before integration.

**Verified kit:** `src/yunex/world-kit` exports `Vehicle`, `Environment`, `WorldLighting`, `CameraAim`, `sampleRoute`, `routeLength`, `createVehicle`, `animateVehicle`, `placeVehicle`. Select two *identical* `formula-modern` original single-seaters (one cyan/teal, one warm coral/orange). Select `track` from the existing circuit. Do not remodel the cars, change generic kit geometry, or replace the circuit. The track is a Catmull-Rom closed loop with a 12m asphalt ribbon (~6m either side of centreline); A1 may create an additive **episode-scoped** corner/drivable overlays rather than overwrite `src/yunex/world-kit/environments.ts`. Models and scenery already improved in the kit.

## Units, coordinates, animation
- SI units: metres, seconds, radians; speeds in m/s internally, km/h only in text displays.
- Three.js world coordinate: **+X car forward in its local model**, +Y up, +Z left. Ground y=0; camera world consistent.
- Pose orientation: `yaw=Math.atan2(-tangent.z,tangent.x)`; deterministic path samplers return center-of-car pose and curvature (1/metre).
- Existing `Vehicle` accepts `variant='formula-modern'`, `color`, `accent`, `wheelColor`, `pose:{position,yaw}`, `distance` in metres for rolling wheels, `steer` in radians; `steer` safely clamped ±0.65 by kit. Apply actual path-derived heading and plausible wheelbase-based steer. Do **not** rotate car geometry twice.
- Fix track corner to a *single chosen direction and turn* near the circuit's right-hand/rightmost curved section anchored close to world **[65,0,18]** (the existing control point). A1 records exact entry/apex/exit world coordinates and distance samples in its package; create visibly different legal paths within 12m asphalt bounds. Sampling rules and frame-independent data shape remain immutable; if geometry needs change after A2 implementation, coordinate through manager.
- Use `frame/fps` to drive *all* time and `sampleAtDistance(s)` to derive position/orientation, never uncontrolled real-time delta, `useFrame`, time-based randomness, or per-render mutable simulation.
- For collision-free combined shots, place the two cars at physically safe spacing/time offset or use clearly marked comparison/ghost presentation. No impossible simultaneous overlap. Distinguish **Car A shortcut teal** and **Car B racing line orange** consistently.

## Interfaces (defined in contract.ts)
- A1 owns `RacePath` (ID, arc length, sampling pose/curvature, entry/apex/exit marks) and `makeRacingLinePath(id)` / equivalent exported adapter exposing exactly that interface.
- A2 consumes A1 paths and owns `RaceFrameState` / `CarFrameState` from `sampleRaceFrame(frame, fps)` (speed, pose/path distance, steering, wheel travel, brake/throttle, lateral acceleration, load/grip utilization).
- Agent 3 owns stateless `getRaceCamera(shotId, state, frame)` or compatible R3F camera rig; it **reads** A2 state and never independently moves the vehicles.
- Agent 4 owns environment/style composition, lighting/material/trackside detail by exported `RaceWorld`/lookdev helper; it does not rebuild the base geometry or mutate shared kit exports.
- Agent 5 owns world-anchored paths/apex markers and screen-safe typographic overlays, reading A1/A2 state; it does not invent speeds or move cars.
- Agent 6 alone owns integrated timeline, combined composition and registration. Agent 7 alone owns narration, soundtrack and final master. Agents 1–5 use *isolated preview entrypoints and individual CI workflow paths*; no shared `src/Root.tsx` or `package.json` edits without manager approval.

## Engineering truth
- Same exact vehicle geometry/mass, effective grip assumptions, road conditions, and acceleration/braking model for A and B; only path differs.
- Local path curvature `kappa` implies lateral acceleration `a_lat=v^2*abs(kappa)`. Limit speed by a declared representative available lateral-force envelope. Formula downforce affects normal load and is speed dependent; do not claim a constant-grip calculation is an exact F1 model.
- Use a consistent accelerating/braking combined-grip constraint (friction circle / ellipse or justified approximation), acceleration/deceleration limits, and arc-length aware timing. Start at comparable entry conditions. Test finite values, steering sign, wheel spin vs metres rolled, in-bounds paths, and physically possible speed transitions.
- Demonstrate why shorter geometric route may lose when it needs a tighter turn and slower exit. **Do not guarantee B wins for all tracks; do not forge a pass.** Show the generated comparison metrics and actual measured time at a common endpoint / segment.
- Avoid presenting stylized tyre slip effects, engine noise, speed values or downforce as a telemetry measurement from a real F1 car.

## Colour, visual and editorial
- Car A shortcut **#25AFA8** (teal); Car B racing line **#F5A44B** (amber/coral). Track charcoal/asphalt neutral, warm sun with sky blue fill, white small text. Graphic paths reuse car colours. No team branding.
- Opening frame shows BOTH cars visibly moving through the same corner in comparison (can be cinematic match-cut, side-by-side if geometry needs clarity). No logo intro. Race/action shots dominate, overhead ~2–4s total wherever practicable. Visual progress every 1–3s; low/front three-quarter/onboard/tracking/reveal shots.
- Shared voiceover (Agent 7 may retime with Director signoff): "Why do F1 drivers take the longer way around corners? Watch these two cars. The first takes the shortest route. But the second starts wide, clips the inside, then exits wide. That wider curve lets the car carry more speed through the turn. And with a straight coming up, a faster exit can make all the difference. The shortest route isn't always the fastest."
- Reference beat grid: 0–2 mystery; 2–6 tight apparent shortcut; 6–11 wider path; 11–16 physical explanation; 16–21 higher-speed exit payoff; 21–26 summary + final racing image. Agent 6 can retime without changing physics or cause-effect.

## Ownership — equally substantive outputs
1. `track/**` and `cars/**`: A1, exact 3D paths and two-car physical choreography. Also independent moving episode shots.
2. `physics/**`: A2, physically consistent simulation with tests, visual force/speed demonstrations and moving physically driven sequence.
3. `cinema/**`: A3, deterministic camera cinematography, shot blocking and previews.
4. `lookdev/**`: A4, high-quality circuit materials/props, lighting and premium moving scene previews.
5. `graphics/**`: A5, world-anchored motion graphics, mid-film reveal and line/exit comparison shot previews.
Each agent also owns `tests/f1-line-ep002/agent-N.*`, `.github/workflows/f1-line-ep002-agent-N.yml`, and isolated previews under `src/yunex/f1-line-ep002/agent-N-preview/**` if needed. Do not edit each other's files. Competing requests to change common contracts require manager approval.

## Required completion evidence (all agents)
- A real branch with commits and PR to the production integration branch, code/tests passing (`npm ci`, `npm run check`, `npm run worldkit:test` plus agent's new tests).
- A GitHub Actions native Remotion **moving** MP4 artifact (not stills, mock animation, or an unrun recipe) with a durable run link and artifact ID, real frames, original geometry, FFprobe codec/fps/duration, FFmpeg full-decode success. Use `--gl=swangle` for software-WebGL as needed.
- Verify visually at least multiple frames AND inspect actual movement / video where tool access permits; report precisely what was seen and any limitations. Do not call a render visually approved solely based on FFprobe.
- Showcase the work on car(s), **not a generic isolated empty stage**. Minimum 5–8 seconds convincing episode footage per agent, with multiple shot types or a meaningful dynamic sequence; previews may be 960x540/720x1280 to save CI time but final episode must be 1080x1920.
- Issue update including commit SHA, PR, tests, run, artifact, findings and blocking integration questions. Manager signoff is separate and not automatic.

## Agent 6 and 7 handoff
Agent 6 only starts after five packages approved. Integrate same frame state / world/paths into 24–27s 1080x1920 H.264 picture lock; test every shot and smooth transitions. Agent 7 adds **real spoken** narration, original/licensed engine SFX/music, loudness/peak checks, FFprobe and full FFmpeg decode; deliver `YUNEX_F1_RACING_LINE_EP002_FINAL.mp4`. Never pretend narration was recorded or final media exists before verification.
