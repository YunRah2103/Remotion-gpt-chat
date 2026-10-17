# YUNEX A4 — real-model cinematography handoff, Episode 001

**Manager-review state: REVIEW, not APPROVED or picture lock.**  
**Pinned source/render SHA:** `fadaee879e64cac3a43347e6d79010159a93403c`  
**Native render:** [successful five-way workflow #39059676339](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339)  
**Issue:** [#130](https://github.com/YunRah2103/Remotion-gpt-chat/issues/130) · **isolated test PR:** [#142](https://github.com/YunRah2103/Remotion-gpt-chat/pull/142)  
**Machine handoff:** [real-model-handoff.json](real-model-handoff.json)

## What was genuinely tested

Five standalone Remotion 4/Three.js software-WebGL moving compositions **using actual original A1, A2 and A5 source geometry/materials**, not the temporary stand-ins in `PreviewScenes.tsx`. Byte-identical snapshots were copied onto a separate proof branch for cross-owner integration testing; the original specialist branches and `src/Root.tsx` were untouched. A2 exports `TURBO_PIVOTS` and `TURBO_PORTS`; the A4 proof passes them into deterministic `CameraDirector` as named world anchors. A5's PMREM scene, art-directed light, opt-in material adapter, heat shimmer and road atmosphere are present. A1's real `VehicleWorld` supplies wheel and moving roadway.

- A1 snapshot: `0ea37cda916e809fd30514013a67a8034b491e87`
- A2 snapshot: `4f894a51083e4ebaa652193713ee0baf56ba2439`
- A5 snapshot: `db2c8f9b487bf5f80c415aeb585666bfeb44f7d3`
- Exact A4 real-model preview implementation/render: `fadaee879e64cac3a43347e6d79010159a93403c`

| Native moving scene | Frames | QA artifact |
| --- | ---: | --- |
| `YunexA4RealHook` actual spinning turbine, recommended cold open | 90 | [12111076813](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339/artifacts/12111076813) |
| `YunexA4RealExhaust` hot-side alternative | 90 | [12110958039](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339/artifacts/12110958039) |
| `YunexA4RealShaft` through common turbine/compressor shaft | 120 | [12111260846](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339/artifacts/12111260846) |
| `YunexA4RealCharge` clean-side route into actual finned intercooler | 120 | [12111047243](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339/artifacts/12111047243) |
| `YunexA4RealRoad` low-angle hero of actual teal A1 sports car | 120 | [12111360171](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059676339/artifacts/12111360171) |

**Integrity:** 540/540 actual frames verified across 18s; native source was 432×768 portrait @30fps, converted to limited-range H264 yuv420p for portable playback. All five MP4s FFprobed, independently full-decoded with `ffmpeg -xerror`, SHA256-matched and verified distinct motion frames. Video frames and contact sheets were sampled at 0.10, 0.50, 1.00, 1.50, 2.00, 2.70 and 3.20s (clamped for 3-second clips). This is 40%-scale cinematography QA **not** a final film, and it has no mastered narration/music.

## Visual assessment

**Opening:** actual rotor occupies useful portrait area at frame 0 and camera travels off-axis without losing rotating blades; suitable initial hook. `RealExhaust` is a warmer alternate but less immediate.  
**Shared shaft:** one continuous visually clear metal axle connects the real hot turbine to compressor; useful educational beat. The housing and circular rotor hub can obscure the wheel if pushed fully head-on, so retain oblique shot framing.  
**Charge:** the revised shot starts on clean-side metal pipe and progressively reveals actual A2 finned intercooler; typography changes from CLEAN AIR to INTERCOOLER at the correct scene phase. Do **not** imply cooled air creates air mass. A3 flow particles are not in this review.  
**Road:** low-moving-front 3D shot uses the A1 original teal sports car against true parallax roadway, A5 glossy reflections, and no giant title. Car is deliberately stylised/blocky; manager may request close-angle body/wheel refinement, an A1-owned change.

The five clips have visible real animation and avoid blank-frame cuts. No camera surface penetrations were observed in the sampled footage, **but this is not a complete formal 3D clearance proof for every future A6 shot**. The styling remains subject to manager judgment, especially visible car front silhouette and hub occlusion.

## Import notes for Agent 6 / Agent 0

Use `CameraDirector.tsx`, `cameraMath.ts` and `KineticLabels.tsx` from the **source-locked proof**, and consult `RealModelPreview.tsx` for the actual A2 named-anchor mapping and A5 lighting adapter. DO NOT carry `PreviewScenes.tsx` stand-in geometry into the final film. A6 owns the master `Root.tsx`, multi-scene transitions, actual VO-bound shot times and all final 1080×1920 native render checks. A7 owns final narration/music/SFX, synchronization and audio QA; A3 owns engineering flow/combustion. **Do not merge proof PR #142 wholesale over independently advancing A1/A2/A5 branches.**

**Suggested preferred sequence:** real turbine hook → common shaft → charge/intercooler → road hero, with hot exhaust track available as an explanatory insert. Trim and retime only after real VO/audio is measured, not from these preview durations.

**Approval gate remains explicit:** A0 reviews all latest model and lookdev visual sources, then marks A1–A5 each APPROVED independently. This document is a verified A4 camera handoff, not manager sign-off.
