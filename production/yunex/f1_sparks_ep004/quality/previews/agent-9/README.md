# Agent 9 — real-contact spark-look preview handoff (working)

## Source contract
- Renderer: `../../sparks/QualityContactSparks.tsx`
- Props: `QualityContactSparks({particles, contacts, shutterSec?, maxParticles?, enableContactLights?})`
- Input MUST be `sampleContactDrivenSparks(sourceSec,motion,getSkidDescriptors())` from approved A2/A1; output never invents births. Provenance retains original particle ID/3D world position.
- A dry positive-gap segment has no new glow. Previously emitted ballistic glints may persist for their genuine Agent2 lifetime.
- No use of kit's `contact-sparks` emitter, spark presets or independent plume loop. In the *previews* the V2 model's emitter and non-authoritative generic metal-skid meshes are masked after each kit animation call.

## Real modelling kit V2 dependency
The cinematic 8s review renders `createCinematicVehicle({variant:'formula-modern',quality:'hero'})` from existing V2 directly, with kit emitters masked. The 5s scientific contact-macro uses the existing exact A1 fitted skid meshes to keep silver titanium vs tan non-metal composite observable. This dual presentation is **provisional until Agent 8's new `QualityF1Vehicle` replaces the preview-only V2 adapter and physically aligns its own metal skids**. Do not mistake this preview for complete Agent8 geometry acceptance.

## Run
```bash
npm ci
npm run check
npx tsc -p production/yunex/f1_sparks_ep004/quality/previews/agent-9/tsconfig.json
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/quality/tests/agent-9/*.test.mjs
node production/yunex/f1_sparks_ep004/quality/previews/agent-9/render-native.mjs
```
Actual native outputs are at `out/ep004-quality-agent9/`: `contact-macro.mp4` (150f) and `kit-v2-race-pass.mp4` (240f), H.264 1080×1920 30fps. Their QA reports require full decoding, 0/middle/last screenshots, FFprobe frame count and distinct 5fps frame hashes. Upload *both* files and the QA reports as an Actions artifact or Release asset.

## Before/after creative check
Older reference is Agent6 silent V4 PR #223 and source `editor/CinematicSparkGlints.tsx`, `PreviewScene.tsx`; [Actions render #39620074977](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39620074977). Compare equal physics source seconds and camera/shot when possible: hook car readability at t=0 and 0.8s, source position relative to real metal skid, contrast and streak path; verify dry intervals lack newborn fire. A passing ffmpeg script does not substitute for manual visual A/B review.

## Restrictions
No modifications to accepted A1–A5, EP003, `main`, kit PR #233, original editor PR #223. Leave PR unmerged. No final VO claim. Independent real contact physics is illustrative, not genuine F1 telemetry.
