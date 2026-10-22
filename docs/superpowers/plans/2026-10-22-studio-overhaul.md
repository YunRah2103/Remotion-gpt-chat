# Complete automotive studio quality overhaul

User-directed continuation of PR233, branch feat/yunex-modelling-kit-v2, recovered at 58d3d7c. Implement inline in meaningful checkpoints; no merge, force push, episode modifications or resets.

## Recovery
- [x] Recover complete branch and inspect all 54 commit subjects and file changes.
- [x] Read V3 agent, recovery, model quality and studio documentation; inspect current rig, authoring, cabin, mechanics and render contracts.
- [x] Verify requested exact-source runs: model 39821382610, V3 39821382956, modelling 39821382709 succeeded; world 39821383037 cancelled.
- [ ] Download and visually review current model artifacts; render success alone is not aesthetic approval.

## Stage 1: reusable dynamics
Keep createCinematicVehicle/animateCinematicVehicle and existing scene/assembly contracts. Add optional speed, acceleration, curvature and roughness inputs; absent inputs preserve old poses. Derive bounded quasi-static roll/pitch per class, Ackermann steering and wheel terrain heights from a deterministic distance field. Integrate canonical route curvature and grade in StudioEpisode. Do not enable roughness on worlds until the road mesh samples the same height field.
- [x] Write and observe failing tests for class response, signed steering, repeatable wheel heights and reversible rig integration.
- [ ] Implement controller, transformed suspension endpoints and mechanical connections.
- [ ] Run focused rig, occupant, driving tests and TypeScript, then checkpoint.
- [ ] Render matched moving native comparisons and inspect suspension/road contact.

## Subsequent stages
1. Geometry: deepen representative family bodies and rally hardware with real surfaces, preserve 36 IDs and named anchors; focused topology/clearance tests plus moving comparisons.
2. Cabin/mechanics: fitted reusable controls, occupants and articulated internals; preserve supplied narration and existing rigs.
3. Worlds: shared height-field road/terrain detail and better lighting, retain 20 IDs and camera clear corridors.
4. Authoring/studio: extend current APIs and commands with practical examples and validation; preserve five isolated project workflow.
5. Showcase: six editable native 1080x1920/30fps demonstrations (supercar, rally, Formula, mechanics, environment, complete 20–30s film). Decode/count/hash actual MP4s, inspect motion and publish exact-source evidence.

Automated tests, successful rendering and subjective visual approval have independent statuses. No stage is approved by a plan or source existence alone.
