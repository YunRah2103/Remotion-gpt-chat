# YUNEX EP003 — Agent 1: real tyre-failure mechanics

## Two real native previews and validation

**First successful render (obsolete straight-line fixture, visual QA flagged framing):**
[GitHub Actions run 39285525903](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39285525903)
produced two H.264 540 × 960 MP4s at 30 fps from **1080 × 1920 source compositions**:

- `EP003TyreMacro.mp4`, 120 frames / 4.0 s, FFprobe + complete FFmpeg decode PASSED.
- `EP003TyrePortrait.mp4`, 204 frames / 6.8 s, FFprobe + complete FFmpeg decode PASSED.

Five PNGs per clip showed independent image changes. The initial portrait cut was **visually rejected** because the car was significantly cropped and the initial motion used a straight-line fixture. Do not use that artifact for artistic sign-off.

**Revised native review render:** automatically triggered by commits on branch
`agent/ep003-01-mechanics` via `.github/workflows/yunex-ep003-agent1-mechanics.yml`.
Its actual run/artifact links and visual QC must be recorded in PR #202 and Issue #194 **after** successful verification. The native CLI/FFprobe/full-decode runner is `previews/agent-1/render-previews.mjs`.

```bash
npm ci
npm run check
npx --no-install tsc --noEmit -p previews/agent-1/tsconfig.json
node --experimental-strip-types --test tests/agent-1/*.test.mjs
npm run worldkit:test
npm run partskit:test
REVIEW_SCALE=0.5 node previews/agent-1/render-previews.mjs
# Full 1080×1920 output: REVIEW_SCALE=1
```

GitHub workflow artifact holds both actual MP4s, ten extracted frames, SHA256 sums,
codec metadata and full-decode verification. Direct release links may also be provided
by the independent QA Agent in PR #204.

## Authoritative Agent 2 model

**Agent 2 PR #199 owns the actual dynamics.** Because PR #199 is not merged into
the integration base yet, Agent 1 review previews use
`mechanics/agent2-dynamics-snapshot.ts`, an exact copy of Agent 2's
`dynamics/model.ts` at source commit
`197e02ca94c9d9687f8cc43dac3d89173eb4dfd2`.
The body/4 wheels use its actual `sampleDynamics(tSec)` states:
`positionM`, yaw/roll/pitch, `hubWorldM`, `spinRad`, steering,
`rollingRadiusM`, and `verticalCompressionM`.

The pinned source snapshot is **a temporary branch-integration adapter**,
not a second/new simulation or an Agent 1-owned dynamics implementation.
When manager merges Agent 2's PR, replace the import in
`TyreFailureWheel.tsx` with `../dynamics/model.ts`, then remove the pinned
snapshot. This must be done before final creative approval.

When dynamics is supplied, `TyreFailureWheel` trusts Agent 2's loaded
rolling radius (0.300 m fully failed for this illustrative model),
*not* its own 0.300 m fallback. There is no double support loss.
The approved original metal rim outer lip (~0.278 m) has roughly 22 mm clearance.
The supplied constant preview scene translation moves body and every wheel hub
identically, without resetting/synthesizing Agent 2's physical motion.

## Mechanical implementation

`TyreFailureWheel` / `TyreCutaway` retain the original reusable
`grand-tourer` steering pivots, wheel-roll, rims, calipers, rotor and tyres.
Only cloned, existing rubber/groove/bead buffers are deformed. The contact
flat spot is computed in the road frame after real per-wheel spin; restrained
sidewall bulging and fine creases follow rubber material. The exposed
double-wishbone from the PARTS kit is driven by Agent 2's front-right
`verticalCompressionM`. Geometry is deterministic under arbitrary seeks.

`EP003TyreMacro` frames the damaged front-right wheel and optional exposed
suspension. `EP003TyrePortrait` uses three deliberately edited
vehicle-context camera compositions that follow the authoritative trajectory.
Both are absolute-time 1080×1920 at 30 fps, share the scene paint/environment,
and avoid changing any approved asset source.

### Limits

The physical model is **illustrative**, not a vehicle-safety simulator or
measured tyre response. An MP4 passing FFprobe, full decode and frame variation
is **not** by itself visually approved. In particular, inspect real pixels
for road penetration, alloy rim clearance, car cropping, contact behaviour and
camera cut quality. User / Agent 0 has final acceptance authority.

## Latest Agent 0 directive (Issue #194)

The latest visual correction increases the **axial sidewall ballooning** of the original lathe tyre only in a shoulder band (radii 0.282–0.359m). The inner band next to the preserved metal lip and the tread shoulder remain fixed to the original original rubber structure. The dent itself stays world/road-fixed under actual Agent 2 wheel spin; 4mm maximum rubber-fold amplitude follows the rotating material. Under integrated dynamics the road clip cap is computed from **actual Agent 2 world-space hub altitude**, not from a second guessed support drop. A complete native render and full video review are mandatory to confirm these actually read on mobile.

**Agent 3** exports `sampleCinemaCamera` and a cross-integrated `CinematicScene` from branch `agent/ep003-03-cinema`; it already overlays this Agent 1 original rubber rig and **Agent 4 `EpisodeLight`** in the coordinated composition. Integration should inspect 0.75s onset / ~1.05s post-collapse at the Agent 3 wheel macro angle. Standalone Agent 1 preview uses the approved baseline `WorldLighting` and deliberately does not import A3/A4's unmerged module trees into this branch. No original world-kit, PARTS kit or Episode contract files were edited.
