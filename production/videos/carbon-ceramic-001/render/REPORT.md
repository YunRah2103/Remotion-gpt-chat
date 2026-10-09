# Agent F — Carbon-Ceramic Brakes 001 native candidate render report

**STATUS: FIRST FULL-LENGTH CANDIDATE RENDERED AND TECHNICALLY VERIFIED; NOT APPROVED FOR RELEASE.**

Repository: `YunRah2103/Remotion-gpt-chat`
F branch: `automotive-brakes-001/f-render`
Immutable **Agent E FILM SOURCE SHA**: `5b378202187748ce9b51d884f26bb7167285c946`
F candidate assembly tooling commit: `dcc710b04478784233fda1743904cee9e7b057af`
Master final-source lock and Master release workflow: **UNCHANGED**. This workflow did not claim Master acceptance or bypass `master_gate.py --require-ready`. It is a review-candidate path only.

## Actual complete 25-second playable MP4

| Test | Actual verified value |
| --- | --- |
| Film | `carbon-ceramic-001-candidate.mp4` |
| Native source | Exact E commit `5b378202187748ce9b51d884f26bb7167285c946` |
| Engine | Genuine Remotion `CarbonCeramic001` + Three.js `BrakeAssembly`, not slideshow or schematic |
| Frames | **750/750 declared and decoded; PASS** |
| Duration | **25.000000 seconds; PASS** |
| Resolution | **1080x1920 portrait; PASS** |
| Frame rate | **30/1 average; PASS** |
| Codec | **H.264; PASS** |
| Pixel format | **yuv420p; PASS** |
| Audio | **None** — no user-approved voiceover supplied |
| Full FFmpeg decode | **PASS**, no corrupt-frame errors |
| MP4 bytes | **12,875,114** |
| MP4 SHA256 | `e7ed2619ab6ed09087cdb50cfc2b4fb94e3262aa69da77b72e5142bcb51bec73` |
| Automated blank/black detection | No intervals reported |
| Automated freeze/stillness detection | **Review flags** for quiet opening and late shots; see below |
| Creative approval | **PENDING Agent D + Master** |

**Verified official GitHub Actions candidate:** [run 37978273707](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707) — **SUCCESS**, [artifact 11639835454](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707/artifacts/11639835454), includes the actual full MP4, five native extracted stills, contact sheet, FFprobe JSON, complete QA JSON, SHA256, and source lock manifest. Artifact retention: 30 days.

### Frame provenance and true-native operations

1. Original `candidate` full-res native [run 37976771520](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976771520) produced the eight successful original 75-frame ranges 00–06 and 08 at E source SHA above. Chunk 09 failed once from missing optional native Rspack binding; chunk 07's runner stalled during OS dependency install. Successful original chunk artifacts were preserved.
2. Recovery [run 37977591114](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37977591114) rendered only 07 (525–599) and 09 (675–749) as full-resolution native Remotion/Three.js with Rspack dependency recovery. Both native MP4s and per-part technical FFprobe/full-decode QA passed.
3. First join [run 37978101268](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978101268) verified **all ten part hashes**, assembled and fully decoded **750 frames / 25 seconds**. It reported `yuvj420p` (full-range), correctly **FAILED** strict `yuv420p` delivery criterion. This intermediate is not the approved candidate.
4. Corrected final assembly [run 37978273707](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707) retrieved all ten genuine source-matched chunks, verified independent part checksums and FFprobe, concat-copy assembled their frames, converted `yuvj420p` full-range to explicit TV-range `yuv420p` using FFmpeg, then checked all 750 frames with FFprobe **and full FFmpeg decode**. Final reports and MP4 artifact **PASS**. No visual source was changed and no narration was fabricated.

### Real preliminary visual review

I reviewed the actual final-source sample images from frames **0, 48, 100, 168, 250, 321, 440, 531, 650, 705, 749** plus the official still contact sheet frames **48, 168, 321, 531, 705**:

- **Frame 48 opening:** Minimal ghost-car outline and front brake position read as intended, but the dark, faint line art and small brake occupy relatively little of the portrait. **Creative improvement needed** to strengthen attention in first seconds.
- **Frames 168 / 250 mechanical reveal:** Caliper, friction disc and hub visibly render with 3D geometry; labels are placed safely, no obvious full-frame clipping. Caliper material is dark and its pad/contact detail is not clearly legible at phone-scale proof size. The physical 2.35 mm pad stroke may be visually subtle.
- **Frames 321 / 440 thermal:** Disc face shows the illustrative copper/brown heat treatment, rotor/caliper remain visible, and `THERMAL VISUALISATION — ILLUSTRATIVE` appears. Heat differentiation and rotational motion need Agent D's full video judgment; not a measured temperature simulation.
- **Frame 531 benefits:** `FADE RESISTANCE` typography visible with isolated real brake 3D assembly. Composition is safe but very dark, with substantial unused space.
- **Frames 650 / 705 / 749 hero:** Disc, center hat and caliper stay within frame, including the last shot. Stronger reflections/material lighting and more dynamic camera choreography would improve premium visual polish.
- **Freeze detections** (not corrupted frames): approximately 0.5–2.03 s; around 15.8–20.37 s with interruptions; around 21–24.83 s in successive intervals. These need watching on the real MP4; some may correspond to intentionally static shots. Automated motion alerts do not, on their own, fail codec or frame continuity.
- **No detected black/blank intervals** under the configured detector. Typography is legible in the large frame; miniature part labels merit independent phone review.

**Conclusion:** Technically complete playable native candidate. Visual quality is **not signed off**. Agent D should independently review opening energy, clamp legibility, material exposure, heat contrast, late-shot stillness and transition continuity; Master decides improvements and eventual final source acceptance.

### Open items

- Agent A/E Polish 03 may produce a newer alternative source; this first candidate is deliberately **source-locked to 5b378202...** and not silently updated to their future changes.
- Agent D's formal independent review of the final 25-second candidate, including transitions, is pending.
- Master approval and source-lock release gate still pending.
- Approved narration not supplied; video is deliberately silent. Master handles any future user-approved voiceover and final release.

Technical render ownership: F only. No modifications to `YunRah2103/yunus-video-lab`.
