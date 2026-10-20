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
