# GPU POLISH04 — AGENT A FINAL HARDWARE HANDOFF

**Status: MODEL ACCEPTED FOR AGENT C CLEARANCE + AGENT D INTEGRATION. NOT AN MP4 RELEASE.**

## Exact immutable provenance

- Exclusive repository: `YunRah2103/Remotion-gpt-chat` (the unrelated YUNEX repository was not accessed or modified).
- Agent A: `gpu-polish4/a-hardware`.
- **Full model source SHA: `60d820b97d892c7e5b6edc8cd70b0de0ac0fcec1`.**
- User-requested original branch base: `gpu-polish3/a-hardware` at `10ed52c5b429ebdcbb0532705e9b54d194b100f8`. **Explicit contract reconciliation disclosure:** Agent A started from this requested base before D published the POLISH04 contract; D's contract was subsequently read and ownership/19-anchor interfaces reconciled. We did **not** silently rebase or overwrite another agent's work.
- Agent D contract inspected: `gpu-polish4/d-master`, publishing source `102064938a9a45540434c93d9ff03cdcd72f9cba`.
- Successful **GitHub Actions workflow run ID: `37841586176`**, source SHA `60d820b97d892c7e5b6edc8cd70b0de0ac0fcec1`.
- **Artifact ID: `11578077134`**; artifact name `GPU-POLISH4-A-XFX-HARDWARE`.
- Direct artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37841586176/artifacts/11578077134
- GLB archive path: `polish4/hardware/assets/xfx_swift_rx9060xt_polish4.glb`.
- **Exact final GLB SHA256: `994bc916d369c1d501b9be1b24e020278aa3f9b1dfe9d92d5d3669b143c38c17`**.
- GLB size: **4,562,660 bytes**. Blender source scene: **14,988,820 bytes**.
- Actual export: **839 glTF meshes, 841 graph geometry instances, 42 exported PBR materials, all 19 unique canonical anchors**.
- SKU: XFX SWIFT AMD Radeon RX 9060 XT OC Triple Fan 16 GB / `RX-96TS316B7`.

## Exact complete canonical hierarchy and geometry inventory

All anchors appear **exactly once** in the actual exported glTF node list. Numbers are descendant rendered mesh counts, not inferred part counts:

```text
GPU_ROOT (839)
├── FAN_ASSEMBLY (57)
│   ├── FAN_LEFT   (19; 9 independent thick swept blades)
│   ├── FAN_CENTER (19; 9 independent thick swept blades)
│   └── FAN_RIGHT  (19; 9 independent thick swept blades)
├── FRONT_SHROUD (73)
├── HEATSINK (140)
│   ├── HEATSINK_FINS (115; includes 81 folded primary fin meshes)
│   ├── HEATPIPE_BUNDLE (18; 6 curved primary tubes)
│   └── COLD_PLATE (7)
├── PCB_ASSEMBLY (510)
│   ├── PCB (216; physical traces/pads/footprints)
│   ├── GPU_DIE (7)
│   ├── VRAM_CHIPS (12)
│   ├── VRM_COMPONENTS (226)
│   ├── PCIE_FINGERS (33)
│   ├── POWER_8PIN (9)
│   └── IO_BRACKET (7)
└── BACKPLATE (59; still vented)
```

The complete **839-mesh object/name manifest** is available as `polish4/hardware/assets/model_nodes.json` inside the artifact. All original canonical hierarchy edges and rest pivots are preserved. Do not infer the actual board engineering from these reconstructed meshes.

**Measured exported GLB rest bounds** in glTF Y-up: X [-1.44750, +1.44750], Y [-0.61900, +0.62520], Z [-0.25100, +0.25100]. Actual dimensions **2.8950 x 1.2442 x 0.5020 units**, or approximately **289.5 x 124.42 x 50.2 mm**. The reference 290 x 124 x 49 mm envelope is met to the historical **<3% tolerance** in all axes. Note the geometry including outward fan insignia/bracket is not exactly 49.0 mm deep. An earlier proof export was rejected at 0.5062-unit depth due to cosmetic hub rings; this final locked export corrects the regression and enforces a strict 3% check.

## Physical modelling and PBR improvements

Implemented on top of the **approved** POLISH03 Blender model, without a rebuild:

1. Recast **32 existing node-based Principled metallic/roughness material recipes** for dark soft-touch shroud, molded fan blades, metallic trim, anodized backplate, low-reflectance green PCB, ferrite, ceramics, copper, nickel and folded aluminum. **42 distinct materials** survive GLB export. No external or copyrighted product photo textures.
2. Reprofiled all **27 real rotor aerofoil meshes**, increasing physical thickness slightly, retaining actual OpenSCAD bearing/hub geometry and all independent fan anchors. Added understated hub machining/gasket and perimeter relief.
3. Retained **81 real folded aluminum fins** and **six real bent heatpipes**, with alternating subdued fin-surface metallic responses, nickel collars and a more credible cold-plate contrast. Fins are not silver-grey solid blocks.
4. Enhanced GPU/VRAM readability through actual geometry labels (`NAVI 44`, `GDDR6`), additional small package terminals, surface trace/test points and contrast on the 8-pin and VRM areas.
5. Enhanced shroud recesses/endcap edge breaks and dark bead-blasted metal backplate surfaces; preserved genuinely open rear cooling window and XFX triple-fan proportions.
6. Changed native Blender proof illumination to controlled key/fill/rim and AgX contrast where supported; **these proof-scene lights are NOT part of the GLB and do not constitute Agent B's cinematic lighting**.

No required anchors were renamed, duplicated, or reparented. No new decomposition anchor requests are necessary.

## Source / reproducible GitHub Actions build

Only these four new source paths differ from the user-requested POLISH03 hardware base:

- `gpu-decompose/polish4/hardware/build_polish4.py`: runs the verified POLISH03 generator *in memory*, injects hardware-only POLISH04 improvements, writes versioned P4 assets. It does not edit the historical generator file.
- `gpu-decompose/polish4/hardware/polish4_detail.py`: native Blender geometry/shader/studio functions.
- `gpu-decompose/polish4/hardware/validate_polish4.py`: actual exported GLB vertex bounds (trimesh), unique anchors, node hierarchy, PBR constraints, motion *proof* schema, native image sanity.
- `.github/workflows/gpu-polish4-a-build.yml`: pinned branch-only, model-only OpenSCAD+Blender+FFmpeg+native GLB validator and immutable Actions artifact.

All Actions steps PASS in run `37841586176`, including native Blender model, GLB export, real stills, actual 23-frame moving proof, image/nonblank checks, GLB hash and SHA256SUMS. This is a hardware QA pass, **not** an independent final Remotion film visual pass.

## Real native proof files (all from source 60d820b...)

Within `polish4/hardware/assets/` in the successful artifact:

- `assembled.png` — full real triple-fan hero.
- `fans_shroud_detail.png` — physically thick blades, machined hubs, shroud.
- `heatsink_heatpipe_detail.png` — real fin banks and tubes; **proof-only sectional visibility** hides only selected center-bank fins for this Blender camera, never in the GLB.
- `heatpipe_bundle_detail.png` — all six bent tubes and cold plate; **proof-only** hides fin bank.
- `pcb_silicon_detail.png` — die, GDDR6 VRAM, ferrite/VRM and traces; **proof-only** removes housing to expose internal geometry.
- `backplate_detail.png`, `rear_backplate_polish3.png` — machined vented rear surface.
- `exploded.png`, `exploded_side.png`, `exploded_film_camera.png` — full 3D assembly, side and portrait proof frames.
- `decomposition-proof-p4.mp4` — actual Blender H.264 low-resolution motion proof, **552x368, 10 fps, 23 frames / 2.3 seconds**. It is not the final 450-frame film.
- `xfx_swift_rx9060xt_polish4.blend`, `blender.log`, `model_nodes.json`, `asset-manifest.json`, `SHA256SUMS.txt`, `polish4-audit.log`, and 23 distinct `moving_frames/` PNGs.

**Independent original-pixel review performed** on downloaded locked artifact and POLISH03 artifact `11574168580`. Matched full-card, fin/pipe, PCB and backplate images are visibly darker and more differentiated. Mean 8-bit luminance (same camera/resolution, images include backdrop) changed assembled **57.3→44.1**, fin proof **64.5→44.1**, PCB **67.7→49.5**, backplate **47.6→33.5**. These luminance values alone do not establish photorealism. The model is a clearer dark-hardware treatment, not OEM CAD; the final film's biggest creative improvement depends on B's camera/lighting and C's motion.

## Agent C compatibility — CRITICAL

- **Coordinate system:** glTF Y-up; +X card length, +Y card top, **+Z out toward triple-fan viewer**; 1 GLB scene unit = 100 physical mm. Never convert the GLB axes twice.
- All 19 original transform-anchor pivots and hierarchy are unchanged. Transforms are additive **local** offsets; children inherit `PCB_ASSEMBLY` parent motion and their independent local `GPU_DIE`/`VRAM_CHIPS` motion.
- The artifact contains `PROOF_ONLY_POLISH03_MOTION.json` with baseline hash `d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b`, **ONLY to reproduce Blender moving proofs**. **It is expressly NOT an Agent A motion deliverable for production. DO NOT stage it as the final animation**.
- Agent C alone owns `gpu-decompose/polish4/motion/decomposition.json`, all final motion/offsets, clearance validation and SHA lock. C must evaluate its own final JSON against the exact A GLB SHA above, including fan release, cooler/PCB axial clearance and parent-child transforms. Native Blender stills do not certify swept collision safety.
- Heatpipes are real but partly occluded inside dense cooler fins in normal assembled views; request readable optical lighting/camera/cutaway from B, without hiding exported geometry.
- Previous P3 `glb-pose-audit.json` evaluates the older GLB only; it **must not** be reported as final P4 geometry clearance evidence.

## Exact Agent D integration instructions

1. Pin run `37841586176`, artifact `11578077134`, **not** any earlier POLISH04 A run or stale "latest" model.
2. Download: `gh run download 37841586176 -R YunRah2103/Remotion-gpt-chat -n GPU-POLISH4-A-XFX-HARDWARE -D /tmp/polish4-agent-a`.
3. Locate `polish4/hardware/assets/xfx_swift_rx9060xt_polish4.glb`; **reject if SHA256 differs from `994bc916d369c1d501b9be1b24e020278aa3f9b1dfe9d92d5d3669b143c38c17`**.
4. D alone stages that exact GLB into `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb`. D stages **Agent C's separately validated final motion JSON** as `public/gpu-decompose/polish4/decomposition.json`.
5. Agent B's scene must consume the new staged GLB with validated correct scene scale, no fallback to older GLB and no reuse of the P3 proof motion.
6. Run **native** 1080x1920 Three.js/Remotion frame and moving-clip QA on final A+B+C before any full 450-frame render approval. Inspect actual screen occupancy, reflections, fan readability, heatsink and PCB details, signed separation and audio.
7. D alone owns final MP4 mux, ffprobe, full decode, SHA lock, final proof comparison and release.

## Honest remaining limitations

Internal PCB topology, die packaging, VRAM placements, heatpipe routing and all miniature capacitor/choke locations are an **artistic engineering reconstruction** with credible visible categories, not verified manufacturer internals. The shroud remains an intentionally stylized approximation rather than photogrammetry. Native scene images use controlled Cycles lights; Three.js runtime PBR reflection and tonemapping still require independent QA. No claim is made that material refinement alone corrects the film's old 6.5/10 camera/rhythm concerns.

**Scope audit:** no `src/**`, Agent C motion paths, Agent D `public/**` integration, historical release assets or any other repository were accessed for mutation. No full final MP4 produced by Agent A.
