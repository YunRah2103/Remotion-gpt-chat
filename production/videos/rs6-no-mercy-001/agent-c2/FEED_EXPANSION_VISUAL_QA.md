# C2 additional native-HD source acquisition and editorial visual QA — 2026-10-13

## Verified executable result
- Independent source discovery on **@glenmoreaudi** found **21 RS6-captioned TikTok posts** in 90 inspected feed entries. Previously vetted #52 black RS6 source intentionally excluded.
- New live GitHub Actions [run 38368943233](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38368943233) **PASS**, video probe ran on independent Ubuntu runner, all four selected original posts fully acquired as transient ~8s MP4 excerpts, **FFprobe + complete video FFmpeg decode passed**, **native 1080x1920 HEVC**. [Artifact 11797891898](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38368943233/artifacts/11797891898), 29 files, metadata plus JPEG contact sheets; no unlicensed source clips published. Artifact ZIP SHA256 from GitHub log: `a8274d5f298d669ca1a9dc099f4bac9e4c93d485ea81def3cd03a1e0cb7c4886`.
- Source acquisition/live QA implemented in `scan_creator_feed.py` and `.github/workflows/rs6-c2-feed-discovery.yml`; no guessed media. Raw MP4s automatically discarded at end of each individual source trial. The public artifact is **QA only, not an editor-ready MP4 pack**.

## Visually inspected contact sheets — C2 ranking

| Rank | Creator original | FFprobe | Extracted source SHA256 | Observed source frames | Editorial verdict |
|---|---|---|---|---|---|
| 1 | [Custom green C8 RS6](https://www.tiktok.com/@glenmoreaudi/video/7616094158398246165) | 1080x1920 HEVC 24fps; 8.125s | `810f957a7536606371573e877fb31e3740fc61ff5039008b7f789a2536a6367c` | 0.4s illuminated RS sill; 1.1s wheel+RS caliper; 2.0s green full-car wide; 3.2s RS6 grille emblem; 4.7s frontal LED; 6.5s cockpit | **Strong component variety.** Wheel and grille best as 0.2–0.5s flashes if licensed. Clean studio, different green color from prior black RS6; consider B&W. Parked, not driving; 24fps source. |
| 2 | [2025 RS6 Blue Plus interior](https://www.tiktok.com/@glenmoreaudi/video/7615694799869349140) | 1080x1920 HEVC 30fps; 8.5s | `0b8bb0caa594308e9a088662427410ebb81ab1d2731e7706e97574c31e2ebaaa` | 0.4–2s electric-blue ambient cabin, 3.2s cockpit, 4.7s RS illuminated sill, 6.5s RS seat emblem | **Interesting atmospheric blue bridge**, not wheel/exhaust motion; clean dark cabin detail. |
| 3 | [RS6 Nogaro Blue Performance tail/exhaust](https://www.tiktok.com/@glenmoreaudi/video/7616084230715526420) | 1080x1920 HEVC 30fps; 8.1s | `6f9e08011702b03caccf6ca6a688af8eef421f9d4c75b8faed7661a7695ceefd` | 2s RS6 rear badge and oval exhaust, 3.2s rear exhaust, 4.7s front grille, 6.5s parked full-car | **Conditional**: unique oval-exhaust closeup, but exposed bright daylight and wrapping reveal; minimal fast <0.5s monochrome crop only if it fits edit. |
| DEDUPE | [Custom green duplicate post](https://www.tiktok.com/@glenmoreaudi/video/7616103010497858817) | 1080x1920 HEVC 24fps; 8.125s | `e9662ec812f65be21272e586e7538a27f76f4fa79e35d190ed0b8f3d2ec8ddd9` | SIX inspected timestamps match item #1 contact sheet exactly | **REJECT as visually duplicated footage**, despite different source bytes. |

### Against first black RS6 source
- The earlier [black C8 source](https://www.tiktok.com/@glenmoreaudi/video/7482802812783512887) remains visually strongest for integrated LED/front fascia/wheel/rear taillight 0.2–0.6-second cadence and color cohesion; see [QA_REPORT.md](./QA_REPORT.md).
- Keep blue interior a one-off cool-color atmospheric beat. Do not construct a multi-car montage from these separate blue/green/black source cars. Green studio wheel is potentially a single monochrome insert to reduce mismatch.
- None of the new clips is a **moving-wheel** shot or full-motion exterior hero; they cannot replace A2/B2 driving. Source HEVC bitrate ~0.85–1.05 Mbps is relatively compressed even with 1080x1920 pixel dimensions, so judge sharpness at playback on-device; native dimensions alone do not imply pristine cinema quality.
- C2 media source review [#53](https://github.com/YunRah2103/Remotion-gpt-chat/issues/53) requests explicit re-edit and source-redistribution rights for the three unique posts; current rights status **UNCONFIRMED**. Do not release raw footage publicly.
- 0 legally cleared/verified video-bearing Actions artifacts so far. QA contact sheets are evidence, not footage delivery.

## Next feasible C2 action
Upon permission evidence in #52 or #53, use the original creator clip(s) and a permission-limited pipeline to extract the selected 0.2–0.6s details, create MP4 files, full-decode them again, generate SHA256/manifest and publish a rights-appropriate deliverable accessible to Manager F. If only re-edit/publish rights (not raw source redistribution) were granted, do not put the MP4 sources in public GitHub Releases/Artifacts.
