# Agent D — Porsche 911 Turbo Evolution master integration

**Status: NOT FINISHED.** This document accompanies real master integration code. A playable Porsche MP4 must not be claimed until all release gates pass and all 30 moving beats are watched.

## Reviewed user reference

Inspected the actual uploaded BMW M5 clean edit: 18.412993 seconds, 1080 x 1920, 30fps, 552 frames, HEVC/AAC. The successful visual identity is authentic motion on every beat, source-preserving landscape video presented within a dark blurred same-source fill, and little upper-left white generation labels with no HUD. Porsche improves angle matching, transition restraint and original picture quality, without copying any BMW pixels or media.

## Master code completed

- Registered separate Remotion composition PorscheTurboEvolution001, 510 frames / 1080x1920 / 30fps.
- Central scene is src/porsche-turbo-evolution/integration/PorscheTurboMaster.tsx.
- Locked all 30 frames-aligned slots to the committed Porsche beat-map.json.
- Production mode rejects missing or repeated shots, generations out of order, overlapping source spans, unsafe video paths, missing SHA256 provenance and unverifiable identity/motion. These guards do not replace actual film review.
- Preserved genuine source picture field instead of cropping all landscape cars to narrow vertical slices; blurred moving background is sourced from the SAME shot.
- Small white generation label only, no UI overlays or big titles.
- Built chapter-only subtle effects from the installed FX Toolkit, not its synthetic showcase.
- Diagnostic mode has an unmistakable missing-footage watermark.
- Original song WAV remains private. Never commit private copyrighted audio or source clips to public Git or an Action artifact.

## Dependencies and blockers at implementation time

The A/B/C branch heads were all the untouched contract SHA bdd17b2c127a0055bba09b6b46f4bcc442a459db. No source clips, genuine agent handoffs, or footage artifacts were supplied. **Do not simulate the completed Porsche film.** Re-check handoffs and branch SHA before integration.

## Completion sequence

1. A supplies 30 verified, different original moving Porsche 911 Turbo/Turbo S coupe camera setups, accurate chapters (930 x4; 964 x4; 993 x4; 996 x4; 997 x4; 991 x5; 992 x5), a source manifest with visual fingerprints, real source SHA256 and local media transfer. URLs are provenance, not public licensing.
2. B supplies the actual timeline adapter/angle-matching choices. Merge B's exact tested commit without overwriting Agent B's owned files. C supplies native proof and selective approved real-source transition/grade decisions.
3. Privately stage actual source files under public/private-porsche/ on the render worker only. Create props.json for production mode with 30 TurboShot objects, source-relative paths, validated hashes, source resolution and trim times. Private media and original audio must not be committed to public GitHub.
4. Run npm ci --no-audit --no-fund and npm run check; inspect real 7-era stills, moving 24–60 and 420–485 intervals and inspect shot uniqueness manually.
5. Render full 510 frames: npx remotion render src/index.ts PorscheTurboEvolution001 out/porsche-visual.mp4 --props props.json --gl=swangle --codec=h264 --pixel-format=yuv420p --crf=16 --concurrency=2 (check flags on installed CLI).
6. From the user-supplied editor ZIP, use the verified private 17-second / 48000Hz / stereo / PCM24 WAV with SHA256 39b8d7eef63b1c67cb14108484de8a63508149f64b6d3b84b7f7252dcd0bcdc9.
7. Mux original audio without re-encoding video:
   ffmpeg -y -i out/porsche-visual.mp4 -i private/Porsche_911_Turbo_Evolution_17s_48k_master.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -ac 2 -t 17 -movflags +faststart out/porsche-private-review.mp4
8. Run native release gate:
   python production/videos/porsche-911-turbo-evolution-001/integration/verify_master.py --manifest PRIVATE_A_MANIFEST.json --media-dir public --audio private/Porsche_911_Turbo_Evolution_17s_48k_master.wav --video out/porsche-private-review.mp4
9. Independently inspect all 30 beats: true Turbo model identity, genuine different moving view, sharpness versus source, no black/frozen frames, subtle effects, audio impact timing, clean white label and final frame. Record C's independent final QA.
10. Deliver the actual playable private 17.0s MP4 as a verified accessible file; do not upload unlicensed user media to public artifacts.

Passing diagnostic rendering, unit tests or frame geometry does not establish an actual Porsche footage release.
