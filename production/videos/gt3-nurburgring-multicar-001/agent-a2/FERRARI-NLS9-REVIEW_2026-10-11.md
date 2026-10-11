# Agent A2 visual quality failure — Ferrari 2025 NLS9 embedded race source

Date 2026-10-11. Original assignment Ferrari 296 GT3 and McLaren 720S GT3 EVO.

**Result: technically decoded but EDITORIAL REJECT: not full-frame genuine-native racing imagery.**

Publisher: https://www.caranddriver.gr/formula%201/arthro/o_max_verstappen_kerdise_me_ferrari_video-7846673/
Actual embedded source: https://video.twimg.com/amplify_video/1971940368070356992/pl/BGgJ0ncRrAIjCIzP.m3u8?v=748
First source discovery workflow [38154375311](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38154375311) was ultimately cancelled after it had reported actual transient download; no source-media artifact uploaded.
Recovered a second time with isolated workflow source SHA `764f0eb0c1b4fda968366b3820da5ece5a91ecb7`: [run 38155311593, artifact 11707713814](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155311593/artifacts/11707713814).

**Actual video bytes physically retrieved and inspected in working container:** Vimeo/YouTube were NOT involved. Native video frame dimensions **1920x1080**, duration ~14.03s, SHA256 `05fef5f466aacd9af05cd3028bdd3c1c1f2ec795f4ebacbcfc1412d171c63d4a`. FFprobe and full-video FFmpeg decode passed. Film original and contact sheet included in the uploaded artifact. Distinct full-screen GT3 shots accepted **ZERO**.

**Why excluded:** actual 1920x1080 encoded Twitter stream comprises a black/graphical canvas with *small inset television racing picture*, additional stream-wide timing leaderboard/colored-arrow graphics and letterbox/unused black space. Actual racing imagery occupies substantially less than 1920x1080; enlarging it would be unacceptable upscale. Source frames inspected at t0.8–13.1s all show the same embedded graphic treatment. Don't mislabel a 1920x1080 container as native full-bleed 1080 GT3 footage; don't remove overlay by stretching/cropping to fake pixels. Car-specific Ferrari 296 GT3 identity not independently conclusive from inset frames.

Additional 2023 RAVENOL Vimeo producer film [run 38155254955 artifact 11708292296](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155254955/artifacts/11708292296) returned only credentials/impersonation download errors, diagnostic evidence without real media. 2026 DTM Joyn broadcaster [run 38154841753 artifact 11707813054](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38154841753/artifacts/11707813054) exposed zero public source endpoints. Do not count those as footage.

Status: Ferrari manufacturer coverage **NOT YET ADDED**; McLaren **NOT YET ADDED**. Continue original producer-video search. Previously verified A2 Aston Martin shots remain separate approved source package.
