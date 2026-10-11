# GT3 Multi-Car 001 — Agent C audio and final render

Agent C executes actual FFmpeg music preparation and, once genuine upstream footage exists, manufacturer-matched engine cue mixing and native 1920x1080/30fps mux. The public Git repository deliberately DOES NOT contain the privately supplied song or its derivative WAV.

## Tested audio deliverable

Input: GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip (supplied privately in chat).
Original music SHA-256: 87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678
Original music duration: 10.553469s.
Master WAV: 316/30 = 10.533333s, 48kHz stereo, 505600 samples per channel, original pitch/time with 42ms tail fade.
Validated WAV SHA-256: 236421c8548fa34040adab926334999be3d869978af5e71a012e3828fb651012.
Verified local test run: 5/5 tests passed.
Final MP4 status: BLOCKED pending A's >=24 genuinely different source clips and B's verified edit.

## Commands

Preflight with user attachment:

    python production/videos/gt3-nurburgring-multicar-001/audio/gt3_sound_final.py --pack GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip --out out/gt3_c

After upstream integration:

    python production/videos/gt3-nurburgring-multicar-001/audio/gt3_sound_final.py --pack GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip --shotmap shotmap-review.json --sources-root /tmp/gt3-footage --video /tmp/b-316f-1080p.mp4 --out out/gt3_c

## Engine cue and visual map

JSON keys: shots (18-26 entries) and engine_cues. Every shot has make, start_frame, duration_frames; >=6 distinct makes. Each engine cue must have make, frame, duration_frames, source_file (relative to --sources-root), source_in_s, source_sha256 and verified_original_car_audio=true. Recommended gain_db=-17. All audio cues must match the actual make shown for their entire frame interval. Reviewed genuine engine audio should come from original approved racing video, never synthetic sounds, unmapped V10 noise or reference montage soundtrack. Human operator remains responsible for authentic engine verification and rejecting original clips with added soundtrack/commentary.

The script refuses an MP4 unless B provides 1920x1080/30fps/316 decoded frames and there are at least three verified cues from at least three different marques. Even after a real render the initial status is RENDERED_PENDING_MANUAL_AV_QA, NOT PASS. Independent final review must include visual shot inspection, engine playback authenticity, no black bars/black frames, audio silence/peak checks and playback of the actual downloaded final MP4. This repository has no fabricated final file.

Run unit tests:

    python -m unittest discover -s tests -p 'test_gt3_sound_final.py' -v

Agent C music package is supplied to the user directly in the chat. See AUDIO_PREP_STATUS.json for verifiable SHA and precise blocked gate.
