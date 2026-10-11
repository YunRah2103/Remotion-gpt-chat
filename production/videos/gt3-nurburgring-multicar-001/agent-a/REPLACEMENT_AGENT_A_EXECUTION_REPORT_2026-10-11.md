# Agent A Replacement — Actual Execution / QA Report (11 October 2026)

## Gate
**BLOCKED**: **3 visually confirmed GT3 manufacturers** (Porsche 911 GT3 R, Mercedes-AMG GT3, **BMW M6 GT3**) and **4 identifiable Nürburgring on-track GT3 source sections**; required >=24 truly unique usable racing camera shots across >=6 manufacturers. Files are native 1080p/4K, but four sections are **not** a 24-shot montage.

## Downloadable real media
- **CURRENT single ZIP**: [GitHub Actions run 38145523182, artifact 11704278933](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38145523182/artifacts/11704278933) — 345,464,711-byte Actions ZIP with 6 native video files, source URL/model/angle/timecode/SHA-256/FFprobe per file, HDR-tonemapped contact sheets, and strict maker/shot status manifest.
- Earlier superseded package: [run 38145035709, artifact 11704620917](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38145035709/artifacts/11704620917), 2 confirmed makes before BMW recovery.
- GitHub-uploaded ZIP **was physically downloaded and its manifest/file entries independently inspected** in the ChatGPT working container. Actions directly downloads and reassembles original source bytes, not URLs-only.

## Critical NEW manufacturer confirmation — BMW
- [4K BMW source recovery Actions run 38145188281](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38145188281), [artifact 11704204180](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38145188281/artifacts/11704204180), source commit `b52bd911fa8cb813541af1d6cfcd01668e0eea29`.
- Official Falken 2018 4K PQ HDR original: https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4 .
- Native 3840x2160 full decoded, **on-track Falken BMW M6 GT3** identifiable at original t~175s with unmistakable BMW kidney grille; section stream-copy native 4K source t=170-182s file SHA-256 `1c0ea944afed876147917dc0c6ed2ab31a9422ecc415100d8619fdbcf0103b89`.
- Real BMW M6 GT3 pit stop at t~245s, source extract t=240-252s, SHA-256 `2f09de34c380da62f213e0f608796d5a7fe0bc5fea87a859178717d4e5768ab3`. **Pit stop is NOT an on-track racing-shot quota addition.**
- Earlier mislabelled teal GT3 at t195/214s **is Porsche, NOT BMW**; this correction remains in force. Do not confuse genuine BMW from t175/t245 with it. BMW is **M6 GT3 (2018)**, not modern M4 EVO.

## New Audi film: source HD verified, GT3 on-track make identity NOT verified
- [Native Vimeo 1080p full-film run 38143817077](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38143817077), [real source artifact 11704042208](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38143817077/artifacts/11704042208).
- Source https://player.vimeo.com/video/277958760?app_id=122963 ; attributed to Audi Sport 2018 24h Nürburgring film, actual video **1920x1080, 25fps, 51.84s**, SHA-256 `53818cf233d04e0ecf354925131b38362015d1338cff9799e1f02680feaff2f0`.
- Viewed full 52-frame timeline and t40-45 rapid-frame race contact sheet; footage includes authentic Nürburgring racing and night action, **but no conclusive GT3 R8 LMS model identification of the actual driving cars at this size/night clarity**, so Audi does **not** count as fourth verified marque. Promotional film also contains interviews, team shots and graphics; restrict editorial extraction.

## Falken 2024 sample: verified native-HD but duplicate publisher aliases
- Original https://skmt.info/wp-content/uploads/2024/09/FALKEN_-HP%E7%94%A8.mp4, genuine 1920x1080, 24fps, 20s, SHA-256 `3631b193900193fb341d36a1b449d0179bd8bdd9f9692869716e592781b3743f`.
- Previous [run 38143067888, artifact 11703681795](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38143067888/artifacts/11703681795). Two filenames are identical video bytes; packaged **once**. Actual brief Porsche 911 GT3 R (992) track shot at ~16-18s; most film is pit crew, driver, branding, non-race action.
- Previous verified native 4K Falken Porsche on-track and Mercedes-AMG GT3 track/onboard excerpts preserved in current ZIP.

## Actual ZIP inventory
1. `FALKEN18_PORSCHE_GT3R_4K_HDR.mkv` (Porsche GT3 racing, 3840x2160)
2. `FALKEN18_MERCEDES_AMG_GT3_4K_HDR.mkv` (AMG GT3 racing, 3840x2160)
3. `FALKEN24_PORSCHE_GT3R_1080.mp4` (brief Porsche racing, 1920x1080)
4. `AUDI_2018_N24_REVIEW_1080.mp4` (Audi-published source film; GT3 running model unverified, 1920x1080)
5. `FALKEN18_BMW_M6_GT3_TRACK_4K_HDR.mkv` (BMW GT3 on-track, 3840x2160)
6. `FALKEN18_BMW_M6_GT3_PIT_4K_HDR.mkv` (BMW pitstop, 3840x2160, **not counted** as on-track racing)

Native 4K Falken originals are 10-bit HDR PQ/BT.2020; **correct HDR-to-SDR tonemapping** mandatory in 8-bit SDR landscape master. No artificial source upscaling. Avoid manufacturer/title overlays/interviews in final video.

## Remaining gap / next agent
Need native-source verified video **Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, Aston Martin Vantage GT3 or McLaren 720S GT3**, plus additional independent on-track BMW/Audi/other angles: current 3/6 marques and 4/24 independently identified racing source sections. Additional 2024-26 GT3 models preferred. Source film publisher marque is insufficient without visually model verified race shot; no named Vimeo model by inference. Do not count repeated angles from same source, and do not claim A PASS based on successful CI/upload. Production Agents B/C/D may use only independently approved cuts from the V2 ZIP to draft partial edits. Final 6-make montage is **not ready**.

## Code commits
- Audi native download/QA: `0dcef76e89634c2ac3f08e90719295f381da0234`.
- BMW 4K evidence: `dfa70098a0a955ca7002db7c82d5ede356ef6a2a`, workflow `b52bd911fa8cb813541af1d6cfcd01668e0eea29`.
- Fixed initial missing FFprobe: `91e59b332b53922a16a10e66d935fcbf97d98b34`.
- Working six-source single-ZIP Actions workflow: `2d835580b20298b8e9793ede64442bd668a17587`.
