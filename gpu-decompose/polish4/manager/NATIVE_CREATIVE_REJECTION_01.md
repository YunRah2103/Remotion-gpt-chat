# POLISH04 — D integrated native creative QA, correction 01

**Reviewed source:** D real integrated proof run `37842472406`, source SHA `2e4f27ae24c04d558153ba8c01093b9430471292`, artifact `11578661945` (`GPU-POLISH4-D-NATIVE-PROOFS`).
**Exact locked A/B/C source:** A `a3113bb0a4b450696010c6496cfcb62d2a56e2c3` GLB SHA256 `edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e`; B `c7a4f2ac1c4cb1c3fb85237089a7a3853a3da682`; C `7090180c54405d6c82b8dc8873f4676c180cba10` motion SHA256 `d4790dc9dcc6572a0d6ee5478d70431194128055fdaf6d56c171d68ae1f06fed`.
**Material:** 12 real 1080x1920 PNGs at frames 0,30,60,100,135,180,225,270,310,365,415,449 and six real moving clips across changes. Compared directly with native POLISH03 audio-polished MP4 and B's provisional proof. Technical native Actions/FFmpeg stage succeeded; **creative sign-off: BLOCKED**.

### Actual strengths

- Native film now uses entirely POLISH04 839-mesh A geometry and C's 13 physical move tracks, not a silent POLISH03 fallback.
- Frame 100 center-fan detail is vivid and clearly closer than predecessor; fans separate in staggered depth.
- Cooler phase frames 180–270 demonstrates useful changing view and highlights real 3D cooler fins / metallic structures. Frame 310 PCB/VRM/processor proximity now materially more legible than POLISH03. These intentional macros crop outer edges without geometry disappearing.
- Lettering and backdrop stay restrained; no magenta output in the inspected native stills.

### Blocking creative problem (strictly targeted)

Frames **365,415,449** are essentially a distant, slightly rolling mini-explosion hovering below the 'DECONSTRUCTED' header. This is the specific payoff weakness the user repeatedly asked us to remove; the major components are recognizable but insufficiently dramatic at 9:16 phone size.

Full exported A geometry at final frame spans XYZ approximate bounds X -1.6 to +1.6, Y -0.66 to +0.61, Z -1.04 to +1.42 (scene units). Conservative exact mesh-corner perspective analysis of B's camera frame 449 (yaw~59°, roll -35°, FOV 32°) predicts about **87% viewport width but only 33% height** occupied by hardware. A physically truthful diagonal finishing angle near yaw 38–45°, roll -58 to -61° can achieve ~**90% width and 60–70% height** with the same model and motion, without full-object crop. This is a shot-composition correction, not a geometry scale cheat.

### Ownership decision and exact permissible correction

B's **completed** native renderer source is locked at `c7a4f2ac1c4cb1c3fb85237089a7a3853a3da682` in D's integration. Agent D exclusively assumes *post-handoff final integration* ownership of only:
- `src/gpu-polish4/camera.ts` — frames 364/405/449 target yaw, roll, bias for full exploded unit.
- `src/gpu-polish4/editorial.tsx` — move final caption title away from taller diagonal hardware.

B's branch/files remain independently untouched; D's final integrated SHA and camera SHA replace the provisional B copy only on D branch. Do not merge later B branch changes automatically; no two editors of the final D source.

Keep shot 0–329, all A meshes, all 13 C JSON transitions, anchors, scale, typesetting style, audio/encoding, 450-frame timeline unchanged. Do not stretch model or hide components. New composition end should fill substantially more screen height, preserve 3–6% left/right and meaningful title/label clearance, and show a smooth physical camera move then confident held view.

**Gate:** rerun final-D exact hash-locked native 12 stills and 6 moving clips after correction, inspect real 365/415/449 pixels, ensure all key pieces visible, title safe, no black/magenta, before authorizing full render. This review is a **FAIL/targeted-fix** document, not `NATIVE_VISUAL_REVIEW.md` required for release approval.
