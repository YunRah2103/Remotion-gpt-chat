# Agent B — Actual landscape STO edit handoff (10 October 2026)

## 10–11 October 2026 V3 — USER'S NEW FORMAT67 NIGHT MOVIE (IMPORTANT)
User uploaded original `HURACAN_STO_AGENT_B_NIGHT_CINEMATIC_SOURCE.zip` (one real filmmaker source `format67_sto_directors_full.mp4`, 75.72s, 25fps, **1920×810 native cinemascope**, checksum `4c47e642babedfce0c7bd1cf60fa15a397b60679d430c534f5def4792738bfa3`). Inspected at regular intervals across original; excluded all swimmer/face/underwater/copy/logo scenes and all post-67s branded end credits. It has actual night/smoke/reflection footage, high-quality red/white STO closeups, and some white car container-yard motion. No accurate claim of pure race-track acceleration. Movie rights NOT GRANTED by source metadata.

A stronger **V3 selected-source timeline** is committed in `shot-map-landscape.json`, with **10 selected shots from new FORMAT67 film** and 4 shots from original native-FHD Agent A Phantom source videos. Every slot is a real source time window; frame 78 reveal replaced with **red STO full-car moody nighttime beauty** (mostly stationary), ending with red STO in night smoke. Full duration/fps/reveal remains **1920×1080 / 30fps / exactly 316 frames / frame 78**. All model/car footage; no overlays/HUD/misidentified swim/title scenes. Blue / red / white STO body colours across shots are real colour differences, not claimed one car. **Still fewer than 10 independently VERIFIED moving camera angles; Gate A and B formal release remain unpassed.**

Cinematic **810p height** original is NOT a native Full-HD video. To meet the required 1920×1080 output canvas without letterbox bars or changing the aspect of the car: uniformly upscale 1920×810 to 2560×1080 (**1.333×**) and crop 1920px horizontal window centred on car (per-shot `sourceCropX`), without stretching or black bars. Each shot's `aspectTreatment` and the source `native1080:false` are recorded machine-readably. This is a **scaled source**, not native 1080p; no claim of added original detail.

Local reproduction:
```bash
python production/videos/huracan-sto-v10-001/prepare_landscape_assets.py --zip HURACAN_STO_LANDSCAPE_FOOTAGE.zip --night-zip HURACAN_STO_AGENT_B_NIGHT_CINEMATIC_SOURCE.zip
node --test production/videos/huracan-sto-v10-001/edit-landscape.test.cjs
node production/videos/huracan-sto-v10-001/validate-landscape-edit.cjs --assembly
npx remotion render src/index.ts HuracanSTOLandscapeCandidate out/STO-B-V3-NIGHT-LANDSCAPE-REMOTION-SILENT.mp4 --codec=h264 --pixel-format=yuv420p --concurrency=2
```
GitHub Actions runner reproduces the same 4 source bytes directly from publisher original URLs, verifies all hashes, frame locks each of 14 outputs, renders native 16:9 Remotion and decodes final. Music + isolated verified V10 engine remain Agent C scope; use **V3 NIGHT** visual (NOT old V1/V2) when available.

## 11 October editing revision: retimed landscape candidate V2

The original `HuracanSTOLandscapeCandidate` was reviewed at the start and midpoint of **every** shot. Five cuts needed stronger subject framing or had obvious repeated/empty-road content. Corrected at branch commit `2bdb1cc618bb3efc554083f3f4bfadc70be32f75`:
- Slot 04: show genuine STO headlight/livery detail instead of unfocused interior-to-wing pan
- Slot 06: begin a more legible low-front STO approach instead of distant empty paving
- Slot 08: tighten the later approaching shot so the vehicle enters frame sooner
- Slot 11: replace nearly empty brick ground with an actual close moving STO pass
- Slot 13: close rear three-quarter/wing perspective rather than reusing another wide rear shot

All edits retain actual STO source bytes, natural 16:9 geometry, exact 316-frame beat windows, SHA-pinned originals, no invented angles, no on-screen UI, no audio. Distinct approved moving-angle count remains **zero** until Agent A/D verification. V2 native visual QA will be reported separately; don't confuse this code edit with a passed film preview.

**Critical for Agent C:** Your sound renderer currently hardcodes portrait geometry in three places: `sto_sound_render.py` line 62 `(1080,1920)`, line 133 `(1080,1920)`, and argparse help line 163. Update to **(1920,1080)** on your OWN branch and rerun your fixture tests against native landscape picture; the current C code will reject this valid user's 16:9 film.

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
