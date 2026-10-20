/** YUNEX EP004 inter-department interface; owned only by Agent 0.
 * metres, +X vehicle forward, +Y up, +Z left; seconds and radians.
 * Fields are illustrative quantities, not actual F1 telemetry.
 */
export const EP004 = {
  id: 'YUNEX-EP004',
  name: 'WHY DO F1 CARS SHOOT SPARKS?',
  width: 1080,
  height: 1920,
  fps: 30,
  vehicleVariant: 'formula-modern',
  trackKind: 'track',
  trackSeed: 12,
  timeOfDay: 'night',
  carLengthM: 5.4,
  carWidthM: 1.98,
  wheelbaseM: 3.42,
  wheelRadiusM: 0.36,
  wheelZAbsM: 0.83,
  initialSkidBottomClearanceM: 0.065,
  previewDistanceStartM: 72,
  previewSpeedMps: 62,
} as const;

export type Vec3 = readonly [number,number,number];
export type WheelId = 'front-left'|'front-right'|'rear-left'|'rear-right';
export type SkidId = 'forward'|'middle'|'rear';

export type SkidDescriptor = Readonly<{
  id: SkidId;
  localBottomPoint: Vec3;
  metal: true;
  // Local coordinates on approved Agent 1 hero vehicle; the lowest skid surface
  // remains a discrete metallic part attached to plank assembly.
}>;

export type VehicleMotionState = Readonly<{
  tSec: number;
  routeDistanceM: number;
  speedMps: number;
  // Absolute world-space root with kit route; world yaw rotates local +X forward.
  worldPosition: Vec3;
  yawRad: number;
  pitchRad: number;
  rollRad: number;
  wheelRotationRad: number;
  heaveM: number;
  // Non-negative suspension compression relative to baseline, for rendering.
  wheelCompressionM: Readonly<Record<WheelId,number>>;
  downforceProxy01: number; // unitless art-direction value, not a Newton figure
}>;

export type SkidContact = Readonly<{
  skidId: SkidId;
  pointWorld: Vec3;         // actual skid-road interface; never exhaust/floor
  normalWorld: Vec3;
  signedGapM: number;       // >0 clear of road; <=0 in contact
  relativeSpeedMps: number;
  contactIntensity01: number;
  active: boolean;
}>;

export type SparkParticle = Readonly<{
  id: number;
  emitterSkidId: SkidId;
  startSec: number;
  ageSec: number;
  lifetimeSec: number;
  positionWorld: Vec3;
  velocityWorld: Vec3;
  radiusM: number;
  luminance01: number;
}>;

export type ShotId =
  'spark-hook'|'rear-mystery'|'underfloor-reveal'|'aero-load'|'contact-macro'|'racing-payoff';
export type CameraPose = Readonly<{
  positionWorld: Vec3;
  targetWorld: Vec3;
  fovDeg: number;
  rollRad?: number;
  focusDistanceM?: number;
}>;
export type StoryRequest = Readonly<{
  shot: ShotId;
  tSec: number;
  shotLocalSec: number;
  shotDurationSec: number; // retimeable after recorded VO, not a hard edit
  motion: VehicleMotionState;
  contacts: readonly SkidContact[];
  particles: readonly SparkParticle[];
}>;
export type VisualPreviewEvidence = Readonly<{
  commitSha: string;
  prUrl: string;
  renderCommand: string;
  mp4Url: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  decodedAllFrames: boolean;
  visuallyReviewedFrames: readonly number[];
}>;
