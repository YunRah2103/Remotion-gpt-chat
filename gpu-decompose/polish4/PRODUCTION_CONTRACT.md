# GPU DECOMPOSITION POLISH 04 — PRODUCTION CONTRACT

**Status:** ACTIVE / TEAM START AUTHORIZED upon publication of this document.
**Repository:** `YunRah2103/Remotion-gpt-chat` ONLY. **Forbidden:** accessing, modifying, importing or copying `YunRah2103/yunus-video-lab`.
**Master:** Agent D / `gpu-polish4/d-master`.
**Base:** `gpu-polish3/c-master` at immutable commit `ca75f8d5cb7536a83ce0bf110c76dc268273ec26`.
**Agent branches:** A `gpu-polish4/a-hardware`; B `gpu-polish4/b-cinema`; C `gpu-polish4/c-motion`.
**Date:** 2026-10-08. Exactly FOUR user-directed agents; no agent may create additional agents, use paid services, or change repository scope.

## 1. Mission, immutable baseline and visual goal

POLISH04 is a **cinematic revision** of the real, successful POLISH03 450-frame film, not a rebuild. User rated that film approximately **6.5/10**: small GPU in portrait space, dead space, static / flat views, insufficient believable close-ups, lackluster separation rhythm and final payoff. More geometry alone is NOT a passing improvement. Prior successful MP4: workflow `37837671314`, artifact ID `11576047638` named `GPU-POLISH3-FINAL-450F-AUDIOPOLISHED`, video SHA256 `5a35ed33825395370bd4fe9c3b6092ed13b8ec6bdaa465d9977d1b80a2548e5d`. Independently download, decode and visually compare this baseline; never pretend success of old pipeline proves new creative improvement.

**Approved starting A model:** source commit `e5e274437a47b554af7940911e5a825397dc64f3`, model run `37833031666`, artifact `11574168580`, GLB SHA256 `21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5`.
**Approved prior B cinematography:** source `0eed29a86067bccd74c5d6e44eb116d2bcd4d95c`; actual integrated scene at base includes manager-side camera adjustments; these adjustments must be examined and preserved where beneficial.
**Approved POLISH03 motion JSON:** SHA256 `d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b`.
Retain all earlier compositions, workflow history, exact original assets and reports. The canonical Remotion ID remains **`XfxSwiftDecomposition`**, 450 frames, 30 fps.

## 2. Strict ownership matrix and no-edit overlap

All branches **must start at this published D contract commit**, not from another agent's unfinished branch. If a specialist already started before receiving the immutable contract, they must reconcile against it and disclose divergence, never silently overwrite peers.

| Owner | Exclusive source/output paths | Must not edit |
|---|---|---|
| **A — materials / hardware** | `gpu-decompose/polish4/hardware/**` (Blender build, materials tests, model source, exported manifest), `gpu-decompose/polish4/a-handoff/**`, optionally `.github/workflows/gpu-polish4-a-*.yml`. Binary `xfx_swift_rx9060xt_polish4.glb` in isolated Actions artifact or hardware subdirectory when appropriate. | `src/**`, any motion JSON, D runtime `public/gpu-decompose/polish4/**`, other agents' workflows. |
| **B — cinematography (highest visual priority)** | `src/gpu-polish4/**` (new scene component, camera choreography, lights, shot schedule, screen-space UI and helpers), `gpu-decompose/polish4/cinema/**` (evidence, shot plan, hashes), optionally `.github/workflows/gpu-polish4-b-*.yml`. | A's GLB / Blender sources, C's JSON / animation code, `src/GpuDecomposition.tsx`, `src/Root.tsx`, D public assets or release files. |
| **C — motion / decomposition** | `gpu-decompose/polish4/motion/**` (authored + generated JSON, motion-generation code, collision / swept-clearance evidence, reports), optionally `.github/workflows/gpu-polish4-c-*.yml`. | A's meshes, B's camera source / shaders, D runtime `public/**`, D integration / final workflows. |
| **D — master** | `gpu-decompose/polish4/PRODUCTION_CONTRACT.md`, `gpu-decompose/polish4/manager/**`, `public/gpu-decompose/polish4/**`, final version/hash lock, final `src/GpuDecomposition.tsx` / `src/Root.tsx` registration only, `.github/workflows/gpu-polish4-d-*.yml`, release and QA. | No edits to A/B/C exclusively owned source paths during parallel work; integrate only their explicit completed handoffs. |

**File transfer rule:** A and C do NOT both write `decomposition.json`. A delivers geometry/hierarchy only, plus suggested clearance; **C exclusively owns all final motion JSON**. B only consumes motion, never authors transform timelines for A's components. D alone places final GLB and motion bytes into `public/gpu-decompose/polish4/` and publishes the release manifest. B scene should load `gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `gpu-decompose/polish4/decomposition.json` using `staticFile`; do not read provisional binaries if the final version is missing. Agents may use temporary **clearly flagged proof-only** inputs, but no provisional fallback in release.

If unavoidable collisions arise, D must amend this contract with a named owner, versioned interfaces and publication SHA **before** agents edit, not resolve by last-writer-wins. Never force push.

## 3. Exact model coordinate and anchor contract

Use glTF **Y-up**; **+X = card long axis, +Y = upper shroud edge, +Z = out of front fan face**, origin at approximate PCB midplane, scale **1 unit = 100 mm**; original manufacturer-like exterior envelope approx **2.90 x 1.24 x 0.49 scene units** (290 x 124 x 49 mm), bracket may extend slightly. Preserve transform pivots so local additive offsets remain physically intelligible. Required unique, case-sensitive anchor names, exactly once each:

```text
GPU_ROOT
├─ FAN_ASSEMBLY
│  ├─ FAN_LEFT
│  ├─ FAN_CENTER
│  └─ FAN_RIGHT
├─ FRONT_SHROUD
├─ HEATSINK
│  ├─ HEATSINK_FINS
│  ├─ HEATPIPE_BUNDLE
│  └─ COLD_PLATE
├─ PCB_ASSEMBLY
│  ├─ PCB
│  ├─ GPU_DIE
│  ├─ VRAM_CHIPS
│  ├─ VRM_COMPONENTS
│  ├─ PCIE_FINGERS
│  ├─ POWER_8PIN
│  └─ IO_BRACKET
└─ BACKPLATE
```

Interpret indentation as **semantic ownership**, not authorization to reparent existing components casually: inspect the actual POLISH03 hierarchy first and preserve the real parent-child world transform effects. Additional uniquely named groups are permitted; required names cannot be renamed / duplicated. All three fan blade sets, depth-bearing shroud/vents, physically raised fin stack, cylindrical heatpipes, populated board, GPU package, VRAM/VRM, gold connectors, metal bracket and backplate must be **real 3D mesh**. Keep plausible XFX SWIFT black triple-fan silhouette; preserve approved proportions, not manufacturer-CAD internals. Use Blender glTF export with textures embedded, valid PBR color/metallic/roughness; no missing external image paths. A provides .blend/build script, real Blender multi-angle stills, anchor/node count, mesh count, dimensions, material list, GLB SHA256, source full SHA, build workflow & artifact IDs and honest approximation statement. Avoid simply increasing polygons or cosmetic trim with no readable appearance.

## 4. Versioned motion JSON and integration interface

C outputs `gpu-decompose/polish4/motion/decomposition.json` and generator source. **Release schema remains v1**, compatible with prior Remotion implementation; no silent changes. Contractually valid minimal payload:

```json
{
  "schemaVersion": 1,
  "fps": 30,
  "durationInFrames": 450,
  "nodes": {
    "FAN_LEFT": {
      "startFrame": 94, "endFrame": 158,
      "from": {"position": [0,0,0], "rotation": [0,0,0]},
      "to": {"position": [-0.1,0.1,0.9], "rotation": [0,0,0]},
      "easing": "smoothstep"
    }
  }
}
```

Example is **illustrative only**, not approved animation coordinates. Final nodes must include `FAN_LEFT`, `FAN_CENTER`, `FAN_RIGHT`, `FRONT_SHROUD`, `HEATSINK`, `GPU_DIE`, `VRAM_CHIPS`, `PCB_ASSEMBLY`, `BACKPLATE`, with every `from` position/rotation zero. Values are **local additive deltas** to each GLB object's authored transform, rotations in radians, and independent parent/child additive traversal. Interpolation is deterministic `smoothstep` based on integer frame; no random or time-based animation. Motion start must be at least 90 and finish at most 329 unless D publishes an explicit schedule amendment plus updated runtime validation. All components persist; never cheat with visibility toggles, masks or fake 2D exploded layers.

**Handoff sequence:** A may begin materials work immediately; C prototypes against **locked POLISH03 hierarchy** but must run **final collision and clearance checks on exact A exported POLISH04 GLB** before approval. B designs shots immediately against locked coordinate/anchor interface. C delivers JSON SHA256, generator SHA/source SHA, final model SHA used for clearance, sampled world-space envelopes and real moving clip. D integrates using a single final GLB + one C-authored JSON, validates hashes and outputs.

## 5. Approved narrative / shot map (450 frames total)

| Frames | Creative shot | Film / mechanics intention |
|---|---|---|
| **0–49** | Complete product hero | GPU impressively sized in portrait frame, controlled 3/4 push or orbit, fan faces and thickness readable; immediate visual hook |
| **50–89** | Detail hero / setup | Deliberate closer oblique shot showing shroud, fan machining and premium hardware. May crop edges *intentionally* |
| **90–159** | Fan separation macro | Physically clear extraction toward camera, staggered three-fan choreography, shroud behind; dedicated close-up with believable parallax |
| **160–209** | Shroud / cooler reveal | Shroud transitions out, fin-stack depth and individual heatpipes illuminated, purposeful camera bridge |
| **210–279** | Thermal core and PCB macro | Tracking macro of heatpipes, cold plate, die, VRAM / VRM / edge connector; engineering detail, not black rectangles |
| **280–329** | Complete assembly expands | Distinct component silhouettes, clear separation and reframe to avoid confusion |
| **330–404** | Dramatic exploded master | Camera pulls/rotates to establish all major components as one visually structured assembly, not random parts |
| **405–449** | Final payoff & hold | Full readable exploded hardware, strong depth, premium highlighting, final clean title / hero composition |

Scene may cross-cut at boundaries without teleporting geometry; world-space transforms continue smoothly even when cropped. The previous motion start/finish window 90–329 is preserved; B can change framing/camera and relative focus independent of C. B must publish a frame-by-frame deterministic shot schedule (target, camera path, zoom/FOV and target component). Avoid abrupt slide-like transitions or exaggerated spins. First full-card and last exploded view must show all required components with 3–6% safe frame edges; temporary macro crops are expected and explicitly allowed.

## 6. Screen-space, camera, lighting and material passing thresholds

**Priority order:** useful camera movement and composition > cinematic reveal timing > depth / material legibility > extra tiny mesh details. Full-card hero should occupy approx **75–90% of usable viewport width** when its width is projected from real pixels, without crop/overlap; this is a soft art-direction target, NOT an excuse to distort geometry. A completely visible horizontal object inherently leaves vertical space: use punch-ins, 3/4 angle, meaningful top/bottom overlays and editing, not permanent overzoom. Purposeful macro shots should occupy a majority of the visual field. Final exploded view re-establishes the whole unit with clear visual separation; no arbitrary miniature composition or neglected top third.

Camera use a deterministic continuous `frame` / `useCurrentFrame` function, with eased eye + lookAt movement and smooth lens changes. Use dynamically projected bounding boxes or validated authored shot framing, with robust limits to prevent key parts leaving screen unexpectedly. For each shot record screen-space approximate subject bounding rectangle and center; check no critical geometry or captions are unintentionally cropped. Dramatic low 3/4 raking light makes the cooling stack/PCB legible; broad soft studio key, camera-side fill, restrained rims, metallic edge highlights and visible dark material texture. Maintain neutral graphite charcoal elegant background, not black crushed surfaces or magenta/purple cast. No particles, HUD spam, random flares or unrelated environments; no invented manufacturer labels on rebuilt internals.

B must produce real 1080x1920 **native Remotion/Three** stills and moving clips (not CSS mockups) from its branch, with before/after matched POLISH03 frame studies. If B proof uses provisional POLISH03 model or C motion, label precisely: final integrated A/C re-render is required. B must provide exact source SHA and native proof run/artifact IDs.

## 7. Mechanical clearances, interaction and sampling

C must explicitly prove fans pass **in front of** shroud without being buried (historical +Z shroud-over-fan defect); cooler separates without obvious fin clipping; GPU die and VRAM movement respects `PCB_ASSEMBLY` inherited transform. Check positive signed face-to-rim clearance *after visible release*, with reasonable contiguous exit path and no teleports. Sample actual meshes / conservative bounds at **0,30,60,89,90,100,115,135,150,180,210,225,250,270,280,310,329,365,415,449**, plus additional swept intermediate frames at risk boundaries. Distinguish exact Blender mesh checks from proxy / AABB tests; no proxy-only 'no collision' claim is a visual PASS. Real moving proof must show 90–180 and 180–330, and final assembled scene must be visually inspected with final geometry. If C and B disagree on screen-space clearance, **C owns world transforms, B owns optical framing**, with D settling the conflict in a documented interface note.

## 8. Agents' handoff and manager integration (fail-closed)

Each agent handoff must include: full 40-char remote source SHA, exact changed paths, commands/tests, run IDs and numeric artifact IDs with names/URLs, all SHA256 hashes of outputs, actual preview images/video, noted limitations, and affirmative confirmation that forbidden repo was untouched. Full model GLB and motion JSON cannot be substituted for prior assets if missing. D verifies the *actual bytes* from artifact or committed paths, required names and camera/motion invariants, and prevents silent fallback/cached staticFile URL to POLISH03 paths.

D shall create `gpu-decompose/polish4/manager/RELEASE_LOCK.json` with status `preflight` -> `render-approved` -> `release-approved`, only advancing on evidence. Required non-empty fields: `contractCommitSha`, `agentASourceSha`, `agentBSourceSha`, `agentCSourceSha`, `integratedSourceSha` (full 40), `glbSha256`, `motionSha256`, `cameraSourceSha256`, `hardwareArtifactId`, `cameraProofArtifactId`, `motionProofArtifactId`, `nativeIntegratedProofRunId`, `nativeIntegratedProofArtifactId`, `qaReportSha256`, `renderApproved`, `releaseApproved`. In the integrated source SHA circularity case, record the hash of the immutable *render source commit* in a separate post-render release manifest rather than inventing a self-referential hash. Missing hashes/permissions/assets = BLOCK, not fallback.

D stages only verified assets into `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `public/gpu-decompose/polish4/decomposition.json`; B scene `GpuDecompositionPolish4` plugs into existing `XfxSwiftDecomposition` registration (manager-owned one-line wiring). Keep old `GpuDecompositionPolish3` module and all old comps/releases intact.

## 9. Native preflight and proof-before-full-render gate

Before expensive full render: `npm ci`, `npm run check`, glTF hierarchy/material/scale validation, exact GLB and motion hash, anchor uniqueness, motion type/schema/values, camera orbit sanity, note any A/C schema departures, actual Remotion/Three native 1080x1920 stills at **0,30,60,100,135,180,225,270,310,365,415,449**, and **moving native video** across shot cuts, fan release, cooler/core reveal and exploded payoff. Provenance from final integrated source and exact A/C asset hashes must be visible in artifacts.

D **independently visually inspects decoded pixels**, compares matched POLISH03 and POLISH04 frames plus multiple real motion clips, rejects too-small GPU, dead spaces, nearly static presentation, flat / crushed hardware, unreadable fans/fins/heatpipes/VRAM/VRM, unintended crop, unmotivated hard cuts, physics violations, bland final assembly, title overlap or hallucinated internal fidelity. Compare multiple motion moments to ensure real camera change not just title/fades. Native proof passes only on observed improvement. D writes `RENDER_APPROVED` report with proof IDs and lock hashes; no full 450-frame production otherwise. Targeted fixes return to owners; never restart the model unless demonstrably necessary.

## 10. Full render, audio, native release and QA

Reuse original 450-frame Remotion/Three + GitHub Actions FFmpeg pipeline / verified chunk behavior, no paid infrastructure. Output precisely **1080 x 1920, 30/1 FPS, 450 video frames, 15.000 s, H.264 yuv420p MP4 with AAC 2-channel 48 kHz**, `+faststart`, full duration mechanical original sound bed, no narration. Gain-stage audio based on real `ffmpeg volumedetect` (POLISH03 initial render was inaudibly low and fixed in post): audible but restrained, no clipping/distortion. Preserve neutral colors: no historic magenta artifact from pixel format/range/filter misuse.

Package one complete `XFX-SWIFT-RX9060XT-POLISH04-15S.mp4`, `hero.png`, `hardware-macro.png`, `exploded.png`, `before-after.png` (or paired labeled comparison images), complete `ffprobe.json`, `SHA256SUMS.txt`, `RELEASE_LOCK.json`, `VISUAL_REVIEW.md` and `FINAL_RELEASE.md`. Final artifact name `GPU-POLISH4-FINAL-450F`. Record successful Actions workflow run IDs, artifact numeric ID, **direct GitHub Actions artifact link**, source full SHA and full MP4 SHA256. Independently download final ZIP/MP4, compare checksums, ffprobe all streams incl fps/pixel/audio/count, **ffmpeg -v error -i <file> -f null -** whole-file PASS, inspect representative real frames and whole moving composition, check actual 450 unique decoded frames / blackdetect/freezedetect (normal artistic camera holds must be judged with care). No black frames, purple corruption, frame duplication, broken files, missing audio, mis-timed end or unverified creative claims.

**Release does not exist until final bytes and native proof pass.** If outputs unavailable report BLOCKED with exact outstanding evidence and links, never claim a playable MP4 by describing source alone. Document visually remaining weaknesses rather than inflating a score. The XFX exterior is reference-based and internal geometry is artistic reconstruction, **not OEM CAD accuracy**.

## 11. Parallel start and communications

Agent D publishes this contract first and shares **its exact immutable 40-character remote commit SHA**. A/B/C read the published file and acknowledge it in their branch handoffs, then run **simultaneously**. They do not modify each other's owned outputs; C does not wait for A to author motion but **does** depend on A's final GLB for final clearance validation. B may use interim old assets solely to prove camera, then D re-renders final model + motion. Agent D prepares integration/workflows concurrently, integrates only completed SHA-locked handoffs and remains sole release authority.

**Quality over fake success:** three agent green checks are not a finished advertisement. Actual rendered, inspectable MP4 is the deliverable.