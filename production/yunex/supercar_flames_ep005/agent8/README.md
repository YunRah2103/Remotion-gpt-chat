# EP005 — NEW Agent 8 master editor

**STATUS: SOURCE ONLY / NATIVE FILM BLOCKED — not owner-approved video.** Issue #267, master #247. Independent branch agent/ep005-08-master-editor based on production/yunex-ep005-v3-base. No merges.

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

For role "integrated" scenes, Agent 7 must supply actual car+fire visual rendered on Agent 6 moving car and its REAL local/world exhaust port transforms. Store full 40-hex agent6Commit and agent7Commit, plus 64-hex portManifestSha256 from the actual exhaust interface manifest. No separate post-production 2D flare at guessed screen coordinates. For a reusable all-film 750-frame source clip, repeat the exact file hash and change each beat sourceInFrame, but only after genuinely verifying ALL its shots.

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
