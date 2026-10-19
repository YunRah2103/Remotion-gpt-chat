# EP003 / Agent 4 — World & look package

**Asset identity:** unchanged \`highway\` created by kit \`createEnvironment\`,
unchanged \`grand-tourer\` created by kit \`createVehicle\`. The root models are
created fresh per composition; all episode material changes operate on those
instances and nothing in \`src/yunex/world-kit\` is rewritten.

## Public APIs

- \`buildEpisodeHighway()\`: original highway + episode-specific paved
  right-hand emergency refuge; moves conflict posts/lights/gantry supports;
  draws connected outer guardrail with continuous cubic easing
- \`EpisodeWorld\`: deterministic three.js world component and disposal
- \`EpisodeLight({focus})\`: inherits \`WorldLighting\` for full environment
  reflections and daylight, with a gentle directional surface fill
- \`finishGrandTourer(root)\`: modifies *one* freshly created vehicle instance
  to retain midnight slate paint #4A667E, polished coat, legible rubber,
  satin wheel finish and non-black glass
- \`EpisodeGrandTourer({dynamics})\`: consumes Agent 2's **authoritative**
  \`VehicleDynamicsFrame\` pose/distance/steer/roll/pitch; no invented motion

## Required geography for Agent 2 + Agent 3

Coordinate frame +X forward, +Y up, +Z left. Kit main road remains
z in [-7.5,+7.5], white outer line z=-7.05, original rail z=-7.8.

Episode refuge is on **right side, z negative**. Taper x=4..40; from
x>=40 to x=110 a widened pavement reaches nominal right guardrail z=-14.
Paved width beyond the original edge is 6.95m at full width, although
the stopping envelope needs more than raw pavement width. The geometry
includes a continuous protective outer rail, new posts, roadside signs
and luminaires. The old inside-right rail/post/lamp objects are suppressed
only in this episode's model; the opposite side survives.

\`fitsStoppedGrandTourer(x,z)\` conservatively checks the 4.94m × 1.94m
complete vehicle footprint with 0.55m extra lateral clearance from the
lane edge and guardrail and an x boundary between 48..101.
\`(x=74,z=-10.5)\` passes **geometric** clearance checks; this is **not**
a claim that a damaged vehicle will always reach the bay, that an approach
path is physically possible, or that it is safe in any real incident.

**Integration requirement:** Agent 2 must validate entry motion/path, tyre
loads, gradual slowing and final stopped pose; Agent 3 must frame the refuge
without inventing travel through barriers. If realistic driver/path clearance
cannot be integrated, the final safe-stop shot remains BLOCKED.

## Preview-only fixture — not real dynamics

Until Agent 2 exists, \`previews/agent-4/LookPreview.tsx\` supplies constant
27.78 m/s straight-ahead travel strictly for *moving light/material/geometry*
comparison. It NEVER depicts validated tyre failure or a full recovery.
The portrait sweeps wheel macro → moving GT hero → stationary infrastructure
refuge reveal. Source compositions are 1920×1080 @ 30 fps (150 frames)
and **1080×1920 @ 30 fps** (210 frames); optional 0.5 review scale
renders 960×540 and 540×960 respectively.

## Commands to reproduce locally with dependencies

\`\`\`bash
npm ci
npm run check
npm run worldkit:test
npm run partskit:test
npx tsc -p tests/agent-4/tsconfig.json --noEmit
node --experimental-strip-types --test tests/agent-4/*.test.mjs
bash production/yunex/tyre_blowout_ep003/previews/agent-4/render.sh
\`\`\`

The render script produces paired **moving** before/after beauty and portrait
MP4s and frame grabs; \`ffprobe\` metadata and an FFmpeg full-frame decode
run for each file. Do not claim native renders passed until outputs are actually
available and examined. Review baseline/after from identical camera frame
numbers, not from independent stills.

## Visual constraints

No time-varying procedural noise, no added vignette, no chromatic aberration,
no motion trail overlays or unrealistically black tyre. Road micro-bump is
disabled on the episode road instance to reduce temporal grain. Main kit sun
and PMREM environment remain active; extra fill is subtle rather than a
broad high-exposure grade.

**Limitations:** The emergency-refuge geometry is a bespoke *local-world*
extension and has not yet been approved by the manager. Camera safety
depends on motion/camera-agent integration. Render memory, software GL
compatibility, preview artefacts and actual visual quality require genuine
Remotion testing, not just code review.
