# GPU Decomposition — Agent A FINAL MODEL HANDOFF
Status: **RELEASED / native 3D asset QA PASS**
Source repository: `YunRah2103/Remotion-gpt-chat` ONLY
Agent A branch: `gpu-decompose/a-model`
**Immutable native-model source SHA:** `6b6857c7bb437f743da950b7fff10ee391beabd2`
This handoff-document-only commit is later than the locked model SHA. Select the locked model SHA for reproduction.

## 1. EXACT SUCCESSFUL GITHUB ACTIONS EVIDENCE
- Workflow: `.github/workflows/agent-a-build.yml` / ID **378723009**
- **SUCCESS** run **37812363063**, source SHA `6b6857c7bb437f743da950b7fff10ee391beabd2`
- Run URL: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37812363063
- **Artifact ID 11565343211**, artifact name **GPU-AGENT-A-XFX-SWIFT-3D**
- Direct authenticated ZIP API path: https://api.github.com/repos/YunRah2103/Remotion-gpt-chat/actions/artifacts/11565343211/zip
- Artifact retained 30 days from 2026-10-08.
- Do **not** select an arbitrary latest artifact. Fetch run 37812363063, artifact 11565343211 only.

Native deliverables INSIDE the artifact:
`assets/xfx_swift_rx9060xt_triple16.glb`,
`assets/xfx_swift_rx9060xt_triple16.blend`,
`assets/decomposition.json`,
`assets/asset-manifest.json`,
`assets/clearance.json`,
`assets/godot-proof.json`,
`assets/assembled.png`,
`assets/exploded.png`,
`assets/decomposition-proof.mp4`,
`assets/SHA256SUMS.txt`,
`assets/model_nodes.json`, `assets/moving_frames/*.png`, and logs;
`agent-a/fan_hub.stl`.

## 2. INTEGRITY LOCKS
- GLB: **1,494,116 bytes**, SHA256 **edb519dbc822c87b76d8409e5179ded53b08bdf2b634e000368d868dfb544b05**.
- Decomposition JSON SHA256: **1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510**.
- glTF: **268 independent meshes**, **16 PBR materials**, 19 required exact anchor names.
- Envelope measured from GLB bounding scene coordinates: X[-1.4500,1.4700], Y[-0.6200,0.6252], Z[-0.2485,0.2530]; close to nominal 2.90 × 1.24 × 0.49 scene units, within ±3%.
- Exact model: black **XFX SWIFT AMD Radeon RX 9060 XT OC Triple Fan Gaming Edition 16GB**, SKU **RX-96TS316B7**; 290×124×49 mm manufacturer envelope, one 8-pin, 2xDP + 1xHDMI.
- Reference: https://uk.xfxforce.com/shop/xfx-swift-amd-radeon-rx-9060xt-oc-triple-fan-gaming-edition-16gb

## 3. MODEL HIERARCHY — CASE SENSITIVE
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
All required anchors exist in the successfully inspected exported GLB. OpenSCAD mesh components `OpenSCAD_FanHub_0/1/2` are imported inside their respective native fan anchors, NOT merely generated off to the side.

Materials used:
`M_BACKPLATE_GRAPHITE`, `M_BACKPLATE_INSET`, `M_BRUSHED_ALUMINIUM`, `M_SHROUD_DARK`, `M_FAN_RING`, `M_FAN_HUB`, `M_FAN_BLADE`, `M_POLYMER_GRAPHITE`, `M_GLOSS_ACCENT`, `M_LOGO_PALE_SILVER`, `M_COLDPLATE_NICKEL`, `M_NICKEL_COPPER`, `M_HEATSINK_ANODISED_SILVER`, `M_CHIP_CERAMIC_DARK`, `M_CONTACT_GOLD`, `M_PCB_DARK_GREEN`.
No external texture URLs or licensed images.

## 4. COORDINATES, TIMING & MANAGER USAGE
- **GLB is Y-UP, +X right along the card, +Z out of fan face.**
- `sceneUnitsPerMillimetre = 0.01`, display-scale 1 unit = 100 physical mm.
- The original Blender procedural script internally uses +Z up and -Y toward fans; Blender glTF exporter does the axis conversion. **Use the JSON and GLB as-is. No second negative-axis mapping.**
- `decomposition.json` is a **450-frame 30fps pure function specification**, relative translations in GLB Y-UP coordinates. It does not contain world coordinates.
- The animation in Remotion must add `to.position * smoothstep(clamp((frame-startFrame)/(endFrame-startFrame),0,1))` to each anchor's captured INITIAL LOCAL position; never integrate cumulatively.
- Apply `PCB_ASSEMBLY` displacement to the parent, `GPU_DIE` and `VRAM_CHIPS` relative to their own child anchors. Their offset is additive through parenting.
- Required animated roots: `FAN_LEFT`, `FAN_CENTER`, `FAN_RIGHT`, `FRONT_SHROUD`, `HEATSINK`, `GPU_DIE`, `VRAM_CHIPS`, `PCB_ASSEMBLY`, `BACKPLATE`.
- Phase intents: assembled **0–89**; fans and shroud release **90–179**; inner parts **180–329**; fully layered **330–449**.
- Rotations intentionally remain zero; geometry is mechanically separated on clear stable axes.
- The GLB deliberately has no baked animation tracks; the separate JSON is the authoritative film-time animation contract.

## 5. EXACT SOURCE PATHS
- `gpu-decompose/agent-a/blender_generate.py` — real Blender 3D scene, materials, STL mesh import, GLB export and film QA proof frames.
- `gpu-decompose/agent-a/mechanical.scad` — real parametric hub, exported to `fan_hub.stl`.
- `gpu-decompose/agent-a/generate_motion.py` — exact timeline JSON, Y-UP contract.
- `gpu-decompose/agent-a/test_motion.py` — all 450 frames/easing/monotonic tracks.
- `gpu-decompose/agent-a/clearance.py` — REAL PyBullet DIRECT rigid collision proxy test.
- `gpu-decompose/agent-a/godot/previs.gd` — REAL Godot headless 3D hierarchy replay.
- `gpu-decompose/agent-a/validate_assets.py` — GLB structure/node/material/data integrity audit.
- `.github/workflows/agent-a-build.yml` — reproducible free Linux Actions toolchain and 3D artifact publication.
- `gpu-decompose/agent-a/fan_hub.scad` and `check_pybullet.py` are earlier prototypes, NOT canonical production inputs. Prefer the named files above.

## 6. BUILD / IMPORT COMMANDS
```bash
# Download the EXACT successful Agent A artifact:
gh run download 37812363063 -R YunRah2103/Remotion-gpt-chat -n GPU-AGENT-A-XFX-SWIFT-3D -D /tmp/xfx-agent-a
sha256sum /tmp/xfx-agent-a/assets/xfx_swift_rx9060xt_triple16.glb
sha256sum /tmp/xfx-agent-a/assets/decomposition.json

# Copy only canonical production binaries into Agent B Remotion public/ tree:
mkdir -p public/gpu-decompose/assets
cp /tmp/xfx-agent-a/assets/xfx_swift_rx9060xt_triple16.glb public/gpu-decompose/assets/
cp /tmp/xfx-agent-a/assets/decomposition.json public/gpu-decompose/assets/
```
Then Agent B should load `GLTFLoader` from `staticFile('gpu-decompose/assets/xfx_swift_rx9060xt_triple16.glb')` and apply JSON animation offsets by exact anchor name in frame-derived (stateless) React render. Do not modify Agent A node names or fall back to a generic GPU. Test full hierarchy and frame-state before committing final source.

To reproduce Agent A:
```bash
mkdir -p gpu-decompose/assets
openscad -o gpu-decompose/agent-a/fan_hub.stl gpu-decompose/agent-a/mechanical.scad
python gpu-decompose/agent-a/generate_motion.py
python gpu-decompose/agent-a/test_motion.py
python gpu-decompose/agent-a/clearance.py
# Requires installed Blender with glTF exporter, NumPy, and Cycles CPU renderer:
blender -b -t 3 --python gpu-decompose/agent-a/blender_generate.py
python gpu-decompose/agent-a/validate_assets.py
```
Use the Actions workflow as the exact tool-install reference; Godot and PyBullet have distinct test dependencies.

## 7. ACTUAL QA
- OpenSCAD: STL produced and imported into all three fan assemblies; checked watertight hub source.
- PyBullet: `PYBULLET_CLEARANCE_PASS` across frames 90,135,180,240,330,449; final tested macro-layer proxies collision-free. Minimum final axial proxy gap among checked pairs about **0.3085** model units. This is **not** an exact mesh collision scan.
- Godot: `GODOT_PROOF_PASS`, 450/450 sample frames, 9 animated anchors, proper GPU die/VRAM parenting; Godot uses proxy boxes for hierarchy, not original high-fidelity Blender meshes.
- Blender: actual scene generated, 2 CPU Cycles preview PNGs rendered and inspected, 23 genuine moving sample frames rendered, and a 23-frame/10fps H264 moving decomposition proof decoded successfully.
- GLB: static geometry export, SHA256, required anchor names, materials and mesh count all PASS; true self-contained glTF binary.
- QA limitation: native preview is **not** the final 15-second portrait Remotion film, which Agent B owns. Full visual/crop validation is a director responsibility.

## 8. ACCURACY NOTES & CREATIVE ADVICE
Manufacturer-confirmed SKU, three fans, black silhouette, dimensions, external power and display port count. **Estimated, not OEM CAD:** PCB traces and length, internal GDDR6 package count/placement, die package details, heatpipe bends/count, fin geometry, screw positions, backplate emboss, exact fan blade mould, and bracket cut-outs. Rear backplate artwork and fan cap logos are stylistic reconstructions. Do NOT market as photoreal manufacturer CAD.
The proof assets deliberately maintain the locked modest separation distances; for a readable fully exploded composition, use the director-contract three-quarter orbit and enough side parallax. Preserve all components and avoid flattening layers into a 2D cutaway. The rebuilt fascia has real circular holes and exterior silhouette, not a bitmap.

## 9. OWNERSHIP
Agent A completed only its source and asset files; Agent B owns Remotion film, scene composition, audio, Manim overlays and the final 450-frame MP4. No changes were made to any other repository, no merge into Agent B's branch, and no additional agents created.
