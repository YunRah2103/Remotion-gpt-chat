# Agent A → B/C/D: verified physical V9 GT3 Nürburgring source-media handoff

**Date:** 2026-10-11. **Footage acquisition minimum PASS (after independent audit).** This is real racing source video, not the final cinematic edit or its soundtrack.

## One physical source archive

- Repo: `YunRah2103/Remotion-gpt-chat`
- Agent A branch: `automotive-edits/gt3-nurburgring-multicar-001/a-footage`
- One GitHub Actions ZIP: [V9 run 38163232775, artifact 11711435862](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163232775/artifacts/11711435862)
- Artifact exact name: `GT3-MULTICAR-V9-SIX-MAKES-25-IDENTIFIED-REAL-NATIVE-1080-4K-SOURCE-MEDIA`
- Size: **596,755,655 bytes**, includes **ALL** unchanged V8 source-media bytes and original manifests plus new HRT publisher originals.
- Editor should `gh run download 38163232775 --repo YunRah2103/Remotion-gpt-chat --name GT3-MULTICAR-V9-SIX-MAKES-25-IDENTIFIED-REAL-NATIVE-1080-4K-SOURCE-MEDIA --dir <out>`, then inspect `COMBINED_GLOBAL_MANIFEST_V9.json`, `README_FIRST.md`, `NEW_V9_4_ADDITIONAL_NATIVE_1080_EDITOR_CLIPS/`, `NEW_V9_REAL_HRT_ORIGINAL_FILMS/`, `NEW_V9_ACTUAL_VIDEO_FRAME_PROOFS/`, and nested `PREVIOUS_V8_REAL_ORIGINALS_UNALTERED/`.
- Core physical pass: 6 legitimate GT3 manufacturers, 25 distinct verified native-full-HD or original UHD Nürburgring moving camera scenes; no false 720p upscaling, sim footage, or duplicate adjacent frames.
- Independent secondary audit: [run 38163766256](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163766256), downloaded actual full 597MB archive, rechecked all four new original MP4 SHAs and examined their real six-frame contact sheets. **PASS.**

## Most useful new shots in V9

| V9 editor movie stem | Verified content | 1080 timeline |
|---|---|---|
| `NBR_HRT_FORD_MUSTANG_GT3_NUMBER64_TRACKSIDE_APPROACH` | **New sixth GT3 maker**, blue/yellow HRT **Ford Mustang GT3 #64**, real Nordschleife trackside accelerating toward camera | Original producer source 26.6–28.14s; 1.54s |
| `NBR_HRT_MERCEDES_AMG_GT3_AERIAL_TRACK_2020_CAMERA` | **Mercedes-AMG GT3**, overhead high-speed qualifying approach/track pan | Source 3.85–9.10s; 5.25s |
| `NBR_HRT_MERCEDES_AMG_GT3_ORIGINAL_COCKPIT_POV` | **Mercedes-AMG GT3 #12**, Luca Stolz full-speed forward-facing cockpit viewpoint with *small broadcast top header* | Source 11.67–14.02s; 2.35s |
| `NBR_HRT_MERCEDES_AMG_GT3_REAR_NORDSCHLEIFE` | **Mercedes-AMG GT3**, distant uphill rear wing Nordschleife corner exit | Source 0.0–1.65s; 1.65s |

All four actual files in `NEW_V9_4_ADDITIONAL_NATIVE_1080_EDITOR_CLIPS/` are already cropped by source time, physically SHA-checked and FFprobe verified **1920×1080**, H.264. A shot may have multiple individual source frames, but it counts **once**, and editor must not repeat angles under different filenames.

## Baseline source angles from V8 — DO NOT DISCARD

Nested V8 preserves 21 separately identified views across Porsche 911 GT3 R, BMW Z4/M6 GT3, Mercedes-AMG GT3, Audi R8 LMS GT3 (2018 pre-evo II), and Aston Martin Vantage GT3. Some Porsche originals are native **3840×2160** and should be preferred for intense slow-motion/ramping if feasible.

Selected Porsche 2026 verified UHD:
- Lionspeed #24 GT3 R mint-white rear corner `2026_PORSCHE_GT3R_LIONSPEED24_NATIVE_UHD_REAR_T45.mp4`, SHA `7dc0dc2f2ae848ee9bfb23d4058d460c02ed78a9ea7c4dc96f3fb334743a18fa`
- Goroyan #4 GT3 R blue-red-orange side flyby `2026_PORSCHE_GT3R_GOROYAN4_NATIVE_UHD_TRACKSIDE_SIDE_T43.mp4`, SHA `713145b18303d002c6f1bacd0dba364e0a9871223f2fc1c27d906261fb35772a`

## Clips NOT production landscape approved

- Actual 2026 ABT Red Bull Lamborghini Huracán GT3 EVO2 NBR movie is true **1080×1920 portrait**, one camera with publisher text, so cannot count as unscaled **1920×1080 landscape**. Optional vertical source only.
- A2 true McLaren Nürburgring original is encoded **1916×1078**, not native 1920×1080; review-only unless editor explicitly accepts a tiny-border exception.
- 2025 Ford HRT showroom, DTM promotion, Bathurst footage, static interviews, road cars and unrelated racing circuits in HRT full-film are not accepted.
- White/blue striped 2026 Porsche rear 4K camera exact GT3 class remains unresolved and review-only.
- Do not misidentify older 2018 Audi as R8 evo II.

## Critical audio, editing and deliverable constraints

- Master is **1920×1080, 16:9, 30fps, H.264 yuv420p, 10.533s, 316 frames**, **AAC 48kHz**.
- Musical soundtrack must be the user's exact prior `TikTok video #7690925557919403294 [7690925557919403294].mp3`, SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`, not a substitute. Its source audio pack was supplied to B/C chats, not in this source archive.
- Aim **18–26 unique cinematic shots** across soundtrack beats, no excessive repeated cameras, black bars, unreadable HUD or overlays, stock/sim/synthetic shots.
- Match engine sounds by car: Ford V8, Porsche flat-six, Mercedes V8, Aston V8, BMW I6, Audi V10. Preserve music intelligibility.
- B owns real Remotion visual timeline and rendered previews; C owns final exact MP3, sound design/mux/final film; D owns independent progress and final QA. A only delivers original media and source provenance.
- **Footage Gate A minimum PASS is not B/C/D final video PASS.**

Source gate/stretch: preferred **30–40** distinct camera angles; Agent A continues scouting additional original NBR sources but final editing no longer needs to wait for the minimum gate.
