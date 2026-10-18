# Braking 200 — Agent 1 mechanical package

**Implementation:** original procedural ventilated and drilled 3D brake rotor, bearing/hub, twenty-eight open ventilation vanes, two machined friction faces with actual through-holes, opposing pads, piston/seal detail, caliper casting, stationary knuckle brackets, brake hose and hydraulic banjo connection. Kit car preserved.

## Production imports

- \`BrakeAssembly\`, \`createBrakeAssembly\`, \`applyBrakeAssemblyPose\` from \`BrakeAssembly.tsx\`: standalone rig mounted at a wheel centre (axes +X forward, +Y up, +Z left, metres).
- \`BrakingVehicle\` from \`BrakingVehicle.tsx\`: existing \`grand-tourer\` with four assemblies placed at contract-derived wheel anchors, matching source kit steering pivots.
- \`poseFromSimulation\` from \`mechanics.ts\`: **pure mapping** from A2 \`BrakingSimulationState\`; never independently computes speed, grip, slip or braking pressure.

\`BrakingVehicle\` accepts \`simulation\` (required), \`pose\` (kit track route), \`steerRad\`, optional \`cutawayWheel\`, \`cutaway01\` and \`heatIllustration01\`. Pass A2's genuine frame-seekable \`sampleBrakingSimulation(simTimeSec)\`. IMPORTANT: Manager-confirmed A2 \`rotationRad\` is **positive** cumulative wheel progress for +X forward travel; Three.js visual roll is **negative** of that angle, matching the kit's \`-distance/radius\`. Wheel progress must already include slip/ABS effects.

**Physical motion:** maximum pad travel is **0.0012 metres / 1.2 mm**, mechanical gap closes to zero under full pressure. The larger separation in educational exploded shots is identified separately as **CUTAWAY**, not pad travel. A2's pressure controls millimetre displacement; caliper, pads and hoses never spin. The hub and rotor rotate at exactly A2's wheel angle. Caliper steel/amber coloration is not a temperature measurement; optional faint orange ring is labelled illustrative only.

The kit's stock \`brake-caliper\` placeholder is hidden only in this episode's privately constructed vehicle model. The film-level cutaway hides the original opaque wheel for one wheel only; remaining tyres continue rolling from A2. Neither \`world-kit\` source nor manager/peer-owned source is changed.

## Review-only native compositions

Render from \`src/yunex/braking200/engineering/entry.tsx\`:

\`\`\`bash
npm ci
npm run check
node --experimental-strip-types --test src/yunex/braking200/engineering/mechanics.test.mjs
npx remotion render src/yunex/braking200/engineering/entry.tsx BrakeMacroProof out/braking-a1-macro.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.5
npx remotion render src/yunex/braking200/engineering/entry.tsx BrakeTrackProof out/braking-a1-track.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p --scale=0.5
ffprobe -v error -show_format -show_streams out/braking-a1-macro.mp4
ffmpeg -v error -i out/braking-a1-macro.mp4 -f null -
\`\`\`

\`previewFixture.ts\` is an **isolated, provisional seek-stable preview fixture ONLY**, never imported by production components. It supplies moving wheels and pressure during native A1 reviews while Agent 2 finalises its sampler. No simulated stopping distance from it may enter the film. Both demos are 120 frames / 4 seconds / 30fps, portrait 1080x1920 composition, rendered half-scale for QA. Renders need actual verification; code compilation alone is insufficient.
