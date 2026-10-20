import test from 'node:test';
import assert from 'node:assert/strict';
import {routeLength, sampleRoute} from '../../../../../src/yunex/world-kit/environments.ts';
import {sampleTrackSurface} from '../../shared/track.ts';
import {
  ROAD_HALF_WIDTH_M,
  buildRoadRibbonGeometry,
  sampleCircuitRoadPoint,
  sampleCircuitRoadNormal,
  buildDriveableAsphalt,
  makeAsphaltTexture,
} from '../../look/road.ts';

test('road centre height is the exact shared Agent 2 contact sampler', () => {
  for (const d of [0, 21, 69, 70.25, 71.7, 72, 72.4, 73.75, 135, 137.8, 138, 138.85, 181, 240]) {
    const road = sampleCircuitRoadPoint(d, 0);
    const world = sampleRoute('track', d);
    assert.ok(Math.abs(road.x - world.position[0]) < 1e-9);
    assert.ok(Math.abs(road.z - world.position[2]) < 1e-9);
    assert.ok(Math.abs(road.y - sampleTrackSurface(d).heightM) < 1e-10, 'metres: ' + d);
  }
  assert.equal(sampleTrackSurface(72).heightM > 0.028, true);
  assert.equal(sampleTrackSurface(138).heightM > 0.018, true);
});

test('right/left drivable edge maintains exact common road profile', () => {
  for (const d of [60, 70, 72, 74, 135, 138, 140, 213]) {
    const centre = sampleCircuitRoadPoint(d, 0);
    const left = sampleCircuitRoadPoint(d, ROAD_HALF_WIDTH_M);
    const right = sampleCircuitRoadPoint(d, -ROAD_HALF_WIDTH_M);
    assert.ok(Math.abs(left.distanceTo(centre) - ROAD_HALF_WIDTH_M) < 1e-8);
    assert.ok(Math.abs(right.distanceTo(centre) - ROAD_HALF_WIDTH_M) < 1e-8);
    assert.equal(left.y, right.y);
    assert.equal(left.y, centre.y);
    assert.ok(sampleCircuitRoadNormal(d).y > 0.99);
  }
});

test('render mesh is non-flat, upward facing, closes route without a gap', () => {
  const geom = buildRoadRibbonGeometry();
  const p = geom.getAttribute('position');
  const n = geom.getAttribute('normal');
  const widthPts = 9;
  const rows = p.count / widthPts;
  assert.ok(rows > 500, 'enough spatial samples for narrow physical bumps');
  assert.ok(geom.getIndex().count > 9000);
  const first = [p.getX(4), p.getY(4), p.getZ(4)];
  const last = (rows - 1) * widthPts + 4;
  assert.ok(Math.hypot(p.getX(last) - first[0], p.getY(last) - first[1], p.getZ(last) - first[2]) < 1e-4);
  let top = -Infinity, min = Infinity;
  for (let i = 0; i < p.count; i += widthPts) {
    const y = p.getY(i + 4);
    top = Math.max(top, y);
    min = Math.min(min, y);
    assert.ok(n.getY(i + 4) > 0.98, 'up-facing road at segment ' + (i / widthPts));
  }
  assert.ok(top > 0.028, 'actual raised road bump visible in geometry');
  assert.ok(min > -1e-5);
  geom.dispose();
});

test('asphalt carries one grounded bump ribbon and finite deterministic albedo', () => {
  const road = buildDriveableAsphalt();
  assert.equal(road.name, 'ep004-canonical-bump-asphalt');
  assert.equal(road.userData.contactSurface, true);
  const tex = road.material.map;
  assert.ok(tex && tex.image.width === 128 && tex.image.height === 128);
  assert.equal(road.geometry.userData.profile, 'EP004-shared/sampleTrackSurface');
  road.geometry.dispose();
  road.material.dispose();
  tex.dispose();
  const check = makeAsphaltTexture();
  const another = makeAsphaltTexture();
  assert.deepEqual(check.image.data, another.image.data);
  check.dispose();
  another.dispose();
});

test('reference route and geometry are metre-scale and stay bounded', () => {
  const lap = routeLength('track');
  assert.ok(lap > 200 && lap < 500);
  for (const d of [0, 72, 138, lap - 0.3]) {
    const point = sampleCircuitRoadPoint(d, 0);
    assert.ok(Number.isFinite(point.x + point.y + point.z));
  }
});
