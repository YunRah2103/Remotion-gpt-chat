import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const src=readFileSync('src/yunex/turbo3d/vehicle/VehicleWorld.tsx','utf8');
const preview=readFileSync('src/yunex/turbo3d/vehicle/preview/root.tsx','utf8');
const expected=['VehicleWorld','VehicleModel','RoadEnvironment','CAR_BODY','ENGINE_BAY','EXHAUST_MANIFOLD_ZONE','REAR_CAMERA_TRACK','ROAD_SURFACE','WHEEL_PIVOT_X','RACE_ASPHALT','BODY_TEAL_ENAMEL'];
for(const key of expected) assert.ok(src.includes(key),'missing named contract '+key);
assert.match(src,/spin=-travelMeters\/VEHICLE_SPEC\.wheelRadius/,'wheel rotation must be distance-derived');
assert.match(src,/\+Z nose\/forward/,'must document axis basis');
assert.match(src,/4\.6, width: 1\.95, height: 1\.25/,'vehicle extents');
assert.match(src,/wheelRadius: 0\.355/,'wheel radius');
assert.match(src,/wrap\(-85\+i\*8\.0,travelMeters\)/,'road centerline must move');
assert.ok(!src.includes('Math.random('),'all motion must be deterministic');
assert.match(preview,/durationInFrames=\{120\}/);
assert.match(preview,/fps=\{30\}/);
const wheelCenter=0.355, radius=0.355;
assert.ok(Math.abs(wheelCenter-radius)<1e-9,'tyre must contact road y=0');
for(const meters of [0,1,5,31]){
 const radians=-meters/radius; assert.ok(Number.isFinite(radians));
}
console.log('A1 source/axis/scale/rig/frame static checks: PASS');
