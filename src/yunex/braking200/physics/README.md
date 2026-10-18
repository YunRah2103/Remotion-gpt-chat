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
