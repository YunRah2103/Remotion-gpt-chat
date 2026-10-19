# Agent 9 — deterministic rewind and identical reset

Issue #208. Branch: agent/ep003-09-rewind-story. DRAFT PR base: production/yunex-ep003-base.

## Agent 6 integration API

**sampleBranchReplay(filmTimeSec, settings)** returns phase, branchChoice, sourceTimeSec, playback direction and source choice seed. VO remains at 26.664 seconds / 800 frames. Custom settings retime the edits.

**resolveBranchFrame(filmTimeSec, {sampleWrong,sampleCorrect}, settings)** samples the real wrong-outcome source during bad reaction, contact and reverse; uses the real A2 controlled outcome at the restored identical choice instant. Reverse MUST feed genuine Agent8 sampled collision frames (including real deformation, debris, wheel and rail contact). Overlays alone are not a rewind.

**assertMatchingRestart(wrongSeed,correctSeed)** verifies both seeds match original body pose, yaw/pitch/roll, all four wheel hubs and failed tyre loaded radius. **rebaseDynamicsX** and **rebasePointX** enforce identical X shifts for road cuts, including 3D debris.

Default editorial markers in seconds:
- 12.83: hypothetical harsh-brake reaction (original Cedar cue).
- 14.22: illustrated impact freeze.
- 14.44–15.83: reverse actual sampled impact frames back to the identical incident.
- 15.83–16.015: identical tyre-failure restart still damaged.
- 16.015+: original controlled A2 response with existing A5 hands, smooth steering, gradually easing throttle, MOVING recovery.
- 26.664: existing Cedar track still governs Agent6 final film. Agent9 does not edit master.

This is transparent cinematic time compression, NOT a measured crash prediction. The crash is hypothetical and not an inevitable tyre-blowout outcome.

## Critical approval warning

**Agent8 real impact source is still missing.** The native Agent9 scene currently uses a separately labelled *DEVELOPMENT MOTION ADAPTER*, preserving the genuine A1 tyre, A2 dynamics, A3 camera, A4 GT/world, and A5 hands. This proves actual reversible time selection and moving blue GT but does NOT show final real crash deformation or debris. Do not represent the provisional MP4s as accepted crash footage or the finished film.

To approve final Agent9:
1. Hydrate Agent8 exact commit for impact/**; replace the wrong-outcome sample/render adapter with real Agent8 CrashCarRig/debris/damage.
2. Assert bad/good start poses match within tolerance and front-right failure remains on BOTH branches.
3. Render two true native moving clips at 1080x1920 source: 3–5s impact rewind and 6–8s branch compare, plus 540x960 review copies.
4. Verify FFprobe H264/30fps/frame count, full FFmpeg decode and visual frame-contact sheets especially crash->reverse and reverse->restart.
5. Keep Agent6 picture/root/editor and original source PR branches untouched, and maintain a DRAFT PR to production base.

Workflow: .github/workflows/yunex-ep003-agent9-rewind.yml. Provenance and current limitation are embedded in its artifacts.
