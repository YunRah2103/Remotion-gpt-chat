# French Legends Agent C — FINAL 25-second revision handoff

**User's latest instruction (2026-10-12):** Completely remove the first clip and aggressively reduce to **25 seconds**. This document **supersedes ALL 60-second C picture handoffs**. Tracking [issue #28](https://github.com/YunRah2103/Remotion-gpt-chat/issues/28).

## Picture: verified user-facing private music previews

- **25-second 1080p MP4:** `YUNEX_FR_LEGENDS_25SEC_CINEMATIC_1080P.mp4`; source is the actual previously reviewed 60-second V5 film.
- **Output SHA256:** `1e18f99f3f800b9ac6e78e88f442f19996e4d619a7b9e9bc83005940a3b3ed92`.
- **Source clip count:** exactly 13 selected moving shots.
- **Technical facts:** 1920×1080 H264 yuv420p, 30fps, 750 frames, 25.000s, audio AAC 48kHz stereo.
- **Source clips starting before 5.42 seconds are EXCLUDED**, so no 2CV campsite/introduction, no DS intro, and no old 2CV-to-DS transition survives. First frame shows historic Alpine A110 approaching camera.
- Actual FFmpeg full A/V decode PASSED; a real 20-frame contact sheet was manually inspected, including the opening and golden-hour ending.
- A smaller 720p version also validated: SHA256 `6ad7c242d1ef2d45d9179ebff1877b3598fcae3a259c02a5004f7420d751d5e2`.

## Original French soundtrack (private)

**Use only the exact verified user-owned audio**, SHA256 `2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55`. D's own agent report confirms possession.

For this new 25s film use an **uninterrupted excerpt from time 35.000 to 60.000 seconds** of the original song. No altered speed or pitch; fade in for 0.18s and gain approximately 0.9×. This preserves the natural musical end rather than abruptly truncating at 25s of the original 60s. This song is NOT checked into the public repo.

## Faithful branch-only project artifacts

- Editable exact shot map: `agent-c/25S_CUT_SHOTMAP.json` including every source in/out point and 750-frame output timeline.
- True real-video picture editor: `agent-c/render_25s_picture.py`.
- GitHub Actions export workflow: `.github/workflows/fr-legends-c-25s-picture.yml`. It uses the previously validated original 60s muted picture artifact ID `11720519374` (not another car source or CGI) and exports a new muted 25s edit for Agent D.
- The private user preview retains the original soundtrack; the Actions output is intentionally **muted** to avoid publishing audio on GitHub.

## Creative / publication boundaries

Premium French cinematic mood; aggressive **duration reduction**, not GT3-style strobing/glitch cuts. Vintage Alpine / R5 Turbo / Peugeot -> modern Alpine -> Bugatti/Chiron. 25s does **not** mean speed-up footage or changing source song tempo.

This edit is technically QA-checked and ready for user critique, but copyright/reuse permissions for some source films are **not cleared**, and no independent E publication approval is claimed. D must deliver final audio-render QA for the new 25s target only.
