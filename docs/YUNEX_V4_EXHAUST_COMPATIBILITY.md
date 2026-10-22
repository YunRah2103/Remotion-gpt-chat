# Studio exhaust outlets and effect attachment

`installStudioExhaust(shell, spec, options?)` in `src/yunex/modelling-kit/studio-exhaust.ts` installs outlet hardware for the opt-in studio supercar, coupe and rally hatch. The caller removes obsolete exterior exhaust meshes before installation. This installer does not replace the vehicle's engine, turbo, drivetrain or animation systems.

All dimensions are metres. Outer diameter defaults to 0.112 m with 0.105–0.120 m recommended for these sports bodies. Explicit smaller/larger real-world variants accept 0.060–0.180 m (for example 0.080 m or 0.150 m). The 0.004 m default wall leaves a 0.104 m bore. Each outlet has an uncapped outer cylinder, inward-facing inner wall, annular metal lip, annular rear wall and recessed dark trim ring. No disk closes the bore. The mouth sits 0.075 m beyond the nominal rear plane; the 0.22 m pipe extends forward inside the bumper. Bumper geometry must leave the aperture clear. This is outlet hardware, not a claimed complete manifold-to-tailpipe route.

Sports variants use left/right outlets at height 0.43 m and lateral offsets ±0.27 × vehicle width. Rally uses one right outlet at −0.32 × vehicle width. Options allow `outerDiameter`, `wallThickness`, `depth`, `centerHeight`, `lateralOffset` and `rearProtrusion`; invalid or non-finite dimensions fail before scene mutation. Repeated installation on the same shell rejects duplicate attachment mounts without modifying the existing system.

## Stable transforms

The result contains `group`, `outerDiameter`, `outlets` metadata and `mounts.left` / `mounts.right` (the left mount is absent on rally). Equivalent stable scene names are `exhaust-outlet-left` and `exhaust-outlet-right`. Mounts sit at the mouth centre, with local +Z pointing outward along exhaust flow. Vehicle coordinates remain +X forward, +Y up and +Z left; flow is vehicle −X. Effect geometry authored along another axis needs its own local rotation.

| Mount-local axis | Vehicle axis |
| --- | --- |
| +X | +Z (left) |
| +Y | +Y (up) |
| +Z | −X (rearward exhaust flow) |

Attaching effect objects as children of these mounts automatically follows vehicle motion, cutaway hierarchy and parent transforms. Geometry diameter metadata remains in authored metres; obtain world size from the world transform if the vehicle is scaled.

## EP005 v2 compatibility boundary

EP005 v2 is unchanged. Its current effect interface, animation timing, force curves and particle state remain authoritative. A future explicit adapter can read studio transforms and pass their world positions/directions to that interface; the studio module does not import EP005, reinterpret its coordinates or patch its public API.

For an external effect renderer, the adapter's transform sampling is:

```ts
vehicle.updateWorldMatrix(true, true);
const mouth = vehicle.getObjectByName('exhaust-outlet-right');
if (mouth) {
  const worldPosition = mouth.getWorldPosition(new THREE.Vector3());
  const worldDirection = new THREE.Vector3(0, 0, 1)
    .transformDirection(mouth.matrixWorld);
  // Pass these values through the existing effect-specific adapter/interface.
}
```

Sample after the vehicle's frame update. Do not use `getWorldDirection()` on a differently oriented effect object as a substitute for the outlet's documented local +Z axis. Existing non-studio builds need their existing attachment path or an explicit fallback when a named studio mount is absent.

Validation: `node --experimental-strip-types --test tests/modelling-kit/v4-exhaust.test.mjs` checks open bore ray clearance, wall/lip dimensions, recessed trim, realistic diameter limits, stable world-space direction under transformed parents, variant layouts and atomic rejection of invalid inputs.
