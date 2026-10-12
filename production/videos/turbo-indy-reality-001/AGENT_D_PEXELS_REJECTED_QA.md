# Agent D — continuation: actual Pexels visual identity QA

Date: 12 October 2026. This report supersedes any suggestion that the Pexels stock footage tested is genuine IndyCar.

## Working download pipeline

GitHub Actions source QA run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871

Artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290804871/artifacts/11766615569

Three **real, playable**, nominal original **1920×1080** H.264 candidate sources, downloaded directly from `videos.pexels.com/video-files/{id}/{id}-hd_1920_1080_{fps}fps.mp4` with HTTP 206 Range verification, FFprobe, motion checks and 12-frame contact sheets; HTML Pexels pages themselves return Cloudflare 403 to yt-dlp. **This validates only download reliability, not IndyCar authenticity or licensing of brand marks.**

## Mandatory editorial rejection

- **Pexels 9823146:** 5.375s original, 25fps, visible Michelin GT-style tyre. Actual pit/tyre-change motion, but **not verified INDYCAR**. SHA256 of extracted 5s QA MP4 `c9f8ae484b72fbe3fc4ba3088bfad35ff58906c2fc6a5964b714431837fbaa35`. REJECT from Turbo→IndyCar.
- **Pexels 9737948:** 14.591s original, 24fps, **Porsche GT race car** with crew changing wheels. NOT an IndyCar. 5s SHA256 `57d4483e468999687fef2ae259db7ae87454e43ec6ec0d349bdb8b385a894272`. REJECT.
- **Pexels 9737952:** 18.005s original, 24fps, **Porsche-spec race-car grid**; Gasoline Alley environment is not proof of IndyCar. 5s SHA256 `9100c01407805eb4f81c2ca4ac195b31e66d52208d6b3cc1b7c552beaca51b40`. REJECT.

**Do not add these three files to Agent D approved footage manifest or reuse generic pit motion as if it were IndyCar.** The Pexels proof artifact is quarantined for technical research only; it does not satisfy required footage.

## Next

Check independent 2025 Indianapolis 500 helmet-camera FOX broadcasts: Palou Carb Day (Dailymotion x9k137e), Newgarden FP3 (x9jl9u6). Only accept genuine 1080p+ and visually verified; copyrighted broadcast rights not cleared for public film. Continue seeking original-author permission for real pit stop.
