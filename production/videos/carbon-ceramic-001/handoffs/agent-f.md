# Agent F — Lead Rendering Engineer verified candidate handoff

**STATUS: REVIEW. Actual 750-frame full-length MP4 is TECHNICALLY VERIFIED but is NOT approved as Master release.**

## Native source lock
- Repository: `YunRah2103/Remotion-gpt-chat`
- Agent F branch: `automotive-brakes-001/f-render`
- Immutable Agent E film source: `5b378202187748ce9b51d884f26bb7167285c946`
- Candidate workflow implementation SHA: `dcc710b04478784233fda1743904cee9e7b057af`
- No Master final release gate/source lock modification. This is a separate candidate pathway.

## Real full MP4 and verification
- [**Download verified playable candidate via GitHub Actions artifact #11639835454**](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707/artifacts/11639835454)
- GitHub Actions: [**37978273707 — SUCCESS**](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707)
- File: `carbon-ceramic-001-candidate.mp4`, real Remotion + Three.js, 12,875,114 bytes.
- MP4 SHA256: `e7ed2619ab6ed09087cdb50cfc2b4fb94e3262aa69da77b72e5142bcb51bec73`.
- FFprobe: **H264 / yuv420p / 1080×1920 / 30/1 fps / 750 frames / exactly 25.000 seconds**.
- Full independent FFmpeg decode: **PASS, 750 decoded frames, no corrupt frames**.
- Silent: no approved narration was supplied. Never invent audio.
- Contact sheet and real native extracted frames **48, 168, 321, 531, 705**, FFprobe JSON, SHA256 and quality report are in the same artifact.
- All 10 original 75-frame chunks and provenance verified by real per-part SHA256 before assembly. Original [native run 37976771520](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976771520), recovery of only chunks 07 and 09 [run 37977591114](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37977591114); final assembly verified above.
- Intermediate source-range `yuvj420p` file failed strict pixel format and was **correctly corrected** by full-range-to-TV-range conversion. Final artifact passes `yuv420p`.

## Independent visual findings
Actual five-frame contact plus 11-point extracted scene review found real isolated caliper, rotor and hubs in frame, 5-shot narrative and illustrative friction heat. **Issues:** faint/very dark ghost-outline opening with empty negative space, low-contrast material lighting, visually subtle physical pad travel, small engineering labels and still/freeze warnings in late shots (roughly 15.8–24.8s). Freeze detection is not itself proof of a render malfunction; D must watch exact frames and transitions. No black interval detected.

See [complete QA report](../render/REPORT.md).

## Signoff pending
Agent D must independently inspect the actual moving 25-second candidate and approve/call corrections. Agent A/E ongoing Polish03 may improve model and film, but this initial candidate remains source-locked to the exact E commit above. Master alone approves/merges the release source and publishes. **DO NOT mark F ready for final release just because this review candidate is technically valid.**

F PR [#16](https://github.com/YunRah2103/Remotion-gpt-chat/pull/16) is the source and evidence handoff; this does not change the separate Master release gating.
