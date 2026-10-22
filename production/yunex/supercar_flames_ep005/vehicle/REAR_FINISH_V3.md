# Agent 1 — EP005 integrated rear surface and taillight finishing, v3

Owner feedback: supercar model has improved substantially but the surfaces, particularly the rear lamps, still look bolted together.

This change is **not a new vehicle**, and does not modify Agent 2/A3/A4/A5 sources or shared kit. `rear-finish.ts` replaces stock V3 rear rectangular lamp buckets/lenses, recipe rectangles, and coachbuilt boomerang LED tubes with just **two matched smoothly curved smoked assemblies**. Each side has a flush dark housing, a subtly crowned continuous lens, and one narrow diffused LED ribbon; all are parented to the live V3 `body-shell`. Lens surfaces have 48 longitudinal spans and taper at the ends. No giant raised tail lamp props or neon arc tubes.

The port contract remains **version 2**, `mount:exhaust-tip-left/right` at body-local `[-2.380, .420, ±.570]`, outward `[-1,0,0]`, inner radius 0.044m / outer radius 0.058m (88mm bore / 116mm OD). Rear finishing explicitly captures/validates the live port parent and local pose before/after. Wheel rig, steering, driver, cutaway and articulated aero untouched.

**Visual acceptance still required:** exact-source 1080×1920 moving MP4, full decode/SHA, f0/15/29 rear and f95 side compared to predecessor; physically flush tail lights with even left/right visual proportions, minimal hotspots, no obstructed exhausts or dangling rectangular trim. Do not declare premium picture lock solely on green CI. No merge.
