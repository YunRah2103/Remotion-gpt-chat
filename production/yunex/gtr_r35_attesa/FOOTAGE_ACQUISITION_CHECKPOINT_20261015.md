# YUNEX Nissan GT-R R35 — ATTESA E-TS footage acquisition checkpoint
Date: 2026-10-15
Role: Sole footage researcher/acquisition/verification, not final editor.

## Status — NOT YET DELIVERED

Three owner-authored Galaxy S25 V4 source-video download jobs have been submitted. At the time of this checkpoint, the GitHub issues have **no** `YUNEX_PHONE_DONE_V4` or `YUNEX_PHONE_FAILED_V4` comment and **no verified media payload**. This is an acquisition shortlist and resumable handoff **not a finished 6–10-clip editor-ready media package**.

| Priority | Source / owner | V4 issue | Requested source range | Expected editorial use | Rights / QA |
| --- | --- | --- | --- | --- | --- |
| 1 | Oliveri's Life — “FAREWELL GODZILLA / 870 HP R35 GTR (4K)” — https://www.youtube.com/watch?v=jbh6-hl5YD4 | [#97](https://github.com/YunRah2103/Remotion-gpt-chat/issues/97) | 00:00–00:45 | Potential cinematic moving hero and full-car angles; modified grey R35, so beware trim/colour continuity | UNKNOWN RIGHTS / pending visual and binary verification |
| 2 | Mécanique Sportive — “NEW NISSAN GT-R 35 2021 / 0-100km/h + 100-200km/h incredible Launch control” — https://www.youtube.com/watch?v=-v4aPSbde8w | [#98](https://github.com/YunRah2103/Remotion-gpt-chat/issues/98) | 00:00–00:50 | Potential launch, throttle response, speed and grip | UNKNOWN RIGHTS / pending visual and binary verification |
| 3 | Nissan (manufacturer) — “Farewell to a Legend: Celebrating the R35 GT-R legacy” — https://www.youtube.com/watch?v=hJqJPW7FdQk | [#99](https://github.com/YunRah2103/Remotion-gpt-chat/issues/99) | 00:00–01:40 | Potential exterior, wheel/badge, engineering and closing cutaways from official R35 film | MANUFACTURER CONTENT / reuse rights not established / pending visual and binary verification |

Additional official Nissan press kit: https://usa.nissannews.com/en-US/channels/GT-R-Press-Kits?selectedTabId=GT-R-Press-Kits-presskits (2018 running B-roll, 2024 T-spec footage, 2024 NISMO B-roll, 2024 cockpit and engine photos). Official listings found; no downloaded or FFprobe-verified file from these listings at checkpoint.

## Provisional 8-shot shot-selection requirements

**All rows below are EDITORIAL TARGETS, not existing/verified clips or exact footage timestamps.** Do not invent timecodes.

1. **Opening:** full-car moving front 3/4 or acceleration approaching camera, ideally from #97. GT-R unmistakable by 0.5s. Prefer clean upper corner for the text “WHY DOES THE GT-R LAUNCH SO HARD?”
2. **Rear bias:** rear 3/4 tracking from #97 or #99; use for explanation that ATTESA E-TS is normally rear-biased. The torque path must be made explicit via separate graphics, *not inferred directly from visuals*.
3. **Grip/contact:** tight rolling rear wheel/contact patch from #97/#99; use as illustrative detail rather than evidence of electronically measured grip.
4. **Launch:** clearly observed launch from #98; ensure actual start and car movement are in the final 2–3s extract.
5. **Torque to front:** clear front wheel and frontal acceleration from #97/#99; overlay accurate simple drivetrain text/arrow, avoiding implication footage itself shows torque routing.
6. **Cornering:** full-car R35 corner exit from #97/#99; watch direction, no wrong-generation cut.
7. **Cockpit:** R35 gauge, tachometer or paddle from #99 or verified supplementary Nissan B-roll; crop must leave instrument readable.
8. **Close:** graceful rear 3/4 driving-away hero from #97/#99; leave title space without cutting rear wing/car.

## Pass/fail criteria for each candidate

- Actual 1080p+ source pixels (native, not inferred from a title), correct R35 generation, real car footage vs CG/game footage.
- FFprobe: codec, width, height, fps, duration and audio streams, frame/sample aspect. Full FFmpeg video decode.
- Inspect 0.5–1s frame samples and in/out boundaries, plus a 9:16 centre/subject-tracked 1080×1920 crop proof.
- Individual *exact* SOURCE-IN/SOURCE-OUT timecodes determined from actual viewed frames; describe shot, direction, car/colour, overlap, text safe zone and edit use. Source-window cut from S25 jobs is not a shot-level timecode.
- SHA256 / real byte count and authenticated Release/Actions artifact reference; prove clips are playable and are the target R35.
- Mark source rights. Unknown-rights S25 video must stay in private DRAFT GitHub Releases; do not publish/rehost it or label it licensed. Permission to download privately is not permission to publish a third-party clip on TikTok or elsewhere.
- Check for baked-in captions, logos, voiceover and copyrighted music; mute original soundtrack in editor if an authorised video is used.

## Technical recovery

1. Check issue comments on [#97](https://github.com/YunRah2103/Remotion-gpt-chat/issues/97), [#98](https://github.com/YunRah2103/Remotion-gpt-chat/issues/98) and [#99](https://github.com/YunRah2103/Remotion-gpt-chat/issues/99) for `YUNEX_PHONE_DONE_V4` or `YUNEX_PHONE_FAILED_V4`.
2. A V4 issue alone cannot start Termux; phone processes it only while the preinstalled `~/yunex-v4 --loop` is active. Do not reinstall/reconfigure worker or request credentials.
3. Once DONE, use repo composite action `.github/actions/yunex-v4-import/action.yml` in GitHub Actions with `permissions: contents: write`, `issues: read`, and the **actual issue number**. It validates the downloaded source SHA256, byte count, ffprobe and FFmpeg full decode without making private Draft Releases public. Docs: [quick start](../../../docs/YUNEX_V4_NEW_AGENT_START_HERE.md), [full guide](../../../docs/YUNEX_S25_V4_AGENT_GUIDE.md).
4. Inspect each actual video and find exact shots / crop; save 6–10 genuine distinct extracts + contact sheets in an authenticated private production package, and make a separate rights-cleared delivery for anything to be published. Do not claim complete until assets and QA exist.

## Current summary

| Gate | Status |
| --- | --- |
| Owner-authored download requests | 3 submitted (#97–#99) |
| V4 DONE/FAILED reports | NONE at checkpoint |
| Proven playable R35 MP4s | 0 |
| FFprobe/full-decode checks on new GT-R sources | 0 |
| True visual review and 9:16 crop | 0 |
| Exact scene timecodes | NONE |
| 6–10 editor-ready clips | INCOMPLETE |
| Licensed final reuse | NOT CLEARED |
