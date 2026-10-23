# YUNEX V4 on main — production-agent quickstart

This is the **automotive modelling studio**, separate from the S25 phone-footage importer. Start on `main` after its integration PR is merged. The accepted teal V4 supercar is an opt-in studio architecture; do not alter its silhouette, roof, paint or 112 mm exhaust outlet without explicit visual approval.

## First successful scene from a fresh checkout

Use Node 24, npm, and a Linux host with the repository's Remotion/Chrome media dependencies.

```bash
git switch main && git pull --ff-only
npm ci
npm run check
npm run kit:catalog
npm run kit:create -- new-agent-first-film braking
npm run kit:validate -- new-agent-first-film
npm run kit:preview -- new-agent-first-film
npm run kit:render -- new-agent-first-film
```

Watch `out/studio/new-agent-first-film.mp4` at actual playback speed. Do not call it professional-quality merely because it renders. Edit only `src/yunex/studio-projects/new-agent-first-film/recipe.json` to select a vehicle, environment, camera, motion and captions, then re-validate/re-render. Fresh names are mandatory because creation refuses to overwrite existing projects. Starter output is silent unless source audio is expressly provided.

For the **approved V4 teal supercar**, keep the inherited source immutable during renders and use the source-owned proof pipeline:

```bash
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs create supercar
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs plan supercar
npm run kit:inspect -- v4-a-supercar
node --experimental-strip-types scripts/modelling-kit/v4-native.mjs --kind=supercar --inspect --render
```

The supercar proof is a 14-second silent editable portrait render. Rally and mechanical film are `--kind=rally` (10 seconds) and `--kind=film` (22 seconds). Unique source hashes, native frame ranges and genuine movement are required. Never reuse outdated image or MP4 proof after source changes.

## When to choose which studio API

- **Ordinary editor:** use the `kit:create` recipe path, existing camera presets and regular `kit:render`.
- **3D vehicle specialist:** `src/yunex/modelling-kit/index.ts` exports the V4 body/rig/coachwork API. Prefer reusable named attachments and exact transforms; no episode-specific hacks.
- **Mechanical explanation:** use the fitted assemblies, genuine attachment mounts and scripted illustrative flow. They are *not* CFD or crash-calibrated simulations.
- **Cinematographer:** use authored camera movement and `auditCameraClearance` to catch gross clipping; inspect first/middle/last frames and moving full shots, including portrait-safe margins.
- **QA specialist:** run `npm run check`, Node and Python tests, produce H.264 native media, FFprobe, full FFmpeg decode, frame changes and SHA256, then manually review moving footage. Explicitly report procedural appearance, frame-darkness, clipping or glass issues.

## Verification and integration boundary

The native V4 development-source proof is documented in `docs/YUNEX_V4_OVERHAUL_HANDOFF.md` and `docs/YUNEX_V4_AGENT_GUIDE.md`. It includes 14/10/22-second silent proofs and records unresolved visual weaknesses. Those artifacts validate a **development branch**, not an updated `main`. The clean integration branch adds its world, parts, modelling, scripts, docs, tests and separate CI without EP003/EP004/EP005 production trees. The `main`-branch `src/Root.tsx` compositions remain intact.

This studio is still a stylized/procedural toolkit, not a manufacturer-CAD renderer. Read `docs/YUNEX_V4_EXHAUST_COMPATIBILITY.md` before adapting effects to EP005.
