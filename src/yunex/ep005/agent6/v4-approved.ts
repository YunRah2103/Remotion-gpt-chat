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
  version: 1,
  coordinateConvention: 'three-y-up-metres',
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
    'rear-proof':    {a:[-9.0,2.08, 5.3], b:[-8.4,1.74, 4.8], fov:43, target:[-.35,.83,0]},
    'side-tracking': {a:[-.7,1.40,-10.8],b:[2.3,1.25,-9.25],fov:43,target:[.25,.79,0]},
    'front-pursuit': {a:[10.7,1.90,-5.2],b:[9.5,1.56,-4.5], fov:43,target:[.15,.84,0]},
    'rear-chase':    {a:[-13.0,2.16,-2.8],b:[-11.0,1.74,-2.1],fov:41,target:[0,.77,0]}
  }[shot];
  if (!settings) throw Error('Unknown V4 moving shot');
  const lerp=(a:number,b:number)=>THREE.MathUtils.lerp(a,b,smooth);
  const position = settings.a.map((value,i)=>value+p.x+(i===0?0:-p.x) + (settings.b[i]-value)*smooth);
  // X is the moving travel axis; Y/Z are pure offsets.
  position[0]=p.x+lerp(settings.a[0],settings.b[0]);
  position[1]=lerp(settings.a[1],settings.b[1]);
  position[2]=lerp(settings.a[2],settings.b[2]);
  const target:[number,number,number]=[p.x+settings.target[0],settings.target[1],settings.target[2]];
  return {position:position as [number,number,number], target, fov:settings.fov};
}
