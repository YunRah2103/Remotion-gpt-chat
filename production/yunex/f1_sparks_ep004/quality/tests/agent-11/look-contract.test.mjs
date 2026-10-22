import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUALITY_NIGHT, qualityWetness, validatedSparkGain} from '../../look/palette.ts';
import {classifyNightMaterial} from '../../look/materials.ts';
import {createQualityKitDressing, assertNoAdditionalRoad} from '../../look/kit-dressing.ts';
import {disposeObject} from '../../../../../../src/yunex/world-kit/geometry.ts';
import {buildRoadRibbonGeometry, sampleCircuitRoadPoint} from '../../../look/road.ts';
import {sampleTrackSurface} from '../../../shared/track.ts';

test('bounded deterministic cinema calibration avoids mirror-flood and clipping', () => {
  assert.equal(qualityWetness(QUALITY_NIGHT.kitWetness), 0.08);
  assert.throws(() => qualityWetness(0.8), /wetness/);
  assert.throws(() => qualityWetness(Number.NaN), /wetness/);
  assert.throws(() => validatedSparkGain(-1), /gain/);
  assert.throws(() => validatedSparkGain(2), /gain/);
  assert.equal(validatedSparkGain(0), 0);
});

test('premium kit dressing includes only off-road props, no physics surface', () => {
  const group = createQualityKitDressing();
  assertNoAdditionalRoad(group);
  assert.equal(group.userData.contactSurfaceCount, 0);
  assert.equal(group.userData.sparkEmitterCount, 0);
  const names = new Set();
  group.traverse(o => names.add(o.name));
  assert(names.has('pit-box-canopies'));
  assert(names.has('circuit-tyre-stacks'));
  assert(!names.has('circuit-asphalt'));
  assert(!names.has('ep004-canonical-bump-asphalt'));
  assert(!names.has('contact-sparks'));
  disposeObject(group);
});

test('the ONLY A4 driveable asphalt samples A2 exact surface heights', () => {
  const geo = buildRoadRibbonGeometry(-6, 6, 8, 0.28, 0);
  const position = geo.getAttribute('position');
  for (const distance of [0, 4.5, 52.0, 96.4, 180]) {
    const p = sampleCircuitRoadPoint(distance, 0);
    assert(Math.abs(p.y - sampleTrackSurface(distance).heightM) < 1e-12);
  }
  assert(position.count > 1000);
  assert.equal(geo.userData.profile, 'EP004-shared/sampleTrackSurface');
  geo.dispose();
});

test('night material classification cannot confuse rubber, carbon and metal skids', () => {
  assert.equal(classifyNightMaterial('racing-tyre-sidewall'), 'tyre');
  assert.equal(classifyNightMaterial('carbon-floor'), 'carbon');
  assert.equal(classifyNightMaterial('metal-skid'), 'skid');
  assert.equal(classifyNightMaterial('front-wing'), 'paint');
});

test('composition never creates fake sparks or double mounts a kit road', () => {
  const source = readFileSync('production/yunex/f1_sparks_ep004/quality/look/QualityNightCircuit.tsx', 'utf8');
  const preview = readFileSync('production/yunex/f1_sparks_ep004/quality/previews/agent-11/Preview.tsx', 'utf8');
  assert.match(source, /<NightCircuitWorld/);
  assert.doesNotMatch(source, /<mesh|<instancedMesh/);
  assert.match(preview, /sampleContactDrivenSparks/);
  assert.match(preview, /getSkidDescriptors/);
  assert.match(preview, /node.name === 'contact-sparks'/);
  assert.doesNotMatch(preview, /animationPreset\(['"]floor-sparks/);
  assert.match(preview, /durationInFrames={180}/);
  assert.match(preview, /durationInFrames={240}/);
});
