# GPU POLISH05 B — independent POLISH04 pixel baseline

**This is an observed baseline audit, not POLISH05 final QA.** Independent POLISH04 GitHub official release download completed from run **37846669872**, artifact **11579249363**. Official full MP4: `XFX-SWIFT-RX9060XT-POLISH04-15S.mp4`, locked SHA256 `ec4323d7b3671261f5a5c21c2abaf54f239ca19817f8026ee82e29c6f5870980`.

## Actual local verification
- Independently downloaded official GitHub artifact ZIP, unpacked and checked all five published `SHA256SUMS.txt` file digests: PASS.
- Independently used `ffprobe` on exact official MP4: 1080×1920 H264 `yuv420p`, 30/1 fps, 450 frames, 15.000000 s; AAC stereo 48 kHz. Full `ffmpeg -v error -xerror -i ... -f null -` native decode PASS.
- Actually decoded observed frame positions 0, 60, 135, 180, 225, 270, 365, 449 and assembled a contact sheet for director review. These are the actual film's native moving camera states, not architectural guesses.

## Observed cinematography to preserve
- Low three-quarter opening has a convincing black triple-fan silhouette; real circular blade and front shroud catch purposeful reflections.
- Transition at 135 separates physical fans and improves depth; progressive stagger is more intelligible than static exploded technical art.
- Early cooling reveal around 180 has good raking macro view, a comfortable dark charcoal backdrop and stable editorial hierarchy.
- Frames near 449 recover a readable diagonally staged complete assembly, with a large physical GPU footprint compared to the distant earlier versions.

## Observed deficiencies POLISH05 should genuinely improve
- Screen-space occupancy remains uneven due a long horizontal board in 9:16: huge relatively empty portrait margins in multiple establishing stages, especially top half. Avoid stretching or automatically zooming full GPU beyond the frame; use motivated macrophotography and editorial transitions.
- Around frames 180–270 the under-shroud / cooler details remain stylized and relatively flat. Individual heatpipes, fin-stack depth, die, VRAM and PCB surface technology are not convincingly distinct at normal phone size. A must deliver physically deeper visible geometry and differentiated PBR shading.
- Several macro shots show fan faces occluding the internal components that are supposed to be the subject. When final A GLB arrives, determine whether focus is on *actual* PCB silicon/VRM or foreground fan/shroud, then retune target framing.
- Final frame 449 is dramatically diagonal, but lower foreground fan/cooler overlap slightly reduces exploded mechanical clarity. Avoid making the finale smaller again (historical rejection); solve optically through final A geometry and camera proof, not by deleting meshes.
- Artful internal construction is **not** proof of XFX manufacturing accuracy.

## POLISH05 acceptance comparison
Use *matched* native 1080 screenshots at 0 / 135 / 180 / 225 / 270 / 365 / 449 and 2 moving moments (fan release / full explosion), plus A's real Blender isolated component proofs. New materials, heatpipe curves, GPU/VRM details and separated components must show measurable visual improvement in scene pixels rather than merely in an object count. At native final integrated proof, new model MUST be used, not a temporary old-GLB smoke.

**This audit preserves the accepted POLISH04 visual foundation.** No visual or release approval of POLISH05 is implied.
