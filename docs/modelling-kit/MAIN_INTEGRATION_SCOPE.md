# V4 modelling studio -> main integration contract

Source development branch: `feat/yunex-modelling-kit-v2`, PR #233, original source head `1b445c431f8868f5b744935b60c29706c5570aac`.
Target base: `main` at `f25c96dc4843960584b82b66a9a7ab0a8445911e`.
This integration uses existing Git object SHA references for the complete relevant source; binary previews are not re-encoded.

**Includes:** `src/yunex/{modelling-kit,parts-kit,world-kit,studio-projects}`, matching `scripts/`, `tests/`, relevant `docs/`, seven kit-specific Actions workflows; minimal existing-root composition registration, package scripts and TypeScript extension support; new main-specific onboarding guide and integration smoke workflow.

**Excludes:** `production/yunex/f1_sparks_ep004/**`, `.github/workflows/yunex-ep004-review.yml`, production tool edits, unrelated episode Python tests, historical `docs/superpowers/**`, and every unrelated file outside the kit. Previously existing `src/ai-era/**`, AI Era root compositions and `main` workflows stay intact. No production PR is rebased or merged. PR #233 stays as development history.

**Provenance and acceptance:** V4 historical A/B/C proofs and their source/media checksums remain described in `docs/YUNEX_V4_OVERHAUL_HANDOFF.md`. The original user-approved *car appearance* belongs to the teal source `9052a539e10a7cb97487c1435455bb9962ad58e1`; it does not constitute approval of the whole film. Corrected later V4 source has distinct hashes and must be newly rendered on integrated main. This scope itself does not claim new native validation, full moving acceptance, or photorealism.

Merge gates: source-isolated PR diff, passing Node 24/TypeScript/Python checks, successful source-locked H.264 30-frame native smoke MP4, full FFmpeg decode, and no required review/protection bypass. After merging, verify the exact main SHA and a fresh smoke from that SHA.
