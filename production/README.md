# Automotive Engineering — Production Suite

This is a **separate 3D educational series**, not YUNEX. This repository is `YunRah2103/Remotion-gpt-chat` only. Nothing from `YunRah2103/yunus-video-lab` is accessed, imported or changed.

The suite makes new explainer films cheaper to iterate and easier to review. It does **not** automatically invent accurate engineering models, record narration, enable GitHub Pages, or certify an animation's scientific accuracy. An actual finished MP4 still requires a source composition, render, native visual inspection and explicit release.

## What is installed

| Feature | Implementation | Notes |
|---|---|---|
| Reproducible npm dependency graph | `package-lock.json` / `production-bootstrap.yml` | Generated from real npm registry on CI; `npm ci` used once present |
| Reusable illustrated 3D mechanics | `src/mechanics/parts.tsx` | Brake disc, caliper, wheel, sensor, spring, valve, gear |
| Parts index | `production/mechanics/catalog.json` | Shared naming, source and reuse suggestions |
| New-lesson scaffold | `production/tools/scaffold.py` | Creates brief, shot plan, VO placeholder; does not render |
| Preview/full/stills renders | `production-render.yml` | Dispatch from Actions, configurable composition/frame range |
| Native smoke and code checks | `production-ci.yml` | Python unit tests + TypeScript + actual software-WebGL frames |
| npm/pip download caching | `production-ci.yml` and `production-render.yml` | Reuses downloaded dependencies by manifest hash; not a CPU render cache |
| MP4 integrity gate | `production/tools/quality.py` | FFprobe, SHA256, full decode; can require exact frames/audio |
| Image regression reports | `production-visual-qa.yml` | Matched before/after PNGs and differences; no automatic aesthetic claim |
| GLB optimization | `production-optimize-glb.yml` | Safe dedup by default; optional Meshopt needs compatible Three.js decoder |
| Animation anchor guard | `production/tools/gltf_guard.py` | Prevents silent GPU GLB renames/reparenting |
| Audio loudness checker | `production/tools/audio.py` | Detect levels and optional AAC loudnorm without re-encoding video |
| Shot-frame validation | `production/tools/shot_validator.py` | Catches gaps/overlaps and flags dense VO |
| Versioned MP4 Releases | `production-release.yml` | Explicit manual publication of a validated video |
| Static video gallery | `production-pages.yml` | Public Pages deployment once repository Pages is enabled |
| Publish catalogue | `production/catalog.json` | Add approved release links only; no fictional published films |

All large generated videos and model binaries belong in GitHub Actions artifacts or GitHub Releases, not ordinary Git commits. On GitHub-hosted runners, Blender and Three.js may use **CPU/software rendering**; enabling these workflows does not provision a GPU. GitHub Actions minutes/storage quotas may apply.

## Typical workflow: new ABS or suspension film

1. Create the brief: `python production/tools/scaffold.py abs-002 "How stability control works" --seconds 25`.
2. Edit `production/videos/<slug>/brief.json`, `shots.json` and `voiceover.txt`. Check frame continuity: `python production/tools/shot_validator.py production/videos/<slug>`.
3. Reuse the actual procedural components from `src/mechanics/parts.tsx`, then make true detailed GLB assemblies where required. A reusable part is an illustrative starting asset, not factory CAD.
4. Implement and register the new Remotion composition in `src/Root.tsx`. **Scaffolding alone does not create a registered composition or MP4.**
5. Go to **Actions → Production Suite - preview, stills or final MP4 → Run workflow**. Choose your exact composition ID, `preview` first (40% default), `stills` at scale 1.0 for final visual QA, or `final` for 1080×1920.
6. Inspect real full-resolution PNGs and moving clips. Use Production Suite - automated before/after visual review for the matched old/new proof artifacts. Numeric differences flag changes but cannot judge artistic quality.
7. Run `final` with no frame range for the whole film. For longer 750+ frame films, use established chunked production workflows; the simple dispatcher has a 180-minute runner limit.
8. Download the result, confirm voiceover if supplied, and run `python production/tools/quality.py video film.mp4 --width 1080 --height 1920 --fps 30 --frames 750 --audio` when appropriate.
9. Once approved, run **Actions → Production Suite - publish approved video as GitHub Release**, supplying the successful final render run ID, its exact artifact name, a distinct version tag and title. A Release is public in this public repository. Unlike temporary artifacts, it makes a stable download catalogue.
10. Add the actual Release URL to `production/catalog.json` (title, slug, optional HTTPS image URL) and deploy the gallery if desired.

### Commands on a configured workstation

```bash
npm ci
npm run check
python -m unittest discover -s production/tests -v
python production/tools/render.py --composition GpuDriveFilm --mode preview --start 0 --end 59 --output out/preview.mp4
python production/tools/render.py --composition GpuDriveFilm --mode stills --samples 0,30,60,120 --scale 1 --output out/frames
python production/tools/quality.py video out/preview.mp4 --report out/validation.json
python production/tools/catalog.py --site out/production/site
```

For audio checks:

```bash
python production/tools/audio.py out/final.mp4
python production/tools/audio.py out/final.mp4 --normalize-to out/final-normalized.mp4
```

Normalising the soundtrack is opt-in; do not replace an already approved mix indiscriminately. The video stream is copied, but the AAC audio is re-encoded.

### GLB optimization caveat

Run **Production Suite - optionally optimize GLB model** against a specific successful model artifact. The default `dedup` stage only deduplicates identical resources; the guard verifies required GPU anchor names and their parent chains before accepting the result. Optional `meshopt` may produce much smaller files but **MUST NOT** be promoted without runtime `MeshoptDecoder` support plus full native 3D playback checks. Never auto-replace a working cinematic asset based solely on compressed size.

### GitHub Pages: one manual repository setting

For the optional gallery, navigate to **Repository → Settings → Pages → Build and deployment → Source: GitHub Actions**. Then run **Production Suite - deploy public video gallery**. The committed gallery generator works before Pages activation; the site will **not** be live until Pages is enabled and a deploy succeeds. Videos are not auto-published to the world.

### Performance notes

- `npm ci` + npm download caching avoids repeated dependency resolution/downloads, but rendering still consumes CPU time.
- Use quick low-resolution previews and selected 1080p stills before rendering all frames.
- Cache reusable Blender outputs/artifacts by input SHA256; do not reuse a model from an unverified source commit.
- For long sequences, follow the existing five-way 90-frame GPU chunk technique with independent artifacts, checksums and final mux. Do not concatenate frames from different commits.
- Preserve 30fps frame-based deterministic motion; no random/frame-state accumulation.
- Keep one source of truth for the approved narration. The toolkit does not generate speech.
- **Never** use YUNEX models, assets or any code from `yunus-video-lab`.

## Production suite checks

The production CI runs Python unit tests, TypeScript compile and two actual Remotion software-WebGL frames. Separate full-fidelity proof and explicit release are still necessary. Visual regression can report pixel differences from a prior baseline; any intentional new edit should receive human review rather than automatically failing solely for visual change.

## GitHub Media Bridge — images and videos for agent reference

A normal chat agent with this repository's GitHub connector can create a **JSON request file**, triggering `production-media-bridge.yml` on `main`. GitHub Actions then downloads authorized public HTTPS images/videos, creates video-frame samples, contact sheets, thumbnail JPEGs, attribution manifest and checksums, and uploads them as an artifact. Manual workflow dispatch is also supported.

Read **[production/media-bridge/README.md](media-bridge/README.md)** for the exact schema, allowed sources, media-size limits, rights declarations and agent instructions. GitHub can store/download binaries but the GitHub text connector alone **cannot visually inspect them**. Generated references are not automatically inserted into a published film.

## Engineering Studio (reference galleries, mechanical QA and optional AI agent roles)

See **[production/studio/README.md](studio/README.md)** for the additional tools: self-contained Media Bridge reference gallery, FFmpeg scene-change reference extraction, real Blender six-angle/turntable model inspection, conditional narration transcription and SRT/VTT timestamps, kinematic telemetry diagnostics, candidate model catalogue entries and PR native before/after image reports. New workflows are `production-studio-model.yml`, `production-studio-media.yml`, `production-studio-voice.yml` and `production-pr-review.yml`. Some are manual opt-in and require existing artifacts; they do not run paid AI services or automatically publish reference content. Real engineering accuracy still needs independent expert/source review.

Four specialised **GitHub Copilot custom agent profiles** live in `.github/agents/`; eligible Copilot access must be enabled before they can actually run as coding agents. Profiles do not spawn workers or consume credits just by existing in GitHub.

## Integrated video production pipeline — 2026

Follow [PIPELINE.md](PIPELINE.md) for the new one-dispatch project preflight, still/moving previews and five-way final renderer, actual Remotion word-highlight captions, source-aware PR visual comparisons, agent skills and verified handoff templates, plus concurrency benchmarks. The pipeline refuses projects that have not yet registered a real composition (including ABS-001). Existing animations, GitHub workflows and the YUNEX separation are preserved.

## Advanced Studio — Blender integration, QA, render recovery, paired versions

Read [advanced/README.md](advanced/README.md). It covers native Blender GLB/pivot/animation export, inspected model geometry, real AO and high-to-low normal-map baking, conservative per-frame AABB clearance checks, Actions render-chunk recovery tied to original source SHA, a GitHub Pages side-by-side video reviewer and an opt-in dual-environment Remotion composition. These modules are optional; production signoff requires actual native evidence and human review.
