# V3 recovery — 22 October 2026

Continue existing PR #233 and branch feat/yunex-modelling-kit-v2. Never merge or edit EP003/EP004.

## Verified recovered baseline

Saved head: ce7316b364f96721b39100841eb386724ccf2d52. All 50 prior commits retained. The eight commits after 68cf9ef add joint tracks, fit diagnostics, complete twin-turbo film assembly, source identity, keyed model remounts, material shader invalidation, chase visibility and bounded media installation.

Exact baseline workflow runs 39777567033 (V3), 39777567001 (main kit), 39777566993 (composition review), 39777567043 and 39777566994 (production) all report success after individually retrying the two failed infrastructure jobs. Formula portrait timed out downloading FFmpeg, before rendering. KitH failed signed apt index size verification during mirror synchronization. Neither was a demonstrated source/render defect. Baseline local suite originally passed 177/177.

Downloaded artifact 12425797944: complete-silent.mp4, seven shots, editable project and contracts. Timeline review found visually disconnected isolated parts over the motorway; source now offers optional grounded inspection context. Do not confuse the baseline's decode/assembly success with cinematic approval of new source.

## Additive changes

- Catalog command accepts search text, retaining full 35-vehicle / 20-environment inventory without a query.
- Model catalogue supplies exact source-tree paths, including sibling indices, for duplicate geometry. Paths are revision-specific. Use `match:'unique'` to reject ambiguous plain names. Legacy first-name edits remain compatible but now record diagnostics.
- Optional mount `kind` / `accepts` contracts reject incompatible known plugs before reparenting. Untyped legacy mounts remain available; no engineering compatibility is claimed.
- Fit diagnostics propose parent-space uniform scaling and translation without applying it. Inspect mounting alignment and actual clearance before accepting a suggestion.
- Brief compiler accepts full private vehicle/world configurations and supplied audio/word/caption metadata, cloning them independently. Existing string IDs still work.
- Shot `context:'inspection'` grounds isolated geometry over a simple shadow-receiving studio floor; default world context remains available.
- Shot `energyFlow:'regenerate'|'drive'` animates reversible illustrative markers between an EV's actual battery/motor centres. This is not an electrical or torque simulator.
- Twin-turbo proof uses inspection context for isolated shots. New independent 12-second EV regeneration proof uses existing city-ev, a private battery variation/undertray, mountain driving, cutaway, motor inspection and clear captions. No audio was supplied or invented.
- Media installer retries bounded dependency failures, retains signed package verification and fails after exhaustion.

## Commands

```sh
npm run kit:catalog -- electric
node --experimental-strip-types scripts/modelling-kit/regeneration-demo.mjs
npm run kit:inspect -- ev-regeneration-proof
npm run kit:review -- ev-regeneration-proof --shot=generator
npm run kit:scene -- ev-regeneration-proof --shot=recover
npm run kit:scene -- ev-regeneration-proof
```

Creation refuses an existing project; edit its recipe instead of rerunning creation. Generated project folders must not be committed as shared originals. See YUNEX_V3_AGENT_GUIDE.md for unrestricted TS factories and existing rendering/source contracts.

## Recovery discipline

Commit tested source before leaving a stage. Fetch remote before a normal push. Checkpoints may use `[skip ci]` so only the final source triggers one exact-source native batch. Never claim a new video until native output is decoded and visually inspected. Any local Chrome crash is an environment limitation; use existing native Actions without lowering quality. Preserve this handoff and report exact commits/runs in PR comments.
