# C2 × B2 direct THE-LOWDOWN and Audi native UHD transition proof — VERIFIED

**Date:** 2026-10-13. **Status:** Actual real-source video executed, playable and independently visually inspected; **owner-only draft**, no public rights clearance, no final soundtrack.

## Real MP4 deliverable
- GitHub Actions [successful run 38380099079](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38380099079). Five source segments extracted from original THE-LOWDOWN embedded progressive MP4 and official original 4K Audi C8 RS6.
- Owner-only [DRAFT release](https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/untagged-ebbc831debb49e6311a6) (GitHub release id 411526014, API `draft:true`, never made public). **Actual `C2_LOWDOWN_AUDI_TRANSITION_PROOF.mp4` 3,657,830 bytes**.
- Output FFprobe: 1080 × 1920 portrait, 30fps, H.264 yuv420p, **3.566667 seconds**, no soundtrack; entire-file FFmpeg decode PASS.
- MP4 SHA256 **`aac81d5b3e44b68173a0b3f80fbdd2a337c17672bb50862d2d6521d9fcd58abc`**. REST release digest equals independent script manifest hash.
- [QA artifact 11802458109](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38380099079/artifacts/11802458109) contains 14 actual time-coded contact frames, FFprobe, source windows, original-source provenance and SHA but no redistributable third-party MP4.
- Source script [c2_direct_lowdown_bridge.py](./c2_direct_lowdown_bridge.py) commit `72882a7`, [workflow](https://github.com/YunRah2103/Remotion-gpt-chat/blob/automotive-edits/rs6-no-mercy-001/c2-details-textures/.github/workflows/rs6-c2-direct-lowdown-transition.yml).

## Editorial exact segment selection (real moving frames vs details)

| Output interval | Actual source | Source in/out | Actual imagery / limitations |
| --- | --- | --- | --- |
| 0.000–1.067 | Audi C8 RS6 Daytona Grey official **3840×2160 UHD** | 205.91–206.97s | Visually verified genuine moving frontal approach, tracked crop keeps car centered. Bright daytime mountain road, cold desaturated grade recommended. |
| 1.067–1.833 | THE-LOWDOWN original filmmaker native 1920×1080 | 29.10–29.85s | Genuine red C8 3/4 headlight at night; first few frames are red taillight transition, then brighter red front 3/4. **Car appears stationary**, creator 1080-landscape portrait crop upscaled; not equivalent UHD source. |
| 1.833–2.367 | Audi UHD original | 425.90–426.43s | Very sharp actual oval exhaust and RS6 badge, largely stationary. |
| 2.367–3.033 | Audi UHD original | 465.90–466.56s | Sharp true C8 rear red LED, nearly stationary. |
| 3.033–3.567 | Audi UHD original | 525.90–526.43s | Hand on Audi steering-wheel RS MODE controller; excellent tactile cut, almost static. |

**First build rejected for poor visual readability**: the originally selected THE-LOWDOWN 22.05–23.15 side-driving excerpt was technically playable but visually almost black in 13 contact frames; this was not accepted as premium YUNEX footage. Corrected run starts with clearer original Audi 4K real moving front car, keeps THE-LOWDOWN brighter nighttime front 3/4. Do not describe the first run as creative-pass.

**Current visual verdict**: strong and crisp **source-to-source technical bridge** with usable inserts. NOT yet creative-approved: noticeable Daytona Grey daylight → Tango Red night → grey Audi original colour/scene mismatch; too many rear macro/static shots for a 13–16s film. Editor D should use either a deliberate monochrome/negative cut to motivate this colour shift or omit this particular splice. A2/B2 proven moving-car footage must remain dominant. Soundtrack/beat sync is **not** supplied; do not misrepresent this as finished.

## S25 source authorization remains separate
The S25 Galaxy V4 passed **one real owner-approved YouTube control job #55**: 8.008 seconds, 1920×1080, H.264, SHA256 `6e0cc6baf8be000b7994f11cc9ba91230f1dfeb25c466224f2b0cd691f0d99d9`, actual MP4 in published release `yunex-phone-v4-55`. **This control source is not an RS6.** Creator RS6 YouTube reviews #46 (Auditography) and #54 (THE-LOWDOWN) both lack qualifying explicit reuse permissions, and no RS6 URL is approved in V4 `sources_v3.json`. **Do not queue an invalid V4 source, add false `reviewed_by` or request the user restart Termux.**

All media in this proof remains owner-only draft until actual source-use and public distribution permissions are verified. No editing of other agents' branches or old repository.
