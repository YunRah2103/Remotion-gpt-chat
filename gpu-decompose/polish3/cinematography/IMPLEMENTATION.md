# GPU POLISH 03 — Agent B cinematography implementation

**C contract reviewed:** `gpu-decompose/polish3/PRODUCTION_CONTRACT.md` published at immutable C commit `8d4748af2d239177a9a6f44f07e9472b95f33d9f`.
**Scope:** Camera, lighting, editorials and deterministic Remotion pose consumption. No changes to Agent A models or motion data.

## Source and camera
- `src/gpu-polish3/GpuDecompositionPolish3.tsx` is the actual isolated three.js/R3F composition. The baseline code in `src/GpuDecomposition.tsx` remains available under `GpuDecompositionBaseline`; the existing `GpuDecomposition` export routes to the new scene. Root.tsx and other films are unchanged.
- `src/gpu-polish3/cinema.ts` uses pure frame functions, with yaw 9° at frame 0; 15° at hero frame 89; ~48° by frame 322; ~50.3° at 449. Pitch 8° to ~16.8°. No cuts or accumulated transforms.
- Orthographic camera framing calculates world mesh bounds *after* applying Agent A's hierarchical additive anchor motion, and projects 8 bounding corners into camera space. It targets ~75–81% horizontal footprint while reserving headline/phase typography safety. Bounds are computed from actual current GLB, not fixed assumed model geometry.
- Gradually enlarges in opening, then reframes the actual exploded geometry without an arbitrary zoom jump.

## Lighting & appearance
Graphite `#242a31` 3D studio background, neutral-white overhead key, cool side fill, back rim and wide indirect hemisphere. Cloned materials (source assets unmodified) have conservative max metalness, minimum roughness and very subtle tinted emissive lift only for crushed dark materials, retaining source colour texture.

No RGB, decorative particle fields, giant 2D stand-ins, floor slab, or repeated HUD clutter. Bottom editorial labels describe the cooling, internals and complete exploded state; header leaves hardware visible.

## GLB and motion integration
- At runtime **require** `public/gpu-decompose/xfx_swift_rx9060xt_polish3.glb` and `public/gpu-decompose/decomposition.json`. No fallback to earlier GLB; fail render if absent. Model selection is C's controlled staging responsibility.
- Enforce all 19 unique required GLB anchors and 9 moving JSON anchors; strict v1 schema, 30fps, 450 frames; additive local position and Euler offsets.
- Agent A owns the new motion values. B's code intentionally does **not** hard-code old separation distances or alter JSON.
- C must verify new A manifest/SHA after stage and rerun native proofs against the real new asset.

## B-only native QA
`.github/workflows/gpu-polish3-b-native-proof.yml` is isolated to B's branch and explicitly stages **old** GLB `e0b86390180ecb6724bcfe029bc77c9a116ff9b004e1ae14fa81b0bff8e0599e` and old motion `1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510` under temporary polish filenames. Uses GitHub old A artifact run 37819645913, released old video run 37821956618. Tests TypeScript, generates 9 native 1080×1920 stills, actual moving clips for fan/inner/final stages, full FFmpeg decode, and before/after pixels. **A passing B old-model proof is not a new-model final release authorization.**

## Baseline visual findings
Original full released MP4 has severe magenta/purple cast not present in the native pre-overlay Remotion still. Original final shot is small, dark and front dominated, with internal components largely hidden. The colour postprocess bug must be corrected by C in final mux, not obscured by extra saturating effects.

## Remaining handoff
Full B SHA, workflow/artifact IDs and frame-by-frame visual assessment are recorded in `gpu-decompose/polish3/AGENT_B_HANDOFF.md` after native proof. C is sole master release authority.
