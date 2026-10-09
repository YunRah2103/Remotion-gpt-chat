# CARBON-CERAMIC BRAKES 001 — AGENT E
## FINAL POLISH 05 · TWO SURGICAL VIDEO FIXES

You are GPT-6, **Agent E — Senior Remotion/Three.js Integration Engineer, Automotive Cinematographer and Final Integration Director**.

**MISSION:** Fix exactly TWO remaining presentation defects in the existing 25-second Carbon-Ceramic Brakes video, then supply real source-locked native proof for Agent F's next complete render.

**DO THE ACTUAL IMPLEMENTATION, NATIVE RENDERING, TESTING, COMMIT AND HANDOFF. THIS IS NOT A PLANNING TASK.**

### 1. Source and ownership

- Repository: YunRah2103/Remotion-gpt-chat
- YOUR existing branch: automotive-brakes-001/e-integration
- Verified E branch HEAD before this task file: 8eb6ef4e59b1b0096f6726775c8451b442f858ea
- Exact **Polish04 film** source independently reviewed by Agent D: 21c2b581b46251b0bd45028d32eb40b4341eeb2a
- Independent QA branch: automotive-brakes-001/d-graphics-qa
- Verified latest D HEAD: b95067e56b3ba70b377fd41f043c1b72ae1c47e5
- Your existing PR: #15
- Full Polish04 reviewed MP4: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804
- Existing film: CarbonCeramic001 — 750 frames, 30 fps, 1080x1920, 25.000 seconds.

**Authoritative instructions and inspection evidence:** Read these files on Agent D's branch, not from an out-of-date local copy:
- production/videos/carbon-ceramic-001/qa/POLISH04_E_POLISH05_HANDOFF.md
- production/videos/carbon-ceramic-001/qa/POLISH04_FULL_INDEPENDENT_REVIEW.md
- production/videos/carbon-ceramic-001/qa/POLISH04_FRAME_EVIDENCE.md

Agent D independently verified the full Polish04 MP4 technically PASS but creatively FAIL FOR RELEASE at 6.6/10. **The final hero orbit, thermal styling, benefits framing, hardware and physics do NOT need reconstruction.**

### 2. MAJOR CORRECTION ONE — pad visibility and rotor clipping

**Affected:** Film frames 107–145, especially 117, 132, 140 (roughly 3.57–4.83s).

Independent observed defect: frame 117 crops the real rotor beyond the right portrait boundary; both physically real opposing pads cannot be distinguished clearly at phone size.

Correct the E-owned in-film cutaway staging, IntegrationCameraRig, and truly E-owned shot labels only:
- Fit the entire rotor within the 1080x1920 safe composition throughout the full cutaway.
- Use an accurate axial/three-quarter profile that makes the *actual two opposed pad faces* intelligible.
- Show the static caliper before the labelled cutaway; if hidden temporarily, explicitly indicate CALIPER HIDDEN rather than pretending it vanished mechanically.
- If real attachment points and perspective can be verified, include compact, legible **INNER PAD** / **OUTER PAD** labels pointing to the real A-model pad nodes; otherwise omit misleading leaders and improve framing.
- Place the source-driven measured clearance readout away from the rotor and platform-safe text margins.
- Preserve Agent B's motion history and true physical pad clearance 0.15–2.50 mm per face (maximum 2.35 mm movement per real pad).
- Never enlarge, teleport or fake pad translation, swap physical pads for graphics, or distort the rotor.

### 3. MAJOR CORRECTION TWO — remove dark two-frame flashes

**Affected:** Frames 99–100 and 147–148 (~3.30s and 4.90s).

Independent evidence confirms a full-opacity #07111b mask abruptly hides the real brake while captions persist, producing two distracting flashes.

- Remove the hard masks and geometry disappearance.
- Replace them with a deterministic, geometry-preserving clean match cut, or a **6–10 frame** spatially coherent transition.
- Avoid jumpy orientation, an empty canvas, black/dark flashes, title collisions and discontinuity in rotor/pad dynamics.
- Inspect source-specific actual frames 97–102 and 145–151, plus a complete native moving range of at least 95–155.
- Keep the overall runtime EXACTLY 750 frames / 25 seconds.

### 4. Preserve every accepted improvement

**Do not** change A hardware geometry or Blender materials, B physics, C-owned camera source files, D graphics internals, F workflow, Master release gates or anything in YunRah2103/yunus-video-lab.

Do not redesign the final hero orbit (630–749): Agent D **PASSED** its improved visible movement. Do not recreate the heat effect or benefits shot. Keep original five-shot educational arc and source provenance.

### 5. Real acceptance evidence — required before READY

Produce all of the following on a single immutable corrected film SHA:

1. Actual native **1080x1920 PNG** proof frames: **98, 99, 100, 101, 105, 107, 117, 132, 140, 145, 146, 147, 148, 149, 150**. Include a contact sheet and identify true pad surfaces.
2. Genuine in-film Remotion/Three.js **MP4 frames 95–155 inclusive**, 61 frames @30fps, preferably at native 1080x1920. Show clean transitions, full rotor and both opposed pads; no mock footage.
3. Exact-source proof of unchanged accepted final hero 630–749, by matching the relevant unchanged film-code blobs or rerendering an actual hero clip where necessary. Do not claim unchanged just by looking at Git message.
4. Real FFprobe verification and full FFmpeg decode of all MP4 proofs.
5. npm run check, dedicated 750-frame E integration test, B physics tests, D graphics checks, project validation and relevant Python tests.
6. Independently inspect actual frames and moving proof and document precisely what was viewed. If a player cannot run at full speed, say so and use ordered frames/FFmpeg measurements as available; never invent a full-speed inspection.

**PASS gates:** frame 117 rotor fully inside portrait safe margins, both physical pads identifiable, no hard masks/black flashes at either transition, no mechanics regressions and no degradation of the approved final hero.

### 6. GitHub delivery and next rendering stage

Commit the **actual fixes** to automotive-brakes-001/e-integration (PR #15). Update:
- production/videos/carbon-ceramic-001/handoffs/agent-e.json
- production/videos/carbon-ceramic-001/handoffs/agent-e.md
- src/brakes001/integration/QA_REPORT.md and SOURCES.md as applicable.

Provide the exact newly corrected **FILM SOURCE SHA** (not merely a documentation SHA), relevant tested commit SHAs, source-specific GitHub Actions run and downloadable artifact links, tests, frame 117 before/after comparison, transition proof, remaining blockers, and handoff to Master/F.

Mark **READY FOR MASTER REVIEW** only after genuine evidence passes; otherwise report REVIEW and explicitly describe the blocker.

Once Master authorizes, **Agent F** renders the one NEW complete native 750-frame, 1080x1920, 30fps, 25.000s H.264 yuv420p MP4 from this exact source, full FFprobe + FFmpeg QA and SHA256. Agent D/Master then review that actual complete film. Do not describe partial preview MP4s as the final 25-second film.

Approved narration must come from an accessible, verified original user-provided file. If none exists, the candidate remains clearly labelled silent.

**URGENT: Complete the two precise corrections and handoff. Do not start a Polish06 or a fresh production.**
