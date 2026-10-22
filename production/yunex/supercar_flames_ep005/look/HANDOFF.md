# EP005 A4 — Premium midnight boulevard / integrate after moving render approval

## V3 and ownership
Base: exact V3 ce7316b364f96721b39100841eb386724ccf2d52.
Branch: agent/ep005-04-v3-environment. Base PR: production/yunex-ep005-v3-base.
Source: NightBoulevard.ts, PracticalLighting.tsx, route.ts, Preview.tsx, this README and route.test.mjs.
Native V3 studio slug: ep005-a4-environment (custom Remotion entry implements same V3 compileRecipe/sampleRecipe contract).
No changes to main, kit PR #233, EP003 or EP004.

## Interface for Agent 3
Canonical imported world: createEP005NightBoulevard({premium:true}) from NightBoulevard.ts.
Canonical road sampler: sampleEP005Route(distance) delegates to sampleRoute('city',distance).
Meters, vehicle forward +X, Y up, Z left, road Y=0 and lane centre Z=-1.85.
Driving preview absolute distance = -48 + 12 * frame/fps, no wrap in -80..78m.
No *separate* custom road, route or coordinate transform is introduced.
Fixtures are at |Z|>=8.22m, tunnel supports at |Z|=8.7m, tunnel underside >=6.95m.
Driver path/camera sightlines: surface road -6.15<Z<+6.15; long straight from -48m toward +66m.
In preview: 0-60f rear chase, 60-120f right tracking, 120-180f rear chase, camera tracks same absolute position. Actual EP005 timing/route must be agreed with Agent 3 before master edit.
Look only (do not insert fake exhaust flame): EP005PracticalLighting({pose,premium,flameIntensity}) exposes optional orange road bounce. Hook/afterfire timing comes exclusively from Agent 2.
Set wetness=.16; restrained rough roadway, not a reflective mirror. Street fixtures use practical warm colour and cool storefront accents. Scene fog comes from V3 CinematicLighting.

## QA / integration
Workflow .github/workflows/yunex-ep005-a4-look.yml is PR-gated, tests V3 TypeScript, recipe validation/planning/inspection, unit geometry/route, native 1080x1920 30fps render, actual FFprobe+full decode+frame uniqueness+opening/cut/last image captures, SHA256.
The baseline and premium comparison use the SAME V3 route and car/cameras, toggling only additional A4 geometry/lighting.
Native render/artifact review is required, not implicit success from passing source tests.
No narration is claimed. Source-only handoff is not motion approval.
