# Agent B — BMW M5 G90 beat film production

**Editorial source implemented; final footage-led MP4 BLOCKED by material rights/assets, not by render scaffolding.**

## Work completed
- New Remotion component: src/bmw-m5-g90-beat/BeatFilm.tsx, registered as BmwM5G90Beat001, 1080×1920, 30 fps, 600 frames.
- Frame-exact shot replacement at each of the 39 supplied beat starts; actual source videos via OffthreadVideo, not animated stills.
- Shot-level pan/punch composition, restraint on kinetic flash, G90-specific intro and outro, titanium low-saturation grade.
- Strict source-media gate: no auto-fallback to F90, G99 Touring, M4, unrelated cars, static photos or unlicensed press films.
- Editor manifest lives at src/bmw-m5-g90-beat/shot-manifest.json; remains BLOCKED until a verified real-video Agent A handoff is integrated.
- TypeScript and beat-grid CI passing: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38008449276

## Independent incoming Agent A assessment
A's handoff has status **blocked** despite completed research/audit: 0 / 39 authorized, G90-verified downloaded moving shots. Agent A source work SHA:
2da1f31683fdc02bc2993d0b34da7e9cd8080ef5.
Potential BMW Group PressClub driving compilation PF0009730 is **NOT** cleared for arbitrary public TikTok reupload; never use it absent permission. No clip artefact exists.

## Strict shot manifest contract
Before setting status to ready, supply 39 entries with unique shotId, slot index 1–39, sourceId, file basename (inside public/bmw-m5-g90-beat/), inSeconds, playbackRate, angle, direction, cropX/cropY, exact sourceSHA256, licenceId, model-generation evidence. Fill sourceLicenses with matching records containing id, sourceURL, creator, licenseTermsURL, licenseName and publicUsePermitted=true supported by evidence. Fill agentA with status=ready, sourceSha (40 hex) and footageEvidence. All 39 segments need actual visible motion and different angles; never duplicate a 0.5 second segment.

## Actual render command (only after clips exist)
Run with dependencies installed:
- python production/videos/bmw-m5-g90-beat-001/editor/validate_editor.py --phase planning
- bash production/videos/bmw-m5-g90-beat-001/editor/render.sh visual
- AUDIO_PATH=/secure/user-music-20s.m4a bash production/videos/bmw-m5-g90-beat-001/editor/render.sh private-review
- AUDIO_PATH=/secure/user-music-20s.m4a MUSIC_RIGHTS_EVIDENCE=/secure/licence.txt bash production/videos/bmw-m5-g90-beat-001/editor/render.sh publish

The last mode requires evidence of **both** cleared source footage and publishable music rights. Do not commit user music to public GitHub. Private music-muxed video must not be uploaded publicly.

## Local private editorial proof generated in Agent B's ChatGPT session
This is an audio waveform / 39-card technical sync test, **not a G90 car edit** and not public release footage. The actual locally rendered test is 20.000s, 1080×1920, H.264, 600 decoded frames, 30/1 FPS, 48 kHz stereo AAC, full FFmpeg decode PASS. User audio excerpt hash: 925c58cfb8268f8f11c58c131a562310741eeb959c33dfbf31832cef8c0a3da5. Local beat transient detection found roughly 117.45 BPM but precise sub-frame musical phrase approval remains editorial, not a proven end-to-end footage sync check. No media/music binary has been publicly committed.

## Status
Do not label final or DONE until there is a genuinely licensed G90-only 39-shot source set, actual Remotion 600-frame video render, complete moving-frame review, music-use permission and downloadable MP4.
