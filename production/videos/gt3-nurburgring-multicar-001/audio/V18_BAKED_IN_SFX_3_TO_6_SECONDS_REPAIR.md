# V18 — surgically remove original-file noise 3.0–6.0s

**Root cause proven:** The 3–6 second audio in the rejected V17 mix was not an Agent C added engine/pit cue. PCM comparison between V17 decoded MP4 and decoded original `192909.mp4` yielded correlation **0.999906** across 3–6 seconds. The unacceptable noise is baked into original `192909.mp4`; removing added SFX alone cannot remove it.

**Two real playable MP4 files generated in ChatGPT; no GitHub Actions media artifact uploaded.**

1. **`YUNEX_GT3_V18_3TO6_NOISE_REMOVED_MUSIC_PATCH_1080P.mp4`** 43,332,094 bytes; SHA-256 `72422e5ffd36116d93d14c91f22655c935dd1da5cad0ce7cb0094ac2c56c77ec`. Complete removal of original time-3.000-to-6.000 audio, replacing it with music/audio from **same** original `192909.mp4` recording time **7.575–10.575s**, level-matched, with 200 ms music crossfades spanning source 2.8–3.0 and 6.0–6.2 output. Critically this changes the local musical phrase, and therefore it is **not** an original-exact music-timing preservation claim. No new sound sources or effect categories were introduced.
2. **`YUNEX_GT3_V18_3TO6_COMPLETE_SILENCE_PROOF_1080P.mp4`** 43,214,176 bytes; SHA-256 `e1f86967d02e7f6d9f2d36695d8e28c380832c7f73dde44e213848bb499b35c4`. Original audio explicitly muted 3–6s, fade down 2.8–3.0, fade up 6.0–6.2. FFmpeg-decoded PCM of this output was **exactly zero RMS/peak across 3.05–5.95s**. This interrupts the song, offered for diagnostic proof rather than recommended premium final.
3. **`YUNEX_GT3_V18_3TO6_AUDIO_REPAIR_HANDOFF.zip`** 51,683,118 bytes, SHA-256 `e38a435dc0a770e27ed0230cf94ad55e7b9cf312ed2b498911cfe9253b0fa705`; includes recommended MP4, patched stems, build script, and machine QA JSON; ZIP CRC PASS.

### Native video preservation

- Both have the same original **466 frames / 15.53333s / 1920x1080 / 30fps / H.264** approved B V11 video bitstream SHA-256 `d724f82f45d394b4b468fbf323416622838f713c0f8875e6e3beceab6b2aac09`.
- Both completed full video+audio `ffmpeg -xerror` decode, **PASS**. AAC stereo 48k.
- Engine and pit stems retained entirely outside the 3–6s region from V17 (zero V17 engine/pit signal inside 3–6s). V17 music unchanged outside the 2.8–6.2 repair/crossfade envelope.
- Original 3–6 recording is **100% absent** in both newly encoded films. No spectral noise suppression handwaving.
- **No manual auditory approval claimed**; music-patch's perceptual continuity needs user review.
- Original repo C V9–V16 music code is historical, not reused to mix V18.

**Status**: Actual media rendered and supplied in current ChatGPT conversation (not in GitHub); user listening acceptance pending. Do not close issue #26.
