# YUNEX GT-R R35 — Cinematic ATTESA E-TS master | 15 October 2026

## Verified delivered master
The completed **narrated** 27.5 s landscape MP4 was generated locally in the user's ChatGPT conversation, not uploaded to the public repository:
- File: `YUNEX_GTR_R35_ATTESA_CINEMATIC_FINAL.mp4`
- SHA256: `a202653c2e13c4fc8ca99515fe22aefe8be3d5b1915658bd57538bda3a56ab51`
- 1920×1080, 30 FPS, 825 frames, H.264, AAC stereo at 48 kHz
- **Both full video/audio FFmpeg decode PASS**
- Audio: user's **original** Alloy MP3 narration and original Killswitch Lullaby music mixed to `YUNEX_GTR_ATTESA_APPROVED_AUDIO_BED.m4a`; final mix EBU R128 approx **−18.99 LUFS** and true peak **−4.86 dBFS**.

## Material and quality
- Three V4 originals #97–99 were independently SHA256-checked and privately recovered using the encrypted `yunex-gtr-sealed-film` transport; original bytes were **not** committed or published.
- **The first GitHub picture proof is NOT the final edit.** Manual contact sheet review rejected its opening garage/people shots and Nissan's baked-on advertising-text end card.
- New master is an independently edited FFmpeg version using reviewed footage from original recordings #98 and #99, plus the authenticated 13.97–20.67s Remotion drivetrain animation from the corrected picture render.
- Final film uses new YUNEX editorial title and caption track, coherent restrained color grade, real moving car footage, and source-matched narration.
- Master is user-downloadable within ChatGPT. No source video/audio has been made public by this handoff. **Publication reuse rights for the third-party recordings/music remain unverified.**

## Actual 30fps picture edit decision list
All ranges are `[timeline from, to)` seconds. Original source times are relative to phone source file. Each is a verified full source video (not scene-list guesses).

| Timeline | Original media and in-time | Editorial purpose |
|---|---|---|
| 0.00–1.80 | #99 at 79.80s | Blue GT-R driving, front three-quarter hero |
| 1.80–3.567 | #99 at 67.25s | Red GT-R drifting/racing |
| 3.567–5.067 | #99 at 49.50s | GT-R race front approach |
| 5.067–7.700 | #98 at 7.07s | Grey R35 seen from rear at launch |
| 7.700–9.500 | #99 at 61.22s | White R35 moving in wet road conditions |
| 9.500–11.567 | #99 at 55.15s | Blue GT-R exterior and engine transition |
| 11.567–13.967 | #99 at 63.60s | White GT-R close moving road front |
| 13.967–20.667 | Private Remotion corrected picture at 13.9667s | Original conceptual ATTESA E-TS rear-biased-to-front-assist animation, not live telemetry |
| 20.667–22.600 | #99 at 75.30s | Curving road cornering footage |
| 22.600–24.700 | #99 at 81.47s | Track GT-R chase / moving frontal hero |
| 24.700–26.300 | #99 at 50.07s | GT-R racing detail and moving reflections |
| 26.300–27.500 | #99 at 85.16s | Two GT-R silhouettes moving into sunset |

**Engineering accuracy:** official Nissan R35 documentation supports 0:100 front:rear normal torque distribution and up to 50:50 on demand; no vehicle sensor data is implied. See https://usa.nissannews.com/en-US/releases/us-2017-nissan-gt-r-press-kit.

## Future revisions
Continue from this curated source-time list rather than reverting to the poor initial `src/yunex/GtrAttesaFilm.tsx` first-shot selection. The newer mastered video is saved in the ChatGPT conversation; the earlier GitHub picture proof remains a separately useful technical diagram resource. If rebuilding, preserve both user-supplied narration and original musical bed. Do not re-upload those user files into this **public GitHub repository**, and do not reuse third-party clips publicly without appropriate permission.
