# Agent A — Carbon-Ceramic Brakes 001 / Hardware Polish 02

**Status: REVIEW, NOT READY.** The source corrections are committed, but the required **new-source native Blender stills and GLB verification have not run**. Neither a green planning check nor Agent E's **prior** GLB can replace that evidence.

- Repository: `YunRah2103/Remotion-gpt-chat`
- Branch: `automotive-brakes-001/a-hardware`
- **Exact implementation source SHA** (all A hardware changes, manifest, source numerical evidence): `0bfc8ce52f15e6bf883cca0ad425fd4359d5af33`
- PR: https://github.com/YunRah2103/Remotion-gpt-chat/pull/11
- Integration destination: `automotive-brakes-001/e-integration` (E-owned; not modified by A)

## What changed relative to the earlier working GLB

1. **Blender render failure:** GitHub native run [37947404308](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37947404308) exported a valid older GLB, but failed on its first Cycles close-up with `Build without OpenImageDenoiser`. The builder now chooses CPU Cycles (24 samples), explicitly disables scene/view-layer/preview denoising where supported, and checks each rendered PNG exists and is substantial. This is an **implemented fix, not a verified rerender**.
2. **Sculpted caliper:** Replaces the two broad flat sector cheeks with closed, rounded, three-lobed parametric cheek shells. Adds forged ribs, machined crown and edges, purposeful fixing ears, six piston bore/cap/seal details, hydraulics and bleed components. Three discrete structural cross-bridges replace the old solid wall; actual open windows reveal the piston and pad region.
3. **Pad fidelity:** Distinct dark friction compound, backing plates, anti-squeal shims and two retaining ears per side. Lining faces stay at **x=±0.018 m** at rest, with **2.5 mm** of per-pad axial closure toward rotor faces x=±0.0155 m. No exaggerated animation distance.
4. **Material separation:** Keeps textured cold composite rotor, real axial drilling and 44 curved internal vanes; forged dark satin caliper, nickel hardware, aluminium hat and steel shims each use separate materials. Does not assert calibrated heat or OEM CAD.
5. **Three.js parity:** Existing `BrakeAssembly` export, props and eight root nodes stay stable. Removes box-caliper geometry, uses matching multi-lobed geometry and three open structural cross-bridges. All added geometry is memoized across frames. No edit to Agent B/C/D/E/F/Master work.

## Current mechanical contract

| Stable node | Parent | Motion |
|---|---|---|
| `RotorAssembly` | scene | rotates about +X |
| `FrictionRing` | RotorAssembly | rotates with rotor |
| `RotorHat` | RotorAssembly | rotates with rotor |
| `Hub` | RotorAssembly | rotates with rotor |
| `CaliperBody` | scene | fixed |
| `PadInner` | scene | approaches +X |
| `PadOuter` | scene | approaches -X |
| `UprightSupport` | scene | fixed |

Nominal friction OD **390 mm**, Y-up in glTF/Three, Blender Z-up to glTF Y-up mapping `(x,y,z) -> (x,z,-y)`. This is a non-manufacturer-specific illustration.

## Tests and current evidence

- **PASS:** Source/handoff contract workflow [37967059274](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37967059274) at final code revision before handoff; validates handoff shape and Python compile, **not** new hardware native export.
- **PASS (intermediate revision):** Production suite [37965390060](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37965390060), TypeScript + Python production suite and legacy 2-frame WebGL smoke; this does not include a newly rebuilt carbon-ceramic hardware GLB.
- **PASS:** Independently reconstructed numerical mesh/clearance checks, 4/4: two Blender-cheek formulas at 486 vertices/968 triangles and two Three.js-cheek formulas at 580 vertices/1156 triangles. All four are watertight with consistent winding and positive volume. Minimum cheek inner x absolute distance is 36.5 mm versus backing absolute limit 33 mm. Report: `hardware/polish02-local-geometry-validation.json`. **This is not a native Blender result.**
- **PASS for *old* source only:** Agent E native GLB in [37947404308](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37947404308) has **133 nodes, 125 meshes, nine materials**. E's prior mechanical/thermal Remotion preview and full FFmpeg decode passed, but this was before A's Polish02 changes.
- **NOT VERIFIED:** Actual **Polish02** GLB mesh/material/node counts, Cycles close-ups, native moving proof, final visual appearance and independent E approval. All four newly rendered PNGs are still required.

## Native rebuild / acceptance commands

```bash
# At EXACT A implementation source SHA:
git checkout 0bfc8ce52f15e6bf883cca0ad425fd4359d5af33

python production/advanced/asset_contract.py \
  production/videos/carbon-ceramic-001/hardware/asset-contract.json

blender -b --factory-startup -t 2 \
  --python production/videos/carbon-ceramic-001/hardware/build_brake.py \
  -- out/carbon-ceramic-001/hardware

python production/videos/carbon-ceramic-001/hardware/test_hardware.py \
  --glb out/carbon-ceramic-001/hardware/carbon-ceramic-brake.glb \
  --report out/carbon-ceramic-001/hardware/rig-manifest.json \
  --proof-dir out/carbon-ceramic-001/hardware
```

Required artifact contents: `carbon-ceramic-brake.blend`, `carbon-ceramic-brake.glb`, `rig-manifest.json`, `build-report.json`, `rotor-front.png`, `ventilation.png`, `exploded.png`, `pad-contact.png`, and native console/test logs.

**Do not mark READY until** the four Blender PNGs are genuinely visually reviewed, GLB hierarchy shows two detailed cheeks, three axial bridges and both pad shims, actual model bounds/pivots are verified, and Agent E watches a moving pad-contact/thermal proof. Publish a source-SHA-labelled GitHub Actions artifact rather than placing multi-MB binaries in commits.

## Agent E integration notes

Consume *only* A-owned file changes. Import `BrakeAssembly.tsx` from the revised source into E's registered film if E uses its procedural fallback. If using the .glb, wait for the **new verified binary**, stage it at the same master-approved asset path, bind the same eight root node transforms and **do not adjust Agent B's `brakeStateAt` or 2.5 mm pad travel**. In macro footage the physical gap is intentionally subtle; solve visibility through shot scale/lighting/labels, not physically incorrect pad translation. Then rerun the integration tests, native 135–195 / 300–360 previews and real 1080×1920 visual review.

## Blockers and limitations

Native Blender is unavailable in this execution container, and the connected GitHub repository integration cannot dispatch a new Blender Actions workflow. Consequently the source fix has not been run through the exact previous failure environment; no new true native Blender PNGs/GLB or source-locked uploaded Actions artifact exists at this stage. A supplementary **VTK prototype comparison based on the old GLB plus a newly reconstructed cheek** was visually inspected, but is explicitly **not** a Polish02 Blender render and cannot substitute for signoff.

**No manufacturer CAD, precise friction temperature, calibrated wear, or real braking-performance guarantee is claimed.**
