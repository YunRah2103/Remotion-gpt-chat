# POLISH04 — D independent first B-native proof review

**Status: TARGETED CORRECTION / NOT FULL-INTEGRATION APPROVED**
**B source SHA:** `9905a78052ef900840615501609896c7b3fcfd0a`
**Actual B native workflow:** `37840532780` **SUCCESS**, actual artifact `11576904856` (`GPU-POLISH4-B-CINEMA-NATIVE-PROOFS`).
**Evidence:** independently downloaded artifact ZIP; viewed native PNGs at frames **0,30,60,100,135,180,225,270,310,365,415,449**, side-by-side matched POLISH03 PNGs, and reviewed delivered motion segments. B proof explicitly labels reference POLISH03 GLB and provisional POLISH03 or test motion; this is **camera-only provisional proof** pending final A GLB and C motion.

## What improved (preserve)
- Frame **100**: true close-up of the center fan, large volumetric curved blades and visible material specular highlights. This finally uses meaningful vertical image occupancy and is clearly distinct from the old wide shot. Intentional crop is appropriate.
- Frames **135,180,225,270**: purposeful cooling module / heatstack sequence and camera shift compared with the near-static old film. Detail legibility is partly contingent on A final GLB.
- Frame **310**: real depth/exposed PCB macro, dramatically closer than POLISH03. This may be intentionally cropped; however the component focus should be clearer in the final A/C combination.
- Neutral dark backdrop, no magenta cast, typography is in safe margins; technical proof actually exists.

## Blockers / correction required
1. **Opening hero 0,30,60 remains uncomfortably small within the tall frame.** Need stronger purpose for surrounding space: camera perspective closer, controlled hero sweep, bolder meaningful type and/or transition to detail sooner. Avoid expecting impossible full horizontal-to-vertical fit or stretching GPU geometry.
2. **Final exploded shot 365,415,449 is STILL too small.** The final assembly sits near middle at about two-thirds portrait width but only a narrow vertical area. This is a principal blocker to achieving desired improvement. Retune end-shot focus, roll, depth, projection or staged parallax so the assembly is impressive, not just a distant mini-card. Preserve full visibility of all major components at 449.
3. **Last ~85 frames read as nearly identical framing** despite animated camera keys. Require visible deliberate but smooth establishing movement then final hold, not static distant parts plus large title.
4. In current B implementation `MOVING` includes only nine POLISH03 anchors, while current Agent C JSON also defines `HEATSINK_FINS`, `HEATPIPE_BUNDLE`, `COLD_PLATE` and `VRM_COMPONENTS`. These are real physical animation nodes that must be evaluated for whether B should apply them in the *final integrated* production. Otherwise the heatpipe-specific reveal may never execute. Parent-child additive transforms must be maintained.
5. Frame 310 cropping is deliberately extreme; D must inspect final new GLB pixel proof around frames **290–320** to confirm die / VRAM / VRM are actually recognizable rather than clipped for theatrical effect.

## Required re-proof

After B targeted camera patch or D documented integration correction, rerender native **0,30,60,100,135,180,225,270,310,365,415,449** and longer moving clips **0–60, 95–170, 210–320, 330–449**. Use **A's final POLISH04 GLB and C's POLISH04 JSON** in D integration proof before signing full render. Pixel comparison against POLISH03 must show *improvement across the opening and the ending*, not only one good macro. Do not claim final QA passed based on this camera-only work.

**Accuracy:** exterior XFX-like, hidden component details artistic reconstruction (not XFX CAD).
