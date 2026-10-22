# EP005 Agent 6 — Quality layer, no merge

This folder is an additive quality and motion review layer over **Agent 1's V3 hero**. Agent 6 intentionally branched from Agent 1 head `5796290555e7f4a8b5ec0ccd6d5563bf5a4657f6` and imports `../vehicle/hero.ts`. The draft PR to EP005 production base therefore **includes inherited A1 changes** as a dependency. Manager must approve Agent 1 independently and must NOT integrate A6 as a replacement for A1, A2, A3 or A4. No files in Agent 1's vehicle folder are changed by A6.

## Core exports
- `applyEp005HeroPolish(hero)` adds subtle optical lines, vents, wheels/brakes and diffuser detail under existing parts; call **once** after `createEp005Hero()`. Idempotent and never touches `mount:exhaust-tip-left/right`.
- `animatePlantedHero(hero, sample, routeSampler, extras)` replaces the native per-frame `animateCinematicVehicle` call (do **not** run both). Uses exactly the existing V3 wheel spin/steering and absolute 30fps route sampling; body pitch/roll and spring compression are bounded. It places the vehicle on the route before flame port resolution. `extras` forwards cutaway and other V3 animated state.
- `polishFollowCamera(base, sample, routeSampler)` is a modest deterministic aim offset; preserve Agent 3's shot-boundaries, lenses and on-screen safety.
- `motionFromCinema(sample)` consumes Agent 3's structural `CinemaSample`, so A3 remains source of truth for time, route, cameras and afterfire windows.

## Integration sample (for manager **after approval**)
```ts
const hero = applyEp005HeroPolish(createEp005Hero());
const sample = sampleCinema(frame, 30, sampleEP005Route);
animatePlantedHero(hero, motionFromCinema(sample), sampleEP005Route, {cutaway, highlight});
const camera = polishFollowCamera(sample.camera, motionFromCinema(sample), sampleEP005Route);
const ports = resolveEp005ExhaustPorts(hero); // AFTER animated pose and world placement
```
`sampleEP005Route` must point to Agent 4's sampler matching Agent 3's `sampleRoute('track',d)`. Mounted Agent 2 flame rigs update **after** `animatePlantedHero`. This kinematic layer is illustration, NOT a calibrated tyre-force/suspension model. Agents 1–4 still own model/source routes/flames/world.

## Reproducible matched comparison
```sh
npm ci
npm run check
node --experimental-strip-types --test production/yunex/supercar_flames_ep005/polish/dynamics.test.mjs
npm run kit:validate -- ep005-a6-polish
npx remotion render src/yunex/studio-projects/ep005-a6-polish/entry.tsx EP005Before out/studio/ep005-a6-before.mp4 --gl=swangle
npx remotion render src/yunex/studio-projects/ep005-a6-polish/entry.tsx EP005After out/studio/ep005-a6-after.mp4 --gl=swangle
```
Both are SILENT 180-frame native portraits on the same exact times and cameras except the intentional camera-follow aim improvement. Neither includes Agent 2 FX or original EP005 voice. Native Actions workflow uploads MP4s, FFprobe JSON, SHA256 files and matched-frame contact sheets. Do not infer visual approval from tests or artifact existence: watch the clips and verify tire-ground contact, body clarity, original outlet fit and relative motion at cuts and finish. No merges.
