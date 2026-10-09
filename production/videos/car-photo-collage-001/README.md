# Automotive Photo Collage 001 — THE ART OF SPEED

Twenty-second / 600-frame / 1080×1920 / 30fps photo-editorial film.
This is a standalone composition in `Remotion-gpt-chat`, not YUNEX.

## Reproduce

```sh
python -m pip install Pillow==11.3.0
python production/videos/car-photo-collage-001/fetch_assets.py
python production/videos/car-photo-collage-001/make_audio.py
npm ci
npm run check
python production/tools/render.py --composition AutomotivePhotoCollage001 --mode final --output out/car-photo-collage-001.mp4 --concurrency 2
```

Six authentic Wikimedia Commons photographs (not AI-generated) are downloaded by filename from `upload.wikimedia.org` and graded / resized locally for compositing. See `assets.json` for author, original source, and license. `provenance.json` generated during build records checksums and pixel dimensions. The derived images are not stored in Git (the workflow re-fetches the same declared sources).

**Photo rights:** Each image is CC BY-SA 4.0, credited individually in `assets.json`. The collage adapts those works by cropping, colouring, layering and animation. Redistribute the resulting **visual adaptation** under CC BY-SA 4.0 with attribution; production code remains separately licensed as applicable. Original soundtrack and edit elements authored for this project. Refer to https://creativecommons.org/licenses/by-sa/4.0/ for the binding terms.

## Design

* Intro: Porsche full-bleed editorial card with staggered supporting snapshots.
* Explosion: six cards entering at different depths and angles, individual labels.
* Showcase: three hero moments with oversize wide photo and layered mini-frames.
* Montage: beat-paced recomposed six-up grids, photographic parallax and masked texture.
* Ending: full six-photo collage with a concise closing title.
* Original synthesized low-key sound bed, punctuated by soft hit / whoosh moments.
* Workflow generates contact sheet and decodes / probes final H.264 MP4.

Workflow: `.github/workflows/car-photo-collage-001.yml`.
