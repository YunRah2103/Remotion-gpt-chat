# Agent 3 — airflow/intercooling/combustion

Actual R3F work for #129: `src/yunex/turbo3d/airflow/TurboFlow.tsx` contains deterministic frame-driven independent gas streams, animated intercooler fin heat removal and illustrative piston/combustion cycle. No root film edits. The isolated Remotion test entry is `src/yunex/turbo3d/airflow/preview/entry.ts`.

**Important:** `flow-ports.json` uses explicitly **TEMPORARY_STUB_UNVERIFIED_A2** world-space coordinates. A2's immutable final mechanism manifest, eight real named ports and SIX reviewed pipe centrelines must replace them. The `ports` prop alone is not sufficient if actual pipes bend; use `routes` keyed by route ID. Never include test stand-in hardware in A6 master.

API: `TurboFlow({frame,phase,ports,routes,intensity,visibility})`. Phases: exhaust, turbine, compressor, intercooler, combustion, full. Intensity/visibility normalized 0..1. World Y-up, vehicle +Z, metres. Shared turbo shaft drives the compressor but exhaust and clean intake gases stay separate; no mass invented by intercooler. 19 instances per fresh-air segment, with deterministic seed jitter, and illustrative flow speeds (NOT CFD).

Native Remotion test (when repository dependencies are available):
```bash
npm ci
npm run check
npx remotion render src/yunex/turbo3d/airflow/preview/entry.ts A3AirflowReview out/A3Flow.mp4 --gl=swangle --scale=0.333 --codec=h264 --pixel-format=yuv420p --concurrency=1
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json out/A3Flow.mp4
ffmpeg -v error -xerror -i out/A3Flow.mp4 -f null -
```

The isolated composition is 1080x1920 at 30fps, 330 frames, five 66-frame intervals. A preliminary offline **independent VTK 3D motion proxy** was rendered/decoded at 360x640, 20fps, 220 frames, 11 seconds. That proves moving 3D routes but **does not certify native Remotion rendering or final visual quality**. See issue #129 for artifact and SHA256.

Limitations: particles are schematic directional explanatory flows, no measured pressure, horsepower, velocity or CFD; piston/thermal effects simplify timing, cooling changes colour not air mass. A2 port/geometry compatibility and a verified native R3F render are pending. Scientific, appearance and editor approval are separate gates.

## Agent 2 candidate compatibility (second real moving proof)

Agent 2 issued candidate source snapshot `a658ef8de63b4848c0d33fec6fd75e5a9287b4cc`. The agent-owned `a2-candidate-routes.json` mirrors the actual eight published ports and A2's named curves for manifold, filter, compressed-air pipe, intercooler and return to engine. `src/yunex/turbo3d/airflow/A2CandidateAdapter.ts` exports `A2_CANDIDATE_PORTS`, `A2_CANDIDATE_ROUTES`, `A2_CANDIDATE_SOURCE_SHA`, and a port consistency check. Port adapter data is **not independently manager-approved**. Two short inside-the-housing rotor-throat transitions still need A2 visual validation. The data is pinned, not dynamically imported from another agent's unfinished branch.

Usage **after A2 source is merged/frozen** (illustrative):
```tsx
<TurboFlow frame={frame} phase="full"
  ports={A2_CANDIDATE_PORTS} routes={A2_CANDIDATE_ROUTES}/>
```

Independent A2-coordinate VTK 3D review: `A3_A2_CANDIDATE_FLOW_3D.mp4` in the user ChatGPT conversation, H264 360x640 at 20fps, 220 frames / 11s, full FFmpeg decode PASS, SHA256 `7448d7499fd4c9abbbc3e835e88867e07d860b7e836f8fc452fc24533bb31a3c`. Preview uses explanatory dummy turbo casing, **not** A2's complete native geometry and **not** a Remotion render. All final physical alignment remains subject to native R3F geometry QC.

The TypeScript strict-check passed on [Actions 39042037668](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39042037668), and repository native **generic** PR visual check passed [39042037661](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39042037661). These do not directly render `A3AirflowReview`; a genuine dedicated A3 Remotion proof is still needed before APPROVED.

Scientific route tests for the pinned candidate: `python production/yunex/turbo_3d_001/agents/airflow/test_a2_candidate.py`. It validates port endpoint geometry but cannot certify that rendered particles do not collide with the A2 housing. Ask Agent 2/manager to confirm the inner volute throat transition before integration.

## Native Remotion delivery — visual QA round 2

The **dedicated real R3F Remotion render** passed on [run 39042989345](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39042989345), commit `35ba0c0ecc29a692b0fd4dba130091596d81bc85` with five inspectable [H.264 phase MP4s](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39042989345/artifacts/12104513415) at 540x960, 30fps, 30 frames each. FFprobe, full FFmpeg decode, 30 distinct frame-hash checks per phase passed. The videos were additionally downloaded and visually inspected; the initial horizontal scene was rejected as too empty for vertical mobile viewing, and the approved **test-only camera framing** was rotated diagonally for fuller use of 9:16 space. This does not touch the reusable physics or Agent2 geometry.

A user-viewable 5s/150frame stitched **review only** MP4 from the five ACTUAL Remotion phase clips is available in the chat as `A3_NATIVE_PORTRAIT_REVIEW.mp4`, SHA256 `fbe635c1462ff9725ab7b9e6e5fdeb9b355ec9cf1dc21bf7608818e3957d7ba5`; full video decode PASS. Native per-phase checksums and links live in `asset-manifest.json`. This stitching is solely for A3 visual review: **not** an A6 production edit or approved final release.

Before integrating with A2 geometry, use the candidate adapter only with a manager-frozen A2 source SHA, then do a **new physical geometry overlay** and confirm particles stay in visible tube/volute centres, including turbine and compressor throat entrances/exits.

A3's source package is **ready for specialist QA review**; manager approval and true combined A2 geometry QA are still outstanding.

## 2026-10-17 — CINEMATIC VISUAL QUALITY REWORK (ACTUAL AGENT2 MODEL)
Manager rejected the first A3 native test as extremely tiny technical diagrams. The new isolated A3 source preserves the original `TurboFlow` physics, 8 ports, six directional paths and deterministic frame-based animation.

- **Actual frozen A2 mechanical asset:** `src/yunex/turbo3d/airflow/preview/a2-frozen/{TurboMechanism.tsx,ports.ts}` are **byte-identical immutable source snapshots** from A2 branch commit `4f894a51083e4ebaa652193713ee0baf56ba2439`. These are real A2 upgraded volumetric scrolls, common mechanical +X shaft, compressor/turbine, four-cylinder head and intercooler. The A2 original source files are unchanged. A2 actual eight port tuples match the existing A3 candidate route interface; preserved `TurboFlow` uses those routes.
- **Artist-only cinematic layer** `src/yunex/turbo3d/airflow/CinematicFlow.tsx`: frame-driven layered soft translucent light parcels + brighter cores along *the SAME six A3 routes*, color-separated exhaust amber and cyan fresh intake. Cutaway-visible glow is deliberate illustrative energy and should **not** be characterized as CFD.
- **Power window** `PowerWindow.tsx` is an A3-only piston/ignition X-ray overlay anchored in front of A2's **real engine** (not replacing it). Following initial visual rejection of a floating combustion stream, we fixed camera and limited intense outer gas glows to cooled-air + separately fuel.
- Phase-specific macro perspective cameras with restrained parallax and strong hot/cold lighting; framing now uses large real model geometry instead of empty dark space.
- **Five new native H264 videos:** [source CI 39059260120](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059260120) and [five actual clips/artifact 12110533804](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39059260120/artifacts/12110533804). Each clip 540x960 30fps 30 frames, verified FFprobe, full FFmpeg decode, all 30 distinct frame hashes; see `asset-manifest.json` for per-phase SHA256. Native frames inspected individually; engine shot explicitly improved in iteration V2.
- Separate **review-only** 5s/150 frame true native concatenation: `A3_TURBO_REAL_MODEL_CINEMATIC_V2_REVIEW.mp4` in conversation, SHA256 `6ab1da8f84c5525694f8ccbcfb0eef051468805267a1071d2f38e67212679bfe`, full FFmpeg decode pass. Native previews and source are real, but **not final A6 integrated film**.
- Strict TypeScript `npm run check`, A3 port/route tests, typed handoff validator all passed on Actions. Manager scientific/color/story approval still needed; A2 cavity paths are currently illustrative candidate centrelines (interior turbine throat clearance still needs signoff). Original physics and A2 owned sources preserved.

**Status: REVIEW — TARGETED UPGRADE IMPLEMENTED AND VERIFIED.** The user/manager must independently judge whether this meets the premium cinematic look before APPROVED.
