# YUNEX EP005 — Agent 6: car-only visual gate

**STATUS: UNAPPROVED CANDIDATE — explicit owner / Agent 0 inspection required before driving production.**

## Source audit and selection

Rejected A1–A5 geometry was not reused. PR #233 kit architecture was audited: its QA describes a stylized procedural body with remaining faceting. This isolated branch starts on main without merging kit PR #233 or altering EP003/EP004.

Candidate asset: **Spectral GT RS** by **JaronKBragg7337** (original CC0 1.0 Universal), from https://github.com/JaronKBragg7337/spectral-gt-rs . The source includes Blender 5.1.2 editable scene, generator and GLB. It is a candidate for visual review, not a claim of high-end automotive CAD.

- Immutable upstream commit: 34499c501908818a2b08e589a7aecf963343cee7
- GLB git blob SHA: f5b814848453a6c75a48f5047fdadaa7bdc78969
- License git blob SHA: 8f40c549094ff25ff1e2a8cdc597f29f78195b9a
- Full editable source: spectral_gt_rs_master.blend and spectral_gt_car.py at same source commit
- CC0 legal code: https://creativecommons.org/publicdomain/zero/1.0/legalcode
- Asset source and license are downloaded from immutable upstream paths and git-blob verified by scripts/ep005-agent6/fetch-asset.sh. Build publishes their SHA256. No expiring/signed URL dependency.

## Native inspection deliverables

Two registered Remotion H.264 compositions:
- Ep005Agent6HeroProofPortrait: 1080 x 1920, 30 fps, 120 frames
- Ep005Agent6HeroProofLandscape: 1920 x 1080, 30 fps, 120 frames

Continuous neutral studio camera front -> front 3/4 -> pure side -> rear 3/4 -> rear. No darkness, flames, cuts to hide shape, grading, post blur or moving-road illusion. Car stays stationary to expose real geometry. Originally oversized 156mm rings are hidden, replaced by recessed 114mm outer-diameter tips and 82mm bores. Remaining aesthetic defects must be judged from full-resolution moving videos and all six sample frames. Reject the entire candidate and choose a different asset if it still looks wrong; no repeated ornament patches.

Reproduce from repo root:

    npm ci --no-audit --no-fund
    bash scripts/ep005-agent6/fetch-asset.sh
    npx remotion render src/yunex/ep005/agent6/entry.tsx Ep005Agent6HeroProofPortrait out/ep005-agent6/hero-proof-portrait.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
    npx remotion render src/yunex/ep005/agent6/entry.tsx Ep005Agent6HeroProofLandscape out/ep005-agent6/hero-proof-landscape.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
    bash scripts/ep005-agent6/verify.sh out/ep005-agent6/hero-proof-portrait.mp4 out/ep005-agent6/portrait-qa

Workflow .github/workflows/ep005-agent6-hero-proof.yml runs both renders, full FFmpeg decode, FFprobe dimension/fps/frame count/pixel format, hash and contact sheet. Its GitHub artifact is the deliverable, not this document.

## New Agent 7 and Agent 8 interfaces

See src/yunex/ep005/agent6/exhaust-ports.v1.json. Car axes after GLB adapter: +Z forward, +Y up, -X left; mounts (metres) left [-0.56, 0.57, -2.515], right [+0.56, 0.57, -2.515], local outward [0,0,-1], inner radius 0.041m and outer diameter 0.114m. Native GLTF before -90deg Y rotation: left [-2.515,0.57,+0.56], right [-2.515,0.57,-0.56], direction [-1,0,0]. Source function sampleExhaustWorld(car,frame) applies car's complete matrixWorld to original asset-local mounts to emit frame-specific values for Agent 7. Particles must inherit the current vehicle transform.

This is a static hero approval proof. **No full driving scene, editor handoff, final approval or merge until owner explicitly accepts the car.** Once approved, build moving route footage with wheel rotation, real road parallax, suspension, contact and purposeful camera motion for Agent 8.
