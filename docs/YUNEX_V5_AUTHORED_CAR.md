# Optional authored Car Concept

This is a separate opt-in asset. The approved V4 teal supercar, coupe, rally car, all 36 catalogue variants and their rigs remain unchanged.

The official Khronos glTF sample **Car Concept** supplies a cohesive authored body, detailed interior, curved glass, tyres/brakes and original layered automotive materials. Model/textures: Eric Chadwick, Darmstadt Graphics Group GmbH, 2024; CC BY 4.0. The original GLB is byte-preserved and its copyright/provenance is retained under `public/yunex-v5/concept-car/`. Include that attribution in distributed work (the proof includes a restrained bottom credit). Khronos/3D Commerce marks belong to their owners; no endorsement is implied.

```sh
npx remotion render src/yunex/studio-v5/ConceptProof.tsx V5-AuthoredConceptCar out/v5/authored-city.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --color-space=bt709 --crf=18 --concurrency=2
```

The source-owned proof uses the V5 night-city road and lights, 240 frames at 1080×1920 / 30fps. No paid services or external render-time downloads are required. The GLB is bundled; there is no Draco/KTX decoding dependency.

`loadConceptVehicle(staticFile('yunex-v5/concept-car/CarConcept.glb'))` returns the optional rig. `prepareConceptVehicle(loadedScene)` preserves source geometry/materials/names, normalizes +X-forward coordinates, straightens the originally posed front wheels and installs deterministic rolling/steering groups. Brake-pad nodes are attached to stationary steering mounts. `animateImportedVehicle(car,distance,steering)` uses absolute metre/radian values. The adapter is specific to this source model; do not guess these axes or node names on other imports.

Loading uses the scoped Remotion `useDelayRender` API and a frame-advance barrier inside the R3F canvas. The model must have committed to the canvas before the load handle is released; a screenshot containing only a floor is a failed proof even if the renderer exits successfully.

This is not a calibrated vehicle simulator or a newly authored YUNEX manufacturing model. Suspension/mechanical rigs from the procedural cars are not silently substituted into this imported asset. The current proof deliberately uses a flat paved city route. The paint's source metallic-flake normal map is retained; it can appear sparkly at close view and should be reviewed before final episode use.

The proof explicitly limits active world point lamps to the four nearest source lights, leaving their physical positions and visible luminaires intact. `limitStudioLights(world, focus, budget)` is deterministic and opt-in; `restoreStudioLights(world)` restores original visibility. This reduces shader work on software rendering without touching any legacy lighting or removing scenery.
