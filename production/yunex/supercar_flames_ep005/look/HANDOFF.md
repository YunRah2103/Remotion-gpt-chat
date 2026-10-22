# EP005 Agent 4 — Dusk circuit environment contract

Draft PR #255; native render requires CI proof, full decode and visual sign-off. V3 source ancestor: ce7316b364f96721b39100841eb386724ccf2d52. Exclusive branch agent/ep005-04-v3-environment. PR base production/yunex-ep005-v3-base. Never merge without manager.

## Agent 3 actual route coordination
Agent 3 selected V3 track loop, 25 seconds / 750 frames, in issue #251. The earlier Agent 4 city-boulevard prototype is SUPERSEDED. Import createEP005NightCircuit({premium:true}) from NightCircuit.ts and sampleEP005Route(distance) from route.ts. The sampler delegates directly to native V3 sampleRoute('track',distance), including lap wrap, metres and absolute-frame tangent. No separate road geometry or fictitious ground tangent.
Original circuit asphalt at Y=0, nominal width 12m, curbs +/-6.4m, barriers +/-11.7m. Agent 4 substantial fixtures at road-normal 19.3m or beyond, preserving Agent 3 requested 5–12m rear/side camera clearance. Small reflectors sit immediately outside existing barriers. Full 25s route sampler accepts unlimited signed metres.
This 6s silent preview starts d=18m, moves 12m/s to d=90m and cuts angles at f60 and f120 without resetting its absolute distance or wheel phase.
PracticalLighting.tsx exports EP005PracticalLighting({pose,premium,flameIntensity}). Orange bounce is optional light only and requires Agent 2 afterfire cue; no fake flame model. Actual exhaust mounts from Agent 1. Camera clearance must still be visually inspected in assembled footage.

## Source and proof
V3 studio unique slug src/yunex/studio-projects/ep005-a4-environment; native custom entry calls same V3 compileRecipe/sampleRecipe, the original V3 car rig and original V3 road factory.
Look sources: route.ts, NightCircuit.ts, PracticalLighting.tsx, Preview.tsx, route.test.mjs.
CI: .github/workflows/yunex-ep005-a4-look.yml. Recipe validation, plan, inspect, TypeScript/unit QA; native 180f premium MP4 and 60f same-time baseline at 1080x1920/30fps. FFprobe, full decode, unique frame hashes, 0/10/23/29 and all cuts/ending screenshots, SHA256 and artifact. No fabricated narration.
