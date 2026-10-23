# EP005 — NEW Agent 8 master editor

**STATUS: SOURCE ONLY / NATIVE FILM BLOCKED — not owner-approved video.** Issue #267, master #247. Independent branch agent/ep005-08-master-editor based on production/yunex-ep005-v3-base. No merges.

**Owner hero design lock (23 October):** approved exterior is exactly `v4-a-supercar` / `supercar + bodyDetail:studio + #18636b`, source `9052a539e10a7cb97487c1435455bb9962ad58e1`, genuine 420-frame preview MP4 SHA256 `1654a5efd3a3403871b0a52a3140a9e7aeb1222a2e4bd4242e6edaa8d879cd88` from [Actions run 39866437063, artifact 12465297894](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39866437063/artifacts/12465297894). Exact approval: [owner comment in #267](https://github.com/YunRah2103/Remotion-gpt-chat/issues/267#issuecomment-6355060737). **Scope is exterior look ONLY.** The proof's generated `src/yunex/studio-projects/v4-a-supercar/recipe.json` is in that workflow's `editable-project` artifact, *not* a tracked Git file at source commit. Reference source is separate from any still-undelivered episode footage. The manifest enforces this exterior reference for ALL car-bearing clips, with a separate original source SHA, explicit shot approval and new V4-native live exhaust ports. Spectral A, unrendered CarConcept B and old EP005 A1–A5 sources remain prohibited.

This branch deliberately imports NONE of the rejected A1–A5 footage, PRs #260–264, or a stock V3 car as finished footage. It prepares an approval-locked finishing workflow for NEW Agent 6 (#265) and NEW Agent 7 (#266).

## Native 25-second editorial timeline (750 frames, 30fps)

| Absolute frames [start,end) | Seconds | Shot intent and required agent |
| --- | --- | --- |
| 0–45 | 0.0–1.5 | BOTH: actual moving new hero, attached bright transient exhaust flames visible immediately (no intro black) |
| 45–165 | 1.5–5.5 | Agent 6: authentic beautiful fast moving car, wheel rotation and parallax |
| 165–285 | 5.5–9.5 | Agent 7: credible 3D combustion engine and condition-specific unburned fuel |
| 285–420 | 9.5–14.0 | Agent 7: genuine manifold/catalyst/exhaust route, hot gases and oxygen |
| 420–555 | 14.0–18.5 | BOTH: trace short afterfire from recessed actual outlet, not a persistent torch |
| 555–675 | 18.5–22.5 | Agent 6: polished driving and myth correction (not every stock supercar flames) |
| 675–750 | 22.5–25.0 | BOTH: cinematic moving rear/side twin-flame payoff, clean final frame |

Source edits, lengths and narration must be changed explicitly if approved narration requires a different cut: never trim authentic voice to pretend alignment. Visual headline labels are intentionally non-spoken and absent from the flame hook. Spoken subtitles require actual approved timecodes. Bottom caption lane remains phone-safe.

## Hand-off contract — Agents 6 and 7

For every beat in edit-manifest.json provide a real portrait 1080x1920/30fps source clip and the fields:

- media.path: exact unpacked path under out/ep005-agent8-sources/
- media.sha256: exact MP4 checksum, never workflow ZIP or representative still
- media.sourceCommit: exact 40-hex source commit that generated this MP4
- media.approvalRef: actual owner/manager issue comment approving that source+hash
- media.artifactRunId and media.artifactName: original GitHub Actions run ID and artifact name containing the media
- media.sourceInFrame: source-inclusive absolute trim start, with enough source frames
- media.assetProvenance: complete 3D asset or purchased-media provenance/license
- media.approved: true ONLY after confirmed explicit approval
- for vehicle and integrated shots, media.approvedHeroSourceCommit must equal `9052a539e10a7cb97487c1435455bb9962ad58e1` AND media.approvedHeroReferenceProject must equal `v4-a-supercar`; these are appearance lineage, not fabricated camera-shot approval

For role "integrated" scenes, Agent 7 must supply actual car+fire visual rendered on Agent 6 moving car and its REAL local/world exhaust port transforms. Store full 40-hex agent6Commit and agent7Commit, new `v4-*` version (NEVER candidate A), plus 64-hex portManifestSha256 from the actual exhaust interface manifest. No separate post-production 2D flare at guessed screen coordinates. For a reusable all-film 750-frame source clip, repeat the exact file hash and change each beat sourceInFrame, but only after genuinely verifying ALL its shots.

Accepted clips must visibly show the vehicle; no pitch-black start, smooth but clearly moving driving, a credible 3D engine and pipes, flame/light reacting to nozzles, clean restrained tail lights and bodywork. Old A1–A5 rejected proofs are NOT approved regardless of CI.

## Voiceover and sound contract

Only use approved, existing narration unchanged. Supply voice.path, voice.sha256, voice.sourceCommit, voice.approvalRef, voice.approved=true and voice.captionsVerified=true. Captions are authentic short phrases with verified integer frame start and end; no inferred word timestamps. Separate music, engine/road/afterfire SFX stems may be supplied in optionalAudioBeds with explicit provenance, checksum, startFrame and gainDb at or below -10 dB under narration. Output H264 and AAC 48k.

If no VO is approved, renderer names output EP005-SILENT-PICTURE-REVIEW.mp4 with **no audio stream** and a small transparent factual review label, never calling it finished audio. Without approved Agent 6+7 visuals, it refuses to render even that silent review.

## Commands

Run at repo root:

    npm ci
    npm run check
    node --test production/yunex/supercar_flames_ep005/agent8/master-editor.test.mjs
    node production/yunex/supercar_flames_ep005/agent8/master-editor.mjs --check

The check emits machine-readable blockers, not a speculative MP4. After genuine owner source approval and manifest population:

    node production/yunex/supercar_flames_ep005/agent8/download-media.mjs
    node production/yunex/supercar_flames_ep005/agent8/master-editor.mjs --render

Pipeline downloads only pinned named GitHub workflow artifacts, verifies each MP4 SHA256 + native 30fps/1080x1920 + enough frames, full-decodes sources, uses exact source frame trims, joins seven beats without padding/freeze frames, adds restrained editable ASS captions, optionally mixes approved audio and renders 750-frame H264. It FFprobes finished MP4 and audio, full-decodes output, extracts first-second/cut/last-75-frame review samples and writes render-proof.json with final SHA256. CI stores genuine outputs as artifacts only if the gate is open.

**Actual visual inspection still mandatory**: watch real full-speed output, inspect first 30 frames and final 75 plus cut transitions and science. A green workflow or contact sheet alone is not owner picture approval; render-proof.json explicitly records PENDING human visual approval.

## Current blockers as of branch creation

1. No new explicitly accepted Agent 6 neutral-lit car/driving MP4 or actual exhaust port interface.
2. No explicitly accepted Agent 7 source video with flame physically attached to Agent 6 and realistic mechanical science.
3. No authoritative approved EP005 original narration/timestamp contract found.
4. Therefore no genuine complete EP005 candidate MP4 exists yet. Branch is an editorial source and native render workflow, not a finished film.

No changes to EP003, EP004, kit PR #233 or rejected EP005 production branches.


## Continuation checkpoint — new car / flame gates and audio mastering

**Agent 6 #265 / PR #270:** The first Spectral GT RS candidate A was rejected after genuine portrait/landscape frame inspection. Its source `bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4`, genuine rejected video hashes, and `exhaust-ports.v1.json` are BLACKLISTED. New Khronos CarConcept candidate B needed a proper KTX2 loader/transcoding repair before native visual acceptance. Do not use candidate A's mount geometry or assume candidate B's compatibility from old port coordinates.

**Agent 7 #266 / PR #268:** Native fixture and V8 science proofs exist but are not integrated shots. Previous visuals were judged too distant and fire too weak; agent continues improvements. Await *new approved* hero world-port interface before f0 and f675 composite. Do not extract fixture flame to paste onto an approximate screen position.

**Agent 8 new audio build:**
- Edit-to-beat silent source sheet is `audio-cue-sheet.json`; all proposed stems remain NULL and explicitly unapproved.
- `voice.approved=true` requires original audio SHA256, specific issue-comment approval, GitHub run+artifact, source SHA, actual independently measured `verifiedDurationSeconds` at/below 25.005s. The renderer blocks mismatched source duration and prevents cropping of longer narrator audio. Final voice timing has priority over provisional picture cuts.
- Subtitles must be exact verified captions in 30fps frame units, ordered without overlaps and never extending beyond the actual narration length. No generated fake Cedar timestamps or implied recording.
- Each approved engine/road/afterfire/music stem must have an authenticated source commit, explicit owner/manager approval, native SHA256, workflow artifact identity, license/provenance and -48 to -10dB pre-mix gain. Stems are dynamically sidechain-ducked against the unchanged narration. Mix targets -16 LUFS / -1.5dBTP, AAC stereo 48k / 192k.
- `audio-filter-smoke.mjs` tests the real production filter chain with *synthetic one-second tone only* and produces NO user-facing film. This prevents claiming that synthetic diagnostic audio is an EP005 soundtrack.
- After actual native MP4 render, `audio-qc.mjs` checks real audio-stream count, AAC stereo 48k, 25s duration, integrated loudness, true peak and generates `audio-qc-report.json`. No-audio picture review must have exactly zero audio streams.
- In addition to cut and opening/ending sample frames, the renderer exports ALL f0–29 and f675–749 frames (105 compact thumbnails) and rejects an essentially static hook or ending. This is automated motion QA, NOT a replacement for watching the entire genuine MP4 and separately approving car geometry/fire/science.

**Next authorized edit step:** Agent 6 supplies owner-accepted car B-or-later moving video and new exhaust port ABI; Agent 7 supplies matching port-anchored transient flame and science clips, both source/media hashes plus approval comments; editor pins only those exact files. If no approved voice exists, produce only genuine SILENT PICTURE REVIEW; no dummy narrator or undeserved final-audio claim. No merge.

## October 23 V4 pivot

Agent 6 #265 / draft PR #270 must stop candidate sourcing, bring the owner-approved V4 model and actual source dependencies from kit into its isolated branch, then deliver verified NEW driving MP4s and exact frame-varying V4 port interface. Agent 7 #266 / draft PR #268 must attach genuine transient afterfire and remake science around those ports, then hand off actual integrated clips. Agent 8 must recheck every run, clip hash and explicit owner/manager shot approval, then render only the 750f video. Existing workflow will auto-run on this PR update; when footage is still absent its gate should remain closed. The published 14s appearance reference is **not** a substitute for EP005 driving, flames or engine-science shots. Original EP005 narrator is not yet identified; silence must be clearly labelled. No merge.


## 23 October — independently verified V4 preview source intake, NOT picture approval

**Alternative short-science 750f cut:** `rough-picture-manifest.json` (source-status `UNAPPROVED_25S_V4_REVIEW_CUT_SOURCE_INTAKE_ONLY`) documents a fully frame-budgeted, distinct-source assembly compatible with current preview durations. It is an alternate edit for evaluation, **not** an approved clip list and not a finished movie. All `media.approved` fields deliberately remain false, `approvalRef` fields remain null, and the existing `edit-manifest.json` master cut remains unchanged until picture acceptance.

| Timeline frames | Required source | Exact proof status |
| --- | --- | --- |
| 0–44 / 45f | Agent 7 real V4 nozzle-attached hook | Run 39886214728, artifact 12472384523, SHA256 `9388010364f05d3dfbe7a88013231c2264c02277248d8c2eb20f4843888b55e2`; full decode PASS, visual revision still needed |
| 45–164 / 120f | Agent 6 front moving shot | Run 39884937145, artifact 12471824657, SHA256 `279d51b96b536d7cf1a963c29930e25fdf9bafae35de1433950e520c00ddbf39`; too much sky |
| 165–239 / 75f | Agent 7 science, original input frames 0–74 | Run 39885531109, artifact 12472238710, science.mp4 SHA256 `a3598efcd9ff000cb2fd4c4837870d4abbb4d9f84d5c074077b7c291852a778c`; 3D grey CAD still too small/cropped |
| 240–359 / 120f | Agent 6 side-moving shot | Run 39884937145, artifact 12472720631, SHA256 `40bd840d8c74507d108d5be5c0cdace26a65e2259f859215a8e12fa3f77efde2`; body cut off at end |
| 360–434 / 75f | Agent 7 science, original input frames 75–149 | Same 150f science file, **nonoverlapping original frames**; exhaust hot-gas / conditional afterfire illustration |
| 435–554 / 120f | Agent 6 rear chase moving shot | Run 39884937145, artifact 12472557527, SHA256 `6558f96ae6ba2a0ebc3b0d5b87620f2b2219a38f90dfbfda566b5c0c88d7e9f9`; decoded and visually reviewed, car too small / track basic |
| 555–674 / 120f | Agent 6 new moving rear 3/4 | **MISSING** from reviewed artifact set (rear-proof job pending) |
| 675–749 / 75f | Agent 7 actual V4 port-anchored flame finale | Run 39886214728, artifact 12472972362, SHA256 `ba89e51e8f68ffed8d44baa518139d962b91c2a0a2381aeb49d36506f467a3fe`; full decode PASS, current rear-close shot too similar to hook and fire too restrained |

Current **technical source coverage: 630/750 frames = 21/25 seconds**. The remaining 120 frames are a separate rear-driving proof; additionally current verified clips need aesthetic improvements (therefore **0/750 frames are picture-approved**). The active master workflow checks both this plan and its protected master manifest and refuses a film render until every actual shot is approved. New source selections supersede these provisional SHA values rather than silently inheriting false approval.

**Verified physical source ABI:** Agent 6 real `src/yunex/ep005/agent6/v4-exhaust-ports.json` and artifact matching SHA256 `5f756ab40a6b2219a50485c94cf7592d73469478e7ddf49fd3644ca84624672d`, named `exhaust-outlet-left/right`, 112mm outer diameter, 104mm bore; artifact file currently encodes `"version": 1`. The editor's explicit V4 namespaced *display contract* `v4-exhaust-ports@1` refers to that **exact unchanged 1st version of the V4-only manifest**; it does not pretend the underlying JSON version was renamed. If Agent 6 releases an updated ABI/file, lock its new SHA/version and rerender every dependent A7 shot as necessary. Port metadata does NOT itself prove flame cinematic acceptance.

**Downloader correction:** GitHub Action artifacts containing nested `native/front-pursuit.mp4` etc must unpack at `media.artifactExtractDir` (for example `out/ep005-agent8-sources/front/`), while `media.path` names the exact resulting MP4. The old behavior unpacked into the file's immediate parent folder, causing an unintended `native/native/` duplication. `source-layout.mjs` and regression tests enforce correct isolated extraction layout and reject traversal.

**No final yet:** The audience-facing first actual 25s result must be exported `EP005-SILENT-PICTURE-REVIEW.mp4` with exactly zero audio channels when authentic approved VO is not found, and must be independently reviewed before picture approval. Never fill a missing 4-second slot by repeating an existing car video, holding frames, using flame fixture, or claiming CI proof equals owner approval.

## 23 October ORIGINAL CEDAR VO — user-supplied AUDIO IS NOW AUTHORITATIVE

Owner provided `openai-fm-cedar-audio.mp3` and its full exact narration in the conversation. This is original audio, not a text placeholder and **not generated by Agent 8**. `ffprobe` measured **25.560000 seconds**, MP3, 24 kHz mono. Source SHA256 is **`90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8`**. User-supplied original status and owner source reference: [Issue #267 comment](https://github.com/YunRah2103/Remotion-gpt-chat/issues/267#issuecomment-6355895803).

**Final narrated output MUST run 767 real, non-looped video frames** at 30fps (25.5667 seconds) and retain the complete uploaded MP3 narration (including “And at night, it looks absolutely insane.”), pitch and natural timing unchanged. No arbitrary trimming, speedup, fake re-recording or 750-frame movie with the 0.56s tail cut. It is a change from the initial silent 750f brief, grounded in real delivered voice duration.

New `narrated-picture-manifest.json` (the canonical 767f workflow target) contains `voice.approved:true` for user-original source selection, 13 audio-derived **phrase** timing captions, and **all individual visual `media.approved:false`**. Final opening audio cue begins at 0.0s; closing spoken line begins about 23.75s (f712), requires full moving fire until at least f763. A7 closing video must be revised to 92 unique original frames, instead of the older 75-frame temporary proof. A6 120f rear 3/4 shot still missing from the accepted pack; total 137f narrated coverage is pending new native real footage. No loops, still frames or substitutions.

Audio evidence and files:
- `user-cedar-voice-contract.json`: canonical SHA, exact transcript, measured 13 phrase timings and no fake GitHub artifact reference.
- `original-cedar-phrase-captions.srt`: editable actual transcript with measured phrase start/end, clean two-line portrait breaks.
- `original-cedar-voice.test.mjs`: regression for 767f, source SHA/duration, cue times, no old 25s crop and closed visual gate.
- `master-editor.mjs`, `audio-qc.mjs`, `download-media.mjs`, master Actions workflow now accept 767f, original user MP3 and SHA-verified 48k AAC output, preserving original narrator cadence; no binary voice synthesis.

**Critical artifact availability:** The owner MP3 was attached in chat, **not committed as a binary GitHub file**, so workflow run cannot directly download it from GitHub Actions. To make a true narrated film the authenticated render environment must have the **exact** MP3 at `out/ep005-agent8-sources/user-cedar/openai-fm-cedar-audio.mp3` with identical SHA. The approval gate checks real file presence and blocks native render if absent. No claim that workflow has this binary or that finished EP005 audio/movie exists.

Caption visual QA: use restrained, centered lower-third phone-safe captions, max two lines, no bottom clipping. The original MP3 supplies 13 independently identified speech phrase spans; they are **not** invented per-word timestamps. Inspect actual audio sync, the first half second of picture, cut boundaries, actual science/afterfire and the final 75+ frames before reporting final readiness. Existing `edit-manifest.json` and `rough-picture-manifest.json` remain historical 750f **silent** source-review plans; do not use them for authoritative owner-provided narration.
