import type {BrakeAssemblyPose, BrakingSimulationState, WheelKey} from '../contracts.ts';

/** True movement of a road-car disc pad: no educational scale inflation. */
export const MAX_PAD_TRAVEL_M = 0.0012;
export const ROTOR_FACE_HALF_SPACING_M = 0.012;
export const PAD_HALF_THICKNESS_M = 0.0065;
export const REST_PAD_CLEARANCE_M = MAX_PAD_TRAVEL_M;
export const MAX_CUTAWAY_EXPLOSION_M = 0.092;

export const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

/** Mechanical presentation ONLY. Agent 2 supplies both wheel angle and pressure. */
export function poseFromSimulation(
  simulation: BrakingSimulationState,
  wheel: WheelKey,
  cutaway01 = 0,
  heatIllustration01 = 0,
): BrakeAssemblyPose {
  const state = simulation.wheel[wheel];
  if (!state) throw new Error('Missing physics wheel state: ' + wheel);
  if (!Number.isFinite(state.rotationRad)) {
    throw new Error('Wheel angle must be finite: ' + wheel);
  }
  const pressure = clamp01(state.brakePressure01);
  return {
    wheel,
    // A2 expresses positive distance/radius; Three.js kit rolls -Z for +X forward.
    wheelRotationRad: -state.rotationRad,
    pressure01: pressure,
    padTravelM: pressure * MAX_PAD_TRAVEL_M,
    cutaway01: clamp01(cutaway01),
    heatIllustration01: clamp01(heatIllustration01),
  };
}

export function padFaceGapM(pose: BrakeAssemblyPose): number {
  return Math.max(0, REST_PAD_CLEARANCE_M - Math.max(0, Math.min(MAX_PAD_TRAVEL_M, pose.padTravelM)));
}

export function padCenterZ(pose: BrakeAssemblyPose, side: -1 | 1): number {
  const cutaway = clamp01(pose.cutaway01) * MAX_CUTAWAY_EXPLOSION_M;
  return side * (ROTOR_FACE_HALF_SPACING_M + PAD_HALF_THICKNESS_M + padFaceGapM(pose) + cutaway);
}
