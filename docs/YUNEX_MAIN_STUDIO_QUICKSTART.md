# YUNEX V4 — start on main

For the opt-in V5 fleet (all 36 catalogue IDs), use [V5 fleet guide](YUNEX_V5_FLEET_GUIDE.md) and `createFleetVehicle`. Existing approved V4 projects below are preserved. V5 remains a draft visual upgrade pending moving review; do not describe it as manufacturer CAD or silently migrate approved films.

The automotive studio is installed on **main**. Use this guide before asking an agent to produce a YUNEX film. The previous V4 implementation and reference evidence are retained in [PR #233](https://github.com/YunRah2103/Remotion-gpt-chat/pull/233). This workflow does **not** alter EP003–EP005 source branches.

## First use

```bash
git switch main && git pull --ff-only
npm ci
npm run check
node --experimental-strip-types --test tests/modelling-kit/*.test.mjs tests/world-kit/*.test.mjs tests/parts-kit/*.test.mjs
python3 -m unittest discover -s tests/modelling-kit -p 'test_*.py'
```

Choose the approved-style `supercar`, `rally` or connected mechanical `film` project. Each command refuses to overwrite an existing proof. For a new episode, use `createV4Production({kind, id, ...})` and a unique project ID, not a modification to an approved benchmark.

```bash
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs create supercar
node --experimental-strip-types scripts/modelling-kit/v4-proof.mjs plan supercar
npm run kit:validate -- v4-a-supercar
npm run kit:inspect -- v4-a-supercar
npm run kit:review -- v4-a-supercar --dry-run
```

Edit the generated `src/yunex/studio-projects/v4-a-supercar/recipe.json` deliberately. The original teal reference uses `variant:'supercar'`, `bodyDetail:'studio'`, `color:'#18636b'`. Preserve its body silhouette and named `exhaust-outlet-left/right` transforms; do not add ornamental geometry or independently resize the exhaust.

## Native, moving 1080×1920 proof

```bash
bash scripts/modelling-kit/install-native-media.sh
node --experimental-strip-types scripts/modelling-kit/v4-native.mjs --kind=supercar --inspect --render
ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate -of json out/studio/v4-a-supercar/proof.mp4
ffmpeg -v error -i out/studio/v4-a-supercar/proof.mp4 -f null -
sha256sum out/studio/v4-a-supercar/proof.mp4
```

Inspect decoded front, side, rear-three-quarter, cockpit and road shots **as moving video**. Record any camera obstruction, tyre-contact error, driver occlusion, unnatural panels or unrealistic lighting. A successful decode or green CI is not visual approval. If rendering from a frozen source, preserve each adjacent `.mp4.json` and recipe fingerprint; do not mix shots from different revisions.

For the full editable workflow, study [V4 agent guide](YUNEX_V4_AGENT_GUIDE.md) and [exhaust compatibility](YUNEX_V4_EXHAUST_COMPATIBILITY.md). Older V3 recipes remain available, and production audio and narration are not generated or changed automatically. The proof films are silent development demonstrations, not approved public episodes.

## Agent handoff

Specify: **agent number and ownership**, project ID/recipe, vehicle reference, source commit, shot/frame assignments, unchanged audio contract, native media URL and SHA256, tested commands, visual limitations, and whether changes are committed to an agent branch. No episode code modifications without an explicit episode assignment.
