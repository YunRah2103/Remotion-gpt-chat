# Agent A — hardware integration handoff

**Status:** REVIEW / native Blender proof outstanding. Do not treat this as a complete native-asset signoff.

- Branch: `automotive-brakes-001/a-hardware`
- **Implementation source SHA (full):** `a201cefa64cef0f797deba34ddfbd55c58967d33`
- PR: https://github.com/YunRah2103/Remotion-gpt-chat/pull/11
- Hardware owner: `hardware`

## Delivered real source (7 authored files)

- `src/brakes001/hardware/BrakeAssembly.tsx`: real geometry via Three.js extrusion and drilled holes, separate spinning rotor / inboard and outboard pads / static caliper and upright, 390 mm OD and 44 internal curved cooling vanes.
- `src/brakes001/hardware/BrakeHardwareProof.tsx`: standalone 120-frame Remotion scene with mechanical orbit, pad-clamp movement and exploded views. **Master must register it** to render; Agent A has not touched `Root.tsx`.
- `production/videos/carbon-ceramic-001/hardware/build_brake.py`: original Blender builder. Creates independent annular friction faces with real boolean perforation, actual vent vanes, caliper cast sectors, piston/seal cylinders, pad sectors, aluminium hat, hardware and bearing context. Exports hierarchy-preserving Y-up GLB, saves .blend, renders four views and writes SHA256 reporting.
- `hardware/asset-contract.json`: machine-readable moving pivot agreement.
- `hardware/rig-manifest.json`: **design target** nodes, scale/axis, approximate bounds and integration instructions (not measured GLB proof).
- `hardware/test_hardware.py`: source-level contract checks and optional real glTF2 binary structure inspector; requires actual GLB to assert native PASS.
- `hardware/README.md`: production/export, engineering caveats, native QA instructions.

## Node interface

| GLB / React node | Parent | Master / Agent B motion |
| --- | --- | --- |
| RotorAssembly | scene | Global X rotor rotation |
| FrictionRing | RotorAssembly | Inherits rotor X rotation |
| RotorHat | RotorAssembly | Inherits rotor X rotation |
| Hub | RotorAssembly | Inherits rotor X rotation |
| CaliperBody | scene | Never rotates |
| PadInner | scene | +X travel up to 2.5 mm |
| PadOuter | scene | -X travel up to 2.5 mm |
| UprightSupport | scene | Never rotates |

**World units:** metres; rotor disc plane YZ and axle X. Blender is native Z-up; glTF export Y-up uses `(x,y,z)_glTF=(x,z,-y)_Blender`. The axle X is invariant. In Blender the two machined friction faces lie at `x=±0.0155m`, pads rest at `x=±0.018m`; both pad faces can reach contact without intended penetration. Node origins are preserved.

## Automated QA evidence

- Contract CI run [37941930644](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37941930644): **PASS** (full source SHA `a201cefa64cef0f797deba34ddfbd55c58967d33`).
- Production CI [37941930698](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37941930698): **PASS** (TypeScript compilation, Python QA tests, existing GpuDriveFilm native smoke — does **not** prove native brake rendering).
- Direct source/rig invariant tests run on GitHub-fetched sources: **10/10 PASS** (node contract, X axis, gap geometry, source drilling, independent static caliper).
- Native Blender execution: **NOT RUN**. Real GLB inspection: **NOT RUN**. Four rendered close-ups: **NOT RUN**. New brake hardware visual QA: **NOT RUN**.

## Required next actions for Master / native runner

Execute **without modifying this branch**:

```bash
blender -b --factory-startup -t 2 \
  --python production/videos/carbon-ceramic-001/hardware/build_brake.py \
  -- out/carbon-ceramic-001/hardware

python production/advanced/asset_contract.py \
  production/videos/carbon-ceramic-001/hardware/asset-contract.json

python production/videos/carbon-ceramic-001/hardware/test_hardware.py \
  --glb out/carbon-ceramic-001/hardware/carbon-ceramic-brake.glb \
  --report out/carbon-ceramic-001/hardware/rig-manifest.json
```

Check generated `rotor-front.png`, `ventilation.png`, `pad-contact.png`, `exploded.png` visually at pixel resolution. Inspect the GLB axes/named hierarchy and 3D mesh/vent clearance. Place binary assets and contact sheet in an Actions artifact. Register `BrakeHardwareProof` or the final Master composition and render moving frames 135–195 and 300–360, watching for clipping and no-caliper rotation.

**No manufacturer-verified geometry or thermal calibration is claimed.** If the native Blender exporter, CSG holes, pad clearance or actual footage fails, keep handoff in REVIEW and correct source before marking ready. Once actual binary/visual proof exists, update JSON with the new source SHA, run links, QA evidence and `status: ready`.
