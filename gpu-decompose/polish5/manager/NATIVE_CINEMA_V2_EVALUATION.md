# GPU POLISH05 — independent cinematic correction experiment 1 review

**Run:** 37852439609 success; real 1080×1920 A-GLB native preview artifact **11582368256**; exact A model `254b6c0579f294c44598f4623a3b04a108d5bc728c44420dd43194f445f3a296`; v2 motion `b0e55ff96bb32d8c1d4cf26d1fe15c399f9f63d3b74d65a5de326638b5fd0115`.

**Technically PASS, visually PARTIAL.** Downloaded all ten real native stills and two moving clips. Original proof was shroud-obscured. New real physical offsets produce conservative AABB separation at frame329 of 0.031 scene units shroud-to-heatsink, 0.220 heatsink-to-PCB, 0.303 coldplate-to-die, and 0.758 PCB-to-backplate (theoretical axis-envelopes, NOT triangle guarantees). See actual Blender model/detailed PCB. At **180** the entire fin stack is revealed, significantly better. At **209–245** the real GPU die, PCB population and fasteners are visible in macro composition, especially frame225.

**Remaining blocking cinematography issue:** camera yaw 80–84 degrees and pitch 55–61 degrees for frames **265–310** turns the long board nearly edge-on. The GPU die / populated PCB becomes an unreadable thin strip. Frame329 wide transition also has more vacant canvas than necessary. The new geometry is present but poorly presented in those later macros.

**Corrective camera iteration:** retain identical v2 mechanical offsets, rollback ONLY macro camera orbit 239–329 to a readable 3/4 side (~yaw62–69, pitch40–44) while preserving 0–209 and 364–449 approved camera keys. Tighten `silicon` focus to `GPU_DIE` and `VRAM_CHIPS` (VRM appears elsewhere) so the actual silicon package fills more of a phone display. Test at 225,245,270,286,307,329,365,449 and real moving 255–275/285–310. This is a second experimental candidate, NOT release-approved.

**Pending:** full final A GLB + camera + motion native full proof and full film QA before any release.
