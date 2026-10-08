# GPU POLISH 03 — Agent C independent final A+B integration audit

**Status at publication:** Integrated source and immutable model inputs **verified**; C native still and moving proof running. No final render approval yet.

**Repository only:** `YunRah2103/Remotion-gpt-chat`; manager branch `gpu-polish3/c-master`.

## Exact model and cinema source locks

- Agent A final successful hardware source: `e5e274437a47b554af7940911e5a825397dc64f3`.
- Agent A build: `37833031666`, artifact `GPU-POLISH3-A-XFX-HARDWARE`, numeric ID `11574168580`. Its workflow job succeeded.
- Independently downloaded entire ~17MB compressed artifact and examined actual `xfx_swift_rx9060xt_polish3.glb`, `decomposition.json` and manifest.
- Verified byte SHA256 new GLB: `21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5`, 3,157,740 bytes.
- Verified motion JSON SHA256: `d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b`.
- GLB parsed as valid glTF2: **798 nodes, 779 meshes, 36 materials**, all 19 required named anchors exactly once, frames 450/30, fan +Z 0.93/1.03/0.93 and shroud +Z 0.31. At final, fan forward delta exceeds shroud by 0.62 scene units minimum; 3D visual review still needed.
- Actual A `pcb_silicon_detail.png` and `exploded_film_camera.png` inspected. PCB has physically modelled VRM/GDDR6/GPU contact and a clear exploded geometry hierarchy. The original final shroud is still schematic, not factory CAD.
- Agent B frozen final source: `0eed29a86067bccd74c5d6e44eb116d2bcd4d95c`; later handoff-only commits preserve its source.
- C selectively integrated B-only `src/GpuDecomposition.tsx`, `src/gpu-polish3/GpuDecompositionPolish3.tsx`, `src/gpu-polish3/cinema.ts` and B implementation document while preserving baseline compositions and original release workflows.
- Runtime requires `public/gpu-decompose/xfx_swift_rx9060xt_polish3.glb` and versioned new `decomposition.json` via exact checked A artifact. The manager CI stages these; no silent historical asset reuse.
- Hash locks in `gpu-decompose/polish3/manager/RELEASE_LOCK.json`: 
    - scene `30c33c9bb1d22e16d616b38afca8b181e5825fb66273cb4ea5f969b9f0c78879`;
    - camera `4abe9c566d93df88d93a07a9d9b1ffca9117af82c5844e8382c9b61ee07931fa`;
    - wrapper `546205e5b950fcb42f1d820408cceefa2107e053ed271d86103fd3364614bd69`.
- A newer final A GLB is used instead of older A artifact `11573477646`, on which B previous real native screenshot QA was based.

## GitHub manager proof

- New C integrated native proof workflow run **37835428895** started from source `c5a68ffec0786299a7cabcd795d8ac7e79f3dd14`.
- `verified-input` job **SUCCESS**, model source/run/ID validated against GitHub Actions API; new GLB and motion SHA256, GLB hierarchy, fan/shroud endpoint motion, and B source hashes all passed.
- `GPU-POLISH3-C-HASHED-ASSETS` actual artifact ID `11575137571` staged as the sole native proof input.
- `native-proofs` job runs nine requested 1080×1920 stills and moving native clips at 105–115,138–148,240–252,385–396. DO NOT claim PASS until completed and inspected.

## Color mux testing (separate dry-run evidence)

Old source final released film artifact `11570565750` was magenta due old postprocess chain; old original native video was charcoal. C ran a fresh entire 450-frame FFmpeg dry-run using all five original native chunks and clean AAC, achieving RGB corner original (21,23,29) vs corrected (20,23,30), unlike magenta old final (111,0,140). Tested H264 yuv420p 1080×1920/30, AAC 48 kHz and successful full decode. The independent C release workflow omits the suspect `gbrp` screen-blend and requires native-to-mux pixel integrity.

## Remaining

Independent **new A** moving Remotion proof review, creative approval and only then final 450-frame GitHub release and complete MP4 QA. No final video artifact exists at this audit checkpoint; no final release SHA is claimed.

**Manufacturer accuracy disclosure:** exterior identity/dimensions are reference-grounded; unseen PCB, die, VRAM, heatpipe and fan internals remain illustrative.
