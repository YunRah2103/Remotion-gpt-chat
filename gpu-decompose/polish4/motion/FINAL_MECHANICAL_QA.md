# POLISH04 Agent C — independent exact-geometry mechanical QA
**Decision: C MECHANICAL PREVIS PASS; D final cinematography/production QA remains outstanding.**
Only repo `YunRah2103/Remotion-gpt-chat` was accessed. No forbidden project was accessed. No complete 450-frame film was rendered.

## Frozen provenance
- Agent C 13-key motion JSON: `gpu-decompose/polish4/motion/decomposition.json`.
- JSON SHA256 `c311748fa64c31eea43f595d2cf04b0a39cd548a49b5a8b0adaed4e273daf5cc`.
- Exact A04 GLB (true new hardware): SHA256 `edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e`.
- A04 source `a3113bb0a4b450696010c6496cfcb62d2a56e2c3`, build run `37840656656`, numeric artifact `11577811444`.
- C exact-model successful mechanical proof run `37842128210`, artifact `11578063230` (`GPU-POLISH4-C-MOVING-MECHANICS`).
- Proof workflow source commit `b15034e19c99e1ea0a0dd515506909c70e0df731`. Manual downloads and independent FFmpeg/ffprobe checks followed.
- Manager D integrated 13-anchor scene fix commit `96dc608ea2f376a987c27559bbd222a8c0fef6ac`; repo issue #2 verified resolved and closed.

## Real GLB and deterministic motion
Original glTF file verified at 858 nodes, 839 meshes, 42 materials with exactly one of each required named anchor. Trimesh traversed the **actual 841 evaluated geometry nodes**, grouping each mesh under the nearest moving anchor while calculating offsets through parent ancestry. 450-frame / 30fps pure-frame smoothstep invariant tests PASS; every motion key is an additive GLB-local position delta, rest frame 0–89 intact, all 13 tracks finish by frame 329; final 329–449 holds.

PyBullet collision-proxy validation PASS for 23 sampled frames, 6 coarse major-part contact pairs, no final-layer rigid proxy collision. This is **NOT exact mesh-to-mesh simulation**.

Evaluated real mesh AABB axial projections over 56 frames, including the required key frames and 5-frame swept proxies 90–329, certified positive final +Z signed ordering for **all 11 key component relations**:

| Actual GLB projected pair | Final +Z ordering margin (scene units) |
| --- | ---: |
| Fan left / front shroud | +0.4845 |
| Fan center / front shroud | +0.6045 |
| Fan right / front shroud | +0.4845 |
| Front shroud / heatpipes | +0.050538 |
| Front shroud / heatsink fins | +0.0775 |
| Front shroud / cold plate | +0.1400 |
| Cold plate / GPU die | +0.0333 |
| GPU die / PCB root group | +0.0270 |
| VRAM chips / PCB root group | +0.0345 |
| VRM components / PCB root group | +0.0230 |
| PCB root / backplate | +0.7230 |

No final critical AABB flags. This is conservative one-axis enclosing envelope separation, **not** a continuous exact triangle collision proof. Partial contact during initial separation may be physically legitimate, and highly detailed mesh-vs-mesh sweeps would be a separate test.

## Delivered real MP4 evidence — SHA256 and decoding
All four are actual frame-based native Remotion/Three.js renders of the exact A04 GLB with C's 13-node motion; no flattened video substitutes, CSS stand-ins, cached POLISH03 geometry or static-image pans. 540×960 H.264, 30/1 FPS, yuv420p, each fully decodes with `ffmpeg -v error -xerror -i <clip> -f null -` and was visually inspected using multiple sampled frames along actual moving video.

| Clip in artifact | Video frames | SHA256 |
| --- | ---: | --- |
| `c-motion-90-179.mp4` fan extraction | 90 | `ae7351cbc8fb248e3c88c1e49b90ab9f22416b5bcba5c71e1374c5e3521a81c1` |
| `c-motion-160-239.mp4` shroud and cooler | 80 | `0f7ef3211d0f7abdeeda41261a0976dabdd68359394ccd0a52f6e27bbb4c7a17` |
| `c-motion-240-329.mp4` PCB/internal thermal reveal | 90 | `73335246ca956f28a40c2d2470bdffe04fbf2815d23b149bca0db8367ed2e319` |
| `c-motion-329-395.mp4` final exploded hold | 67 | `5136be9b96e2c293f520a99b3f18127c2b21d5ea926bff6a9387c8e826596dd8` |

**Visual review:** inspected 20 true still frames at 0/30/60/89/90/100/115/135/150/180/210/225/250/270/280/310/329/365/415/449 plus 20 directly decoded video frames distributed through the four MP4s. Fan release is staggered and readable; frontal shroud/cooler moves reveal physical volumetric fins and fan supports; PCB and backplate form successive separated layers; final arrangement is stable without frame flashes, accidental pop-outs or disappearing subassemblies. Lighting/zoom in this C-only proof are **provisional POLISH03-style**, resulting in an overly small horizontal object against a tall portrait background. This is **NOT acceptable cinematic polish** but remains outside Agent C's exclusive ownership, and is expected to be addressed by B's macro/framing system and D's integrated 1080-native QA. Fine heatpipes/VRM cannot be thoroughly judged at the legacy proof scale; insist on B's close-up shots. No exact physical swept triangle collision proof is claimed.

## Agent D instructions
1. Lock actual A04 GLB SHA and C final JSON SHA above; do not fallback to POLISH03 geometry or motion.
2. Use manager D integrated all-13 runtime, with parent/child additive transforms exactly once.
3. Render final native proofs using B's actual `src/gpu-polish4/camera.ts` and A04 model at 1080×1920 for fan release, fin/heatpipe macro, processor/VRAM/VRM closeup and final master.
4. Approve release only after viewing actual integrated moving proof under intended camera and confirming no collision-looking occlusion or unreadable internal details. C has **not** delivered final full master.
