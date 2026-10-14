# YUNEX P1 — Replacement Master Editor | 14 Oct 2026

## DO THIS FIRST — COMPLETE MEDIA TRANSFER

All locally available media and editable material has been bundled **and uploaded to the user's ChatGPT Library**:

- **Persistent Library folder:** `/YUNEX/McLaren-P1/`
- **Full 201 MB ZIP (59 files):** `/YUNEX/McLaren-P1/YUNEX_P1_COMPLETE_EDITOR_HANDOFF_20261014.zip`
- **Complete 15 KB handoff instructions:** `/YUNEX/McLaren-P1/YUNEX_P1_REPLACEMENT_EDITOR_HANDOFF.md`

In a fresh agent/chat: **use ChatGPT Files tools to list that Library folder, then materialize the ZIP into the working container**. Alternatively the user can attach the ZIP directly to the replacement chat. Do not assume the previous conversation's `/mnt/data` persists. **GitHub itself does not contain all binary clips or soundtrack**; the ZIP is the reliable transfer.

Extract the ZIP into `/mnt/data` so paths match legacy scripts. Run `cd /mnt/data && sha256sum -c SHA256SUMS.txt` and inspect `YUNEX_P1_V9_SMOOTH_CINEMATIC_FINAL.mp4`. The ZIP was integrity tested: 59 members; SHA256 of archive `67d0ef71d852e0d00f789b1afbaa2cc22b472d6b008783063041fcbbc1ca9ff3`. Four main V4 source checksums were cross-checked against original downloader records.

## Mission

Act as the **single replacement Master Cinematic Editor**. Improve the existing V9 silver-grey McLaren P1 film to V10; **do not restart**. User liked V6 visual variety, V8's additional matching grey Nürburgring shots, and wants the final version **much smoother and better**, with a less hyper-cut, more cinematic opening. Preserve source-film continuity, musical dynamics and car motion. Compare the supplied Lexus LFA reference `192911.mp4` but do not copy shot-for-shot. Soundtrack MUST remain the supplied `@altitude.nick  [7688403068328725767].mp3` (~15.78s); previous `Suit` song was WRONG. Save V9 and create a *new* V10 MP4.

## Included working assets

- Finished `YUNEX_P1_V9_SMOOTH_CINEMATIC_FINAL.mp4`: 1920×1080, 30 fps, H.264/AAC, **473 decoded frames**, duration 15.766667s, not yet user-approved.
- V6, V7, V8, V9 previous/director comparisons; reference LFA MP4; correct MP3.
- Original V4 footage: `p1src/yunex-v4-74.mp4`, `p1src/recovered/yunex-v4-75.mp4`, `p1src/recovered/yunex-v4-76.mp4`; plus #71, #66, and orange exterior/mechanical candidates #61/#62/#63/#65/#68 (different P1 car/setting).
- **Editable shot structure:** `p1src/v9/EDL.json`, `p1src/v9/00.mp4` through `10.mp4`, `p1src/v9/composite_clean.py`, `p1src/build_v9.py`. The clean compositor uses frame-controlled blends, but **outputs over the original V9 filename** unless changed. Retarget output to V10.
- Various visual QA contact sheets, workflow metadata, SHA256SUMS.txt.

See the **Library handoff document** for exact 11 shot start times, boundary frames, fades, creative issues and checks.

## GitHub provenance and recovery (if necessary)

- Dashboard: https://github.com/YunRah2103/Remotion-gpt-chat/issues/72
- Download jobs: https://github.com/YunRah2103/Remotion-gpt-chat/issues/74, https://github.com/YunRah2103/Remotion-gpt-chat/issues/75, https://github.com/YunRah2103/Remotion-gpt-chat/issues/76
- Recovered V4 video #71/#75/#76 verified Actions artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38543915087/artifacts/11883841098
- Recovered source #74: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38465916924/artifacts/11849070032
- Orange original source recovery: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38458177239/artifacts/11844581270
- Missing optional orange jobs #69/#70 are **not** in archive; GitHub private release assets 638034079 and 638019718. Not needed for current silver P1 edit.

Actions artifacts may expire. The user-owned Library ZIP is the preferred source.

## Quality bar

Produce a professionally paced and synced ~15.77s horizontal edit, not randomly crossfaded clips. Use genuine motion-matched cuts, very short blended frames selectively, authentic fast track shots, smooth opening, crescendo and purposeful overhead end. Avoid ghosting, double cars, jerky transitions, random white flashes, excessive type and mismatched orange/silver continuity.

Deliver actual **playable V10 H.264 MP4 with AAC** and verify no black gaps, unexpected repeated shots, decode errors, audio dropouts or cut-off ending. Inspect full playback and each cut boundary (especially 3.4–4.8s). Do not claim success for just a source file, workflow or screenshot. Unverified footage/music reuse rights: preview only; permission before public distribution.

**Do not modify `YunRah2103/yunus-video-lab`.**
