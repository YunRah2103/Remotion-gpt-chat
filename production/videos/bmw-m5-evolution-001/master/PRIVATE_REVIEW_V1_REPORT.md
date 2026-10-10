# BMW M5 Evolution — Private Review V1 (actual playable video)
**Date:** 2026-10-10. **Status:** Technical PASS, editorial REVIEW (not public/fully approved).

## Actual film and source
- Full playable local/private ChatGPT attachment: `BMW_M5_EVOLUTION_PRIVATE_REVIEW_V1.mp4` (not a GitHub Release or public audio leak).
- MP4 SHA256: `8c06ee5a5bd720ad0e2c1e44de78088f872c340baa8abd738dca957cbb7f58ec`; 16,808,266 bytes.
- 1080 × 1920 H.264 high, yuv420p, 30fps, exactly 552 decoded frames / **18.400000s**. Real original user audio WAV SHA256 `47713ca53679b6011f7482232092daa4414e11a0e5c598007bf3fef31b5bb449`; encoded stereo AAC 48kHz 320kbps target.
- 42 moving video source files, exact six shots/gen and E28 → E34 → E39 → E60 → F10 → F90 → G90 order. Input SHA256 checked against actual Agent A `MANIFEST.json` source. No stills substituted. All 42 source clips downloaded and examined from artifact **11668682025** / run **38048763831**; verified source-code SHA `8cc2e07a0bfa10a3867b5972c49e4740f7778816`.
- Actual FFmpeg video/full decode PASS, 552 frames FFprobe PASS, audio stream PASS, no black-detect intervals and no weak-motion slots observed. A generated full-frame contact sheet `BMW_M5_FINAL_42_CUT_QA.jpg` covers the middle frame of every shot. Programmatic within-generation near-matching-frame comparison found no obvious pair below mean gray difference 10.
- Render was produced **locally using the real source clips and private music with FFmpeg**, bounded per-generation H.264 CRF16 chunks (no additional reencode at concat). This is a *real* movie, not a diagnostic grid. Source rendering scripts and media remain in private working folder, not in this repository.

## Upstream software integration
Agent B's eight owned edit/Remotion code files have been copied without change into master commit `284371766e96a8507e3c31ede0399797f93b002e`; the C-owned `src/Root.tsx` now registers `M5EvolutionPrivate` as an intentionally **diagnostic-default** composition (`fd9371d6ca9eb09222fb67464418cf6638bff945`). In a future native Remotion film render, override props with verified 42 genuine local media file references and `mode:'production'`, keep music outside public Git history. Actual final V1 media was assembled with the separate FFmpeg private pipeline, not falsely claimed to be native Remotion.

## QUALITY ALERT / why this stays REVIEW
1. E34 shots 07–12 were sourced from a genuine BMW mixed historical formation video: **E28, E39 and E60 also appear in certain frames**. Visible period M5 content is present but six isolated, unmistakable E34 shots are **not confirmed**. A cleaner E34-only replacement set is still needed before declaring full creative acceptance.
2. E34, E39, E60 native source is **720×576 (SD)**. This was confirmed by source FFprobe and viewing the frames. Their picture areas are presented as deliberately smaller archival insets so they are not aggressively stretched to portrait 4K; no application can honestly make source detail genuinely 4K.
3. HD masters for E28/F10/F90 are 1920×1080, genuine G90 is 3840×2160. Quality is significantly improved relative to prior low-res preview sources.
4. Source-video/public soundtrack redistribution rights remain unverified. **Private user review only; no public upload.**
5. Final photography, generation identity, aesthetic standard still require user creative approval.

**Do not misrepresent final V1 as 42 independently identity-approved clips or a perfectly sharp all-4K movie.**
