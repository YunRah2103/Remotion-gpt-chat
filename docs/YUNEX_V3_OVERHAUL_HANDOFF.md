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

## Independent review corrections

Reviewer found and reproduced three issues; all corrected in a separate skip-CI checkpoint so the existing native render batch is not cancelled:
- Render input stability now hashes recipe bytes as well as shared source, preventing changed editable recipes from being packaged with old footage. Shared shot-cache identity remains unchanged.
- Dynamics validation precedes every scene mutation; invalid speed/roughness and incomplete four-height input leave wheel/body transforms untouched.
- Rough rally contact rejects motorcycles and six-wheel layouts during recipe validation with an actionable four-wheel requirement. All existing IDs still work on default flat worlds.

Exact-source 1e849c7 broad Node suite completed 201/201 pass, zero skipped. Review-correction focused suite 12/12 pass; reviewer independently reran dynamics/road/assembly 10/10 pass and found no remaining important issue in the corrections. TypeScript passed.

Native proof D: workflow39832849080 artifact12448574476, 1080x1920/30fps,180frames/6s silent, full decode,180 moving scene frames. PR checkout merge revision286b3eafa82e6e2ccf490727a6beb1e91832ed2d, PR head1e849c7; source fingerprint b4a9e63f8ae0997f34c8521fddc4e9c640e9f4fb918c0f8af96ce78394b4dc2f matches local checkpoint render. MP4 SHA256 0d5f40d5e0fdb213dbdd5d3c25b21a792f4f07396dc45b110b133d22dff6017c. Downloaded and independently decoded/inspected timeline; remains a technical mechanical demonstration, not final premium-engine geometry approval.

Focused native rally cabin proof: 90frames/3s silent, source1e849c7, same source fingerprint, SHA256 9bbfb6048ed8f56e8e4aa4ef2b7e43d6ae7b22bdd8c9f778978cf6dd0aed3079. Render stability guard passed before later correction edits. Moving frames show the whole driver/controls/cage instead of the old tight head crop. This is a focused shot, not the complete12s rally showcase. Full A/B/C/E/F films remain subject to native completion and moving review.

## Continuation: body panels, glazing and night readability

Recovered exact saved head fcf1e52. All six A–F jobs in39832849080 subsequently passed. Downloaded A/B/C/E/F, independently repeated full decode/metadata/hash/per-shot motion verification, and visually reviewed actual MP4 timeline samples. Total native footage73seconds/2190frames. These remain technical demonstrations: the night car was too dark, and body/world fidelity still needs further development. Do not call the entire studio aesthetically approved.

New shared source:
- body-panels.ts:58 real replacement skins across the36-ID catalogue, with20mm inward returns, curved surfaces and actual removed side-sheet openings. Sports, hatch, SUV, EV, pickup, van and heavy-cab representatives covered. Existing steering/cabin mounts remain canonical; panel deformation resets with body damage.
- glazing.ts:121 refined convex panes across all36 constructors. True5–6mm closed volumes rebuilt from the curved pane silhouette, eliminating non-manifold source-fan returns. Public glazingVolume helper is for convex pane silhouettes, not a general concave CAD thickener or calibrated optical simulation.
- Lighting.tsx: car-relative night key/fill positions and localized subject lighting; retain dark surroundings while making the car readable.
- proof-project.mjs: canonical proof reruns reuse exactly matching recipe input without writes; modified recipes are rejected and preserved. kit:create still refuses duplicate slugs. Fixes prior supercar comparison CI collision from the existing tracked canonical proof project.
- vehicle-quality.mjs: recipe+source stability check spans the complete proof pack. Matching proof matrix additionally covers coupe, hot-hatch and box-truck.

Verification before source checkpoint:209/209 broad Node tests, zero skipped; modelling Python5/5; TypeScript and whitespace passed. Independent review constructed all36 IDs and checked positive signed volumes for all58 replacement panels and121 panes; focused5/5 passed with no important finding. Focused geometry/camera suite9/9 and panel/proof/quality suite6/6 passed. Actual source-side opening is checked by raycasting the original body without the replacement panel; glazing edge topology is checked directly rather than trusting metadata.

Source still requires stable-checkpoint moving comparison review. Stills motivated the lighting balance; they do not establish final moving MP4 acceptance. Do not conflate the older1e849 six-film batch with this later geometry/lighting checkpoint. Remaining work includes richer Formula/rally internals, controlled rally slip/transient suspension, natural premium scenery and final all-family visual acceptance.

### Moving review completed for454af53

Two focused ordinary studio renders completed from exact source454af530e10ccb6c2e2d1c1e6a7e2a7ba9a07b86. Renderer fingerprint299cd7aa63f7232b25f530d9dc8fee37473df163aef33dc3d629202589ec9678; recipe/source-stability guards passed. Both native1080x1920/30fps, silent, full decode passed:
- quality-supercar-coachbuilt/front:60frames/2s,60 unique decoded frames, SHA256f0c5865870458c04788f109daecc448da594fc3d7f4526bbc9d4bee816f1b330.
- showcase-e-environment/street:90frames/3s,90 unique decoded frames, SHA256449a0e5ae7e6f2d913c2cdc87f77a70aa7f1e2d6fed75461e17a9b083b863f56.

Compared complete sampled timelines with matching native baseline shots: supercar legacy artifact12450511920 from39832849132; night showcase E artifact12450299270 from39832849080. Baselines are PRhead1e849c7/merge286b3eaf. Same recipe decisions, route/time ranges and frame rate; model fitting may adjust slightly to changed bounds. No frame interpolation or invented narration.

A5s side-by-side comparison reel was made from those native inputs at1080x960/30fps (each portrait input scaled equally for comparison). It is a comparison layout, not an additional claimed1080x1920 showcase. Filename:YUNEX-V3-before-after-checkpoint.mp4. Night readability is visibly improved across the moving shot. Wide-angle body differences are subtler; panel/glazing construction is verified, but finished premium hero-car quality is NOT approved yet.

The20mm panel measurement is the geometric inward return/assembly envelope, not a claim that a car door uses20mm steel sheet. The convex glazing helper is not an arbitrary CAD offset solver. Keep these modelling limits explicit in educational work.

New full native batches39840138011 (six showcases) and39840138014 (sixteen matching model proofs) remain underway. Their focus/geometry test jobs passed, but do not treat the full batches as complete until all actual MP4s have been inspected. Remaining priorities: much stronger family-specific body proportions/finish, natural scenery, richer fitted mechanics, and controlled rally slip/transient response. No merge.
