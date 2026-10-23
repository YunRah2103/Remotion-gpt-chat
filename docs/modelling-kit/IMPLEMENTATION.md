# Modelling Kit V2: additive vertical slice

Base: production/yunex-ep004-base at d5c238fb. Audit finds 35 vehicle variants,
20 environment IDs, 55 part variants. Recent sculpted-body and world-detail revisions
are already present; use them rather than the older world-kit-v3 branch.

Design: preserve world-kit/parts-kit and all episode files. Add modelling-kit with
an opt-in createCinematicVehicle factory and stateless animateCinematicVehicle API.
Legacy lightweight assets remain unchanged. Three initial hero presets: hot-hatch,
supercar, formula-modern. Shared enhancement supports other variants, without claiming
all are individually hero-reviewed. Metres, +X forward, +Y up, +Z left.

Delivery order:
1. Write behavioural tests for reversible deformation, frame seeking, wheel mounts,
   cutaway restoration, compression/contact gating, invalid inputs and all variants.
2. Add detailed tyre treads, suspension connections, underfloor assembly, mounted
   existing parts, material tuning, deterministic tyre/body damage and controlled
   assembly separation. Keep illustrative mechanics explicitly labelled.
3. Add native Remotion A/B/C demos, shared procedural studio/track dressing, GLB
   export and CPU/software-WebGL review workflow; render and inspect output.
4. Run legacy regressions, TypeScript, GLB roundtrip and full MP4 decode/movement
   checks. Record measured performance and limitations in README/QA. Push branch/PR.

No soft-body solver, validated engineering simulation, external assets, production
merges or finished-episode changes. Full catalogue redesign and fully articulated
powertrain remain outside this first deliverable unless actually implemented and verified.
