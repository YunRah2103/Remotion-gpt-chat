# EP005 Agent 1 — New V3 coachbuilt replacement

**Branch:** \`agent/ep005-01-v3-coachbuilt-overhaul\` (separate from A1's original draft #256).
**Source baseline:** V3 commit \`58d3d7c76d2389ec3765212358d200295d22ad0e\`,
the latest checkpoint with independently passing V3, model and kit workflows.
Later kit dynamics commit \`e376300\` has source tests but had intentionally
skipped native CI at branch creation and is NOT assumed video-approved.

This is a source-owned physical car revision, not a claim that a scripted
Three.js car is indistinguishable from a licensed CAD scan. It uses V3's new
default coachbuilt surfaces and sculpted front ducts, then adds:

- Pearlescent graphite/silver panel surfacing and subtle flush body seams;
- actual rotating 10-spoke concave forged alloy shapes, hub and brake-rotor detail;
- arch lip shaping, recessed intake vanes, swept LED front and rear optics;
- fitted curved carbon aero blade, **shaped** rear diffuser strakes;
- stitched seats, instrument hardware, darker driver suit/helmet optics;
- additional V8 charge lines and individual bank hardware;
- dramatically closer camera shots for the real moving road, cabin and internals.

**A2 ABI / physical mount contract is immutable:** left/right names
\`mount:exhaust-tip-left\`, \`mount:exhaust-tip-right\`; body-local transforms
\`[-2.465,.420,+.570]\`, \`[-2.465,.420,-.570]\`, outward \`[-1,0,0]\`;
clear lip inner radius \`.085m\`, outer barrel \`.105m\`. Reuse
\`createEp005Hero()\` and \`resolveEp005ExhaustPorts()\`. All mounts stay
children of physical exhaust tube nodes below the animated V3 body shell.
Real combined flame proof must be verified by Agent 2 / manager.

**Preview:** 300 frames, 1080 × 1920, 30 fps, 10 seconds, SILENT.
Canonical track / night is shared with A3 and A4. Scene cuts are deliberately
cinematic, not an implicit promise of physically continuous wheel suspension
dynamics. Native workflow must run and be visually reviewed before approval.
A \`kit:handoff\` JSON alone is not media.

**Native gate:**
\`npm ci && npm run check && node --test production/yunex/supercar_flames_ep005/vehicle/{hero-contract,coachbuilt-overhaul}.test.mjs\`
followed by V3 validate/plan/inspect/preview/full render, two native shot renders,
FFprobe, full FFmpeg decode, contact sheets, moving hashes and SHA256.

**No merge** or PR #233 changes. Source paths owned by A1 only. If PR diff
against the original EP005 integration base includes newer V3 kit changes, manager
must not accidentally integrate those unrelated kit files as an A1 asset patch.
