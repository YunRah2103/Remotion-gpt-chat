# YUNEX Night Drive HDR10 phone preview — QA results

**Actual MP4:** YUNEX_HDR10_NIGHT_DRIVE_S25_TEST.mp4, provided to user from ChatGPT, not committed to Git.

- Bytes: 2,435,832
- SHA-256: 9b866c8075f21d9ddffb35f13a5485a806eb45475d24971f41f1200c28f8cf46
- Source: user-submitted YUNEX night edit 193667.mp4, **BT709 8-bit SDR** (NOT native HDR photography).
- Video: HEVC Main 10, hvc1, yuv420p10le, 1080x1920, 30fps, 316 frames, 10.533333 seconds
- Color: bt2020 primaries; smpte2084 (PQ) transfer; bt2020nc matrix; encoded HDR picture data.
- H.265 frame static metadata verified: Mastering Display Colour Volume, BT2020/1000 nit peak mastering, 0.005 nit minimum mastering. MaxCLL 1000 nits and MaxFALL 200 nits are declared targets, **not fully measured per-picture light levels**.
- Audio: AAC stereo, 48000 Hz, ~10.533s, original source soundtrack.
- Sampled decoded PQ pixel max nits: 0.4s: 476; 2.2s: 438; 4.1s: 708; 6.4s: 762; 8.7s: 717; 9.95s: 689. Samples prove pixels brighter than common SDR reference white, not original source HDR range.
- Full decoded video verification passed; video and audio stream metadata verified, short source-embedded black ending retained. Contact sheet visually reviewed from SDR-tone-mapped frames.
- Reproduction script approach was independently validated in a short 0.3 second low-resolution FFmpeg Main10/PQ/BT2020 sample before committing. Source film and finished MP4 not uploaded to Git due binary size and source-provenance concerns.

**Verdict:** HDR10 encoded playback/grade test PASS. Native HDR *photographic source* requirement NOT MET. Obtaining real 10-bit HDR camera car footage remains necessary for the jaw-dropping original-highlight/reflection experience.
