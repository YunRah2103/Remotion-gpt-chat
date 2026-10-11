# YUNEX GT3 MULTI-CAR 001 — AGENT A2 — Actual acquisition and QA report

**Status: BLOCKED — 0 qualifying native-HD moving Nürburgring GT3 clips acquired. This is not an approved footage delivery.**

Date: 2026-10-11
Own branch: `automotive-edits/gt3-nurburgring-multicar-001/a2-ferrari-aston-mclaren`
Scope: Ferrari 296 GT3, Aston Martin Vantage GT3, McLaren 720S GT3 EVO only.

## Physical acquisition work performed

- Read locked PRODUCTION_CONTRACT.md, Agent A prompt, replacement handoff V2 and predecessor acquisition reports, checked issue #26.
- Committed isolated A2 real-media source discovery JSON, bounded publisher / direct MP4 / yt-dlp / gallery-dl / Instaloader downloader, native FFprobe resolution gate, FFmpeg full-decode gate, SHA-256 fingerprinting, screenshot contact sheets, ZIP and source manifest generation.
- Conducted 2 independent GitHub Actions real-run tests:
  - First: [run 38150213659](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38150213659), [diagnostic artifact 11706227294](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38150213659/artifacts/11706227294), commit `ce38fe96b42b90c0fef6885ff0f2ee097855b92c`.
  - Second: [run 38150551631](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38150551631), [diagnostic artifact 11706459091](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38150551631/artifacts/11706459091), commit `c577d578fc52ce4001bfb26335d1f7f9bdcfaaea`.
- Second outer Actions artifact 18,822 bytes, ZIP SHA-256 `36411426655f2d67a9d640eddeac1629b1c25a634575fc1b4e5d8ec957b5b1b4`; inner A2 QA ZIP 18,592 bytes, SHA-256 `f0cec5dca3e1a705a8906f3b7f4d9435f2a450ad34f1100cdbe1241fc25f7d25`. **The archives only hold manifest, logs, source failures and README; NO VIDEO bytes.**
- Native resolution >=1920x1080 and decode checks run only after actual retrieved files; no pretend FFprobe/decode/visual QA. All 17 tested webpage / individual-post candidate attempts failed before that point.

## What failed, by route

| Route | Attempts / observed outcome |
| --- | --- |
| Ferrari NLS9 real-event publisher press and race news, manufacturer Ferrari.com, Verstappen/Autosport/F1 fan pages | Some sites replied HTTP 403; others lack playable direct video URLs or yt-dlp support; zero actual media. |
| Official Aston 2025 N24 media pages / Walkenhorst | No retrievable actual video returned; press galleries primarily still photos; zero media. |
| McLaren Dörr/team and Nürburgring/GTC page leads | Article/team pages did not expose retrievable qualifying original media; zero media. |
| Exact Instagram post `https://www.instagram.com/p/DPGTj5_jRdD/` | gallery-dl timed out; Instaloader did not retrieve an original video. Not a qualifying asset. |
| Exact Instagram post `https://www.instagram.com/p/DO_SQVKCkMy/` | Instaloader retrieved a JPEG photo, not a racing video, so rejected. |

Specific strong **race identity references** (not video): Ferrari #31 and Walkenhorst Aston #34 raced in NLS9, 27 Sep 2025; Nürburgring's official report documents them. Ferrari Frikadelli #30 raced/won 2023 N24. McLaren 720S GT3 EVO #69 ran Nürburgring N24 2026, but NOT Dörr's 2025 N24 entry (that was an Artura Trophy EVO). None of these source articles is proof of retrieved video.

## Explicit acceptance ledger

| Make | Actual qualifying media downloaded | Unique verified on-track angles | Status |
| --- | ---: | ---: | --- |
| Ferrari 296 GT3 | 0 | 0 | BLOCKED |
| Aston Martin Vantage GT3 | 0 | 0 | BLOCKED |
| McLaren 720S GT3 EVO | 0 | 0 | BLOCKED |
| **A2 TOTAL** | **0** | **0** | **BLOCKED** |

A2 has **no deliverable editor-grade footage**. Both diagnostic ZIP artifacts above are non-footage archives. The workflows reporting process success do **not** indicate real media success. Agent A baseline footage and A2 are separate; A2 contributed no new manufacturer coverage. No changes to Agent A, Agents B/C/D or `YunRah2103/yunus-video-lab`.

## Next acquisition direction for whoever continues A2

Target source-level original MP4s or exact publicly accessible per-post videos from 2023 Frikadelli Ferrari N24, 2025 NLS9 Ferrari/Aston start, 2026 N24 Walkenhorst Aston and Dörr McLaren #69. Do **not** repeat generic editorial article pages; request authorised original 1080p/4K footage from race producers/teams if blocked. Quality first: one demonstrably moving, visually verified, native-resolution MP4 beats twenty speculative URLs.

**24-shot six-make production gate remains FAILED.**
