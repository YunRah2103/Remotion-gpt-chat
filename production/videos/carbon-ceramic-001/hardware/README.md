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
