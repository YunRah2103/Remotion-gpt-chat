# Agent A — Independent social downloader comparison (11 October 2026)

Repository: YunRah2103/Remotion-gpt-chat; A source branch only.

## Verified successful real downloads

GitHub Actions run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38104203525
Artifact 11688289845 contains safe technical manifest, code-generated research ZIP, no accepted video (both downloaded sources were portrait).

| Backend | Source | Result | Native media |
|---|---|---|---|
| gallery-dl 1.32.16 | TikTok @luxury.speed 7407202646785920287 | Real MP4 downloaded | 1080x1920, HEVC, 13.31s, 1,649,686 bytes |
| Instaloader 4.15.3 | Instagram Reel CwsgJPbMhBL | Real MP4 downloaded | 720x1280, H264, 17.18s, 4,793,442 bytes |
| gallery-dl 1.32.16 | Same Instagram Reel | Login required | None |
| independent tt-dlp 1.4.0 | Same TikTok video | 95-second timeout | None |

Sources are legitimate downloadable media originals for their chosen extractor, but both were portrait reposts. Watermarks, correct exact-model frame identification, and rights have not been separately visually cleared. The original video bytes were removed from the final ZIP under the user's native 1920x1080+ landscape contract. No clean landscape footage or 14 distinct shots delivered.

## Findings

- gallery-dl is a viable TikTok fallback when yt-dlp refuses a link; it actually downloaded a media file on GitHub's cloud-runner.
- Instaloader is a viable direct Instagram Reel downloader on cloud-runner, without using a separate Instagram account in this test.
- Installed/testing as .github/workflows/sto-independent-social-backends.yml and footage/test_independent_downloaders.py, source commit 8ced0a769bcb5fe78d86ec14c1698cd1db7630fd.
- The existing user-set dummy YouTube cookies secret was NOT read, moved, printed or reused for the TikTok/Instagram trial.
- Original unwatermarked 1920x1080/4K STO footage remains the art-direction requirement, and social reposts are typically 9:16.
- Cobalt is a promising distinct multi-site backend. Original upstream github.com/imputnet/cobalt supports Instagram, TikTok (watermark-free when provided) and YouTube, but its API does not offer unrestricted public automation. It should be self-hosted and tested separately; on a GitHub-hosted runner the same IP challenges may still apply.
- BgUtils PO-token provider can improve YouTube stream-request compatibility but cannot promise access through an IP with login/bot checks.

## Next workflow recommendation

Use a multi-backend source collector: direct creator-hosted MP4 first, then gallery-dl for public TikTok links, Instaloader for Instagram Reels, optional Cobalt private API. Run FFprobe for actual dimensions / fps / bitrate, sample real contact frames for watermark and exact STO identity, compare perceptual hashes for duplicate angles, and only package landscape 1920x1080+ clean original MP4s for Agent B.
Never mark a source-acquisition test as a complete cinematic footage gate.