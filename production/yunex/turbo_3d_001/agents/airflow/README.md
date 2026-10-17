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
