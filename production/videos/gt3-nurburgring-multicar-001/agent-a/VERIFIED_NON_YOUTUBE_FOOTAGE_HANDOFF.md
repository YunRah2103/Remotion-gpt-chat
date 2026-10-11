# Agent A — Actual non-YouTube footage QA (11 October 2026)

## Production gate: BLOCKED; real downloaded 4K sources exist, but NOT 24+ verified distinct on-track GT3 shots across six makes.

**Scope:** YUNEX GT3 Multi-Car 001 / Nürburgring / authentic cars and source video, not simulator/stock/studio replacements. Main edit native 1920×1080 16:9.

### Actual downloaded 4K native ORIGINAL source films
Run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38140761181
Artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38140761181/artifacts/11702982174 — 312,309,105-byte GitHub ZIP; actual original MP4 files with FFprobe, SHA256, 12-frame visual sheets and manifest.

| Original source | Native decoded pixels | Runtime | Verified visual content / Editorial |
|---|---|---|---|
| `newstv.porsche.com_334111_en.mp4` | 3840×2160 | ~55s | Porsche N24 race weekend, pit and paddock, **some actual moving on-track Porsche** but large portions are interviews, static cars, or other Porsche classes. Do not call a Porsche Cup GT3 R. |
| `newstv.porsche.com_334123_en.mp4` | 3840×2160 | ~38.5s | Fans/night camp atmosphere, no reliable identifiable racing GT3 car in 12-frame contact sheet. Only optional atmospheric cutaway. |
| `newstv.porsche.com_334359_en.mp4` | **3840×3840 square** | >50s | Actual Nürburgring race review including some visible on-track Porsche GT3; source rejected from **native 16:9 original** bundle. A 3840×2160 center crop is possible without upscaling, but framing must be checked. |

Individual exact original direct URL leads:
- https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4
- https://newstv.porsche.com/porschevideos/newstv.porsche.com_334123_en.mp4
- https://newstv.porsche.com/porschevideos/newstv.porsche.com_334359_en.mp4

Square 16:9 crop QA run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141191039; thumbnail/FFprobe artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141191039/artifacts/11702568387. Visual frame summary (16 samples): race views at ~2s, 9s, 13s, 17s, 51s; interviews, paddock, and event title occupying much of the rest. **Do not present as 16 distinct usable racecar camera angles.**

### Alternative platform testing (actually executed, not assumed)
- **Dailymotion**: 10 distinct Nürburgring source pages only offer 512×288–296 in yt-dlp manifests on GitHub runner (native gate = failed), run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139703090.
- **TikTok**: actual `@24hnbr` and Nürburgring profile extraction blocked/no posts. Google/Bing index search for **individual** post IDs returned zero accessible links. Additional open public TikTok post search mirror returned zero legitimate posts and zero native 1080p samples. Run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141279357, artifact https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141279357/artifacts/11703456131. No authentication circumvention.
- **Instagram**: reels profile pages redirected to login; index search for individual reel post IDs yielded zero. Run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139433085.
- **Vimeo**: 4 actual Nürburgring cinematic filmmakers' video pages require account credentials for yt-dlp, and public Vimeo `/config` player returned HTTP 403. Run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141328152.
- **YouTube**: inaccessible/archived; not retried in current source path. 
- **Old Porsche preview** 1280×720 decoded; rejected. 2026 studio Porsche GT3 R 4K film was actually retrieved, but *no Nürburgring track*, so rejected from quota.

### Extra source currently under live evaluation (NOT a verified asset yet)
- Official downloadable Falken 2018 4K HDR 24h Nürburgring director cut: https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4 (advertised 4K by manufacturer).
- Falken 2024 `Why We Race` publisher mirror: https://thetiremagazine.com/wp-content/uploads/2024/07/Falken-Tyres-Why-We-Race-24h-Race-Nurburgring-2024.mp4.
- Native FFprobe and remote seeking workflow https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141641859, source SHA `de1342c6b88008bccfd4ffc3ea8bf4b37cafc6fb`. Do not count without results.

### Delivery
- **Delivered**: genuine downloadable GitHub source-media artifact with two full 4K films, manifest, contact sheets and source hashes; separate aspect-crop QA artifact.
- **Not delivered**: requested 30–40 unique real Nürburgring GT3 racecar shots spanning six distinct makes. Do not mark Agent A gate PASS or Agent B footage-ready. Repeated excerpts from one film are not equal to 30 unique camera views.
- **Next source priority**: independently accessible direct publisher 1080/4K full-motion footage of BMW M4 GT3 EVO, Mercedes-AMG GT3, Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, Audi R8 LMS GT3, Aston Martin GT3; crop only actual native high-res pixels, never upscale 720p.
