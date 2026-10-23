/**
 * EP005 Agent 6 — approved V4-A supercar ONLY.
 * All geometry comes from the immutable PR #233 source 9052a539.
 * Scene coordinates: +X forward, +Y up, +Z driver's left, metres.
 */
import * as THREE from 'three';
import {createCinematicVehicle, animateCinematicVehicle} from '../../modelling-kit/rig.ts';
import {TWIN_TURBO_V8} from '../../modelling-kit/v3-proofs.ts';

export const APPROVED_V4_SOURCE = '9052a539e10a7cb97487c1435455bb9962ad58e1';
export const APPROVED_V4_RECIPE_ID = 'v4-a-supercar';
export const APPROVED_V4_COLOR = '#18636b';
export const V4_DRIVING_FPS = 30;
export const V4_DRIVING_FRAMES = 120;
export const V4_EXHAUST_MANIFEST = {
  version: 2,
  vehicle: 'v4-a-supercar',
  coordinateConvention: 'world-three-y-up-metres',
  mountCoordinateConvention: 'three-y-up-metres',
  referenceApprovalUrl: 'https://github.com/YunRah2103/Remotion-gpt-chat/issues/247#issuecomment-6355059494',
  owner: 'agent6',
  source: APPROVED_V4_SOURCE,
  heroRecipe: APPROVED_V4_RECIPE_ID,
  sourceBranch: 'agent/ep005-06-hero-car-proof-cc0',
  units: 'metres',
  bodyCoordinateConvention: '+X forward, +Y up, +Z left',
  mounts: [
    {id: 'left', nodeName: 'exhaust-outlet-left', mouthOffset: [0,0,0], outward: [0,0,1], innerRadiusM: 0.052, outerDiameterM: 0.112},
    {id: 'right', nodeName: 'exhaust-outlet-right', mouthOffset: [0,0,0], outward: [0,0,1], innerRadiusM: 0.052, outerDiameterM: 0.112}
  ]
} as const;

export type V4Shot = 'rear-proof' | 'side-tracking' | 'front-pursuit' | 'rear-chase';

export function createApprovedV4(): THREE.Group {
  // Matches owner-approved V4 recipe vehicle exactly. Preserve factory defaults:
  // no additional trim, new bodywork, or custom exhaust geometry.
  const car = createCinematicVehicle({
    variant: 'supercar',
    bodyDetail: 'studio',
    driver: true,
    color: APPROVED_V4_COLOR,
    powertrain: TWIN_TURBO_V8,
    quality: 'hero',
    lights: true,
    optimize: true
  });
  car.name = 'ep005-agent6-approved-v4-a-supercar';
  for (const mount of V4_EXHAUST_MANIFEST.mounts) {
    const node = car.getObjectByName(mount.nodeName);
    if (!node || node.userData.role !== 'exhaust-outlet') {
      throw new Error('Approved V4 factory exhaust mount missing: ' + mount.nodeName);
    }
    if (Math.abs(node.userData.outerDiameter - mount.outerDiameterM) > 0.00001
      || Math.abs(node.userData.innerDiameter * 0.5 - mount.innerRadiusM) > 0.00001) {
      throw new Error('V4 exhaust dimensions changed: ' + mount.nodeName);
    }
  }
  car.userData = {...car.userData, approvalSource: APPROVED_V4_SOURCE, approvalScope: 'exterior-appearance-only'};
  return car;
}

/** Analytic absolute-frame world path: no per-frame state accumulation. */
export function drivingPose(frame: number, fps=V4_DRIVING_FPS) {
  if (!Number.isInteger(frame) || frame < 0 || !(fps > 0)) throw Error('Invalid frame or fps');
  const t = frame / fps;
  const speed = 26.5 + 1.45*t; // 95–116 km/h; actual longitudinal travel.
  const distance = 26.5*t + 0.725*t*t;
  return {frame, fps, t, speed, distance, acceleration: 1.45,
    x: -52 + distance, y: 0, z: 0, yaw: 0};
}

/** Animate wheels, steering and road-attached vehicle before sampling any mounts. */
export function poseApprovedV4(car: THREE.Group, frame: number, fps=V4_DRIVING_FPS) {
  const p = drivingPose(frame, fps);
  animateCinematicVehicle(car, {
    frame, fps, speed: p.speed, distance: p.distance,
    acceleration: p.acceleration, curvature: 0, steer: 0, compression: 0
  });
  car.position.set(p.x, p.y, p.z);
  car.rotation.set(0, p.yaw, 0);
  car.updateMatrixWorld(true);
  return p;
}

/**
 * World-space exhaust sampling after poseApprovedV4(). Physical mouths are
 * named factory geometry, nested under the moving body-shell/suspension rig.
 * Compatible with Agent 7's sampleActualPorts() manifest ABI.
 */
export function sampleV4Ports(car: THREE.Object3D, frame: number, fps=V4_DRIVING_FPS) {
  car.updateWorldMatrix(true, true);
  return V4_EXHAUST_MANIFEST.mounts.map((mount) => {
    const node = car.getObjectByName(mount.nodeName);
    if (!node) throw Error('Missing live approved V4 exhaust node ' + mount.nodeName);
    const origin = node.localToWorld(new THREE.Vector3(...mount.mouthOffset));
    const outward = new THREE.Vector3(...mount.outward).normalize().transformDirection(node.matrixWorld).normalize();
    if (![...origin.toArray(),...outward.toArray()].every(Number.isFinite)) {
      throw Error('Non-finite animated exhaust transform');
    }
    return {id:mount.id, nodeName:mount.nodeName, frame, fps, worldOrigin: origin.toArray(),
      worldOutward:outward.toArray(), innerRadiusM:mount.innerRadiusM,
      outerDiameterM:mount.outerDiameterM, matrixWorld:Array.from(node.matrixWorld.elements)};
  });
}

/**
 * Camera translates alongside ACTUALLY moving car. A gentle relative motion
 * reveals sculpted body rather than resorting to shaking/false speed blur.
 */
export function v4Camera(shot: V4Shot, frame: number, fps=V4_DRIVING_FPS) {
  const p = drivingPose(frame, fps), u=THREE.MathUtils.clamp(frame/(V4_DRIVING_FRAMES-1),0,1);
  const smooth=u*u*(3-2*u);
  const settings = {
    // Side: keep complete bumpers/wheels in narrow 9:16 aperture over all 120f.
    'rear-proof':    {a:[-8.9,1.70, 4.65],b:[-8.25,1.55, 4.4],fov:45,target:[-.25,.58,0]},
    'side-tracking': {a:[ .15,1.75,-13.8],b:[ .70,1.61,-13.2],fov:46,target:[ .15,.39,0]},
    // Front: tilt down to put the horizon higher and reveal road contact, not empty sky.
    'front-pursuit': {a:[ 9.65,2.70,-4.05],b:[ 9.30,2.52,-3.85],fov:48,target:[ .1,.40,0]},
    // Low but readable rear tail/outlet view, stable camera with exhaust in shot.
    'rear-chase':    {a:[-10.7,1.72,-3.1],b:[-9.4,1.55,-2.7],fov:44,target:[-.3,.52,0]}
  }[shot];
  if (!settings) throw Error('Unknown V4 moving shot');
  const lerp=(a:number,b:number)=>THREE.MathUtils.lerp(a,b,smooth);
  // X follows the genuine travelling vehicle; Y/Z remain steady world-space offsets.
  const position:[number,number,number] = [
    p.x+lerp(settings.a[0],settings.b[0]),
    lerp(settings.a[1],settings.b[1]),
    lerp(settings.a[2],settings.b[2]),
  ];
  const target:[number,number,number]=[p.x+settings.target[0],settings.target[1],settings.target[2]];
  return {position:position as [number,number,number], target, fov:settings.fov};
}
