# POLISH05 B — provisional Agent A GLB compatibility inspection

**Status: DEVELOPMENT-ONLY. NOT AN ACCEPTED A HANDOFF.** Exact binary extracted from failed hardware workflow **37849868441**, incomplete artifact **11581162742**. A subsequently reruns full Blender proof. This page must never be cited as authorization to render the final MP4.

Compared raw binary glTF v2 payloads from that failed-job ZIP: `polish4_locked.glb` with approved SHA256 `edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e` and candidate `xfx_swift_rx9060xt_polish5.glb` SHA256 `254b6c0579f294c44598f4623a3b04a108d5bc728c44420dd43194f445f3a296`.

| Parsed property | POLISH04 reference | POLISH05 failed-job candidate |
|---|---:|---:|
| File bytes | 4,561,860 | 6,434,960 |
| glTF nodes | 858 | 1,099 |
| Meshes | 839 | 1,080 |
| Materials | 42 | 57 |
| Approximate triangles (index primitive counts / 3) | 150,638 | 193,694 |
| Vertex count summed from POSITION accessors | 121,292 | 174,758 |
| Unique mandatory hardware anchors | 19/19 | 19/19 |

- All **19 named anchor parents AND their local translation/rotation/scale/matrix payloads are byte-equivalent** between the two parsed glTF JSON node sets, including nested moving fins/pipes under `HEATSINK` and GPU/VRAM/VRM under `PCB_ASSEMBLY`. This is an encouraging non-rendering rest-transform compatibility check for the existing additive motion.
- The **13-track motion has NOT been approved**: new mesh details may intersect under moving assembly nodes or obscure the hardware from camera focus. Scene-space motion samples and native moving Three.js proofs remain compulsory.
- Larger model/mesh counts are NOT visual quality proof; Agent B still requires actual improved native macro appearance.
- Failed run #2 terminated at unsupported OpenImageDenoiser despite producing a GLB and .blend; official model acceptance depends on A's subsequent fully **successful** build, proof render evidence, and exact final SHA/handoff. It may be a different binary.

Do not stage this failed-run candidate as final. No render lock advancement is authorized.
