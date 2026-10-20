/**
 * EP004 Agent 4: self-contained night raceway look and spark-responsive light.
 *
 * The factory track is retained for its barriers, pits, stands and terrain;
 * ONLY its old flat asphalt/edge overlays are hidden. The replacement
 * asphalt is the same road Agent 2 uses for contact; this module emits no
 * sparks and owns no hero-car geometry.
 */
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {createEnvironment, routeLength, sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {WorldLighting} from '../../../../src/yunex/world-kit/components.tsx';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import type {SparkParticle, VehicleMotionState, Vec3} from '../shared/contract.ts';
import {buildCircuitPaint, buildDriveableAsphalt, sampleCircuitRoadPoint} from './road.ts';
import {lampIntensityWeight} from './fixture-lighting.ts';

export type NightCircuitWorldProps = {
  tSec?: number;
  motion?: VehicleMotionState;
  /** Moving reference fixture centreline, only used when physics motion is absent. */
  referenceDistanceM?: number;
  /** Authoritative, already spawned particles from Agent 2; NEVER fabricate here. */
  particles?: readonly SparkParticle[];
  /** Film lighting levels can be dialled by integration, but do not strobe. */
  exposure?: number;
  showEnvironment?: boolean;
};

function bar(
  parent: THREE.Object3D,
  material: THREE.Material,
  width: number, height: number, depth: number,
  x: number, y: number, z: number,
  name: string,
  rotationY = 0,
) {
  const node = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  node.name = name;
  node.position.set(x, y, z);
  node.rotation.y = rotationY;
  node.castShadow = false;
  node.receiveShadow = true;
  parent.add(node);
  return node;
}

function addFloodlightTower(parent: THREE.Group, distanceM: number, side: number, idx: number) {
  const pose = sampleRoute('track', distanceM);
  const base = sampleCircuitRoadPoint(distanceM, side * 15.4);
  const root = new THREE.Group();
  root.name = 'ep004-floodlight-tower-' + idx;
  root.position.copy(base);
  root.rotation.y = pose.yaw;

  const steel = new THREE.MeshStandardMaterial({color: '#596c76', metalness: 0.72, roughness: 0.39});
  const cross = new THREE.MeshStandardMaterial({color: '#8c9fa6', metalness: 0.6, roughness: 0.44});
  const lens = new THREE.MeshStandardMaterial({
    color: '#e8f5f2', emissive: '#daf0ff', emissiveIntensity: 2.6, roughness: 0.3,
  });

  // Two poles and a compact truss are readable in close portrait trackside shots.
  for (const off of [-0.58, 0.58]) {
    bar(root, steel, 0.17, 9.2, 0.17, 0, 4.6, off, 'tower-column');
    bar(root, cross, 0.09, 4, 0.09, 0, 4.4, off, 'tower-stiffener').rotation.z = off * 0.026;
  }
  bar(root, steel, 0.40, 0.17, 2.25, 0, 9.12, 0, 'lighting-array-rail');
  for (const off of [-0.84, -0.29, 0.29, 0.84]) {
    bar(root, lens, 0.16, 0.33, 0.41, -0.12, 8.94, off, 'warm-white-race-flood');
  }
  // Physically illuminate car paint and road. Light stations do not animate or flicker.
  const glow = new THREE.PointLight('#cce9ff', 64, 38, 2);
  glow.position.set(side > 0 ? -1 : 1, 8.9, 0);
  glow.name = 'ep004-steady-local-circuit-light';
  glow.userData.ep004LightDistanceM = distanceM;
  glow.userData.ep004FullIntensity = 64;
  root.add(glow);
  parent.add(root);
}

function buildNightWorld(): THREE.Group {
  // Canonical source set: maintain factory track provenance, don't modify the kit.
  const factory = createEnvironment({kind: 'track', timeOfDay: 'night', seed: 12});
  factory.name = 'ep004-original-track-kit-with-road-profile-overrides';
  factory.traverse(node => {
    if (['circuit-asphalt', 'red-white-curbs', 'edge-lines', 'start-line'].includes(node.name)) {
      node.visible = false; // no z-fighting, no competing flat road.
    }
  });

  // Art-directed night grade on this EP004 environment instance only.
  // Untinted factory relief/runoff reads like daylight under the broad kit fill.
  // Preserve original geometry and shared source, just clone its PBR materials.
  const grade = new Map<THREE.Material, Map<number, THREE.Material>>();
  factory.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    if (node.name === 'gradient-sky') {
      // The world-kit sky is a self-illuminated vertex-gradient dome: darken
      // its material, NOT the shared mesh vertex positions or night palette.
      // Without this, horizon stays unrealistically blue under track floodlights.
      const skyMaterial = node.material as THREE.MeshBasicMaterial;
      const nightSky = skyMaterial.clone();
      nightSky.color.multiplyScalar(0.37);
      node.material = nightSky;
      return;
    }
    const name = node.name;
    const dark = name === 'runoff' ? 0.15
      : name === 'terrain-relief' ? 0.19
      : name === 'terrain' ? 0.17
      : name.includes('tree-') || name.includes('conifer-') ? 0.20
      : name.includes('grandstand') ? 0.42
      : name.includes('circuit-barriers') || name.includes('fence-') ? 0.53
      : name.includes('pit') || name.includes('garage') ? 0.58
      : 1;
    if (dark >= 1) return;
    const apply = (mat: THREE.Material) => {
      let byGain = grade.get(mat);
      if (!byGain) { byGain = new Map(); grade.set(mat, byGain); }
      let clone = byGain.get(dark);
      if (!clone) {
        clone = mat.clone();
        if (clone instanceof THREE.MeshStandardMaterial) {
          clone.color.multiplyScalar(dark);
          clone.roughness = Math.max(clone.roughness, 0.58);
          if (clone.emissiveIntensity > 0) clone.emissiveIntensity *= 0.7;
        }
        byGain.set(dark, clone);
      }
      return clone;
    };
    node.material = Array.isArray(node.material) ? node.material.map(apply) : apply(node.material);
  });

  const group = new THREE.Group();
  group.name = 'EP004-NIGHT-CIRCUIT-WORLD';
  group.add(factory);
  group.add(buildDriveableAsphalt(), buildCircuitPaint());

  const lap = routeLength('track');
  // Fully deterministic rig interval; floodlights placed outside barriers.
  for (let i = 0; i < 12; i++) {
    addFloodlightTower(group, ((i + 0.18) / 12) * lap, i % 2 ? -1 : 1, i);
  }

  // Restrained pit illumination: enough atmosphere, never a neon nightclub.
  const concrete = new THREE.MeshStandardMaterial({color: '#6f8790', metalness: 0.4, roughness: 0.49});
  const warmGlass = new THREE.MeshStandardMaterial({
    color: '#89a2af', emissive: '#b4d9de', emissiveIntensity: 0.34,
    metalness: 0.43, roughness: 0.25,
  });
  const pits = new THREE.Group();
  pits.name = 'ep004-night-pit-reflections';
  for (let i = 0; i < 8; i++) {
    const x = -28 + i * 7;
    bar(pits, warmGlass, 4.8, 1.12, 0.035, x, 2.55, -62.397, 'backlit-pit-glazing');
    bar(pits, concrete, 5.35, 0.12, 0.4, x, 3.44, -62.4, 'pit-roof-metal');
  }
  group.add(pits);

  // A pair of distant continuous cool fill sources produces clear paint edges.
  const moonRim = new THREE.DirectionalLight('#8ab2cd', 0.87);
  moonRim.position.set(-48, 35, 45);
  moonRim.name = 'ep004-soft-cool-rim';
  group.add(moonRim);
  const warmRim = new THREE.DirectionalLight('#f3b98e', 0.42);
  warmRim.position.set(36, 18, -50);
  warmRim.name = 'ep004-distant-warm-counterlight';
  group.add(warmRim);
  group.userData = {
    roadProfile: 'shared/sampleTrackSurface',
    route: "sampleRoute('track',d)",
    originalKitIntact: true,
    decorativeSparkCount: 0,
  };
  return group;
}

export type SparkLightSource = {
  id: string;
  positionWorld: Vec3;
  intensity: number;
};

/** Actual spark particles ONLY, group into at most three restrained near-field lights. */
export function deriveContactSparkLights(
  particles: readonly SparkParticle[],
  gain = 1,
): SparkLightSource[] {
  if (!Number.isFinite(gain) || gain < 0) throw new Error('Spark light gain must be non-negative finite');
  const skids = ['forward', 'middle', 'rear'] as const;
  const sources: SparkLightSource[] = [];
  for (const skid of skids) {
    const visible = particles
      .filter(p =>
        p.emitterSkidId === skid &&
        p.ageSec >= 0 && p.ageSec < Math.min(0.16, p.lifetimeSec) &&
        p.luminance01 > 0 && Number.isFinite(p.positionWorld[1]),
      )
      .sort((a, b) => b.luminance01 - a.luminance01)
      .slice(0, 24);
    if (!visible.length) continue;
    let weight = 0, x = 0, y = 0, z = 0;
    for (const p of visible) {
      const w = Math.max(0, Math.min(1, p.luminance01)) * (1 - p.ageSec / Math.max(0.16, p.lifetimeSec));
      x += w * p.positionWorld[0];
      y += w * p.positionWorld[1];
      z += w * p.positionWorld[2];
      weight += w;
    }
    if (weight < 1e-6) continue;
    sources.push({
      id: skid,
      positionWorld: [x / weight, Math.max(0.05, y / weight + 0.12), z / weight],
      intensity: Math.min(20, weight * 1.25 * gain),
    });
  }
  return sources;
}

export const NightCircuitWorld: React.FC<NightCircuitWorldProps> = ({
  motion, referenceDistanceM, particles = [], exposure = 1, showEnvironment = true,
}) => {
  const scene = useMemo(buildNightWorld, []);
  const activeDistanceM = motion?.routeDistanceM ?? referenceDistanceM;
  // These twelve emissive lamp fixtures remain visible. Software WebGL only
  // shades nearby dynamic point lights, avoiding twelve costly full-frame lights.
  // Absolute-distance selection makes out-of-order Remotion frames deterministic.
  scene.traverse(node => {
    if (!(node instanceof THREE.PointLight) || node.name !== 'ep004-steady-local-circuit-light') return;
    const d = node.userData.ep004LightDistanceM as number;
    const weight = activeDistanceM === undefined ? 0.24 :
      lampIntensityWeight(activeDistanceM, d, routeLength('track'));
    node.visible = weight > 0.08;
    node.intensity = 64 * weight;
  });
  useEffect(() => () => disposeObject(scene), [scene]);
  const contactLights = useMemo(() => deriveContactSparkLights(particles, exposure), [particles, exposure]);

  return <>
    <WorldLighting timeOfDay="night"/>
    {showEnvironment && <primitive object={scene}/>}
    {contactLights.map(light => (
      <pointLight
        key={light.id}
        position={light.positionWorld}
        color="#ffd6a3"
        intensity={light.intensity}
        distance={5.2}
        decay={2}
      />
    ))}
  </>;
};
