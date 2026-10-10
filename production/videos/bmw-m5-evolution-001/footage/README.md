# Agent A — BMW M5 Evolution footage research and acquisition

This directory is **research + an executable acquisition/QA system**, not a delivered 42-clip package.

### Confirmed research scope (2026-10-10)
- 20 source-page candidates across E28, E34, E39, E60, F10, F90 and G90, primarily **BMW Group PressClub scene-specific masters**, plus a few verified original creator pages.
- Nine direct official BMW PressClub high-resolution MOV URLs were identified by following the actual media download links. They have **not** been fetched/FFprobed: do not infer resolution from the filename.
- The 42-slot chronological `shot-board.json` is a *selection brief*, not footage. Actual timecodes/shot identities remain unknown until source bytes are reviewed.
- Archived 2000–05 BMW footage is genuinely native 1024×576 or 720×576 even at official "high-res", making it unacceptable to invent 4K or crop to a full 1080×1920 close-up. Use editorial frame treatment or find independent recent 4K footage.
- `E28/E34`: some PressClub group footage mixes all four eras. Never mislabel group video as exclusively one generation; manual per-frame inspection mandatory.

### Commands
Requires Python 3.11, FFmpeg/FFprobe and Pillow for preview generation.

```bash
python production/videos/bmw-m5-evolution-001/footage/prepare.py check-board
python production/videos/bmw-m5-evolution-001/footage/prepare.py fetch F10-track-2011 F90-country-2017
python production/videos/bmw-m5-evolution-001/footage/prepare.py probe F10-track-2011
python production/videos/bmw-m5-evolution-001/footage/prepare.py contact F10-track-2011 --step 6
python production/videos/bmw-m5-evolution-001/footage/prepare.py verify approved-cuts.local.json
python production/videos/bmw-m5-evolution-001/footage/validate_sources.py production/videos/bmw-m5-evolution-001/footage/source-manifest.json --require-ready
```

For 42 slots, the verified selection input `approved-cuts.local.json` must contain `{"shots":[{"slot":1,"generation":"E28","sourceId":"E28-chris-harris","inSeconds":10.0,"outSeconds":10.5,"reviewedModelEvidence":"confirmed ...","reviewedCameraDescription":"...","reviewedBy":"...","manualIdentityApproved":true,"manualDistinctShotApproved":true}, ...]}`. These timestamps are **illustrative only**. Supply actual exact cuts, 42 unique visible camera setups, model evidence, human review and ensure every real local source exists.

The verifier checks local FFprobe, source SHA256, durations, per-slot measurable frame change, no overlapping reused source windows, and dHash near-duplicate shots. It fails safely when a URL has no acquired bytes or the reviewer has not approved the car identity. `source-manifest.json` only exists after that genuinely succeeds.

### Private media/storage policy
`local-originals/`, `local-proofs/`, `approved-cuts.local.json`, and generated `source-manifest.json` contain actual media or locally verified metadata and are excluded from git by this directory's .gitignore; upload only to a bounded **private access** artefact handed to Master, not a public GitHub release. Sources (BMW/creators) have **unverified public-redistribution rights**. Do not bypass site access controls or scrape YouTube with login/DRM. Copying a public source is not rights clearance.

No source media has been downloaded in this agent session because its execution container cannot resolve external hosts, and the repo's existing M5 CI performs **metadata-only** validation with no source-acquisition/artifact job. Handoff status remains BLOCKED until real media bytes and unique cuts are supplied.
