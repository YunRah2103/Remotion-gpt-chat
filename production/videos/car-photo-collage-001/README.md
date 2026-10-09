# Automotive Photo Collage 001 — THE ART OF SPEED

20 seconds · 600 frames · 1080 × 1920 · 30 fps · H.264 with original audio.

The film is a standalone Remotion composition in \`YunRah2103/Remotion-gpt-chat\`. It has **no dependency on and does not modify YUNEX**.

## Reproduce

\`\`\`sh
python -m pip install Pillow==11.3.0
python production/videos/car-photo-collage-001/fetch_assets.py
python production/videos/car-photo-collage-001/make_audio.py
npm ci
npm run check
python production/tools/render.py --composition AutomotivePhotoCollage001 --mode final --output out/car-photo-collage-001.mp4 --concurrency 2
\`\`\`

## Photos and rights

The six photographs were made by real photographers, **not generated**. Photos are downloaded from the **Pexels** hosted photo CDN in the GitHub Actions runner, with exact attribution and source photo pages enumerated in [assets.json](assets.json). Each is used under the [Pexels License](https://www.pexels.com/license/), which permits creative use in social-video edits. Credit is documented even though attribution is not mandatory. The downloader records each delivered asset's source and output SHA256 and pixel dimensions in \`public/automotive-collage/provenance.json\` during the build.

Source contributors: Patrick (911 GT3), Kamshotthat (Huracán), Sai Krishna (Ferrari 488), txomcs (McLaren 720S), WAVYVISUALS (Nissan GT-R), and Bradley De Melo (BMW M4). Model names are editorial context; photo rights do not imply endorsement by manufacturers or photographers. The Porsche photo is a 911 GT3 rather than the wider-wing GT3 RS.

Original audio is procedurally synthesised in [make_audio.py](make_audio.py); no commercial samples or songs.

## Structure and QA

- **0–4 seconds:** Porsche hero frame, staggered companion imagery, editorial framing.
- **4–8 seconds:** six-photo layered collision of tiles, staggered spring entrances, overlapping depth.
- **8–13 seconds:** Ferrari, McLaren, BMW hero photos with cropped accent photos, motion zooms and masks.
- **13–17 seconds:** increasingly fast rearrangements of 6-up multi-angle grids.
- **17–20 seconds:** a six-car collage resolves into a single closing design.

The GitHub workflow [car-photo-collage-001.yml](../../../.github/workflows/car-photo-collage-001.yml) renders a preview, 10 intermediate stills/contact sheet and the full 600-frame film. FFprobe verifies H.264, 1080×1920, 30 FPS, ~20.0s, and AAC audio. FFmpeg must decode the entire file without error and stills must not be almost entirely black. The film, preview, source records, FFprobe, contact-sheet and QA report are uploaded together for download.
