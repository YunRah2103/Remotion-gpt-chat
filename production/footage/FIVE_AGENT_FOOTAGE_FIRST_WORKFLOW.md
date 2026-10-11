# YUNEX — Two-stage, Five-Footage-Agent Production System

**Status:** Default recommendation for *future* automotive videos as of 2026-10-11. This guide documents the production workflow; creating it does **not** launch chats, download footage, or merge any media. Do not reassign active FR Legends/GT3 agents.

## Rationale

Footage acquisition is the bottleneck. Running editing, soundtrack, final rendering, and source acquisition concurrently creates repeated dependency handoffs, low-resolution substitutions, and premature "complete" reports. **Solve source coverage before launching editor/sound/QA agents.**

## Stage 1 — Exactly five footage workers, parallel and independent

All five agents source actual files, not just links, and work on their own GitHub branches. The director creates one shared `FOOTAGE_CONTRACT.md`, common reference/sample music only when relevant, a shot-coverage map and five disjoint assignments before launching the chats. Each agent reads `production/footage/AGENT_ACQUISITION_PLAYBOOK.md` and its assignment; all share a tracking issue.

**For multi-car montage:** split by **makes/models/eras**. Example:
- **A — Heritage / Classics**: early decades and historic performance
- **B — European Performance**: designated modern makes (exclusive list)
- **C — Supercars**: designated exotics/hypercars (exclusive list)
- **D — Motorsport**: racing variants, endurance, rally (explicitly distinct from A–C)
- **E — Cinematic/Completeness**: remaining exclusive model set, including hard-to-source cars and underrepresented environments; do not reuse others' clips

**For single-car film:** all agents target the exact same variant but divide **source owners + shot functions**, with explicit no-overlap:
- A manufacturer/team downloadable promos + beauty hero/rolling
- B track/race filmmaker originals + cornering/flybys
- C social footage via TikTok/Instagram + distinctive moving camera angles
- D alternate native 1080/4K direct downloads + night/dusk/wet reflections
- E mechanical/engine/interior details + unusual POV/rear/wing/wheels

**Important:** Tailor buckets to actual source availability; do not hard-code a split that prevents one agent sourcing material. A shared `claim-ledger.json` or issue table reserves a specific source URL/filmmaker to ONE agent to prevent repeated downloads. If a bucket is blocked, move its unused targets to another agent with a traceable change; do not produce five identical collections.

### Targets per agent

The number depends on duration and subject. Default **8–12 approved distinct shots per agent**, rather than 30 weak clips per worker. Five agents aim for **40–60 visually distinct usable 1080p/4K shots** as an editing library; target can be scaled for short 10s or longer 60s work. A useful 10-second film may need 15–25 final cuts; a 60-second piece can require much more. Count unique actual moving camera angles/scenes, not files sliced from one recording. Optional additional candidate clips can be included, but quality not quantity is the PASS condition.

- Decoded true full-HD or 4K: ≥1920×1080 landscape or ≥1080×1920 portrait; native 4K upper bound unless contract says otherwise. No upscaled 720p, watermark-heavy material or unintended black bars. A high-resolution 16:9 file does **not** automatically support a true sharp vertical crop; record aspect/crop suitability.
- Car identity and exact generation/variant, source URL, filename, creator/ownership metadata, real original SHA-256, FFprobe dimensions/FPS/bitrate/duration, source in/out, visual contact sheet, camera viewpoint, duplicate signature, original engine audio availability.
- Use production-source tools in `AGENT_ACQUISITION_PLAYBOOK.md`: direct original MP4 first, verified TikTok/Instagram, alternate sources as verified; do not loop on YouTube GitHub runner blocks. All extracted media must pass native resolution and visual proof.
- ONE downloadable GitHub Actions artifact ZIP per agent, named deterministically: `<PROJECT>-FOOTAGE-A.zip` through `...-E.zip`; internal `clips/`, `manifest.json`, `contact_sheets/`, `README.md`. Unique prefixed filenames like `A_001.mp4` and `B_001.mp4`.
- Agent reports downloadable **artifact ID, Actions run URL, exact source SHA, count of native-QA-PASS shots, model/angle coverage**, and blockers. Do NOT claim completion from a green CI run if video ZIP contains no usable original footage.
- Independent chats cannot be started from GitHub branches alone. The user may have to start the five ChatGPT sessions explicitly; preface each starter with short chat label `<Project> | Foot A — <Bucket>`, etc.

## Stage 1.5 — Consolidate five ZIPs into one master footage pack

**No editing or final sound/renders yet.** Once all 5 submissions are ready (or explicitly marked unable to contribute), the **Master Director** triggers/oversees consolidation. This is a packaging/QA step, **not a sixth autonomous footage research agent**.

1. Obtain the 5 actual artifacts; ensure fresh download links and retention not expired. Because GitHub artifact storage has size/retention limits, preserve final master artifact and source references promptly. Do not check multi-gigabyte media directly into Git.
2. Extract into isolated prefixes `agents/A/` through `agents/E/` to prevent accidental overwrites. Record each source ZIP's SHA and Actions run ID. Reject unsafe ZIP paths or symlinks on ingestion.
3. Re-FFprobe/verify file checksums and full-decode or systematic scrub; physically inspect frames and flags. Remove corrupted/inadequate/upscaled candidates and duplicate camera angles across workers (not only byte-identical files). Resolve model misidentification and format mismatch.
4. Build a single sorted **master shot registry** with global unique IDs `F001`–`Fxxx`, per-clip original agent, model/make, source URL, native format, usable in/out, location/camera angle, portrait/landscape applicability, sound availability and quality score. Reconcile source provenance and permissions as needed.
5. Produce ONE **`<PROJECT>-ALL-FOOTAGE-VERIFIED.zip`** containing `approved_clips/`, `manifest.json`, `shot_map.csv`, `contact_sheets/`, `quality_report.md`, and `source_artifact_registry.json`. Do **not** include invalid files in `approved_clips`; invalids live only in separate rejected report. If master ZIP would exceed artifact limits, use volume files with a single master index as a documented fallback, rather than misleadingly claiming a one-file archive.
6. **Footage Gate:** PASS only when actual combined approved source count, visual quality and model/angle coverage meet the film's signed-off shot plan (not automatically 40 clips for every project). Report any genuine deficiency before starting final production. Consolidation is done by a checked GitHub Actions packaging run or by the director in a reproducible workspace; it is never just concatenating five ZIPs into a folder and calling it curated.

## Stage 2 — Only after Stage 1 footage gate passes

Now launch **three production agents** (not more footage collectors unless a gap is found):

- **Editor** — Film structure, shot selection using global Fxxx IDs, Remotion timeline, beat/word-boundary cuts, transitions, grading and actual frame previews.
- **Audio + Integrator/Renderer** — Exact user-provided soundtrack, per-vehicle authentic engine sound, mix/master, merge visual edit and render real final MP4; check audio and video stream properties.
- **Manager / Independent QA** — Audit original footage-to-timeline identity, original source quality, model variety, visual composition, sound authenticity, output decoded frames, actual artifact and links. Track issues without rewriting the other agents' work.

For especially complex films, adapt the Stage 2 worker count after Stage 1 rather than forcing extra agents prematurely. Never mark a video complete based only on code commits, synthetic placeholders, green CI or a package that has not been opened and visually checked.

## One-line pipeline

`Director sets film/shot map → Footage A+B+C+D+E → Five native-quality ZIPs → Consolidate/deduplicate/QA → ONE VERIFIED MASTER ZIP → Footage Gate PASS → Editor + Sound/Render + Manager → Final film QA & actual MP4`

## Expected user involvement

Five new ChatGPT chats are started at the beginning with the short copyable agent starters; an integration step can be GitHub Actions triggered when packages exist. Stage 2 chats are started *only after* the footage package is good. The goal is less user micromanagement, but **not autonomous ChatGPT-chat creation**: GitHub branches/tasks alone do not launch chats or guarantee auto-renaming.

This system is a **future-production default**, not a request to disrupt ongoing GT3 or FR Legends work.
