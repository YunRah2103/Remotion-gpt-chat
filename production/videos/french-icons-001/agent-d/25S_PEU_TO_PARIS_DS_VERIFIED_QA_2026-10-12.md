# YUNEX French Legends 001 — 25-second cinematic Peugeot replacement QA (2026-10-12)

**Status:** Real user-facing video rendered, personally visually checked around the edit, full AV decode PASS. Engine+original-French-music audio bit-for-bit preserved. This was done on Agent D's own branch; no other branches modified.

## User request

The prior Peugeot 205 GTI was not cinematic enough. Keep approved 25.000-second 16:9 sequence but replace only its Peugeot segment with an evocative genuine classic French car shot. Replacement is an original **Citroën DS seen from the rear driving through Paris at night**. It is sourced from existing canonical combined 42-clip verified source package, `ds-paris-black-rear-night-drive.mp4`.

## Frame-accurate implementation

- Original approved 25s engines+music MP4 SHA256: `901b52b5a9e227414f1d7bf73ac3fd3b4c3e8a0c612338ab2cfdecfa608fd202`.
- DS source MP4 SHA256: `d953c1e47a52be0f4ec1826d8a38607d01667a02b00090d102e9f3b397e6b19d`.
- Removed exactly frames **182–211** (times 6.0667s–7.0667s), the Peugeot approaching front-angle section. Original frames 0–181 and 212–749 retain the same chronological picture source and timing.
- Retimed actual native 24fps DS footage by 1.333× PTS into a 30-frame (1.000s) Paris-night moment; resampled on 30fps output, no artificial engine effect added to DS.
- All seven authentic existing engine accents, continuous exact-original French-song sample/timing, and fades are **unchanged** because the existing AAC audio was directly stream-copied to the new MP4. Verified byte-identical AAC: remuxed pre/post audio SHA256 `5a5c295b65cf184112dbf28c62b5f4dce4e4e0a15ce68be65377ef550ec5c0bc`.
- Re-rendered H.264 yuv420p CRF16 at 1920×1080, 30fps, 750 frames, 25.000s. Faststart MP4 with 48kHz AAC stereo.
- **Actual new MP4 SHA256:** `a3fe99f0ab5e0f6ed551c4bf818872173c15f2da1c403f4660e46144c39e407f`, 40,020,462 bytes.
- Entire new MP4 FFmpeg decode PASS, ffprobe 750 decoded picture frames and 25.000 seconds, FFmpeg blackdetect found no black intervals. Actual before/after frame-strip proof inspected across 5.95–7.13 seconds; first post-DS frame returns to the original modern Alpine on exact frame 212, no duration drift.
- User-facing new finished MP4 delivered in ChatGPT in this agent session; file is private to the conversation/container, not committed as binary to public GitHub. Review/approval and relevant reuse permission for third-party source still required prior to publishing.

## Reproducible code

[`agent-d/replace_peugeot_with_ds_25s.py`](https://github.com/YunRah2103/Remotion-gpt-chat/blob/automotive-edits/french-icons-001/d-audio-render/production/videos/french-icons-001/agent-d/replace_peugeot_with_ds_25s.py) accepts `--input`, `--ds`, `--output`, and optional `--qa`. It validates exact input clip hashes, replaces only 30 video frames, stream-copies existing audio, runs an actual complete AV decode, checks output dimensions/frames/duration and checks original vs output remuxed AAC byte hash. Media must be supplied privately or through canonical Actions artifact, not uploaded into Git.

**Creative note:** nostalgic nighttime architectural Paris footage provides a calmer and more premium bridge from the Renault 5 Turbo to the modern Alpine, without repeating a weak flat grey-road Peugeot approach shot. No extra sound effect was inserted, because the song-led Paris shot is deliberately quiet.
