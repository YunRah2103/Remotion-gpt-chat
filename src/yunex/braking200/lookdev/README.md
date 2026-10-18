# YUNEX Braking 200 — Agent 4 look-development

Episode-owned native Three.js / Remotion lookdev. Uses unchanged original kit
`grand-tourer` and `track`. No shared kit files or geometry have been edited.

## Integration contract

- Import `BrakingLookdev` from `./BrakingLookdev.tsx` **inside**
  an existing `<ThreeCanvas>`. Its `state?: BrakingSimulationState` takes
  A2's deterministic state and uses **only `state.traveledM`** for distance.
  With no state, `previewDistanceM` is a diagnostic value, **not braking physics**.
- A3 may pass `cameraPose?: CinematicCameraPose` to control framing.
  Omit it when another camera controller owns the camera.
- A1 may import `makeBrakeMaterial('disc'|'pad'|'caliper', h)`
  for **its own** rotor/pad meshes. Pass an illustrative 0..1 heat input
  from its state-derived heat presentation, and dispose the returned material
  with its assembly. Replace heat material by a per-render memo or update
  owned mesh materials without overwriting other agent geometry.
- `heatIllustration01` or `heatByWheel` controls restrained amber practical
  lighting (0 when omitted). These are **illustrative strength controls, not
  Celsius**, and should be mapped to actual A2 thermal energy in integration.
  No state-driven heat timeline is invented here.
- `finishKitCar` and `finishKitCircuit` should only be called on fresh
  `createVehicle` / `createEnvironment` instances. They clone per-role materials
  and dispose obsolete ones. Component unmount disposes mesh geometry,
  materials and deterministic grain instances. The reflection map and renderer
  settings are restored/disposed on canvas teardown. Never call on shared roots.

## Native portrait previews

```bash
npm ci
npm run check
node --experimental-strip-types --test src/yunex/braking200/lookdev/lookdev.test.mjs
npx remotion compositions src/yunex/braking200/lookdev/entry.tsx
npx remotion render src/yunex/braking200/lookdev/entry.tsx BrakingLookdevMacro out/braking-lookdev-macro.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.5 --concurrency=1
npx remotion render src/yunex/braking200/lookdev/entry.tsx BrakingLookdevContext out/braking-lookdev-context.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.5 --concurrency=1
ffprobe -v error -show_streams -show_format out/braking-lookdev-macro.mp4
ffprobe -v error -show_streams -show_format out/braking-lookdev-context.mp4
ffmpeg -v error -xerror -i out/braking-lookdev-macro.mp4 -f null -
ffmpeg -v error -xerror -i out/braking-lookdev-context.mp4 -f null -
```

Use `--scale=1` for a full 1080x1920 QA pass. Review opening/middle/closing
screenshots **and** actual moving files, checking 9:16 wheel clipping,
shadows, reflections, asphalt grain, temporal motion and exposure.

The macro calibration heat pulse is strictly an *artistic material test*.
There is no claim that the 5.8/10.5 m/s diagnostic movement, brake luminosity,
or stop distance comes from A2. These previews do not replace manager review.
