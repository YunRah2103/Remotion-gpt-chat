# Complete automotive studio overhaul — staged continuation

Original recovery source: 58d3d7c76d2389ec3765212358d200295d22ad0e, all 54 PR233 commits preserved. Same branch feat/yunex-modelling-kit-v2; no merge, force push or EP003/EP004/active EP005 edits.

## Recovered evidence

Requested exact-source model 39821382610, V3 39821382956, main modelling kit 39821382709 succeeded. World 39821383037 was cancelled, not passed. Latest rally cabin artifact 12445363019 was downloaded and reviewed; mannequin/cockpit presentation was still technical and required improvement. Existing source/camera/assembly contracts retained.

## Saved first implementation

Checkpoint e376300fe55235d563b16a48b8b1d9a4638ee233: class-specific bounded roll/pitch, Ackermann steering, canonical route-grade alignment and suspension/driveshaft endpoints following full body rotation. Broad Node suite 195/195 passed before an additional shaft test; focused dynamics subsequently 5/5 passed. This is visual kinematics, not calibrated physics.

## Next implemented checkpoint

- Rally real bonnet openings/recessed blades, shaped sump guard/fasteners and routed exhaust/tip.
- Motorsport clothing and curved helmets for rally/Formula occupants; existing hand/pedal rigs unchanged.
- Opt-in actual subdivided rough rally road, gravel particles aligned to its height, and the same field sampled at actual wheel hardpoints. No random time-based wheel shaking. All 20 world IDs and 36 vehicle IDs preserved.
- Six independent editable showcase recipes, including the existing 25-second silent twin-turbo educational film. Uses ordinary studio projects and original renderer.
- Render progress logging and rejection of source mutation during rendering; exact source/version and separate QA states in generated handoffs.
- Native six-showcase workflow and independent complete-media verifier.

Broad Node suite: 199/199 pass, zero skipped for dynamics/rally/rough-road source. New showcase and CLI focused suite: 3/3 pass after studio changes. TypeScript and Python checks must be recorded from final command output; later edits require relevant checks again.

## Visual evidence discipline

The local six-second supercar MP4 was rendered during ongoing source work, decoded/visually sampled as an exploratory preview only. It is NOT the final exact-source overhaul proof; its wrapper fingerprint was recorded after other files changed. Do not promote it as the final revision. Final new renders must start after committing source and must pass the new source-stability guard.

Native showcase workflow uses 1080x1920/30fps, six actual editable projects, full decode, exact duration/frame count and per-shot scene-motion hashing. Successful CI remains distinct from moving visual approval. Do not describe queued or existing recipe files as completed films.

## Still required before calling the whole overhaul finished

- Inspect new moving rally/Formula/cabin outputs and resolve geometry, helmet/cage, road-contact or framing defects.
- Finish significant representative geometry improvements across sports/hatch/SUV/EV/truck families; current shared dynamics apply across families but are not an all-family geometry overhaul.
- Develop controlled rally slip and transient suspension response; current controller provides bounded quasi-static weight transfer and exact terrain inputs.
- Broaden interior, mechanical fit and world presentation improvements from observed moving footage.
- Render and inspect all six final native demonstrations and matched before/after MP4s, attach exact source and technical reports, update PR progress. No unverified visual approval.

Cabin follow-up: `cabinInspectionCamera` now fits actual driver/steering/pedal bounds with explicit portrait safe margins. Default cutaway cabin shots use it; existing onboard mounts remain unchanged. Focused test checks complete occupant framing rather than accepting head-only views.
