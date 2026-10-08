# GPU DECOMPOSITION POLISH 03 — SHARED PRODUCTION CONTRACT
**Status:** ACTIVE — authoritative correction / integration contract (2026-10-08).
**Repository (exclusive):** `YunRah2103/Remotion-gpt-chat`
**Manager / integration:** `gpu-polish3/c-master` (Agent C)
**Model:** `gpu-polish3/a-hardware` (Agent A)
**Cinematography:** `gpu-polish3/b-cinematography` (Agent B)
**Base:** `gpu-decompose/b-director` (last inspected `f20d55e493fea7bb5deab6cd8ea7fd9b1860fc5f`)
**ABSOLUTE EXCLUSION:** Never access, modify, import from or copy `YunRah2103/yunus-video-lab`. Exactly three human-directed ChatGPT agents; no additional agents.

## 1. Purpose and release principle
Upgrade the **existing**, working 15-second XFX Swift GPU decomposition, not remake it. The old final release run `37821956618`, artifact `GPU-DECOMPOSITION-FINAL-450F`, ID `11570565750`, was technically valid **but the user gave its visual presentation about 6/10**. Do not confuse old technical PASS with visual acceptance. New release must have independently inspected before/after real decoded image/video evidence, not only successful tests. Keep older assets, source, workflows, compositions, histories and the old release intact. No placeholders, reused old GLB under new name, fake proof or manufacturer-CAD claims.

### Brand identity and accuracy
Actual product: **XFX SWIFT AMD Radeon RX 9060 XT OC 16GB Triple Fan Gaming Graphics Card**, black XFX triple-fan exterior, 290 x 124 x 49 mm approximate manufacturer envelope. Three fans and recognisable Swift shroud, cooler stack and backplate. PCB routing, VRAM locations, heatpipes, screw positions and exact unseen mechanical design may be artistically reconstructed; state this in manifest and release QA. Reference external silhouette responsibly; do not put reference photos directly in final composition.

## 2. Branches, owned paths and parallel work
All three branches must originate from the manager's original base (or integrate this contract without taking other agents' unfinished changes). Agent C publishes the shared contract first, and A and B read **its immutable commit SHA** before work. The agents operate concurrently after that; do not make B wait for A merely to start camera work.

| Owner | Owned paths / outputs | Forbidden without explicit manager approval |
| --- | --- | --- |
| **A — hardware** | `gpu-decompose/agent-a/**` (new/modified modelling scripts), `gpu-decompose/polish3/hardware/**`, `gpu-decompose/assets/**` if versioned/non-destructive, `gpu-decompose/polish3/assets/**`, any model-only CI workflow under `.github/workflows/gpu-polish3-a*.yml` | `src/GpuDecomposition.tsx`, director integration code, B workflows and existing release assets |
| **B — cinematography** | `src/GpuDecomposition.tsx`, isolated scene/support files under `src/gpu-polish3/**`, graphics/camera/light work under `gpu-decompose/polish3/cinematography/**`, any `.github/workflows/gpu-polish3-b*.yml` | final locked GLB, A's movement JSON, model build scripts, Manager release authorization |
| **C — manager** | `gpu-decompose/polish3/PRODUCTION_CONTRACT.md`, `gpu-decompose/polish3/manager/**`, isolated manager CI under `.github/workflows/gpu-polish3-c*.yml`; `src/Root.tsx` only if necessary for release | Do not edit A/B-owned source while they work; C integrates exact verified finished commits only after handoff |

For any shared `public/gpu-decompose/**` output needed at render time, **A hands off hashed binaries/assets; C alone stages or copies them into the final release tree** after validation. B codes against manifest and motion schema, with an explicitly marked test-only old asset when necessary. B may supply source in native path; C then selects only its final files or commits. If any file ownership collision arises, request a versioned new path and record an explicit amendment; no accidental overwrite. No cross-branch force push.

## 3. Locked baseline / rollback
- Baseline model source commit: `322f77046b15402b55042e86822389bec1e70818`
- Baseline model build run: `37819645913`, artifact ID `11567849898`
- Baseline GLB SHA256: `e0b86390180ecb6724bcfe029bc77c9a116ff9b004e1ae14fa81b0bff8e0599e`
- Baseline motion SHA256: `1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510`
- Baseline source names: `gpu-decompose/assets/xfx_swift_rx9060xt_triple16.glb`, `gpu-decompose/assets/decomposition.json`; runtime scene previously loads `public/gpu-decompose/xfx_swift_rx9060xt_triple16.glb` and `public/gpu-decompose/decomposition.json`.
- Baseline `gpu-decompose/director/AGENT_A_LOCK.json` remains retained as history and is NOT approval to ship old assets in POLISH 03.

**POLISH 03 is fail-closed.** Agent C creates `gpu-decompose/polish3/manager/RELEASE_LOCK.json` only after validating Agent A's new artifact and Agent B's real previews. It must pin exact A and B full 40-character source SHAs, A run/artifact IDs, GLB+JSON SHA256, new source-manifest hashes, final integrated source SHA, and verified native proof run/artifact IDs. Any absent/stale/empty lock field fails release rather than falling back.

## 4. Asset compatibility, axes, hierarchy and exports
Preserve the original contract's coordinate convention: **Y-up glTF, +X GPU long edge, +Y toward upper shroud edge, +Z outward from front triple-fan surface, origin at PCB midplane, 1 scene unit = 100 mm, assembled nominal bounds 2.90 x 1.24 x 0.49 scene units**, with documented bracket exception/tolerance. Export roots and distinct anchor nodes **exactly once** (case-sensitive):
```
GPU_ROOT
  FAN_ASSEMBLY
    FAN_LEFT
    FAN_CENTER
    FAN_RIGHT
  FRONT_SHROUD
  HEATSINK
    HEATSINK_FINS
    HEATPIPE_BUNDLE
    COLD_PLATE
  PCB_ASSEMBLY
    PCB
    GPU_DIE
    VRAM_CHIPS
    VRM_COMPONENTS
    PCIE_FINGERS
    POWER_8PIN
    IO_BRACKET
  BACKPLATE
```
Preserve hierarchy, self-contained PBR materials and authored surfaces. Additional uniquely named meshes/groups are allowed; don't replace anchor names or change unit scale without a **separate versioned schema migration accepted by C and B before integration**. All fans must have distinguishable volumetric blades, hubs and a real axial separation; shroud must have physical bezels/vents; heatsink discrete fin stack and routed cylindrical heatpipes; PCB should show readable GPU die/VRAM/VRM and gold edge traces/connectors instead of an empty black slab. No 2D cutout substitute.

Agent A publishes a **new versioned** `gpu-decompose/polish3/assets/xfx_swift_rx9060xt_polish3.glb`, `gpu-decompose/polish3/assets/decomposition.json`, `gpu-decompose/polish3/assets/asset-manifest.json`; a native .blend and assembled/intermediate/exploded Blender PNGs as artifact outputs. Manifest must include all hashes, counts, coordinates, envelope measurements, anchor list, material names, file sizes, modeling source SHA, known approximations and verification method. External texture dependency forbidden. If binaries are too large for Git, publish them under a uniquely named **immutable successful Actions run** and send C exact numeric artifact ID, name and hashes. Do not delete baseline assets.

## 5. Decomposition JSON and mechanically visible clearance
Motion format is compatible with v1: `{schemaVersion:1,fps:30,durationInFrames:450,nodes:{ANCHOR:{startFrame,endFrame,from:{position:[x,y,z],rotation:[x,y,z]},to:{position:[x,y,z],rotation:[x,y,z]},easing:"smoothstep"}}}`. Values are **local ADDITIVE deltas**, not absolute positions; from is zero; preserve parent-child additive transform hierarchy, using pure frame-based deterministic interpolation. All pieces persist without sudden visibility toggles. Fan rotation around own shafts is permitted as an independent deterministic animation.

**Correct previous occlusion failure:** The baseline pushed FRONT_SHROUD **+Z 0.66** while fans only reached **+Z 0.38–0.48**, making fans visually remain inside/behind shroud. That motion is prohibited in POLISH 03. A shall design the final *assembled-to-separated* 3D envelopes such that each fan module clears the shroud rim and remains distinctly **in front of the shroud**, from initial visible separation through the final orbit. For example, fans may travel +Z ~0.85–1.10 while shroud travels only +Z ~0.18–0.35, with a short stagger of starts, individual lateral/vertical spreading, and shroud/cooler rear clearance—**these are design suggestions, not substitute for actual bounds or proof**. If this places objects outside portrait frame, coordinate a scene-wide zoom/reframe with B; do not collapse clearance or silently hide objects. Where necessary the shroud can peel modestly in Y/X while maintaining recognizable assembly. B may not “fix” trapped fans by hiding geometry or using 2D masks.

Motion stage boundaries retained: `0–89` intact hero, `90–179` clear staged fans -> front shroud, `180–329` real heatsink/heatpipes -> coldplate/die -> VRAM/VRM/PCB -> backplate reveal, `330–449` stable fully exploded hardware with subtle camera parallax. Retiming **within** intervals allowed; crossing boundaries needs written amendment signed in C contract/release notes. Avoid jarring jumps. Important: GPU_DIE and VRAM are PCB descendants; calculate additive world effects correctly. No self-intersections at any meaningful sampled stage and no obvious nonphysical passage-through of fins, housing or board.

**Collision and screen-space proof:** Agent A supplies Blender real evaluated bounding meshes/closest-feature visual tests AND explicitly identifies any PyBullet *proxy* approximations. Submit sampled poses at frames `0,45,89,90,105,120,145,179,180,210,240,270,300,329,330,385,449` and short animated proof crossing fan/shroud release. Provide quantitative positive clearance for fan face vs shroud front after release, report any temporary overlaps during physical detachment and explain how the start geometry avoids them. C checks actual final Three.js render; proxy-only JSON cannot pass visual gate.

## 6. B cinematography, studio and camera conventions
- Product dominates the portrait composition without critical crops. Use reliable projected fit based on current moved bounding boxes; treat viewport `x=70..1010` and central visual field approximately `y=260..1640` pixels as responsive composition guidance, not a mandate to keep camera tiny. Aim the visible hero GPU roughly 65–82% of image width, and major hero visually fills the center; allow 3–6% object safety margin after projection. An orthographic camera is allowed, but choose zoom and framing from **actual** pixel proofs, including extreme exploded poses. Transition smoothly to a tasteful three-quarter reveal, not nearly head-on flat layers. Avoid dead top half and exaggerated final mini-card.
- Background dark gray graphite/charcoal with smooth studio tonal separation; **do not render important front fans/PCB as crushed near-black**. Neutral white soft key from camera side, broad bounce/fill on dark faces, restrained rim highlights and correctly reflected metals; no blinding specular hot spots, black clipped surfaces, oversaturated RGB or random particles. Software rendering must visibly reveal fan blades, machined fin edges, copper/metal pipes and populated board.
- Strong opening: immediate legible larger-than-before assembled card with an elegant camera sweep or controlled light roll, not an empty opening. Maintain physically believable three-quarter form.
- Overlay style restrained and secondary: product identification and optional succinct part callouts as useful, no excessive HUD, no floating text covering the hardware. Final exploded view has meaningful front/back depth, distributed readable components, clean title and a strong last hold.
- B outputs edited real `src/GpuDecomposition.tsx` plus helpers, B-source manifest, full remote SHA, tool/run IDs, **actual native 1080x1920 stills** at frames `0,45,89,120,179,240,329,385,449` and real moving preview MP4(s) around fans/shroud clearance (`90–179`) and exploded payoff (`329–449`). Previews may initially use a marked, locked baseline model only to test framing before A finishes, and must say so; final C must rerender using A's new GLB. Provide no final release claims based on outdated model proof.

## 7. Render and integration contract
Final source comp is the **existing** `XfxSwiftDecomposition` 450-frame composition registered in `src/Root.tsx`; do not disturb `GpuDriveFilm`, `TurboDocumentary`, tooling or pre-existing workflows. Remotion/Three consumes the **real** new A GLB, materials and JSON; camera, lighting and deterministic animation authored by B. C pins A/B SHAs and selectively merges/cherry-picks owned paths into C. Do not replace new geometry with procedural generic GPU or cached old files. Validate file hashes **after copy into `public/gpu-decompose/`** and fail closed on source manifest mismatch before rendering.
- Rendering: **1080x1920, 30 fps, frames 0..449 (450 frames), exactly 15 seconds, H.264 yuv420p, AAC stereo 48kHz**, MP4 faststart. Use existing GitHub Actions chunk/render/mux tooling where possible, preferably bounded independent chunks with exact contiguous frame accounting and hard fail for missing chunks. Original noncopyright infringing studio/mechanical audio or preserved original if appropriate; no silent audio omission.
- Preflight: `npm ci` or repo-compatible install, `npm run check`, glTF parse, required anchor uniqueness, bounds, hierarchy, motion JSON validation, path resolution, actual GLB bytes/hash/manifest pin, motion samples, source/provenance lock; `ffprobe` any existing proof, decode moving samples.
- Native proofs must evaluate and **visually inspect** frames `0,45,89,120,179,240,329,385,449` after final A+B integration, plus video motion clips over `90–179`, `180–329` and `330–449` where practical. Use native Remotion/Three renderer, not only Blender stills. Independent visual review must check component counts, brightness, fan/shroud clearance during motion, PCB fullness, visible fins/pipes, no clipping, no black frames/glitches, clear progressive motion and final depth. Compare against real decoded frames/video from old run/artifact `37821956618` / `11570565750` under comparable frame indices; label any subjective interpretation as qualitative.
- Full render only after C signs `RENDER_APPROVED` with immutable locks and native proof artifacts. Final final release only after ffprobe verifies exact streams/dimensions/fps/count/duration/pixel format/sample rate/channels, complete `ffmpeg -f null -` decode succeeds, chunk provenance matches, all files hashed, all screenshots and actual full MP4 are visually reviewed.
- Release artifact name **`GPU-POLISH3-FINAL-450F`**; package `XFX-SWIFT-RX9060XT-POLISH03-15S.mp4`, `hero.png`, `mid-decomposition.png`, `exploded.png`, `ffprobe.json`, `SHA256SUMS.txt`, `source-manifest.json`, `VISUAL_REVIEW.md`, `FINAL_RELEASE.md`. C returns **full 40-hex remote SHA**, GitHub workflow run ID, final numeric artifact ID, final MP4 SHA256, ffprobe/decoder results, visuals and honest remaining accuracy limits. No release if files cannot actually be accessed.

## 8. Hard visual quality gates (independent, not just machine checks)
C must REJECT and iterate if any of these remains: small GPU / excessive dead portrait space, crushed almost-black hardware, boring generic rectangular layers, fan blades embedded in shroud during separation, PCB empty slab, intersecting layers, flat heatpipes/fins, unintelligible explosion, flat final portrait, unintended model crops, temporally discontinuous animation, missing frames or visual glitches. Brand must be recognizable but do not claim exact OEM internal CAD reconstruction. Genuine aesthetic improvement must be visible side-by-side in decoded before/after evidence.

## 9. Handoffs, review and authorization
1. **C publishes this contract on C branch; gives agents full commit SHA.**
2. A and B work concurrently on separate branches with unique paths and report source/preview hashes; each pushes a complete handoff to its branch.
3. C retrieves final A and B **remote** commit objects; checks paths changed against ownership matrix and SHA-locked outputs; confirms successful A build and B moving native proofs; no trust of prose-only completion.
4. C integrates selected changes into `gpu-polish3/c-master`, checks actual GLB/new motion instead of silently retaining baseline, corrects integration-only issues or asks owner for targeted source fixes.
5. C reviews full native proofs and existing old video before granting **RENDER_APPROVED** in release lock; after full render review/validation grants **RELEASE_APPROVED** in report.
6. If any required proof or asset is absent, state **BLOCKED** with exact missing evidence; do not fabricate success or issue a 6/10-style release. Never access the forbidden repository.

## 10. Immediate Agent A/B acknowledgement
Each agent must link this exact file and **its full remote C commit SHA** in their own new handoff, and list any explicit divergence before export. No unilateral changes to stable GLB node names, coordinates, frame count, codec, ratio or final artifact name. Agent C is sole final render/release authority.
