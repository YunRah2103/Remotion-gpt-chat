# YUNEX EP004 — Agent 4 native preview / evidence handoff

**Status:** SOURCE IMPLEMENTED, TYPE CHECK PASSED, NATIVE PREVIEW RENDER **NOT YET EXECUTED**. No MP4 URL or native-render proof should be claimed until both renders finish and their artifacts are independently inspected. Agent 0 controls review/approval.

## Source and compositions

- Branch: agent/ep004-04-look, PR #227 into production/yunex-ep004-base.
- Night stage: production/yunex/f1_sparks_ep004/look/NightCircuitWorld.tsx
- Contact-exact road: production/yunex/f1_sparks_ep004/look/road.ts
- Preview entry: production/yunex/f1_sparks_ep004/look/preview-entry.tsx
- A: EP004Agent4Trackside, 150 frames @ 30fps (5.00s); continuous moving trackside pass.
- B: EP004Agent4RaceFollow, 210 frames @ 30fps (7.00s); low car-follow with night lights.
- Both target native 1080x1920, H.264 yuv420p.

After npm ci and npm run check, run from repository root:

~~~bash
node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-4/*.test.mjs
node production/yunex/f1_sparks_ep004/look/render-native.mjs
~~~

Equivalent direct native render commands:

~~~bash
npx remotion render production/yunex/f1_sparks_ep004/look/preview-entry.tsx EP004Agent4Trackside production/yunex/f1_sparks_ep004/previews/agent-4/ep004-agent4-trackside-1080x1920.mp4 --frames=0-149 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render production/yunex/f1_sparks_ep004/look/preview-entry.tsx EP004Agent4RaceFollow production/yunex/f1_sparks_ep004/previews/agent-4/ep004-agent4-race-follow-1080x1920.mp4 --frames=0-209 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
~~~

The render script requires real encoded Remotion frames and produces native-proof.json with ffprobe resolution/fps/decoded-frame count, H.264 pixel format, complete FFmpeg decode, distinct frame hashes over the whole sequence, SHA-256 and representative first/centre/end PNGs. Stills are never substituted for moving MP4 evidence.

## Integration requirements

- Agent 0 integrates Agent 1's approved shared F1 car. Agent 2 supplies actual authoritative motion and SparkParticle[]; Agent 4 does not duplicate underfloor parts or artificially emit sparks. Spark-responsive near-field light comes exclusively from supplied actual particles.
- The preview uses the original factory formula-modern car as a **provisional reference**, not a replacement for Agent 1's final geometry. B cannot be final-contact signed off until Agent 2 supplies real particle data.
- Visible road geometry samples shared sampleTrackSurface(distanceM), with exact centreline height and slope at any sampled distance. The old flat asphalt/kerbs/markings are hidden; the original factory buildings, runoff, fences, barriers, grandstand and greenery remain.
- Agent 4 may not edit Agent 0's EP004 workflow or exclusive manager entry.tsx. Current workflow_dispatch native job **requires manager entry.tsx** and cannot target this independently registered Agent 4 preview entry. Manager action: enable/trigger a native agent-preview workflow with this entry, run both compositions, upload downloadable Actions artifacts and provide proof URLs.
- Keep PR #227 in **DRAFT / WORKING** until both MP4s exist, are actually watched and pass ffprobe/complete decode. Do not mark PREVIEW READY or APPROVED on code-only CI results.

## Visual review criteria

Inspect a completely visible F1 car in portrait, true forward motion, stable asphalt grain, shared bump directly beneath wheels, no road z-fighting, rich graphite/teal paint with controlled warm/cool reflectance, legible red-and-ivory curbs and consistent floodlights. At final contact integration, verify light tracks actual skid-generated particles, not arbitrary overlay.
