# Agent C V12 — Sparse real GT3 race engines (11 Oct 2026)
User has rejected *all earlier V9/V10 engine sounds* and V11 pit-only as insufficient. User now specifically requests **only a few loud, aggressive, genuine V8 moments; not all shots**.

## Actual deliverable — created, not just documentation
- Render: `YUNEX_GT3_V12_SPARSE_REAL_V8_4_SHOTS_PIT_1080P.mp4` (23,089,467 bytes).
- Movie SHA-256: `ed3a64174aa41551db27ee50701c4c81cb9c2cb6160eeb0111a8d696e682faf0`.
- 1920×1080 H.264, 30 fps, **466 frames / 15.533333 s**, AAC 48 kHz stereo. Full FFmpeg decode PASS.
- **Exact original V9 video bitstream retained** SHA-256 `653f49fd42823ffd302de9ed36419996f2e40ba128239db7fdc79c3f82c2bc6e` (both original and V12). Zero frame changes.
- **Source recording**: real trackside GT3 car sounds recorded with ZOOM H6 by Walking.With.Microphones, Freesound [556039](https://freesound.org/people/Walking.With.Microphones/sounds/556039/), **CC0** (56.76 seconds, saved HQ preview MP3). Source MP3 SHA-256 `10a9fcc79de6a003eecd575518b4498ba75b52e1ff04c19907d1b44d3e8bd14a`; actual FFprobe and full FFmpeg decode PASS locally. Manufacturer *list* in source includes BMW Z4 GT3, Mercedes SLS AMG GT3, McLaren 650S GT3, other GT3 cars. **No precise per-car timecode metadata**: do not claim an exact same-make recording for any individual inserted burst.
- Only **four** original trackside engine passes placed in visually relevant V8-car footage: 0.5667–1.1333s (Ford Mustang GT3 visual), 3.4333–4.3333s (BMW Z4 GT3 visual), 8.700–9.300s (Mercedes-AMG GT3 visual), 12.8333–13.3333s (Aston Vantage GT3 visual). Four individually different source excerpts, no loops.
- Preserve original music, duck **only** during four strong engines to give room to the authentic sound, retain user-liked V10 BMW/Porsche pit sound at **5.8–7.5s**. No fabricated engine tones, pitch shifting, movie soundtrack snippets, whooshes or generic transition noises.
- Sound only minimally high-pass filtered at 75Hz and gain adjusted for loudness; source pitch/speed remains 1:1.
- Mix WAV `YUNEX_GT3_V12_SPARSE_REAL_GT3_V8_MUSIC_PIT_48K.wav` SHA-256 `d5236dad3a1d74ed61348f4b2096cf44fd6f91f5b25adcff93e00cc206d3b5d4`.
- Ready-to-transfer ZIP `YUNEX_GT3_AGENT_C_V12_REAL_GT3_V8_HANDOFF.zip` 27,868,839 bytes SHA-256 `21f006dcc874635cd06fa0cd84ae01f3ab5465a2151aceed96feaa4883c7317a`; includes movie, WAV mix, source GT3 field preview, build script, amplitude analysis, QA and hashes. Delivered through ChatGPT sandbox, **not** GitHub Actions movie upload.

## Acquisition evidence
GitHub Actions [run 38177754178](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38177754178), artifact **11716601425** downloaded the real recorded MP3 bytes, including Moscow GT3 56s and Silverstone 2015 real GT3 track. **Note:** Actions internal report says FAILED because ffprobe is not installed in that action container. We independently ran ffprobe and complete ffmpeg decode locally against the actual downloaded bytes, both PASS. Do not mislabel Actions' internal verification as passed.

## Status
**AUDIO RENDER DELIVERED; USER LISTENING APPROVAL PENDING.** Previous users have rejected multiple mixes, so this is a *new candidate* rather than an approved release. Independent Agent D visual/footage compliance still pending.
