# Agent C — Sound + final render

Agent C branch: automotive-edits/huracan-sto-v10-001/c-sound-render. Tool: sound/sto_sound_render.py.

## Verified user inputs (private ChatGPT Library, never commit publicly)

- Original music filename: TikTok video #7690925557919403294 [7690925557919403294].mp3
- Actual original music SHA256: 87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678
- Original MP3 is 10.553469 s, 44.1 kHz stereo; contains optional MJPEG album art. SHA matches the locked contract.
- Reference: 192911.mp4, SHA256 70cbe209e0275b33419cfb52cf291964e4a8dc04a6d24cdeff24a3e414a73025, 16.207007 s, HEVC 1920x1080 60fps. Reference is LFA; NEVER reuse reference picture/engine audio for the STO film.
- Source song stays private; do not commit it to this public repo or leak media bytes through logs.

## Still needed for Gate C

1. Agent A's verified real Lamborghini Huracán STO 5.2 V10 recording, its source and permission.
2. Agent A's approved real STO moving footage and Agent B's 316-frame native vertical Remotion visual edit + source SHA.
3. Real listening review and full-film visual review. A successful CI build alone does not prove completion.

The manufacturer's Feel the Engine site is merely a lead, NOT a downloaded or cleared recording.

## Manifest format

Obtain a true recording, probe it, review the engine identity by listening and checking car-specific source video/model cues, then create JSON like this (times are provisional and source_in values must match real audio).

~~~json
{
  "vehicle": "Lamborghini Huracan STO",
  "sha256": "REAL_AUDIO_FILE_SHA256",
  "source_url": "FULL_ORIGINAL_SOURCE_URL",
  "recording_notes": "Describe date, car, microphone, actual signal",
  "identity_evidence": "Visual model cues and direct source proof",
  "rights_statement": "Actual private-review permission details",
  "verified_by": "Name and dated independent listening verification",
  "audio_confirmed_no_music_overlay": true,
  "approved_for_private_review": true,
  "events": [
    {"at": 0.00, "source_in": 0.30, "duration": 2.52, "gain": 0.32},
    {"at": 2.60, "source_in": 4.10, "duration": 0.52, "gain": 0.43},
    {"at": 4.48, "source_in": 6.00, "duration": 0.42, "gain": 0.28},
    {"at": 7.75, "source_in": 8.20, "duration": 0.52, "gain": 0.24},
    {"at": 9.48, "source_in": 9.80, "duration": 0.65, "gain": 0.33}
  ]
}
~~~

The software verifies SHA and manifest metadata, not biological engine identity. Never claim a recorded car is STO merely from machine validation.

## Full film render

~~~bash
python3 production/videos/huracan-sto-v10-001/sound/sto_sound_render.py \
  --music /private/media/exact-original.mp3 \
  --engine /private/media/verified-sto-engine.wav \
  --engine-manifest /private/media/sto-engine.json \
  --picture /private/media/AGENT-B-316-FRAME-EDIT.mp4 \
  --out /private/output/huracan-sto-v10-001
~~~

Python standard library, FFmpeg, FFprobe required. This fails CLOSED on a missing/mismatched audio SHA; incorrect frame count (must be exactly 316 decoded frames), 1080x1920 crop or fps. Original music is gain-ducked for engine impacts without moving the beat. Produces music-48k.wav, engine-48k.wav, final-mix-48k.wav, private-review H.264/AAC MP4, native-contact-sheet.jpg (16 actual decoded frames), and a machine-readable qa-report.json. A compliant source picture is stream-copied to avoid an additional destructive H.264 encode.

A fixture-only smoke run is allowed using --test-fixture, but its output directory MUST contain the word fixture, its MP4 is HURACAN_STO_FIXTURE_ONLY.mp4 and QA report gate is BLOCKED_FIXTURE. Never misrepresent it as real STO footage or audio.

## Native smoke test (10 October 2026)

With the verified original user MP3, a computer-generated sine WAV (explicitly NOT Lamborghini), and a synthetic 316-frame 1080x1920/30 H.264 picture:

- Native FFmpeg rendered all three 48k stereo PCM stems, the H.264/AAC MP4 and contact sheet.
- FFprobe verified 316 decoded frames, exactly 10.533333 s, AAC 48k stereo.
- Fixture MP4 SHA256: 8d7c68f906fd24c42695f6ddc285f725433faf554040f6080e01b332450cf310.
- Identified and fixed a lost-last-frame bug due to FFmpeg -shortest, removed from final mux.
- Fixture output correctly classified BLOCKED_FIXTURE.

**Gate C: BLOCKED** on authentic STO engine media and A/B verified video assets. Only manager D can independently sign off the final film.


## NEW: landscape Night V3 — actual private playable audio mix (11 October 2026)

**User changed film format:** all active sources/output are **1920×1080 landscape**, 30fps, 316 frames. The original test fixture mentioned above was under the superseded portrait brief. The maintained `sto_sound_render.py` has now been updated to accept landscape picture and preserve H.264 full-range yuvj420p when safe, rather than unnecessarily re-encoding Agent B's source.

**Actual source video:** Agent B's SHA-pinned native Remotion Night V3 H.264 MP4: `STO-B-V3-NIGHT-LANDSCAPE-REMOTION-SILENT.mp4`, SHA256 `1fc2c88cc387d2d17e5d2477c4913c9948dbeb94145ae14f5a2fcd9c61eaffac`. Composer source commit `58a60ae1d89df6a605c4862f92faa578e70ff93f`. User original music SHA unchanged and recovered securely (private; not in GitHub).

**Rendered the actual audio+video MP4** in the private ChatGPT run:
- `HURACAN_STO_V10_NIGHT_V3_MUSIC_ENGINE_PRIVATE_REVIEW.mp4`
- SHA256: `a7676beb93cf8978f130968a0c1d2fd808040094967b07cc9013a804425ca283`
- `1920×1080`, `30fps`, `316 decoded frames`, `10.533333s`, source H.264 bitstream copied, AAC stereo 48k 320kbps.
- FFmpeg decoded every frame without errors; no sustained black / silence detection intervals. Actual audio analysis: approximately `-10.4 LUFS`, `-0.9 dBTP`.
- 13 designed source-audio rev/pass/accent windows, the main reveal audio impact at **2.60s**. Music envelope ducked at reveal and other shot boundaries. Source media SHA and exact timeline windows in [NIGHT_V3_PRIVATE_AUDIO_SOURCE_MAP.json](./NIGHT_V3_PRIVATE_AUDIO_SOURCE_MAP.json).
- Mixer source script and stems saved to the **private conversation handoff**, NOT committed to public GitHub with the user's music.

**Important fidelity caveat:** The added sounds were extracted from audio tracks of **actual STO-labelled publisher promotional videos** provided as Agent A materials, then EQ'd, faded and spatially placed. Publisher soundtracks may contain background music or designed effects, and have not been independently certified as clean unaltered STO engine recordings. Do NOT call these samples authenticated isolated V10 sounds. User-supplied footage rights are not established for public redistribution. The MP4 is a *private-review version*, not Gate C release PASS.

**Outstanding gates:** A/B real independently distinct moving camera angles not fully certified; C isolated authentically identified V10 sound/rights and independent audio listening remain outstanding; D final independent approval outstanding.

