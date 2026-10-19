/** YUNEX EP003 manager-owned public contract. Keep all scene controls deterministic. */
export const EP003_ASSET_SHA = 'd31fbaa0f95abc468a3294ef2a1b2f6baa84bccb' as const;
export const EP003_SCENE = {
  hero: 'grand-tourer' as const, environment: 'highway' as const,
  timeOfDay: 'day' as const, paint: '#4A667E' as const,
  wheelbaseM: 2.92, wheelRadiusM: .36, vehicleWidthM: 1.94,
  failedWheel: 'front-right' as const,
  frontRightAnchorM: [1.46, .36, -.88] as const,
  referenceFailureStartSec: .75,
  referencePressureFallSec: .30,
  illustrativeInitialSpeedMps: 27.78
} as const;
export type Vec3 = readonly [number,number,number];
export type WheelId = 'front-left'|'front-right'|'rear-left'|'rear-right';
export type WheelFrame = {
  wheel: WheelId;
  hubWorldM: Vec3;
  steeringRad: number;
  spinRad: number;
  rollingRadiusM: number;
  verticalCompressionM: number;
  normalLoadN?: number;
  longitudinalForceN?: number;
  lateralForceN?: number;
  contactFraction?: number; // 0..1, illustrative
};
export type TyreFrame = {
  tSec: number;
  failureProgress: number; // 0..1
  pressureRatio: number; // 1 prior to incident; relative, not gauge pressure
  sidewallCompression: number; // 0..1 visual control; physically plausibility checked by Agent 1
  treadSeparation: number; // 0..1, zero for rapid-deflation default
  angularPhaseRad: number; // authoritative wheel spin from Agent 2
  effectiveRadiusM: number;
};
export type VehicleDynamicsFrame = {
  tSec: number;
  positionM: Vec3;
  yawRad: number;
  pitchRad: number;
  rollRad: number;
  worldSpeedMps: number;
  distanceTravelledM: number;
  driverSteerRad: number;
  driverThrottle01: number;
  driverBrake01: number;
  wheels: Record<WheelId,WheelFrame>;
  stage: 'pre-failure'|'rapid-deflation'|'initial-stabilisation'|'gradual-slowdown'|'safe-exit';
};
export type EpisodeParams = {
  initialSpeedMps: number;
  failureStartSec: number;
  pressureFallSec: number;
  failedWheel: WheelId;
  roadGripScale: number;
  /** fixed driver scenario, values are absolute in simulation clock */
  driverModel: 'stabilise-then-gradually-slow';
};
export type CinemaRequest = {
  tSec: number; shot: 'tyre-hook'|'front-three-quarter'|'wheel-cutaway'|
    'overhead-dynamics'|'driver-cockpit'|'chase-recovery'|'safe-stop';
  dynamics: VehicleDynamicsFrame; tyre: TyreFrame;
  aspect: 'portrait';
};
export type StoryRequest = {
  tSec: number; segment: 'hook'|'pressure'|'forces'|'reaction'|'recovery'|'payoff';
  dynamics: VehicleDynamicsFrame; tyre: TyreFrame;
  showNumbers?: boolean;
};
export function assertEpisodeTime(tSec: number): void {
  if(!Number.isFinite(tSec)||tSec<0) throw new Error('EP003 expects finite nonnegative seconds');
}
