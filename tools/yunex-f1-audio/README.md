# YUNEX F1 EP002 — Agent 7 / Voice + Engines + SFX ONLY

**User-approved audio direction (19 Oct 2026): NO music or soundtrack bed.** User will add music separately. Do not add orchestral layers or alter Agent 6's 3D picture.

## Picture/source contract

- Base commit: `73b33e595a54833018b676d52250af5ca5361f87` (Agent 6 PR #170, clean-blue/contrast picture code).
- 26.000 s / 780 frames / 30 fps, 1080 × 1920. Fourteen source-aware edit segments in `editor/timeline.ts`.
- B's **0.13218395 s** win is from representative simulation, not measured F1 telemetry.
- Frames 480–653 are genuine real-time simulation. Every explanation and hero shot outside this window is a replay; audio must follow `editAtFrame(frame).sourceSeconds`.
- Teal / amber have the same synthesized engine timbre; only physical A2 velocity, brake and throttle change the envelopes.

## Voice source

The supplied, authorised Cedar narration is `openai-fm-cedar-audio.mp3`, **21.912 s / 24kHz mono**. It lives in the ChatGPT delivery workspace and is not committed into this repository; never silently swap in an unrelated or synthetic placeholder. The user supplied these words:

> Why do F1 drivers take the longer way around corners? Watch these two cars. The first takes the shortest route, but the second starts wide, clips the inside, then exits wide. That wider curve lets the car carry more speed through the turn, and with a straight coming up, a faster exit can make all the difference.

The approved final performance is the **supplied recording**, not a new read of the words above. Do not time-stretch it or add music.

## Reproduction

1. Export synchronized physical state from the integrated picture branch:

   `node --experimental-strip-types tools/yunex-f1-audio/export-physics.mjs out/f1-ep002-audio/physics.json`

2. Re-time the supplied Cedar recording at natural phrase pauses (no speech speed or pitch changes):

   `python tools/yunex-f1-audio/retime-cedar-voice.py --voice /path/to/openai-fm-cedar-audio.mp3 --out out/f1-ep002-audio/voice-timed.wav`

3. Use the Python production mixer with the actual Agent 2 states and timed voice:

   `python tools/yunex-f1-audio/mix.py --physics out/f1-ep002-audio/physics.json --voice out/f1-ep002-audio/voice-timed.wav --out out/f1-ep002-audio/stems`

4. Master at approximately -14 LUFS, true peak under -1 dBTP, preserve 48 kHz stereo, and validate. Use `tools/yunex-f1-audio/master-and-mux.sh APPROVED_NATIVE_PICTURE.mp4 out/f1-ep002-audio/stems/05_premaster.wav out/f1-ep002-audio/final --picture-approved` **only after actual picture lock**. Without `--picture-approved`, the output is correctly labelled an audio review. Stream-copy the approved picture track; do not re-render or modify Agent 6's picture.

## Picture/edit frame cues

| Film frames | Picture focus | Sound |
| --- | --- | --- |
| 000–059 | Two Formula cars hook | Immediate harmonically-rich engines; short opening air-impact |
| 060–179 | Teal shorter route and tight apex | Slower throttle/pitch under braking; restrained tyre load |
| 180–329 | Amber wide entry / curve | Smoother engine, panned pass and onboard air |
| 330–479 | Grip and apex teaching | Voice clear; softer texture |
| 480–653 | Actual A2 comparison | Real simulation's per-frame throttle, braking and speed; B finishes at ~648, A at ~652 |
| 654–779 | Reveal / racing exit | Short non-musical result accent at 21.8 s; expressive but controlled engine tail |

## Truth-in-labeling / QC

The downloaded ChatGPT audio-first review in the delivery workspace is measured -14.0 LUFS, -1.5 dBTP, 48kHz stereo AAC when muxed. **Its final audio revision uses exact Agent 2 per-frame physics exported by successful Agent 7 run 39185208565**, and its natural Cedar phrases are now cut into the correct picture windows without altered speaking speed. Its temporary native picture is still from the earlier successful Agent 6 render, not the currently running final colour-corrected native movie. Therefore the preview must NOT be renamed `_FINAL.mp4` or described as picture-locked. The authoritative physics exporter and exact-state mix have now been verified. Latest mix measures -14.0 LUFS and -1.5 dBTP. Native colour-corrected 1080p picture-lock approval remains the only blocker for a truthful final MP4.

No third-party licensed music or engine library was used. All engine, road, braking, whoosh and impact layers are original DSP synthesis; no invented gears or collisions. Stems and analysis must be retained for approval.
