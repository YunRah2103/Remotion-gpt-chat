# GPU Decomposition — Agent A v2.1 VISUAL REBUILD HANDOFF

**Status: ASSET RELEASED — Blender/CAD/PyBullet/Godot/GLB validation passed.**
Repository only: `YunRah2103/Remotion-gpt-chat`
Agent A branch: `gpu-decompose/a-model`
This handoff **supersedes** the original 2026-10-08 model, run 37812363063 and artifact 11565343211. **Agent B must not integrate the original model.**

## Immutable verified source and artifact

- **Immutable model source SHA:** `46891efdd9bca9da1f26fe7f260a2cae25bcb882`
- **Successful GitHub Actions workflow run:** [37816437723](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37816437723)
- Workflow: `.github/workflows/agent-a-build.yml`; workflow ID 378723009.
- **Artifact ID:** `11567252428`; artifact name: `GPU-AGENT-A-XFX-SWIFT-3D`.
- [Download the exact artifact in GitHub Actions](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37816437723/artifacts/11567252428).
- Artifact contents: `assets/xfx_swift_rx9060xt_triple16.glb`, `assets/xfx_swift_rx9060xt_triple16.blend`, `assets/decomposition.json`, `assets/asset-manifest.json`, `assets/clearance.json`, `assets/godot-proof.json`, `assets/assembled.png`, `assets/exploded.png`, `assets/decomposition-proof.mp4`, `assets/SHA256SUMS.txt`, logs, 23 native moving proof frames, `agent-a/fan_hub.stl`.
- **GLB SHA256:** `c234a0aafe9c80c3c96c2e41fe8d9de965e8d8e6e4ffd9dda60b0307ee530254`, **1,682,752 bytes**.
- **Decomposition JSON SHA256:** `1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510`.
- Audited glTF contains **277 real meshes, 296 named nodes, 20 materials**. The required 19 hierarchy anchors exist, as do 27 swept rotor blades and all 3 imported OpenSCAD fan hubs.
- Model source commit is locked above; this handoff-only commit is newer, but does not change any model bytes.

## Why visual rebuild was necessary

The original model had thin fan spokes, exposed silver heatsink behind the fans, a three-section cage-like façade, and generic grey panels.

The v2.1 asset replaces this with:
1. Wide, curved, volumetric nine-blade rotors on each of three fans, real blade thickness, separate named fan anchors, dark recessed wells and central X badges.
2. **A single, physically modelled, Boolean-cut shroud with THREE real circular apertures**, eliminating the previous vertical panel seams.
3. Darker graphite-black materials, accurate-looking long rectangular Swift silhouette, slim black bezels, diagonal endcap/corner cut-outs and better top spine branding.
4. Structured rear ventilation ribbing, metal bracket and visible internals retained.
5. Real assembled/exploded Cycles CPU previews and a decoded moving decomposition proof.
No reference photograph is embedded in the geometry or video. The model is an **original stylized mechanical reconstruction**, not a photoreal or manufacturer-CAD asset.

## Exact Blender GLB anchor contract

```
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

Material name samples: `M_MONOLITHIC_XFX_FASCIA`, `M_FAN_BLADE`, `M_FAN_HUB`, `M_DARK_RECESSED_FAN_WELL`, `M_ANGULAR_FASCIA_HIGHLIGHT`, `M_BRUSHED_ALUMINIUM`, `M_NICKEL_COPPER`, `M_PCB_DARK_GREEN`, `M_BACKPLATE_GRAPHITE`, `M_CONTACT_GOLD`. See `asset-manifest.json` for every material.

## Axes, scale, animation and integration

- GLB coordinate system is **Y-up**, +X long edge pointing to the right, +Z toward viewer/fan front; root at envelope center.
- `sceneUnitsPerMillimetre=0.01`, i.e. 1 rendered scene unit = 100 real mm. External size based on manufacturer **290 × 124 × 49 mm**.
- `decomposition.json` is **450 frames at 30 fps**, absolute frame-driven smoothstep applied to each anchor's *initial local pose*. No accumulated transforms; no random simulation.
- Mandatory animated roots: `FAN_LEFT/CENTER/RIGHT`, `FRONT_SHROUD`, `HEATSINK`, `GPU_DIE`, `VRAM_CHIPS`, `PCB_ASSEMBLY`, `BACKPLATE`. PCB die and VRAM offsets are additive to their parent PCB assembly.
- The GLB is static at its assembled pose, **no baked animation**. The JSON is authoritative; do not add Blender axis remapping a second time.
- Stages 0–89 assembled, 90–179 fan and shroud release, 180–329 internals separation, 330–449 completed exploded layout.

### Agent B exact download/import commands

```bash
gh run download 37816437723 -R YunRah2103/Remotion-gpt-chat \
  -n GPU-AGENT-A-XFX-SWIFT-3D -D /tmp/xfx-agent-a-v21
sha256sum /tmp/xfx-agent-a-v21/assets/xfx_swift_rx9060xt_triple16.glb
sha256sum /tmp/xfx-agent-a-v21/assets/decomposition.json
mkdir -p public/gpu-decompose/assets
cp /tmp/xfx-agent-a-v21/assets/xfx_swift_rx9060xt_triple16.glb public/gpu-decompose/assets/
cp /tmp/xfx-agent-a-v21/assets/decomposition.json public/gpu-decompose/assets/
```

Load via Three.js `GLTFLoader(staticFile('gpu-decompose/assets/xfx_swift_rx9060xt_triple16.glb'))`; verify exact hashes before release. Apply JSON positions as additive local offsets from cached initial GLB node positions and compute each frame independently.

**Visual QA warning for director:** Agent A's proof confirms genuine 3D and render success, but the locked separation distances leave rotor/shroud layers visually close at shallow camera angles. Native Remotion previews must use meaningful oblique camera parallax and show clear fan/shroud release before finalizing. If a stronger displacement is needed, update the director's production contract explicitly; do not silently mutate this model's locked JSON.

## Sources, QA and known limits

Canonical sources: `gpu-decompose/agent-a/blender_generate.py`, `mechanical.scad`, `generate_motion.py`, `clearance.py`, `godot/previs.gd`, `validate_assets.py`, `test_motion.py`; workflow `.github/workflows/agent-a-build.yml`.

**Executed checks:** OpenSCAD STL export plus Blender import of hub into all three rotors; PyBullet DIRECT proxy collision checks; real Godot 450-frame hierarchy playback; Blender scene generation, self-contained glTF export, two 960×640 native preview stills, actual sampled animation frames, ffmpeg H264 moving proof decode, GLB node/material audit and matching SHA256. All steps PASS in run 37816437723.

**Reference:** https://uk.xfxforce.com/shop/xfx-swift-amd-radeon-rx-9060xt-oc-triple-fan-gaming-edition-16gb . Manufacturer-confirmed identity: XFX Swift RX 9060 XT Triple Fan 16GB black model RX-96TS316B7, one 8-pin, 2×DP + HDMI, 290×124×49 mm.

**Approximate, not verified CAD:** fan moulding profiles/blade aerodynamics, screw placement, precise silicon packaging, PCB layout/traces, VRAM topology, heatpipe bend counts, fin positions, side notch details, rear plate design, and artwork. Final 450-frame Remotion master MP4 belongs to Agent B; do not treat this 2.3-second modeller proof as that film.

Do not merge directly into Agent B's branch; use immutable source SHA and artifact above. No other repository was read, copied or modified.
