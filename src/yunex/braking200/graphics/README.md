# Braking 200 EP001 — A5 Motion Graphics

Owner: Agent 5 only. This directory provides deterministic camera-pinned graphics for the existing 3D grand-tourer on the track. No car/physics/camera/lookdev source is changed.

## Integrate with the actual film

Import `BrakingGraphics` from `./graphics/index.ts` and mount it OUTSIDE `<ThreeCanvas>` over the cinematic car. Supply Agent 2's authoritative `BrakingSimulationState` sampled at exactly the scene's simulated timestamp, Agent 3's actual `CinematicCameraPose` and a world-space rotor/contact-patch focus anchor. Use `wheelAnchors(vehicleSpec('grand-tourer'))` and rotate/translate with the kit vehicle pose. `wheelKey` selects which wheel state drives cue opacity; the camera and world position control the projected callout.

```tsx
<BrakingGraphics state={simulation} frame={frame} cue={shot.cue}
  cueFrame={shot.localFrame} cameraPose={camera}
  focusWorld={discOrContactPointInWorld} travelDirectionWorld={forwardWorld}
  wheelKey="front-left" heatReferenceJ={authoritativeEnergyReference}/>
```

The current speed typography derives only from `speedMps × 3.6`, and never from frame-based fake numbers. Thermal cues show a proportional **illustrative energy budget**, NOT a rotor temperature. Road-contact direction points opposite supplied travel direction; strength is derived from tyre-road force and normal load. ABS typography is completely hidden unless `wheel.absIntervening` is true; it does not assert ABS engages on every stop. The pressure graphic reflects `wheel.brakePressure01`. No fake stopping-distance statistic appears. A4 can customize the restrained palette using `palette`. If a projected anchor is off camera, no pointer is painted.

`cue` and `cueFrame` let Agent 6 retime graphics to picture and VO, and omit both to use provisional shared cues. `showPin={false}` permits unannotated hero shots. There are no frame clocks, `useFrame` loops or random values in production code.

## Two independent *native Remotion* proof definitions

The full-scale compositions are 1080×1920, 30 fps, 150 frames each (5 seconds). `BrakingGraphicsMacroProof` shows wheel-close mechanism, heat, tyre-road contact and illustrative ABS. `BrakingGraphicsTrackProof` shows a moving kit grand-tourer on the **real kit track**, with the speed hook in the opening second and world-pinned callouts. Only these proof compositions import `proof-state.ts`, a clearly marked temporary deterministic fixture: the film must instead import A2's actual sampler.

To execute on a renderer with the repo checked out:

```bash
npm ci
npm run check
node --experimental-strip-types --test src/yunex/braking200/graphics/logic.test.mjs
mkdir -p out/braking-a5
npx remotion render src/yunex/braking200/graphics/entry.tsx BrakingGraphicsMacroProof out/braking-a5/macro.mp4 --frames=0-149 --gl=swangle --scale=0.5 --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render src/yunex/braking200/graphics/entry.tsx BrakingGraphicsTrackProof out/braking-a5/track.mp4 --frames=0-149 --gl=swangle --scale=0.5 --codec=h264 --pixel-format=yuv420p --concurrency=1
for f in out/braking-a5/macro.mp4 out/braking-a5/track.mp4; do
  ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,r_frame_rate -of json "$f"
  ffmpeg -v error -xerror -i "$f" -f null -
done
npx remotion still src/yunex/braking200/graphics/entry.tsx BrakingGraphicsMacroProof out/braking-a5/macro-12.png --frame=12 --gl=swangle --scale=.5
npx remotion still src/yunex/braking200/graphics/entry.tsx BrakingGraphicsMacroProof out/braking-a5/macro-90.png --frame=90 --gl=swangle --scale=.5
npx remotion still src/yunex/braking200/graphics/entry.tsx BrakingGraphicsTrackProof out/braking-a5/track-125.png --frame=125 --gl=swangle --scale=.5
```

Before claiming delivery: independently watch both whole MP4s, confirm at least three truly distinct decoded frames plus a phone-frame sample, record actual FFprobe and full FFmpeg decode, attach proof artifacts and exact commit/run SHA to Issue #151. Merely committing source or passing generic PR visual smoke does **not** satisfy these native-proof gates.
