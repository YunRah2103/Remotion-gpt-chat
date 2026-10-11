# Agent A — Real Nürburgring GT3 source-media V5 inspection (11 October 2026)

## Production status (before and after native editor cut build)
**Global footage Gate A remains BLOCKED until at least 24 independent camera views and six confirmed GT3 manufacturers are physically verifiable in a single current source package.** Existing V4 baseline: 4 named GT3 makes (Porsche/Mercedes-AMG/BMW/Audi), 6 independently recognized on-track source sections. A2 works solely on Ferrari/Aston/McLaren and has its separate Aston original deliverable. No changes to Agents B/C/D or other repository.

## Physical additional sources successfully acquired (authentic original video bytes)

### NEW original 2018 4K HDR Falken Nürburgring source offsets
- [Acquisition run 38153462359 / video artifact 11707039208](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153462359/artifacts/11707039208), **243,360,095-byte actual-media ZIP**, four *separate downloaded source excerpts* not four automatically approved independent GT3 camera angles.
- All four decoded natively **3840×2160 H.264 10-bit PQ HDR** from official manufacturer full film `https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4`, stream copied, FFprobe, full FFmpeg video decode, SHA-256, six-frame preview each:
  - `PORSCHE_GT3_TRACKSIDE_190_CANDIDATE` source t=190–197.5; several genuinely moving green Porsche 911 GT3 racing camera cuts.
  - `PORSCHE_GT3_TRACKSIDE_198_CANDIDATE` source t=198–204.5; fast passing green Porsche followed by uphill trackside head-on Porsche shot near t=202.
  - `FALKEN_NIGHT_RACING_270_CANDIDATE` t=269–277; brief race onboards with overlay and major lightning/landscape shot; **not counted as unambiguously identifiable new-model standalone race angle**.
  - `FALKEN_WET_NIGHT_RACING_280_CANDIDATE` t=278–288; fog, forest aerial tiny car, headlights; **GT3 model not independently proven, not counted**.

### NEW original 2026 Porsche NewsTV Nürburgring film cropped to real original UHD pixels
- [Acquisition run 38153571340 / video artifact 11707104373](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153571340/artifacts/11707104373), **263,317,572-byte actual-media ZIP** including an exact **205,843,414-byte source original** (native **3840×3840** square, runtime 60.0s, SHA-256 `f7beed35af45dcc81bdbef31d734ea98ddf68f0e7588540b322fd8c2a6873b4c`), plus **FIVE playable H.264 3840×2160 full-bleed source-pixel crops** from the Nürburgring race story, individual 3-frame sheets and source SHA manifest.
- Original direct MP4: `https://newstv.porsche.com/porschevideos/newstv.porsche.com_334359_en.mp4`.
- 16:9 crops use native `crop=3840:2160:0:840`. **No 720p upscale, no stretched source image.** All five clips independently FFprobed and full decoded. Extracted windows around original t=1.2, 8, 12.5, 16, 49.5.
- IMPORTANT: Cropped section at original 2s contains darkness and `HOUR 24` title, **exclude**; 14s has large `Lionspeed GP` title, crop to the preceding racing shot only; original 17.8s onward is spectators, excluded; 50–52.3s shows clear mint-white Falken Porsche 911 GT3 R front in race action.

## Independent real-frame model and camera identity audit
Original media 6- and 3-frame proofs from **both physical video archives** were downloaded by GitHub workflow [run 38153784443](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153784443), then reconstructed and **actually inspected**. This was not classification inferred from publisher URL. Editor-select plan:

| Original GT3 shot | Source time | Camera identity | Decision |
|---|---:|---|---|
| 2018 green/teal Porsche 911 GT3 R front/trackside | 192.45–193.90s | Close frontal, distinct filming position | **ACCEPT** |
| 2018 close green Porsche pass | 195.3–197.0s | Adjacent source footage with potential similarity to previous camera | **REVIEW ONLY for dedup** |
| 2018 green Porsche 911 GT3 R head-on crest | 201.5–203.3s | Independent hill-top telephoto crest approach | **ACCEPT** |
| 2026 yellow Porsche 911 GT3 R rear at forest bend | 8.18–9.11s | Wide rear corner long lens | **ACCEPT** |
| 2026 red/black Porsche 911 GT3 R close race pass | 9.25–11.0s | Different trackside frontal/flyby camera | **ACCEPT** |
| 2026 purple/black-green 911 GT3 R side drive | 12.58–13.38s | Independent tight profile pan; title follows | **ACCEPT** |
| 2026 distant white GT3 at GP straight | 16.13–17.05s | Independent distant camera; exact model not clear enough | **REVIEW ONLY** |
| 2026 mint-white Falken Porsche 911 GT3 R clear head-on | 49.67–52.52s | Dedicated continuous frontal trackside camera | **ACCEPT** |

**Six strong new independent track-moving Porsche GT3 shots confirmed by source contact sheets** and two extra usable-cut candidates flagged review, subject to final actual output cut QA on the V5 workflow. If all six selected editor cuts pass decode and source proof, our standalone A package would become **12/24** independent clear GT3 sections across **4/6** makes, not a false 24-shot/6-make PASS. All added shots expand scene diversity but not manufacturer diversity.

### Independent Agent A2 parallel Aston success (do not silently merge branches)
Agent A2 issue evidence [#26 report](https://github.com/YunRah2103/Remotion-gpt-chat/issues/26#issuecomment-6110868135): original 2025 NLS Aston Martin Vantage GT3 #21, native 1920×1088 (cropped 4px to real 1920×1080); seven reportedly unique GT3 camera angles, native original and per-file SHA proof. [A2 footage run 38152947773 / artifact 11707895294](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38152947773/artifacts/11707895294), 49,410,589 bytes; [A2 corrected QA run 38153173855 / artifact 11707506666](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153173855/artifacts/11707506666), 48,201,368 bytes. **This brings the candidate cross-agent make total to five, pending full independent merge QA.** Original Agent A's current branch footage count is not inflated by unmerged A2 shorts.

## Additional failed routes independently tested — don't claim source downloads as new footage
- The Tire Magazine 2024 Falken full original MP4 actually downloaded, actual **1280×536** (not production eligible); [run 38152503589](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38152503589).
- Exact 2026 FORMAT67 filmmaker original MP4 fetched, native **2048×858** (858 high <1080); two trailers native **1080×1080** and **1500×1080** (both <1920 wide). All under contract minimum and rejected; [run 38153043899](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153043899).
- Motorsport 2023 Nürburgring 24h highlight provider URLs returned 404; 2025 DTM player extractor unsupported, so zero actual HD videos; [run 38152964671](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38152964671).
- Existing blocked Vimeo, Dailymotion, social enumeration and YouTube sources NOT naively retried.

## Actual V5 single source ZIP builder
- Code: `agent-a/build_verified_editor_source_v5.py`, commit `93209b17a72a67cece1c32c1ffb9c520f131e50b`: GitHub Actions downloads genuine three earlier media artifacts V4, Falken 2018, Porsche 2026, ensures **8 V4 originals are byte-identical SHA-256**, produces frame-accurate 3840×2160 H.264 CRF17 new scenes, correctly HDR-tone-maps 2018 PQ source to SDR BT.709, full FFprobe/decode, creates 3-frame proof and new complete manifest.
- Workflow: `.github/workflows/gt3-a-v5-native4k-editor-combined.yml`, commit `e6be7ada54b872f8d53133eeb3fda04d0634e41e`, [Actions run 38154006731](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38154006731). The run was in progress when this file was drafted: **do not claim merged source ZIP success until completed artifact/manifest confirmed**.
- No synthetic cars, no screen grabs masquerading as video, no false make labels, no unnecessary black letterbox, no source-original upscaling. **Remaining source priorities: actual native-HQ Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, McLaren 720S GT3 EVO and more unique racing camera views**.
