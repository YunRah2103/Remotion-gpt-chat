# EP005 Agent 5 — edit contract / storyboard, awaiting approved pictures

**Branch:** `agent/ep005-05-v3-editor`; **draft PR:** #253, base `production/yunex-ep005-v3-base`; manager #247 / issue #252. No merge.

> **SILENT EDITOR BLOCKOUT — NOT FINAL PICTURE.** There is no manager-approved combined Agent 1–4 footage on this branch. Its stock V3 "supercar" is NOT Agent 1's hero and the storyboard contains no Agent 2 mounted flame. Native blockout media, if rendered, cannot replace visual approval. Owner has not supplied authoritative EP005 original narration or word timings.

## Reversible visual cut mapping (A3 25.000s / 750f)

The earlier isolated Agent 5 storyboard was **26s/780f**. Agent 0 has selected Agent 3's complete **25s/750f** film as the silent baseline. This explicitly maps *every individual semantic beat*; do not trim 30 frames from the final shot or paste independent MP4s together. `timing-map.json` contains the full, reversible old/new frame mapping and immutable absolute afterfire windows.

| Edit | Exact frames [start,end) | At 30fps | Required approved visual / graphics |
|---|---|---|---|
| Hook → A3 `hook` | **0–45** | 0.0–1.5s | Actual moving hero, exposed named tailpipes, natural high-impact 3D flame in f0–29 from real A2 attached to A1. Keep centre-rear exhaust unobscured. |
| Motion → A3 `launch` | **45–165** | 1.5–5.5s | Genuine changing car/ground positions and wheel rotation; route tangent from A3 / track world from A4. |
| Engine → A3 `engine-reveal` | **165–285** | 5.5–9.5s | Correct real A1 engine/cutaway, engine-world-pose arrow and conditional unburnt fuel explanation. |
| Fuel path → A3 `mechanism` | **285–420** | 9.5–14.0s | Keep actual A1 engine/A2 pipe mechanically sensible, distinguish illustrative gas-flow markers from calibrated physics. |
| Exhaust → A3 `exhaust` | **420–555** | 14.0–18.5s | A2 nozzle-attached afterfire demand only f430–489, point to named actual pipe lip, not random 2D coordinates. |
| Payoff → A3 `payoff` | **555–750** | 18.5–25.0s | A3/A4 genuinely moving premium final chase; secondary fire only f674–709 if eligible. Powerful clean ending. |

**Science:** During particular overrun, modified fuelling/ignition or anti-lag conditions, unburnt fuel can reach a hot exhaust, where it *may* ignite. Do not imply every supercar does this; do not conflate anti-lag with ordinary overrun; animated marker tubes are illustrations, not measured fluid dynamics.

## Graphics and tracked arrows

- `src/yunex/studio-projects/ep005-a5-editor/EditorOverlay.tsx` draws motion-designed **non-spoken** editorial headings, tiny transition sweeps and 3-step indicators. Flame-hook frames 0–11 have no headline; first impact stays clear. Graphic card is outside one-phone-caption lane.
- `TrackedArrow.tsx` provides **per-frame perspective-correct** leaders from explicit actual *world-space* named mesh/mount coordinates and a camera sampled from the same absolute A3 frame. It rejects off-screen/behind-camera/bottom-caption positions. Wire only after Agent 1's `resolveEp005ExhaustPorts(hero)` and camera from Agent 3's `sampleCinema(frame)` are accepted by manager; no fake hard-coded tailpipe coordinates.
- The stock V3 editor blockout uses built-in V3 `shot.annotation` for its engine and V8 cutaways, where native 3D projection actually exists. Editorial explanation card is intentionally at 65% height for those shots to avoid overlapping these native projected arrow labels. Agent 5's independent blockout does not establish final A1/A2 geometry.
- Reserve **bottom 18%** exclusively for one subtitle lane after owner narration; use actual V3 `words` (ordered, verified word times) or one verified phrase-caption lane. Never duplicate both, invent Cedar track/words or reuse EP004 audio. Original voice unchanged.

## Integration only after explicit Agent 0 approval

Do not change `source-approval.json` from false before manager accepts *specific* improved commit SHA and matching, actually decoded MP4 SHA256 for A1, A2, A3, A4. Those visuals are separate PRs #256/#254/#257/#255. A1 physical port centres `[-2.465,.420,±.570]`m, outward local `[-1,0,0]`, nozzle bore `.085`m MUST align with A2 attached animation in actual moving f0–30 and f430–489. A3 `track` and A4 `sampleEP005Route` must be the same driving tangent and asphalt. Keep exact original source/transforms/speed and original voice.

Do not consume the three technically successful but **visually unapproved** isolated A1/A2/A4 moving proofs nor A3's current **unverified** 750f render as final. A3 GitHub run 39796121943 did encode 750 frames but its media QA failed because `ffprobe` was unavailable; asked Agent 3 to repair their workflow in #250.

## Verification

```bash
npm ci
npm run check
node --test production/yunex/supercar_flames_ep005/editor/verify-editor.test.mjs
node production/yunex/supercar_flames_ep005/editor/verify-editor.mjs
npm run kit:validate -- ep005-a5-editor
npm run kit:plan -- ep005-a5-editor
npm run kit:inspect -- ep005-a5-editor
npm run kit:render -- ep005-a5-editor
```

The unique GitHub Actions workflow `.github/workflows/yunex-ep005-a5-editor.yml` renders/validates a **750-frame 1080×1920 30fps SILENT BLOCKOUT**, with FFprobe, full decode, source/test gate, SHA256 and native opening/cut/end stills. This workflow is not an approved-source integration shortcut.

**Picture approval still requires:** (1) accepted A1–4 exact SHAs and media hashes; (2) one actual integrated MP4 with visibly attached flames and real drive; (3) FFprobe duration/fps/frame count + full decode + hash; (4) human visual inspection f0–30, all cuts ±2f and last 30f, motion continuity, clearance, phone-caption legibility and science. No final/voice lock before genuine original audio. Agent 0 remains final approver.
