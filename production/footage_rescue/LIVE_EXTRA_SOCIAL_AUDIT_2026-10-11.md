# YUNEX — additional social-video acquisition audit

Date: 11 October 2026. GitHub-hosted Ubuntu runner, Python 3.12, yt-dlp 2026.08.19, FFmpeg.
Scope: public sample posts, 3-second segments, actual downloaded bytes and full native 2-second FFmpeg decoder proof. No third-party source media redistributed by test artifacts.

Evidence:
- [Seven-platform matrix, 16 jobs](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160397393)
- [X/Twitter independent real-video retry](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160498526)
- [Best-native-quality follow-up](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160590802)

| Platform | Real download observed | Verified media dimensions | Limitations |
|---|---|---|---|
| Snapchat Spotlight | **YES**, standard yt-dlp and Chrome | 540x960 at 30 fps from a Porsche spotlight | Best available from that particular sample was also 540x960; below native 1080x1920 |
| Pinterest video pins | **YES**, standard yt-dlp and Chrome | 720x1280 at 23.98 fps from Lamborghini video pin | Best sample quality 720x1280, below vertical native 1080 |
| Twitch clips | **YES**, standard yt-dlp and Chrome | 1280x720 source segment; **1920x1080** at ~60 fps using best-quality stream | Example is streamed gaming content, not real-world cinematic car footage; 1080p landscape not enough for native portrait crop |
| Bluesky posts | **YES**, standard yt-dlp and Chrome using 720p selection | 1280x720 at 30 fps | Higher-quality best-stream segmented remux failed on same test with premature stream end. Only the 720p test is proven reliable |
| X/Twitter posts | **YES**, standard yt-dlp and Chrome on 2 separate native-video posts | 1280x720 at ~30 fps on one post; 320x568 on a second | An older X post linking to expired Periscope video failed. Per-post differences matter |
| Facebook Reels | **NO** | No video | Two separate public Reel URLs, yt-dlp and Chrome modes both failed with 'Cannot parse data' |
| Reddit self-hosted video | **NO** | No video | Tested public OC dashcam post rejected anonymous GitHub session with HTTP 403 / account authentication required |

**Important:** Different videos may have different native resolution and access conditions. An accessible webpage is NOT proof of a playable video. All passes above are from actual video bytes, FFprobe metadata and FFmpeg decoder proof. HTTP-only test and all failed native decodes are excluded.

**For YUNEX:**
1. Keep TikTok first and Instagram second based on existing [social live audit](LIVE_PLATFORM_AUDIT_2026-10-11.md); both have verified native portrait 1080-class moving Lamborghini footage.
2. Add X/Twitter, Snapchat Spotlight and Pinterest as **optional discovery/acquisition sources** and preserve strict per-clip 1080x1920 checks. X has a genuine 720p test; Snapchat and Pinterest samples do not meet 1080x1920.
3. Twitch for sim racing and streaming footage; verified real 1920x1080 landscape, not real road/racing footage.
4. Bluesky as lower-priority fallback because best-stream download was unreliable in this test.
5. Do not depend on Facebook Reels or Reddit via anonymous GitHub runners without additional validation. YouTube is also blocked in previous tests.
6. This audit and tests live only on `feature/footage-rescue-multisource-20261011`; no existing production videos, default branch or user computer were modified.
