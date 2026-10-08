# POLISH05 B — camera and release engineering / current state
- Reference master: POLISH04 source `e9a14f5d8e1b3bf805bb4916f9ce8bdc0155ff6a`; approved final artifact ID `11579249363`.
- Original camera scene and editorial copied into isolated `src/gpu-polish5/` preserving all POLISH04 18 keyed poses and current lighting. Full native model review pending A final GLB.
- POLISH04 still-frame inspection: front-fan details read well; heatsink/PCB are visually thin compared with promised engineering internals; the dark margin in portrait opening is substantial. Preserve high-quality 3/4, fan close-up, final diagonal staging but intentionally tighten only where POLISH05's new bounds justify it.
- New Remotion composition: `XfxSwiftDecompositionPolish5`. Existing `XfxSwiftDecomposition` remains untouched / backwards compatible.
- Native frame checklist: 0,30,60,100,135,180,225,270,310,365,415,449. Moving reviews: 75–105, 130–165, 190–220, 245–285, 315–355, 395–449.
- Shot 0–49 complete exterior, 50–89 fan+shroud, 90–159 fan release, 160–209 cooler close-up, 210–279 heatpipes/die/VRAM, 280–329 silicon/reassembly transform, 330–404 master explosion, 405–449 fully visible finish.
- Do not assume that identical camera keyframes are automatically suitable for a physically changed GLB. Need exact final native projection checks: whole silhouette bounds near frames 0 and 449, macro focus on real mechanical parts, no material crush/flicker.
- New runtime only loads `public/gpu-decompose/polish5/xfx_swift_rx9060xt_polish5.glb` and `public/gpu-decompose/polish5/decomposition.v1.json`; no old-model fallback. These are staged by a guarded job, never guessed.
- **NO FINAL RENDER APPROVAL YET.** A new model has not yet been received and independently inspected.
