# YUNEX — Social browser recording and authenticated YouTube proof

**Date:** 12 October 2026  
**Repository:** `YunRah2103/Remotion-gpt-chat`  
**Experiment branch:** `experiments/youtube-browser-recording-20261012` (main untouched)  
**Technique:** Google Chrome browser-tab recording with Puppeteer Stream on GitHub-hosted Ubuntu, Chrome/Xvfb and FFmpeg.
**Evidence:** [Social browser matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38272949156), [Cookie-authenticated YouTube matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38273644743).

## 10-sample social browser recording matrix (improved looping-video detection)

All experiments attempted a browser-playback segment and a five-second screen recording. **Success requires both HTML5 video decoded-frame or playback-clock progression, plus an actual decodable recording with changed frames.** Third-party capture bytes and logged-in media were excluded from the publicly uploaded artifacts.

| Platform | In-Chrome true video playback + screen record | Specific evidence |
| --- | --- | --- |
| TikTok | **PASS** | Lamborghini Huracán STO; native HTML5 source 576x1024, advancing decoded frames, including short clip looping |
| Instagram | **PASS** | Lamborghini Huracán STO Reel; native HTML5 source 720x1280, time progressed |
| Snapchat Spotlight | **PASS** | Porsche Spotlight; native HTML5 source 540x960, advancing decoded frames even as the short video loops |
| Twitch | **PASS** | Public Twitch clip; playback time progressed and screen recording decodes |
| Bluesky | **PASS** | Public Bluesky video post; playback time progressed and screen recording decodes |
| Facebook Reels | FAIL | Tested Reel required login/age gate, no HTML5 player ready |
| Reddit | FAIL | Network-security access block on hosted GitHub runner |
| X/Twitter | FAIL *in browser* | Cloud Chrome received 403 on selected X post; earlier **direct video extractor worked** on two X posts |
| Pinterest | FAIL *in browser* | HTML5 video element unavailable on tested public Pin despite earlier **successful direct video extraction** |
| Direct CC MP4 control | **PASS** | Playable HTML5 movie and real recording |

### Correcting a misleading initial verdict

The first Instagram/Twitch/Bluesky run passed; TikTok and Snapchat's short clips looped, resetting currentTime before the final observation, so they initially failed the simpler `end.currentTime > start.currentTime` heuristic. New test checks advancing **HTML5 decoded frame counters** and confirms **TikTok and Snapchat are genuine playback/recording passes**. A browser UI with changing frames alone does not qualify.

**Image quality limit:** The test recorder viewport was **960x540** and outputs ordinary SDR 8-bit video; it does not preserve 1080x1920 portrait detail or real HDR. For YUNEX source quality, prefer the earlier **native TikTok and Instagram direct extractor** over screen capture.

## Authenticated YouTube browser test (existing repo Actions secret)

Controlled content: Blender Foundation *Big Buck Bunny* YouTube public player, tested only to verify browser technology.

**GitHub Actions secret used:** `YOUTUBE_COOKIES_TXT` — a Netscape-format cookies.txt export configured earlier. The GitHub runner reported:

- `cookieSecretSupplied: true`
- **37 Google/YouTube cookie entries parsed and applied to Chrome**
- One expired entry skipped, other out-of-scope/invalid lines ignored
- **0 verified YouTube video frames**
- YouTube `/watch`: HTML5 `videoWidth=0`, `currentTime=0`, **“Sign in to confirm you're not a bot”**
- YouTube `/embed`: `videoWidth=0`, `currentTime=0`, **player error 153**
- Both browser recordings generated error-screen media but failed `playbackVerified` and cannot count as downloaded film.

**Important qualification:** Applying 37 cookies is not proof that Google accepted them as an authenticated session. Cookies may be expired, tied to another environment, or fail to satisfy YouTube's verification. We did **not** copy or log cookie values, dump private browser profiles, or publish logged-in screenshots. Only sanitized validation metadata was made available as public artifact.

## Practical takeaway

- **Chrome browser recording works on GitHub Actions for TikTok, Instagram, Snapchat, Twitch, Bluesky and directly hosted MP4**, although capture quality is lower than native download.
- **YouTube cannot currently be recorded as real film via the tested GitHub-hosted Chromium runners**, with or without the existing cookie secret. The blocking factor is the player's refusal to load film, not absence of screen-recording software.
- Browser failures for X/Pinterest do **not** invalidate earlier successful `yt-dlp` downloads. Keep source acquisition methods separate and always verify native resolution.
- Leave `main` unchanged; experiment can be removed or cherry-picked only with explicit user instruction.

All jobs, reports, browser playback probes and recorder source files are available on this experimental branch. The experiment is not a production footage asset delivery.
