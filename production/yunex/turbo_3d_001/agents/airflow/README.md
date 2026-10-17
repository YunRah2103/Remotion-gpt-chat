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
