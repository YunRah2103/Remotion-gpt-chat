# YUNEX Porsche · Blender reveal

Original 479-frame, 1080×1920, 30 fps Blender film using the approved white/Python Green 992 GT3 RS. A native solid-shaded opening switches to Cycles at frame 214, followed by cinematic moving shots. Audio is copied from the user's uploaded reference; no new engine noise, music or normalization is added.

## Reproduce
Use the official Blender 4.0.2 Linux build with its bundled NumPy and OpenImageDenoise, plus FFmpeg, Xvfb and Mesa/EGL graphics libraries. The Ubuntu Blender package lacks the required denoiser. Download the source car from `YunRah2103/yunus-video-lab/cars/porsche-911-gt3-rs-992/model.glb`, without changing that repository. Verify SHA-256 `1c73fcb138c31e2b1d5ed126a2412074bb17f8e960b355436f28139bf518e1eb`.

```bash
xvfb-run -a blender -b -t 4 --python-exit-code 1 --python scene.py -- --model /path/to/model.glb --out /path/to/frames --frames 0:478 --samples 32 --save
python3 finish.py --frames /path/to/frames --audio reference-audio.m4a --out /path/to/final
```

The saved `.blend` contains the reusable forest, canonical car and baked camera/wheel motion. The deterministic `scene.py` renderer chooses Workbench or Cycles per frame; direct Render Animation of the saved scene uses Cycles throughout. Use the script to reproduce the complete solid-to-cinematic reveal, and `finish.py` to retain the original AAC packets exactly.

Full render is isolated on `automotive-edits/porsche-blender-reveal-001/master`. The final workflow renders non-overlapping frame ranges and assembles them only when all ranges succeed. Checks include complete frame coverage, exact frame count/resolution/fps, full video/audio decode and every reference audio packet hash.

The original Porsche model credits Ddiaz Design; see its source repository's car README and licence. Geometry, livery and embedded materials are retained. This film adds forest-road environment, camera/vehicle/wheel animation and lighting.
