# YUNEX footage acquisition: live cross-platform reliability audit

Date: 11 October 2026 (GitHub-hosted runners, no personal PC)
Status: Empirically tested on public example media. Different individual posts may behave differently.
This test material was inspected transiently. No unrelated third-party social footage was redistributed by test artifacts.

## Strongest evidence — actual production extraction functions, complete FFmpeg decoding

Source code directly exercised: `production/footage_rescue/acquire.py` (`ytdlp`, `ytdlp_chrome`, `examine`, full FFmpeg decode).
Evidence: [original production-code test](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38159783975) and [Lamborghini car test](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38159913823).

| Source | Plain yt-dlp | Chrome impersonation | Native best produced | Duration | Audio |
|---|---|---|---|---|---|
| Instagram Reel `DZdOSuOyu2E` | PASS | PASS | **1088x1936, 30 fps, VP9** | 80.04s | Yes |
| Lamborghini STO Instagram Reel `CwsgJPbMhBL` | PASS | PASS | 720x1280, 30 fps, H264 | 17.18s | Yes |
| TikTok `7676146052470230294` | PASS | PASS | 576x1024, 30 fps, HEVC | 25.93s | Yes |
| Lamborghini STO TikTok `7407202646785920287` | PASS | PASS | **1080x1920, 29.97 fps, HEVC** | 13.31s | Yes |

Additional independent-sample checks: [second public sample](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158181541)
- Second TikTok public post `7669239993541463309`: both yt-dlp and Chrome succeeded (576x1024, 8s).
- A separate Instagram Reel `DLY-pUiRU88` was unavailable to both extractors with API/empty-media login-access response. Instagram is demonstrably URL-dependent.

Other social tools: [social extractor matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38157969479)
- TikTok gallery-dl PASS real video; Instagram gallery-dl timed out.
- HTTP HEAD for a post is *not* a video download. Not counted as proof.

## YouTube

[Eleven extractor attempts and direct control](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38157590842):
- 11 actual YouTube extraction attempts failed, including stable and updated yt-dlp, multiple embedded/desktop/mobile player client modes, Chrome impersonation, Pytubefix, You-Get.
- Explicit YouTube response: `Sign in to confirm you're not a bot` / `LOGIN_REQUIRED`.
- Direct CDN MP4 control **PASS**: 5,635,415 actual bytes from an openly licensed Blender source, FFprobe 720x480, 30s, 3s FFmpeg proof. This was **NOT** downloaded from YouTube.
- [Windows and macOS runner checks](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158355197): both failed the same test.
- [Public Piped / Invidious API tests](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158375906): six public endpoints failed (HTTP 403, 502, 526 or other remote access error). No YouTube video bytes acquired.

**Verdict: YouTube direct extraction is NOT verified to work from GitHub-hosted runner in these tests; do not claim otherwise.**

## Alternative legitimate video sites

[Real 5-second media proof](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38159710279)
- Blender's PeerTube `video.blender.org`: PASS, 5s segment at 852x480, FFmpeg decode, available formats up to **720p** for the chosen film.
- Dailymotion: PASS, 5s segment at 512x416, FFmpeg decode, chosen film exposes **only 480x384** in available stream metadata (the decoded frame is 512x416).
- Vimeo official Blender: FAIL; yt-dlp explicitly requires account login for tested ordinary watch URL. [Vimeo embedded-player follow-up](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38159934656) failed too.

**Verdict: PeerTube and Dailymotion have functional download transport, but these test examples lack native vertical 1080 resolution. Vimeo not verified accessible on GitHub runner.**

## What agents should do

1. For Instagram/TikTok sources where acquisition/use is permitted, try the production `yt-dlp` function; if blocked try `yt-dlp-chrome`; TikTok `gallery-dl` is another proven fallback.
2. Apply FFprobe/FFmpeg quality checks. For *native* 1080x1920 edits require `nativeVertical1080CropPossible: true` rather than relying on video height >=1080 alone. In particular a 720x1280 portrait video **cannot** provide native 1080x1920 without upscaling. Check FPS, watermark, distinct angles and visual subject manually.
3. Continue sourcing official manufacturer press files, creator-authorised direct HTTPS MP4s, or manufacturer-controlled media; direct file download via GitHub is verified. For YouTube-only films, ask the filmmaker for original downloadable files instead of repeated attempts from the same blocked hosted IP.
4. Store only media that the user is permitted to acquire/use; avoid browser cookies and passwords in this public GitHub repository.

### Integration status
The new workflow and tests are on branch `feature/footage-rescue-multisource-20261011`. PR #29 was observed **closed and not merged** on 11 October; the new workflow is **not available from main's standard Actions manual-run UI**. Nothing in this audit merges or edits main or existing production movies.

## Additional social-platform extension (11 October 2026)

Proof: [16-entry social extractor matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160397393), [second X video-post probe](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160498526), [best-quality tests](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160590802), [Porsche-specific six-post best-quality test](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38162011170).

| Source | Media transport verdict | Best native resolution observed | Notes |
| --- | --- | --- | --- |
| **Twitch** | PASS real native video | **1920x1080 ~60fps** | Landscape, source was a gaming clip, not a cinematic car source |
| **X / Twitter** | PASS on two videos | 720x1280 ~30fps, and 1280x720 ~30fps (different posts) | An old Periscope video failed (not a general X block) |
| **Pinterest** | PASS on four video Pins | **720x1280 ~24-30fps** | Three independent Porsche GT3 RS Pins all passed at 720x1280; not native 1080 portrait |
| **Snapchat Spotlight** | PASS on three public samples | **540x960**, 540x302 on different posts | Two GT3 RS examples passed, another Porsche link was unavailable (HTTP 404); low native source quality |
| **Bluesky** | PASS small video, FAIL best stream retry | 1280x720 30fps on small sample | Best-quality attempt encountered broken/prematurely terminated stream; treat as inconsistent |
| **Reddit** | FAILED tested URL | None | Account authentication required / HTTP 403 from GitHub-hosted runner |
| **Facebook Reels** | FAILED two tested URLs | None | yt-dlp reports `Cannot parse data` in both normal and Chrome mode |

Detailed Porsche test: [native-best trial](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38162011170):
- Pinterest GT3RS `615726580336703478`: 720x1280 30fps PASS.
- Pinterest GT3RS `304626362315584186`: 720x1280 ~29fps PASS.
- Pinterest GT3RS `874261346424811017`: 720x1280 ~25fps PASS.
- Snapchat GT3RS `W7_EDlXWTBiXAEEniNoMPwAAYb256dGtjdG9zAZRXQhLHAZRXQgtdAAAAAQ`: 540x960 24fps PASS.
- Snapchat GT3RS `W7_EDlXWTBiXAEEniNoMPwAAYZmJ6b2d0dGtkAZ5fX2njAZ5fX2nLAAAAAQ`: 540x302 30fps PASS.
- Snapchat Porsche Cup `W7_EDlXWTBiXAEEniNoMPwAAYc2RzaWh6bHByAZ3_WlezAZ3_WleDAAAAAQ`: FAIL HTTP 404.

The feature branch code now explicitly accepts individual Snapchat, Pinterest, Twitch, X and Bluesky video URLs and runs browser-impersonation fallback. It uses bounded extraction retries. [Relevant smoke CI](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38162130435) passed after expanding the URL allowlist.

### Recommendation for 9:16 real-car edits

**Tier 1:** TikTok and Instagram (verified genuine 1080x1920 or 1088x1936 videos and real automotive sources); native creator/manufacturer downloadable MP4.
**Tier 2:** X/Twitter and Pinterest (verified download and automotive video content, but chosen samples maxed at 720 portrait); Twitch for *landscape* full-HD or gaming/racing video.
**Tier 3:** Snapchat (verified but 540-pixel width), Bluesky (inconsistent), PeerTube/Dailymotion (sample-dependent low resolution).
**Blocked in tested hosted environment:** YouTube, Reddit, Facebook Reels and Vimeo.

**Operational caveat:** Source tests used short samples and temporary video files, not redistribution of third-party media; the release branch PR #29 is closed/unmerged. Do not claim the new workflows are available on main.
