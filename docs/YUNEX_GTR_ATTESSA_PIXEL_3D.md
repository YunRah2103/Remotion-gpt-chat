# YUNEX GT-R R35 — ATTESA E-TS 3D voxel explainer

Original, isometric, pixel/voxel 3D engineering short based on the user's spoken narration (27.12 seconds). 1080x1920, 30fps, 814 frames (27.133s). Built without licensed GT-R CAD, footage or 2D fake drivetrain surfaces; this is a deliberate low-poly/block-art visualisation, not mechanically exhaustive CAD.

## Narrative and timing
- 0–5 s: GT-R visual hero, title and acceleration hook
- 5–11.45 s: rear-biased baseline, rear 100% / front 0%
- 11.45–20.55 s: electronically controlled front torque engagement, animated separate forward drive path. Front share rises **up to** 50%; this is a limit, not a constant operating split.
- 20.55–27.13 s: assembled moving hero, rear-drive feeling and all-wheel traction.

The mechanical diagram is educationally simplified: GT-R front-mounted engine, rear transaxle, electronically controlled coupling and forward torque-transfer path. No claim that the GT-R permanently drives all four wheels 50:50.

## Remotion source

**Entry:** `src/yunex/attesa-index.tsx`
**Composition:** `AttesaVoxelFilm`
**Scene:** `src/yunex/AttesaVoxelFilm.tsx`
**Native preview CI:** `.github/workflows/yunex-gtr-pixel-3d.yml`.

```bash
npm install
npm run check
npx remotion studio src/yunex/attesa-index.tsx
npx remotion render src/yunex/attesa-index.tsx AttesaVoxelFilm out/gtr-attesa-3d.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
```

## Supplied narration

The user-attached narration is **not** silently replaced or fabricated. It was used in the accompanying verified, locally rendered complete MP4, delivered directly to the user. Binary upload to the GitHub repository is not available through the text-file GitHub connector in this session; the attached voice file has not been committed to GitHub.

For an audio-equipped Remotion render, copy the original MP3 to `public/gtr-attesa/voiceover.mp3`, then set `withVoiceover: true` in the composition default props. The preview workflow uses `withVoiceover: false` expressly to avoid assuming the binary file is in GitHub.

## Production QA

The local final was rendered from original offscreen 3D voxel geometry and muxed with the **exact uploaded voiceover**, plus a quiet synthesized mechanical audio bed, with 814 frames / H.264 / 1080x1920 / 30fps / AAC 48 kHz. The local master and reproducible Python renderer are delivered alongside the repository source.

The Remotion native workflow only proves source compilation and selected native WebGL moving frames; **it does not falsely claim the local VTK renderer and the Remotion output are pixel-identical**. Treat the Remotion version as the editable scene source, and re-QA its actual output before publication.
