# GPU Decomposition — Agent A FINAL v2.4 Rebuild and Mechanical QA Handoff

**Status: VERIFIED 3D ASSET / RELEASED FOR AGENT B INTEGRATION.**
Repository: `YunRah2103/Remotion-gpt-chat` ONLY.
Branch: `gpu-decompose/a-model`.
**This release supersedes all Agent A v1, v2.1, v2.2 and v2.3 render assets and ZIPs. DO NOT silently use an older artifact.**

## 1. Immutable source + successful native build

- **Model source SHA:** `322f77046b15402b55042e86822389bec1e70818`
- **Successful GitHub Actions run:** [37819645913](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37819645913)
- Workflow ID: `378723009`; source: `.github/workflows/agent-a-build.yml`
- **Artifact name:** `GPU-AGENT-A-XFX-SWIFT-3D`
- **Artifact ID:** `11567849898`
- [Exact downloadable GitHub Actions artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37819645913/artifacts/11567849898)
- **GLB file:** `assets/xfx_swift_rx9060xt_triple16.glb`; **1,774,560 bytes**; **SHA256 `e0b86390180ecb6724bcfe029bc77c9a116ff9b004e1ae14fa81b0bff8e0599e`**
- **Motion JSON:** `assets/decomposition.json`; SHA256 `1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510`.
- Export contains **333 real glTF meshes, 352 named nodes, 23 PBR material entries**. Self-contained GLB. All 19 contract-required anchors pass structural QA. Contains 27 swept fans blades and 3 actual OpenSCAD STL mesh imports.
- GLB evaluated world bounds: `X [-1.447500,1.447500]`, `Y [-0.619000,0.625200]`, `Z [-0.248500,0.251000]` in Y-up display units. Real mesh bounding test **GLB_BOUNDS_PASS** within director's ±3% envelope against published **290×124×49 mm**.

**This report-only commit is after the model SHA; download the immutable run above.**

## 2. Visual v2.4 changes and engineering credibility

After the original version was rejected visually, Agent A rebuilt the exterior and further corrected the rear:
- Real 3D broad swept axial blades on all three independent rotors, not thin spokes; recessed intake wells and machined central caps.
- One unified graphite-black polymer front shroud with three Boolean-cut circular apertures, slimmer bezels and XFX-style angular corners. No flat photo panels, no previous three-section fascia seams.
- Rebuilt **one-piece Boolean-cut backplate** with a real exhaust aperture, structural border and inner thermal pad blocks. The open vent genuinely reveals a dense metal fin stack, rather than the earlier fake horizontal bars.
- Shortened the realistic-looking illustrative PCB so its far edge ends before the rear airflow window, matching the physical cooler-overhang construction more plausibly.
- Regulator inductor blocks, low-profile SMDs and board circuit traces, separately controlled silicon die/VRAM and authentic gold connector/contact groups.
- Heatpipe finish shifted toward nickel-plated metallic rather than bright brown copper. Non-crossing, parallel backplate machining lines replace the poor crossing engraving.
- Adjusted fan caps to keep the **real exported geometry** inside the specified depth, not merely edit claimed manifest dimensions.

**Accuracy constraint:** real manufacturer's SKU, three-fan silhouette, dimensions, 8-pin, 2xDP + 1xHDMI established. All inside geometry, blade shape, traces, screw positions, grooves, vent-cut details and number of VRAM chip packages are visual approximations, **NOT manufacturer CAD**.

## 3. EXACT 3D HIERARCHY — case sensitive

```text
GPU_ROOT
  FAN_ASSEMBLY
    FAN_LEFT
    FAN_CENTER
    FAN_RIGHT
  FRONT_SHROUD
  HEATSINK
    HEATSINK_FINS
    HEATPIPE_BUNDLE
    COLD_PLATE
  PCB_ASSEMBLY
    PCB
    GPU_DIE
    VRAM_CHIPS
    VRM_COMPONENTS
    PCIE_FINGERS
    POWER_8PIN
    IO_BRACKET
  BACKPLATE
```

**Materials examples:** `M_MONOLITHIC_XFX_FASCIA`, `M_FAN_BLADE`, `M_FAN_HUB`, `M_DARK_RECESSED_FAN_WELL`, `M_NICKEL_COPPER`, `M_PCB_DARK_GREEN`, `M_VRM_INDUCTOR_GRAPHITE`, `M_CIRCUIT_TRACE_DULL_COPPER`, `M_BACKPLATE_GRAPHITE`, `M_BACKPLATE_THERMAL_PAD`, `M_HEATSINK_ANODISED_SILVER`, `M_CONTACT_GOLD`. `asset-manifest.json` enumerates every material.

## 4. Coordinates, motion and absolute rule for Agent B

- GLB Y-up, +X along long edge to right, +Y toward top, +Z emerging from fan face; origin at envelope centre. `sceneUnitsPerMillimetre: 0.01`; model represents 290 × 124 × 49 mm.
- **UNCHANGED** director-locked `decomposition.json`, 450 exact frames @30 fps, smoothstep on anchors' relative LOCAL positions (no baked glTF animation).
- Required animated names: `FAN_LEFT`, `FAN_CENTER`, `FAN_RIGHT`, `FRONT_SHROUD`, `HEATSINK`, `GPU_DIE`, `VRAM_CHIPS`, `PCB_ASSEMBLY`, `BACKPLATE`.
- Apply offset per frame independently and add it to the imported anchor's starting local position. PCB die and VRAM animations compound under their parent PCB_ASSEMBLY. Never multiply frame deltas cumulatively.
- Stages: fully assembled 0–89, fans/shroud 90–179, internals 180–329, final exploded 330–449. No disappearing meshes.
- **Camera-only quality requirement:** Agent B's v1.1 director amendment already calls for an orbit toward +X, settling at ~55–56 degrees during frames 160–332. Agent A produced matching *preview-only* extra Blender views and a moving camera proof; `camera-proof.json` records settings. Do not treat the preview as Agent B's final native camera approval.

**Outstanding visual risk:** At a shallow angle fans and fascia still overlap, and the cooler can read as a stack of flat rectangular planes. Agent B MUST run actual 1080×1920 Remotion native screenshot QA at 330/385/449 and assess rotor separation, layer depth, framing and readability on phone. If the locked offsets are not visually readable, only the director may revise `PRODUCTION_CONTRACT.md` and authorize revised animation. Agent A has NOT silently increased offsets.

## 5. Exact artifact import — do not use latest by guess

```bash
gh run download 37819645913 -R YunRah2103/Remotion-gpt-chat \
  -n GPU-AGENT-A-XFX-SWIFT-3D -D /tmp/xfx-agent-a-v24
sha256sum /tmp/xfx-agent-a-v24/assets/xfx_swift_rx9060xt_triple16.glb
sha256sum /tmp/xfx-agent-a-v24/assets/decomposition.json
mkdir -p public/gpu-decompose/assets
cp /tmp/xfx-agent-a-v24/assets/xfx_swift_rx9060xt_triple16.glb public/gpu-decompose/assets/
cp /tmp/xfx-agent-a-v24/assets/decomposition.json public/gpu-decompose/assets/
```

Load GLB through Three.js `GLTFLoader(staticFile('gpu-decompose/assets/xfx_swift_rx9060xt_triple16.glb'))` and import `decomposition.json` from the same pinned artifact. Fail closed if any named anchor, hash or file is missing. Never copy preview PNGs in place of geometry.

## 6. Reproducible sources and artifact contents

Canonical scripts: `gpu-decompose/agent-a/blender_generate.py`, `mechanical.scad`, `generate_motion.py`, `test_motion.py`, `clearance.py`, `godot/previs.gd`, `validate_assets.py`, **`validate_dimensions.py`** and workflow `.github/workflows/agent-a-build.yml`.

The validated artifact contains:
`assets/xfx_swift_rx9060xt_triple16.glb`,
`assets/xfx_swift_rx9060xt_triple16.blend`,
`assets/decomposition.json`,
`assets/asset-manifest.json`,
`assets/bounds-validation.json`,
`assets/clearance.json`,
`assets/godot-proof.json`,
`assets/assembled.png`,
`assets/exploded.png`,
`assets/exploded_side.png`,
`assets/backplate_detail.png`,
`assets/decomposition-proof.mp4`,
`assets/camera-proof.json`,
`assets/moving_frames/*.png`, logs, `assets/SHA256SUMS.txt`, and `agent-a/fan_hub.stl`.

**Executed pass gates (run 37819645913):** real OpenSCAD STL export and Blender mesh import, 450-frame deterministic timeline test, actual PyBullet DIRECT major-layer collision-envelope sample check, Godot 450-frame hierarchy checks, native Blender GLB export + four CPU Cycles QA PNGs + 23 native sampled moving frames, ffmpeg H.264 MP4 encoding & full decode, GLB anchor/material schema validation, and actual evaluated-world-bound geometry check. **All passed**. These proofs are not an actual full 450-frame 15-second final MP4; that's Agent B's work.

## 7. Reference, ownership and no interference

Manufacturer: https://uk.xfxforce.com/shop/xfx-swift-amd-radeon-rx-9060xt-oc-triple-fan-gaming-edition-16gb
Backplate teardown reference: https://overclock3d.net/reviews/gpu_displays/xfx-rx-9060-xt-swift-review/2/
Hardware SKU: `RX-96TS316B7`.

Agent A did not alter Agent B's Remotion files, manager contract or any other repository. No new agents. Source and binary assets ready for Agent B to review and integrate, subject to final phone-native Remotion visual QA.
