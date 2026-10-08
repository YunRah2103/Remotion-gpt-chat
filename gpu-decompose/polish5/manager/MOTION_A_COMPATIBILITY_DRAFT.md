# POLISH05 B — A-model motion compatibility draft (native visual QA pending)

**Exact A source:** `a24aa7434e220f25eed580e93cd7b449c41deb1a`; successful run **37850068915**; full artifact **11582001775**; NEW GLB binary SHA256 **`254b6c0579f294c44598f4623a3b04a108d5bc728c44420dd43194f445f3a296`**. Downloaded exact final ZIP and verified published SHA256SUMS, inspecting 10 Blender stills, actual Blender exploded image and moving proof. This is NOT final Three.js approval.

Compared new and old real glTF node JSON with independent Python parsing. All **19 mandatory unique anchors** exist in new A GLB, with **identical direct parent names, and identical local authored translation/rotation/scale/matrix data**, including the 13 animated anchors. Rest-pose binding is compatible. The new file contains 1,099 nodes, 1,080 meshes, 57 materials and approximately 193,694 triangles; old approved contains 858 nodes, 839 meshes, 42 materials and about 150,638 triangles. Counts do not establish screen-visible improvement, which remains a separate native QA gate.

**Preliminary motion decision:** 13 deterministic POLISH04 additive transforms were preserved byte-for-value (0-based pose, local radians, 90–329). This is labeled `CANDIDATE_POLISH05_A_ANCHORS_VERIFIED`, NOT `FINAL_POLISH05_A_VERIFIED`, since new details may collide after they travel with their parents. Only a model-verified native 1080×1920 Remotion/Three proof can demonstrate camera composition and geometry reveal. Do not release on rest-pose checks alone.

Required proof frames 0,30,60,100,135,180,225,270,310,365,415,449; native clips 75–105,130–165,190–220,245–285,315–355,395–449. In full-motion review, look for extracted fans catching shroud grills, new heatsink braces colliding with pipe bundle, package visibility, cutout PCB detail, and meaningful finale separation. Publish any revised v2 JSON, SHA and candidate-audit revision before manager promotion to `render-approved`.

**A visuals reviewed:** ten genuinely Blender-rendered proof images and 18-frame moving Blender sample are present; full artistic PCB details are reference-based illustrations, NOT OEM construction documents. Initial contact sheet shows improved thermal fin sculpting and populated PCB / VRM, but Blender's neutral pale illumination and extreme macro crops do not guarantee the same appearance in the dark cinematic scene.

**Gate:** RUN POLISH05 NATIVE RENDER and pixel inspect before signing `FINAL_POLISH05_A_VERIFIED`.
