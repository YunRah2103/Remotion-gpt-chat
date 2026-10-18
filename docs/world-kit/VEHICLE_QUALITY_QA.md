# Vehicle quality verification — 18 October 2026

Scope: all 35 generic catalogue variants; the existing 20 environments and 55 mechanical-part assemblies retain their public interfaces.

- TypeScript check passed.
- World kit: 31 tests passed, including 700 vehicle/environment pairings, cabin camera clearance, cutaway visibility, seating, deterministic motion and six quality checks.
- Mechanical parts: all 19 tests passed unchanged.
- Every vehicle remains below 250,000 counted mesh vertices; the largest is 175,190. Maximum mesh count is 464. These are editable stylised assets; merge or instance meshes downstream when showing large fleets.
- All 35 GLBs exported and reloaded. Reload checks cover ground contact, wheel count/radius, interior controls and rotor/caliper hierarchy.
- Native review: 35 front three-quarter stills, 9 rear stills, 5 cutaways, 5 driver views, 2 portrait stills. The 21-second moving review alternates studio and driving views for seven families.
- Review output: H.264, 960×540, 12 fps, 252 frames, yuv420p limited range, BT.709. Source composition: 1920×1080, 30 fps, 630 frames. Silent asset review.

An independent code/visual review identified pickup bed interference and floating heavy-truck door trim. Both were reproduced with failing spatial tests, corrected, and passed the full suite. The three-door compact's extra rear handles were also reproduced and removed. Its identity mismatch was treated as a correctness defect rather than deferred polish.

The baseline is illustrative geometry, not manufacturer-specific CAD. Detailed mechanical animations remain in the separate parts kit; vehicle calipers/rotors are visual assemblies with deterministic wheel motion.

The unrelated Production Studio workflow still depends on missing legacy Chiron footage. This work does not modify that film or its media.
