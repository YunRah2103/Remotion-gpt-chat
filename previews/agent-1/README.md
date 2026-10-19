# YUNEX EP003 — Agent 1 mechanical package

**Status:** implementation committed; **not rendered or artist-approved yet**. The
branch produces exactly two isolated Remotion compositions, without touching
core entrypoints or approved asset source:

- `EP003TyreMacro` — 4 s / 120 frames, original front-right wheel, deflation,
  stationary ground contact patch, moving tyre and exposed double-wishbone.
- `EP003TyrePortrait` — 6.8 s / 204 frames, original grand-tourer, moving highway,
  front-right failure visible by 1.05 s.

Both are declared at **1080 x 1920, 30 fps**. The preview-only straight
translation and wheel speed are labelled *ILLUSTRATIVE MOTION FIXTURE — NOT
AGENT 2 PHYSICS* in the clips. The clip-time event at 0.75 s and fall over
0.30 s are editable parameters; **not** final narration timing.

## Rendering and verifying native moving MP4s

Run from the repository root (requires npm + Chrome/Remotion installed):

```bash
npm ci
npm run check
npm run worldkit:test
npm run partskit:test
node --experimental-strip-types --test tests/agent-1/*.test.mjs

# Actual moving native H.264 Remotion previews, two outputs, decode + frame checks:
REVIEW_SCALE=0.5 node previews/agent-1/render-previews.mjs

# To render the full native 1080x1920 source:
REVIEW_SCALE=1 node previews/agent-1/render-previews.mjs
```

Expected output after **real execution**: `out/ep003-agent-1/EP003TyreMacro.mp4`,
`out/ep003-agent-1/EP003TyrePortrait.mp4`, ten PNG frame grabs and a
`preview-validation.json` report including source dimensions, actual decode
metadata and sampled-frame hashes. Upload the **real** media files as accessible
Actions artifacts/links and review the videos before marking #194 approved.

For individual renders:

```bash
npx remotion render production/yunex/tyre_blowout_ep003/mechanics/preview-entry.tsx EP003TyreMacro out/agent1-macro.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render production/yunex/tyre_blowout_ep003/mechanics/preview-entry.tsx EP003TyrePortrait out/agent1-portrait.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
```

## Shared API and integration with Agent 2

- `sampleTyreFailure(tSec, params): TyreFrame`: absolute deterministic pressure,
  compression and loaded radius, with initial radius 0.36 m and maximum
  illustrative loaded support loss 0.060 m. Post-failure contact clearance to the
  **outer metal rim lip** is ~22 mm, not 30+ mm.
- `sampleRubberVertex([x,y,z],frame,kind)`: deterministic world-contact kernel.
  The flattened region is ground-fixed even as the rubber and existing rim rotate.
- `TyreFailureWheel`, `TyreCutaway`: reusable R3F components.
  Pass `tSec`, and ideally the same `dynamics` / `tyreFrame` sampled by
  Agent 2; the wheel spin then comes from `dynamics.wheels[wheel].spinRad`,
  and wheel hub placement comes from `hubWorldM`. The optional
  `exposure` controls double-wishbone visibility. No lateral/yaw trajectory is
  authored in this package.
- `prepareTyreRig` / `applyTyreFrame`: lower-level reusable integration for
  cameras wishing to control their own Three scene hierarchy.

Existing `createVehicle('grand-tourer')` objects, steering pivot, wheel-roll,
tyre mesh, outer tyre grooves, rim barrel, brake disc, caliper, hub and suspension
PARTS-kit are reused. Only **cloned rubber mesh geometry** is deformed.
There are no detached/replacement wheels and no fading tyre explosion.

## Limitations and sign-off gates

The existing wheel mesh is stylized, not a tyre FEM model; pressure ratio,
radial flattening and suspension travel are **illustrative**, not empirically
validated. Source wheel has a 0.278 m outer metal rim-lip radius; do not reduce
loaded hub height below it. Tyre rotation and camera preview movement are
temporary until Agent 2's authoritative dynamics package is ready. No claims of
real tyre forces or measured stopping distances are made.

Agent 0 must inspect *both* actual MP4s and staged PNG frames for deformation
quality, mesh self-intersection, body occlusion, rim clearance, wheel motion,
camera framing, visual polish and survival after FFmpeg full decode. The render
script checks pixel changes and decode only; it cannot substitute for human QA.

**Rendering limitation in this session:** the local execution container has
neither Remotion/Three npm dependencies nor network access to npm/GitHub, so
native MP4 execution is not verified here. Do not mark RENDER VERIFIED until
the render command succeeds on a fully provisioned runner and results are
actually watched.
