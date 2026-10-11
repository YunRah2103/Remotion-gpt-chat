# Agent A — GitHub downloader benchmark: independent backends and Cobalt 11

**Verified 11 October 2026. Real status: ZERO new native >=1920x1080 landscape Huracán STO MP4s.**

## What was actually installed and run

| Backend | STO source | GitHub Action | Verified native file | Outcome |
| --- | --- | --- | --- | --- |
| gallery-dl | TikTok 7407202646785920287 | 38104203525 | 1080×1920 HEVC, 13.313s, 1,649,686 bytes | Real file downloaded; portrait, reject |
| Instaloader | Instagram CwsgJPbMhBL | 38104203525 | 720×1280 H264, 17.18s, 4,793,442 bytes | Real file downloaded; portrait and below 1080, reject |
| gallery-dl | Instagram CwsgJPbMhBL | 38104203525 | No media (login required) | No file |
| tt-dlp | TikTok 7407202646785920287 | 38104203525 | No media (95 second timeout) | No file |
| Official self-hosted Cobalt 11 | TikTok 7407202646785920287 | 38132866967 | **Exactly identical SHA256 to gallery-dl TikTok file** | Same portrait/bitrate/quality |
| Official self-hosted Cobalt 11 | Instagram CwsgJPbMhBL | 38132866967 | **Exactly identical SHA256 to Instaloader Instagram file** | Same portrait/bitrate/quality |
| Official self-hosted Cobalt 11 | Lamborghini YouTube egjLBe6lMXU | 38132866967 | No downloadable source; Cobalt API HTTP 400 | Blocked |

## Cryptographic verification

**TikTok:** gallery-dl and Cobalt both delivered SHA256
`a09d9527702daa272a0a736792f52cb7aecb4f4c1b1b9554f92e46bfef7c7cb8`, native 1080×1920, HEVC, bitrate approximately 991,300bps.

**Instagram:** Instaloader and Cobalt both delivered SHA256
`431b7bc2743a3f19d163b369e1a84a2d26b5efb6f65a6c5031421c75386a4243`, native 720×1280, H.264, bitrate approximately 2,232,115bps.

Nothing was upscaled. All portrait originals were excluded from deliverable.

## Scripts and workflows

- [Independent backend benchmark](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38104203525), artifact ID 11688289845 (results only).
- [Official Cobalt 11 container benchmark](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38132866967), artifact ID 11699593194 (results only).
- `production/videos/huracan-sto-v10-001/footage/test_independent_downloaders.py` + `.github/workflows/sto-independent-social-backends.yml`.
- `production/videos/huracan-sto-v10-001/footage/test_cobalt_selfhosted.py` + `.github/workflows/sto-cobalt-selfhosted-test.yml`.

## Recommendations for future acquisition

1. TikTok: **gallery-dl** is fast and genuinely downloads clean playback files; choose if output has acceptable native landscape resolution.
2. Instagram: **Instaloader** downloads some public Reels without login; classify native resolution before deciding suitability.
3. **Cobalt 11** works on GitHub Actions as an isolated Docker service. It is a useful provider fallback, but returned identical files for the two known social sources.
4. **yt-dlp** remains supported for other publisher platforms. The YouTube dummy-account cookie + EJS + Deno + six-client tests still hit bot gate from GitHub cloud runner.
5. For this user's specific 16:9 FullHD/4K no-watermark STO film, switch source strategy to **native filmmaker masters/direct production clips**, not social vertical reuploads.

**STRICT GATE A: FAIL.** No independent verified 14 moving distinct road STO angles. No false claim that successful CI or downloader access equals delivered footage. Agent B and D should keep this block visible.

## Additional independent Cobalt filmmaker-film test — 11 October 2026

Run: [GitHub Action 38133084904](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38133084904); artifact ID **11699937668** (manifest-only).

Four genuine STO filmmaker productions tested via a properly started local Cobalt 11 instance:

| Filmmaker video | Vimeo video ID | Result |
| --- | --- | --- |
| Clint Davis / John Schumacher Huracán STO | 566128123 | Cobalt API HTTP 400; no media downloaded |
| Elias Maria Lamborghini STO | 808787211 | Cobalt API HTTP 400; no media downloaded |
| Movie Magic / Mark Jenkinson STO Daytona | 529262404 | Cobalt API HTTP 400; no media downloaded |
| Lamborghini Behind the Story STO (Movie Magic) | 513872033 | Cobalt API HTTP 400; no media downloaded |

Implementation: `production/videos/huracan-sto-v10-001/footage/test_cobalt_vimeo_sto.py` and `.github/workflows/sto-cobalt-vimeo-originals.yml`. This explicitly verifies native FullHD and SHA256 before inclusion, but produced zero accepted files. The API's HTTP 400 is not proof about the source film's actual resolution or whether its owner has a downloadable master.

**Summary:** Cobalt is a working independent downloader for TikTok/Instagram on GitHub but yielded no upgrade for the two tested portrait social posts and could not access these four Vimeo projects. Gate A remains failed; users' 1920×1080 landscape source requirement is not met.