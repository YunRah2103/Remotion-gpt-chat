# EP005 Agent 5 — NEW premium editor rebuild (not old V3 blockout)

## Truthful status
A dedicated replacement branch from the EXACT #247 production base. The baseline entry is a **source gate**, not a claim of finished footage. CI stages four **fixed, unmerged** upstream visual-agent commits only in the ephemeral runner and swaps in the real three.js/Remotion integrated scene. Agent 0 has NOT approved the aesthetics. Every output must be called **SILENT PICTURE REVIEW — NOT FINAL**, even if the native 750-frame MP4 passes technical QA.

## Actual picture cut plan @ 30fps (25 seconds)
| Beat | Frames [start,end) | Intent |
|---|---|---|
| Real nozzle afterfire hook | 0–45 | f0–11 car/flames uncluttered; f12–44 story opener. Flame demand only f0–29 |
| Accelerating car reveal | 45–165 | Real driven hero, wheel/road motion; minimal conditional qualifier |
| Engine | 165–285 | Distinguish unburnt fuel possibility, never assert all cars |
| Mechanical path | 285–420 | Conditional unburnt fuel + hot gases. Illustrative only, no CFD claim |
| True exhaust ignition | 420–555 | flame demand f430–489, tracked `mount:exhaust-tip-left` callout only if optically visible and safely on screen |
| Moving finale | 555–750 | Accelerating cinematic chase, afterfire demand f674–709, finish emphatically without freeze |

Agent 3's `sampleCinema(f)` drives camera, wheels, route and combustion requests. Agent 4's identical `sampleEP005Route` world is used for every frame. Agent 1's actual moving tailpipe named-node world transform is evaluated for the overlay; Agent 2's actual physically attached flame rig follows matching ports in Three.js. NO sprite fire overlay, no generic V3 blockout used as finished car.

## Caption and audio integrity
The one lower-safe subtitle lane is **completely blank** until the real EP005 narration and timestamps are supplied and verified. Do not copy EP004 Cedar, infer spoken timestamps or publish UI explanation text as verbatim captions. The `PremiumOverlay` accepts only external verified word/caption segments when `originalAudioVerified` is true; native review sets it false.

## Source approval to production
`review-sources.json` pins tested moving candidate SHA inputs but marks them **approved:false**. Do not flip any boolean on render success. Agent 0 must independently review the native video at actual playback and high-resolution frames, then explicitly document author/commit/video SHA256 approvals in #247. Latest PR #233 may have a newer unmerged V3 head, but this source is pinned to #247's exact kit ancestor and separate EP005 integration base to avoid a silent kit migration.

## QA
Dedicated `.github/workflows/yunex-ep005-a5-premium.yml`: native FFprobe/full decode/frame hashes/contact sheet/artifact (no fake video URL before it exists). It does not by itself imply subjective aesthetic success. Requires playback review for 0–29f fire, engine/exhaust story readability, cut±2f, 674–749f payoff, tracked label clipping, brightness, text motion and physical mounts. If not visually convincing return to original agents rather than mark this candidate final. EP003/EP004/PR233/production base remain untouched. **No merge.**
