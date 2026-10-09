# Agent B — Carbon-ceramic brake kinematics and thermal illustration

Ownership: `src/brakes001/motion/**`, `production/videos/carbon-ceramic-001/physics/**`.
This is NOT a finished carbon-ceramic brake design, manufacturer CAD, numerical thermal simulation, measured temperature, or final 25-second film.

## Interface for Master and Agent A

`brakeStateAt(frame: number): BrakeMotionState` returns `rotorAngleRad`,
`rotorSpeedRadPerSec`, `brakePressure01`, `padGapMetres`, `heat01`,
`cooling01`, and `timeSeconds`. Clamp frames 0–749; 30fps. State lookup
is deterministic and independent of render ordering. Integrated at 240Hz.

`brakePoseAt(frame)` returns X-axis rotation and pad travel:
- If RotorAssembly is parent of RotorHat/Hub, rotate only RotorAssembly; do
  NOT rotate child nodes a second time. If independent siblings, copy the
  common angle to each.
- PadInner starts near the -X disc face and moves **+X** by `innerPadLocalXMetres`.
- PadOuter starts near the +X disc face and moves **-X** by `outerPadLocalXMetres`.
- CaliperBody stays fixed; never rotate it with the disc.
- Both rest gaps are 6mm per face; clamped gap is 0.30mm per face in this
  intentionally illustrative rig. Never move real asset pivots by applying
  transforms twice; add deltas to original rest position.
- Disc half thickness 17mm, outer radius 195mm. Adapt actual contact
  faces from Agent A's rig manifest before final integration.

`frictionTrackHeat01At(frame, radialDistanceMetres)` returns the radial
false-colour mask, active only on the swept friction band (r ~0.126–0.190m).
Apply to the two visible annular ring faces, never the hat, hub or caliper.
The thermal value is normalized 0–1 **illustration**, not degrees Celsius,
scientific heat-flow/temperature FEA, or a specific manufacturer's fade curve.

## Cycle schedule

First braking from 3.15–12.80s (smooth clamp/release), cool/coast from
12.80–15.15s, second braking from 15.15–19.95s to zero speed, cool
through the hero ending. Piecewise smoothstep pressure and numerical
integration couple deceleration, rotor angle, pads and heat. No random
motion, no vehicle stopping-distance assertion, no unreal fade-immunity claim.

## Verification

From repository root:

```bash
bash production/videos/carbon-ceramic-001/physics/run-tests.sh
npm run check
```

Unit tests cover all 750 frames, both pressure cycles, paired pad travel,
speed/angle continuity, thermal rise/release, annular contact mask,
determinism and all storyboard cut frames.

Native Remotion/Three.js **optional placeholder** component:
`src/brakes001/motion/BrakeMotionProof.tsx`. Master can temporarily
register it for a mini preview; Agent B intentionally does NOT modify
`src/Root.tsx` (Master-owned). Replace it with Agent A's model.

A separate moving offline proof can be rendered with `render-motion-proof.py`
using Python/OpenCV, Node, TypeScript and FFmpeg; it is explicitly a
schematic stand-in, **not** a finished Three.js/Remotion production render.
The preview samples ranges 135–195, 300–360, 399–459, 500–560 and 660–720;
five storyboard stills 48/168/321/531/705. See handoff for actual QA hashes.

### Remaining Master integration tasks

Match axes, pivots and units to Agent A's GLB manifest, inspect pad
clearances at X face normals and caliper anchoring, select a less saturated
thermal look if desirable, render real 3D moving shots, run full-release
FFprobe and playback QA. No approved audio is fabricated by this agent.
