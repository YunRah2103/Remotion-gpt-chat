/**
 * YUNEX EP004 / Agent 4 — canonical night circuit asphalt.
 *
 * Unlike the flat world-kit road, this *visible* ribbon samples EXACTLY the
 * common 1D surface profile also used by Agent 2's signed-gap contact solver.
 * It does not modify shared track, environment factory or EP003.
 */
import * as THREE from 'three';
import {routeLength, sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {sampleTrackSurface} from '../shared/track.ts';

export const ROAD_WIDTH_M = 12;
export const ROAD_HALF_WIDTH_M = ROAD_WIDTH_M / 2;
export const ROAD_SEGMENT_M = 0.16;
export const LANE_WIDTH_SLICES = 8;

/** Route coordinates and lateral offsets in metres; positive lateral is +Z car-left. */
export function sampleCircuitRoadPoint(distanceM: number, lateralM = 0): THREE.Vector3 {
  if (!Number.isFinite(distanceM) || !Number.isFinite(lateralM)) {
    throw new Error('Circuit sampling requires finite metre inputs');
  }
  const pose = sampleRoute('track', distanceM);
  const heightM = sampleTrackSurface(distanceM).heightM;
  return new THREE.Vector3(
    pose.position[0] + Math.sin(pose.yaw) * lateralM,
    heightM,
    pose.position[2] + Math.cos(pose.yaw) * lateralM,
  );
}

/** Road normal includes *the same* common height derivative. */
export function sampleCircuitRoadNormal(distanceM: number): THREE.Vector3 {
  const yaw = sampleRoute('track', distanceM).yaw;
  const slope = sampleTrackSurface(distanceM).slopeMPerM;
  return new THREE.Vector3(-slope * Math.cos(yaw), 1, slope * Math.sin(yaw)).normalize();
}

/** Ring-closed arc-length ribbon with smooth, deterministic Gaussian humps. */
export function buildRoadRibbonGeometry(
  lateralMinM = -ROAD_HALF_WIDTH_M,
  lateralMaxM = ROAD_HALF_WIDTH_M,
  slices = LANE_WIDTH_SLICES,
  stepM = ROAD_SEGMENT_M,
  elevationOffsetM = 0,
): THREE.BufferGeometry {
  if (!(slices >= 1) || !Number.isInteger(slices) || !(stepM > 0) || !(lateralMaxM > lateralMinM)) {
    throw new Error('Invalid EP004 road ribbon tessellation');
  }
  const lapM = routeLength('track');
  const segments = Math.ceil(lapM / stepM);
  const row = slices + 1;
  const xyz = new Float32Array((segments + 1) * row * 3);
  const uv = new Float32Array((segments + 1) * row * 2);
  const faces = new Uint32Array(segments * slices * 6);
  for (let i = 0; i <= segments; i++) {
    const d = (i / segments) * lapM;
    for (let j = 0; j <= slices; j++) {
      const lateralM = lateralMinM + (j / slices) * (lateralMaxM - lateralMinM);
      const p = sampleCircuitRoadPoint(d, lateralM);
      const n = i * row + j;
      xyz[n * 3] = p.x;
      xyz[n * 3 + 1] = p.y + elevationOffsetM;
      xyz[n * 3 + 2] = p.z;
      uv[n * 2] = d / 4;
      uv[n * 2 + 1] = lateralM / 3.2;
      if (i < segments && j < slices) {
        // Across-lane (+Z car-left) before forward tangent => up-facing winding.
        const k = (i * slices + j) * 6;
        faces[k] = n;
        faces[k + 1] = n + 1;
        faces[k + 2] = n + row;
        faces[k + 3] = n + 1;
        faces[k + 4] = n + row + 1;
        faces[k + 5] = n + row;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(xyz, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(faces, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.userData = {profile: 'EP004-shared/sampleTrackSurface', lapM, segments, slices};
  return geo;
}

function hashInt(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return ((x ^ (x >>> 16)) >>> 0) / 0xffffffff;
}

/** Procedural colour/roughness variation: no external textures, no moving UV flicker. */
export function makeAsphaltTexture(): THREE.DataTexture {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fine = hashInt(x * 179 + y * 131 + 12);
      const aggregate = hashInt(Math.floor(x / 4) * 43 + Math.floor(y / 4) * 97 + 12);
      const grain = Math.round(171 + fine * 41 + aggregate * 19);
      const i = (y * size + x) * 4;
      pixels[i] = Math.max(0, grain - 10);
      pixels[i + 1] = grain;
      pixels[i + 2] = Math.min(255, grain + 5);
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.name = 'EP004 procedural fine asphalt';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** A single material/texture for the entire asphalt ribbon, no overlapping flat mesh. */
export function buildDriveableAsphalt(): THREE.Mesh {
  const map = makeAsphaltTexture();
  const material = new THREE.MeshPhysicalMaterial({
    name: 'EP004 physically lit asphalt',
    color: '#3b4249',
    map,
    metalness: 0.045,
    roughness: 0.83,
    clearcoat: 0.075,
    clearcoatRoughness: 0.79,
    side: THREE.DoubleSide,
  });
  const road = new THREE.Mesh(buildRoadRibbonGeometry(), material);
  road.name = 'ep004-canonical-bump-asphalt';
  road.receiveShadow = true;
  road.userData = {contactSurface: true, profile: 'sampleTrackSurface'};
  return road;
}

/** Concrete-white painted edge lines, each lifted 1.5 cm above shared surface. */
export function buildCircuitPaint(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ep004-road-paint-and-kerbs';
  const line = new THREE.MeshStandardMaterial({
    color: '#c9ddd9', metalness: 0.04, roughness: 0.72, side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(
      buildRoadRibbonGeometry(side * 5.72 - 0.046, side * 5.72 + 0.046, 1, 0.24, 0.012),
      line,
    );
    stripe.name = 'ep004-contoured-white-edge';
    stripe.receiveShadow = true;
    group.add(stripe);
  }
  // Racing kerbs sit *outside* the drivable 12-metre road, never double-stack asphalt.
  const darkRed = new THREE.MeshStandardMaterial({color: '#ae4544', roughness: 0.69, side: THREE.DoubleSide});
  const ivory = new THREE.MeshStandardMaterial({color: '#e4dfd2', roughness: 0.72, side: THREE.DoubleSide});
  const lapM = routeLength('track');
  const count = Math.ceil(lapM / 1.7);
  for (const side of [-1, 1]) {
    for (let k = 0; k < count; k++) {
      const a = (k / count) * lapM;
      const b = ((k + 1) / count) * lapM;
      const lateralMin = side > 0 ? 6.05 : -6.76;
      const lateralMax = side > 0 ? 6.76 : -6.05;
      const positions: number[] = [];
      for (const distance of [a, (a + b) / 2, b]) {
        for (const offset of [lateralMin, lateralMax]) {
          const p = sampleCircuitRoadPoint(distance, offset);
          positions.push(p.x, p.y + 0.017, p.z);
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
      geom.computeVertexNormals();
      const kerb = new THREE.Mesh(geom, k % 2 === 0 ? darkRed : ivory);
      kerb.name = 'ep004-striped-curb';
      group.add(kerb);
    }
  }
  return group;
}
