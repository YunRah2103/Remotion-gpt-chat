# French Legends — independently checked 25-second Agent C delivery

**Date:** 2026-10-12. User requested aggressive duration reduction from 60 seconds to 25 seconds, completely eliminating the original first clip.

## Accepted picture delivery

- **Agent C branch:** `automotive-edits/french-icons-001/c-cinematic-edit`
- **Correct picture workflow:** [successful GitHub Actions run 38190659364](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38190659364)
- **Downloadable, exact picture-only artifact:** [11720772971](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38190659364/artifacts/11720772971)
- GitHub Actions ZIP bytes: **37,485,356**, archive integrity **PASS**.
- ZIP contains `YUNEX_FR_LEGENDS_25SEC_MUTED_1080P.mp4`, `qa_report.json`, decoded contact sheet, and `25S_CUT_SHOTMAP.json`.
- Checked mute MP4 SHA256: `dda2ac65ca6aa0755334ab3f5416c36283496739c1f216ca71e90c7b8fd49b07`, bytes **37,341,476**.
- Correct target: **1920×1080, 30 fps, 750 frames, 25.000 seconds**, H.264 yuv420p, no audio.
- Visual proof: inspected genuine 5×4 decoded contact sheet from actual 25-second film. First frame is the original blue Alpine A110 driving. The previous Citroën 2CV / DS intro and old opening transition are absent.
- The montage is 13 actual selected moving scenes, vintage Alpine → R5 Turbo → Peugeot 205 GTI → modern Alpine → Bugatti Chiron/Bolide → sunny Chiron finale.

## Real locally verified music review copies

User-visible music-added 1080p review: `YUNEX_FR_LEGENDS_25SEC_CINEMATIC_1080P.mp4`.

- **SHA256** `1e18f99f3f800b9ac6e78e88f442f19996e4d619a7b9e9bc83005940a3b3ed92`.
- **38,198,980 bytes**; H.264 1920×1080 30/1, 750 frames; AAC stereo 48 kHz; exactly **25.000 seconds**; complete FFmpeg decoded audio/video stream **PASS**.

User-visible 720p phone version: `YUNEX_FR_LEGENDS_25SEC_PHONE_720P.mp4`.

- **SHA256** `6ad7c242d1ef2d45d9179ebff1877b3598fcae3a259c02a5004f7420d751d5e2`.
- **13,316,476 bytes**; H.264 1280×720 30/1, 750 frames; AAC stereo 48 kHz; exactly **25.000 seconds**; complete FFmpeg decode **PASS**.

**Exact original audio** was checked by opening real attached `FR_LEGENDS_ORIGINAL_AUDIO_PACK.zip`, extracting `sir..  [7623017441160891681].m4a` and computing SHA256 `2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55`. User-review copies use the continuous final **35.000–60.000 second** section of this original song. Neither the original song nor the privately muxed audio MP4 is checked into Git.

## Required Agent D / E action

Agent D must **use muted artifact 11720772971**, add only the existing exact verified user song 35–60s with any final conservative mastering, check 25.000s AAC 48k stereo and 750 decoded video frames, and publish its own final result. Do not use the retired 60s master artifact 11720519374 or the original full 60s soundtrack.

Agent E independently reviews the resultant final audiovisual film. Source IP re-use permissions remain unconfirmed for some supplied car footage; editorial correctness does not equal publication authorization.

**Agent C status: technical/representative visual QA PASS and 25-second picture handoff COMPLETE; Agent D/E final release steps still open.**
