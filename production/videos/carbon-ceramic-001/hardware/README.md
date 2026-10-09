# Agent A — original brake hardware

**Branch:** `automotive-brakes-001/a-hardware`. This is the complete **source implementation**, not an assertion that Blender has been executed or that a finished MP4 exists.

## Hardware authored

- **390 mm** carbon-ceramic friction annulus, 113 mm central inner radius, two physically separate 4.8 mm perforated friction plates. Each face has 2 concentric rows of **32 drilled holes**. A real Boolean cuts them through Blender meshes; the Three.js fallback uses shape holes, not opaque decals.
- **44 curved internal ventilation vanes** in an actual axial cavity. Real vane geometry, not dark stripes on a solid ring.
- Separate metallic aluminium hat, locating register, floating-type bobbin fasteners, hub, bearing support, 5 wheel studs.
- Six-piston *illustrative* fixed opposed caliper with machined cheeks, bridge, inlet, bleed nipple, retention hardware and individual piston caps. Non-OEM engineering depiction.
- Two separate friction pads and backing plates for symmetric axial travel. Friction faces at x=±0.0155m. Pads face x=±0.018m at rest and can close **2.5 mm each** without overlap; caliper/upright remain static.
- Neutral cold carbon-grey PBR, restrained machined aluminium and nickel; **no orange default glow**.

## Native Blender build / export and proof

```bash
blender -b --factory-startup -t 2 \
  --python production/videos/carbon-ceramic-001/hardware/build_brake.py \
  -- out/brakes001/hardware

python production/advanced/asset_contract.py \
  production/videos/carbon-ceramic-001/hardware/asset-contract.json

python production/videos/carbon-ceramic-001/hardware/test_hardware.py \
  --glb out/brakes001/hardware/carbon-ceramic-brake.glb \
  --report out/brakes001/hardware/rig-manifest.json
```

Blender generates actual `.blend`, `.glb`, **rotor-front.png**, **ventilation.png**, **exploded.png**, **pad-contact.png**, source SHA256 and node manifest. Native export is Y-up glTF; Blender convention Z-up maps (x,y,z) to (x,z,-y), leaving axial X unchanged. Note the Blender render is geometry-first and uses Cycles/CPU; it may need a slower render runner.

**Binary policy:** keep large Blender project, GLB, PNG and videos in GitHub Actions artifacts (or manually provided transfer), not normal Git text commits. No generated GLB should be called visually approved unless inspected.

## Direct Three.js/Remotion integration

`src/brakes001/hardware/BrakeAssembly.tsx` exports `BrakeAssembly` with props:

```tsx
<BrakeAssembly rotorAngleRad={brakeState.rotorAngleRad}
  padGapMetres={brakeState.padGapMetres}
  heat01={brakeState.heat01}
  exploded01={0}/>
```

The Master may choose the deterministic directly-renderable geometry **until a native inspected Blender GLB is staged**. No Root composition or shared dependency was changed. Isolated `BrakeHardwareProof.tsx` supplies 120 frames of orbit, axial pad closure, exploded hierarchy and lighting for the Master to register without changing A's ownership. This proof is separate from the final 25s film.

## Technical cautions

The thermal tint in the React source is subdued appearance only; scientific false-colour and deceleration belong to Agent B and D. Thermal and friction performance are qualitative; no temperature simulation, calibrated braking forces, CAD reference or manufacturer claims. All GLB geometry requires native render and moving-frame inspection before master handoff can be marked **ready**.

See `rig-manifest.json` for declared node tree and conservative **design** bounds. True Blender evaluated hierarchy/geometry can only be attested after executing and reading the native export.

## POLISH 02 — 2026-10-09 (source revision; native re-proof required)

This is a correction to the **existing** model, not a new model or simulation. Agent E's
previous native export (run 37947404308) established a **baseline** GLB of 133 nodes,
125 meshes and nine PBR materials at 390 mm nominal diameter. Its Cycles still
render failed because the distro Blender was **built without OpenImageDenoiser**.
That prior GLB is **not** an export of the new Polish 02 source.

### Changes

- Removed box-based visual caliper cheeks in the directly integrated Three.js
  fallback. Matching Blender and Three geometry uses a watertight curved,
  radially scalloped, three-lobe forged housing on each side of the X axle.
- Added contoured rim trim, forged ribs, crossover bridge satin crown,
  six opposed piston/bore/seal groups, three separated axial bridge straps with genuine open windows, caliper retaining hardware and a
  distinct static mounting bracket. The rotor hub/hat remains independent.
- Added friction/backing/shim contrast and backing carrier ears for both pads
  **without changing travel range or contact surfaces**.
- Corrected outward triangle winding for both caliper cheeks.
- Blender render now prefers **Cycles CPU with denoising disabled**
  (including view-layer denoising), 24 samples, at 900×900.
  This removes the unavailable OIDN feature instead of depending on Eevee's
  potentially unavailable headless OpenGL context.
- Native GLB validation now requires at least 130 meshes, nine materials,
  400+ POSITION vertices per sculpted cheek, both shims and a named bridge crown.
  Optional proof check validates four real 900×900 PNGs.

### Exact native QA commands (after checkout of updated A branch)

```bash
python production/advanced/asset_contract.py production/videos/carbon-ceramic-001/hardware/asset-contract.json
blender -b --factory-startup -t 2 \
  --python production/videos/carbon-ceramic-001/hardware/build_brake.py \
  -- out/carbon-ceramic-001/hardware
python production/videos/carbon-ceramic-001/hardware/test_hardware.py \
  --glb out/carbon-ceramic-001/hardware/carbon-ceramic-brake.glb \
  --report out/carbon-ceramic-001/hardware/rig-manifest.json \
  --proof-dir out/carbon-ceramic-001/hardware
```

Upload `carbon-ceramic-brake.blend`, `carbon-ceramic-brake.glb`,
`rig-manifest.json`, `build-report.json`, and all four real PNGs as a
single **source-SHA-labelled GitHub Actions artifact**. Visually inspect
actual full-frame PNGs; the successful exporter or PNG header check alone
does not certify good lighting or convincing shape.

### Integration guidance for E

- The directly integrated `BrakeAssembly.tsx` has the same exported
  `BrakeAssembly` props. Do not edit or rescale Agent B's `brakeStateAt`.
- If loading the new GLB instead, replace only the old native hardware artifact
  after GLB hierarchy/mesh/visual QA. Retain all eight named root pivots,
  `RotorAssembly` global X rotation, `PadInner` +X and `PadOuter` -X motion.
- Disc outer radius = 0.195m; pad rest faces = x +/-0.018m,
  friction faces = x +/-0.0155m, max closing travel = 0.0025m **per pad**.
  The gap is intentionally millimetric: for a legible clamp shot, use a macro
  camera or measurement annotation, **not exaggerated travel**.
- `CaliperBody` and `UprightSupport` remain fixed; the rotor/hat/hub
  share one rotating hierarchy.

**Release gate:** This version remains `REVIEW` until its OWN newly generated
Blender GLB and real close-up renders are inspected. The recovered earlier
GLB and local VTK design comparison are useful diagnostics, not proof
of a new Blender export.

**POLISH02 final visual architecture:** The initially corrected solid bridge still obscured the sculpted caliper, so it was replaced by three discrete bridge connections (one centre named `OuterAxialCaliperBridge`, two end bridges). This retains structural connection while permitting meaningful close-up views into the pad and piston area. Each is radially outside the 195 mm disc radius; the actual native renders still require reinspection.
