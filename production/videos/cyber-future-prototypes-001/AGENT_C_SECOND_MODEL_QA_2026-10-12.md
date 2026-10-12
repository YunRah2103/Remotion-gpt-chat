# Agent C — second physical French concept audit (12 Oct 2026)

## Decision: gate remains PARTIAL; do NOT add candidates to approved editor ZIP

### Citroën Oli all-e concept: original acquired, rejected for cinematic shot delivery
- Public publisher source page: https://www.passionnement-citroen.com/post/citroen-oli-toutes-les-photos-et-videos
- Source media: https://video.wixstatic.com/video/3d5fff_d419211a2f0e45398d5375cdfa5c571b/1080p/mp4/file.mp4
- GitHub Actions complete decode and QA run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38244290219
- Real QA video artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38244290219/artifacts/11743734473
- Downloaded original **76,370,245 bytes**, FFprobe **1920×1080, 25 fps, 168.64 s**, SHA-256 `c72787a882b239b6967db7d6ec2f1596cffffd103a8a2ce71205c7db1dd68627`.
- Artifact contains original, 18 candidate MP4 cuts and 54 original decoded still frames. Outer ZIP and nested ZIP both passed `testzip()` integrity.
- Independently inspected the **full original across 42 evenly spaced actual video frames** (~4-second sampling), not merely the first 18 cuts.
- **Actual visual content:** long typographic sustainability explainer, non-automotive environmental stock footage, battery/vehicle construction renders, embedded titles, selected live-action lifestyle and car interior fragments. One or two partial exterior/city views are too short, heavily obscured by text or lack a clear moving car viewpoint.
- **Decision: REJECT** as proof of distinct premium physical Citroën Oli driving shots. Native resolution is valid; film authenticity and edit suitability of the sparse car shots are not. Never count all 18 scene-detect cut points as car footage. Main curation script stops after 18 *early* scenes and is unsuitable to approve this entire source. No Oli files added to final editor selects.

### Alpine Alpenglow Hy6 live circuit film: rejected on objective native size
- Live/public track demonstrations of a physical Hy6 took place in 2025: https://media.alpinecars.com/alpine-scores-another-podium-finish-at-spa-francorchamps-and-sets-its-sights-on-le-mans/?lang=fra
- Independent actual yt-dlp format probe: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38243770532 ; audit artifact https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38243770532/artifacts/11743518642
- URLs: https://www.dailymotion.com/video/x9sxkkc ; https://www.dailymotion.com/video/x9syzt8
- **Both exposed only 512×288 HLS** to the runner, no genuine ≥1920×1080 representation; zero accepted clips. Do not upscale to misrepresent native resolution.

### Current approved package unchanged
- Approved editor selections: **11 physical-camera Renault R5 Turbo 3E 2025 Corsica shots**, 9 moving + 2 beauty, original at 1920×1080/25.
- https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38242718272/artifacts/11743386371
- User's two-independent-model contract **not fulfilled**. Publishing, filming and alteration rights are not established from downloading the media.
- Next promising independently documented physical second-model lead: Renault Filante Record 2025 actually completed a 1,008 km December 2025 track demonstration, with a video-download entry on Renault's Swiss press site: https://media.renault.ch/de/101/article/22079 . High-res file availability and live-camera suitability **not yet verified**.

Never treat successful acquisition CI as editorial footage PASS without decoded source inspection and actual model/motion assessment.
