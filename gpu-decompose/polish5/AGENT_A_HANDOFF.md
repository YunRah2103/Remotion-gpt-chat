# Agent A — POLISH05 model handoff (build-stage reference)

**Repo:** YunRah2103/Remotion-gpt-chat. **Isolated branch:** gpu-polish5/a-hardware, created from e9a14f5d8e1b3bf805bb4916f9ce8bdc0155ff6a.

**Source of truth:** POLISH04 signed manager RELEASE_LOCK: hardware artifact 11577811444 from successful workflow 37840656656, with SHA256 edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e. **Never substitute an earlier candidate.** This build imports the exact GLB and augments its real geometries without re-generating the older missing Blender source.

**New isolated source:** gpu-decompose/polish5/hardware/build_polish5.py, render_baseline.py, validate_polish5.py; native build workflow .github/workflows/gpu-polish5-a-build.yml. All output binaries and proof images are packaged in an Actions artifact, not duplicated in git.

**New construction:** stepped die-cut Swift fascia accents and actual top vents; aerodynamic rotor shaping and physically separated hub/stator hardware; fin hems, rails and heat exchanger end-bracing; pipe ferrules, clamps and coldplate bolt hardware; dense grouped memory fanout traces, decoupling capacitors/terminals, plated via fields, VRM IC clusters, GPU package lands, backplate recessed tooling and connector contact rails. Original fan/shroud, 81 actual folded fins, six actual pipe meshes, and 19 canonical named GLB anchors are retained.

**Materials:** clean black satin polymer, blade material distinct from metallic bearings, anodized machined cooler and nickel pipe fittings, solder mask with inlaid copper-trace impression, electrically plausible SMD component colour differentiation; PBR metallic/roughness exported through glTF. No invented OEM PCB truth.

**Native evidence expected:** assembled, fan macro, rear 3/4, heatsink macro, thermal assembly, populated PCB, GPU/VRAM, VRM, backplate, exploded, plus a matched POLISH04/POLISH05 comparison sheet, Blender .blend and 18 moving native Blender frames assembled to MP4.

**Integration contract:** glTF Y-up, X horizontal card length, +Z fan-facing, scene units=100mm, black triple-fan SKU RX-96TS316B7, 290×124×49mm; preserve the original **19** anchors, local pivots and hierarchy. Compatible with the existing deterministic POLISH04 composition motion tracks by matching anchor names and rest transforms, subject to Agent B’s real native frame-level QA. Model has no embedded animation. Agent B should download this exact new Actions artifact, hash-check xfx_swift_rx9060xt_polish5.glb, stage it as an isolated POLISH05 staticFile asset, and test moving frames against final motion.

**Constraints and known limits:** Exact manufacturer SKU/dimensions/external triple fan supported by official XFX reference. The circuit placements, GPU-die markings, cooling path geometry, heatpipe count/routing, thermal pads and screw patterns remain non-OEM illustrative reconstructions. Native Blender proofs cannot substitute for Agent B's Three.js/Remotion final visual validation. Neither Agent B's motion, camera nor release source is touched. Forbidden YUNEX repository not accessed.

**Status:** Build and independent validations pending. A successful workflow automatically replaces this build-stage report with exact source SHA, workflow/artifact IDs, GLB SHA256, proof list and final QA results. Do not integrate based on this pending status.
