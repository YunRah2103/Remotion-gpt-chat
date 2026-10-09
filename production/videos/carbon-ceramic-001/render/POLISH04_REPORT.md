# Carbon-Ceramic Brakes 001 — Agent F Polish 04 complete native render

**STATUS: REAL 25.000s POLISH04 REVIEW CANDIDATE VERIFIED. NOT MASTER-APPROVED FOR RELEASE.**

## Immutable source and provenance

- **Exact Agent E Polish04 source commit:** `21c2b581b46251b0bd45028d32eb40b4341eeb2a`
- [Agent E Polish04 native proof PASS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37981542125)
- New F chunk rendering: [run 37982325309](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982325309), nine verified native chunks **00,02–09**. Its 75–149 worker stalled during native dependency installation; the nine genuine H264 chunks are source-locked and verified individually.
- In-film pad onset segment **01 (75–149)** independently rendered from **the same exact E commit**: [recovery run 37982665013](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982665013), **SUCCESS**. H264 75 frames / 1080x1920 / 30fps / full decode; SHA256 `a63f853328d9c2c3a66be4dbc46548e284d6265a3f65360d1c00d400795f213c`.
- **All ten source-locked 75-frame chunks and sha256 records independently checked.** No frames from the earlier first full candidate were included.
- **Complete assembly, H264 conversion, QA and artifact:** [GitHub Actions run 37983072846](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846) — **SUCCESS**.
- [Playable Polish04 MP4 and full technical proof artifact **11641871804**](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804).

## Verified completed MP4

| Requirement | Native media result |
| --- | --- |
| File | `carbon-ceramic-001-polish04-candidate.mp4` |
| Full length | **25.000000 s** — PASS |
| Frame count | **750 declared / 750 read by FFprobe / 750 fully decoded** — PASS |
| FPS | **30/1** — PASS |
| Resolution | **1080×1920** — PASS |
| Codec | **H.264** — PASS |
| Pixel format | **yuv420p** (video-range via explicit FFmpeg conversion) — PASS |
| Independent complete FFmpeg decode | **PASS** (no corrupt decoding frames) |
| File size | **12,314,696 bytes** |
| SHA256 | `fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb` |
| Audio | **None**; no verified authentic approved narration available |
| Contact sheet | 14 native frames spanning in-film pad onset, all five shots and hero 630–749 |
| Master release approval | **PENDING**; final SOURCE_LOCK and Master gate unchanged |

FFprobe, complete FFmpeg decode results and SHA256 are in the verified [GitHub artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804), alongside actual MP4 and PNG stills. Independently downloaded artifact MP4 was hashed again; SHA256 **matched** report. Automated blackdetect has no extended black intervals; freeze detector flagged low-motion spans in the quiet intro and benefits shots (details in JSON), which are visually different from corrupt frames.

## Polish04 visual QA — actual 3D film frames

Reviewed **22 actual native decoded source frames**: 0,48,85,99,105,117,132,145,168,245,270,321,405,450,531,629,630,660,690,705,730,749. The 14-frame official contact sheet has additional source-linked sample evidence.

1. **In-film pad cutaway 100–147 — IMPLEMENTED.** In the actual main `CarbonCeramic001` composition, frame105 shows the caliper and live readout 1.06 mm. By frame117 pads are clamped, shown at the true 2.35mm physical stroke. Frames132/145 expose the disc and opposing-pad geometry with the caliper hidden and an explicit explanation. It no longer depends on a detached add-on video. **Limitation:** physical axial travel is small; both opposing moving faces are not immediately easy to distinguish at phone size.
2. **Pad transition — REVIEW.** Frames 99–100 and 147–148 explicitly use very dark navy full-frame transition overlays. They are intentional E source transitions, not missing frames, but can feel like a momentary visual flash. Agent D should review actual playback before signoff.
3. **Thermal 270–449 — PRESENT.** Frame321 and 405 show restricted annular illustrative warmth, not entire rotor neon glow, correctly labelled illustrative. No calibrated temperatures asserted.
4. **Benefits 450–629 — PRESENT.** The full brake is visible at frames450,531,629 without obvious critical cropping. Rotor materials remain dark and significant empty portrait background persists.
5. **Hero 630–749 — MEASURABLY IMPROVED.** Brake remains in frame across 630/660/690/705/730/749, and the angle changes visibly through the last frame. The rotor does not falsely spin after braking stops; orbit supplies motion. Camera ends with thin side-on silhouette, which Agent D should evaluate for payoff strength. The scene remains visually minimal and dark.
6. **Typography/continuity — REVIEW.** Opening and captions mostly remain frame safe; line labels and 2.35mm readout are physically grounded but small in long-shot phone preview; the dark cutaway transitions are obvious and should be creatively reviewed.

## Quantified full last-150-frame motion comparison

The analysis decoded original 30fps frames **600–749** from both the previous verified candidate and Polish04 at identical 180×320 grayscale proxy sizes, comparing absolute differences of all **149 adjacent frame pairs**. There is no invented aesthetic score.

| Metric | Previous candidate | Polish04 |
| --- | ---: | ---: |
| Mean adjacent-pair pixel difference | 0.16493 | **0.25263** |
| Median difference | 0.12707 | **0.23948** |
| 95th-percentile difference | 0.29631 | **0.38345** |
| Near-still pairs (mean difference under 0.15) | 108 | **25** |
| Black mean-under-6 frames | 0 | 0 |

**Mean motion proxy improved 1.5317× (+53.17%)**, with **83 fewer** near-static pairs. This is evidence of more visible changes, consistent with the new hero orbit; it cannot alone establish premium artistic quality. Source-specific machine summary: `render/POLISH04_MOTION_QA.json`.

## Reviewer handoff

**Agent D:** Independently watch the exact `fad39a08…` Polish04 MP4; check frames 99–100 and 147–148 dark flashes, pad cutaway clarity 100–147, thermal 270–449, benefits 450–629, and orbit continuity 630–749. **Master:** Review D's findings, source lock approval and approved narration separately. This deliverable remains a silent, technically passed **review candidate**, not an authorized public release.

No YUNEX files, A–D visual source, Master SOURCE_LOCK or release gate were changed.
