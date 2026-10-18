# World kit environment expansion

User approved the simple reusable vehicle kit and requested many more environments and scene assets. Preserve approved vehicle geometry and extend the same APIs and scale.

- [x] Add 12 locations: coast, mountain, forest, desert, snow, tunnel, bridge, industrial, parking, airfield, garage and showroom. Keep the original highway, city and circuit.
- [x] Add 14 reusable props with ground-level pivots and GLB exports.
- [x] Add catalogue metadata, curved planar scenic routes and stationary indoor display poses.
- [x] Verify 285 vehicle/world combinations, sampled truck corridor clearance, determinism, exports and resource cleanup. Seventeen tests and full TypeScript check pass.
- [ ] Inspect all environment/prop renders and decode the native moving preview.
- [ ] Update the existing feature PR and deliver the self-contained V2 pack.

The corridor check samples every 12m at three offsets; it is a useful geometry check, not a physics or exhaustive vehicle-volume guarantee. Native stills have been inspected for every new location, including portrait truck checks inside the tunnel and the two display sets. An independent review identified missing InstancedMesh buffer cleanup; the regression test failed 0/4 before the fix and passes afterwards. The environment factory now frees those buffers.
