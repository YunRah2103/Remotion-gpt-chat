# YUNEX A4 — final actual-model camera refinement (Issue #130)

**Status: READY FOR MANAGER REVIEW — not APPROVED, not A6 picture lock.**  
**Original verified render source:** `f4956b05e9b557bd40b3bc9fd020c3ead840fcc7`  
**Successful native evidence:** [GitHub Actions run #39067372328](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39067372328) — 4 of 4 MP4 render jobs PASS.  
**Isolated proof PR:** [#142](https://github.com/YunRah2103/Remotion-gpt-chat/pull/142). **Machine-readable handoff:** [final-refinement-handoff.json](final-refinement-handoff.json).

## Actual assets (no stand-in geometry)

The test-only proof branch copied the latest unmodified A1 V6.3 sculpted `VehicleWorld/DetailKit/SculptedBody` source from `agent/turbo-3d-001-vehicle@9e0bee160e21436997fab74463c65c188585aab1`; A2 turbo with real curved turbine, common shaft, compressor, cooler `agent/turbo-3d-001-mechanism@4f894a51083e4ebaa652193713ee0baf56ba2439`; unchanged A5 PMREM reflective materials, road light and atmosphere `agent/turbo-3d-001-lookdev@db2c8f9b487bf5f80c415aeb585666bfeb44f7d3`; and A3 original `TurboFlow`, `CinematicFlow`, pinned routes from `agent/turbo-3d-001-airflow@dbe85ae2f12d7ab61177008bb6cb560847ab5a62`. No owned artist source was manually changed, no external stand-in models were accepted, and the master `src/Root.tsx` was not modified.

## Final four native MP4 review artifacts

| Sequence | Frames | Full original MP4 SHA256 | GitHub artifact |
|---|---:|---|---|
| Real turbine blade hook, first-second hub minimized | 90 | `187f53689394ae80e3c1817d30d9d0b0c65fee8b87a469103ea57ff7a4cbc595` | [12114036853](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39067372328/artifacts/12114036853) |
| Real rotating hot-side rotor → common shaft → compressor, CAMERA UNCHANGED | 120 | `05cc0e3f7b578e5317ca67b80255fdb6c18c0ab972a6d9fefaffee0592dbb81c` | [12113967419](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39067372328/artifacts/12113967419) |
| A2 real cooler + A3 real animated clean charge path, real A5 lighting | 120 | `635e73c7287c494623a150749e85797c6ebc8d810e9cc758db1079ac8a46ce77` | [12114200783](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39067372328/artifacts/12114200783) |
| V6.3 sculpted teal A1 car on native moving road, corrected low-angle framing | 120 | `40c35127c4612914c67dea132c99aa02cbf6197c131ba7d5579148e8774bcc0d` | [12113373138](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39067372328/artifacts/12113373138) |

**True media verification:** Native Remotion / Three / software WebGL `--gl=swangle`; 432×768 portrait camera-QA H264 `yuv420p`, 30fps. Independently downloaded each original Actions ZIP, compared computed MP4 SHA256 to embedded SHA256SUMS, FFprobed codec/frame count, fully decoded every MP4 with `ffmpeg -xerror`, checked that **all 450 out of 450 frame hashes differ**, and visually inspected moving footage and contact sheets. All checks PASS. Clips concatenate to an independently verified **15.0s, 450-frame moving camera review** in the ChatGPT production session (not a final film).

## Visual decisions

1. **Hook:** the real rotating A2 blades are visible at frame zero. The oblique arc reduces frontal projection of the central shaft/hub; genuine machinery remains prominent, amber warm/cyan cold sides identifiable. Hub still physically visible, not digitally removed.
2. **Common shaft:** maintain the previously verified frame-driven camera system **unchanged**; shows the actual single shaft connecting turbine/compressor, remains the strongest explanatory movement.
3. **Intercooler:** clear A2 finned core and route; A3 genuine animated cyan/cooled-charge parcels added at controlled intensity; timed `CLEAN AIR` and `INTERCOOLER` labels. Note the original A3 glow uses `depthTest=false`, so some parcels overlay pipe surfaces. Manager/A3 may need depth/masking QC at full resolution. This is not scientific CFD.
4. **Road:** first V6.3 integration render was **rejected** because front corners clipped at both ends. The camera was widened/pulled back only in A4's `roadHero` path; real corrected native MP4 was rerendered and visually checked, preserving full sculpted front/wheels throughout sampled movement, low-camera sweep, moving road and A5 lighting. Vehicle uses original 3D A1 sculpted body, not a box proxy.

## Hand off to Master Editor (Agent 6)

Import `CameraDirector.tsx`, `cameraMath.ts`, `KineticLabels.tsx`, and copy the **named real A2 world-anchor mapping** from `RealModelPreview.tsx`. For the charge segment, place original A3 `TurboFlow`/ `CinematicFlow` above the A2 mechanical rig and respect its documented flow routes/ports. Preserve A5's reflective environment and only `augment` A1's already-lit road scene. **Do not copy `PreviewScenes.tsx` primitive car/turbo into final film.** A6 determines pacing/cuts, VO timing, full 1080×1920 render, and final visual QC; A7 audio follows picture lock.

**Approval remains with A0.** These are 40%-resolution 3D camera proofs with no final voice/music. Independent approvals of A1, A2, A3, A5, final A6/A7 integrations are outside A4 and cannot be inferred from these four MP4s. Do not merge test PR #142 wholesale over teammates' source.
