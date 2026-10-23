# Author a driving preview with JSON

Choose `mountain-pass.json`, `night-circuit.json`, `night-city.json`, or `forest-rally.json`. `custom-high-pass.json` demonstrates an elevated, curved route authored entirely as control points. These are working configuration examples, not claims that every custom configuration is visually approved.

Run from the repository root with the repository's Node version:

```sh
node --experimental-strip-types scripts/studio-v5/studio.mjs validate my-city examples/yunex-v5/night-city.json
node --experimental-strip-types scripts/studio-v5/studio.mjs audit my-city examples/yunex-v5/night-city.json
node --experimental-strip-types scripts/studio-v5/studio.mjs render my-city examples/yunex-v5/night-city.json
```

The output is `out/v5/my-city.mp4`, eight seconds at 1080×1920 / 30fps. Rendering requires the documented native media/browser dependencies; validation and the sparse audit run without a browser. The audit can flag opaque obstructions but cannot certify moving-video quality. It reports five sparse frame samples and conservatively treats foliage planes as solid.

Edit `config.road.points` for the visible road and vehicle route together. Change `config.scenery` to remove authored scenery, `vegetation` to adjust density, `surface`/`weather` for road treatment, and `timeOfDay` for the matching lighting. Change `camera` for framing. `quality:preview` reduces procedural scenery density; switch to `hero` for final review. Weather `wet` changes the surface treatment; it does not generate rainfall.

`driving-shot.schema.json` describes the structured input for editor/agent tooling. Runtime validation also checks finite values, distinct adjacent road points and the 12m minimum proof route length. No natural-language scene parser is implemented. The approved V4 supercar remains the mountain/circuit default; the authored Car Concept uses its separate opt-in proof and required attribution.
