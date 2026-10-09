# Agent D — implementation and provisional QA report
## Deliverable status

**GRAPHICS READY FOR MASTER INTEGRATION. INTEGRATED FILM: QA PENDING.**
Agent D only owns typography, part labels, and review tooling. No full car model or film edits; no changes to Agent A/B/C or Master-owned files.

## Implementation

- \`src/brakes001/graphics/index.tsx\`: exported \`TitleOverlays\`, \`PartLabels\`, \`activeGraphicsAt\`, types for projected mechanical anchors; frame-deterministic Remotion JSX and transparent, noninteractive overlay.
- \`src/brakes001/graphics/graphics-cues.json\`: eight graphic cues, eight animated part labels; all five named mechanical parts and illustrative thermal caveat. 750-frame timeline and portrait-safe layout.
- Engineering review rubric and reproducible Python QA; local JSX render-path smoke test.
- SVG layout proofs at frames **48,168,321,531,705** from cue plan. Placeholder annulus is clearly marked as a schematic—not Agent A's GLB or native footage.

## Executed tests / known limitations

1. \`python3 production/videos/carbon-ceramic-001/qa/check_graphics.py\` → **PASS**: 750-frame cue layout, safe zones, label collisions, allowed object names, qualitative disclaimer.
2. \`node production/videos/carbon-ceramic-001/qa/component_smoke.cjs\` using installed TypeScript with stubbed React/Remotion hooks → **PASS**: 750 render-path evaluations, **1,216** cue render instances, frame-321 illustrative label. The rendered code is actual Agent D JSX; hooks are mocked.
3. TSX transpile syntax → **PASS** (TypeScript 5.x, CommonJS mock harness).
4. SVG proof review → **layout proof generated**, portrait framing and disclaimer checked. Proof is not independent review of the real GLB, thermal rig, or full native movie.
5. Full \`npm run check\`, native Remotion render, 750-frame full-film decode, and actual engineering video review → **NOT RUN** in this session; repository dependencies and integrated Master composition not available in the offline scratch runtime.

## Master integration

In \`src/brakes001/CarbonCeramic001.tsx\` (Master-owned), place \`<TitleOverlays />\` and \`<PartLabels />\` on top of 3D content. The components read \`useCurrentFrame\` themselves and adapt from the design canvas 1080×1920. Default \`showLeaderLines=false\` avoids guessing which visible component an arrow addresses; optional \`anchors\` are normalised screen-space part positions, and must be verified from actual camera shots before turning leaders on.

Master should review model overlap in frames 168/321/705 and adjust only Agent D-owned graphics via coordination if labels conflict. Re-run the exact checks and render with the full native composition. **Do not treat this handoff as approval of the final film.**

## Final engineering sign-off gates

See \`REVIEW_RUBRIC.md\`: rotating disc and hat vs stationary caliper; two opposing pads; friction-based heat limited to contact band; cooling after release; automotive carbon-ceramic rather than racing carbon-carbon; restrained minimal car outline; correct safe zones, no unsupported exact temperatures or stopping distances; 750 full decoded frames; review target stills and the actual moving ranges 135–195 and 300–360.

**Overall provisional result: implementation ready; film review PENDING.**
