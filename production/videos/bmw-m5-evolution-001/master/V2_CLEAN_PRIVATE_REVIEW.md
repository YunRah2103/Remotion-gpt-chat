# BMW M5 Evolution — clean TikTok V2 private review

**Render status:** REAL LOCAL MP4 DELIVERED, TECHNICAL PASS; editorial identity/rights still review.
**Render filename:** BMW_M5_EVOLUTION_V2_CLEAN_TIKTOK.mp4 (private conversation attachment only).
**Actual SHA256:** `f3210ddb1b373e8e1c3dd232d50ab27a3a0c23cb06d1ee9c30f574073ddbba09`.
**Actual size:** 25,704,667 bytes.
**Video:** H.264, 1080×1920, 30fps, **552 decoded frames**, precisely 18.400 seconds; full FFmpeg decode PASS.
**Audio:** original user-provided private WAV, SHA256 `47713ca53679b6011f7482232092daa4414e11a0e5c598007bf3fef31b5bb449`, muxed as stereo 48k AAC / ~320k target.
**Sources:** same A artifact 11668682025, original 42 moving shots, same 7-generation order, original beat map; all 41 adjacent cut boundaries exhibit a frame pixel-content change (measured minimum mean absolute RGB difference 27.47 on the car area); no 0.05s black-frame intervals. No placeholder images.

## What changed from V1
- Removed ALL poster/HUD graphics, multiple titles, generation years, bottom status, progress ruler, borders, outlines, line accents, scene counters and extra copy.
- **One tiny, unadorned white model code at upper left** (E28, E34, E39, E60, F10, F90, G90). It changes at the generation boundary; no fade, subtitle background or decorative treatments.
- The original moving footage fills a frameless central picture field with a very softly blurred, dark moving continuation of the same source behind it. Vintage SD source isn't enlarged to an invented 4K frame.
- Same track/music timing as V1, exact 42 beat-cut frame grid.
- A local, user-only FFmpeg source-locked render was used, with per-chapter CRF16 H.264 high; copy-concat and original authorized song mux. **This V2 MP4 is not claimed to be a native Remotion render**.

## Github reproducibility
The C branch now also contains a clean native Remotion implementation in `src/bmw-m5-evolution/M5EvolutionCleanFilm.tsx` and a registered `M5EvolutionCleanV2` composition in `src/Root.tsx`. They mirror the UI-free V2 aesthetic and remain diagnostic by default until master passes a verified original source manifest; private song must be muxed separately. The local renderer `render_clean_v2.py` / assembler `assemble_clean_v2.py` live with the user's deliverable, not Git history; native Remotion V2 was NOT separately rendered/visually certified.

## Remaining known limitations
E34 source is mixed-generations in several shots, and E34/E39/E60 original archive is **native 720×576 SD** (not native HD). G90 is real original 3840×2160. These historical limitations cannot be fixed by compression settings; user specifically preferred preserving approved V1 footage. Source redistribution/public soundtrack rights remain unverified; PRIVATE REVIEW ONLY.
