# Vehicle Quality Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline.

**Goal:** Improve all 35 reusable generic vehicles without changing their interfaces.
**Architecture:** Shared wheel geometry and reusable detail helpers layered onto the existing bodies. Shared interior refinement remains layout-driven.
**Tech Stack:** Three.js, R3F, Remotion, TypeScript.
**Spec:** docs/world-kit/VEHICLE_QUALITY.md

## Global Constraints

- Preserve 35 variant IDs, scale, environment compatibility and animation metadata.
- No new dependencies, branded replicas or changes to films/audio/parts kit.
- Modelled detail, native WebGL review, reloadable GLBs.

## Review Focus

- Tyre shoulders must not introduce rolling ground penetration.
- Brake calipers remain fixed while wheels and rotors roll.
- New exterior/interior details must not obstruct driver cameras or cutaway visibility.
- No coplanar trim, floating seams or unsupported large geometry cost.
- Family-specific details must fit short, open and heavy vehicles.

### Task 1: Refine vehicles and interiors

Files: vehicles.ts, vehicle-wheels.ts, vehicle-details.ts, interiors.ts, tests/world-kit/quality.test.mjs.
Interface: createVehicle(options) returns the same root and wheel metadata; helper functions accept existing materials/specs.

- [x] Write and run failing tests for rounded tyre shoulders, rotor/caliper motion and all-model detail budget.
- [x] Implement wheels, lights, trim and family-specific hardware; refine shared seats/controls.
- [x] Run typecheck and complete world/parts tests. Inspect representative native renders.

### Task 2: Review and deliver

Files: quality preview composition/script, README and QA notes.

- [ ] Render all 35 vehicles, selected rear/interior/portrait checks and moving review.
- [ ] Export/reload all GLBs, decode MP4, inspect contact sheets and moving frames.
- [x] Obtain one fresh final code review; address important defects and rerun checks.
- [ ] Commit, update PR #145 and save the clean source/models/preview pack.
