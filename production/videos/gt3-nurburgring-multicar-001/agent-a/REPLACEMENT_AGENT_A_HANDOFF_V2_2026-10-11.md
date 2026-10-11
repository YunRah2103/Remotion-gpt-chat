# YUNEX GT3 MULTI-CAR 001 — REPLACEMENT AGENT A HANDOFF V2
Date: 11 October 2026  
From: departing GPT-6 Agent A, Senior Automotive Footage Acquisition Director  
To: incoming GPT-6 Agent A replacement  
Repository: \`YunRah2103/Remotion-gpt-chat\`  
**ONLY branch:** \`automotive-edits/gt3-nurburgring-multicar-001/a-footage\`  
Tracking: [GitHub issue #26](https://github.com/YunRah2103/Remotion-gpt-chat/issues/26)

## 1. Mission — EXECUTE, DON'T RESTART
You replace Agent A for YUNEX GT3 Multi-Car 001, a **real, aggressive Nürburgring GT3 multi-manufacturer race montage**. Find, physically download, visually classify, quality-gate, trim, and deliver **30–40 distinct Nürburgring racing shots, at least 24 usable unique shots across at least 6 GT3 manufacturers**. The FINAL VIDEO will be **1920×1080 16:9 landscape, 30 fps, 10.533 seconds**. Sources must be *native decoded* at least 1920×1080 landscape or 1080×1920 portrait, preferably 4K; portrait alone is not suitable for the landscape master without real approved full-bleed crop. Real cars on track, not road models, GT4, Porsche Cup, renders or sim racing.

**DO NOT modify \`YunRah2103/yunus-video-lab\`. DO NOT reset previous work, move branches, or overwrite B/C/D ownership.** Read the original complete contract, original Agent A prompt, and the earlier replacement handoff before doing anything.

Read in this sequence:
1. \`production/videos/gt3-nurburgring-multicar-001/PRODUCTION_CONTRACT.md\`
2. \`production/videos/gt3-nurburgring-multicar-001/agent-prompts/AGENT-A-FOOTAGE.md\`
3. \`production/videos/gt3-nurburgring-multicar-001/agent-a/REPLACEMENT_AGENT_A_HANDOFF_2026-10-11.md\`
4. \`production/videos/gt3-nurburgring-multicar-001/agent-a/REPLACEMENT_AGENT_A_EXECUTION_REPORT_2026-10-11.md\`
5. \`production/videos/gt3-nurburgring-multicar-001/agent-a/CONTINUED_SOCIAL_AND_NBRTV_SOURCE_EXECUTION_2026-10-11.md\`
6. This handoff and the newest issue #26 comments.
Then inspect latest HEAD, actual source manifests, Actions runs, artifacts and contact sheets. Earlier README/doc statements are superseded where later independent visual QA corrected them.

## 2. Latest proven handoff state — HONEST numbers
**Gate A remains BLOCKED.** This is NOT a finished six-make or 24-shot library.

- **Visually confirmed GT3 makes: 3 of >=6:** Porsche, Mercedes-AMG, BMW.
- **Individually recognized on-track GT3 source sections: 5 of >=24 distinct usable shots.** Five sections do not necessarily mean five editorial cuts, and one long camera position only counts once.
- **Current source package: 8 actual playable native-HD original clips** (4K HDR and 1920×1080), including some source films requiring model identification.
- **Current source report HEAD BEFORE this handoff:** \`407561fe7cdbbd4b12949e75cd5479e509ede393\`. Verify new HEAD after this handoff is committed.
- Current single-source ZIP: **[run 38147988916, artifact 11705209678](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147988916/artifacts/11705209678)**, \`GT3-MULTICAR-AGENT-A-NATIVE-PARTIAL-V3\`, **357,375,787 bytes**. It was physically downloaded and ZIP/manifest checked, and **all eight video SHA-256s matched**. It contains FFprobe per video, original source URLs, camera/angle/timestamp, independent contact sheets, explicit model uncertainty and rejection notes. Its 8 file count is NOT its race-shot count.
- Working source pack workflow: \`.github/workflows/gt3-a-verified-native-partial.yml\`. Rebuild it into V4 only after new real qualified footage exists.

**V3 original-media inventory:**

| File | Reality / approval | Dimensions |
|---|---|---|
| \`FALKEN18_PORSCHE_GT3R_4K_HDR.mkv\` | Porsche 911 GT3 R original on-board N24 racing; eligible portions only | 3840×2160 |
| \`FALKEN18_MERCEDES_AMG_GT3_4K_HDR.mkv\` | Mercedes-AMG GT3 Black Falcon N24 racing; eligible portions | 3840×2160 |
| \`FALKEN24_PORSCHE_GT3R_1080.mp4\` | Porsche 992 GT3 R on track for only ~16–18 s; remainder largely crew/pit | 1920×1080 |
| \`AUDI_2018_N24_REVIEW_1080.mp4\` | Genuine Nürburgring race film credited Audi Sport; actual on-track car GT3 model **not conclusive**, NOT fourth make yet | 1920×1080 |
| \`FALKEN18_BMW_M6_GT3_TRACK_4K_HDR.mkv\` | Distinct real BMW M6 GT3 #33 on track, source ~t175 s | 3840×2160 |
| \`FALKEN18_BMW_M6_GT3_PIT_4K_HDR.mkv\` | Same BMW #33 pitstop at source ~t245 s; off track, DOES NOT count toward race-shot quota | 3840×2160 |
| \`NBR_TV_N24_BMW_Z4_GT3_WET_TRACK_NATIVE_1080.mp4\` | Distinct BMW Z4 GT3 moving wet-track pan, source ~t15.5–18 s; **one** racing angle with burned-in subtitles | 1920×1080 |
| \`NBR_TV_N24_YOKOHAMA_NIGHT_RACE_MODEL_QA_1080.mp4\` | Genuine night racing, t~14–19 s; exact GT3 model/make **unconfirmed** | 1920×1080 |

**HDR warning:** Falken 2018 4K is 10-bit BT.2020 SMPTE-2084 PQ, requiring proper HDR-to-SDR tone mapping for the eventual SDR landscape edit. Never treat washed-out frame thumbnails as the original grading.

## 3. Source URLs / validated breakthroughs
- **Official Falken 2018 full 4K HDR original** (2.35 GB original, byte-range remote-seek works):  
  \`https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4\`  
  Original excerpt evidence [run 38141641859 / artifact 11703283097](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141641859/artifacts/11703283097). BMW 4K recovery t170–182 s and t240–252 s [run 38145188281 / artifact 11704204180](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38145188281/artifacts/11704204180).
  **CRUCIAL correction:** Teal/blue car at original t195/t214 s is **Porsche**, NOT BMW. An earlier Agent A misidentified it. Actual BMW M6 GT3 at ~t175 and pit #33 ~t245 is a *different* section; visually verified. Don't conflate them or call the historic M6 an M4 GT3 EVO.
- **Falken 2024 producer original**, \`https://skmt.info/wp-content/uploads/2024/09/FALKEN_-HP%E7%94%A8.mp4\`. It is native 1920×1080 24fps ~20s; original SHA-256 \`3631b193900193fb341d36a1b449d0179bd8bdd9f9692869716e592781b3743f\`. A second alias \`FALKEN_-HP用.mp4\` is the **same original video**, NOT a separate film.
- **Nürburgring.tv producer portfolio**, \`https://www.nuerburgring.tv/en/work\`. Producer CDN yielded **five real 1920×1080 original MP4s**, but only \`case-legenden.mp4\` (BMW Z4 GT3 wet) and \`case-yokohama.mp4\` (night racing, model unknown) were useful for this gate. Example original:
  - \`https://nbrtv-website.fsn1.your-objectstorage.com/media/case-legenden.mp4\`
  - \`https://nbrtv-website.fsn1.your-objectstorage.com/media/case-yokohama.mp4\`
  [Actual publisher-source 1080 acquisition run 38147524364 / artifact 11704879537](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147524364/artifacts/11704879537), code \`agent-a/acquire_nuerburgring_tv_native.py\`. \`case-bni.mp4\` advertising, \`case-efr.mp4\` workshop/DTM, \`case-heart-race.mp4\` generic motorsport/open-wheel have been **rejected** as GT3 racing shots.
- **Audi Sport Nürburgring 2018 filmmaker film**, \`https://player.vimeo.com/video/277958760?app_id=122963\`. Source downloaded via yt-dlp at 1920×1080 25fps 51.84s; [real film artifact 11704042208 / run 38143817077](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38143817077/artifacts/11704042208). Exact source SHA-256 \`53818cf233d04e0ecf354925131b38362015d1338cff9799e1f02680feaff2f0\`. Film has genuine night racing, but on-track Audi R8 LMS GT3 identity was NOT conclusively established in dark multi-car frames. Do **not** count Audi solely from film branding.
- **Porsche NewsTV verified native 4K originals** [run 38140761181 / artifact 11702982174](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38140761181/artifacts/11702982174): \`https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4\` (some 2026 on-track Porsche mixed with Cup/crew), \`newstv.porsche.com_334123_en.mp4\` (fans; GT3 quota reject), \`newstv.porsche.com_334359_en.mp4\` (square native 3840×3840, can 16:9-crop if race/model/framing verified). Avoid treating Porsche Cup as GT3 R.

## 4. Social-media efforts — IMPORTANT to change tactic rather than abandon
The owner explicitly wants Instagram and TikTok tried because **earlier Huracán STO Agent A successfully downloaded files**, proving the alternative extractors work in some cases.

**What really worked before (different project, not proof of usable GT3):**
- [STO issue #24 independent downloader evidence](https://github.com/YunRah2103/Remotion-gpt-chat/issues/24#issuecomment-6104510917) and [run 38104203525](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38104203525): \`gallery-dl\` downloaded a real TikTok MP4 1080×1920, \`Instaloader\` downloaded a real Instagram Reel 720×1280, without account cookies. Later [Cobalt 11 self-hosted test run 38132866967](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38132866967) also downloaded both but identical bytes, no HD improvement. **A working extractor for one post does not imply working general profile enumeration.**
- For THIS GT3 project, broad Google/Bing/Brave/DDG exact-post search [run 38146725169 / artifact 11705366876](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38146725169/artifacts/11705366876) found only Instagram \`https://www.instagram.com/reel/DULMjrYiBVf\`, which was **GT7 sim-racing, max listed 720×1280**; rejected.
- New \`gallery-dl\` TikTok + \`Instaloader\` Instagram social-profile experiment [run 38147044304](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147044304) **FAILED**: five TikTok profiles returned 0 public video posts; Instagram \`24hnbr\` encountered HTTP **429 Too Many Requests**, serial profile enumeration stalled and Actions timed out at 23 minutes; no media artifact generated. THIS IS THE FINAL VERIFIED STATUS; DO NOT REPEAT THE OLD "IN PROGRESS" DOCUMENT STATEMENT.
- Scripts: \`agent-a/hunt_social_individual_posts.py\` (index searches), \`agent-a/reuse_successful_sto_social_backends.py\` (prior-project backends). **Do not rerun either unchanged**. They yielded sim-racing false positives or serial timeout.

**Next social approach**: Find **specific public post URLs/IDs** through team/film pages and linked embedded Reels, motorsport news articles, official accounts' page metadata; filter captions for actual N24 GT3, *then* run \`gallery-dl\` for TikTok **single-post direct URL** and \`Instaloader -- -SHORTCODE\` for Instagram **single Reel**, with per-post timeout <=60–90s, error logging and strict batch cap. Avoid enumerating 20+ full profiles sequentially; on HTTP429 change publisher, not repeat. Consider authenticated official-media/provider access only where permitted and provided, without circumventing restrictions or exposing account credentials. **FFprobe actual downloaded bytes**, full decode, source SHA-256, 6–12 frame review, watermark crop and GT3-model validation; a 1080×1920 vertical frame may lack usable pixels for full-bleed landscape even if it passes portrait acquisition minimum. Search creators/team accounts for Ferrari 296 GT3, Lamborghini Huracán GT3 EVO2, Audi R8 LMS GT3 evo II, Aston Martin Vantage GT3, McLaren 720S GT3 EVO.

## 5. Other failed routes (DO NOT LOOP)
- **YouTube** GitHub runner has been blocked/challenged; don't waste multiple identical yt-dlp retries.
- **10 Dailymotion race-page sources** provided only ~512×288/296 in real provider format lists; no native HD.
- **GuapoFilm 24h Vimeo and Glickenhaus sample** [run 38148163386](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38148163386): credentials requested, **0 actual HD files**, 1.4 KB diagnostics artifact only. A successful workflow is not successful media.
- **Ferrari 296 GT3 N24 victory player, ABT Lamborghini player, Red Bull/Ferrari/FFH pages** [run 38146939603 / artifact 11704458619](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38146939603/artifacts/11704458619): unsupported/HTTP403/412 player calls, 0 media.
- [Publisher nested MP4 discovery run 38147255562](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147255562) led to Nürburgring.tv producer originals above. Other page links were not physically proven video.
- No generic road cars, CGI, simulator video, GT4 classes, Porsche Cup mislabeled as GT3, duplicated source aliases, or fake upscaling.
- Most source adverts have studio/interview frames or burned-in captions; do not count them as track-action shots. B prefers exceptional dynamic shots with minimal UI and no visible watermarks.

## 6. Immediate next work — exact priorities
1. **READ full handoff/contract/current GitHub HEAD, issue, existing ZIP and manifest.** The owner wants ACTION, not another plan. Don't just search URLs: generate actual playable 1080p/4K MP4/MKV.
2. **Prioritise 3 NEW makes** before more Porsche/AMG/BMW: ideally Ferrari 296 GT3 (2023+ N24 winning #30), Lamborghini Huracán GT3 EVO2 (ABT Nürburgring), Aston Martin Vantage GT3, McLaren 720S GT3 EVO. Audi R8 LMS GT3 may be easiest if a clearly identifiable real racing shot in existing Audi film can be isolated, but don't infer from Audi branded intro.
3. Look for **original standalone MP4/CDN** on race teams, manufacturer press asset servers, live race media pages, motorsport documentary directors, tire sponsors, embedded video APIs and N24 event media. Replicate successful original-source pattern: inspect page HTML for \`.mp4\`, \`.m3u8\`, video iframe, direct file metadata, original size, then physically download.
4. Independently inspect Nürburgring.tv and other creators' **race-case portfolio pages/HD previews** for other years or sponsors featuring new makes. The portfolio gave actual 1080 footage quickly; don't assume every preview is GT3 racing.
5. Reattempt TikTok and Instagram with **known individual** race-video post URLs and the **proven** backend, not blind profiles. Bound per-post retries; reject sim racing and below HD.
6. For any newly acquired actual source, preserve exact original URLs/timecode and hash; \`ffprobe\` and full decode; make a real contact sheet, identify exact GT3 make/model/team and year from visible cars, distinguish camera angles. Source-native stream copy/trim where possible. **One moving camera perspective counts once.**
7. Deliver ONE new **GitHub Actions downloadable V4 ZIP** with at least the 8 existing V3 originals plus newly approved shots, manifest, frames, source SHA, independent QA, rejected-log; commit the actual code and transparent report; update [issue #26](https://github.com/YunRah2103/Remotion-gpt-chat/issues/26).
8. **Gate A PASS ONLY IF** >=24 genuinely distinct **qualifying** native-HD Nürburgring GT3 race shots, >=6 independently visually identified makes, >=3 independent source films/feeds and one playable verified ZIP. Otherwise, deliver real partial assets and say BLOCKED with exact counts and manufacturers missing. Don't use a green workflow badge as visual quality proof.

## 7. Agent ownership / coordination
- **A (YOU)**: capture, select, prove original source media, native resolution, authentic GT3 vehicle, camera uniqueness and source ZIP.
- B: Remotion visual edit; do not claim ready from unverified publisher previews.
- C: owner's exact soundtrack and authentic engine audio/final 10.533-second render; don't silently replace music.
- D: independently audits Agent A's real shots and final video and reports overall progress.
- All agents use GitHub issue #26 and their OWN branches. Do not overwrite their changes.

## 8. Reporting format after work
Report: branch HEAD SHA, exact named new manufacturer(s), model IDs, unique new angle count (not file count), total shots/makes, producer URLs, source FPS/pixels, actual video SHA-256 hashes, contact sheet evidence, Actions run ID + artifact ID, final GitHub ZIP link, and **PASS/BLOCKED** with proof and next blockers. Don't post source URLs as though they are already video downloads.

**Creative priority: aggressive GT3 racing, flybys, hard cornering, overtakes, night, wet curbs, real track packs and audible speed. Authentic cars first, always.**
