# GPU POLISH04 — AGENT B FINAL CINEMATOGRAPHY HANDOFF

**Agent:** B / Lead Cinematographer & Visual Director  
**Decision:** B-only cinematography **READY FOR D INTEGRATION** (native provisional-model proof PASS with an explicit PCB/die limitation). This is **not** the final integrated A/C visual signoff or finished MP4.
**Repository:** `YunRah2103/Remotion-gpt-chat` only. Never accessed or changed `YunRah2103/yunus-video-lab`.
**Branch:** `gpu-polish4/b-cinema`.
**FULL SOURCE COMMIT SHA:** `009dad8d58662857afeefe8ab1ff7942adb942f2`.
**Base:** D's contract-bearing commit `102064938a9a45540434c93d9ff03cdcd72f9cba`, descendant of the user-provided POLISH03 C base `ca75f8d5cb7536a83ce0bf110c76dc268273ec26`.
**Contract:** Read `gpu-decompose/polish4/PRODUCTION_CONTRACT.md` from D. Compliant with D's owned source/path matrix. B never changed A's GLB, C's motion values, manager-owned `src/GpuDecomposition.tsx`, `src/Root.tsx`, public assets or release pipeline.

## 1. Completed source and integration

- `src/gpu-polish4/GpuDecompositionPolish4.tsx` — exported `GpuDecompositionPolish4` composition, strict GLB/motion loader and 19 required unique anchors, independent B cloned PBR material/lighting scene, application of additive C-provided anchor motion.
- `src/gpu-polish4/camera.ts` — exact deterministic frame-keyed perspective camera, separate component focus group selection, mesh-tight projection fit from eight transformed corners **of every GLB mesh geometry bounds**, no axis-aligned world-box false padding, continuous eased poses. All GPU world transforms remain C-owned.
- `src/gpu-polish4/editorial.tsx` — clean typography, controlled introduction/exit, macro-safe caption relocation at 280–329.
- `src/gpu-polish4/proof-index.tsx` — B-only proof composition `GpuPolish4BProof`; D should NOT add this to the canonical Root.
- `gpu-decompose/polish4/cinema/SHOT_PLAN.md` — concrete shot map and rationale, including native revision 1/2/3 visual corrections.
- `.github/workflows/gpu-polish4-b-native-proof.yml` — real GitHub Actions proof, temporary test-only approved POLISH03 A/C hashes, stills + moving clips + before/after comparisons.
- This `gpu-decompose/polish4/AGENT_B_HANDOFF.md` is handoff-only; the immutable source above is the verified B implementation.

**D integration exact instructions:** Import `GpuDecompositionPolish4` from `src/gpu-polish4/GpuDecompositionPolish4.tsx` into D-owned canonical composition export/registration `XfxSwiftDecomposition` (1080×1920, 450 frames, 30fps). Only D must stage **final** validated assets at `public/gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb` and `public/gpu-decompose/polish4/decomposition.json`, using final A GLB/C JSON SHA locks. The production runtime has **no fallback to POLISH03 assets**. B's workflow stages the old assets only inside disposable runners for optical proof. Do not copy the provisional source to final production public assets.

The `GpuDecompositionPolish4` module uses `staticFile('gpu-decompose/polish4/xfx_swift_rx9060xt_polish4.glb')` and `staticFile('gpu-decompose/polish4/decomposition.json')`; no changes required when swapping D's final named assets. Enforce C's `schemaVersion:1`, 30fps / 450 frames and additive offsets for all nine moving named anchors.

## 2. Contract schedule and optics

| Frames | Optical subject | Lens / camera intention |
| --- | --- | --- |
| 0–49 | assembled hero | full 3/4; yaw 18→28°, pitch 14→17°, roll about -29→-32°; 31–33° FOV |
| 50–89 | detail setup | shroud→center fan, purposeful crop; yaw transitions to 10°, roll -10°; 30–34° |
| 90–159 | fan extraction macro | true center rotor→front-assembly wider; yaw ~10→45°; fans advance under C offsets |
| 160–209 | cooler + heatsink | cooler/heatpipe group; yaw 45→57°, roll -28→-15°; 30–34° |
| 210–279 | thermal / board tracking | heatpipes, coldplate, GPU package, PCB; yaw ~57→59°, pitch ~23→26°; 29–30° |
| 280–329 | internal components close-up into expansion | PCB/VRAM/VRM focus, side parallax yaw ~68→76° at frame 307, then 56° for expansion; 28–33° |
| 330–404 | full exploded hero | full transformed GLB mesh extents, yaw 56→57°, roll -29→-36°, 32–33° |
| 405–449 | complete exploded hold | yaw 57→59°, roll -36→-35°, fov 32°, final optical bias +.30 scene units |

Full frame lens/eye/target are derived by `evaluateCamera(frame,scene,aspect)` from GLB actual moved mesh bounds; keyed yaw/pitch/roll/FOV/target are recorded in `CAMERA_KEYS`. **No fixed camera positions** that assume POLISH03 exploded distances. Camera updates after the C JSON local additive pose, so any valid final motion changes are included in the fit. Whole-model views are camera-fit; deliberate macro selected focus crops are permitted. Interpolation uses frame-only smoothstep, no time, mutable spin, camera shake or custom compositing fakes.

**Lighting:** neutral charcoal background `#1c2227`; non-neon warm-neutral front/overhead key, broad soft key spot, moderate camera-side fill, restrained far-side rim and rear highlight, hemisphere and ambient. Key intensity 3.8, broad spot 21, side fill 2.15, rear rim 3.5, bounce 1.0; see source positions and PBR. Source texture/albedo/normal preserved. Cloned source MeshStandardMaterial applies only metalness max .92, roughness min .27, preventing flat bleached chrome but retaining dark fan blade contour. No particles, tech HUD, RGB, floor gaming scene or arbitrary 2D stand-ins.

## 3. Real native proof — FINAL B SOURCE (must use this record)

**Successful native Remotion/Three workflow:** `37842291178`; branch head **exactly** `009dad8d58662857afeefe8ab1ff7942adb942f2`, workflow conclusion SUCCESS.
**Artifact:** `GPU-POLISH4-B-CINEMA-NATIVE-PROOFS`, numeric ID **`11577758531`**.
**Proof URL:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37842291178/artifacts/11577758531
**Actions run URL:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37842291178

Actual stills at `0,30,60,100,135,180,225,270,310,365,415,449`: all 1080×1920 browser-rendered real GLB, not static tests or screenshots of TypeScript. Eight native 1080×1920 moving MP4s over `20–27`, `61–68`, `101–108`, `167–174`, `228–235`, `285–292`, `351–358`, `423–430`, all exactly eight frames H.264 30fps, 64 full-resolution frames in total; each independently decoded with FFmpeg and exact frame counts checked **PASS**. All uploaded SHA256 checks independently verified after artifact download. The artifact includes six matching `compare-{30,100,225,310,415,449}.png` before/after composite PNGs and full manifest `SHA256SUMS.txt`. A 12-still contact was independently examined at phone tile scale; macro, ending and PCB examined at full resolution. All eight moving clips checked with FFmpeg and consecutive visual sampled frames.

Selected actual artifact file digests:
- `frame-30.png`: `ad2bb539bd80b320de7b32200f4e90bb0f60b99482b312353266d1333e21193d`
- `frame-100.png`: `9c8202fdd6a0342da7472c221a62bf884b7c4a1789a4f1986cfcefac3ae91c8d`
- `frame-310.png`: `41f7913de5d01793bf8d2b102db79861e47136a65c16ed49d74bd2f4367b7eb2`
- `frame-449.png`: `570f30baacaaabbad6a831578fcb3ae12389600adcde6bfec9d9f731158a93ba`
- `moving-285-292.mp4`: `27756fe5ea31553aed301cbd756ef8a71f7f3f96d49b232ff650738f726f1347`
- `moving-423-430.mp4`: `b1ff6c3e0bf346b78dd5aafeaa9dbd542a6cbf395d723604f74d74cfeb66b386`

**CINEMA PROOF ASSET LIMITATION — CRITICAL:** This B-only proof was staged with exact **POLISH03** A model from successful original run `37833031666`, artifact `11574168580`, GLB SHA256 `21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5` and POLISH03 motion SHA256 `d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b`. Thus optics/system are proven functional and visually assessed, but final A/C assets MUST undergo D's separate native proof and approval. These bytes were not committed into production.

The earlier native review source `c7a4f2ac1c4cb1c3fb85237089a7a3853a3da682` at successful run `37841513740`, artifact `11577144457` improved final hero but moved the chip macro to too shallow a viewing angle (fans overwhelmed PCB). That was **rejected and corrected** by the final SHA. Revision 1 workflow `37840532780`, artifact `11576904856` documented initially smaller final assembly and caption clash. Intermediate failed typecheck workflow runs were only a temporary malformed newline in the editorial patch, fixed before final proof; they are NOT proof success.

## 4. Before/after independent creative review (real decoded frames)

- **0–49 hero:** POLISH03 kept a slim, small diagonal object in a large portrait void. POLISH04 retains all three true mesh fans and shows a much bolder raked 3/4 product with legible individual blade specular highlights and a stronger editorial hook. Some negative space is physically unavoidable for full horizontal GPU.
- **90–159 macro:** POLISH03 never truly pushes into cooling detail. POLISH04 frame 100 fills a majority of screen width with a photogenic, physically modeled rotor; no fake cutout, blade shape easy to read on a phone. Native moving sequence frames 101–108 shows a controlled pan as fans move out.
- **160–279 cooler / thermal:** POLISH04 moves visibly closer to fin stacks and front shroud, with stronger component depth/parallax. Individual real fin strips and several visible board regions are clearer than in the old held mid-wide angle; however certain heatpipes/cold plate remain occluded by A geometry plus C transforms.
- **280–329 PCB/detail:** Final B camera angle restores an oblique view of vertical green PCB, populated VRM area and package region at full-resolution frame 310, with stage typography now safely in upper negative space instead of crossing visible components. **GPU DIE IS STILL PARTLY MASKED BY FIN STACK/COOLER** in current POLISH03 test motion, so do not claim visually complete naked processor close-up.
- **330–449 exploded final:** POLISH04 uses perspective side-depth, mesh-tight fit and purposeful optical downshift. At real frame 449 front rotors, shroud, fins, PCB and backing are distinguishable, product is larger in frame, graphite remains neutral, final headline does not overlap hardware. Yet the rear plate still looks like a relatively plain broad slab. Genuine movement validated across end clips; no slide-change or unexplained visibility toggles.
- **Palette/material:** Previous pale/flat highlights are restrained, black plastics not washed to white, fans visibly glossy with edge definition. Thin thin fins remain bright metallic; background correctly graphite, not purple/magenta.

**B creative conclusion:** This is an observable meaningful camera/editorial improvement over the user-reviewed POLISH03 film, and a valid source handoff to D. **Not a 10/10/OEM-CAD claim**. Native B proof does not certify final A/C motion dynamics, final audio, final mux, entire 450-frame temporal integrity or final MP4. D must run its final independent gates.

## 5. Exact remaining A/C/D concerns and remedy

1. **Processor isolation — D / C priority:** At native frame 310 the real silicon core remains partly hidden behind the pale heatsink upper lip/fins, despite PCB/VRM being clearly exposed. Agent C should make the HEATSINK/COLD_PLATE clearance physically obvious via additive motion on the final A model and verify real mesh swept collision, OR D may adjust the internal shot target after seeing final A/C. B must not edit the JSON or hide hardware artificially. Agent A should preserve recognizable exposed die/VRAM/VRM reflectance so a true close-up reads as electronics rather than rectangles.
2. **Final depth — D/C/A:** Make sure final separated backplate and PCB silhouette shows genuine foreground/midground/rear depth rather than two flat slabs. This is partly mechanical axial spacing and partly material roughness/reflections, not B's camera alone.
3. **Model-dependent optical fit — D:** Confirm full card and extreme new motion in all final stills; no critical components clipped at 0/30/60 and 365/415/449. If final C exploded travel is larger, B automatically refits all geometry but macro composition may reveal new occlusions.
4. **Native pixel & phone-scale signoff — D mandatory:** Rerender the exact final A/C GLB+JSON under manager source. Inspect 12 shots and real moving clips; compare baseline artifact `11576047638` and B proof `11577758531`. If PCB die still hidden at 310, correct A/C geometry/motion rather than asserting signoff.

**Final release remains Agent D's responsibility**: exact 450 frames at 30fps, H264 yuv420p + AAC 48kHz, 1080×1920, no magenta regression, correct audio level and independent QA.
