# Agent A — Real BMW M5 footage handoff (REVIEW, not READY)

**Branch:** `automotive-edits/bmw-m5-evolution-001/a-footage`  
**Research code source commit:** `d4663982a640ab1e913ef3a820502fab4a7fa826`  
**Status:** `review`. Real moving 42 cuts are AVAILABLE as a GitHub artifact. **Not fully editorially approved.**

## Actual deliverables

**[42 actual BMW M5 clips — GitHub Actions artifact 11668700332](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38047298176/artifacts/11668700332)**, run **[38047298176 (SUCCESS)](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38047298176)**. File names `e28-01.mp4` ... `g90-06.mp4`, with 42 original-segment timecodes, source/clip SHA256, actual native stream dimensions/FPS, all-source metadata, contact sheet and 42 full decode/motion checks. Retention initially 7 days. Nothing was committed as a public MP4 Git blob or release. Archive access is subject to GitHub permissions.

`footage/provisional-cuts.json` is the authoritative generation/slot/source timestamp mapping. `footage/build_review_bundle.py` reassembles these cuts directly from original sources. Asset production was performed by existing **isolated GitHub Actions** with real native media.

Research: BMW PressClub originals in [8-source artifact 11667643927](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38045881998/artifacts/11667643927), and dedicated authentic 1920×1080 **E28** driving MOV (not a still) in [artifact 11666924618](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38046928757/artifacts/11666924618).

## Source coverage

| Generation | Year | Slots | Source native dimension | Primary real source | Editorial status |
|---|---:|---:|---:|---|---|
| E28 | 1985 | 1–6 | 1920×1080 | Dedicated authentic BMW Group 2016 driving master | Good candidate; camera variety to approve |
| E34 | 1988 | 7–12 | 480×360 | Mixed 2005 BMW Group M5 formation/slalom footage | BLOCKER: other generations clearly appear |
| E39 | 1998 | 13–18 | 480×360 | 2000 Nürburgring BMW Group historical film | Technically valid; low resolution |
| E60 | 2005 | 19–24 | 480×360 | 2005 BMW Group country-road tracking footage | Technically valid; low resolution |
| F10 | 2011 | 25–30 | 540×304 | 2011 BMW Group Ascari track footage | Technically valid; low resolution; HD upgrade job running |
| F90 | 2017 | 31–36 | 1920×1080 | 2017 BMW Group Estoril master | Good visual variety |
| G90 | 2024 | 37–42 | 3840×2160 | 2024 BMW Group M5 driving footage | 4K dimensions; source bitrate still matters |

Note: each extracted cut is 0.80s of genuine source video; beat-map clips are only about 0.4–0.5s after Agent B/C trim. Agent C must adjust source in/out to beat-map frames and independently verify there is no static/repeated shot or unsuitable frame at the final exact timing.

## Blocking issues

1. **E34 is not acceptable for final signoff:** the 2005 archival source is mixed-generation formation/slalom. Several clips show E28, E39 or E60 cars in addition to an E34. Prevent wrong-generation content dominating the frame. Obtain six isolated, genuinely distinct high-quality E34 shots or redesign its framing; do not label unrelated cars E34.
2. **Archive sharpness:** E34, E39, E60 and F10 clips are real but native archive-preview resolution. They must not be stretched into a 1080×1920 centre crop with fake resolution. Use a deliberate framed vintage-treatment or improve by downloading the genuine native masters. Existing source quality upgrade job `38047365846` targets 1920×1080 F10 and 1024×576 E39 (pending/verify separately).
3. **No public publishing rights are claimed** for the BMW or other footage and no final soundtrack is in this bundle. Only use for review while rights remain unresolved.
4. Temporal motion > threshold and full FFmpeg decode tests passed all 42 **but do not certify creative uniqueness or correct generation in every frame**.

## Master / Agent B handoff

Read `provisional-cuts.json`, download artifact **11668700332** from run **38047298176**, unpack 42 individual MP4 files, validate SHA and contact sheet. Map strictly E28 slots 1–6, E34 slots 7–12, E39 13–18, E60 19–24, F10 25–30, F90 31–36, G90 37–42. Treat E34 as a block requiring editorial replacement; low-res sources as review-only. Preserve all original source rights provenance and never leak the private song into public GitHub releases.

## QA evidence

- Actual 42-cut native runner, GitHub Actions **38047298176**, completed SUCCESS; FFmpeg decoded all 42 cut MP4s, source/clip hashes produced, image-motion difference tested, real visual contact sheet output.
- Historical source real footage download run **38045881998** and 1080p E28 archive run **38046928757** completed.
- Earlier preparation 4/4 unit tests, run **38014477573**.
- Initial incorrect generation matches during the first acquisition run **38045592362** were explicitly rejected after inspecting actual frames. Only the corrected later run should be used. The first run is NOT part of the final generation mapping.
