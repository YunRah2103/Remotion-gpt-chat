# YUNEX GT3 Multi-Car 001 — Agent C V13: Audio FIX on NEW Agent B V11 edit

**Date:** 11 October 2026. **Status:** RENDERED AND TECHNICALLY VERIFIED — **USER LISTENING APPROVAL PENDING**.

## Exact film used

This is based on the **newest beat-synced Agent B V11 movie**, not the old V9/V10 cut. Source file: `YUNEX_GT3_MULTICAR_AGENT_B_V11_BEAT_SYNC_1080P.mp4`, SHA256 `902ba73054529ee5a37d69b472585f0456b3684bc072d21894b6c46ca239f74c`. All **466 source video frames are preserved bit-for-bit** during remux. Source and finished H264 video elementary stream both hash `SHA256=d724f82f45d394b4b468fbf323416622838f713c0f8875e6e3beceab6b2aac09`.

The new visual edit contains a three-shot **Porsche GT3 R #33** pit micro-story:
- Frames 174–200 (5.800–6.700 s): Porsche pit arrival;
- Frames 201–226 (6.700–7.567 s): real Porsche wheel wrench/tyre service;
- Frames 227–245 (7.567–8.200 s): same Porsche accelerating from pit lane.
**The earlier V9 BMW pit / Mercedes onboard shots are no longer there.** The updated mix respects these cuts.

## Audio design in the actual new render
- User's original song from B V11 is unchanged in its timing, arrangement, lyrics and fade. Only gentle level ducking under intentional SFX.
- **Four short, distinct real GT3 trackside engine bursts** from ZOOM H6 recording Freesound [556039](https://freesound.org/people/Walking.With.Microphones/sounds/556039/), licensed CC0, actual file SHA256 `10a9fcc79de6a003eecd575518b4498ba75b52e1ff04c19907d1b44d3e8bd14a`.
- Cue 1: **0.567–1.133s** / frames 17–33: Ford Mustang GT3 V8 racing approach (recording excerpt around 6.55s).
- Cue 2: **3.433–4.333s** / frames 103–129: BMW Z4 GT3 V8 wet-track flyby (recording excerpt around 12.09s).
- Cue 3: **8.700–9.300s** / frames 261–278: Mercedes-AMG GT3 V8 race acceleration (recording excerpt around 32.10s).
- Cue 4: **12.833–13.333s** / frames 385–399: Aston Vantage GT3 racing shot (recording excerpt around 18.28s).
- **Only four out of 26 shots** have engine FX. Source includes V8 GT3 cars but **exact manufacturer identity of any individual excerpt is not established**. No manufacturer-specific engine-recording claims.
- Retained the **only sound the user liked in the previous versions**, the Porsche/BMW pit and impact-wrench effect stem, over the V11 Porsche service interval **5.800–7.500s**. Ends naturally before pit-exit beat.
- No V9/V10 recycled fake roars, no pitching, no soundtrack snippets from other racing films, no whooshes, impacts, synthetic revs, generic HUD noises or unrelated vocals.
- 65Hz mic-wind highpass and scalar gain only for source race recording; strong but smooth short rises/fades; gentle 4dB song duck during race audio and 3dB during pit, 1dBFS stereo-linked safety limiting.

## Real output and QA

**Finished file created and downloadable directly through ChatGPT:**
`YUNEX_GT3_AGENT_C_V13_FIXED_AUDIO_ON_B11_EDIT_1080P.mp4`
- MP4 SHA256: `250951b603502f0a3638f2acd958314e565a383d88bbaa371b1b36078a2a7eed`
- MP4 bytes: **43,334,547**
- FFprobe: native **1920×1080**, H264, **30fps**, **466 frames**, **15.53333s**, AAC 48k stereo 320 kbps.
- **Entire movie FFmpeg decode PASS**, zero unexpected visual alterations verified by identical video stream SHA256.
- Final music+effects PCM peak **−1.0 dBFS**, RMS **−11.79 dBFS**. No source audio pitch/time stretch.
- QA JSON, full cue timeline, reproducible Python build script, original field MP3 and separate **24-bit/48k WAV** music, engine, pit and final-mix stems included in handoff.
- Handoff ZIP `YUNEX_GT3_AGENT_C_V13_FIXED_B11_AUDIO_HANDOFF.zip` **53,639,155 bytes**, SHA256 `af166ca783d21b47f5600757d1d72982707319652bde9094196eaa0cbdcd7522`; actual ZIP CRC check PASS.

**Important:** These actual media files were produced in the ChatGPT working container and delivered directly in chat. **They are not GitHub Actions media artifacts.** GitHub commits only documentation/production metadata. The user has rejected previous audio versions, so call this **listening REVIEW** until explicitly approved.

## Next handoff

Agent B / D can review the user-linked MP4 and take the single ZIP in chat if they need independent stems or the source soundtrack. Do not mix on older V9 video anymore.
