# Agent B — first REAL racing-footage cut, 11 October 2026

**Branch:** `automotive-edits/gt3-nurburgring-multicar-001/b-cinematic`  
**Tracking:** #26  
**Footage provided:** five ChatGPT uploads, Agent A V9 files 1–4 plus Agent A2 Aston/McLaren ZIP. 21 unique source files, 22 editorial selections.  
**Local rendered video:** 1920x1080, 30fps, 316 frames (10.5333 seconds), 22 cuts, 6 actual marques attributed to source manifests. Audio is the original user-provided soundtrack, without invented sound effects. SHA256 rendered MP4: `353b5ee1548057346e0193a7e3d2e3f86aa103d26778f5cef4392de93a66ceb8`.

**Artifact location warning:** The real MP4 and full source media were built from user-attached ZIPs in the ChatGPT sandbox and delivered there. They are **not** in GitHub, and there is **no** GitHub Actions real-film artifact yet. Do not mistake the previous `GT3-B-TIMING-PROOF-NOT-FOOTAGE` Actions artifact for this render.

## Native real footage source selection

The timestamps below are in original media seconds; output bounds are exact 30fps frame indices (end exclusive). All source filenames are basenames to find recursively inside the user-delivered ZIPs. Do not substitute “REVIEW ONLY” clips. Git cannot render the release composition with missing local source media.

| Cut | Frames | Make | Original media basename | In (s) |
|---|---|---|---|---:|
| 01 | 0–10 | Porsche | `P26_FALKEN_WHITE_MINT_911_GT3R_FRONT_51_native4k_SDR.mp4` | 0.50 |
| 02 | 10–23 | BMW | `FALKEN18_BMW_M6_GT3_TRACK_4K_HDR.mkv` | 4.65 |
| 03 | 23–34 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_AERIAL_TRACK_2020_CAMERA.mp4` | 1.65 |
| 04 | 34–45 | Aston Martin | `ASTON21_04_HEADLIGHTS_ATTACK.mp4` | 0.60 |
| 05 | 45–63 | Audi | `AUDI_R8_LMS_GT3_2018_N24_T35_1080.mp4` | 0.36 |
| 06 | 63–78 | Ford | `NBR_HRT_FORD_MUSTANG_GT3_NUMBER64_TRACKSIDE_APPROACH.mp4` | 0.20 |
| 07 | 78–90 | Porsche | `2026_PORSCHE_GT3R_GOROYAN4_NATIVE_UHD_TRACKSIDE_SIDE_T43.mp4` | 0.17 |
| 08 | 90–103 | Aston Martin | `ASTON21_01_CORNER_EXIT.mp4` | 0.72 |
| 09 | 103–115 | BMW | `NBR_TV_N24_BMW_Z4_GT3_WET_TRACK_NATIVE_1080.mp4` | 14.75 |
| 10 | 115–132 | Ford | `hrt_ford_2026_entire_original.mkv` | 79.98 |
| 11 | 132–140 | Mercedes-AMG | `NBR_HRT_MERCEDES_AMG_GT3_REAR_NORDSCHLEIFE.mp4` | 0.18 |
| 12 | 140–158 | Porsche | `F18_PORSCHE_911_GT3R_FRONT_NORDSCHLEIFE_193_native4k_SDR.mp4` | 0.28 |
| 13 | 158–170 | Aston Martin | `ASTON21_02_MULTI_CAR_BATTLE.mp4` | 0.50 |
| 14 | 170–187 | Porsche | `2026_PORSCHE_GT3R_LIONSPEED24_NATIVE_UHD_REAR_T45.mp4` | 1.00 |
| 15 | 187–201 | Porsche | `P26_RED_BLACK_911_GT3R_TRACKSIDE_10_native4k_SDR.mp4` | 0.42 |
| 16 | 201–212 | Aston Martin | `ASTON21_06_REAR_CORNER.mp4` | 0.70 |
| 17 | 212–224 | Mercedes-AMG | `hrt_24hnbr_night.mkv` | 11.90 |
| 18 | 224–240 | Aston Martin | `ASTON21_07_BANKED_SWEEP.mp4` | 0.53 |
| 19 | 240–254 | Ford | `hrt_ford_2026_entire_original.mkv` | 39.92 |
| 20 | 254–275 | Porsche | `P26_PURPLE_GREEN_911_GT3R_PROFILE_13_native4k_SDR.mp4` | 0.00 |
| 21 | 275–291 | Aston Martin | `ASTON21_03_REAR_TRACK_APPROACH.mp4` | 0.45 |
| 22 | 291–316 | Porsche | `P26_YELLOW_911_GT3R_REAR_CORNER_08_native4k_SDR.mp4` | 0.00 |

## QA / remaining actions

- A real first-cut MP4 was locally decoded successfully with H.264 1920x1080 yuv420p, 30fps, **316** frames; original MP3 converted to AAC 48kHz. Audio SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`.
- Inspect native quality and actual car identity per shot before final release. Source names and supplied manifests were used for make identification; independent full-frame identity validation is outstanding.
- Six marques: Porsche (7 shots), BMW (2), Mercedes-AMG (3), Aston Martin (6), Audi (1), Ford (3). **No Ferrari** footage was available; the supplied McLaren native image was 1916x1078 and marked review-only; Lamborghini clips were portrait. All three were excluded.
- The 4K PQ HDR BMW source is explicitly tonemapped to SDR/Rec709, not simply tagged 8-bit.
- All included footage inputs have native dimensions at least 1920x1080. Distinct editorial selections do not mean 22 unique independently filmed events; 21 source files were used and some originated from the same original film.
- Weak spots worth revisiting: washed/soft/partial Audi 2018 shot, several quick-cut distant cars, car-identity validation, final engine sound design by Agent C, and formal Agent D QA.
- The user received a separate download of `YUNEX_GT3_MULTICAR_AGENT_B_REVIEW_V1_1080P.mp4` plus `YUNEX_GT3_AGENT_B_REAL_EDIT_HANDOFF.zip` (containing video, local source SHA mapping, original soundtrack, frame-contact sheet and QA report) through ChatGPT; Github cannot access that attachment via the source branch alone.
- Do not mark final video, sound design, copyright/provenance, or GitHub upload gates PASS until separately verified.
