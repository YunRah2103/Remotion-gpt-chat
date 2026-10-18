# YUNEX — WHAT HAPPENS WHEN YOU BRAKE AT 200 KM/H? | Production board

**Episode key:** `braking-200kmh-001`  ·  **Production phase:** SETUP / VISUAL AGENTS NOT YET LAUNCHED  
**Picture editor:** Agent 6, BLOCKED until five specialist approvals  
**Audio director:** Agent 7, BLOCKED until picture lock  
**Final:** `YUNEX_BRAKING_200KMH_EP001_FINAL.mp4` — 1080×1920, 30fps minimum, approx. 23–27s, H.264/AAC. **No final MP4 exists yet.**

## Source-of-truth kit and decision

- Repo: `YunRah2103/Remotion-gpt-chat`; current default `main` does **not** contain the reusable kit.
- [Kit PR #145](https://github.com/YunRah2103/Remotion-gpt-chat/pull/145) is **open/unmerged**, branch `feat/yunex-reusable-world-kit`, inspected kit commit `0e620a6cc596c897ae159b947f33e5de3e1fcaab`. Stable inspected kit provides **19 vehicles**, **15 environments**, **14 props**, reusable wheel geometry and deterministic movement.
- Additional WIP branch `feat/yunex-world-kit-v3-35-cars-20-worlds-interiors` advertises 35 variants and 20 worlds but diverges; inspection found additional catalogue IDs and separate `interiors.ts` without full world/vehicle wiring. **Do not base production on or promise working V3 expansion until it is integrated, tested and genuinely visually reviewed.**
- **All five A1–A5 branch from this contract branch** `production/braking-200kmh-ep001-contract`, which contains the inspected PR #145 kit, not `main`. If kit PR merges or changes, manager will coordinate a selective non-destructive rebase; never silently change the base.
- Selected hero car: kit `grand-tourer` in metallic blue slate `#35546e` with warm amber-metal caliper accent `#d2a36c`. Attractive generic sports GT, no manufacturer badges. Selected driving environment: kit `track`, daylight with tasteful warm highlights and readable road. Fine tune only if source preview proves a problem.
- Kit `vehicles.ts` wheel `steer-<x>-<z>` pivot is anchored at `[x, radius, z]`; the `wheel-roll` child rotates while existing `brake-caliper` is a simplified static placeholder. Do not replace upstream kit or spin caliper with wheel. A1 may hide that placeholder **only in episode-level presentation**, not alter global library for this single film.

## Shared technical contract

**Code:** [contracts.ts](../../../src/yunex/braking200/contracts.ts). Remotion 4 / React / R3F / Three.js.  
- World coordinates: **metres**, +X forward, +Y up, +Z left, road at Y=0. Hero `grand-tourer`: length 4.94m, width 1.94m, wheelbase 2.92m, radius 0.36m; front/rear wheel X=±1.46m, left/right wheel Z=±0.88m; wheel-centre Y=0.36m. Derive from `wheelAnchors(vehicleSpec(...))`, do not independently hardcode in individual departments.
- 30fps, portrait 1080×1920; provisional 750 frames (25.0 sec), final duration and scene cut points adjusted to recorded voiceover, no fractional-animation instability.
- Deterministic, arbitrary frame seek: no React `useFrame`, real elapsed clocks, unseeded random, or render-order dependence. Evaluate physics from `simTimeSec` and video from Remotion frame; explicit monotonic temporal mapping when engineering slow-motion changes playback speed.
- Physics Agent 2 **owns the one authoritative** `sampleBrakingSimulation(simTimeSec)` implementation conforming to `BrakingSimulationState`; agents 1, 3, 4, 5 consume agreed state, never invent independent speed, wheel, thermal or ABS timelines. If implementation isn't ready, use **clearly flagged temporary deterministic preview stubs**, remove them before handoff.
- Preserve kinetic relationship at every visible on-road wheel: wheel angular motion and distance travel should approximately agree when rolling; show increased slip only in the **ABS illustrative transient**. Avoid contradictory tyre rotation, static discs during moving shots, impossible caliper motion or spinning world.
- A1 brake geometry: caliper and pads stationary relative to steering knuckle; rotor rotates with the hub; pad pressure/contact linked to A2. Friction dissipates energy into braking hardware AND tyres/road, air, drivetrain, etc., not all heat instantly in one rotor. No uncontrolled cherry-red discs from one 200→0 stop; heat effects illustrative unless justified.
- ABS: pressure modulation *when impending lock is detected*, wheel keeps rotating as grip permits; ABS does not create grip or guarantee shortest stop. Show demonstration as a clearly marked **illustrative low-grip/lock-tendency insert**, not an automatic event every emergency stop.
- Environment: `<Environment kind="track" ... />` and `sampleRoute('track',distance)` from existing kit; avoid track wrapping discontinuities by shot choreography. Native R3F 3D objects inside `<ThreeCanvas>`; external graphic typography outside. Camera target, scale and lighting shared; 9:16 safe areas; no generic full-frame HUD.
- Source ownership: A1 `src/yunex/braking200/engineering/**`; A2 `physics/**`; A3 `cameras/**`; A4 `lookdev/**`; A5 `graphics/**`. Manager owns `contracts.ts` and this status. A6 owns `film/**`; A7 owns `audio/**`. Dependencies by imported module/contracts and explicit PRs; no agent overwrites another owner's files.
- Never delete, swap or replace approved car assets, other film compositions, scripts or the still-active kit PR.

## Visual story, VO working reference (not a final recording)

0–4s high-speed 200 KM/H hook → 4–8.5s wheel/brake reveal → 8.5–12.8s friction/energy to heat → 12.8–16.8s tyre/road grip → 16.8–21.7s lock tendency and ABS pressure modulation → 21.7–25s cinematic stop. **Timings illustrative, not approvals.**

> You're travelling at 200 kilometres an hour. Then you slam on the brakes. But where does all that energy go? Your brake pads squeeze against spinning discs, turning movement into intense heat. Meanwhile, your tyres grip the road, slowing the car down. And if a wheel starts to lock, ABS rapidly adjusts the braking pressure to help you maintain control. All that speed, brought down by friction.

Narration timing/picture lock are explicitly later. Do not claim these exact segments align with unrecorded VO.

## Visual agent issue launch links (manually launch five sessions)

- **Agent 1 — Brake engineering:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/147
- **Agent 2 — Physics/grip/ABS:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/148
- **Agent 3 — Cameras/vehicle:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/149
- **Agent 4 — Lighting/world/lookdev:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/150
- **Agent 5 — Motion graphics:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/151

**Manager board:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/146

Five individual source branches and six GitHub Issues have now been created. **All five agents remain NOT STARTED** until independently launched in new agent sessions by the user. Separate branch creation is not evidence of code production.

## Real status — GitHub manager audit, 18 October 2026

| Department | Observed state | Source / PR | Native moving MP4 proof | Manager decision |
|---|---|---|---|---|
| A1 Brake engineering | **IMPLEMENTED, in-progress**; 3 owned commits ahead, drilled rotor, pads/hydraulics and context vehicle | `8ff5f5f81a40b66ee93cd940113063a9f8ca1e31`, [#147](https://github.com/YunRah2103/Remotion-gpt-chat/issues/147) | No verified native braking MP4 delivered | **REVIEW BLOCKED**: correct positive state angle → negative visual wheel/disc rotation and verify A1/A3 seam |
| A2 Grip, physics & ABS | **ACTIVE COORDINATION, NO CODE COMMIT** at audit; agreed sim contract/sign with A1 | baseline `1bebbce820b00b696b8b66499c1c486ebef53182`, [#148](https://github.com/YunRah2103/Remotion-gpt-chat/issues/148) | None | **CRITICAL PATH**: implement authoritative deterministic sampler/film-time mapping |
| A3 Vehicle & cameras | **IMPLEMENTED, DRAFT PR**; 6 commits ahead, deterministic shot rig & tests, labelled constant-speed previews only | [PR #152](https://github.com/YunRah2103/Remotion-gpt-chat/pull/152), SHA `d856659ffae980f9611ff70b49e4aa69e4ad0d1e` | PR explicitly admits not rendered/verified; generic PR CI pending | **REVIEW BLOCKED**: injectable A1 car so no double vehicle; proof render in GitHub Actions |
| A4 Environment & lookdev | **IMPLEMENTED, DRAFT PR**; 1 owned commit, reusable material/light stage | [PR #153](https://github.com/YunRah2103/Remotion-gpt-chat/pull/153), SHA `b85ca32993e4e9bc7b6d405c710d01b017449803` | PR explicitly admits not rendered/verified; generic PR CI pending | **REVIEW BLOCKED**: native context/macro MP4 render, decode + visual review |
| A5 Visual storytelling | **IMPLEMENTED, in-progress**; 4 commits ahead, camera-pinned animated graphics and labelled proof fixtures | `71786ebbcb93a868bc3d5b66eacdd2052cdd79b3`, [#151](https://github.com/YunRah2103/Remotion-gpt-chat/issues/151) | No verified native moving MP4 delivered | **REVIEW BLOCKED**: register compositions, actually render and inspect |
| A6 Master editor | **BLOCKED** until all five independently approved and their interfaces integrated | — | — | Not authorised to start |
| A7 Audio director | **BLOCKED** until A6 picture lock | — | — | Not authorised to start |

**Critical integration findings:** A1 applied `+wheelRotationRad` to the tyre and disc but existing kit and A3 use `-wheelRotationRad` for positive +X forward travel; mismatch requires an A1 correction. A3 currently always mounts its own kit car; injection of A1's actual car must replace it rather than duplicating it. Manager filed specific comments on all five assigned issues, requesting source-accurate native moving previews (not green unrelated generic CI). **All five remain unapproved; no editor/picture lock/audio/final film yet.**

## Each visual agent must deliver

1. Real code and unique branch commit; no edits outside department ownership unless coordinated.
2. Reusable Remotion/Three/R3F assets conforming to contract, no mocks represented as final.
3. **Two genuine native moving MP4 proofs**: (i) own feature close-up, (ii) scene-context composite against the *actual* kit grand-tourer and track; meaningful changing frames. If expense restricts full quality, small preview allowed but 9:16 framing must also be checked.
4. At least three thoughtfully chosen true rendered keyframes plus one **vertical phone-size** sample.
5. TS check plus targeted tests, FFprobe metadata and **full MP4 decode with FFmpeg**. Document exact source SHA, Actions run, artifact download URL, preview frame count/FPS, known limitations, any prohibited access or tool unavailability.
6. Updates to assigned GitHub issue: branch/commit, actual measured tests, links to real MP4 artifact, image proof, honest self-review and precise integration assumptions. **Green CI without human review is NOT approval.**
7. Manager independently reviews both actual moving renders and requests limited revisions retaining successful material. Agents mark **READY FOR REVIEW**, not APPROVED.

## Planned delivery gates

**G0** Manager contract + issues + owner agent manual launch — this setup stage.  
**G1** A2 state sampler + A1 attachment prototype: physical/engineering seam proof.  
**G2** A3 camera proof + A4 actual lookdev + A5 visual clarity proof; all native previews.  
**G3** Five independently inspected and approved agent deliveries.  
**G4** Start A6; seamless native portrait picture master and full moving QC.  
**G5** Picture lock, then start A7; produce licensed/owned VO+sound/music, professional sync.  
**G6** Final MP4: 1080×1920 H264 AAC 30fps min, 23–27s as VO demands, TypeScript/real renders, FFprobe & full stream decode, visual/audio review and *verified* artifact link.

## Commands known from kit (not asserted executed here)

```bash
npm ci
npm run check
npm run worldkit:test
npm run worldkit:studio
npx remotion render src/yunex/world-kit/entry.tsx DrivingPreview out/track-proof.mp4 --props='{"variant":"grand-tourer","environment":"track","timeOfDay":"day","seed":12}' --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -show_streams -show_format out/track-proof.mp4
ffmpeg -v error -i out/track-proof.mp4 -f null -
```

**Manager notes:** Tool availability is conditional (Blender/Godot/PyBullet/Manim/Playwright, GPU) and must be checked in the agent's actual environment before assuming it exists. PR #145's kit-specific CI was still running during initial inspection; its unrelated Studio PR-review check was failing. No kit merge, native braking render, 5 agent launch, VO recording or final film is claimed by creating this setup.