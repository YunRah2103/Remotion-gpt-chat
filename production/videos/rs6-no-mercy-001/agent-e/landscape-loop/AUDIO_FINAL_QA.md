# YUNEX RS6 — 13.167-second landscape seamless-loop sound design

**Status:** REAL FINAL PRIVATE MP4 rendered and independently verified, 13 Oct 2026. This branch holds the edit decision log and technical QA only, **not third-party video, soundtrack, or audio recordings**. The owner has the completed file and stems in their ChatGPT delivery.

## Locked source and deliverables
- **Source**: `YUNEX_RS6_LANDSCAPE_13S_SEAMLESS_LOOP.mp4`, SHA256 `8953d022cfdcbe2cd7305d5a6ea28a63b193f7422da3347372f113811f306296`.
- **Finished MP4**: `YUNEX_RS6_13S_CINEMATIC_AUDIO_FINAL.mp4`, SHA256 `87ca31944dbed243484da8b906c233da06e48bfa4112be7b9c73a30505de5151`, **7,316,733 bytes**.
- **Original rollback** copied and included with final privately. Output: H264 1920×1080 **30fps 395 frames** duration **13.166667 seconds**, stereo AAC **48000 Hz 320kbps**. `ffmpeg -v error -xerror -i finished.mp4 -f null -` PASS.
- Video **stream-copy preserved**; SHA256 on compressed elementary H264 stream **both source and final** `038f2e1a4915c425b9e6f6ead791d7157d64bbca672bf31bb542553e4a003550`. No source picture frames, timing, grades, shots or transitions touched.
- Reference owner-supplied 13.165sec soundtrack is the existing song on source MP4. **No speed change/pitch change/silent replacement**. Correlation of decoded music against completed audio at same timing **0.96134**, despite added sound design.
- FFmpeg loudnorm measurement **integrated -14.31 LUFS, true peak -2.27 dBTP, LRA 3.0**. Full decoding: PASS, no clipping.
- Designed engine stem approximately **-25.49 dBFS RMS**, while soundtrack approximately **-14.62 dBFS RMS**, ensuring music remains dominant.

## Authenticity and sourcing disclosure
**Engine is a custom procedurally generated V8-style approximation, NOT a recording of an Audi RS6 C8 engine.** Precise RPMy accents, exhaust harmonics, light turbo band/whine, optional designed throttle-lift and short 21/39/67/103ms tunnel reflections; no V10, F1, generic unrelated samples, fake claims of sourced RS6 engine. Sourcing real C8 field recordings and their licensing is a separate future improvement. Owner music and source-film reuse rights are not established, so completed media retained **PRIVATE**, never pushed to public repository/releases.

## Timed creative cues
| Seconds | Picture | Sound work |
|:--|:--|:--|
| 0.00–1.40 | garage lit red / stationary first frame | quiet idle; music lead; loop-ready same opening/ending timbre |
| 1.47 | night full-car rolling | mild acceleration and location sweep |
| 2.50–4.40 | headlamp / purple night RS6 | moderate V8 texture, no excessive exhaust pops |
| 4.41 | side-on tunnel rolling | first room reflections and subtle pass/wind |
| **5.259** | strongest side-profile rolling + music drop | V8 throttle swell under existing original bass |
| 6.50 | ongoing side drive | tiny pitch-drop/throttle-lift, not asserted as genuine recorded shift |
| 7.61 | rear tunnel run | reflected drive sound, subtle direction sweep |
| **9.189** | frontal approaching RS6 | second accelerating passage, strong music remains forward |
| 10.19 | frontal tunnel run | subtle shift-like lift and rise |
| 11.51–13.167 | red garage return and same opening frame | motor settles; no chopped tail; exact loop seam |

## Seam QA
- Master PCM first/last samples **identical** per stereo channel.
- Final AAC decode first/last sample absolute delta **0.00042446**, vs natural intersample derivative ~0.0398 (90th percentile), leaving no audible hard click.
- Longest below -50dBFS (10ms-window test) **0.04s**, only very short musical boundary blend; no unexpected long silence.
- Source final audio duration matches picture: 13.166667 seconds.

## Private owner delivery
Archive `YUNEX_RS6_CINEMATIC_AUDIO_FINAL_DELIVERY.zip` contains actual playable final MP4, original MP4 rollback, isolated music and engineered V8 stems, stereo master, independent FFmpeg QA `MIX_SESSION.json`, and reproducible `build_mix.py`. The original reference remains privately provided; don't republish any unlicensed source.
