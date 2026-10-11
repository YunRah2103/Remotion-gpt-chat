# Agent B — Extended real-footage GT3 edit (V5)

**As of:** 2026-10-11. **Branch:** `automotive-edits/gt3-nurburgring-multicar-001/b-cinematic`. **Issue:** #26. **Status: REAL VIDEO REVIEW CUT, NOT FINAL MASTER.**

- Built from user-uploaded Agent A V9 (four ZIP parts) and Agent A2 GT3 clips, **not** from the 720p reference video.
- Full 23.300 s from `192909.mp4` original reference audio; no replacement track. A short 0.6 s end fade avoids an abrupt ending.
- Native **1920×1080**, **30 fps**, **699** H.264 yuv420p frames, AAC 48 kHz.
- First 316 frames reuse previous aggressive beat-synced V3 review cut (actual GT3 driving footage). Tail has 24 fresh-cut real-media segments: **20 racing/details + three pit lane/crew + one cockpit simulated-data visual**.
- Genuine BMW M6 GT3 pit footage 11.20–12.30 s; cockpit data **illustration, not live or measured telemetry** 12.30–12.90 s. Racing accelerates again on musical accents from ~12.9 s.
- Local rendered file: `YUNEX_GT3_MULTICAR_AGENT_B_RACING_PIT_TELEMETRY_V5_1080P.mp4`. SHA256 `85342b57120829093f5600f006e1095e1a96af040b2c50ce27c21c8e30e93ee6`. **Delivered as a ChatGPT attachment, not uploaded to GitHub Actions**.
- Reproducible local Python+FFmpeg assembly script, JSON manifest, representative native-frame contact, and MP4 are packaged together in one ChatGPT handoff ZIP: `YUNEX_GT3_AGENT_B_EXTENDED_V5_HANDOFF.zip`.
- Technical QA PASS: full FFmpeg decode, exact dimensions/fps/frame count; no black intervals longer than 0.09 s under threshold 0.035. Six weak shots replaced after visual review: empty track, crew-only, captions and degraded branding.

## Second-half cutmap (first section is existing V3 0–316 frames)

| Shot | Output frames | Attributed make | Native source basename | Source in, s | Purpose |
|---|---:|---|---|---:|---|
| 23 | 316–336 | Mercedes-AMG | `hrt_24hnbr_topqualifying.mkv` | 6.65 | racing |
| 24 | 336–352 | BMW | `FALKEN18_BMW_M6_GT3_PIT_4K_HDR.mkv` | 4.50 | pit crew / tyre |
| 25 | 352–369 | BMW | `FALKEN18_BMW_M6_GT3_PIT_4K_HDR.mkv` | 9.55 | pit wheel |
| 26 | 369–387 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_ORIGINAL_COCKPIT_POV.mp4` | 0.16 | onboard with explicit simulated telemetry |
| 27 | 387–400 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_AERIAL_TRACK_2020_CAMERA.mp4` | 1.65 | racing |
| 28 | 400–410 | Porsche | `P26_WHITE_911_GT3R_STARTFINISH_17_native4k_SDR.mp4` | 0.50 | racing |
| 29 | 410–425 | Aston Martin | `ASTON21_05_FAST_TRACK_FLYBY.mp4` | 2.84 | racing |
| 30 | 425–436 | Ford | `hrt_ford_2026_entire_original.mkv` | 7.76 | racing |
| 31 | 436–444 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_REAR_NORDSCHLEIFE.mp4` | 0.14 | racing |
| 32 | 444–461 | Porsche | `F18_PORSCHE_911_GT3R_FRONT_NORDSCHLEIFE_193_native4k_SDR.mp4` | 0.38 | racing |
| 33 | 461–473 | Aston Martin | `ASTON21_01_CORNER_EXIT.mp4` | 1.75 | racing |
| 34 | 473–487 | Porsche | `FALKEN18_PORSCHE_GT3R_4K_HDR.mkv` | 2.22 | racing |
| 35 | 487–498 | Ford | `hrt_ford_2026_entire_original.mkv` | 39.60 | racing |
| 36 | 498–506 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_AERIAL_TRACK_2020_CAMERA.mp4` | 2.75 | racing |
| 37 | 506–520 | Porsche | `2026_PORSCHE_GT3R_GOROYAN4_NATIVE_UHD_TRACKSIDE_SIDE_T43.mp4` | 0.25 | racing |
| 38 | 520–536 | Aston Martin | `ASTON21_07_BANKED_SWEEP.mp4` | 1.08 | racing |
| 39 | 536–553 | Mercedes-AMG | `hrt_24hnbr_night.mkv` | 1.30 | racing |
| 40 | 553–572 | Porsche | `2026_PORSCHE_GT3R_LIONSPEED24_NATIVE_UHD_REAR_T45.mp4` | 0.25 | racing |
| 41 | 572–590 | BMW | `FALKEN18_BMW_M6_GT3_TRACK_4K_HDR.mkv` | 5.80 | racing wheel close-up |
| 42 | 590–612 | Aston Martin | `ASTON_VANTAGE_GT3_NLS8_ORIGINAL_NATIVE_1920x1088_VP9.mp4` | 27.55 | racing |
| 43 | 612–633 | Mercedes-AMG | `hrt_24hnbr_night.mkv` | 11.85 | pit lane |
| 44 | 633–653 | Ford | `hrt_ford_2026_entire_original.mkv` | 80.18 | racing |
| 45 | 653–681 | Porsche | `F18_PORSCHE_911_GT3R_CRESTRISE_202_native4k_SDR.mp4` | 0.78 | racing |
| 46 | 681–699 | Porsche | `P26_FALKEN_WHITE_MINT_911_GT3R_FRONT_51_native4k_SDR.mp4` | 1.36 | hero finish |

## Remaining independent QA

- Actual car identity, original film/circuit, watermarks/logos, licences and shot legibility need formal Agent D review; source attribution is based on supplier manifests and visual checks, not externally verified ground truth.
- Agent C can add genuine engine audio, but must preserve the exact uploaded music and avoid indiscriminate engine overlays.
- The previous GitHub timing preview artifact does **not** represent the actual final film. Full media bytes are user-attached only. Do not claim a GitHub-rendered MP4 or final production PASS.
