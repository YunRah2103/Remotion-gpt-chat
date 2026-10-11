# Agent C — V10 aggressive GT3 engine + pit + cinematic sound-design repair
Date: 2026-10-11. Issue #26. Branch: `automotive-edits/gt3-nurburgring-multicar-001/c-audio-final`.

## Why V9 audio was rejected
User reported both prior versions sounded random and disconnected. V9 sound mix contained 25 separate race-source-video audio snippets, often carrying mixed film soundtracks. The new approach **eliminates all 25 sequential source audio snippets** and instead builds a coherent musical and cinematic soundscape.

## Actually built and verified
- Complete movie: `YUNEX_GT3_V10_AGGRESSIVE_ENGINE_PIT_FX_FINAL_1080P.mp4` (download provided in ChatGPT, **NOT** currently a GitHub Actions artifact).
- Exact MP4 SHA256: `50d49428e2e97696c9e5594b34c8b5da0c3dab6f86050425172da05067fe5f49`.
- 23,086,393 bytes, H.264 1920×1080 30 fps, **466 frames / 15.5333 s**; AAC 48 kHz stereo 320kbps.
- Entire video **full FFmpeg decode PASS**.
- **Original B V9 picture bitstream unchanged**: SHA256 `653f49fd42823ffd302de9ed36419996f2e40ba128239db7fdc79c3f82c2bc6e` for input and result stream.
- Music remains original user-selected V9 soundtrack. Volume is dynamically reduced under intentional SFX; no substitute song or extra lyrics.
- **12 intentionally longer real-race-recording engine sweeps**, including rising-pitch acceleration, controlled trackside pass movement and a powerful 8.13-second racing-return roar.
- **BMW M6 GT3 pit at 5.800–6.667s**: source video pit ambience plus crafted air/ratchet.
- **Porsche GT3 R wheel change at 6.667–7.500s**: source service audio plus fast, metallic pneumatic impact-wrench textures.
- **Cockpit at 7.500–8.133s**: focused, muffled GT3 racing-note build, no gimmicky digital telemetry beep.
- **Seven restrained air-whip transitions**, four tight low impact hits reserved for important music/scene moments, and aggressive final Porsche pass.
- **Master audio**: exact 745,600 stereo PCM samples at 48kHz, clean finite samples, peak 0.86099 (-1.30 dBFS), RMS -12.9 dBFS.
- Deliverable split WAVs: original music (ducked), engines, pit, cinematic FX, full mix — each 24-bit 48 kHz.
- Full manifest and event timeline, contact waveform image, build script, WAV stems, QA JSON and finished MP4 are bundled in the separately delivered **36.58 MB ChatGPT handoff ZIP**. ZIP SHA256 `9d1eee3e7982b48277306a47a65c4847f8cde67187190b791ebc6ca16eec6f00`.

## Provenance and limits
Engine layers are remixed and processed audio from **actual supplied racing-film soundtrack tracks**, but they are **not** manufacturer-certified isolated engine samples; a Porsche shot may receive repurposed generic GT3 racing recordings. Noise-based impact-wrench, whoosh and bass-hit effects are explicitly *designed sounds*, not falsely presented as field recordings. User listening approval and Agent D final provenance/visual QA remain **PENDING**.

## Immediate handoff
User can listen to V10 MP4 via ChatGPT attachment; Agent D/B can extract the handoff ZIP to import the separately rendered WAV stems. Private underlying source media and user song were **not** pushed to GitHub. No release PASS claimed before listening approval.
