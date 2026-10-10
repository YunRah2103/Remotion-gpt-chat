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
