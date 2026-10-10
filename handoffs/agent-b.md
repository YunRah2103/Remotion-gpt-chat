# AGENT B — PORSCHE 911 TURBO EVOLUTION 001 HANDOFF

**Status: REVIEW — actual editing code committed, real-footage/native-Remotion sign-off still pending.**

**Source commit (implementation + test harness):** `15b5b98628e4b371d585ce06307308b1825a59e1`
**Branch:** `automotive-edits/porsche-911-turbo-evolution-001/b-creative`
**Owner:** `director`. This handoff metadata is a separate follow-up commit; `sourceSha` identifies the immediately preceding actual SOURCE revision.

## Delivered

The actual Remotion scene `src/porsche-turbo-evolution/edit/PorscheTurboEvolutionFilm.tsx` exposes `PorscheTurboEvolutionFilm` and `PorscheTurboEditComposition`. Source adapter / validation in `edit/timeline.ts` imports the measured official beat-map, protects 30 slots / 510 frames / 7 Porsche eras and rejects missing source/video/identity evidence, repeated camera fingerprints, duplicate staged file, overlapping original-video SHA/time intervals, unsafe media paths and unapproved full-bleed landscape crops. `proof-entry.tsx` is an independent diagnostic-only composition. Production mode uses genuine `OffthreadVideo` from D-staged media. Clean white model code changes at seven exact era starts; no HUD. Normal cuts are sharp; optional C-selected chapter effects call the installed `BeatFxTransform` for the first few frames of the NEW clip only.

## Test evidence (precisely scoped)

- **PASS, real GitHub Actions planning CI:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38055465013
- **PASS, independently read live repository beat map:** 30 contiguous clips, 29 changes, frame 0 to frame 509, chapter boundaries 0/67/136/205/274/343/429; code-inspection checks found edit adapter, registered diagnostic, and toolkit import.
- **PASS, independently rendered FFmpeg abstract timing proof (not native Remotion, not cars):** H.264 540x960 at 30fps, exactly 510 frames /17s, full decode PASS; SHA256 `17e510ce2b5c12757d8f2fb4e6498493009930ab09fb2d2fe88b2d22efb53664`; 29/29 abstract frame boundaries changed (min MAD RGB 21.99). Generated in a separate conversation runtime, **not transferable to D as a GitHub artifact**. Do not treat as footage quality evidence.
- **NOT RUN HERE:** npm ci / npm run check / native Remotion diagnostic proof / compiled-source `test_timeline.mjs`. The available container lacks the pinned npm packages and GitHub network access. Runnable scripts committed at `production/videos/porsche-911-turbo-evolution-001/edit/` for D's online renderer. These tests MUST pass before marking B native proof complete.
- **NOT VERIFIED:** real 30-shot Porsche film or real camera uniqueness. Agent A material not accessible in this B runtime. Never claim completion from abstract diagnostics.

## Exact master integration sequence

1. Cherry-pick source commit `15b5b98628e4b371d585ce06307308b1825a59e1` (includes preceding code commit `7a8fe9b282e5b14085aa4284996f6e0add37bb32`) or merge B branch. Do NOT replace C/A/D owned files.
2. Run `npm ci --no-audit --no-fund`, `npm run check`, `node production/videos/porsche-911-turbo-evolution-001/edit/test_timeline.mjs` and `bash production/videos/porsche-911-turbo-evolution-001/edit/render_diagnostic_proofs.sh` in a networked Ubuntu Remotion runner. See edit/README.md.
3. Retrieve real Agent A 30 verified moving source clips, verify each original binary SHA256+FFprobe and Porsche Turbo/Turbo S identity independently, stage clips under Remotion `public/` outside Git.
4. Import `adaptAgentAManifest` and `PorscheTurboEvolutionFilm`; pass `shots={adaptAgentAManifest(A, staged).map(x=>x.shot)}` and `mode='production'` in Master-owned `src/Root.tsx`. Default hard cuts; allow Agent C vetted chapter effects only if visibly superior.
5. Render complete 510 frames at 1080x1920 30fps with original supplied private soundtrack; FFmpeg full decode and human visual QA of all 30 beats. Single high-quality H.264 encode and AAC 48k if available; source distribution rights separate.

## Remaining blockers

Real footage/rights, native Remotion render validation on pinned deps, final original soundtrack and cinematic QA are pending Agent A + Agent D. Integration code is delivered but **this is not a finished Porsche video**.
