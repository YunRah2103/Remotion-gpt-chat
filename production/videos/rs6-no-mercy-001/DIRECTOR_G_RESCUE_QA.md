# YUNEX RS6 // NO MERCY 001 — replacement director QA

**Date:** 13 October 2026  
**Issue:** #44  
**Branch:** `automotive-edits/rs6-no-mercy-001/g-director-rescue`

## Creative rescue delivered — owner-only movie

- **Playback delivered directly to the owner's originating ChatGPT conversation**: `YUNEX_RS6_NO_MERCY_001_RESCUED_PRIVATE.mp4`. It has **not** been uploaded to a public GitHub Release.
- Film SHA256: `98c9c554bcc9c4f62ffdec30369bf3413130362c84aa9caae26c46d069981160`; **13,016,065 bytes**.
- Final FFprobe: **1080×1920, 30 fps, 395 H.264 frames**, 13.166667 sec, 48kHz AAC stereo. Full FFmpeg decode **PASS**.
- FFmpeg blackdetect threshold: exactly one deliberate **0.033333-second frame at 7.700–7.733333 sec**; no other black runs. Audio silencedetect at -55dB / 0.2s: no silence events.
- **12 distinct unrepeated actual source moments**, all from **same model/generation and Daytona Grey C8 RS6** on Audi 4K-origin original. No white/red GT, no separate Tango Red/night footage, no stock footage/fake CGI/parked-car pan. Two non-driving accents (RS steering MODE, rear LED) are less than one second.
- Main moving-car music drop A starts **frame 158** with real 4K source hills/race-style corner; drop B at **frame 276** with an independent low tracking moving Audi frontal→side→rear pass. Reference audio from owner's own attachment was privately muxed only; never committed/uploaded to GitHub.
- **Creativity still subject to user review**: technical decode PASS does not imply the user has approved editing style.

## Source acquisition actually executed

1. Real A2/B2/C2 unpublished owner-only draft source MP4s fetched successfully through authenticated `gh release download`. 36 actual MP4s present; ffprobe SHA/manifests and contact QA: [run 38387134455](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38387134455), [artifact 11807141634](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38387134455/artifacts/11807141634). Silent 3.467s initial proof actually rendered there.
2. Extra original Audi 4K frame-based continuous motion scouting: [run 38387500558](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38387500558) and [run 38388072861](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38388072861). Each reviewed genuine distinct 4K temporal source frames, not guessed motion scores.
3. Two earlier new 4K source MP4s were generated, but rejected for sustained hero use due unsatisfactory portrait crop timing: [run 38387918688](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38387918688).
4. Eight **additional** distinct C8 original 4K-derived 1080×1920 30fps source clips extracted and full-decoded: [run 38388862382](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38388862382), private Actions artifact **11806969924**. The first crop render was rejected, then PTS was normalized and source start-frame trims were chosen via actual time-spaced contact-frame review.
5. Source verification and film recreation scripts: `g_source_rescue.py`, `g_audi_drive_scout.py`, `g_extra_driving.py`, `g_eight_moving.py`, `g_cohesive_private_film.py` and respective workflows on this branch. The final-film script intentionally requires a local user-supplied `RS6_ORIGINAL_REFERENCE` path and source MP4s in `RS6_SOURCE_DIR`; it never downloads or publishes reference music.

## Rights and S25 V4 reality

- Audi original audiovisual rights for YUNEX public social publishing **not yet demonstrated**; raw MP4s, edit and original soundtrack must stay owner-only review.
- Real phone worker V4 YouTube download test is **PASS only on an approved non-RS6 control video**: owner-created [issue #55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55), `YUNEX_PHONE_DONE_V4`, public rights-cleared [8.008 sec phone MP4](https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/yunex-phone-v4-55), 1920×1080 H264 and full decode PASS, SHA `6e0cc6baf8be000b7994f11cc9ba91230f1dfeb25c466224f2b0cd691f0d99d9`.
- Niterun and Maku Media RS6 YouTube originals rights-review [#49](https://github.com/YunRah2103/Remotion-gpt-chat/issues/49) and [#51](https://github.com/YunRah2103/Remotion-gpt-chat/issues/51) remain **NOT APPROVED**; no rights grant, no S25 RS6 registry entry or job. YouTube anti-bot on cloud is not an S25 result.
- No worker restart/reinstall requested; no unauthorized bypass. THE-LOWDOWN direct original MP4 was acquired and visually reviewed as a fallback, but **excluded from final** for Tango Red vs Daytona Grey continuity and limited effective portrait resolution. Its public publication rights also remain uncleared.
