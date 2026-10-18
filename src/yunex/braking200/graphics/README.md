# A5 | YUNEX braking — cinematic graphics refinement

## Product interface
`BrakingGraphics` remains a frame-seekable external Remotion SVG layer. It has **no vehicle/physics material generation**, is not mounted inside ThreeCanvas, and receives the **same A2 BrakingSimulationState** used by all peers. Import from `graphics/index.ts`.

```tsx
<BrakingGraphics state={simulation} cue={shot.cue} cueFrame={shot.localFrame}
 cameraPose={camera} focusWorld={brakeOrTyreWorldAnchor}
 travelDirectionWorld={forwardWorld} wheelKey="front-left"
 heatReferenceJ={brakeEnergyVisualReferenceJ}
 lowGripExample={isLabelledLowGripDemo} palette={a4Palette}/>
```

- `hook`: oversized opening velocity, strictly `speedMps × 3.6`. At time zero, **200 KM/H** is visible immediately.
- `mechanism`: paired small hydraulic action strokes, projected to physical rotor/caliper; their opacity comes from A2 brake pressure, not invented displacement.
- `heat`: understated rotor-sized concentric amber sweeps and bloom driven only by A2 brake thermal-energy budget. `heatReferenceJ` is a user-defined **visual scale**, not temperature. A1 independently renders the subtle rotor heat in actual 3D.
- `grip`: contact-patch ellipse, a single short opposing longitudinal force cue driven by A2 `roadLongitudinalForceN / normalLoadN`, and front normal-load stroke. No nonphysical stopping distance claims.
- `abs`: only if **both** `lowGripExample` AND A2's wheel `absIntervening` are true, including small pressure strokes driven by sampled `brakePressure01`. Dry road absolutely does NOT automatically show ABS. A clearly labelled low-grip teaching insert is mandatory in final film.

Projected anchor dimensions use A3 camera FOV/depth; callouts disappear if the anchor is outside camera frustum. Portrait graphics never require generic HUD plates. A4 palette is configurable and defaults to blue/ivory/amber film accents.

## Integrated native proofs: peer source, not placeholders

The native compositions still have IDs `BrakingGraphicsMacroProof` and `BrakingGraphicsTrackProof` under `graphics/entry.tsx` (1080×1920 / 30fps / 150 frames each). **Both now use actual branch components**:

- A1 `engineering/BrakingVehicle.tsx` with **actual drilled rotor, moving pads/pistons and cutaway**.
- A2 `physics/simulation.ts` using authoritative `sampleBrakingSimulation`. Explicit dry-track film-time mapping, with a **separately labelled** low-grip ABS scene that uses A2's own film-time map.
- A3 `cameras/cameraRig.ts` with the real `sampleCameraPose` / camera cues. A5's portrait lens-compression factor adjusts framing only; camera target and shot identity still derive from A3. Shared route and world-space wheel anchors preserve pin alignment.
- A4's established slate-blue / ivory / amber palette is explicitly matched. The isolated proof uses the original kit daylight, because the current unmerged A4 material branch contains an independent TypeScript narrowing error; A6 can inject A4's scene-lighting interface after that is repaired. A5 creates **no duplicate vehicle**.

The repo's peer branches are unmerged, so these proof-only imports are deliberately marked as hydrated dependencies. The proof GitHub Action performs **temporary, read-only A1–A3 Git branch fetch/archive into the runner checkout**. It records full upstream source SHAs in `PEER_SOURCE_SHAS.txt` for reproducibility. **No peer-owned source files are committed to A5.** Until G3 multi-agent merge, users of `graphics/entry.tsx` locally must hydrate peer folders in their clone.

The old `proof-state.ts` remains clearly synthetic legacy reference **but is not imported by either final proof**. A5's production component also never imports it.

## Exact render and verification

GitHub workflow: `.github/workflows/yunex-braking-a5-graphics-proof.yml`. It hydrates peer source then runs:

```sh
bash src/yunex/braking200/graphics/render-and-verify.sh
```

Outputs under `out/braking-a5/`: `macro.mp4`, `track.mp4`, FFprobe JSON and per-frame MD5 for each, true Remotion stills, GitHub source SHA plus A1–A3 peer SHAs. The script asserts H264, 540×960 (proof `--scale=.5`), 30fps, 150 frames, **all decoded frames** and minimum 3 distinct frames. It also runs `npm run check` and targeted tests. Native stills and meaningful phone-size visual inspection are **separate** from technical QA.

Manager review still owns G3 approval and Agent 6 film integration. These are two short department motion proofs, not the final film.
