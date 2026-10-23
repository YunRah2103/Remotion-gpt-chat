# YUNEX V4 — source and native proof handoff

Existing PR #233 continues on feat/yunex-modelling-kit-v2. No replacement PR, force push, production branch edits or EP005 exhaust-interface edits.

## Delivered source

Three opt-in studio body architectures (supercar, coupe, rally hatch) replace the exterior with section-loft coachwork, raised cabins, formed pillars, closed glass and doors, real wheel arches and revised normals. Supercar cabin envelope retains the recovered 1.39 m design. Small recessed 112 mm exhaust outlets expose stable named transforms. Existing 36 vehicle variants, 20 environments and legacy APIs remain available.

Premium reflection lighting and day/dusk/night profiles, revised tyres, selected natural scenery, pose-to-pose cinematic cameras, deterministic driving controls, mounted driver cameras and sparse frustum clearance diagnostics improve authoring. Structured production briefs, three complete recipes, selectable mechanical cutaway assemblies and guarded shot assembly reduce bespoke scene code. V4 twin-turbo V8 diagrams retain housings and connected illustrative flow routes; they do not certify a sealed engine gas path or calibrated simulation.

## Actual films

All three are silent H.264, 1080×1920, 30 fps, yuv420p / BT.709. Each copied deliverable fully decodes. Source, native and geometry gates pass; no frozen spans were detected and every shot has distinct decoded scene frames.

- A: YUNEX-V4-A-Supercar-SILENT.mp4 — 14 seconds / 420 frames. SHA-256 `d7ecff2c45aa3b7d5d7917efee18594f296d24b64ccc4bb7be3eed72b7896089`.
- B: YUNEX-V4-B-Rally-SILENT.mp4 — 10 seconds / 300 frames. SHA-256 `6a8c6c40a1d97cb77a7a91f6bf9aa0ca0dc1747476ad135c0cafafca8b904f61`.
- C: YUNEX-V4-C-Pressure-Becomes-Motion-SILENT.mp4 — 22 seconds / 660 frames. SHA-256 `38a138feea706f1e26817ddb7d2de3b6b5aefe8e964452e9f03f1c9f461ffc15`.

## Source and recovery

Native render source: `2021bc5fbcb99a7b98cebc06211680a6ac37db06`. Source fingerprint: `133e35891669ecbb2fb2f6b8a40fe3020f5be0d847546d5a0b208eaf14469a2c`.

Latest tested implementation: `a2296090e6b94ac145126bbfa137000930629497`. It adds camera clearance diagnostics and changes the side-shot default from 40° to 48°, plus tests/docs; vehicle/material/driving source remains the rendered version. This handoff commit only adds documentation and evidence.

Native workflow: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39940289918 — completed successfully. Original native B artifact: 12496547593; C: 12497151334. Original A artifact 12497016143 has the rejected 40° side lens and is NOT the corrected delivered A. Corrected A reuses seven unchanged native shots and one locally rendered 48° side shot. All eight entry/source/recipe/video contracts passed without bypass. The exact used recipe is committed at docs/modelling-kit/evidence/v4-supercar-proof-recipe.json and included in this package.

For a fresh full render, use the latest branch and the documented v4-native workflow; it now defaults to 48°. Its new source fingerprint must not be mixed with old native shards. For exact old-source recovery, check out 2021bc5 in an isolated worktree, create the supercar project with v4-proof.mjs, copy the committed evidence recipe over its recipe.json, restore native shot files and adjacent contracts, render the side-profile shot using the generic studio-v3 shot renderer, then run assemble.mjs v4-a-supercar. The v4-native convenience wrapper on 2021 enforces its older preset, so use the generic renderer for that deliberate data override. Never edit a saved contract to suppress a mismatch. Package includes exact editable projects and final per-shot contracts/reports.

## Verification and visual findings

Latest implementation: 261 Node tests passed, zero failed/skipped; five Python tests passed; TypeScript check and git diff --check passed. Commands:

```sh
node --experimental-strip-types --test tests/modelling-kit/*.test.mjs tests/world-kit/*.test.mjs tests/parts-kit/*.test.mjs
python3 -m unittest discover -s tests/modelling-kit -p 'test_*.py'
npm run check
```

Independent reviewers inspected original native decoded frame sequences: A 140 distinct timeline frames, including all 42 corrected side frames and all 42 onboard frames with clip-to-assembly hashes verified; B 56 frames; C 88 frames, including every cut and opening/closing windows. No new sampled temporal/camera blocker was found. This is not real-time playback approval or an all-frame visual review. Visual and final film approval remain pending.

The matched comparison uses native coachbuilt-versus-studio supercar orbits at the SAME source, lens, camera, paint and daylight. It crops empty background and scales panels for side-by-side presentation. It is not a matched EP005 comparison. The rejected EP005 Agent 5 artifact was inspected as a qualitative baseline only.

## Remaining work — do not declare finished

Models and scenery remain visibly procedural/stylized. Angular fascias, flat glass, dark recesses, soft tyre-contact shadows, low-poly trees and block walls need further art direction. C has a distracting diagonal background boundary in POV and busy transparent interior layering. The side profile is clear but dark. No photorealistic/professional cinematic approval is claimed.

Only three hero body architectures are substantially rebuilt; the other 33 variants retain existing construction. Not all 20 environments are polished. No new full V6/V12 mechanical overhaul, complete intercooler/filter/downstream exhaust network, calibrated tyre simulation, narration generation or natural-language understanding is claimed. Driving remains deterministic cinematic kinematics. Supplied narration and timing contracts are preserved; these proofs use no narration.

Performance snapshot (hero, no driver, default engine): supercar visible mesh submissions estimate 500→452, triangles 213696→281476; coupe 485→448 / 208909→280869; rally 497→446 / 209227→271429. These are geometry counts, not GPU timing or multipass draw-call measurements.

Next quality work should address contact-shadow appearance, fascia/glass design and scenic depth, then inspect complete moving footage and record SHA-bound visual approval before calling these production-ready.
