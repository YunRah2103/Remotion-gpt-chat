# Sculpted vehicle revision

This is the substantial geometry pass requested after the first detail upgrade. All 35 generic IDs and metre dimensions remain available. The 20 procedural environments, 14 props and 55 mechanical-part assemblies retain their interfaces.

## What changed

- Road vehicles use shaped body cross-sections with a narrower lower body, rounded shoulders, full wheel arches and recessed lamp/grille openings. Door paths and arch trim follow the same surface evaluator.
- Painted window apertures, rounded inner glazing, seals, fitted pillars and a curved roof replace the exposed bar construction. Glass opacity defaults to 0.55 and remains configurable; driver previews use 0.15.
- Road, split-spoke sports/SUV, turbine EV, vented steel, Formula and motorcycle wheel designs preserve the steering-pivot/rolling-wheel hierarchy. Rotors roll; calipers remain fixed to their axles.
- Formula cars receive a narrow nose, hollow cockpit, sculpted sidepods and a tapered engine cover. Bikes receive lofted tanks and seats, routed exhaust headers and a fitted shock assembly. Heavy trucks receive steel wheels, cab glazing seals, rear lighting/protection and cargo/roof hardware.
- The shared interior adds contoured seat shells and soft bolsters, a curved dashboard, instrument hood, centre stack and steering grip detail.
- Each detail path is merged into one mesh to limit draw calls. This does not merge steering or rolling assemblies.

## Verification

Run `npm run check`, `npm run worldkit:test`, `npm run partskit:test`, then the vehicle export and `scripts/world-kit/validate-glb.mjs`. Native review is `npm run worldkit:review-quality`; set `WORLD_KIT_REVIEW_OUT` to choose its output folder.

The native set includes all 35 front views, 9 rear views, 7 side views, 2 night shots, 5 cutaways, 5 driver views and 2 portrait views (65 stills). The 21-second seven-family reel uses actual model and wheel movement. Source: 1920×1080, 30fps. Review: 960×540, 12fps, 252 frames, silent H.264 yuv420p limited range BT.709.

Independent review found inward-facing pillar panels and small gaps at frame/roof junctions. Regression tests reproduced both before fixing face winding and preserving the sharp shared outer frame boundary while retaining rounded inner glass corners. Driver centre rays remain clear; catalogue IDs, root orientation and wheel hierarchy are unchanged.

These are editable illustrative models, not manufacturer-specific CAD. Existing films, media and mechanical-part source remain untouched. The unrelated legacy Chiron media dependency is outside this revision.

Verified on the final corrected geometry: TypeScript passed; 36 world-kit tests and 19 parts tests passed; all 35 GLBs exported and reloaded with wheel/rotor/caliper and interior checks. The largest counted model contains 218,728 mesh vertices; maximum mesh count is 458. The independent review's two defects both passed reproducing regression tests after correction.
