# Agent 2: Authoritative braking, tyre grip, normal-load transfer and ABS

Physics input: sampleBrakingSimulation(timeSec, scenario?) from simulation.ts.
Scenario: dry-track (default) or low-grip-abs (separately labelled illustrative insert).
Output: exact manager-owned BrakingSimulationState from ../contracts.ts, all SI units.
This is NOT measured vehicle data or a guaranteed stopping distance.

## Seam with Agents 1/3/4/5

- World axes +X forward, +Y up, +Z left; derive wheel positions using wheelAnchors(vehicleSpec('grand-tourer')).
- Wheel keys front-left, front-right, rear-left, rear-right.
- wheel.rotationRad is positive cumulative hub angle, in rad. For the existing kit wheel-roll local object use rotation.z = -rotationRad; rotor rotates with hub, caliper remains static.
- wheel.angularSpeedRadPerSec and wheel.slipRatio derive from the same dynamics as traveledM and speedMps. On the normal dry track, braking slip is near 0.12.
- wheel.brakePressure01 is actual applied 0..1 hydraulic brake-demand proxy. Agent 1 should map it to millimetre-scale pad travel, not independently animate pressure. ABS will modulate this applied value during the labelled low-grip insert only.
- wheel.normalLoadN shifts toward front under deceleration and all four normal loads sum to vehicle weight; roadLongitudinalForceN is finite, grip-limited force.
- wheel.absIntervening is never artificially triggered during dry stop; only indicates release modulation after approaching-lock slip in separate low-grip transient. ABS does NOT add traction or guarantee shortest stopping distance.
- brakeHeatJ is integrated friction work at brake pads/rotors, NOT literal temperature or all kinetic energy; tyres, air drag and rolling friction dissipate additional energy.
- pitchRad is a physically bounded illustrative body dive.
- mapFilmFrameToSimulationSec(frame) separates slow-motion editorial time from actual physical stop. mapAbsInsertFrameToSimulationSec(localFrame) is a different scenario for an explicitly identified demonstration, not a continuation of the normal stop.

## Verify in repository root

node --experimental-strip-types --test src/yunex/braking200/physics/simulation.test.mjs
npm run check
npx remotion render src/yunex/braking200/physics/entry.tsx BrakingPhysicsMacro out/a2-abs.mp4 --frames=0-144 --scale=0.5 --gl=swangle --codec=h264 --pixel-format=yuv420p
npx remotion render src/yunex/braking200/physics/entry.tsx BrakingPhysicsContext out/a2-track.mp4 --frames=0-119 --scale=0.5 --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -show_streams -show_format out/a2-abs.mp4
ffmpeg -v error -xerror -i out/a2-abs.mp4 -f null -

The isolated Actions workflow renders two native Three/R3F/Remotion MP4s at 540x960, samples three real frames each, checks substantial temporal change, verifies FFprobe and fully decodes both videos. Preview macro = animated contact patch with force/load/pressure/ABS; context = existing actual grand-tourer and track driven by four-wheel physics state. This is not the final edited film. Even clean CI requires real visual review and manager approval.

## Current V3 cinematic A1+A2 integration — existing kit preserved

The authoritative physical sampler, A1 mechanism, scenario mapping and A1/A2
pressure/rotation sign remain unchanged. The A2-owned integrated-preview.tsx
contains exactly one A1 BrakingVehicle, not a separately invented brake rig.
The GitHub workflow pins A1 source revision c704dc67acd0567cb7dbde8c21a9a4b0bf4f1f0c
into the temporary runner checkout only; engineering/** is NOT committed here.

- PhysicsIntegratedDryTrack: confident low three-quarter car opening, actual
  grand-tourer/track, cinematic travel toward the **front-left A1 drilled disc**.
  Consumes dry-track mapped physical time and never engages ABS.
- PhysicsIntegratedAbsMacro: a **separately labelled illustrative low-grip**
  run with actual A1 pressure-driven opposing pads, rotating A1 disc and active
  conditional ABS status and pressure bar (not an editorial frame pulse).
- Pure physicsVisualSignals(s) in visual-signals.ts maps sampler wheel normal
  load, tyre-road force, slip, ABS state and pressure into bounded illustrative
  front spring travel, elliptical tyre contact illumination, restrained short
  grip streaks and accurate DOM readouts. No invented suspension measurement.
  These effects fade when the car stops.
- A3 owns final cinematography and should inject its camera/route into this
  single A1 vehicle; A4 owns final materials, A5 owns final typography.
  This is a *real integrated proof*, not a replacement for manager-reviewed
  premium film cinematography or the final master.

Reproduce the pinned proof as GitHub Actions
`.github/workflows/yunex-braking-a2.yml`. The runner stages A1 files at its
immutable SHA before `npm run check`, running both A2 test files and A1
mechanics tests. Then it renders:
`PhysicsIntegratedAbsMacro` for frames 0-144 and
`PhysicsIntegratedDryTrack` for frames 0-149 via
`src/yunex/braking200/physics/integrated-entry.tsx` at 540x960, 30fps.
The workflow FFprobes, fully decodes, samples four frames/video, checks genuine
moving hashes and publishes SHA256 video digests. Prior original A2 preview
compositions are retained in entry.tsx for regression, but do not constitute
the integrated video proof.
