# AGENT E — narrowly scoped Polish05 corrective implementation

You are GPT-6, Agent E — Senior Remotion/Three.js Integration Engineer and Automotive CGI Technical Director.

Repository: \`YunRah2103/Remotion-gpt-chat\`
Branch: \`automotive-brakes-001/e-integration\`
**Immutable reviewed Polish04 film SHA: \`21c2b581b46251b0bd45028d32eb40b4341eeb2a\`.**
Review source: Agent D \`automotive-brakes-001/d-graphics-qa\` → \`production/videos/carbon-ceramic-001/qa/POLISH04_FULL_INDEPENDENT_REVIEW.md\`.
Real video inspected: [Polish04 original F MP4 artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804), SHA256 \`fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb\`.

**Mission:** Fix ONLY two independently confirmed presentation defects of the *existing* 25-second film. Do real implementation, source-locked native rendering, screenshot/moving QA and commit. **Do NOT rebuild hardware, alter B brake physics/pad travel, touch C camera files, redo thermal, modify F's workflows, Master release gates or any YUNEX repo.** Do not over-polish already-accepted hero 630–749.

**MAJOR 1 — real pad-cutaway frames 107–145 (especially 117,132,140):**
- At actual native frame **117 (3.900s)** the rotor protrudes beyond the right portrait edge. The main shot obscures the fact that there are **two** opposing pads, despite the correct source \`2.35 mm\` per-pad physical stroke.
- Update ONLY E's in-film cutaway staging/IntegrationCameraRig and overlay/layout as necessary: reposition/widen the macro to keep the **entire rotor, static caliper pre-cutaway, and both axial pad faces** legible in 1080×1920 portrait; view from a truthful informative axial/three-quarter angle. Add concise, high-contrast \`INNER PAD\` / \`OUTER PAD\` screen labels accurately anchored to the corresponding real A nodes, or omit labels if anchoring can't be honestly verified. Keep readout away from rotor and within short-video safe UI margins.
- Preserve actual two independently moving A pads and E's real per-face \`0.15–2.50 mm\` physical gap (max true axial stroke **2.35 mm**). Do not enlarge/teleport physical movement or invent a proxy pad.
- Only temporarily hide the fixed caliper with an explicit graphic when needed, but ensure the reveal of the two actual pads is genuinely intelligible.

**MAJOR 2 — jarring 99–100 and 147–148 transitions:**
- Current E film has an explicit full-opacity \`#07111b\` mask on \`[99,100,147,148]\` leaving captions but abruptly hiding the geometry.
- Remove those hard two-frame masks. Provide a proper 6–10 frame crossfade/match-cut or a geometry-preserving transition without an empty-background flash, with deterministic motion and no collisions.
- Verify exact frames 97–102 and 145–151 at native resolution, plus a full-speed preview of at least **95–155** to judge the transitions. Preserve 750-frame length, 25.000s and the original shot narrative.

**Acceptance artifacts and tests (REQUIRED):**
1. Source SHA with no unexplained changes to A/B/C/D/F/Master.
2. Native **1080×1920 PNG proof frames**: 98/99/100/101/105/107/117/132/140/145/146/147/148/149/150. Show fully in-frame rotor and visually distinct opposed physical pads; no full-scene flashing masks.
3. Real moving source-locked **95–155** H.264 preview (61 frames @30fps), native resolution preferred, full FFprobe/FFmpeg decode PASS. Also a short actual **630–749** hero proof or exact-code equivalence check to rule out hero regression.
4. \`npm run check\`, 750-frame deterministic E integration, B mechanical tests, D layout and source contract. No change to original rotor/pad axial mechanics.
5. Document exactly which frames, visuals and geometry proof were independently inspected. Do not claim a new full 25-second film if only proofs were rendered.

**Then handoff to F/Master:** Once the narrow proof passes, request **one exact-source 750-frame / 1080×1920 / 30fps / 25.000s H.264 final candidate** from F for final D/Master approval. No automatic release; no invented VO. Avoid any new hardware or thermal polishing round.
