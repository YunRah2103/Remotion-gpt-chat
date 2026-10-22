# EP005 Agent 1 / V3 sculpted supercar
**Branch:** `agent/ep005-01-v3-hero`, **master:** #247, **task:** #248. No merge.

The hero is a mid-engine, 4.70 × 2.01 m **fictional** track-oriented supercar, built on the intact V3 supercar rig. Original V3 systems provide road contact, four steer/roll wheel rigs, suspension, articulated driver, interior, full body and fitted animated twin-turbo V8. The Agent 1 additions provide 22 named recipe components including routed twin exhaust pipes, a jointed rear aerofoil, diffuser, active lighting/cabin detail. The bespoke `hero.ts` factory adds physical open-ended nozzles, rolled metal rims and fasteners, rear grille, diffuser strakes and dash trim. These extras are actually rendered by the agent-specific `HeroEpisode`, not just declared in an unused factory.

## Critical Agent 2 integration
Use `resolveEp005ExhaustPorts(vehicle)` from `production/yunex/supercar_flames_ep005/vehicle/hero.ts`. It resolves named REAL mount nodes `mount:exhaust-tip-left` and `mount:exhaust-tip-right` after the car is animated and routed:
```ts
const hero=createEp005Hero();          // create ONCE, preserve original V3 WeakMap rig
animateCinematicVehicle(hero,{frame,fps,distance,steer});
hero.position.fromArray(pose.position);hero.rotation.y=pose.yaw;
hero.updateMatrixWorld(true);
const ports=resolveEp005ExhaustPorts(hero);
for(const port of ports) {
  // Put the beginning of a 3D flame at port.position.
  // Point its +local flame axis along port.direction (vehicle local -X).
  // On every absolute frame, re-read transform; do not fix it in world coordinates.
}
```
Exact measurements and mirror sides in `exhaust-contract.json`: left (+Z) `[-2.465,.42,.57]`, right (-Z) `[-2.465,.42,-.57]`; both direction `[-1,0,0]`, inner bore 85 mm radius (fictional stylized model).

## Standard V3 commands (repo root)
```bash
npm ci
npm run check
node --test production/yunex/supercar_flames_ep005/vehicle/hero-contract.test.mjs
npm run kit:validate -- ep005-a1-hero
npm run kit:plan -- ep005-a1-hero
npm run kit:inspect -- ep005-a1-hero
npm run kit:preview -- ep005-a1-hero
npm run kit:review -- ep005-a1-hero --moving --shot=rear-hook
npm run kit:review -- ep005-a1-hero --moving --shot=driver-cabin
npm run kit:review -- ep005-a1-hero --moving --shot=engine-reveal
npm run kit:render -- ep005-a1-hero
npm run kit:handoff -- ep005-a1-hero
```
10 seconds at 1080×1920/30fps. Five native shots (rear 3/4 hook, moving orbit, cabin, engine cutaway, road payoff); 300 absolute frames. No temporary flame: Agent 2 owns afterfire and script-dependent final shot lengths. The camera, physics, materials, cabin and clearance require inspection of actual moving MP4; source-only tests do not certify rendered quality.

**Source and restrictions:** all authored vehicle assets in this folder and `src/yunex/studio-projects/ep005-a1-hero/`. No shared kit mutation or change to EP003/EP004. Do not merge into EP005 base until Agent 0 verifies the render and approves. Body/exhaust dimensions are illustrative, not an engineering-manufacturer specification.
