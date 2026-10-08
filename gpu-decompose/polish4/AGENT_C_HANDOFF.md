# GPU POLISH04 — Agent C mechanical-motion handoff

**Status:** IMPLEMENTED; exact-model native proof and clearance review **PENDING**. Do not treat a successful render command as final visual approval.

**Repository:** `YunRah2103/Remotion-gpt-chat` only. Assigned branch `gpu-polish4/c-motion`. No access to `YunRah2103/yunus-video-lab`.
**D contract immutable source commit:** `102064938a9a45540434c93d9ff03cdcd72f9cba`.
**C motion + final A asset lock implementation source commit:** `7090180c54405d6c82b8dc8873f4676c180cba10`. This file's own commit cannot contain its self-referential Git SHA; read the branch head / Agent C final message for the handoff commit.
**Branch start reconciliation:** initial implementation began from locked base `ca75f8d5cb7536a83ce0bf110c76dc268273ec26` before D published POLISH04 contract. A non-force-push two-parent merge commit `b1f5e9ff6328bc571c613dbff760d6c96104f90f` brought in the authoritative D contract commit. No other agent-owned files were overwritten.

## Versioned source and hashes

- Canonical release input: `gpu-decompose/polish4/motion/decomposition.json`.
- Immutable v1 authored snapshot: `gpu-decompose/polish4/motion/decomposition.v1.json`; data matches canonical byte-for-byte.
- JSON SHA256, both: `d4790dc9dcc6572a0d6ee5478d70431194128055fdaf6d56c171d68ae1f06fed`.
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
| FRONT_SHROUD | 143–179 | (0, -0.025, +0.320) |
| HEATSINK | 183–238 | (+0.035, +0.100, +0.170) |
| HEATSINK_FINS | 202–252 | (-0.045, +0.018, +0.045) |
| HEATPIPE_BUNDLE | 216–267 | (+0.032, -0.018, +0.180) |
| COLD_PLATE | 238–281 | (+0.025, -0.018, +0.095) |
| GPU_DIE | 249–306 | (-0.015, +0.045, +0.250) |
| VRAM_CHIPS | 266–316 | (0, -0.035, +0.200) |
| VRM_COMPONENTS | 281–322 | (+0.014, -0.020, +0.050) |
| PCB_ASSEMBLY | 283–320 | (0, -0.055, -0.065) |
| BACKPLATE | 304–329 | (0, -0.025, -0.790) |

All 13 tracks use schemaVersion 1, `smoothstep`, and `from` = zero vectors. Direct frame evaluation is deterministic, no physics accumulation, no disappearances, no synthetic geometry, no unintended rotations. Rest pose holds through frame 89; final explosion holds from frame 329. The previously trapped-fan defect is prevented by fans translating +Z much farther than the shroud while exiting earlier.

## Hierarchical transform warning and important B/D interface blocker

A tracked child inherits its parent's authored world transform automatically. For example, `GPU_DIE`, `VRAM_CHIPS`, and `VRM_COMPONENTS` are under `PCB_ASSEMBLY`; `HEATSINK_FINS`, `HEATPIPE_BUNDLE`, and `COLD_PLATE` are under `HEATSINK`. Apply each **local** delta exactly once. Never sum the parent world offset into the child local transform, and never move an unparented placeholder.

**Critical:** B's current scene at source SHA `9905a78052ef900840615501609896c7b3fcfd0a` hardcodes nine `MOVING` names and ignores the four newly authored POLISH04 thermal tracks. See [GitHub issue #2](https://github.com/YunRah2103/Remotion-gpt-chat/issues/2). B (or D with explicit integration ownership authorization) must iterate and validate all 13 `motion.nodes` names in its local-delta animation loop; C must not independently edit B source. C's isolated `GpuMotionProof.tsx` demonstrates all-node iteration. Missing thermal motion is a release blocker.

## Exact geometry verification inputs

- Agent A final POLISH04 source SHA: `a3113bb0a4b450696010c6496cfcb62d2a56e2c3`.
- Agent A successful run: `37840656656`.
- Agent A artifact: `GPU-POLISH4-A-XFX-HARDWARE`, numeric ID `11577811444`.
- Exact new A GLB SHA256: `edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e`.
- Original POLISH03 A model for earlier provisional work: run `37833031666`, artifact `11574168580`, SHA256 `21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5`.

## Validation and native proofs

- Initial CI run `37840611456`: exact POLISH03 GLB hash, all 19 unique anchor names and actual parent hierarchy PASS; 450-frame/13-track deterministic checks PASS; stopped before PyBullet due runner NumPy dependency omission. This infrastructure issue was corrected.
- Corrected POLISH03 provisional proof run `37840816287`: validated input/hierarchy/timeline and PyBullet proxies; four true Three.js MP4 rendering jobs completed; still-image proof stage pending at this report revision. Provisional model, provisional POLISH03 camera.
- **Exact POLISH04 A geometry proof run:** `37841310468` triggered from C source `7090180c54405d6c82b8dc8873f4676c180cba10`; **pending result** at this report revision. Workflow verifies exact new GLB SHA, validates glTF graph, performs GLB real mesh AABB and PyBullet-proxy checks, then renders four real videos and samples at frames 0/30/60/89/90/100/115/135/150/180/210/225/250/270/280/310/329/365/415/449. A video artifact ID and independent decoded visual sign-off MUST be added before C approval.
- IMPORTANT: PyBullet tests major-layer box proxies. AABB reports use real exported mesh vertex bounds but are NOT continuous triangle-vs-triangle collision proofs. Visual inspection of moving clips is mandatory and exact A geometry may invalidate provisional margins.

## D integration steps

1. Verify exact new A GLB bytes and C canonical JSON bytes against SHA256 locks above.
2. Stage only in manager-owned runtime `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `public/gpu-decompose/polish4/decomposition.json`, respectively. Do NOT stage POLISH03 fallback.
3. Resolve issue #2 so the scene consumes **all 13 tracks**, checking unique named anchors, local additive origin and timing 90–329. No parent double-offset.
4. Use B's POLISH04 perspective camera/lighting, not C's provisional proof camera. Compare real native clips over 90–180, 180–330 and 330–449. Check macro clearance, fin/pipe/die legibility and exploded payoff.
5. Re-run final glTF-bound and native-screen-space checks on the same exact A/B/C commits. The **final 450-frame master is D-owned**; C has not rendered or published it.

**Known limitations:** Artistically reconstructed XFX PCB/heatpipe internals not original manufacturer CAD. Full collision-free claim and Agent B intended-camera approval must await final moving A/B/C integration.
