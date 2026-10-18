# Agent 4 — Cinematic look development V2

**Scope**: `src/yunex/braking200/lookdev/**`, unchanged original car geometry.
The prior V1 `BrakingLookdev` instantiated a duplicate car and track and
its macro hid the actual brake assembly. V2 corrects both issues.

## Real integration contract

Inside the same existing `<ThreeCanvas>`, first render **A3's existing
`Environment`** and **A1's `BrakingVehicle`**, followed by:
```tsx
<BrakingLookdev route={carPose} state={sampleBrakingSimulation(timeSec)} />
```
- `BrakingLighting` is a standalone named component replacing kit lighting.
  Do **not** render the kit WorldLighting at the same time.
- `BrakingFinishes` finds the already-mounted named instances
  `YUNEX-grand-tourer` / `YUNEX-track` in the active scene, applies cloned
  PBR materials only once per mesh, updates very low disc-face emission based
  on **Agent 2's `state.brakeHeatJ` AND current brake pressure/speed**, and
  restores originals/disposes clones when unmounted. **No duplicates**.
  The amount is an illustrative light cue, *never actual rotor temperature*.
- For callers needing explicit control without React hooks:
  `applyBrakingFinishes(existingRoot,'car'|'track')` returns an idempotent
  disposable finish handle `{setHeat,dispose,touchedMeshes}`. Apply to a real,
  privately owned object only; call `dispose()` **before** the owner
  destroys the original kit mesh. Do not double-apply.
- `BrakingContactShadow`, `createTrackDressing`, `createAsphaltGrain` are
  purely additional episode props and do not re-model or replace the circuit.
- Preview drive constant speed is **not** a physics stop; actual A1 macro and
  A2 state are composed on the non-mergeable proof-only integration branch
  while A1/A2 PRs are unmerged. This branch's source must never be confused
  with A4's owned reviewable PR.

## Isolated tests and previews

```bash
npm run check
node --experimental-strip-types --test src/yunex/braking200/lookdev/lookdev.test.mjs
npx remotion render src/yunex/braking200/lookdev/entry.tsx BrakingLookdevContext out/a4-v2-context.mp4 --gl=swangle --scale=0.5 --codec=h264 --pixel-format=yuv420p
```
The V2 **actual macro** is only rendered in the QA-only proof branch using
Agent 1's ventilated disc / stationary caliper, mounted with Agent 2's deterministic
physics state. The proof branch keeps peer files unmodified and excluded from
PR #153. Verify FFprobe/full FFmpeg decode and sample real motion frames before
marking ready for manager review. No preview with a hidden stock wheel qualifies.
