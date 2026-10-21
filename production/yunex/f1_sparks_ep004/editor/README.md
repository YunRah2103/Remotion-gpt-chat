# Agent 6 — EP004 original-VO picture-edit system

Status: **EDIT TOOLING PREPARED — FILM NOT RENDERABLE YET**.

Only files in `editor/**` and `tests/agent-6/**` belong to this early Agent 6 handoff. No EP003 files, world-kit sources, or specialist visual exports have been modified.

## What is real now

- `timing.ts` validates original-recording duration and time-coded individual words, then computes one deterministic 30fps, 1080×1920 six-shot edit. Scene 1 begins on **frame 0**; all remaining scene edges are derived from actual beginning times of user-supplied words, with no pre-recording guesses.
- Six ordered beats: spark hook → rear mystery → underfloor reveal → aero load → contact macro → racing payoff. No user-visible logo outro.
- Captions are word-linked, grouped into <=3 words, mostly <=24 characters, centered no closer than **300 px from portrait bottom**.
- `PictureEdit.tsx` creates a Remotion compositor factory that requires a real integrated visual shot component. It overlays authentic original-voice audio + word-synchronised captions, preserving frame-time determinism.
- `missingPicturePrerequisites()` verifies all 5 agent approvals, a real integrated SHA, six moving scenes, original voice recording, and actual verified word timing. A diagnostic-only render must **never** be passed off as a finished movie.

## Required input & integration

Agent 0 must first accept real two-preview MP4s and merge all five module exports into the EP004 base branch. Agent 6 then receives:
1. Exact integrated EP004 commit + approved visual exports (Agents 1–5).
2. Original British male narration audio file, actual ffprobe-measured duration, final transcript and validated timestamps per *spoken* word. **The EP003 Cedar narration is not EP004 narration.**
3. Explicit semantic `WordLinkedCut` indices for all six beats, matched to transcript meaning (not arbitrary fixed times). If narration changes, rerun plan; do not manually stretch individual scenes without checking the spoken word sync.
4. A real `IntegratedVisualShot` React component consuming `VisualShotProps` from `PictureEdit.tsx`, using Agent 2 authoritative absolute-time dynamics, Agent 1 hero/skids, Agent 3 cameras, Agent 4 circuit, Agent 5 semantic graphics.

Use `buildPicturePlan({audioSrc, audioDurationSec, words, cuts})`, then register the result with `makeEP004PictureEdit(IntegratedVisualShot)` in an **EP004-only** composition entry. Its props **must include `readiness`** with the five approved agents, integrated SHA, six actual moving scenes, original VO and word timing all verified: the picture component itself throws if any prerequisite is missing. Pass an asset URL for `audioSrc` (e.g. Remotion `staticFile('ep004/original.wav')` when located under `public/`). Its duration must equal `plan.totalFrames` and its dimensions/fps must be 1080×1920 @30. No `src/Root.tsx` modification needed.

## Tests (after Node/npm workspace available)

```bash
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-6/timing.test.mjs
npm run check
```

Final render (ONLY AFTER approved integration and recorded VO):
```bash
npx remotion render production/yunex/f1_sparks_ep004/entry.tsx EP004PictureWithOriginalVO out/ep004/EP004-picture-VO.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,avg_frame_rate,nb_read_frames out/ep004/EP004-picture-VO.mp4
ffmpeg -v error -xerror -i out/ep004/EP004-picture-VO.mp4 -f null -
```
Confirm original speech is clear and synchronized, visual frames at every six-cut boundary actually move, no cropped subtitles or clipped wheels, and the payoff holds visual geography with a controlled ending. Only then open picture approval review for Agent 0 and the owner. Agent 7 must not alter picture or voice afterward.

**NOT YET PERFORMED:** no final EP004 MP4, no visual inspection, no ffprobe/full-decode; cannot claim picture review-ready until dependencies are met.

## Verified native-delivery tooling added 20 Oct
- `editor/native-qa.mjs` verifies a **real moving MP4**: playable file, `ffprobe -count_frames` 1080×1920/30 exact expected frames, original-voice audio stream present, full decode with `ffmpeg -xerror`, >=2 different decoded pixel hashes from 1fps samples, and PNGs for start/mid/end. Emits `native-report.json`, explicitly noting that visual/audio HUMAN sign-off remains pending.
- `editor/render-native.mjs` is a **fail-closed** 2-output native Remotion renderer. It refuses to start without a checked recorded-VO manifest, original audio file, approved integration entry and five approved agents. It measures actual recording duration using ffprobe, validates word-linked six-cut EDL and writes exactly two variants once real prerequisites exist: `EP004PictureWithOriginalVO` (with phone-safe captions) and `EP004CleanWithOriginalVO` (clean frame, same original voice). Both go through the full MP4 audit; placeholders and EP003 audio are rejected.
- `tests/agent-6/native-qa.test.mjs` covers frame-count / portrait / fps / audio-stream / decoded hash error gates without claiming a scene render.
- No unsigned fake manifest, synthetic original voice, or mock hero scene was added. The future manager-owned `entry.tsx` must register these two actual integration compositions from accepted Agents 1–5.

**After Agent 0 provides fully approved integrated visuals and actual EP004 voice**, create a local manifest with:
```json
{
  "originalRecordedAudioFile": "/absolute/path/to/original-ep004-voice.wav",
  "entryFile": "/absolute/path/to/integrated-ep004/entry.tsx",
  "outputDir": "out/ep004-editor",
  "readiness": {
    "approvedAgents": [1, 2, 3, 4, 5],
    "integrationCommitSha": "40-character-real-integration-SHA",
    "allSixMovingScenesIntegrated": true,
    "originalRecordedNarrationPresent": true,
    "wordTimestampsVerifiedAgainstRecording": true
  },
  "plan": {
    "audioSrc": "actual-remotion-served-original-EP004-audio-url",
    "audioDurationSec": 0,
    "words": [],
    "cuts": []
  }
}
```
Here `0` and empty arrays are **deliberate invalid placeholders**; replace exclusively with measured recording duration, real per-word timestamps, and semantic cut-word indices. The script throws rather than rendering until all information is genuine.

```bash
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-6/*.test.mjs
node --experimental-strip-types production/yunex/f1_sparks_ep004/editor/render-native.mjs /path/to/approved-ep004-edit.json
```

**Current outcome:** editor source and tests are committed; no original EP004 voice, accepted integrated live scene or native editor pair yet, so **no final editor MP4 verification or picture lock can honestly be declared.**

## Editor-specific type-check (not covered by root tsconfig)
```bash
npx tsc -p production/yunex/f1_sparks_ep004/editor/tsconfig.json
```
Root `npm run check` checks `src/**` only and is **not** evidence this editor-local TypeScript was compiled. Agent 0 should add this command plus `tests/agent-6/*.test.mjs` to its editor acceptance gate after the two native deliverables are permitted.

## 20 October Agent 6 render reliability update

- The Agent 6 branch has been safely synchronized with latest manager EP004 base via a non-force two-parent merge commit, preserving every `editor/**` and `tests/agent-6/**` blob and importing only manager-owned CI/status changes. Main and EP003 remain untouched.
- The final two outputs are **not allowed to pass** on a changing opening alone: the native verifier now samples three actual decoded frames **inside EACH of six contiguous shots** for every output and rejects static/duplicate beats. Each editorial beat must occupy at least 18 frames (0.6s); no black placeholder or near-zero-duration transition silently passes. Captions and clean variants receive separate full QA reports.
- Video-only `-map 0:v:0` is mandatory before `framemd5`. Without it, voice/audio packets could cause false-positive movement.
- A source MP4 or synthetic verifier test is **not** a finished Agent 6 film. Final editor A+B MP4s still need approved integrated hero/physics/cinema/look/story plus **actual recorded original EP004 voiceover and word timings**. No default synthetic voice, no EP003 Cedar reuse.

## V2 cinematic picture-edit safeguards — after master #215 latest integrations

**Approved source dependency:** Agent 0 has merged actual Agent 1 vehicle+metal skids, Agent 2 contact-born 100Hz spark physics, and Agent 4 matching night road. Agents 3 and 5 are still under creative corrections. Voice recording and real word timestamps are **not yet provided**.

### Make frame zero spectacular without faking physics
`editor/contact-hook.ts` scans **actual integrated vehicle/road/skid physics** to discover the strongest verified metal-on-road contact/spark moment (no decorative spawn event or user-selected false spark timestamp). It returns a source-time cue. The EDL accepts optional `sourceStartSec` on the first `spark-hook` cut. From video frame 0 the injected `IntegratedVisualShot` receives `sourceSec` corresponding to that genuine contact. At the second cut, authoritative source time returns to continuous narration/world time unless a separately reviewed anchor is supplied. This creates an honest cold-open flash-forward (real contact, nonchronological cinematic edit), not physics manipulation or a false science explanation. The manager-injected scene must sample its car, road, and particles at `sourceSec`, **not** at voice `globalSec`; the latter remains the actual word-aligned narration clock. Strict final-run preflight refuses render if opening source time is omitted or doesn't have currently real metal-contact particle evidence. Cinematic visibility at frame 0 still requires **human shot review**, and the Agent 3/5 camera/story must visually reveal the spark rather than hide it.

For deriving the truthful event in Node after source integration:
```bash
node --experimental-strip-types --input-type=module -e "import {findAuthenticSparkMoment} from './production/yunex/f1_sparks_ep004/editor/contact-hook.ts'; console.log(findAuthenticSparkMoment({endSec:12}))"
```

### Preserve original British male narrator in both actual MP4 exports
`editor/audio-qa.mjs` now decodes the **real encoded final MP4 audio** and the independently provided approved original EP004 speech recording into 8 kHz mono PCM, calculates 80ms RMS speech envelopes and verifies the time-zero correlation (>=0.82), no relative voice level loss below 0.65 or excessive boost above 1.4, no material speech offset, no silence and no time-length truncation. It is wired into `render-native.mjs` for **BOTH** captioned and clean variants. An arbitrary replacement narrator or desynchronized audio cannot be waved through merely because `ffprobe` sees an AAC track. Background music belongs to Agent 7 **after picture lock**; this correlation check covers Agent 6's original-VO picture versions before any later final mix. Audio comparison is a quantitative signal check, not a substitute for human listening.

Run all new targeted tests in the manager-controlled editor workflow:
```bash
npx tsc -p production/yunex/f1_sparks_ep004/editor/tsconfig.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-6/*.test.mjs
```

**No new playable Agent 6 final MP4 or true narrator is supplied by these improvements.** All original-VO gate conditions still apply; do not merge the editor film as complete without accepted Agents 3+5, integrated `entry.tsx`, recorded EP004 voice, verified word timings and actual MP4/full-frame/audio/visual proofs.

## 21 October — Agent 5 merged, Agent 3 six-shot handoff **prepared**

Source synchronization: manager-accepted Agent 5 [PR #224](https://github.com/YunRah2103/Remotion-gpt-chat/pull/224) (merge `6215ff09`) is present in this branch, alongside the previously approved actual car, skid, physics and night road. Guarded, two-parent sync merge `55d21808` copied manager base with no EP003/main/Agent 3 changes.

**Editorial orchestration rule:** Agent 6 `buildPicturePlan` (cuts derived from **measured original VO words**) controls global movie duration and shot boundaries. Do **not** insert Agent 5 `DEFAULT_BEATS`, `StorySequence` fixture timecodes, `HOOK_STORY_CAPTIONS`, `MIDDLE_STORY_CAPTIONS` or Agent 5's preview cinematography into the final VO film: those are artist/story guides, **not** the original recording. The adapter consumes the **approved** story semantics instead:

- `editor/story-request.ts:buildRealStoryRequest(props)`: uses `sourceSec` to sample current approved Agent 1 skid descriptors + Agent 2 `sampleDynamics/sampleContactDrivenSparks` + Agent 4 matched asphalt and returns an actual `StoryRequest`. It never synthesizes an independent route or particle.
- `editor/story-bridge.tsx:makeApprovedStoryVisualShot(renderApprovedCameraShot,projectApprovedMetalSkid?)`: renders real Agent 5 `getStoryVisualCue` and physics-grounded `StoryOverlay` labels around a **required, externally manager-approved Agent 3 camera renderer**. Only shows a METAL SKID label when the real plate has a valid projected screen anchor. It sends `showCaptions={false}` to Agent 5 to avoid duplicating actual burned-in word subtitles.
- `editor/PictureEdit.tsx`: owns the **one authoritative** word-highlighted subtitle track and original audio at full level. Layout now consumes Agent 5's `captionSizing` (portrait minimum 326px bottom reserve, 9% width gutter), with existing extra max-width constraints retained.
- `editor/camera-handoff.ts:deriveCameraHandoff(plan)`: declares exactly six cut positions, frame counts and voice/source second ranges **only after actual original word timestamps are verified**. It exposes per-cut `incomingCut` and `incomingBlendFrames`: ~0.18s handle maximum, further clamped to both adjacent shots; a spark-contact flash-forward into earlier physical story time has `incomingCut:'hard-time-jump'` and 0 blend. No arbitrary route restart or optical crossfade across incompatible physics instants. Each scene requires at least 18 actual frames (0.6 seconds) for full cinematic/motion QA.

**Agent 3 final camera integration handoff (still awaiting #218 approval):**
```tsx
import {makeEP004PictureEdit} from './editor/PictureEdit';
import {makeApprovedStoryVisualShot} from './editor/story-bridge';
import {deriveCameraHandoff} from './editor/camera-handoff';

// AFTER manager accepts Agent 3 and creates a genuine renderer:
const IntegratedVisualShot=makeApprovedStoryVisualShot(
  ({request,cue,voiceSec})=>/* real Agent 3 camera, A1 car, A4 road,
    A2 contact-born particles, cue.sectionReveal01 and real perspective */,
  (request)=>/* actual metal skid projected with approved camera pose, or undefined */
);
const PictureWithCaptions=makeEP004PictureEdit(IntegratedVisualShot);
// Clean and captioned compositions use the identical component, original VO
// and audio-derived frame count. Set showCaptions per actual render props.
// deriveCameraHandoff(plan) gives the source/exact frame cut seam contract.
```
The snippets above are **interface descriptions, not usable fabricated footage**. Manager must supply actual Agent 3 approved camera exports and register real Remotion compositions. Preview rigs, static fallback meshes and a mock recording are forbidden.

**Original audio requirement — NOT PRESENT:** a genuinely recorded EP004 British-male voice `.wav`/`.mp3` file, an addressable Remotion audio URL to that very same recording, `ffprobe`-measured duration, every spoken word's actual `startSec` / `endSec`, and six semantic source-word cut indices (opening index 0). No fallback to EP003 Cedar, arbitrary generated narrator, invented word timings, or Agent 5 preview sample text. Audio output in both finished MP4s is individually PCM envelope-compared to the original supplied recording, then listened to by a reviewer.

**Source-handle limits:** camera/scene clips only borrow <= 0.18 seconds when corresponding physical source times are continuous across cuts and both shot intervals accommodate that handle; never take frames from negative time, after recorded VO end or across an unapproved camera time jump. Visual/temporal proof still requires 1080x1920/30fps full-decoded moving pixels in each six-shot interval of **both** real final MP4s. This plan is source-only preparation, NOT an approved picture render.
