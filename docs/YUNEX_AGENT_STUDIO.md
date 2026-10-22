# Make a complete YUNEX automotive video

From the repository root, with dependencies installed:

```sh
npm run kit:catalog
npm run kit:create -- braking-explained braking
npm run kit:validate -- braking-explained
npm run kit:render -- braking-explained
```

The finished native 1080×1920 / 30 fps MP4 is `out/studio/braking-explained.mp4`. To preview interactively: `npx remotion studio src/yunex/studio-projects/braking-explained/entry.tsx`.

## The only production file to edit

`src/yunex/studio-projects/braking-explained/recipe.json` selects the car, environment, driver, ordered shots, cameras, actions, captions and supplied audio. The generated entry calculates its duration from your recipe. There is no separate timeline to keep in sync. Existing project folders cannot be overwritten by the scaffolder.

Four complete 18 second starters ship: `braking`, `powertrain`, `f1-downforce` and `rain-drive`. Each has six camera shots; choose a mechanical explanation, racing sequence or night drive. Copy and adapt these for longer original episodes. These are illustrative explanations, not calibrated vehicle dynamics simulations.

| Field | Values / meaning |
|---|---|
| vehicle.variant | Any of the 35 exact catalogue IDs |
| vehicle.driver | Optional articulated driver; unsupported for motorcycles |
| world.kind | Any of the 20 exact catalogue IDs |
| world.timeOfDay | day, dusk, night |
| world.wetness | 0–1; rain enabled above 0.4 |
| shot.duration | Seconds; rounded once to 30 fps frames |
| shot.camera | tracking, chase, wheel, interior, onboard, overhead, reveal |
| shot.action | cruise, acceleration, braking, cornering |
| shot.part | Optional catalogue part ID; replaces the car with an isolated animated component |
| shot.cutaway / exploded | 0–1; assembled vehicle inspection |
| shot.highlight | engine, underfloor, wheels |
| shot.caption | Short phone-readable explanation; keep to two lines |
| captions | Optional absolute start/end seconds and text; ordered without overlaps |
| audio.narration / music | Existing files beneath public/, e.g. audio/my-narration.mp3 |
| audio.musicVolume | 0–1; defaults to 0.15 |

Distance is continuous across shot boundaries; all motion uses absolute frame samples. Cuts are intentional hard cuts. Garage/showroom/parking car shots are parked; engine parts still animate. For road sequences, the wheels steer along the actual route tangent. Part shots fit the camera to real component bounds.

## Agent production checklist

1. Choose a topic and write accurate narration; use the catalogue to select compatible assets.
2. Create a unique project slug. Edit the recipe instead of rebuilding scene factories.
3. Add any narration/music you have rights to use under public/audio and reference relative paths. Starters are silent until audio is supplied.
4. Validate, render, then watch the complete MP4. Inspect every camera cut, driver grip, wheel clearance, caption and mechanical connection. Validation catches metadata problems; it cannot approve visual quality.
5. Handoff the recipe, source entry, audio sources and MP4 together. State limitations. Never modify EP003 or EP004 to make a new episode.

Use low-level factories from `src/yunex/modelling-kit/index.ts` for bespoke effects. Existing general driving, collision, cutaway, airflow and tyre failure systems remain available. The recipe director currently exposes the common driving/mechanical subset; it is not a collision or airflow scripting language.
