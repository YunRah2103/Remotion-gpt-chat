# Automotive Parts Kit Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide 55 original modest-detail automotive assemblies with variants for other video agents to refine.
**Architecture:** Separate parts-kit folder reuses world-kit geometry, lighting and disposal. Catalogue dispatches focused family builders; all motion derives from explicit numeric state and serialisable node metadata. No changes to existing cars or films.
**Tech Stack:** Existing Three.js, React Three Fiber, Remotion, TypeScript, Node 24; no new dependencies.
**Spec:** docs/parts-kit/DESIGN.md

## Global Constraints
- Units metres, +X forward, +Y up, +Z left; origin is mounting datum.
- Keep approved cars, worlds and existing mechanisms untouched.
- 55 catalogue IDs, 15 families; all original generic illustrative models.
- Named mounts, portable animation metadata, bounded controls and resource disposal.

## Review Focus
- Repeated/backwards frame evaluation must restore exactly, including exploded states.
- GLB load must retain mount and animation node metadata.
- Camera framing must include asymmetric/exploded parts and portrait views.
- Zero/maximum control states and nonfinite inputs must not corrupt scene state.
- Turbo shaft/rotor alignment and suspension compression must remain visually coherent.

### Task 1: Catalogue and geometry
Files: src/yunex/parts-kit/{catalog,helpers,powertrain,chassis,systems,aero,models}.ts; tests/parts-kit/models.test.mjs.
Interface: PARTS; partSpec(id); createPart(options): Group. Named mount nodes and userData ownership metadata.
- [x] Write failing tests for 55 unique IDs / 15 families, finite metre-scale geometry, required mount metadata, variant shape differences and invalid IDs/options.
- [x] Implement catalogue, shared shapes and family factories, then run model tests.

### Task 2: Reusable controls
Files: src/yunex/parts-kit/{motion,cameras,index}.ts; tests/parts-kit/motion.test.mjs.
Interface: animatePart(group,state), partMount(group,name), partCamera(group,portrait).
- [x] Write failing tests for repeat/reverse evaluation, zero/max compression, unchanged mount positions, nonfinite rejection and exploded reset.
- [x] Implement serialisable absolute-state transforms and bounds-aware cameras; run all parts tests and TypeScript.

### Task 3: Preview and handoff
Files: src/yunex/parts-kit/{components,Preview,entry}.tsx; scripts/parts-kit/{export,review}.mjs; docs/parts-kit/README.md; package.json; CI workflow.
Interface: AutomotivePart React wrapper; PartPreview/PartPreviewPortrait/PartsFamilyReel compositions; GLB catalogue and animation-preserving loader check.
- [x] Add isolated Studio entry, native still review and moving mechanism inspection; do not alter old film registrations.
- [x] Export/reload all 55 GLBs; verify finite geometry and retained mounts/animation metadata.
- [x] Inspect all variants and representative cutaway/exploded/motion frames, verify portable source package, update GitHub and save deliverables.

## Execution ledger
Current isolated feature branch: feat/yunex-reusable-world-kit. Existing clean baseline is the verified V3 kit. User already authorises hands-on extension and wants a reusable baseline; proceed inline without repeated design approval. Spec and interfaces self-reviewed: no shared-interface conflicts. Rendering preview evidence follows repository AGENTS.md requirements.

Tasks 1–2 complete: TypeScript and 13 parts tests pass. All 55 GLBs export/reload with matching mounts, animation-node counts and animated bounds. RED→GREEN regressions cover moving connection points, wheel sidewall/rim width, GLB name sanitisation and transmission-specific internals. Ruling: minimum mesh budget is two rather than three; the simple ducktail legitimately consists of a base and lip. No model simplification beyond its requested modest baseline is needed. Native still review is running; moving review awaits the source review.

Final source review identified fractional-ratio shaft jumps, leaf spring eye separation and floating multi-link rods. Each was reproduced in a failing regression and fixed. An independently found inverted volute surface also has a RED→GREEN normal test. Public optional-state handling now accepts explicitly undefined values as omitted, and malformed cutaway options throw. Final parts suite: 18/18; original world suite: 25/25. All 55 revised GLBs round-trip with matching animated bounds and mounts. Corrected native renders are running.

Native catalogue inspection found raised road-tyre tread marks. A surface-conformity test failed before the fix and passes after replacing them with flush circumferential grooves. Revised parts suite: 19/19; revised GLBs: 55/55. Only the two affected wheel stills were regenerated; the moving family preview is rendered from the revised source in full.

Final deliverables saved: 55-model baseline ZIP (186 files, approximately 9 MB), 55-variant catalogue and 30-second native H.264 preview (960x540, 12fps, 360 frames, limited-range yuv420p/BT.709). Full decode passes and all 15 family shots were sampled and inspected. The clean extracted source passes TypeScript and all 44 parts/world tests; all 55 model SHA256 values match and packaged source matches the tested copy exactly. Dependency/build caches are excluded. The parts workflow check/test/export stages pass on GitHub; native CI review is still running. The separate existing film review still fails on missing Chiron footage (404). Feature PR remains unmerged.
