# Agent B — v2.3 GPU model intake (not final film approval)

Date: 2026-10-08. Repo: `YunRah2103/Remotion-gpt-chat` only.
Agent A ongoing update source: `72e4c5186332b96cc56a9e41d4021c5b2f53f22b`.
Native successful build: [run 37819077727](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37819077727).
Artifact `GPU-AGENT-A-XFX-SWIFT-3D`, numeric ID `11568112904`. This supersedes earlier model *as a candidate*, NOT an approved master source.

## Authentic artifact extraction / technical verification
- `assets/xfx_swift_rx9060xt_triple16.glb` — 1,776,124 bytes, SHA256 `c78c4162681642c45e641bbd10bf4707f5d30ef7e41249826b820ab313a78891`.
- `assets/decomposition.json` — SHA256 `1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510` (unchanged movement contract).
- Both SHA256 match Agent A's native `asset-manifest.json`; manifest embeds exact modeler SHA; manufacturer external geometry target remains 290×124×49 mm, SKU RX-96TS316B7.
- GLB v2 binary validated, **352 glTF nodes**, **333 mesh objects**, **23 materials**, all 19 exact required scene anchors present once. No photo cards or faked 2D geometry.
- PyBullet `finalClearancePass=true` (only mechanical proxies); Godot `GODOT_PROOF_PASS` (450 frame poses, 9 anchored parts, correct PCB children).
- Real Blender Cycles preview images present: `assembled.png`, `exploded.png`, `exploded_side.png`, `backplate_detail.png`.
- Moving proof `decomposition-proof.mp4`: 23 actual Blender frames at 552×368, 10 fps, H264, fully decodes via FFmpeg.
- Actual stills inspected: coherent black triple-fan frontage, machined shroud frame, heat sink fin stack, PCB and rear plate; v2.3 rear plate now has continuous sculpted lines rather than crossing lattice. Side-layer separation is visible in Blender side proof.

## Limitations and release gate
- Product exterior approximates the real XFX Swift 16GB triple-fan; PCB details, fin count, exact fan blade profile, rear vent routing and internal arrangement are not OEM CAD.
- The small Blender proof is NOT sufficient to assert 1080×1920 mobile rendering, occlusion-free animated shots, or a final playable MP4.
- **User indicated Agent A is still updating the GPU model. DO NOT overwrite the existing locked/released master with this interim candidate until the model handoff is explicitly final.** The former director `AGENT_A_LOCK.json` remains unchanged intentionally.
- When Agent A signals final, re-read its latest commit/handoff; pin immutable SHA + run + artifact ID; revalidate hashes and 19 anchors; inspect 1080×1920 native frames 0,89,120,180,240,329,330,385,449; check apparent fan/shroud clipping, materials, text margin and final explosion readability. Only after that authorize the full 450-frame master.
- Preserve earlier director and existing Remotion compositions. No other repository is in scope.

## Reproduction
`gh run download 37819077727 -R YunRah2103/Remotion-gpt-chat -n GPU-AGENT-A-XFX-SWIFT-3D` then hash `assets/*.glb` and JSON before rendering. Never use undifferentiated 'latest' model artifact.
