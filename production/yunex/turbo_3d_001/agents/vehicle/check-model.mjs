import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const world=readFileSync('src/yunex/turbo3d/vehicle/VehicleWorld.tsx','utf8');
const kit=readFileSync('src/yunex/turbo3d/vehicle/DetailKit.tsx','utf8');
const sculpt=readFileSync('src/yunex/turbo3d/vehicle/SculptedBody.tsx','utf8');
const inspection=readFileSync('src/yunex/turbo3d/vehicle/inspection/root.tsx','utf8');
for(const key of ['VehicleWorld','VehicleModel','RoadEnvironment','CAR_BODY','ENGINE_BAY',
'EXHAUST_MANIFOLD_ZONE','REAR_CAMERA_TRACK','ROAD_SURFACE','RACE_ASPHALT']){
 assert.ok(world.includes(key),'missing world contract '+key);
}
for(const key of ['HEADLAMP_OUTER_CLEAR_LENS','HEADLAMP_PROJECTOR_LENS','HEADLAMP_RECESSED_HOUSING',
 'FRONT_BUMPER_RECESSED_DUCT','SIDE_RECESSED_AIR_DUCT','SIDE_DUCT_DEPTH_BACK',
 'WHEEL_PIVOT_X','DRILLED_BRAKE_DISC','HUB_LUGS','ENGINE_INTAKE_PLENUM',
 'CYLINDER_BANK_COVER','ENGINE_BAY_BRACING','ENGINE_BAY_TURBO_HOUSING_HINT',
 'ENGINE_ACCESS_DECK']){
 assert.ok(kit.includes(key),'missing physical close-up asset '+key);
}
for(const name of ['BODY_TEAL_ENAMEL','SCULPTED_SIDE_BODYWORK','SCULPTED_FRONT_FENDER_ARCH',
 'SCULPTED_REAR_FENDER_ARCH','SHADOWED_PHYSICAL_WHEEL_WELL','RAKED_SCULPTED_GLASSHOUSE',
 'ACTUAL_PERFORATED_BUMPER_FASCIA']){
 assert.ok(sculpt.includes(name),'missing real V6 bodywork '+name);
}
assert.match(world,/SculptedShell/,'V6 sculpt must be used by actual car render');
assert.match(world,/SculptedCanopy/,'V6 glasshouse must be used by actual car render');
assert.match(inspection,/A1V6FrontThreeQuarterHero/,'missing V6 cinematic angle');
assert.match(kit,/spin=-travelMeters\/\.355/,'wheel rotation must track distance');
assert.match(world,/if\(s===2 && \(j===1 \|\| j===3\)\) continue/,'real side panel cutout required');
assert.match(world,/4\.6, width: 1\.95, height: 1\.25/);
assert.match(world,/wheelRadius: 0\.355/);
assert.match(world,/wrap\(-85\+i\*8\.0,travelMeters\)/,'road motion must match wheel');
assert.match(inspection,/durationInFrames=\{120\}/);
assert.match(inspection,/fps=\{30\}/);
for(const name of ['FRONT_HEADLAMP_DUCT','WHEEL_BRAKES','REAR_ENGINE_REVEAL','REAR_HERO']){
 assert.ok(inspection.includes(name),'missing inspection scene '+name);
}
assert.ok(!world.includes('Math.random(') && !kit.includes('Math.random('),'determinism');
assert.ok(Math.abs(.355-.355)<1e-9,'tyre must contact road top at zero');
console.log('A1 v2 source/axis/wheel-distance/headlamp-intake-engine/4-shot contracts PASS');
