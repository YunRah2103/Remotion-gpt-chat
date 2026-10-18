/**
 * YUNEX BRAKING 200 — cross-agent contract v1.
 * The kit is the source of truth for geometry/scale. This file defines
 * interchangeable episode-level interfaces; Agent 2 OWNS implementation
 * of the deterministic physics sampler (not supplied by this contract).
 */
import type {VehicleSpec} from '../world-kit/catalog.ts';
export const BRAKING_EP001 = {
  compositionId: 'YunexBraking200Ep001',
  fps: 30,
  width: 1080,
  height: 1920,
  provisionalFrames: 750,
  speedStartKmh: 200,
  vehicleVariant: 'grand-tourer',
  environment: 'track',
  timeOfDay: 'day',
  carPaint: '#35546e',
  caliperAccent: '#d2a36c',
  environmentSeed: 12,
} as const;

/** Metres. Kit axes +X forward, +Y up, +Z left. Surface at y=0. */
export type Vec3 = readonly [number, number, number];
export type Axle = 'front' | 'rear';
export type Side = 'left' | 'right';
export type WheelKey = `${Axle}-${Side}`;
export type WheelAnchor = {
  id: WheelKey;
  axle: Axle;
  side: Side;
  center: Vec3;
  radiusM: number;
  steering: boolean;
};

/**
 * Road-car wheel pivot coordinates match the reusable kit vehicles.ts.
 * The existing kit wheel calipers are placeholders; Agent 1 must overlay
 * a cinematic rig without permanently replacing shared kit geometry.
 */
export function wheelAnchors(spec: VehicleSpec): readonly WheelAnchor[] {
  if (spec.family !== 'sports' && spec.family !== 'normal' && spec.family !== 'suv') {
    throw new Error('Braking200 wheel anchors are defined for kit passenger cars');
  }
  const z = spec.width / 2 - 0.09;
  return (['front', 'rear'] as const).flatMap((axle) =>
    (['left', 'right'] as const).map((side) => ({
      id: `${axle}-${side}` as WheelKey,
      axle, side,
      center: [axle === 'front' ? spec.wheelbase / 2 : -spec.wheelbase / 2,
        spec.radius, side === 'left' ? z : -z] as Vec3,
      radiusM: spec.radius,
      steering: axle === 'front',
    })),
  );
}

/** Authoritative output supplied by Agent 2. All animation is seek-stable. */
export type WheelBrakingState = {
  angularSpeedRadPerSec: number;
  rotationRad: number;
  slipRatio: number;  // 0 rolling; near 1 approaching wheel lock
  normalLoadN: number;
  roadLongitudinalForceN: number;
  brakePressure01: number;
  absIntervening: boolean; // only when an illustrated lock-tendency scenario occurs
};
export type BrakingSimulationState = {
  simTimeSec: number;
  speedMps: number;
  traveledM: number;
  decelerationMps2: number;
  pitchRad: number; // visual body-pitch cue, bounded and physically plausible
  wheel: Record<WheelKey, WheelBrakingState>;
  brakeHeatJ: number; // illustrative thermal-energy budget, not literal disc temperature
};
export type SampleBrakingSimulation = (simTimeSec: number) => BrakingSimulationState;

/** Agent 1 consumes Agent 2 state; physics never goes into presentational shaders. */
export type BrakeAssemblyPose = {
  wheel: WheelKey;
  wheelRotationRad: number;
  pressure01: number;
  padTravelM: number; // true metres, no visually inflated caliper closure
  cutaway01: number; // 0 assembled, 1 educational cutaway
  heatIllustration01: number; // clearly illustrative; not an exact temperature
};

export type FilmCue = 'hook'|'mechanism'|'heat'|'grip'|'abs'|'finale';
export type TimedCue = {cue: FilmCue; fromFrame: number; toFrameExclusive: number};
/** Editorial placeholders only; Editor (Agent 6) retimes to the final VO. */
export const PROVISIONAL_CUES: readonly TimedCue[] = [
  {cue:'hook',fromFrame:0,toFrameExclusive:120},
  {cue:'mechanism',fromFrame:120,toFrameExclusive:255},
  {cue:'heat',fromFrame:255,toFrameExclusive:385},
  {cue:'grip',fromFrame:385,toFrameExclusive:505},
  {cue:'abs',fromFrame:505,toFrameExclusive:650},
  {cue:'finale',fromFrame:650,toFrameExclusive:750},
];
/** Agent 3 cameras: metres, world-space vectors, angle in radians. */
export type CinematicCameraPose = {
  position: Vec3;
  target: Vec3;
  fovDeg: number;
  focusId?: WheelKey|'vehicle'|'road';
};
export type AgentHandoff = {
  agent: 1|2|3|4|5;
  branch: string;
  implementationCommit: string;
  sourcePaths: string[];
  motionPreviewRunUrl: string;
  motionPreviewArtifactUrl: string;
  renderFrames: number;
  fps: number;
  ffprobeVerified: boolean;
  fullDecodeVerified: boolean;
  notes: string[];
};
/**
 * Owner file boundaries (all under src/yunex/braking200/):
 * A1 engineering/**, A2 physics/**, A3 cameras/**,
 * A4 lookdev/**, A5 graphics/**. Contract is manager-owned.
 * Each branch MUST fork from production/braking-200kmh-ep001-contract
 * after the manager marks it ready. No direct main edits.
 */