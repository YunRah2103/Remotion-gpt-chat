# EP004 — Agent 3 integrated cinematic camera handoff

**Source:** `cinema/cameras.ts`, `cinema/ShotCamera.tsx`  
**Review preview:** `previews/agent-3/Scene.tsx` / `entry.tsx`

The **six** source shot IDs are `spark-hook`, `rear-mystery`, `underfloor-reveal`, `aero-load`, `contact-macro` and `racing-payoff`. `CAMERA_SHOTS` exports each shot's suggested retimeable duration, editorial trim handles (in/out 0.35–0.5 seconds) and intention. **These are not final voiceover cue timings.**

`sampleShotCamera(shot, shotLocalSec, motion):CameraPose` and `sampleRetimedShotCamera(shot, shotLocalSec, durationSec, motion)` ONLY follow the passed, authoritative Agent 2 `VehicleMotionState`; they do not calculate a second vehicle trajectory, wheel animation or contact schedule. They frame +X forward, +Y up and +Z left under yaw convention. `ShotCamera` / `ApplyCameraPose` apply deterministic camera coordinates in React Three Fiber. Roll is zero, finish uses controlled translation rather than orbit.

**New integrated Remotion clips (not independent proxy fixtures):**

- `EP004Agent3Hook`: 150 frames, **5s @ 1080×1920 30fps**; low forward three-quarter, ~4.3m of smooth oblique camera parallax as the car moves past. Physical sparks from contact immediately, if current authoritative signed gap is negative.
- `EP004Agent3Sequence`: 330 frames, **11s @ 1080×1920 30fps**; moving rear chase (2.25s), camera glide along the tyre-safe vehicle-left exterior (3.55s), ghost-shell mechanical skid macro (2.30s), clear full-car high-speed payoff (2.90s).

The preview composition consumes **Agent 1 `F1HeroVehicle/getSkidDescriptors`**, **Agent 2 `sampleDynamics/sampleContactDrivenSparks`**, and **Agent 4 `NightCircuitWorld`** from the manager-merged isolated EP004 base. Every visible spark filament wraps an actual Agent 2 `SparkParticle`, and the world uses the identical shared height profile; no independent random fire / glows / duplicate road or kit car. Starting distances and playback rates in `CAMERA_SEQUENCE`/`OPENING_BEAT` are **editorial preview selections** chosen to show actual 72m/138m profile events, not simulated telemetry or a locked VO edit. Underfloor reveal only ghosts the approved hero shell; skid positions remain untouched.

**Standalone native render command:**
```bash
npm ci
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-3/*.test.mjs
node production/yunex/f1_sparks_ep004/previews/agent-3/render-native.mjs
```
This emits both H.264/yuv420p native MP4s, FFprobe frame counts, complete FFmpeg decode, and 0/mid/end PNG proof into `out/ep004/agent-3-native/`. The manager-owned `.github/workflows/yunex-ep004-review.yml` executes the same native composition IDs and uploads its own artifact. The PR remains **NOT APPROVED until the real artifact is independently inspected**.

**Final editor handoff:** Consume shot functions with actual original British male VO timing and retime only the camera clock; share the same authoritative motion and contacts. Preserve the preview's tire-safe underfloor exterior camera route and no-final-orbit rule, then tune focus and shot boundaries in the full film. The return to a different physics crest in the standalone sequence is an editorial shot transition, not a continuous literal lap; the finished film should conceal/disclose it intentionally.
