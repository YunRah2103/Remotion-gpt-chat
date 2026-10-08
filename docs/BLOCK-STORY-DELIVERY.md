# Block Story — native Remotion recreation

## Delivery status

**PASS — final corrected MP4 independently assembled and verified.**

This 44-second 3D animation recreates the editing structure and block-model aesthetic of the user-supplied reference with newly authored geometry and a newly synthesized narration. The uploaded reference footage was not imported or composited into the animation.

- Repository: `YunRah2103/Remotion-gpt-chat`
- Working branch: `chatgpt/block-story-recreation`
- Composition: `BlockStory`
- Main implemented source: `src/BlockStory.tsx`
- Final animation source commit: `c2803760c5d480b4109724776a27bf133a477da9`
- Source setup: Remotion 4.0.533, React Three Fiber, Three.js
- Camera and object motion: actual ThreeCanvas/WebGL native 3D (software-backed WebGL in CI)
- Output: **44.000000 seconds, 1320 frames, 1080 x 1920, 30 fps**
- Codec: **H264 yuv420p** limited range, AAC 48 kHz stereo
- Local assembled file: `BLOCK-STORY-REMOTION-CORRECTED-FINAL.mp4`
- Exact SHA256: `d8b05cbf88f1708bc40e96276d98ac224faf20dc4dd5387656514933f628c7ce`
- Decode validation: **PASS**
- Audio stream and duration validation: **PASS**
- Native movie scenes visually spot-checked: 2, 8, 13, 18, 25, 31, 35, 41 seconds
- Sustained black-screen events (>0.9s): **0**

## Native render provenance

Corrected multi-scene proof and 10 native 120-frame segments: GitHub Actions run [37783193341](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37783193341).

GitHub's FFmpeg package installation stalled on segment 8, so a separate native Remotion software-WebGL job completed **frames 960–1079**, with the exact same 3D source, using run [37784375853](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37784375853). All 11 parts contain exactly 120 original frames, and the final H264 movie was stitched and encoded outside GitHub Actions using FFmpeg.

The standalone original Edge neural narration was obtained from fully validated first-master run [37782646185](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37782646185) and copied unchanged as the AAC stream into the corrected master. It is newly generated sound, not the user-provided video's soundtrack.

## Creative breakdown

0–11s: church interior, block characters, stained glass and altar; 11–16s: red carpet and fire; 16–20s: miniature church; 20–33s: floating bread and chalice; 33–38s: figure and sofa; 38–44s: decorated book. All graphics and objects are original. New editorial narration is not a factual endorsement of every statement in the reference clip.

## How to work with the Remotion source

```bash
npm install
npm run check
npx remotion studio src/index.ts
npx remotion render src/index.ts BlockStory out/block-story.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
```

The normal build workflow is `.github/workflows/block-story.yml`; `.github/workflows/block-story-rescue.yml` demonstrates a fallback native chunk render when hosted media tooling is delayed. No files were taken from, changed in, or made dependent on `YunRah2103/yunus-video-lab`.
