# V2 vertical slice — verification record

## Source and compatibility

Started from production/yunex-ep004-base, commit
`d5c238fb2ae2f07acad54a85db6c2f3594dcc598`, containing 35 vehicles,
20 worlds and 55 part variants. Only new modelling-kit files, tests, scripts,
documentation and its dedicated workflow are proposed. EP003/EP004 files and all
legacy factories are unchanged. No third-party models or textures were downloaded.

## Completed checks

- TypeScript: `npm run check` passed.
- Combined tests: 70 passed, zero failed (59 existing + 11 V2).
- A subsequent V2 run after final spark tuning: 11 passed, zero failed.
- Six intact/mechanical GLBs exported and roundtripped through GLTFLoader; four
  rolling wheels per hero, finite geometry and valid bounds verified. GLBs are baked
  poses, not serialized V2 simulation rigs. Files are approximately 6.7–9.9 MB each.
- All six native local MP4 inspection exports fully decoded with FFmpeg. FFprobe
  verified H.264, yuv420p, 12 fps, correct dimensions, frames and durations.
- Central-image samples every 0.5 s changed throughout all six exports. This is
  movement evidence, not an automatic assertion of visual quality.
- Representative native frames and dense MP4 contact sheets inspected: intact to
  collapsed tyre continuity, restored geometry, spark contact/cutaway/rebound,
  wheel framing and vehicle identity. Portrait overview framing was widened after
  the first inspection. Failed-tyre rings, rim road penetration, material fade
  cross-talk and overly subtle sparks were corrected during review.

## Preview catalogue

| Demo | Landscape | Portrait | Duration | Frames |
| --- | --- | --- | --- | --- |
| A — three vehicle detail tiers | 960×540 | 540×960 | 9 s | 108 |
| B — tyre pressure loss | 960×540 | 540×960 | 6 s | 72 |
| C — Formula skid contact | 960×540 | 540×960 | 6 s | 72 |

The source compositions are 1920×1080 / 1080×1920 at 24 fps. These explicitly
reduced-resolution, 12 fps exports are CPU inspection media, not finished episodes.
The demos are silent. No original episode audio/footage was changed.

Landscape MP4s are retained in [previews](previews/). The GitHub Actions artifact
includes all six orientations, native PNGs, GLBs, timings and machine-readable
reports. Local final hashes/movement evidence: [video-qa.json](video-qa.json).
The full output can be regenerated using the dedicated workflow.

## GitHub execution

The initial implementation commit `1992888f8b25e26efc651068983e170c7ea2d8d3`
passed the [native kit workflow](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39632850961)
and the repository's composition-aware PR review. Its
[artifact](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39632850961/artifacts/12361826342)
contains six MP4s and GLBs. The final local Formula previews use stronger sparks
than this initial artifact; the rerun on the updated commit regenerates them.
Do not describe an earlier run as proof for a later commit.

## Performance and practical limits

[performance.json](performance.json) records local build/update measurements and
geometry counts. Hero geometry totals (including hidden section meshes) are about
170k / 182k / 126k triangles for hot-hatch / supercar / Formula, respectively.
The geometry/material counts are not a GPU draw-call benchmark. Measured average
24-frame CPU updates were about 1.6–10 ms on this shared host; these timings are
illustrative, not a hardware guarantee. Software-WebGL exports remained feasible,
with 6–9 s clips taking roughly 1–5 minutes depending on concurrent load.

## Assessment and unfinished work

This delivers reusable mechanics and inspection detail. It does **not** yet meet
the brief's complete premium body-modelling or all-environment overhaul target.
The existing road-car bodies remain angular; a dedicated sculpted exterior pass is
still needed. Contact sparks are scripted streaks; suspension is kinematic. The
road tyre collapses but is not a torn, topologically shredded carcass. Body damage
is a small local dent; the barrier bend has a regression test but no dedicated crash
film in this delivery. Exploded assemblies and highlights need episode-specific
camera review. Contact shadows and final lighting deserve further refinement.

Do not merge this draft as a claim that all 35 vehicles are hero-approved, or that
these controls are a validated engineering simulation. The lightweight tier and
existing approved productions remain available unchanged.
