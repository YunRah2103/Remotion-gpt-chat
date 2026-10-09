# Automotive Engineering · Five Studio Experience upgrades

These are additions to \`YunRah2103/Remotion-gpt-chat\` only; \`yunus-video-lab\` and YUNEX remain untouched.

## 1. 3D Mechanical Model Lab

- Location: \`production/portal/viewer/index.html\`, with pinned Three.js \`0.179.1\` ES modules.
- Open a **self-contained .glb in the browser**, or a public HTTPS .glb URL if CORS permits.
- Orbit/pan/zoom, select individual meshes, inspect the mesh/material metadata, isolate parts, toggle wireframe, switch light presets and move pieces into an exploded view.
- This is a browser **visual inspection**, not a manufacturer-CAD accuracy certificate or a GLB writer. The original geometry is not modified or uploaded by the local-file path.
- The viewer uses pinned jsDelivr modules at runtime; the user needs browser connectivity. Large files may take memory/CPU and the browser caps incoming files at 100 MB.
- To enable public access, set **Settings → Pages → Build and deployment → Source = GitHub Actions** and run the existing **Production Suite - deploy public video gallery** workflow. It deploys the existing video catalogue, the new \`/viewer/\` model lab and \`/dashboard/\` together. The workflow does **not** automatically make a public website live until Pages is enabled.

## 2. Mechanical sound design

- Script \`production/sound/sound.py\` creates reproducible synthetic mechanical events (valve clicks, brakes, motor whine, gears, airflow and impacts) aligned to explicit timeline frames.
- Example \`production/sound/plans/abs-demo.json\`. ABS remains **preproduction**; this audio plan does not claim any finished ABS video.
- Sound assets: genuine 48kHz mono PCM WAV, event report and SHA256.
- \`sound.py mux\` combines an existing final MP4 with the generated effects and, when deliberately provided, *the approved existing narration*. Narration is never generated or replaced. The video stream is copied, and final AAC loudness-normalized/limited; listen to the result for balance. Without narration it exports mechanical sound effects only.
- Actions: **Production Studio - generate mechanical effects and optional final audio mix**. It reads only committed event JSON and optional successfully completed video/voice Actions artifacts. It never fetches licensed commercial music without approval.

## 3. TikTok and YouTube Shorts phone QA

- Script \`production/phoneqa/phone_qa.py\`, workflow **Production Studio - phone UI safety and short-form QA**.
- Uses five real FFmpeg-extracted frames from a final *1080 × 1920* vertical MP4, or supplied screenshot files.
- Creates red/orange **conservative platform UI masks** around the top, bottom, right and left screen regions. Checks *author-declared captions and important subject rectangles* against these masks and warns when declared font sizes are small.
- Exports phone previews and \`phone-report.json\`, plus a basic measure of brightness jumps among samples. You must still review full-speed transitions and all undisclosed objects.
- For a known film, author \`production/phoneqa/layouts/<slug>.json\` specifying actual per-shot normalized \`[x,y,width,height]\` boxes. \`default.json\` deliberately has no objects, so it cannot make unjustified passing claims.
- These masks are **approximate planning guides**, not official TikTok/YouTube fixed specifications. UI elements move across devices and formats. The checker is **not OCR**, and it does not automatically find captions or components that weren't declared.

## 4. Reusable photoreal material/lighting starting points

- \`src/studio/LightingPresets.tsx\` exports \`StudioLightingRig\`, \`EngineeringSurface\` and typed parameters for machined aluminium, brushed steel, rubber, paint, glass and dark polymers.
- Three lighting setups: \`soft-studio\`, \`hard-metal\`, \`inspection\`. Use them inside \`ThreeCanvas\` when a film needs premium metallic highlights or clean technical visibility.
- \`StudioMaterialProof\` is a separate **150-frame, 1080×1920 Remotion test composition** for native render review. Existing GPU and Turbo compositions remain unchanged.
- These are creative baseline presets, not physically measured spectral materials or actual manufacturer samples. For complex products refine PBR textures and geometry as needed.

## 5. Read-only production dashboard

- Generator: \`production/portal/build.py\`. Sources: **actual** \`production/videos/*/brief.json\`, \`src/Root.tsx\`, public GitHub Actions runs, open pull requests and production/agent-labelled issues.
- Shows registered vs still-preproduction film projects, recent CI statuses with real workflow links, open PRs and coordination issues.
- Pages deployment includes \`/dashboard/\` with \`/viewer/\` and the existing front-page video gallery.
- Data is a **timestamped deployment snapshot**, not a live subscription or continuous dashboard. Failed GitHub API reads are explicitly shown as unavailable, never as fictitious green status.
- Portal uses only public repo metadata; it does not publish private artifacts, passwords or unseen agent conversations.

## Quick start

\`\`\`bash
python -m unittest discover -s production/tests -v
python production/sound/sound.py render production/sound/plans/abs-demo.json out/demo/effects.wav
python production/phoneqa/phone_qa.py --layout production/phoneqa/layouts/abs-001-example.json --images sample-frame.png --output out/demo/phoneqa
python production/tools/catalog.py --site out/production/site
python production/portal/build.py --offline --site out/production/site
npm ci && npm run check
npx remotion still src/index.ts StudioMaterialProof out/lighting.png --frame=42 --gl=swangle --scale=0.25
\`\`\`

**QA**: The dedicated \`production-experience-ci.yml\` tests Python tools, a genuine FFmpeg audio mux, actual vertical FFmpeg frame extraction, static viewer syntax and a native Remotion lighting composition. Site/browser CDN access, the optional full final video and a deployed Pages URL require further action before claiming they are live.

**Boundary:** These upgrades do not spawn additional AI agents. The existing custom GitHub Copilot agent profiles can work only when the user's Copilot account enables and starts them.
