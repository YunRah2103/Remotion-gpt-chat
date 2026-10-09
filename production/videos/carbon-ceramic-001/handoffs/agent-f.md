# Agent F — Polish04 verified full native candidate handoff

**STATUS: REVIEW — NEW POLISH04 750-FRAME MP4 TECHNICALLY COMPLETE. Master release NOT approved.**

- Repository: `YunRah2103/Remotion-gpt-chat`
- Render branch: `automotive-brakes-001/f-render`
- **Immutable integrated E film source:** `21c2b581b46251b0bd45028d32eb40b4341eeb2a`
- **Final render pipeline code:** `9f8b32702a99b551898b78cf8283f16b35156875`.
- [E source-locked Polish04 proof PASS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37981542125).

## Genuine complete film

[**Download playable Polish04 MP4, native stills, contact, FFprobe and full decode QA — artifact #11641871804**](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804).

Actual full assembly and verification [Actions run 37983072846 SUCCESS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846).

| Property | Verified |
| --- | --- |
| Film | `carbon-ceramic-001-polish04-candidate.mp4` |
| Video engine | Real `CarbonCeramic001` Remotion/Three.js, not old footage |
| Native frame chunks | 10 x 75 from one immutable Polish04 SHA |
| FFprobe/frame decode | **750/750 PASS**, exactly **25.000 seconds** |
| Dimensions/fps | **1080×1920 / 30/1** |
| Codec, pixel format | **H.264, yuv420p** |
| Full FFmpeg decode | **PASS**, no corrupt frames |
| Bytes | **12,314,696** |
| Film SHA256 | `fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb` |
| Audio | **Absent** — no approved authentic VO verified |
| Formal D/Master creative signoff | **PENDING** |

[Native chunk run 37982325309](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982325309) built frames 0–74 and 150–749 successfully. Original runner for 75–149 stalled installing dependencies; [independent recovery run 37982665013 PASS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982665013) rendered those exact pad demo frames from the **same new source SHA**, not from the previous candidate. All ten SHA256 and 75/75 frame checks passed before assembly.

## Polish04 specific findings

- **Pad onset**: the main film now includes a truthful caliper-hidden cutaway during frames100–147, with the physical per-face clearance decreasing **2.50 to 0.15mm**, a maximum **2.35mm** travel. Native actual frames105/117/132/145 reviewed.
- **Hero orbit**: the 630–749 shot shows clear changing perspective. Across frame600–749, the average adjacent grayscale frame difference improved **0.16493 → 0.25263 (+53.17%)** versus the previous 25s native candidate. Near-still frame pairs decreased **108 → 25 / 149**. Proxy size 180×320, decoded at full 30fps; not a subjective quality rating.
- **Thermal**: scoped illustrative heat on rotor annulus in the real film, not a precise measured heat simulation.
- **Still open for D**: pad motion still visually subtle at phone scale; brief dark transition overlays at frames99–100 and 147–148 may look like flashes; subdued dark material lighting / generous negative space; final hero ends side-on. Automated freeze warnings in intro/benefits need creative review, not codec repairs.

**Full source, run, artifact, FFprobe/FFmpeg, SHA and visual report:** [`render/POLISH04_REPORT.md`](../render/POLISH04_REPORT.md). Quantified reproducible metrics: [`render/POLISH04_MOTION_QA.json`](../render/POLISH04_MOTION_QA.json). Older first-candidate report is preserved only for historical comparison.

Master final `SOURCE_LOCK.json` and `master_gate.py --require-ready` are **unchanged**. Master alone authorizes final release. Agent F [PR #16](https://github.com/YunRah2103/Remotion-gpt-chat/pull/16) contains this technical render handoff.
