# Agent A — OPTIONAL cinematographic decomposition proposal (NOT APPROVED)

The canonical production contract and `decomposition.json` are **unchanged**.
The current Agent A v2.3 model was validated by GitHub Actions:
- Source model commit `72e4c5186332b96cc56a9e41d4021c5b2f53f22b`;
- Success run [37819077727](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37819077727) / model artifact 11568112904;
- GLB SHA256 `c78c4162681642c45e641bbd10bf4707f5d30ef7e41249826b820ab313a78891`.

## Reason for this alternative

The original 450-frame JSON sends the fans +Z 0.43–0.46, but the front shroud +Z 0.66. This leaves the fans visually nested in the shroud in the final frame, even when Agent B uses its approved ~56-degree final camera. The designer needs identifiable fans separated in space from the drilled casing.

## Optional source

`gpu-decompose/assets/decomposition-proposal-v2.json` provides the same nine named anchors, 450 frames, start/end timings, smoothstep easing, schema, coordinates and zero rotations. Only nine final translation values differ. `gpu-decompose/assets/generate_director_proposal.py` verifies compatibility with the *locked* canonical JSON without modifying it.

Fan final +Z values become 0.72, 0.74, 0.72; front shroud +Z0.39; heatsink +Z0.15; GPU die +Z0.21; VRAM +Z0.23; PCB assembly -Z0.20; backplate -Z0.75. All X/Y spreads follow existing contract magnitudes.

An independently rendered VTK motion QA using the real v2.3 GLB projected the complete assembly within approximately screen X [103,973] and Y [705,1204] at frame449 on Agent B's final 1080x1920 camera. This is *coarse projected-geometry QA*, not a native Remotion rendering. A separate 30-frame actual GLB 3D animated H264 proof has been fully decoded and visually compared at the same camera; proof files are attached in the originating Agent A chat.

## Director decision

**Do not use this JSON in final release until Agent B publishes an explicit v1.2 production-contract motion amendment.** If B approves, lock the proposal JSON hash and validate native 1080×1920 moving proof at 0,90,149,179,240,300,330,385,449, exact frame count/clip bounds, and final QA. Otherwise keep current locked JSON. No other repository or Agent B branch has been touched.
