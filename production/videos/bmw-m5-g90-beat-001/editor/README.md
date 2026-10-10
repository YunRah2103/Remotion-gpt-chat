# Agent B — BMW M5 G90: private 20-second beat edit

**Footage integrated for PRIVATE review. No public publishing rights are asserted.**

## Footage source and real checks

Agent A's completed source revision is `96a4cec9eac460d7ec44c625292b781dda6830b8`.
Its `source-manifest.json` identifies BMW M5 G90 saloon, original BMW Group PressClub moving G90 source PF0009730 / Scene 3.
Original source SHA256: `59947dad266e74d92843cd90c2b2c90a3e118b277898f001c30c51e4e9b428a9`.
Actual 39-shot Actions artifact: `G90-PRIVATE-39-SHOTS`, ID `11652333164` in run `38009881261`.

The artifact has been downloaded in Agent B's working environment. **All 39 MP4 files have passed independent matching SHA256, FFprobe H.264 1280x720 30fps, exact individual 15/16/11-frame lengths and sum of 600 frames.** Original source SHA also matches. Visual contact sheet was reviewed and shows bright-green BMW M5 G90 saloon moving on the same volcanic-road shoot from different angles, including rear, front, wheel, grille and aerial shots. No F90, G99 Touring or other car was identified.

## Native editor and render

`src/bmw-m5-g90-beat/BeatFilm.tsx` is the actual **text-free** 39-cut Remotion editor; the existing composition ID `BmwM5G90Beat001` is 1080x1920 30fps 600 frames.
39 cuts use `OffthreadVideo` with the exact media from Agent A. Premium desaturated contrast, per-shot bright-green car-focus crops, continuous moving blurred scenery beyond the original widescreen FOV and selected minimal downbeat flashes. There are **no title cards, text, subtitles or overlays**.

`.github/workflows/bmw-m5-g90-private-render.yml` downloads the original 39-shot media artifact during Actions run, independently verifies all source hashes and formats, installs FFmpeg and Remotion, renders 600 frames, and validates H.264 1080x1920 30fps by FFprobe + complete FFmpeg decode. It uploads only a short-lived, **visual-only** 20-second MP4 for personal review, never the raw music. The private user-uploaded soundtrack is muxed **locally outside public GitHub** with FFmpeg.

GitHub Actions Remotion native 600-frame render: **SUCCESS**. Original source rendered at commit `1ef4582aae86fdc08244de24dfbc077dafc798d8`. Visual-only artifact `11653571296` downloaded, user audio locally muxed, actual final native Remotion MP4 `/mnt/data/BMW_M5_G90_REMOTION_PRIVATE_FINAL_20s.mp4` validated: H.264 1080×1920, 30fps, 600 frames, 20.000s, AAC stereo 48 kHz, full FFmpeg decode and 39-beat moving-footage visual QA PASS; SHA256 `15ed05c1df2fe5cddda990bfec65f5c50a54885edd4380d6abf71b1a4e7e6edb`.
https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38010694333

## Alternative independent offline proof

To protect delivery against host Actions failure, the same 39 verified source MP4 segments were also edited with FFmpeg locally in Agent B's working container (same car-focus positions and no typography) and privately audio-muxed to an AAC 48kHz stereo MP4.
FFprobe: 20.000sec, H.264, 1080x1920, 30fps, 600 decoded frames, AAC 48kHz stereo. Entire film fully decoded error-free.
Local final private file: `/mnt/data/BMW_M5_G90_PRIVATE_REVIEW_20s.mp4`. This file is **not committed** to public GitHub.
Independent 39-shot moving-frame audit: all source SHA hashes rechecked, no black shots, all 39 show genuine moving frames, full coverage 0..599.
This independent fallback is FFmpeg, **not falsely claimed to be Remotion-native**.

## Rights

Agent A explicitly records **no public social redistribution rights** for BMW press footage, and public music distribution rights are also unverified. Therefore, all movies must remain limited to **private viewing and review**, with no public GitHub release, TikTok publication, or upload of the copyrighted audio.

