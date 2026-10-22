# Vehicle quality and rally recovery checkpoint

Continue PR #233 / feat/yunex-modelling-kit-v2. User specifically requested significantly better car models and a reusable rally car. Preserve EP003/EP004 and do not merge.

Previous verified code source: e27aacb2652fc2da0ca8031049216b2c33abe7ba. V3 run 39811512559 passed all 22 jobs and delivered native 12-second EV and 25-second turbo silent films; exact artifact hashes are in the latest PR comments. These older films precede the new body-quality pass.

New source files:
- coachbuilt.ts: compound panel deformation with protected arch envelopes, tessellated glazing, optical lenses and rounded mirror caps; shaped Formula engine cover, halo and cooling gills.
- rally.ts: original widebody rally hatch hardware, cage, supported lamp bar, roof intake, multi-spoke wheels and rolling gravel tread.
- vehicle-quality.ts and vehicle-quality.mjs: normal studio projects with identical cameras/motion for old/new variants. No separate replacement renderer.
- yunex-vehicle-quality.yml: ten actual six-second 1080x1920/30fps comparisons and rally driving/cabin proofs, with existing full decode and still-versus-sequential-frame gates.

Added rally-hatch as the 36th ID. Explicit regression preserves all original 35 IDs. Expanded ground-contact test now covers 720 (36x20) combinations; no combinations were removed. World GLB count updated to 36. Hero bodyDetail:'legacy' reconstructs the previous finish for comparison; default 'coachbuilt' improves current hero models. Retro/boxy utility silhouettes and lightweight source remain intentional.

Do not claim aesthetic approval until native moving outputs have been downloaded and inspected. Model source and focused geometry tests are implemented; the latest broad exact-source suite and native comparison verification status must be checked in PR comments/workflows. Future revisions should address observed mesh/clearance or appearance defects, not merely inflate polygon counts.

## Moving-output review follow-up

Reviewed native 5143a997 supercar legacy/coachbuilt comparisons, rally driving/cabin and Formula previews. The first supercar surface-only improvement was too subtle. Follow-up source adds genuine recessed corner air ducts with paint rims, backing and metal vanes, a swept front blade and sports bonnet louvres. New actual-visible-mesh camera fitting uses transformed geometry bounds including every instanced tyre tread, improving portrait framing while keeping an explicit safe area. Named existing body surfaces, wheel pivots and mounts remain intact.

Focused geometry/framing/premium tests: 21 passed, TypeScript passed. Native outputs from 5143a997 predate this follow-up and must not be advertised as final fascia/camera verification. Rally cabin proof remains a technical preview: driver figure and onboard composition need further visual polish.
