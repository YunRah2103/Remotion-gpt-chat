# Rugged Suspension 001 — production contract

- Original source: `src/RuggedSuspension001.tsx` and `src/suspension/kinematics.ts`
- No narrated audio is used or inferred. Ambient sound may be added only after approved review.
- 600 frames at 30fps; full 1080x1920 portrait master, no external assets or unlicensed sources.
- Four corners sample the same procedural 3D heightfield that creates the terrain mesh.
- Coil springs are genuine helix tubes; upper/lower A-arms, tie rods and dampers update their endpoints every frame.
- Body pitch/roll derived from a 5-tap low-pass estimate of terrain under the four wheels; no arbitrary bounce oscillation.
- Angles, scales and friction are illustrative, not supplier-CAD, PyBullet dynamic validation, physical sprung/unsprung mass, or vehicle roadworthiness certification.
- Wheel contact is a geometric kinematic approximation. Chassis tilt, tread thickness and sampled triangle interpolation create a residual visual tolerance.
- Source provenance: generated from scratch for this experiment. Material constants are illustrative presets and do not imply material measurements.
- QA: `node --experimental-strip-types production/tests/rugged_kinematics.mjs`; `python production/tools/production_pipeline.py --project rugged-suspension-001`; render moving samples and inspect actual native MP4.
