# Agent C V11 — listening-feedback reset (11 Oct 2026)

## User feedback
The user explicitly rejected **both V9 mixes and the V10 engine/cinematic sound design**, describing V10 as "Worst sounds ive heard but the pit sound was good".

**Do not mark the prior V9/V10 engine SFX as approved.** Do not restore their random source sound snippets, frequency-shifted racing-film audio, whooshes, or synthetic low impacts.

## Actual corrective render
- Rendered a new real movie in ChatGPT, `YUNEX_GT3_V11_ORIGINAL_MUSIC_PLUS_GOOD_PIT_ONLY_1080P.mp4`.
- Size: 23,088,363 bytes; SHA-256 `baaae5d052204b145a1488ee80711a8872e0697d06a64506b3cd40f97d7ee232`.
- The **complete Agent B V9 repaired visual bitstream was preserved** with SHA256 `653f49fd42823ffd302de9ed36419996f2e40ba128239db7fdc79c3f82c2bc6e`.
- 1920×1080 H.264/30 fps/466 frames; original music plus *only* the V10 **pit** WAV stem that the user liked.
- Pit effects limited to actual visible BMW M6 service 5.800–6.667 s and Porsche wheel change 6.667–7.500 s. Source V10 pit stem SHA256 `dd22812b16a91e1911248c91f993bd7b2382e63d6d1687e9e4b41fcf70f274b9` applied at 0.73 amplitude; original song ducked -3 dB only between 5.74–7.57 seconds. No other effects anywhere.
- Exported WAV: `YUNEX_GT3_V11_PIT_ONLY_APPROVED_MIX_48K.wav`, SHA256 `fe1b09a7616d487b9ca80788285fa6693010ef034361260db1f8ff684a2acd0e`.
- Source music: `v9_existing_music.wav`, SHA256 `b5009fee7bfa3b414eb83e9633e4d2b53486ca721f96433e1aade9dc74dbef32`.
- 48kHz stereo, 745600 PCM samples, -1.0dBFS limiter ceiling, actual max output 0.89125 (digital full-scale 1.0). Full FFmpeg decode **PASS**. Bitwise identical video H264 stream **PASS**.
- The MP4, WAV, QA JSON, and reproducible script exist in the ChatGPT working artifact directory, **not in GitHub Actions**. Do not claim GitHub video upload.
- Still **REVIEW / user approval pending**. No new engine samples accepted. Next engine effects must be actual clean, stand-alone, properly auditioned GT3 track recordings, not processed soundtracks.

## Editorial decision
Preserve **original music + user-approved pit SFX** as the safe working baseline until clean real-world racing engine recordings meet subjective listening review. This prevents repeating the same failed audio strategy.
