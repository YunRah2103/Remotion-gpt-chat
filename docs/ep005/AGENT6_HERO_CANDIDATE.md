# YUNEX EP005 — Agent 6 approved V4-A supercar handoff

**Owner approval is for the exterior teal V4-A vehicle look, not for any previous candidate, the driving scenes, or a final EP005 film.**

## Pinned exterior source (do not swap cars)

- Approved PR #233 source: `9052a539e10a7cb97487c1435455bb9962ad58e1`
- Approved native 14-second preview: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39866437063/artifacts/12465297894
- Approved original MP4 SHA256: `1654a5efd3a3403871b0a52a3140a9e7aeb1222a2e4bd4242e6edaa8d879cd88`
- V4 source recipe: `createV4Production({kind:'supercar'})`; `variant:'supercar', bodyDetail:'studio', driver:true, color:'#18636b', powertrain:TWIN_TURBO_V8`.
- Source locked by copying the **exact Git trees** for `src/yunex/modelling-kit`, `src/yunex/world-kit`, `src/yunex/parts-kit`, `scripts/modelling-kit`, and `tests/modelling-kit` from approved commit onto this *isolated episode branch*. This is not a PR #233 merge; kit branch is untouched.
- Current builder: `src/yunex/ep005/agent6/v4-approved.ts`; native compositions: `src/yunex/ep005/agent6/v4-driving-entry.tsx`.
- Historic Spectral CC0 candidate A and Khronos CarConcept candidate B in this PR are **rejected/retired**. The old `entry.tsx`, `khronos-entry.tsx`, `exhaust-ports.v1.json`, old workflows and their MP4s are **NOT APPROVED EP005 assets**, must never be consumed by Agents 7/8.

## Native driving source and shot routing

All four select compositions are 120 frames at 30 fps, 1080x1920, silent originals. The car moves *in world space* on +X along a fixed track with analytic distance `26.5t+0.725t²` metres, not by scrolling a texture; wheels receive this same travelled distance from the V4 vehicle rig. The camera follows a distinct authored moving relative path with real parallax, continuous animation, stable lighting, tyre contact/shadows, barriers and pit architecture:

| Composition | Purpose |
|---|---|
| `Ep005Agent6V4RearProof` | First rear three-quarter action gate and flame-tip visibility for Agent 7 |
| `Ep005Agent6V4SideTracking` | Moving body profile / rolling wheels |
| `Ep005Agent6V4FrontPursuit` | Aggressive front low-action select |
| `Ep005Agent6V4RearChase` | Moving rear payoff/recovery base |

Exact source/MP4 hashes and artifact names are generated per matrix job by `.github/workflows/ep005-agent6-v4-driving.yml`. Do not claim proof complete until FFprobe, full 120-frame decode, unique-motion stills and full-resolution contact-sheet inspection pass.

## Authoritative Agent 7 exhaust ABI

Source: `src/yunex/ep005/agent6/v4-exhaust-ports.json` (also exported as TypeScript `V4_EXHAUST_MANIFEST`). **V4-specific manifest numeric version 2**, editor schema ID `v4-2`, approval anchor `https://github.com/YunRah2103/Remotion-gpt-chat/issues/247#issuecomment-6355059494`.

- Vehicle coordinate frame: +X forward, +Y up, +Z driver's left, metres.
- Name **left**: `exhaust-outlet-left` (inside animated `body-shell`).
- Name **right**: `exhaust-outlet-right` (inside animated `body-shell`).
- Node-local mouth offset: `[0,0,0]`, node-local flow/outward axis: `[0,0,1]`; the mount's quaternion maps local +Z to vehicle -X backward.
- Authentic V4 kit factory measured parameters: **112 mm outer visible diameter**, 4 mm wall, **104 mm inner bore**, 52 mm inner radius per tip. Recess/connected pipe exist in approved rig; do not duplicate tips or inflate tips to support bigger flames.
- Update actual world pose via `poseApprovedV4(car, frame)` then read `sampleV4Ports(car, frame)` from the same car. Agent 7 must use its **v2** `adaptApprovedV4WorldPorts(framePortRecords, frame, lock, fps)`; the old v1-only `sampleActualPorts` rejects this manifest. Frame records + `agent7-v4-port-lock.json` are exported together by CI. Never reuse old candidate A/B world coordinates.
- `scripts/ep005-agent6/v4-ports.mjs` exports 120 absolute-frame world positions, outward axes, all 16 `matrixWorld` elements and frame-synchronous four-camera paths. It also writes `agent7-world-ports-120frames.json` with exact Agent7 adapter field names, `agent7-v4-port-lock.json` (numeric v2, Git commit and SHA256), and `SHA256S.json`. Editor `portManifestVersion` must be **`v4-2`**, while Agent7's `lock.version` remains numeric 2. Port provenance is independent of footage's MP4 SHA256.

## Required handoff gate

1. Native MP4 render and visual check of exact V4 car in motion (owner only approved car look).
2. Agent 7 attaches afterfire directly to these **world-sampled moving mouths** on this car. 
3. Agent 8 takes only native MP4s with exact run IDs, source commit, SHA256 and picture-approved comment URL; silent-picture review remains mandatory if no authenticated VO.
4. **NO MERGE.**
