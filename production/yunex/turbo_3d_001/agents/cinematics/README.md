# Agent 4 — Camera choreography and motion typography (Issue #130)

This is **working original source**, not a final film or a claim that the separate A1/A2 models exist. A4 does not own the master edit, Root.tsx, sound or lookdev. Branch: `agent/turbo-3d-001-cinematics` based on `production/yunex-turbo-3d-ep001`. See [manifest.json](manifest.json) and [handoff.json](handoff.json).

## Contents

- `src/yunex/turbo3d/cinematics/cameraMath.ts` — independent deterministic 3D camera poses (7 variants), all anchors replaceable in metres.
- `CameraDirector.tsx` — R3F CameraDirector with `{frame,shot,durationInFrames,anchors,visibility}`.
- `KineticLabels.tsx` — safe-area-small labels for HOT EXHAUST, TURBINE, ONE SHAFT, CLEAN AIR, INTERCOOLER. Motion derives **only** from frame.
- `PreviewScenes.tsx` — explicitly **temporary** original rotating turbo/flow/car stage proxies. NOT A1/A2/A3 deliverables; not manufacturer CAD.
- `previewEntry.tsx` — five *standalone* Remotion preview compositions; intentionally not registered in main Root.
- `camera.test.cjs` / `render-previews.sh` — repeatable local/CI test and render commands.

## Visual arc and editorial handoff

| Sequence | Preview | Local frames | Editorial value |
| --- | --- | --- | --- |
| Hook A, **recommended** | `YunexA4HookOrbit` | 0–89 | Immediate spinning face and exhaust energy; oblique camera angle keeps blades visible on narrow phone. |
| Hook B, alternative | `YunexA4HookRush` | 0–89 | Exiting pipe chase toward rotor; may suit VO beginning 'Hot exhaust...'. |
| Common shaft | `YunexA4Shaft` | 0–149 | Rotating turbine -> uninterrupted single shaft -> clean-side compressor, no particle path swapping. |
| Charge/engine | `YunexA4Charge` | 0–149 | Follow *clean-side* outlet toward intercooler and engine; replace all proxy coordinates with A2 actual anchors. |
| Road payoff | `YunexA4Road` | 0–119 | Low hero orbit and animated road; A1 authored teal vehicle replaces box car. |

A4 additionally exports `exhaustTrack` and `compressorReveal` rig paths. Shot boundaries remain **provisional**, not fabricated VO timestamps. Film editor A6 can retime using actual narration and validated A1/A2 geometry.

### Run actual native WebGL previews

From repo checkout with project dependencies available:

```bash
npm ci
npm run check
node production/yunex/turbo_3d_001/agents/cinematics/camera.test.cjs
bash production/yunex/turbo_3d_001/agents/cinematics/render-previews.sh
python production/tools/handoff.py production/yunex/turbo_3d_001/agents/cinematics/handoff.json
```

The helper invokes `npx remotion render src/yunex/turbo3d/cinematics/previewEntry.tsx ... --scale=.4 --gl=swangle` and checks `ffprobe`, full `ffmpeg -xerror` decode and SHA256 for **each** moving MP4. Generated video goes to `out/yunex/turbo3d/a4/` and should be uploaded as a private Actions artifact with run ID and exact SHA once a permitted render runner is supplied.

**Execution proof as of this handoff:** existing GitHub production CI passed TypeScript and its *historical* WebGL smoke composition. In the originating agent session, 4 genuinely moving **independent software 3D proxy** concept videos were produced (432×768, 30fps, 3s each) with full MP4 decode / frame-motion checks and user-visible sandbox links. **They are NOT native Remotion renders and do not satisfy the native preview approval gate.** No video has been silently claimed as native or uploaded to GitHub.

### Anchor and camera safety

- Source coordinates follow contract: **+Y up**, +Z vehicle forward, +X right; 1 unit = 1m. Turbo wheel shaft is local X.
- A2 provides actual named transform nodes `TURBINE`, `SHAFT`, `COMPRESSOR`, `EXHAUST_IN`, `COMPRESSED_AIR_OUT`; `INTERCOOLER_OUT`, `ENGINE_INTAKE` and car origin from model-owner handoff. A4 defaults are unverified temporary proxies.
- Do not edit A1/A2 geometry to make a camera fit. Match the real fixed port names/bounds at integration; adjust the A4 camera anchor adapter and inspect frames for hardware clipping and readable blades.
- Labels must remain within mobile safe horizontal bounds (~118px each), hardware must be the hero; A6 decides exact presence and timing.
- Render and inspect with final A1/A2 models at several timestamps, not only static screenshots. Ensure exhaust/clean air are NEVER shown mixing in one passage. No numerical horsepower or boost claims.

### A4 review request / blockers

Camera/source functionality implemented and prototype geometry animated; **approval blocked** until genuine native compositions are rendered/fully decoded, published with inspectable artifact, real model anchors validated, and manager personally reviews the images and movement. See handoff.json for precise blockers. A6 owns final composition; A7 owns final audio.

## 2026-10-17 — REAL NATIVE RENDER QC: REVIEW REQUESTED

The former warning above about *missing native Remotion outputs* is historical and superseded by the evidence here. The five native MP4 previews are now actually published, decoded and visually inspected. This is a **camera package review request**, not A1/A2 integration approval.

- **Last A4 code SHA**: `cfc02e8d6d9276e5990b9beae29a24c637cb12fb`
- **All-five matrix render success**: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39046325972
- **Proof**: 600/600 frame hashes distinct, genuine Remotion 4 + @remotion/three SWANGLE, 432×768 full-motion 30fps, actual H.264 yuv420p, full FFmpeg decode PASS, per-clip SHA256 and artifact links in `manifest.json`.
- **Human visual QC**: sampled genuine GitHub-native videos at 0/mid/last and viewed each 10-frame contact sheet, not just TypeScript tests. Fixed the cropped turbine close-up, charge camera clipping and weak opaque-box engine stand-in; second hook/road/shaft shots remain intentionally schematic until A1/A2 replacement.
- **Preferred opening**: `hookOrbit`, near-frame-filling spinning turbine and hot exhaust present from frame 0; `hookRush` as conditional alternative when VO starts with exhaust energy.
- **Still pending**: manager A0 approval, camera-to-final-approved A1/A2 geometry/port collision/occlusion check. A6 must not consume blindly or declare final episode complete.
