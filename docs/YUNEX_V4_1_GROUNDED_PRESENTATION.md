# YUNEX V4.1 — opt-in grounded cinematic presentation

This upgrade intentionally preserves the owner's approved V4 teal supercar and **does not alter** any existing vehicle geometry, meshes, wheel mounts, exhaust, paint defaults, animation or old recipes. Normal rendering is byte-for-byte source-compatible in the original code path. No EP003–EP005 files were changed.

## Use the optional look

A matched native inspection orbit accepts `look:"grounded"`. The original mode is the default:

```bash
npm ci
npx remotion render src/yunex/modelling-kit/studio-quality-entry.tsx StudioModelPortrait out/reference-original.mp4 --frames=0-29 --props='{"variant":"supercar","bodyDetail":"studio","timeOfDay":"day","look":"original"}' --gl=swangle --codec=h264 --pixel-format=yuv420p
npx remotion render src/yunex/modelling-kit/studio-quality-entry.tsx StudioModelPortrait out/reference-grounded.mp4 --frames=0-29 --props='{"variant":"supercar","bodyDetail":"studio","timeOfDay":"day","look":"grounded"}' --gl=swangle --codec=h264 --pixel-format=yuv420p
```

Enhanced view changes **only** the presentation: adds fitted transparent tyre-contact gradients, a subtle underbody shadow, a low-glare neutral floor while retaining the original full-car camera distance. Same car geometry, exact same orbit and reference key lights. Do not assume this is a real ray-traced ambient occlusion simulation. Compare actual decoded frames for clipping, bloom/contrast and contact accuracy before adopting.

## Use in production recipes

For **flat** studio/showroom/track/garage/parking scenes, opt in with `world:{kind:'track',grounding:'enhanced'}`. `compileRecipe` rejects non-flat/rough roads: wheel decals cannot honestly follow complex changing rally terrain. Use `createGroundContactShadows(vehicle)` and `updateGroundContactShadows(group,vehicle,groundHeight)` directly for advanced scenes with known ground height; always update after pose/rig animation. Geometry remains independent of the vehicle and never modifies its materials or body.

The optional contact meshes have bounded opacity, disable shadow casting and depth writes, and are safe for Remotion's out-of-order frames. Each mesh uses a small plane and shared shader: approximately five extra transparent planes per four-wheeled car. This is visually helpful ground separation, not calibrated tyre deformation or road reflection.

## Safety criteria

Keep the original reference as the production default. Never roll the new look onto all 36 variants silently. Review original and grounded MP4s side by side and only recommend grounded when it reads better on a phone; if the contact gradient is distracting, use the original setting. Validate frame count/H264 decode and run regression tests before merging.

## Visual rejection and correction

The first A/B render at commit `06af233` visibly pushed the front bumper towards the portrait right edge and produced an overly bright floor highlight. **Those changes were rejected.** The corrected option restores the exact original camera radius and uses a matte, neutral floor instead of a clearcoated reflection panel. Future agents must not revive the tighter radius or floor glare without frame-sequence evidence and owner approval. This is why the enhanced mode remains explicitly opt-in.
