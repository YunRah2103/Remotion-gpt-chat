# Agent A — actual footage acceptance and native QA

This directory currently contains **no real Porsche media**. The 30-slot template is not an evidence manifest. `source-candidates.json` lists research leads, **not 30 sourced shots**. Do not mark handoff READY merely because tests pass.

## Target

- 30 separate moving setups: 930 ×4 → 964 ×4 → 993 ×4 → 996 ×4 → 997 ×4 → 991 ×5 → 992 ×5.
- Only genuine 911 **Turbo/Turbo S coupes**. No Carrera, GT3/GT2, game footage, archival still-image pan, substituted car or split/repeated angle.
- Keep original highest available footage, do not transcode to source intermediates or pretend SD is native 4K.
- Use clean tight cut beats from `../beat-map.json`. Agent C/D can apply the Cinematic FX Toolkit later; Agent A does not grade source media.

## Ingest and audit

1. Obtain access to authentic source media under appropriate permissions and record the actual creator/source URLs; publishing rights must be assessed independently. Keep original video files outside public Git.
2. Copy `shot-manifest.template.json` to a private `shot-manifest.working.json` and populate **all 30** entries from visual review. Each entry needs `localPath` (relative path to the source root), exact `sourceInSeconds` and `sourceOutSeconds`, `sourceId`, `shotKey`, source page, origin creator, usage-rights status, independent Turbo identity evidence, physical camera angle/motion description. Do not invent hashes/dimensions. `sha256` may be omitted until calculated.
3. With FFmpeg/FFprobe installed (Pillow for the contact sheet), run:

```bash
python production/videos/porsche-911-turbo-evolution-001/footage/audit_footage.py \
  --manifest PRIVATE/shot-manifest.working.json \
  --source-root PRIVATE/originals \
  --beat-map production/videos/porsche-911-turbo-evolution-001/beat-map.json \
  --output PRIVATE/audit-proof
```

4. Inspect `PRIVATE/audit-proof/contact-sheet.jpg` **and all 90 individual JPEGs**, compare source frame motion and chassis/Turbo identity, and document each setup. `audit-report.json` captures original FFprobe details, real SHA256, inferred movement, temporal overlap, dimensions, source rights and warnings. Motion deltas can be caused by moving backgrounds; they do **not** establish a moving Porsche. Near-duplicate stills are heuristics; they can falsely flag lookalike angles or miss same-scene cuts.
5. Deliver actual unchanged source files plus audit records as an **access-controlled** artifact/transfer. Confirm Agent D can retrieve it before marking READY; do not put unlicensed original footage in the public repository. Fill the final `shot-manifest.json` with independently verified values, then run `validate_shots.py --require-ready` and `production/tools/handoff.py`.

Exit 2 signifies one or more missing or rejected source slots. Exit 0 means *automated source checks succeeded*, **not** Porsche authenticity, visual shot uniqueness or rights clearance. Sign-off still requires looking at every beat.

## Tested here

A fully **synthetic testsrc2 FFmpeg fixture, NOT a Porsche clip**, passed probe/SHA/motion sampling/JPEG/contact sheet. A deliberate 29-missing-slot plan correctly returned exit 2 with 29 blockers. This verifies the audit path, not production media.

## Status for Master D

**BLOCKED / NO REAL FOOTAGE ARTIFACT.** Candidate source pages are in `source-candidates.json`. D cannot use fake media links or convert research links into proof that 30 shots exist. Real native source retrieval and manual vehicle identity/angle review remain mandatory.
