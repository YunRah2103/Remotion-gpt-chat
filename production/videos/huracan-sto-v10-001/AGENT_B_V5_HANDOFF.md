# Huracán STO / Agent B / V5 – Drive First, Smooth End

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
