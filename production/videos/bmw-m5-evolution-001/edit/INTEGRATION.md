# BMW M5 Evolution 001 — Agent B editing contract

**Use after Agent A supplies 42 genuinely different, verified moving clips.**
The protected song must remain in the private editor workspace. This branch contains no copies of the song, no source MP4s and no full finished film.

## Import from Agent B

- \`src/bmw-m5-evolution/M5EvolutionFilm.tsx\`: \`M5EvolutionFilm\` React Remotion composition; width **1080**, height **1920**, fps **30**, duration **552**.
- \`src/bmw-m5-evolution/timeline.ts\`: typed \`M5Shot\`, frame-locked beat map, generation guard, source-uniqueness rules, default resolution-aware framing.
- \`src/bmw-m5-evolution/preview-entry.tsx\`: a **diagnostic-only** standalone Remotion entry; does NOT touch central \`src/Root.tsx\`.
- \`src/bmw-m5-evolution/index.ts\`: public exports.

## Source adapter

Master C should place footage files in a **local/private** Remotion public media directory or map accessible secure media into local \`public/\` staging. Build an \`M5Shot[]\` with one record per beat (slot 1..42). Supply \`file\` paths relative to Remotion \`public/\`; start time in seconds; *native* width, height and fps; a 64-character source SHA; true identity/motion verification flags; a unique camera/setup \`shotKey\` and distinct \`visualFingerprint\`; \`sourceId\` and vehicle gen. Six clips per generation exactly, in E28, E34, E39, E60, F10, F90, G90 order.

\`validateM5Shots\` rejects missing or duplicate slots, wrong generations, unverified car identity/motion, repeated camera setup keys, reused visual fingerprints and overlapping time ranges from the same source. Crucially this is **metadata verification**, not optical footage analysis: C still must check the actual video for non-repetition and wrong cars.

Source strategy auto-selects full-bleed for native portrait / 4K sources, and editorial widescreen panels for low-resolution landscape archival footage. Width/height are metadata, no source recompression is performed by B. Master may explicitly override \`strategy\` when verified, or tune \`x\`/\`y\` from 0..100 for focusing grille/wheels without sacrificing clipping safety. Timeline may be imported and evaluated with zero multimedia.

### Master-owned integration example

\`\`\`tsx
import {M5EvolutionFilm, DURATION, FPS, WIDTH, HEIGHT} from './bmw-m5-evolution';
import type {M5Shot} from './bmw-m5-evolution';
import shots from '../production/videos/bmw-m5-evolution-001/footage/approved-render-shots.json';
// Convert Agent A's real manifest to M5Shot[] if necessary and verify file presence.
<Composition id="M5EvolutionFinal" component={M5EvolutionFilm}
  width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={DURATION}
  defaultProps={{mode:'production' as const, shots: shots as M5Shot[]}} />
\`\`\`

Register in \`src/Root.tsx\` **only in Agent C's branch**, not B. The film intentionally does **not** call \`<Audio>\`; Agent C handles separate authorized 18.4s WAV mux at 48kHz, then runs audio/perceptual QA.

## Visual direction

Vintage E28/E34 receive editorial wide picture fields rather than fake high-resolution crops. E39 is the visual bridge. E60 and F10 sharpen kinetic movement. F90 and G90 take near-immersive full-bleed frames when the source resolution allows. Deliberately different graphic accents follow six camera beats per generation: grille/nose, wheel, profile, rear, rolling, hero. No HTML playback, HTML grids or endless repeated panels. Outgoing footage ends the frame before a new beat; each new beat is a fresh \`<Sequence>\` and \`<OffthreadVideo>\`, with only short decorative wipe/flash accents *over* the new footage. Chapter labels are limited to ~1s at each generation transition and stay in social-safe center zones.

## Diagnostics, not finished video

\`\`\`bash
node production/videos/bmw-m5-evolution-001/edit/test-timeline.mjs
npm ci
npm run check
npx remotion still src/bmw-m5-evolution/preview-entry.tsx M5EvolutionDiagnostic /tmp/m5-diagnostic-frame.png --frame=470 --browser-executable=/usr/bin/chromium
npx remotion render src/bmw-m5-evolution/preview-entry.tsx M5EvolutionDiagnostic /tmp/m5-diagnostic.mp4 --frames=460-495 --codec=h264 --pixel-format=yuv420p
\`\`\`

Diagnostic mode visibly says **UNVERIFIED / NO FOOTAGE**, uses purely generated moving graphics, and never implies BMW vehicles are featured. It is appropriate for timing/proof **only**. Native commands require repository npm dependencies and a browser. Do not publish diagnostic material as a completed automotive film.

For final QA: inspect every beat's first/middle/last frame and source quality, compare contact sheets with Agent A, verify H.264 1080x1920 30fps 552-frame exact decode, assess audio alignment by listening, and prefer CRF 16-18; only C handles delivery.
