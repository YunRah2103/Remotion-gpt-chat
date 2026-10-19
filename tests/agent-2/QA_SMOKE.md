# EP003 Agent 2 — Numeric source smoke (2026-10-19)

This is a **real executed source-level numerical smoke** against the committed `dynamics/model.ts` blob `247f6884a5df195db308050b82c9198b349a111d`, test blob `6ff74fbc97e7ae5c201740ae26198cb8ad806947`.

Execution method: GitHub connector fetched both complete committed files; a one-off isolated JavaScript V8 harness stripped the TS-only type declarations/imports, substituted the unchanged shared numeric constants, and executed the nine existing test cases (using compatible local `assert`/test stubs). **9/9 passed**. This checks the actual formula code, but is **not** an `npm ci`, `tsc`, Node's actual test runner, or Remotion/browser execution. It also does not validate video frames or vehicle textures.

| t (s) | world Z (m) | yaw (rad) | speed (m/s) | correction (rad) |
| ---: | ---: | ---: | ---: | ---: |
| 1.2 | -1.85192 | 0.002465 | 27.72493 | -0.002260 |
| 4.0 | -2.02444 | 0.001227 | 26.94617 | -0.003150 |
| 8.0 | -1.91891 | 0.001665 | 24.66146 | -0.002549 |
| 10.0 | -1.96024 | 0.002018 | 22.44343 | -0.002850 |

These numbers are model outputs from **scenario assumptions**, not tyre tests or captions to show on screen. Base lane Z=-1.85m, positive yaw is to the right. The model initially yaws right, a delayed opposite steering input stabilises it, and speed gradually falls without an implausible sudden stop. At t=8.25s, comparison of independent 120Hz and 480Hz integrations returned longitudinal difference ~0.0111m, lateral ~0.0053m, yaw ~0.000152rad and speed ~0.00334m/s. Test cases also cover opposite-side tyre sign, deterministic reverse seeking, wheel rotation, bounded roll/pitch and monotone forward displacement.

**A controller-sign defect WAS discovered** during the first numerical smoke: the old lateral error feedback could amplify yaw after 6s, leave the roadway and cause 0.51rad yaw by 10s. Commit `738ffefdf5e737d257de7232a1dfc8629b1bc7b6` corrected the lateral position / slip feedback signs, and commit `ee679af1c6c72205918f4b13b1e7aef0525c669b` tightened lane recovery regression assertions. The table above is **after** those fixes.

**Still required before visual approval:** real `npm ci`, TypeScript compile (`npx tsc -p production/yunex/tyre_blowout_ep003/dynamics/tsconfig.json`), native Node tests, worldkit/partskit regressions, two genuine Remotion MP4 renders, FFprobe/full FFmpeg decoding, frame sheet, visual QA and manager acceptance. These have **not** been executed or verified by this smoke test.
