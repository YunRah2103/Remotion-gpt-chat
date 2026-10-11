# YUNEX GT3 MULTI-CAR 001 — Agent A2 — Latest real footage status

Date: 11 October 2026. Branch: `automotive-edits/gt3-nurburgring-multicar-001/a2-ferrari-aston-mclaren`. Scope: Ferrari 296 GT3, Aston Martin Vantage GT3, McLaren 720S GT3 EVO. Do not modify Agent A, B, C, D branches.

## Current editorial verdict

- **Aston Martin: source physically acquired.** Source: genuine Nürburgring NLS8 Aston Martin Racing #21 Vantage GT3 victory film, native 1920×1088, original SHA proven; 7 distinct source-vantage racing camera segments delivered cropped 1920×1080, not 7 independent films. **Use the corrected V2 ZIP:** [run 38153173855 / artifact 11707506666](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153173855/artifacts/11707506666). V1 had two overly long cuts incorporating garage / reaction footage, superseded by V2.
- **Ferrari 296 GT3: 0 qualifying native-landscape racing cuts delivered.** Multiple sources found but physically failed or were editorially rejected.
- **McLaren 720S GT3 EVO: 0 qualifying native-landscape racing cuts delivered.** Social Reels mostly 540×960/720×1280 and unacceptable landscape resolution.
- **Combined 6-manufacturer, 24-unique-camera original footage acceptance gate: BLOCKED.** Do not falsely mark source gate PASS due to GitHub Actions success or nominal 1080 encodes.

## Additional acquisition workflows actually executed

| GitHub Actions run | Scope | Actual GT3 footage outcome |
|---|---|---|
| [38158126684](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158126684) / [artifact 11709591871](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158126684/artifacts/11709591871) | 9 original Ferrari official publisher, McLaren Automotive customer racing, SRO team pages, public Vimeo player pages, browser endpoint capture | 0 real 1080 source bytes; Ferrari CloudFront blocked ("The request could not be satisfied"), McLaren/SRO pages lacked extractable public native video media. Diagnostic only. |
| [38158366289](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158366289) / [artifact 11709477472](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158366289/artifacts/11709477472) | **New correctly configured yt-dlp** with Node 24, `yt-dlp[default]` EJS scripts, `--js-runtimes node --remote-components ejs:github`; real official 2023 N24 Frikadelli video / N24 race highlights / 2026 GTWC race footage | 3/3 failed with **"Sign in to confirm you're not a bot"** on GitHub runner IP. The missing EJS runtime was addressed; the remaining issue is YouTube's bot/account-verification requirement. 0 media. No authentication bypass attempted. |
| [38158594261](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158594261) / [artifact 11709542728](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158594261/artifacts/11709542728) | **New `curl_cffi` Chrome browser impersonation support for Vimeo**: 2023 RAVENOL Nürburgring race documentary, other Ferrari Nürburgring cinematography film, archival race film | 3/3 failed with **"The web client only works when logged-in"**. Earlier missing impersonation was resolved but the publisher media is gated to authenticated client. 0 media. |
| [38155311593](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155311593) / [artifact 11707713814](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155311593/artifacts/11707713814) | Actual Twitter/X-provided NLS9 Ferrari-related racing clip recovered, full-video 1920×1080 HLS decode SHA `05fef5f466aacd9af05cd3028bdd3c1c1f2ec795f4ebacbcfc1412d171c63d4a` | **EDITORIAL REJECT**. Encoded 1080 is a largely black graphic canvas with undersized inset broadcast footage, leaderboards and arrows; race picture is not native full-bleed HD. Do not upscale/stretch. |
| [38155539862](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155539862) / [artifact 11708482359](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38155539862/artifacts/11708482359) | New four 2026 Ferrari N24 and 2023 Frikadelli individual news/player source pages | 0 actual native qualifying videos; diagnostic only. |
| [38154841753](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38154841753) | Official DTM 2026 Nürburgring Joyn race/highlights pages | 0 public source media URLs, diagnostic only. |

## Visual accuracy correction

Nürburgring.tv actual original `case-fpv.mp4` from predecessor source [run 38149985918 / artifact 11705753703](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38149985918/artifacts/11705753703), native **1080×1920 portrait**, was independently reviewed at native frame around t10s. It shows a Red Bull **Mercedes-AMG GT3 #3**, not a Ferrari 296 GT3. Does NOT meet native 1920×1080 landscape format either. Corrected in [issue #26](https://github.com/YunRah2103/Remotion-gpt-chat/issues/26#issuecomment-6111036726).

## Source strategy after repeated blocks

Use high-resolution downloadable producer originals and specifically named landscape race films (1920×1080+); avoid repeating YouTube downloads on anonymous GitHub Actions IPs without appropriate authorised access. If the repository owner separately configures properly authorised provider access, **never commit/log cookies, access tokens, raw browser profiles or other credentials**. Producer/source API links must be fetched physically and video decoded before claims. Any usable 2023 Ferrari 296 GT3 N24 #30 or later 2024-26 296 racing can be extracted only after visual identification and timecode QA; similarly McLaren #25 Dörr Motorsport (2025 DTM Nürburgring) or #23 Team RJN (2026 GTWC Nürburgring GP). Avoid mixing McLaren road car and real 720S GT3 EVO; don't claim Dörr's 2025 24h Nürburgring #59 Artura Trophy Evo as 720S GT3.

**Next owner action**: keep Ferrari and McLaren acquisition independent of Aston. Do not hand diagnostic ZIPs to Agent B as video. When real media is found, include exact publisher source, actual native ffprobe, full ffmpeg decode, SHA256, 12-frame contact sheet, exact race/camera IDs, and one native ZIP with playable bytes.


## Further official long-form GT World Challenge video acquisition (same date)

To avoid repeating the previously failed short Facebook Reels, a new Chromium + public CDN+ native-HD ffprobe and full-decode Actions workflow was implemented:

- Source script `production/videos/gt3-nurburgring-multicar-001/agent-a2/facebook_official_longform.py`, source commit `a1c5c55df9354ffc3ba142186223bbcd2e98f5ee`.
- Executed on official A2-only workflow `.github/workflows/gt3-a2-official-longform-facebook-race-media.yml`, workflow commit `a0438b747baa40e6b492236e5a461c96f14bada0`.
- [Real run 38158907205 / diagnostic artifact 11709353728](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158907205/artifacts/11709353728). Actual 53,865-byte ZIP verified; **no actual native-HD video files**, so it is QA evidence only, not a footage package.
- Attempted exactly four new original uploaded video posts: official GT World Challenge Europe 2026 Nürburgring weekend recap (2026 28-30 Aug, #7 Aston / Ben Dörr lap record), official GTWC Nürburgring last-time-out video, McLaren Automotive original 720S GT3 long-form developmental footage, and official GTWC 60-second Nürburgring preview. The browser recorded video-media CDN requests (12, 12, 3, 12 respectively), attempted the real stream URLs with public HTTP/yt-dlp, but **none yielded full-decodable >=1920x1080 landscape source bytes**. No Ferrari/McLaren original accepted.
- The 2018 original McLaren developer documentary is anyway not credible evidence of a **2023+ 720S GT3 EVO racing at the Nürburgring**; it is a different generation/race and must never be relabelled.

**Latest verified A2 approved GT3 deliverable remains 7 real Aston Vantage GT3 source views in the corrected V2 ZIP.** Ferrari 0, McLaren 0. Current combined source package issue #26 from Agent A has 5/6 identified GT3 manufacturers and 19/24 views per independent Agent A report, but Agent A2 footage must be evaluated for duplicates and race/class proof by master before count. No merged full Gate A PASS.
