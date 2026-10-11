# Agent C V16 — remove all added sound effects, use user's original song only

## User correction
User strongly rejected V15, saying "No there's still sound effects". Previous V15 still used:
- Three separate, high-level GT3 field-recording inserts at 0.5667–1.1333, 8.700–9.300, 12.8333–13.3333s.
- A *processed V10* pit sound effect inserted at 6.705–7.445s.
These were **not** acceptable despite previous assistant claims to have removed all extra effects. This must not be repeated.

## Actual new artifact
- **Physical finished MP4**: `YUNEX_GT3_V16_ORIGINAL_AUDIO_NO_ADDED_SOUND_EFFECTS_1080P.mp4`.
- SHA256 **`d6e24cdf614aab9c6e39627859d8df5cf73d7791ba7c45de760a65e5de1a8feb`**, 43,336,214 bytes.
- Film: **1920×1080 H264/30fps/466 frames, 15.5333 seconds**, video bitstream **identical to Agent B V11** (SHA `d724f82f45d394b4b468fbf323416622838f713c0f8875e6e3beceab6b2aac09`).
- Audio is decoded directly from **the original user-supplied 192909.mp4** (not B11's prior audio and **not** V15's audio), resampled 48k stereo, then converted to AAC 320kbps for MP4. Correlation between delivered decoded music and original resampled source **0.9997891**. Source original MP4 23.313 seconds, first 15.533 seconds used, no loop.
- Music-only PCM WAV, reproducible Python+FFmpeg recipe, QA JSON, and actual video packaged as `YUNEX_GT3_V16_NO_SOUND_EFFECTS_HANDOFF.zip` **47,328,237 bytes**, generated in ChatGPT artifacts (not in GitHub Actions).
- One audio input file: `192909.mp4`. **Zero other stems, zero added engine noises, zero pit SFX, zero cinematic effects, zero original racing-video audio, zero transition swooshes.** Do not falsely say the soundtrack itself contains no effects—any sound baked into the user's mastered original remains inherent in that source.
- Full FFmpeg video+audio decode PASS, original picture bitstream comparison PASS, stereo AAC 48kHz PASS.

## Production rule and limitation
The user originally wanted engines/pit, but the prior attempts repeatedly sounded like unrelated *effects*. As a corrective **clean baseline**, this V16 intentionally has **no extra engine or pit sounds**. It does not satisfy the optional engine/pit ambition yet; future sound additions must be previewed independently and clearly approved before remixing. Do not reuse V9–V15 track clips or V10 pit FX by default.

Actual MP4 and ZIP available through this ChatGPT conversation only (not GitHub Actions). **Listening approval pending.**
