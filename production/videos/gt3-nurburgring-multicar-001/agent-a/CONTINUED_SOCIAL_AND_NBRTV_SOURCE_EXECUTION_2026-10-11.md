# Agent A source-recovery continuation — 11 October 2026

## Current delivery and gate

**Gate A BLOCKED:** 3 confirmed GT3 makes (Porsche, Mercedes-AMG, BMW) / 6 minimum; 5 independently visually identified Nürburgring GT3 racing **sections** / 24 distinct shots minimum. Publisher previews contain interviews and sub-titles; don't count complete files as qualifying race shots.

**Latest ONE source-media ZIP:** [Actions run 38147988916, artifact 11705209678](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147988916/artifacts/11705209678), 357,375,787 bytes. **8 actual playable native 1920x1080 / 3840x2160 source files**. Working container independently verified the ZIP CRC and checked every extracted video SHA-256 against SOURCE_MANIFEST_FFPROBE.json; all match. This supercedes the earlier V2 artifact.

### New genuine on-track footage acquired

Film producer source portfolio: https://www.nuerburgring.tv/en/work .

[Producer direct native-HD acquisition Actions 38147524364 / artifact 11704879537](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147524364/artifacts/11704879537), five physically downloaded native 1920×1080 MP4 files, 12-frame sheets and original source hashes. **Only two contain useful authentic GT racing**, and both are now included in the latest eight-source ZIP:

1. `https://nbrtv-website.fsn1.your-objectstorage.com/media/case-legenden.mp4` — `NBR_TV_N24_BMW_Z4_GT3_WET_TRACK_NATIVE_1080.mp4`, actual N24 **BMW Z4 GT3** red/black/yellow/white sponsor livery with clear BMW badge and racing wing, on-track in wet conditions **t~15.5–18 seconds**, 1920×1080 original. **One distinct trackside camera pan only**, +1 independently identifiable new shot (same BMW make, new model). Some burned-in subtitles must be excluded/avoided where possible; do not pretend the full ~22s source is race footage.
2. `https://nbrtv-website.fsn1.your-objectstorage.com/media/case-yokohama.mp4` — `NBR_TV_N24_YOKOHAMA_NIGHT_RACE_MODEL_QA_1080.mp4`, genuine Nürburgring night racing at **t~14–19 seconds**, headlights/field seen; **vehicle make and exact GT3 model NOT visually established**. Useful pending closer QA, but **NOT** added to the 5/24 count.

Other source films from this publisher **visually rejected** from on-track GT3 quota: `case-bni.mp4` (non-motorsport advert), `case-efr.mp4` (DTM workshop/garage, not racing), `case-heart-race.mp4` (mixed generic motorsport/open-wheel and graphics). These may be accessible but are not N24 GT3 racing footage.

### Instagram/TikTok strategy executed, not only proposed
- [Exact individual social post search run 38146725169, artifact 11705366876](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38146725169/artifacts/11705366876): indexed exact individual posts across Google/Bing/Brave/DuckDuckGo, plus yt-dlp extraction. Only one accessible Instagram reel was found; `https://www.instagram.com/reel/DULMjrYiBVf` belongs to **sim racing** and lists at most 720×1280, rejected.
- Prior project's working **gallery-dl** public TikTok 1080×1920 and **Instaloader** public Instagram 720×1280 download methods were independently rediscovered in [STO issue #24 evidence](https://github.com/YunRah2103/Remotion-gpt-chat/issues/24#issuecomment-6104510917). Reimplemented here in `agent-a/reuse_successful_sto_social_backends.py` and launched [Actions 38147044304](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147044304) against public Nürburgring/N24/racing-team profile posts, with native FFprobe and video hashes. At time of this report run **still in progress**; do not claim success before actual media artifact. Repo branches unaffected for prior STO edit.
- Never count generic TikTok/Instagram watermark, low-resolution, sim source, portrait without full-bleed landscape crop, or mere article link as real qualifying 1080p Nürburgring racing footage.

### Other independent routes tested

- [Ferrari/Lamborghini alternate original player extraction 38146939603, artifact 11704458619](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38146939603/artifacts/11704458619): blocked/unsupported from racing publisher pages, no native MP4 acquired.
- [Publisher nested MP4 discovery 38147255562](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38147255562): successful finding of above Nürburgring.tv original MP4s. Unsupported Lamborghini site had video URL leads, but none verified as on-track native GT3 source.
- [Independent GuapoFilm Vimeo N24 video source run 38148163386](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38148163386): yt-dlp requested account credentials on real 24h films, **0 actual media downloaded**; rejected not counted. Simulator training hotlaps from Vimeo (e.g., Apex Racing Academy iRacing) excluded.
- Native Ferrari 296, Lamborghini Huracán, Aston Martin Vantage, McLaren 720S race footage **not yet acquired or verified**. Audi Vimeo film still unconfirmed exact SP9 GT3 model from night shots.

## Latest verified source-work commit
- Consolidated 8-file V3 workflow commit `a58a0fa0a7ad43fa816f595d62f4fa1d03342104`
- Nürburgring.tv direct acquisition code `75600a15af8a8954c565cd08a2309744ae5fb483`, Actions workflow `7296cd341d44e2de6d0982538389f41e2151be87`
- Native social backend run `4191d068f442a4686014b3f282b253fbb9883bac`
- GuapoFilm source probe commit `1e480dfd10e64d72c531c5fcbe4a29ad4fb4028b`

**Next task**: inspect actual latest social run artifact on completion, choose actual identifiable Ferrari/Aston/Lambo/McLaren native sources, download/FFprobe and deliver combined ZIP V4; no shot-quota PASS until 24 qualifying unique racing camera views across six visually proven makes.
