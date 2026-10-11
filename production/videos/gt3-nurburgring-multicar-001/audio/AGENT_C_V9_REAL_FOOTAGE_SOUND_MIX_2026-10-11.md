# Agent C — GT3 V9 real-source racing sound handoff (11 October 2026)

## Actual deliverable (not merely planning)
Used **Agent B’s physical V9 repaired 15.533-second MP4**, retrieved from the user's ChatGPT Library, source SHA256 `ba21603d082c8a1387e1ac34309ec57d1adb0ed963723a656ac61867d0b4d00e`.

Built two new actual **1920×1080 / 30 fps / 466-frame H.264 + 48 kHz AAC** films. Original video stream is **bitstream-identical**, confirmed both via FFmpeg video MD5 `410a6a66f6c1a14014191f6850302a4c` with the V9 input; frames 174–243 pit/tyre/cockpit repair and all edit visuals untouched. Verified full FFmpeg decode passes. Original user music from `192909.mp4` remains in place; music attenuated only 1–1.5 dB, transient ducking around select physical race impacts.

1. **Recommended AGGRESSIVE**: `YUNEX_GT3_V9_REAL_RACE_AUDIO_AGGRESSIVE_1080P.mp4`, 22,963,711 bytes, SHA256 `f7391e6448f1b52e7b1a76bd5bc0a4e219cb0668de428823d83b1959cd019f33`.
2. **Alternative BALANCED**: `YUNEX_GT3_V9_REAL_RACE_AUDIO_BALANCED_1080P.mp4`, 22,964,020 bytes, SHA256 `75cc46b9b974e45a5707f65280f39731fe2ca7ec80ea3ceef3bd7f4cb82458c0`.

**25 individual shot-matched source-video-audio cues**, five visually present makes (Porsche, Ford, BMW, Mercedes-AMG, Aston Martin). 22 race shots + BMW M6 pit frames 174–199 (5.8–6.67s), Porsche wheel service 200–224 (6.67–7.50s), Mercedes cockpit 225–243 (7.50–8.13s); engine/track ambience resumes on frame 244, 8.13 seconds. Different source tracks per manufacturer and short matched entry/exit fades; no artificial synthesised engines or added music track. Those sources are **publisher/source video soundtrack audio**, NOT authenticated clean isolated engine/exhaust stem recordings; embedded production sound remains a potential aesthetic limitation.

Raw physical source audio obtained from Agent A/A2 actual original film archives:
- 2026 HRT Ford full-source movie (84.12s)
- 2026 HRT Mercedes-AMG top qualifying and night race films (14.12s each)
- Aston Martin NLS8 original publisher (51.29s)
- BMW Falken M6 pit and track (12.66s / 12.61s)
- Porsche Falken 2018 GT3R (6.76s)
- Porsche Falken 2024 GT3R (20s)

Physical **ChatGPT package**, `YUNEX_GT3_AGENT_C_V9_AUDIO_HANDOFF.zip`, 55,216,906 bytes SHA256 `4404d4add92ba89c9acab3a06ba2fe91720981823e61fcea3dfff973f5eb53f4`. Includes both actual MP4s, separate 24-bit 48kHz stereo mix stems, source-audio provenance and all 25 cut timings, QA JSON, checksums, scene contact sheet, and reproducible Python/FFmpeg script. All files are ChatGPT user deliverables, **NOT published as GitHub Actions artifacts**. Do not falsely claim the public GitHub repo contains native music or final binary.

**QA status:** Audio revisions RENDERED AND DECODE VERIFIED; final approval from user / Agent D review outstanding. Earlier source-footage contract six manufacturer minimum remains unfulfilled in V9 itself (five makes): Agent C did not change the edit or make identity.
