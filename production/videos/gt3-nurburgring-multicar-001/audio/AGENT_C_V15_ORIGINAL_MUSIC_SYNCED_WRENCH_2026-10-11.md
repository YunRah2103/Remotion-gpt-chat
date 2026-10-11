# Agent C V15 — restore B11 picture, keep original music, only 3 real engines and *retimed* Porsche wrench

Date: 2026-10-11. Status: **physical render and FFmpeg QA PASSED; subjective user approval PENDING**. Replaces disliked C V14.

## User request
"remove all sounds unless its engine sounds and also pit sounds the pit sounds arenf synced properly aswell and orginal audio"

## Deliverable
- **Actually rendered** `YUNEX_GT3_V15_ORIGINAL_MUSIC_REAL_ENGINES_SYNCED_PIT_1080P.mp4` — **43,334,267 bytes** — SHA-256 `94dd3e3cf83770ab7d6adb3d4f44c269db15f10a59f3e6f07ddaa4b10812d958`.
- 1920×1080, H.264 30fps 466 frames (15.5333s), AAC stereo 48kHz 320 kbps.
- **Video is IDENTICAL to Agent B's V11**, verified bit-for-bit H.264 video stream after remux. No V14 cut re-timing, transitions or frame changes at all. Source B11 MP4 SHA-256 `902ba73054529ee5a37d69b472585f0456b3684bc072d21894b6c46ca239f74c`.
- Original user-picked B11 song retained at its exact timing, with modest 0.77dB global headroom safety; short 2–2.3 dB local attenuation only under allowed SFX.
- Real unaltered-speed trackside GT3 field recording Freesound 556039 (CC0; `10a9fcc79de6a003eecd575518b4498ba75b52e1ff04c19907d1b44d3e8bd14a`) plays *only*:
  - Ford Mustang GT3 screen: frames 17–33, **0.567–1.133s**.
  - Mercedes-AMG GT3 screen: frames 261–278, **8.700–9.300s**.
  - Aston Martin Vantage GT3 screen: frames 385–399, **12.833–13.333s**.
  - Manufacturer of each recorded source excerpt cannot be independently established from the multi-car field recording; don't falsely assert marque match.
- Rejected 3.43-second sound absent. Engine stem has verified ZERO samples **3.0–4.4 seconds**. No other engine excerpts in the film.
- **Porsche pit timing corrected using *actual B11 picture***:
  - Car arrival frames 174–200, 5.800–6.700s: **original music only**, remove previously misplaced BMW/pit tools.
  - **Wrench / wheel service** frames 201–226, 6.700–7.567s: use the previously user-liked V10 pneumatic pit tool portion (original source 6.750–7.490s), shifted to begin **6.705s** (= 0.005s after picture cut, within one frame), fades naturally and ends **7.445s** BEFORE pit exit.
  - Pit exit frames 227–245, 7.567–8.200s: **original music only**, no leftover wrench noise.
- NO transition whooshes, bass hits, fake engine revs, added vocals, synthetic telemetry, unrelated source film soundtracks.
- Complete FFmpeg audio + video decode **PASS**, frame/rate/duration metadata **PASS**, zero black intervals >=80ms; no clipping over -0.8 dBFS.
- Real 53,580,824-byte **ChatGPT downloadable handoff ZIP** (SHA256 `e6d0f249936854f50a91cc81a61b06eae45b2eb3da067febb19af2032d368b41`) contains actual video, separately named 24-bit/48kHz engine/pit/music/mix WAVs, complete reproducible Python+FFmpeg script, original GT3 field-recording MP3, picture contacts, JSON QA and SHA-256 file manifest.

## Integrity status
MP4 and ZIP are **in ChatGPT artifact files** at user-visible download links, NOT GitHub Actions artifacts and NOT pushed to repository. GitHub holds this report only. Technical checks are not a substitute for subjective listening; **USER APPROVAL PENDING**.
