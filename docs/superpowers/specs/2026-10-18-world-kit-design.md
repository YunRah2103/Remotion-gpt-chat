# YUNEX reusable world kit

Build original generic, attractive mid-detail 3D assets for repeated automotive videos. No brand-specific silhouettes, badges, external models or downloaded textures. Natural proportions take priority over intricate detail. Preserve every existing film.

Architecture: pure Three.js model/environment factories, a typed catalogue, thin R3F wrappers, deterministic animation utilities, and independent Remotion showcase compositions. Coordinates use metres, +X forward, +Y up, +Z left; every vehicle rests on y=0. Wheels expose steering and rolling pivots. A shared road surface is y=0. All environments accept every vehicle without rescaling.

Vehicles: four normal bodies (saloon, hatchback, estate, compact); four sports (coupe, roadster, supercar, grand tourer); three SUVs (crossover, boxy, fastback); two single-seaters (modern, classic); three motorcycles (sport, naked, touring); three trucks (pickup, box truck, tractor). Variants change geometry, not just paint. Shared options: paint, accent, wheel finish, lights, shadows; stable names and dimensions.

Environments: modular highway, deterministic city, closed race circuit with a sampled driving route. Day, dusk and night lighting. Reusable camera presets support portrait/landscape. No physics or live ticking. Explicit animation time controls wheel roll and steering; travel distance controls movement. No paid services.

Verification: catalogue coverage, metre-scale bounds, finite geometry, ground contact, distinct silhouettes, deterministic route/animation, all 57 vehicle/environment combinations; TypeScript check; native rendered moving preview and multi-angle contact sheets. Publish source on a feature branch with PR and usage docs, including honest limitations: illustrative geometry, no interiors/physics/manufacturer engineering CAD.
