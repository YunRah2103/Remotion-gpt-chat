# GPU POLISH04 — Agent C mechanical-motion handoff

**Status:** IMPLEMENTED; exact POLISH04 A model verified in an initial native proof; tighter final conservative AABB gate and updated-motion real video verification **PENDING**. Do not treat a successful render command as final visual approval.

**Repository:** `YunRah2103/Remotion-gpt-chat` only. Assigned branch `gpu-polish4/c-motion`. No access to `YunRah2103/yunus-video-lab`.
**D contract immutable source commit:** `102064938a9a45540434c93d9ff03cdcd72f9cba`.
**First C motion + A asset lock source commit:** `7090180c54405d6c82b8dc8873f4676c180cba10`. **Clearance corrections:** `cb02559049cbed7f4a836d76132ac22a13391d5c`, **strict 11-pair AABB gate:** `b15034e19c99e1ea0a0dd515506909c70e0df731`. This document records the exact immutable motion/proof source commits; the final branch HEAD SHA after publishing this handoff is returned in Agent C's user-facing delivery (self-referential commit SHA cannot be embedded into its own contents).
**Branch start reconciliation:** initial implementation began from locked base `ca75f8d5cb7536a83ce0bf110c76dc268273ec26` before D published POLISH04 contract. A non-force-push two-parent merge commit `b1f5e9ff6328bc571c613dbff760d6c96104f90f` brought in the authoritative D contract commit. No other agent-owned files were overwritten.

## Versioned source and hashes

- Canonical release input: `gpu-decompose/polish4/motion/decomposition.json`.
- Immutable v1 authored snapshot: `gpu-decompose/polish4/motion/decomposition.v1.json`; data matches canonical byte-for-byte.
- JSON SHA256, both: `c311748fa64c31eea43f595d2cf04b0a39cd548a49b5a8b0adaed4e273daf5cc`.
- Frame evaluator: `gpu-decompose/polish4/motion/generate_motion.py`.
- Schema/continuity verification: `gpu-decompose/polish4/motion/validate_motion.py`.
- Real GLB hierarchy inspector: `gpu-decompose/polish4/motion/inspect_glb.py`.
- Approximate PyBullet checks: `gpu-decompose/polish4/motion/clearance_pybullet.py`.
- Real exported vertex conservative AABB audit: `gpu-decompose/polish4/motion/mesh_aabb_audit.py`.
- True Remotion/Three.js mechanical proof: `gpu-decompose/polish4/motion/GpuMotionProof.tsx`, `entry.tsx`.
- CI: `.github/workflows/gpu-polish4-c-motion-proof.yml`.
- Exact A/C preview input lock: `gpu-decompose/polish4/motion/PROOF_ASSET_LOCK.json`.

## Shot-compatible mechanical timing (frame-based, 30fps)

| Component | Frames (start–end) | Local additive destination XYZ, scene units |
|---|---:|---|
| FAN_LEFT | 90–151 | (-0.190, -0.035, +1.040) |
| FAN_CENTER | 99–159 | (0, +0.085, +1.160) |
| FAN_RIGHT | 108–167 | (+0.190, -0.035, +1.040) |
| FRONT_SHROUD | 143–179 | (0, -0.025, +0.470) |
| HEATSINK | 183–238 | (+0.035, +0.100, +0.170) |
| HEATSINK_FINS | 202–252 | (-0.045, +0.018, +0.045) |
| HEATPIPE_BUNDLE | 216–267 | (+0.032, -0.018, +0.180) |
| COLD_PLATE | 238–281 | (+0.025, -0.018, +0.095) |
| GPU_DIE | 249–306 | (-0.015, +0.045, +0.290) |
| VRAM_CHIPS | 266–316 | (0, -0.035, +0.300) |
| VRM_COMPONENTS | 281–322 | (+0.014, -0.020, +0.300) |
| PCB_ASSEMBLY | 283–320 | (0, -0.055, -0.065) |
| BACKPLATE | 304–329 | (0, -0.025, -0.790) |

All 13 tracks use schemaVersion 1, `smoothstep`, and `from` = zero vectors. Direct frame evaluation is deterministic, no physics accumulation, no disappearances, no synthetic geometry, no unintended rotations. Rest pose holds through frame 89; final explosion holds from frame 329. The previously trapped-fan defect is prevented by fans translating +Z much farther than the shroud while exiting earlier.

## Hierarchical transform warning and important B/D interface blocker

A tracked child inherits its parent's authored world transform automatically. For example, `GPU_DIE`, `VRAM_CHIPS`, and `VRM_COMPONENTS` are under `PCB_ASSEMBLY`; `HEATSINK_FINS`, `HEATPIPE_BUNDLE`, and `COLD_PLATE` are under `HEATSINK`. Apply each **local** delta exactly once. Never sum the parent world offset into the child local transform, and never move an unparented placeholder.

**Resolved D integration interface:** Agent D independently implemented and pushed all **13** C-owned animated anchor names in `src/gpu-polish4/GpuDecompositionPolish4.tsx` on `gpu-polish4/d-master` at `96dc608ea2f376a987c27559bbd222a8c0fef6ac`. C fetched D's actual new file and confirmed `MOVING` now includes fins, heatpipes, cold plate and VRM. [Issue #2](https://github.com/YunRah2103/Remotion-gpt-chat/issues/2) was closed after source verification. Neither C nor D thereby proves final B-camera visual performance: final integrated native shot review remains with D.

## Exact geometry verification inputs

- Agent A final POLISH04 source SHA: `a3113bb0a4b450696010c6496cfcb62d2a56e2c3`.
- Agent A successful run: `37840656656`.
- Agent A artifact: `GPU-POLISH4-A-XFX-HARDWARE`, numeric ID `11577811444`.
- Exact new A GLB SHA256: `edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e`.
- Original POLISH03 A model for earlier provisional work: run `37833031666`, artifact `11574168580`, SHA256 `21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5`.

## Validation and native proofs

- Initial CI run `37840611456`: exact POLISH03 GLB hash, all 19 unique anchor names and actual parent hierarchy PASS; 450-frame/13-track deterministic checks PASS; stopped before PyBullet due runner NumPy dependency omission. This infrastructure issue was corrected.
- Corrected POLISH03 provisional proof run `37840816287`: validated input/hierarchy/timeline and PyBullet proxies; four true Three.js MP4 rendering jobs completed; still-image proof stage pending at this report revision. Provisional model, provisional POLISH03 camera.
- **First exact POLISH04 A geometry proof:** `37841310468` from C `7090180c54405d6c82b8dc8873f4676c180cba10`, **SUCCESS**, real 4 MP4s + 20 PNGs, artifact ID **`11578196861`**. Real exported GLB mesh axial AABB found **some late projected overlap** (shroud/cooler, die/PCB, VRAM/PCB). This technically passed permissive first proof but **was not approved by C**; it prompted exact numerical clearance corrections. 
- **Final strict corrected-motion exact-A-model native proof:** **SUCCESS** on GitHub Actions run **`37842128210`**, from frozen source commit `b15034e19c99e1ea0a0dd515506909c70e0df731`. Output artifact **`GPU-POLISH4-C-MOVING-MECHANICS`**, numeric ID **`11578063230`**. The actual ZIP was downloaded and independently inspected. Verified: exact new A model GLB SHA and corrected motion JSON SHA, GLB 858 nodes/839 meshes/42 materials and unique anchors, 450-frame deterministic timeline test, 23-frame PyBullet major proxy PASS, **56 real mesh AABB sampled poses / 11 critical positive final +Z envelope margins**, four genuine H.264 Three.js/Remotion moving MP4s decoding completely at 540×960 30 FPS, and 20 actual model stills. Observed fan stagger, cooler/PCB progression, final stable exploded layout, no obvious pop or severe apparent path intersection from sampled moving views. These proof clips use the legacy POLISH03 proof camera and are **not B/D final cinematic approval**. See `gpu-decompose/polish4/motion/FINAL_MECHANICAL_QA.md` for quantitative data, SHA256 for each MP4 and limitations.
- IMPORTANT: PyBullet tests major-layer box proxies. AABB reports use real exported mesh vertex bounds but are NOT continuous triangle-vs-triangle collision proofs. Visual inspection of moving clips is mandatory and exact A geometry may invalidate provisional margins.

## D integration steps

1. Verify exact new A GLB bytes and C canonical JSON bytes against SHA256 locks above.
2. Stage only in manager-owned runtime `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `public/gpu-decompose/polish4/decomposition.json`, respectively. Do NOT stage POLISH03 fallback.
3. Resolve issue #2 so the scene consumes **all 13 tracks**, checking unique named anchors, local additive origin and timing 90–329. No parent double-offset.
4. Use B's POLISH04 perspective camera/lighting, not C's provisional proof camera. Compare real native clips over 90–180, 180–330 and 330–449. Check macro clearance, fin/pipe/die legibility and exploded payoff.
5. Re-run final glTF-bound and native-screen-space checks on the same exact A/B/C commits. The **final 450-frame master is D-owned**; C has not rendered or published it.

**Known limitations:** Artistically reconstructed XFX PCB/heatpipe internals, not manufacturer CAD. PyBullet checks are conservative proxy collision checks; real evaluated GLB AABB margins do not certify exact continuous triangle-to-triangle swept collision. Final B camera and D integrated native 1080×1920 proof remain manager-only release gates.

## POLISH04 genuine A-geometry correction and hard QA threshold

Agent C independently unpacked Agent A's **actual** POLISH04 exported GLB from artifact `11577811444`. Measured **841 real mesh geometry nodes**, including 226 VRM meshes, 115 fin meshes, 18 heatpipe meshes and 57 fan meshes grouped under their genuine GLB parent anchors. Evaluated conservative exported-mesh world-space +Z AABBs across release stages, not just a proxy model. The first proposed local offsets exhibited negative late-stage **axial bounding-envelope margins** of roughly -0.0995 (front shroud vs heatpipes), -0.0725 (front shroud vs fins), -0.0130 (GPU die vs board group) and -0.0655 (VRAM vs board group), plus -0.227 for VRM vs board. Negative AABB axial projections are not proof of triangle intersection but do NOT meet a clean exploded-layout safety margin.

To address this without reconstructing hardware, C enlarged **only four physically justified local offsets**: front shroud +Z 0.32→0.47; GPU die +Z 0.25→0.29; VRAM +Z 0.20→0.30; VRM +Z 0.05→0.30. The staged start/end frames, fans, heatsink, heatpipe and backplate trajectories remain unchanged. Predicted final corrected +Z conservative ordering becomes approximately +0.0505 shroud/heatpipes, +0.0775 shroud/fins, +0.0333 coldplate/die, +0.027 die/PCB, +0.0345 VRAM/PCB, +0.023 VRM/PCB, and +0.484 minimum fan/shroud. **These projected results require confirmation in final Actions**; they do not certify continuous exact triangle swept collision.

The hard-gate script now asserts **11 positive major-part final AABB +Z margins above 0.015 units** from real exported mesh vertices. If any fail, workflow fails rather than releasing. PyBullet separately asserts late-stage detached major-part **collision proxy** safety. Agent D must rerender exact new A/B/C source, inspect moving views from B's actual cinema camera, and only then issue overall visual approval. Neither C's proof nor proxy solver substitutes for this.

**Final Agent C conclusion:** Motion implementation and native mechanical previsualization PASS against exact A POLISH04 model, subject to limitations above. **No full 450-frame film rendered by C.** Integration to D requires preserving all 13 C tracks and one final A GLB, and inspecting the final camera and readability separately.
