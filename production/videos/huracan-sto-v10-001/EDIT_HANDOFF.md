# Agent B — Huracán STO creative editing handoff

Status: **IMPLEMENTED, PROVISIONAL — Gate B NOT PASSED**. No STO footage was provided at the time of this commit. All preview scenes visibly read `PROVISIONAL · MEDIA MISSING`; there are no fake cars, images, copied Lexus frames, or misrepresented original angles.

## Locked timings
14 isolated, zero-overlap clips at frame starts: `0, 14, 34, 56, 78, 95, 113, 134, 157, 182, 206, 232, 256, 284`. Exclusive end 316; fps 30; 1080×1920; reveal at **78**. See `shot-map.json`. Identity, URLs, checksums and real in/out are deliberately null until verified.

## Implementation
- `src/huracan/HuracanStoFilm.tsx`: actual frame-addressed Remotion edit engine, per-shot pan/crop keyframes, true real-video `OffthreadVideo` playback when a verified source is wired, brief beat-locked restrained impact FX. The final composition **throws** when source data is missing.
- `src/fx/beat.ts`: unmodified pure frame-locked timing helper reused from `feature/porsche-fx-toolkit-20261010`. Other FX wrappers on that feature branch require additional packages not present in this project's base; intentionally do not copy untested dependencies. Heavy speed-ramp remapping must wait for A's real fps / in/out.
- Composition IDs: `HuracanSTOProvisional` (technical placeholder proof only); `HuracanSTOFinal` (real sources required).
- `validate-edit.cjs`: source checks, no gaps/overlaps, 316-frame coverage, exact reveal position, crop-safe keyframes, unique angle keys, identity flags, actual file checksums and media ffprobe in `--final` mode. Warns for low-resolution portrait crops.
- `edit.test.cjs`: deterministic Node regression tests.

## Local / CI proof
```bash
node --test production/videos/huracan-sto-v10-001/edit.test.cjs
node production/videos/huracan-sto-v10-001/validate-edit.cjs
npm ci && npm run check
npx remotion render src/index.ts HuracanSTOProvisional out/huracan-sto-B-PROVISIONAL.mp4 --scale=0.35 --concurrency=1
# EXPECT FAIL until verified media comes from A:
node production/videos/huracan-sto-v10-001/validate-edit.cjs --final
```

## Agent A → B → Agent C integration
1. Agent A provides **real** STO-only moving clips, high native resolution, manifest with exact trims, source URLs, model verification, independent camera-angle IDs and SHA256. Place approved originals in `public/sto-v10/`.
2. Populate each shot's `source.file`, `source.sourceStartSeconds`, `source.sourceEndSeconds`, `source.mediaSha256`, `source.sourceUrl`, `source.stoIdentityVerified`, `source.uniqueAngleKey`. If A has fewer approved angles, revise the scene plan and validate uniqueness honestly; do not multiply angles by slicing one video.
3. Run `validate-edit.cjs --final` BEFORE rendering `HuracanSTOFinal`; source durations must fill each exact frame interval. Confirm actual crop/vehicle inside frame at full 1080×1920 on all 14 scenes and around frames 77–79 / 315. Adjust `cropKeyframes` based on inspected source motion, not preset guesses.
4. C adds the exact user-supplied music and authentic recorded STO V10 audio as separate stems and renders/muxes the final. This edit intentionally mutes source clip sound.
5. D grants Gate B only after independent *actual* native moving-car frame/MP4 inspection, not because unit tests or a slate preview passed.

## Current blockers
- Gate A footage source bundle absent. Therefore no native STO footage render or source-based cinematic visual signoff exists yet.
- Music remains outside repo; C responsible for soundtrack mix.
- 316-frame motion can be verified structurally; image quality and accuracy cannot yet.
