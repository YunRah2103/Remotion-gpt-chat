# Huracán STO / Agent B / V5 – Drive First, Smooth End

## Native Remotion render FINAL technical review (11 October 2026)

- Full source and picture verification **PASS**: [GitHub Actions run 38134278981](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38134278981) (all jobs green); [native movie artifact 11700965509](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38134278981/artifacts/11700965509).
- **Exact native picture:** `STO-V5-NATIVE-DRIVE-FIRST-SMOOTH-END-SILENT.mp4`, SHA-256 `55f2c7782a73eb097ec8b1b82a774caa7c6c4a578b5c5311248e257483a63f31`. GitHub native decode & local independent full FFmpeg decode PASS. FFprobe: 1920×1080 landscape, 30/1 fps, **316 actual decoded frames**, 10.533333 seconds, H.264. Original source 1920×810 (upscaled/cropped without aspect distortion).
- **Human picture review:** 24 actual frames from 0.00s to 10.49s were examined in `native_v5_full_review.jpg`. Frame 0 opens with visible moving white STO. Full vehicle reveal lands frame 78. Red-lit ending holds long enough and fades to full black by frame 315; computed mean pixel brightness frames 299/305/309/312/315 = **38.0 / 23.4 / 13.33 / 6.08 / 0.0**, confirming gradual decrease rather than an abrupt stop.
- **User-facing Agent C ZIP:** `HURACAN_STO_V5_NATIVE_REMOTION_AGENT_C_FINAL_HANDOFF.zip`, SHA-256 `a97afb590cc83e88ee1f52681ec3feef160e9cdaf800b5aa68f73526d17e21d4`, contains native Remotion MP4 + technical QA + frame stills/contact board + handoff.
- **C branch check:** On `automotive-edits/huracan-sto-v10-001/c-sound-render` at `2498409919aa824da5051b1e65fa3818485b31e7`, `sto_sound_render.py` now accepts **1920×1080**, with yuv420p/yuvj420p, so OLD portrait block is resolved. C must use this V5 picture, confirm the exact private music SHA and real clean STO V10 stem, and fade both music and engine for final 0.4–0.55s of the video. Sound is NOT yet included; no music stem is distributed by B.
- **Gate status:** Native B picture technical QA **PASS**; actual Gate A diversity/creator-permission and authentic sound Gate C **BLOCKED/UNVERIFIED**. Do not call this final release or claim 15 independently recorded moving camera shots.

**Source:** user supplied `HURACAN_STO_CINEMATIC_LANDSCAPE_1080_CANVAS_CURATED.zip` with twelve compressed and **letterboxed** 1920×1080-canvas cuts derived from one FORMAT67 filmmaker movie. Also user-provided exact original `format67_sto_directors_full.mp4` from the previous night pack, SHA `4c47e642babedfce0c7bd1cf60fa15a397b60679d430c534f5def4792738bfa3`.

**Editorial problem fixed:** Original V4 lingered on slow detail shots for ~3s before driving, and ended abruptly with a hard cut. V5 starts on a moving side-profile STO at **frame zero**, uses five rapid genuine driving angles in first 2.6s, lands the wide moving-car impact at **frame 78**, and reserves the **last 57 frames (1.9s)** for red/night/smoke Lamborghini hero with a **16-frame (0.533s) full-picture fade to black**. Agent C should mirror that with a 0.4–0.55s audio/music tail fade (don't chop the track).

**15 scene windows, not 15 independently approved moving angles**: 12 editorial source selections derived from the user's curated ZIP and 3 additional clean bridge/source windows from the same exact original film to fill the 316-frame music. One filmed original still cannot certify 10 distinct camera movement identities from filenames; Gate A remains pending. No Phantom source watermarks reused; filmmaker source permissions not confirmed.

**Image geometry:** Original is 1920×810 pixels at 25fps, so the user's curated 1920×1080 canvas clips contain 135px of black padding above and below. To avoid large letterbox bars, prepare_v5_assets.py goes to the exact original user-provided bytes: aspect-preserving **2560×1080 uniform enlargement and horizontal crop to 1920×1080**, then 30fps. This is a 1080p *output* from a non-1080-native source. No stretched cars or fake image detail.

**Use native composition** `HuracanSTOV5Candidate` (do NOT use V4). `HuracanSTOV5Release` intentionally errors until Gate A is validated.

**Reproduction:**
```
python production/videos/huracan-sto-v10-001/prepare_v5_assets.py --source format67_sto_directors_full.mp4
node --test production/videos/huracan-sto-v10-001/edit-v5.test.cjs
npx remotion render src/index.ts HuracanSTOV5Candidate out/STO-V5-NATIVE-DRIVE-FIRST-SMOOTH-END-SILENT.mp4 --codec=h264 --pixel-format=yuv420p --concurrency=2
```
GitHub action `.github/workflows/sto-agent-b-v5.yml` reproduces same source SHA and uploads a native silent 316-frame output and first/outro frame QA. Agent C owns verified authentic STO V10 engine and private user music. Keep 1920×1080, 30fps, 316 frames, original soundtrack SHA and gapless transition to silence by end of fade. Agent D should review actual native film rather than accepting CI alone.
