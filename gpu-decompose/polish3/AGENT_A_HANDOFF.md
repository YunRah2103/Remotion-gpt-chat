# GPU POLISH 03 — AGENT A FINAL HARDWARE HANDOFF

**READY FOR AGENT C INDEPENDENT INTEGRATION QA — NOT FINAL FILM RELEASE.**

## Exact provenance and locked assets

- Exclusive repository: YunRah2103/Remotion-gpt-chat.
- Agent A branch: gpu-polish3/a-hardware, created from gpu-decompose/a-model at **c8da44190aaa3bb7a42de391d2f8d1050cceee63**.
- **Full hardware source commit SHA:** **e5e274437a47b554af7940911e5a825397dc64f3**. Subsequent report-only commits do not change the exact locked model source.
- Manager C production contract: gpu-decompose/polish3/PRODUCTION_CONTRACT.md on manager branch gpu-polish3/c-master, verified full C remote contract SHA **8d4748af2d239177a9a6f44f07e9472b95f33d9f**.
- **Successful GitHub Actions run: 37833031666**, workflow **378852915**, source SHA e5e274437a47b554af7940911e5a825397dc64f3.
- Workflow: .github/workflows/gpu-polish3-a-build.yml.
- **Exact artifact ID: 11574168580**; name **GPU-POLISH3-A-XFX-HARDWARE**.
- Artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37833031666/artifacts/11574168580
- Verified GLB asset inside artifact: **polish3/assets/xfx_swift_rx9060xt_polish3.glb**, 3,157,740 bytes.
- **GLB SHA256:** **21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5**.
- Verified motion inside artifact: **polish3/assets/decomposition.json**.
- **Motion JSON SHA256:** **d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b**.
- Both are NEW versioned POLISH 03 files; old v2.4 assets, initial release and old proposal are retained, unchanged. Do not substitute the old artifact when integrating.

## New real geometry / visual improvements

Built on the actual v2.4 procedural Blender source rather than recreating from scratch.

1. Three rotor assemblies are fully independent and physically ahead of the shroud when exploded. Removed the three old solid well discs that made fans appear embedded; added open stator/bearing supports, trim and anti-vibration details. Retained 27 swept, thick, real 3D fan blades.
2. Replaced plain heatsink layers with **81 individually modelled folded aluminium fins** across three banks, with rails, end plates and leading edge folds.
3. Six genuine curved 3D metallic heatpipes connect the cold-plate area with the cooling banks. Added contact plate structure and fasteners.
4. Dark green PCB contains a separate GPU/substrate, ball-grid pads, VRAM and footprint contacts, populated DrMOS/VRM inductors, visible copper windings, many actual ceramic SMD capacitors and terminations, eight tall bulk capacitors, surface traces/vias, PCIe fingers and 8-pin power geometry.
5. Improved machined backplate vent lip and inner support structure; retained black XFX SWIFT triple-fan commercial silhouette with restrained metal and polymer material response.
6. Exactly **798 named GLB nodes, 779 real exported meshes, and 36 PBR materials**, verified from exported GLB.
7. Preserved the exact 19 canonical anchors and Blender-to-glTF Y-up export conventions.

Verified world-space GLB rest bounds (Y-up):
- X = [-1.4475, +1.4475].
- Y = [-0.6190, +0.6252].
- Z = [-0.2510, +0.2510].

The actual exported geometry falls inside the established ±3% tolerance of **290 × 124 × 49 mm**, including the small bracket protrusion. Scale is sceneUnitsPerMillimetre = 0.01; +Z faces outward from the triple-fan face.

## Updated approved motion — 450 frames @ 30fps / 15 seconds

Frame-based pure smoothstep deltas. Values below are in GLB Y-up local additive units, not world absolutes:

| Anchor | Frames | Final delta [X,Y,Z] |
| --- | --- | --- |
| FAN_LEFT | 90–155 | [-0.180,-0.035,+0.930] |
| FAN_CENTER | 94–157 | [0,+0.060,+1.030] |
| FAN_RIGHT | 98–159 | [+0.180,-0.035,+0.930] |
| FRONT_SHROUD | 127–179 | [0,-0.015,+0.310] |
| HEATSINK | 183–250 | [+0.025,+0.090,+0.100] |
| GPU_DIE | 216–282 | [0,+0.020,+0.280] |
| VRAM_CHIPS | 236–298 | [0,-0.025,+0.230] |
| PCB_ASSEMBLY | 260–322 | [0,-0.060,-0.250] |
| BACKPLATE | 284–329 | [0,-0.020,-0.760] |

This replaces the **prohibited** v2.4 motion in which front casing advanced farther than rotors. Rotor, shroud, cooler, PCB, die, memory and plate preserve hierarchy and persist through all frames; no abrupt disappearing meshes.

**Actual mesh-derived 17-frame motion audit:** glb-pose-audit.json evaluates imported GLB vertices and true glTF parent/world transformations at frames 0,45,89,90,105,120,145,179,180,210,240,270,300,329,330,385,449. At/after frame 120, positive fan-to-shroud axial clearance is at least **0.19165 scene units** at tested frames; final frame clearance is **0.536 units**. Final shroud-versus-heatsink axial gap is **0.0325 units**. Initial assembled and early-release parts may share/touch proxy envelope; this is **AABB-based axial mesh clearance, not a triangle-accurate continuous-time penetration audit**. Independent PyBullet checks use labelled primitive box collision proxies. Godot verifies 450-frame hierarchy playback, not final pixel fidelity.

## Real Blender image proofs and motion video

The pinned successful Actions artifact includes original native Blender rendered proof files:

- **assembled.png** — assembled black XFX triple-fan exterior 3/4 view.
- **fans_shroud_detail.png** — shroud, fan rotors, bearing features.
- **heatsink_heatpipe_detail.png** — **sectional proof-camera cutaway** showing 2 fin banks, machined cold plate and bent tubes; central bank fins hidden in the preview only. ALL 81 fin meshes remain in the actual exported GLB.
- **heatpipe_bundle_detail.png** — authentic routed heatpipe and coldplate assembly with fins hidden in proof only, as an independent visibility check.
- **pcb_silicon_detail.png** — revealed PCB GPU, VRAM/VRM components with housing hidden in proof only.
- **rear_backplate_polish3.png** and **backplate_detail.png** — rear machined plate.
- **exploded.png** and **exploded_side.png** — full model from near the original director's angled film camera.
- **exploded_film_camera.png** — actual 720×1280 Blender portrait final exploded preview. All 3 fans remain within crop.
- **decomposition-proof.mp4** — actual native Blender sampled-frame motion encoded through FFmpeg, H264 yuv420p, 552×368, 10fps, **23 frames / 2.3s**. All frames decode; it is a **short proof**, not the complete 450-frame 1080×1920 release film.
- Source **xfx_swift_rx9060xt_polish3.blend**, moving_frames/, logs and audit JSONs.

All original native images were actually inspected in this Agent A session, including corrected exposed PCB, heatpipe cutaway and portrait framing; baseline v2.4 views were visually compared to the new assembled and exploded renders.

## Verified QA and hashes

**SUCCESS** run 37833031666 performed and passed:
- OpenSCAD actual mesh generation/import into three fan hubs.
- 450-frame deterministic motion checks.
- PyBullet DIRECT collision-proxy samples over 17 poses.
- Godot 450-frame native 3D proxy hierarchy playback.
- Blender actual full geometry construction and GLB export, native CPU-rendered PNGs and moving Blender frames.
- Self-contained GLB PBR material/node/mesh schema and physical bounds checks.
- Independent exported-GLB real vertex/bounds pose audit across 17 poses.
- Real FFmpeg moving-proof encoding and full video decode.
- SHA256SUMS manifest integrity for GLB/motion/JSON audits.

**Source**: gpu-decompose/agent-a/blender_generate.py with additive polish3_detail.py. GLB validators: validate_assets.py, validate_dimensions.py, glb_pose_audit.py. Motion: generate_motion.py, test_motion.py, clearance.py, godot/previs.gd. Isolated workflow: .github/workflows/gpu-polish3-a-build.yml.

## Exact instructions for Manager C

1. **Only download run 37833031666, artifact ID 11574168580, name GPU-POLISH3-A-XFX-HARDWARE**; never use "latest" by guess.
2. Download via:
   gh run download 37833031666 -R YunRah2103/Remotion-gpt-chat -n GPU-POLISH3-A-XFX-HARDWARE -D /tmp/gpu-polish3-agent-a
3. In the archive, locate versioned GLB, motion JSON and asset-manifest.json under polish3/assets; verify exact SHA256 against the two locks above.
4. **Only Agent C stages hashed binaries into public/gpu-decompose/** using paths matching Agent B's current implementation, explicitly replacing the historical model runtime path where necessary; fail closed if GLB missing or old hash encountered.
5. Three.js/Remotion must add delta*smoothstep to **initial local** anchor position each frame. The PCB_ASSEMBLY parent transform compounds with GPU_DIE and VRAM_CHIPS child movement. Do not remap Blender axes a second time.
6. C must independently render native **1080×1920 actual Three.js screenshots** at frames 0,45,89,120,179,240,329,385,449, and moving native film previews especially during fan/shroud release. Inspect crop, lighting, metal depth, legibility, separation, title/audio and final payoff before RENDER_APPROVED.
7. C alone owns integration, 450-frame final render, AAC 48kHz final mux and final release lock/report.

## Limitations / accuracy disclosures

The exact SKU, black triple-fan exterior, external dimensions and outputs are manufacturer/reference-grounded. **Inside engineering geometry is illustrative and not XFX engineering CAD**: PCB layout and trace routing, exact VRAM topology, GPU package silhouette, heatpipe count/curves, fan blade mould, screws, pad placements and backplate milling remain artistic reconstructions. The genuine heatpipes physically lie inside the true cooler and may require an approved camera/cutaway or further B/C-owned motion to be readable in the eventual native film; the proof shot hides only selected parts to show real underlying geometry, **not altered/exported geometry**.

Native source proofs alone do not authorize film release: C still must inspect fully integrated A+B native Remotion at 1080×1920 and then the entire 15-second finished MP4.

**Agent A has not modified Agent B Remotion files, Agent C integration/render scripts or any other repository.**
