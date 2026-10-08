# GPU DECOMPOSITION POLISH 03 — AGENT B HANDOFF

**Status:** IMPLEMENTATION PUSHED; native visual gate RUNNING, pending true pixel inspection.
**Repository:** YunRah2103/Remotion-gpt-chat (no other repository used)
**Own branch:** `gpu-polish3/b-cinematography`.
**Agent C contract:** `gpu-decompose/polish3/PRODUCTION_CONTRACT.md`, immutable full C remote SHA `8d4748af2d239177a9a6f44f07e9472b95f33d9f`.
**Frozen B implementation SHA:** `8db70527ad7a38f4b08e07cf0be3b0d91cf566ed` (all production source/workflow changes included).
**B native proof run:** `37831165543` at https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37831165543
**Current asset for B preview:** **old test-only** baseline A SHA `322f77046b15402b55042e86822389bec1e70818` / run `37819645913` / artifact `11567849898`. This is *not* the new POLISH 03 model and may not be released.

## Changed paths
- `src/gpu-polish3/GpuDecompositionPolish3.tsx` — the new genuine GLB-driven, additive JSON poses, multilights and typography
- `src/gpu-polish3/cinema.ts` — automatic true 3D bounds-derived camera fit, frame-only 9°->50° yaw and 8°->~17° pitch
- `src/GpuDecomposition.tsx` — original baseline code preserved as `GpuDecompositionBaseline`, production export uses new independent implementation
- `.github/workflows/gpu-polish3-b-native-proof.yml` — pinned old GLB QA, actual old MP4 comparison, Remotion native stills, 3 genuine moving clips and full FFmpeg decode
- `gpu-decompose/polish3/cinematography/IMPLEMENTATION.md` — coordinates, lighting, integration, limitations
- `gpu-decompose/polish3/AGENT_B_HANDOFF.md` — this document

## Cinematography
0–89: product visually dominates the horizontal field, gradual 9→15° three-quarter camera yaw, gentle push via fit coverage .745→.805. 90–179: smooth yaw starts reveal, fan/shroud relation seen at 3D angle. 180–329: yaw steadily increases to ~48° and pitch ~15°, show plate/fin/PCB depth. 330–449: ~2.3° gradual orbit settle, bounds-fitted exploded ending without clipping. View fitting is calculated **after** local JSON offsets from evaluated actual meshes rather than using old hard-coded Z separation.

## Lighting
Pure charcoal #242a31 studio, overhead warm-white, broad neutral cool front fill, rear rim and hemisphere ambient; gently lift near-black physically based materials using cloned material instances. No floor slab, coloured screen-blend filter, particles or extra 2D GPU cutouts.

## Critical pixel QA still required
Old released MP4 exhibits an abnormal all-frame magenta cast absent in old raw Remotion stills (probable final Manim screen-blend colour pipeline failure); Agent C must visually inspect final decoded MP4 after mux, not just pre-overlay stills.
Proof run is designed to capture: frames 0,45,89,120,179,240,329,385,449 at native 1080×1920 and clips frames 108–139,232–247,368–399 at native 1080×1920, plus 5 real before/after comparative stills.
**Proof artifact ID and verified independent new A asset visuals pending**. Do not call B COMPLETE or C RENDER_APPROVED until real post-run artifacts are inspected.

## Exact integration procedure
1. C cherry-picks/selectively merges B-owned paths from frozen B implementation SHA above (B Root.tsx untouched). Existing registered composition ID `XfxSwiftDecomposition` resolves to new isolated scene via adapter.
2. Stage A's new **SHA-validated**, unique `xfx_swift_rx9060xt_polish3.glb` into `public/gpu-decompose/xfx_swift_rx9060xt_polish3.glb`; stage A's new `decomposition.json` into `public/gpu-decompose/decomposition.json`. Validate manifest and all 19 anchor names, and do NOT use B's workflow old-GLB staging step for final production.
3. Render native frames and moving clips with **actual new A assets**, inspect fan/shroud physical clearance at 120/179 and exploded full depth at 329/385/449.
4. Avoid prior final colour pipeline purple cast; full decoded MP4 must show neutral charcoal hardware. C alone approves release.

**Remaining issue:** A's new GLB/animation has not yet been delivered and B's baseline CI render currently underway; final model-specific framing may require a targeted edit after A's handoff.
