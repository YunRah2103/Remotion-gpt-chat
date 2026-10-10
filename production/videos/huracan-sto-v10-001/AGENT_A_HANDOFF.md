# AGENT A — actual acquisition handoff (10 October 2026)

> **FORMAT OVERRIDE — latest user instruction (10 October 2026): ALL SOURCE SHOTS AND THE ENTIRE FINISHED FILM MUST BE LANDSCAPE 16:9. FINAL OUTPUT 1920×1080, 30fps, 316 frames.** This supersedes ALL earlier vertical/portrait source-quality verdicts and instructions below. The three Phantom 1920×1080 landscape sources NOW PASS NATIVE OUTPUT-RESOLUTION CHECKS without cropping/upscaling. Monaco 1280×720 is landscape but has a lower-resolution warning. Six LA Modz 720×1280 portrait sources are EXCLUDED from landscape edit production. **Gate A still NOT PASSED** because distinct fast-moving STO camera angles remain insufficient/unverified, despite three technically acceptable FHD landscape sources. Historical results below reflect the earlier vertical requirement and are preserved as an audit trail.


## Assignment
Project `huracan-sto-v10-001`, own branch `automotive-edits/huracan-sto-v10-001/a-footage`. Do not modify `YunRah2103/yunus-video-lab`.

## Implemented and committed
- Python acquisition and QA tool: `production/videos/huracan-sto-v10-001/footage/acquire_sto.py`
- Dedicated reproducible GitHub Actions workflow: `.github/workflows/huracan-sto-a-footage.yml`
- Actual direct video URLs taken from publisher pages: four Phantom Rent a Car videos listed under its explicitly labeled Lamborghini Huracán STO section; one 720p Monaco Island article video. Sources are *not* represented as inspected or licensed solely because the pages exist.
- Captures MP4 bytes on a GitHub Ubuntu runner, actual SHA256/FFprobe codec, FPS, duration, bitrate, 9:16 source crop pixels, LEFT/CENTRE/RIGHT crop preview contact sheets, potential scene-cut times, rough static-frame/duplicate checks, single ZIP.
- Native synthetic FFmpeg smoke explicitly rejects 1920×1080 landscape as genuine 1080×1920 native crop quality.
- Source count and manually approved car-angle count are separate fields. ZIP presence never constitutes Gate A PASS.

## GitHub delivery
- GitHub Actions live acquisition run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38089620500
- Expected run artifact: `HURACAN-STO-A-SINGLE-ZIP`, containing `HURACAN_STO_A_CANDIDATES_SINGLE_ZIP.zip` and `manifest.json`; verify the artifact appears before claiming possession.
- The workflow will report true source counts, file hashes, and pixel crop data.
- Package preview contact sheets must be **visually reviewed** to verify exact STO identity and distinct angles.

## Truthful gate status
**IN PROGRESS / Gate A NOT PASSED** until runner completes and at least 10 distinct correctly identified moving camera angles receive manual approval. A shortfall of fewer than 8 usable angles means FAIL. Any low-res landscape source gets a resolution warning and is not silently upscale-approved.

## Open acquisition leads (not included)
- Lamborghini official Monza/Milan STO circuit + night footage and London travel guide, without a verified public original MP4.
- Press-asset portal Lulop requires verified account for downloads; do not bypass gate.
- LA Modz STO tinting page lists six additional publisher MP4s: https://lamodz.co.uk/blogs/ — identity, quality and usage not verified.
- Specialist paid 4K licensed STO shots exist on Pond5; not downloaded or purchased.

## Owner for next gate
Agent B can review research/shot-map suggestions; do **not** begin using unverified source pixels as if they were 10 unique sharp shots. Agent D should independently audit the actual workflow artifact, metadata and contact sheets. Agent C must obtain the user's supplied MP3 independently.
