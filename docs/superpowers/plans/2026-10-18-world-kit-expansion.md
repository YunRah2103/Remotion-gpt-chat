# World kit environment expansion

User approved the simple reusable vehicle kit and requested many more environments and scene assets. Preserve approved vehicle geometry and extend the same APIs and scale.

- [x] Add 12 locations: coast, mountain, forest, desert, snow, tunnel, bridge, industrial, parking, airfield, garage and showroom. Keep the original highway, city and circuit.
- [x] Add 14 reusable props with ground-level pivots and GLB exports.
- [x] Add catalogue metadata, curved planar scenic routes and stationary indoor display poses.
- [x] Verify 285 vehicle/world combinations, sampled truck corridor clearance, determinism, exports and resource cleanup. Seventeen tests and full TypeScript check pass.
- [x] Inspect all V2 environment/prop renders and decode the native moving preview.
- [x] Update the existing feature PR. V2 delivery superseded by the user’s V3 expansion request.

The corridor check samples every 12m at three offsets; it is a useful geometry check, not a physics or exhaustive vehicle-volume guarantee. Native stills have been inspected for every new location, including portrait truck checks inside the tunnel and the two display sets. An independent review identified missing InstancedMesh buffer cleanup; the regression test failed 0/4 before the fix and passes afterwards. The environment factory now frees those buffers.


## V3 user expansion

The user requested 20 environments, more types of cars and modelled shared interiors. Extend to 35 generic vehicles across seven families and 20 compatible locations. Add shared fitted interiors, cutaway and driver cameras, vans/camper furnishings and portable vehicle exports with interiors. Keep the same reusable scale and animation APIs.

- [x] Add 16 vehicle bodies and five environments.
- [x] Add shared interiors, fitted seat positions and five/seven-seat arrangements.
- [x] Add cutaway and driver compositions and native review automation.
- [x] TypeScript and 24 tests pass, including 700 pairings, rear glass/headrest clearance, driver rays and heavy-cab cutaway regression.
- [x] Re-export and round-trip load all 35 vehicle GLBs. Existing 14 prop exports remain valid.
- [ ] Finish native still/reel inspection and portable package verification.
- [ ] Push the final source and deliver V3 previews/package.

Independent review found cab-roof occlusion in truck cutaways, headrests crossing sloped rear glass, missing middle rear seats and harbour boat/jetty overlap. The fixes have dedicated interior tests; harbour boats now sit beyond the jetties. Existing Production Studio review CI separately fails on absent `public/chiron/CHIRON_105_01.mp4` footage used by an older film; the new kit is independent of that footage.
