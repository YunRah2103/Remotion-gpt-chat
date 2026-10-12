# Agent D continuation — onboard/pit-stop acquisition evidence (12 October 2026)

## Objective

Do not substitute Formula 1, Porsche GT, stock-car NASCAR, low-res upscales, stills or staged simulator footage for modern genuine IndyCar. Retain original real 4K Indianapolis 500 package as the current approved Agent D contribution.

## Tests completed

**A. Real 1080p Pexels candidates — downloads PASS, IndyCar identity FAIL.**
- Actions run [38290804871](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871) / artifact [11766615569](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871/artifacts/11766615569). Three real H.264 sources, 1920x1080 native, downloaded and contact-sheet inspected; **none were genuine IndyCar** (Michelin sports-car tire, green Porsche GT wheel-change, Porsche racing grid). The [identity QA report](AGENT_D_PEXELS_REJECTED_QA.md) documents all three.
- Main Pexels HTML responded with Cloudflare 403, but independently verified `videos.pexels.com/video-files/{id}/{id}-hd_1920_1080_{fps}fps.mp4` responded HTTP 206 and returned actual MP4s. This is a confirmed acquisition method for properly identified, licensed footage in future.
- None added to usable Agent D delivery.

**B. Genuine modern IndyCar helmet onboards — subject PASS, resolution FAIL.**
- Actions native-resolution test [38293985550](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38293985550) / diagnostics artifact [11767044278](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38293985550/artifacts/11767044278). Sources:
  - 2025 Josef Newgarden Indy 500 FP3 helmet cam: `https://www.dailymotion.com/video/x9jl9u6`. Available HLS variant exposed **512x288**, not HD.
  - 2025 Alex Palou Indianapolis 500 Carb Day helmet cam: `https://www.dailymotion.com/video/x9k137e`. Available HLS variant exposed **512x288**, not HD.
  - 2023 Pato O'Ward Nashville practice onboard: `https://www.dailymotion.com/video/x8n14y0`. Available HLS variant exposed **512x216**, not HD and not matching Indianapolis oval.
- `yt-dlp --dump-single-json` inspected every offered format; only single low-bitrate HLS video variant surfaced for each. **0 qualifying native 1080p video samples**, no fake upscale. The GitHub action succeeded at producing **diagnostics only**: tiny ZIP is NOT usable footage and should never be reported as a 1080p clip.
- All broadcast items are copyright/reuse-restricted. Availability ≠ permission to use in YUNEX public video.

**C. Legitimate official access route.**
- 2026 INDYCAR photography/video policy: https://www.indycar.com/-/media/Files/2026/Imagen-Only/INDYCAR-Photo-Video-Policy-2026.pdf
- The policy requires a license for video from INDYCAR or its licensed third-party. Even independently shot event video may require INDYCAR consent. Ask for `INDYCAR Footage License Request` specifying 1080p or 4K cockpit/helmet, on-car rotating wheel, and visually synced four-wheel Indy 500 pit-stop (2–4s snippets, short-form social distribution).
- Contact `marketing@indycar.com` if a new shoot by a participant's third-party photographer is proposed; IndyCar content licensing request is a different channel. No license applied for or granted in this chat.

## Current genuine usable package and status

- Existing **[3 actual 3840×2160 MP4s](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38273704533/artifacts/11757429990)**, visual inspection pass: yellow Firestone wheel / parked open-wheeler, orange IndyCar cockpit/front, and full-speed authentic oval pass. Source is DVIDS Indiana National Guard 2026 public-domain labeled video, license terms and possible third-party rights caveats in its manifest.
- The previous fallback **[3 1080p / vertical real Indy500 context shots](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38271018884/artifacts/11757141664)** remain context-only, weak cinematography.
- **No newly approved IndyCar-specific clip** from this continuation. Agent D remains **PARTIAL**: the requested high-quality onboard / 4-wheel pit-stop / pit-lane-launch still missing. Source/rights permission remains unsolved. Do not mark full completion or launch edit solely on this material.
