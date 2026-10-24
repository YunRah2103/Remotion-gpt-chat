# EP006 Agent 2 — jump/contact handoff

This module is the **single authoritative deterministic** motion implementation for EP006, not a measured/commercial vehicle-dynamics model. Source: [Issue #288](https://github.com/YunRah2103/Remotion-gpt-chat/issues/288). Silent visual proof ID: `ep006-a2-jump`.

## Integration

```ts
import {sampleEp006Motion,ep006SurfaceHeightM,EP006_JUMP_EVENTS} from '../dynamics/motion';
import {sampleEp006Effects} from '../fx/contact-effects';
const motion=sampleEp006Motion(72); // absolute 30fps frame
const height=ep006SurfaceHeightM(motion.positionM[0],motion.positionM[2]);
const vfx=sampleEp006Effects(76);
```

Use **+X forward, +Y up, +Z left**, metres, radians, seconds. Origin of the existing V4 rally-hatch root stays unchanged: tyre radius 0.36m; wheelbase 2.62m, nominal track 1.64m. `positionM` moves the root. `rotationRad` is in [rollX,yawY,pitchZ] order. `wheels['front-left'|'front-right'|'rear-left'|'rear-right']` expose signed `compressionM`: positive = wheel jounce relative to chassis, negative = axle droop, no tyre-ground forces in flight. Optional extra fields `tyreSquishM`, `suspensionVelocityMps`, `normalLoad01`, `contactPointM` are included for vehicle and particle adapters.

**Agent 1:** please implement `applyEp006RallyPose(model,motion)` around your actual mounts and spring/damper geometry. Preserve the shell/driver/wheel hub positions, wheel spin direction, steering, mass and pitch transform. Signed travel design bounds are -0.085m droop, +0.16m jounce, ≤0.030m tyre deformation, pending your hardpoint confirmation. The temporary standalone proof modifies existing V4 mounts; it is **not** Agent 1's final connected-suspension adapter.

**Agent 4:** mesh `ep006SurfaceHeightM(x,z)` directly as the actual gravel drive surface (do not place a second contradictory collision mesh). Agent 3's camera callback `terrainHeightM(x,z)` can use `ep006SurfaceHeightM`. A changed stage must use the same exported canonical surface rather than independently parameterised copy. Agent 4 provides terrain normals/visual quality separately.

**Agents 3/5:** sample `sampleEp006Motion(frame)` in your camera/engineering rigs. For slow-motion/replay, pass the original historical absolute frame through the sampler and mark it as replay, rather than running new physics on a different clock.

## Absolute timeline and physical assumptions

| Event | Frame | Time | Approx travel X |
| --- | ---: | ---: | ---: |
| J1 launch | 0 | 0.00s | 0.0 m |
| J1 landing | 72 | 2.40s | 57.89 m |
| J2 launch | 684 | 22.80s | 573.19 m |
| J2 landing | 750 | 25.00s | 631.25 m |

Both launch vertical speeds are analytically solved so the gravity parabola (`g=9.81m/s²`) intersects the SAME touchdown road sampler at the target exact frame. Speed along X is illustrative `24+0.10*t` m/s. After contact, spring travel uses decaying sinusoidal compliant response (`A=0.205m, exp(-3.65t), sin(12.5t)`) with clipping to physical extension/compression limits. The road has deterministic tiny irregularities. Tyre squish and velocity/impact are event dependent, and the four wheel heights are independently sampled from the road surface. Contact occurs for all four wheels on touchdown, with no contact while airborne; simultaneous contact is an **intentional simplifying approximation**, not a race-car calibration. This sampler does not include tyre-force curve, rigid-body yaw impulses, measured damping coefficients, tyre carcass FEM, rebound-stop constraints, or a true whole-car multibody solution. It is a geometrically constrained cinematic engineering visual.

VFX are deterministic spawn-index based, world-space dust ellipsoids / gravel chips emitted over ten frames following touchdown from actual tyre contact points. Road wakes require contact. No layer is a noise/fog screen over the video.

## Proof and sign-off

Unique composition: `src/yunex/studio-projects/ep006-a2-jump/entry.tsx` registered as **`ep006-a2-jump`**, 225 frames @ 30fps, 1080×1920. It uses real V4 `rally-hatch` and a **temporary surface fixture generated from the exact collision function**. It contains source frames [0..114] then [680..789], giving both jumps/landings while avoiding rendering the full 810-frame provisional storyboard. Native GitHub workflow: `.github/workflows/yunex-ep006-agent2-proof.yml`, artifact `YUNEX-EP006-agent2-jump-native`, full decode, ffprobe, SHA256, contact sheet, freezedetect diagnostics. **The workflow is not visual approval.** Human review must inspect the real MP4, wheel clearance, dust origin, top/side silhouette, lead-in and rebound before manager merges this PR.

Voiceover/captions/music are **intentionally absent** until supplied/approved.
