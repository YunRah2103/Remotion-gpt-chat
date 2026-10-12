# Agent D — real Pexels HD source acquisition with visual identity check

**Verified GitHub Actions run:** [38290804871](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871)  
**Real footage-bearing QA artifact:** [11766615569](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871/artifacts/11766615569). Artifact holds three source-original Full HD MP4 clips, twelve-frame each contact sheets, FFprobe metadata and SHA-256 manifest; these have **all been editorially rejected for Agent D's IndyCar-specific footage collection**.

## Important technical discovery

The Pexels website itself sends an HTTP 403 Cloudflare challenge to yt-dlp on a GitHub runner, but its openly exposed original CDN URLs worked **without circumvention**:

- Pexels `9823146`: `https://videos.pexels.com/video-files/9823146/9823146-hd_1920_1080_25fps.mp4` — successful HTTP 206 range response, 3,508,920 bytes; genuine 1920×1080 25fps 5.375s.
- Pexels `9737948`: `https://videos.pexels.com/video-files/9737948/9737948-hd_1920_1080_24fps.mp4` — successful HTTP 206, 9,253,501 bytes; genuine 1920×1080 24fps 14.59s.
- Pexels `9737952`: `https://videos.pexels.com/video-files/9737952/9737952-hd_1920_1080_24fps.mp4` — successful HTTP 206, 12,450,882 bytes; genuine 1920×1080 24fps 18s.

**This direct CDN technique is a proven practical addition to YUNEX's acquisition toolkit.** Use only legitimate openly accessible URLs and check each clip's Pexels licensing/third-party restrictions.

## Human visual identity QA — all rejected

1. `indy_pit_wheel_change.mp4`: moving tire-change close-up. **Michelin** branded tire and vehicle bodywork inconsistent with current IndyCar **Firestone** exclusive race tires. Beautiful motion but **NOT genuine IndyCar**. Reject.
2. `pit_crew_wheel_replacement.mp4`: bright green-accented **Porsche 911 GT3** with pit crew at IMS (2021 stock video); actual Porsche GT pit-stop, not IndyCar. Reject.
3. `start_grid_4k.mp4`: actual **Porsche GT race cars** queued under the Indianapolis Motor Speedway **Gasoline Alley** sign; *venue authenticity does not mean IndyCar race car authenticity*. Reject.

The third file's name `start_grid_4k` describes its search candidate, not its delivered size; **downloaded file is genuinely native 1920×1080, NOT 4K**. Titles, search tags, filename and advertising category aren't sufficient for factual vehicle identification.

**Conclusion:** 3/3 sources downloaded, verified and decoded; **0/3 suitable for the requested genuine IndyCar project**. Keep these out of Agent D's cinematic delivery ZIP. Original source quality does not override sports-series authenticity.

## Still required

IndyCar genuine 1080p+ onboard helmet cam or separate camera mounted on authentic IndyCar car; a visibly completed tire change on real IndyCar, preferably licensed for social media. Broadcast coverage is not cleared merely because a public clip is accessible. Do not merge copyrighted review samples into release media absent permission.
