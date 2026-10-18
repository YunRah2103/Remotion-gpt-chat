/**
 * YUNEX BRAKING 200 KM/H — immutable integration vocabulary.
 * Editorial timings are NOT physical time; map the film timeline to simulation time deliberately.
 * Source kit: feat/yunex-reusable-world-kit (PR #145), commit b6d1684d09f40af364fd920d22f5db542f49946b.
 */
import {vehicleSpec} from '../../world-kit/catalog.ts';

export const BRAKING_EP001 = {
  filmId: 'YUNEX_BRAKING_200KMH_EP001',
  compositionId: 'YunexBraking200kmhEp001',
  width: 1080,
  height: 1920,
  fps: 30,
  targetFrames: 750, // 25 seconds: provisional until final VO is timed
  vehicleVariant: 'coupe',
  vehicleColor: '#188f88',
  environment: 'airfield',
  environmentSeed: 12,
  timeOfDay: 'day',
  initialSpeedMps: 200 / 3.6,
  startRouteDistanceM: -80,
} as const;

export type WheelId = 'frontLeft'|'frontRight'|'rearLeft'|'rearRight';
export const WHEELS = ['frontLeft','frontRight','rearLeft','rearRight'] as const satisfies readonly WheelId[];

export type Vec3 = readonly [number,number,number];
export interface WheelState {
  /** Signed radial rotation around local wheel axis, radians, continuously integrated. */
  rotationRad: number;
  /** Angular velocity rad/s; cannot go negative while vehicle moves forward without explicitly modelling reverse spin. */
  angularSpeedRadS: number;
  /** Longitudinal wheel slip fraction: near 0 rolling, toward 1 impending lock. */
  slipRatio: number;
  /** Nominal requested brake-line pressure representation, normalised for cinematic illustration. */
  brakePressure01: number;
  /** True only when ABS is actively modulating during the demonstrated intervention. */
  absModulating: boolean;
}
export interface BrakingState {
  /** Vehicle physics-clock seconds, NOT film seconds. */
  tSeconds: number;
  /** Total forward travel since braking began; monotonically nondecreasing. */
  distanceM: number;
  speedMps: number;
  /** Vehicle forward-axis acceleration; negative under braking. */
  longitudinalAccelerationMps2: number;
  /** Dynamic axle load in newtons, for the illustrative vehicle and conditions. */
  frontAxleNormalLoadN: number;
  rearAxleNormalLoadN: number;
  /** Normalised HEAT explanation only, NOT a calibrated disc temperature. */
  brakeHeatIllustration01: number;
  wheels: Record<WheelId,WheelState>;
}
export interface BrakingPhysics {
  /** Pure deterministic function: same t -> same physics state; safe for out-of-order rendering. */
  sample: (tSeconds:number)=>BrakingState;
}

const vehicle=vehicleSpec(BRAKING_EP001.vehicleVariant);
const axleZ=vehicle.width/2-0.13;
/** Metres, in the car's local +X-forward, +Y-up, +Z-left space.
 * Front calipers/discs and contact patches are built around these wheel-centre locations.
 * Scene ground y=0. Caliper fixed to axle/steering pivot; disc rotates with the wheel.
 */
export const WHEEL_ANCHORS: Readonly<Record<WheelId,Vec3>> = {
  frontLeft: [vehicle.wheelbase/2, vehicle.radius, axleZ],
  frontRight: [vehicle.wheelbase/2, vehicle.radius, -axleZ],
  rearLeft: [-vehicle.wheelbase/2, vehicle.radius, axleZ],
  rearRight: [-vehicle.wheelbase/2, vehicle.radius, -axleZ],
} as const;
export const VEHICLE_WHEEL_RADIUS_M=vehicle.radius;

/**
 * Production ownership:
 * Agent 1 mechanics/, 2 physics/, 3 camera/, 4 lookdev/, 5 graphics/.
 * Agent 6 owns film/ after visual approval; Agent 7 owns audio/ after picture lock.
 * Nobody edits source world-kit files, shared/ or unrelated films without manager approval.
 */
