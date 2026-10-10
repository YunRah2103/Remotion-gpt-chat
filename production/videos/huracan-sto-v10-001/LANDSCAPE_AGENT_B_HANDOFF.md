# Agent B — Actual landscape STO edit handoff (10 October 2026)

**Source branch:** `automotive-edits/huracan-sto-v10-001/b-edit`

## Verified edits — 16:9 user override
User explicitly revised the format: **1920×1080 LANDSCAPE**, not the earlier portrait contract. Duration unchanged: 316 frames × 30fps = 10.5333 seconds. Key impact full-car reveal: frame 78 / 2.60s. No on-screen HUD/UI, no generated cars, no unrelated car.
  
## Uploaded user media inspection
Inspected `HURACAN_STO_LANDSCAPE_FOOTAGE.zip` (4 publisher MP4 files). Physical FFprobe: three are native 1920×1080; fourth Monaco 1280×720 mixed slideshow/race material rejected for this edit. 14 **distinct time segments**, NOT 14 verified independently moving camera angles. Rear wing/exhaust/cockpit macros plus real-moving road shots of blue STO. The three usable clips contain baked-in Phantom watermark. The driving takes place around roads/car parks, not sourced racing circuit or night. Several rear angles occur in similar locations. **Gate A not passed**; no false assertion of ten unique moving angles.

## Actual local media proof (provided as separate Agent B ZIP through ChatGPT)
- `STO-B-LANDSCAPE-REAL-FOOTAGE-EDIT-PREVIEW-SILENT.mp4` is a *locally rendered FFmpeg/OpenCV offline look/timing preview using the actual shots*, NOT a native Remotion render nor the final C master.
- Native `1920×1080, 30/1 fps, 316 frames, 10.533333s` FFprobe; full FFmpeg decode and blackdetect run. No soundtrack by design.
- 14 actual selected 1920×1080 H.264 source clips in `public/sto-v10/shot-01.mp4` … `shot-14.mp4`, source SHA256 records and real source time ranges in `shot-map-landscape.json`.
- Storyboard/contact sheet `selected-shot-frames-contact-sheet.jpg` is supplied in ZIP. These clips have punch/whip style timing FX in real Remotion source but don't imply any missing angle was created.

## Reproduce from original Agent A ZIP in any connected runner
```bash
python production/videos/huracan-sto-v10-001/prepare_landscape_assets.py --zip HURACAN_STO_LANDSCAPE_FOOTAGE.zip
node --test production/videos/huracan-sto-v10-001/edit-landscape.test.cjs
node production/videos/huracan-sto-v10-001/validate-landscape-edit.cjs --assembly
npm ci && npm run check
npx remotion render src/index.ts HuracanSTOLandscapeCandidate out/STO-landscape-candidate.mp4 --codec=h264 --pixel-format=yuv420p --concurrency=1
```
Keep `HuracanSTOLandscapeRelease` gated until independently verified 10+ real moving STO camera angles are acquired and map evidence is updated.

## To Agent C — audio and final render
Use new Agent B source SHA and `HuracanSTOLandscapeCandidate`; **do not import old portrait composition**. Provide music with exact SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678` and authentic STO V10 recordings. Sync engine accents 0–2.6s and at **frame 78**; mix/remux separate 48-kHz stereo AAC, not silent clip source audio. Keep timing 316 frames at 30 fps and 1920×1080. Ensure final media decode, beat/camera review, blackdetect, silence and rights/identity checks. **This is not signed-off final footage**.

## To Agent D — remaining shots
Need genuinely distinct STO front/side/rear track performance, full-car speed passes, verified night or low-key driving and 4K originals where possible. Current package is dominated by showroom, daylight road and slow rear angles. The 720p Monaco clip includes other race-car variants and cannot fill the STO-only gate without frame-level identity verification. Audio source remains Agent C scope. 
