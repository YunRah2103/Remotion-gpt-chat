# YUNEX EP003 — Agent 9 real collision rewind and original restart

Issue #208 · branch agent/ep003-09-rewind-story · DRAFT PR #212 into production/yunex-ep003-base.

**Real Agent 8 integration is implemented** from immutable commit 6d28e332d289e11ef7cacfc6682b35a43d41a332, but neither final approval nor playable MP4 delivery may be asserted until actual Actions tests, native renders and FFmpeg decode succeed. Agent6 alone will edit the master narrated 800-frame film.

## How Agent 6 imports this module

1. sampleBranchReplay(filmTimeSec, settings) supplies phase, original source time, direction (1/0/-1), wrong-or-controlled choice. Its locked voice cue times are 12.83 bad reaction, 14.22 impact freeze, 14.44 true backwards sampled collision through 15.83, 15.83-16.015 identical seed, 16.015 onward good controlled branch. Parameters can be retimed to VO.
2. resolveBranchFrame(..., {sampleWrong:sampleRealAgent8Wrong,sampleCorrect:sampleRealAgent2Correct}) supplies A8 REAL seek-safe counterfactual collision frame including damaged bumper/fender/lamp, debris and rail contact, and A2 genuine original safe outcome after the rewind.
3. assertMatchingRestart(badSeed,goodSeed) compares original pose and four hubs/loaded radii. Both use the identical A2 decision state at 4.0s source time, before hypothetical driver choice, with the FRONT-RIGHT tyre already failed. No sudden tyre repair.
4. The Agent9 3D renderer applies original A1 deforming front-right rubber and original GT body, Agent8 frame-derived body/lamp deformation, A8 ImpactEffects3D reverse-sampled sparks/debris, A3 action camera, A4 road and original A5 hands. Damage is progressively removed by replaying actual A8 frames BACKWARDS, never by a cut.
5. Rendering scenes: EP003Agent9ImpactRewind (4.5 seconds / 135 frames), EP003Agent9BranchCompare (7.5 seconds / 225 frames). Native sources are 1080x1920/30fps, CI uses 540x960 review encodes. They are independent department previews, NOT the final 26.664s film.

## Immutable original contributions
A1 7d47746d2fc584e935b5a9766eb1150e5b3dac38
A2 e724786fc087b080e9de19e9e26bda6a815ce276
A3 938628271f9b50d975ee55491881a8fd2d4807a5
A4 a44f1b6c9c31105edd1a9b0d2de7f233d1223952
A5 cd03c64f77705aa03ee5d5071e5cf18c669fa4ea
A8 6d28e332d289e11ef7cacfc6682b35a43d41a332

## Acceptance
- Run TypeScript, original world/parts-kit, Agent8 collision, Agent9 retiming/reverse/restart and tyre tests.
- Inspect native real car collision and rewind for clear contact, damage recovery, matching road orientation and moving driver recovery at phone scale.
- Verify H264 30fps exact 135/225 frame count, FFprobe, complete FFmpeg decode, meaningful temporal pixel changes and contact sheets for impact/freeze/reverse/reset.
- Publish actual artifact from a SUCCESSFUL workflow and PR/Issues #208/#193 with SHA, previews and unresolved visual caveats. No early FINAL film or VO claim.
- Both final film visual editing and VO cues remain Agent6-owned. Hypothetical bad braking outcome isn't inevitable from punctures, and visually improved recovery isn't a guarantee of safe stop.
