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


### Verified Falken 2018 real 4K racing source — completed after initial memo

**Native publisher film:** https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4

**HEAD** HTTP200 `video/mp4`; actual source Content-Length **2,350,659,890 bytes**; accepts HTTP ranges.

[Successful GitHub Actions source run 38141641859](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141641859), [real 4K sample artifact 11703283097](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38141641859/artifacts/11703283097) **176,737,334 bytes**; FOUR six-second 3840×2160 stream-copy MKVs with source SHA256 proof and contact frames. FFprobe confirms **H.264, yuv420p10le, BT.2020 / SMPTE 2084 PQ HDR, 25fps**. Avoid washed-out SDR output: apply correct HDR-to-SDR tone map at final edit without replacing or upscaling original.

**Independent 12-frame visual review, 3 frames per segment:**
- Segment `falken2018_4k_hdr_01` source start 8s: apparent road BMWs and onboard, but NOT confidently a real GT3 class. **EXCLUDE from GT3 shot count**.
- Segment `falken2018_4k_hdr_02` start 34s: **Porsche 911 GT3 R** cockpit track racing, actual on-board graphic references Jörg Bergmeister / Falken; some off-track scenic view, choose only on-track shots.
- Segment `falken2018_4k_hdr_03` start 85s: drone aerial track, stadium, not visible close identifiable GT3. **Scenic cutaway only**.
- Segment `falken2018_4k_hdr_04` start 150s: **Mercedes-AMG GT3** cockpit race-pack footage, Mercedes-AMG GT3 / Team Black Falcon race overlay; additional trackside racing shots, independently verified real GT3 context.

Two identifiable makes are now backed by actual downloaded native 4K race footage: **Porsche and Mercedes-AMG**. There are **4 fetched 4K clips** from ONE original film, but only **2 clips presently accepted as plausible identifiable GT3 race sections**. Do not treat 4 clips as four distinct independent camera angles until editorial shot boundary inspection.

2024 Falken mirror https://thetiremagazine.com/wp-content/uploads/2024/07/Falken-Tyres-Why-We-Race-24h-Race-Nurburgring-2024.mp4 HEAD 200 (33,393,795 bytes) but remote FFprobe **timed out after 60s**. Video content and native resolution remain unverified; do not count.

**Local curated handoff** prepared separately: `YUNEX_GT3_PARTIAL_NATIVE_4K_CURATED.zip` (~123.2 MB), SHA256 `1c0e0dbb01e19789792ea1ea5378928453ed0f0a9d1f588b56bf5d5ad3e5fe60`. Contains copied native 4K Porsche+Mercedes 2018 race clips, a separately flagged 2026 Porsche Nürburgring footage candidate (car class verification pending), 2 contact sheets, source/time/hash manifest and README. B and D can use existing GitHub media archives above; no claim this partial package covers 24 shot quota.

**Gate still BLOCKED:** GT3 marque coverage 2/6, independently selected different GT3 race shots fewer than 24. 


### Critical 2018 Falken car-make correction — independent close-up review (supersedes source filenames)

The 42-frame scan [GitHub run 38142178896](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38142178896) [artifact 11703670460](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38142178896/artifacts/11703670460) extracted **38 valid full-film review frames** from actual native 4K source (the last four timestamps exceeded original runtime). Wide 420-pixel contact sheet at t≈219s appeared to show a blue/teal BMW.

To check, Agent A actually downloaded **two further 3840×2160 source excerpts**, source t=195 and t=214 seconds, [GitHub run 38142537320](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38142537320), [artifact 11703780406](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38142537320/artifacts/11703780406), 120,030,403 bytes, both FFprobe native HDR 4K, independently inspected 6-frame close-up.

**Definitive visual correction**: the teal/blue/green cars at source t=195–201 are **Porsche 911 GT3 racing cars, NOT BMW M6 GT3**. The t=214 clip is an aerial shot of a race incident whose car model is not visually confirmed followed by a Porsche onboard. The filenames `falken_bmw_gt3_195s.mkv` / `falken_bmw_gt3_214s.mkv` in immutable artifact are **misleading acquisition candidate names** and MUST NOT be used as GT3 identification proof. Agent A rejected BMW maker credit after close-up.

**Verified GT3 manufacturer count remains exactly TWO: Porsche and Mercedes-AMG.** Additional 4K footage was delivered, but it does not establish BMW or the six-make source gate.

**Updated curated local V2 ZIP**: `YUNEX_GT3_PARTIAL_NATIVE_4K_CURATED_V2.zip`, **243,238,214 bytes**, SHA256 `163589b8168603815215db797ccad2f0de7dd3fa29b2cf3b8e67b506bbfbf958`, re-labelled clips `falken_2018_porsche_gt3r_trackside_4k.mkv` / `falken_2018_multicar_crash_aerial_CANDIDATE_4k.mkv`, retains previous two manufacturer GT3 footage and unverified Porsche 2026 clip, all original 4K source stream copy, contact sheets and correct source identities. Provide to Agent B/D as a **partial** footage package only.
