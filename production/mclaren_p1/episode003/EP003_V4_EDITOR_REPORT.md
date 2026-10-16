# YUNEX Episode 003 — McLaren P1 Active Airbrake — V4 verified editor handoff

**Edited and technically QA-verified:** 16 October 2026. **Status:** completed **private-review** film; human creative approval and source redistribution permissions NOT established.

## Completed owner-only MP4
- Filename: `YUNEX_EP003_V4_McLaren_P1_ACTIVE_AIRBRAKE.mp4` (delivered to owner in ChatGPT private artifact; no third-party footage published to GitHub).
- Exact SHA256: `e17f1c56c3b9236e91e2fb76b48db6780bedb9a72160f3e6480a4dab308d0df6`.
- Size: 15,810,796 bytes; duration **19.100s**, **1080×1920**, **30fps**, **573 video frames**, H.264; AAC stereo.
- Full FFmpeg `-xerror` audio+video decode **PASS**, FFprobe resolution/fps/duration/frame count **PASS**.
- The baseline `195543.mp4` approved AAC was stream-copied into final without decoding/re-encoding. `ffmpeg -f streamhash -hash sha256` for baseline and final AAC **MATCHES EXACTLY**: `2d3131b33cccf278b00b6e9889f025b16c91d3537f92ad96cf3b1d80d4caf1f5`. Do not silently replace this narration/score in a subsequent version.
- Owner-only reproducibility bundle: `YUNEX_EP003_V4_EDITOR_SOURCE_AND_QA.zip` (ChatGPT artifact). Contains `build_v4.py`, `engineering.py`, `run_complete.sh`, checksum/FFprobe QA, latest contact sheets, and README. **Does not contain third-party media or approved audio**. The final code used OpenCV/FFmpeg shot conforming and VTK 3D illustrative wing rendering, **not an existing Remotion composition**; do not claim it is a Remotion native composition.

## Recovered and protected originals
- Recovered exact owner-rendered V3 files `195543.mp4`, `YUNEX_EP003_V3_P1_AIRBRAKE_MASTER.mp4`, original Cedar MP3 and footage ZIP `YUNEX_EP003_P1_PRIVATE_EDITOR_READY.zip` through the owner's ChatGPT Library.
- Source footage handoff and verified SHA/timecode manifest: [FOOTAGE_HANDOFF.md](FOOTAGE_HANDOFF.md), issue [#109](https://github.com/YunRah2103/Remotion-gpt-chat/issues/109).
- `08` is genuine wing **rising on a stationary silver P1 in Race Mode** (Shmee150). It is **NOT filmed braking**. Silver Nürburgring shots are genuine P1 driving but do not independently prove on-track airbrake pitch.
- Creator rights/public redistribution authorisation **unverified**; this MP4 is for private owner review, not a cleared upload asset. Keep media out of public GitHub.

## Changes relative to V3
- Opening starts with a fast genuine silver P1 trackside close pass; transitions quickly into cropped verified wing-rise footage labelled `STATIONARY / RACE MODE`; removed visible extraneous source corner marks through reframing instead of erasing retained creator attribution.
- Engineering explanation 5.46–8.66s: short, dimensional metallic 3D wing pitch/struts, camera/lighting and airflow treatment. On-screen `ENGINEERING VISUAL / ILLUSTRATIVE`; separately explains **aerodynamic drag** and **increased rear downforce under braking**. Not licensed P1 CAD, validated CFD or genuine on-track airbrake video.
- Middle: verified silver moving overhead, cockpit, corner and rear-wheel/wing-camera material; track dynamic reframing corrected to keep car in portrait crop. No random transitions/outro title.
- Ending 17.25–19.10s: continuously tracked authentic silver front approach and closer drive-by rather than long empty track.
- Actual 1920×1080 source has some baked mattes; crop/upscale to full-screen 9:16, **not native portrait 1080p camera acquisition**.

## Execution reproducibility
- Private ChatGPT owner ZIP has exact source scripts and project metadata; archived source input names match `MP4_SELECTS/P1_01...` through `P1_08...` from existing handoff.
- Film edit EDL and scene ranges also recorded as `EP003_V4_EDIT_DECISIONS.json` in this GitHub folder.
- For later fixes preserve unchanged V3 AAC, stationary-vs-driving provenance, silver continuity, and working shots; edit narrowly. Re-review actual complete render and full-decode before release.
