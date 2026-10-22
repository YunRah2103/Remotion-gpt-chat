# Agent 12 — isolated cinematic graphics API

Source owner: [Issue #239](https://github.com/YunRah2103/Remotion-gpt-chat/issues/239). PR target is `production/yunex-ep004-quality-v2`. No EP003, shared modelling kit, Agent5 story or Agent6 editor file changes.

## Exports

- `QualityScienceCallouts({request,cameraPose,unloadedMotion?})` accepts the actual EP004 Agent2 `StoryRequest` (real signed-gap contacts and authored motion), the same camera pose rendered for that shot, plus an **optional** low-aero motion sampled at the exact same route and time. Actual A1 geometry markers come from `projectedActualParts`; no guessed static arrows or generic kit skid pointers. An active "METAL / ROAD CONTACT" marker requires `contact.active && signedGapM <= 0 && contactIntensity01 > 0`. Racing payoff has zero HUD.
- `QualitySubtitleOverlay({words,caption,frame,fps,timingStatus,allowProvisionalPreview?})`: `words` structurally equals Agent6 `PicturePlan.words`. `caption` structurally equals `CaptionGroup` (including `endFrameExclusive`) returned by `captionAtFrame(frame,plan.captions)`. The caller supplies the **real recorded EP004 word timings**; this package does not generate them. Verified-mode status is `verified-original-ep004`. Provisional test fixtures are explicitly marked and rejected unless `allowProvisionalPreview=true`.

### Single-lane Agent6 editor adoption (illustrative integration snippet only)

```tsx
// AFTER verified original EP004 narration word alignment is supplied.
// EDITOR MUST REPLACE its existing caption JSX, never overlay both.
const caption = showCaptions ? captionAtFrame(frame, plan.captions) : null;
{showCaptions && <QualitySubtitleOverlay
  words={plan.words}
  caption={caption}
  frame={frame}
  fps={30}
  timingStatus="verified-original-ep004"
/>}
```

Retain all original `missingPicturePrerequisites(readiness)` and audio checks from the editor, and render only after manager approval. Do not import or change the editor from this branch.

## Native moving QA (not yet executed here)

```sh
npm ci
npx tsc -p production/yunex/f1_sparks_ep004/quality/tests/agent-12/tsconfig.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/quality/tests/agent-12/*.test.mjs
node production/yunex/f1_sparks_ep004/quality/previews/agent-12/render-and-verify.mjs
```

The last command should render **180f/6.0s technical** and **270f/9.0s UI** portrait H.264 clips at 1080x1920/30, fully decode the streams, ffprobe frame counts, extract f0/quarter/middle/80%/end images, and check multiple hashes. The output directory is `out/ep004-agent12`. Upload the originals (not screenshots of fake "videos") to GitHub Actions artifacts to satisfy native proof.

These previews use *physical EP004 A1 metal/plank/carbon underfloor* for projected labels and contact moments; the independent exterior racecar ending uses the actual **prebuilt V2 cinematic formula vehicle** with its internal generic sparks disabled. The authoritative A2 track contact and real A4 physical night road stay unchanged. Agent8's quality adapter must be approved before claiming perfect V2 mesh-to-skid alignment. The UI demo's subtitle fixture is **PROVISIONAL, NOT ORIGINAL-VO ALIGNED**. No original EP004 Cedar audio file or verified word indices are present in this branch.

### Creative review checklist

Inspect the first/quarter/middle/80%/last images of both files, plus exact frames when real skid `signedGapM` flips active/inactive. Confirm callout pointers land on visible physical silver skid, tan plank, dark carbon; no generic skid pointer; no contact label when signed gap positive; moving vehicle and readable night exposure; right social and bottom 326px subtitle safety; and no overlap of labels with caption lane. Reject any clips showing duplicate floor geometries or static track motion. A green TypeScript run alone is not picture approval.
