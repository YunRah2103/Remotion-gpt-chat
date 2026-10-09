/**
 * Strict typed adapter between B's motion contract and A's native geometry.
 * B's padGapMetres is the distance PER FACE, not combined gap or pad translation.
 * A places the friction faces at x ±0.0155m and positions the pad lining so its
 * nearest face is ±(0.0155 + padGapMetres). Caliper remains a stationary sibling.
 */
import {brakeStateAt} from '../motion/brakeState';
import {brakeShotAt} from '../cinema/cameraMath';

// Agent A's rig guarantees 2.5mm *nominal* clearance at full release.
// B's 6mm motion stand-in must not move these physical pads 5.7mm.
const HARDWARE_REST_GAP_M = .0025;
const SAFE_FACE_CLEARANCE_M = .00015;
export const padGapForHardware = (pressure01: number): number => {
  const p=Math.min(1,Math.max(0,pressure01));
  return SAFE_FACE_CLEARANCE_M+(HARDWARE_REST_GAP_M-SAFE_FACE_CLEARANCE_M)*(1-p);
};
export type IntegrationState = Readonly<{
  frame: number;
  shot: ReturnType<typeof brakeShotAt>;
  rotorAngleRad: number;
  rotorSpeedRadPerSec: number;
  padGapMetres: number;
  brakePressure01: number;
  heat01: number;
  isCaliperStatic: true;
}>;
export const integrationStateAt = (frame: number): IntegrationState => {
  const s = brakeStateAt(frame);
  return {
    frame: Math.max(0, Math.min(749, Math.floor(frame))),
    shot: brakeShotAt(frame),
    rotorAngleRad: s.rotorAngleRad,
    rotorSpeedRadPerSec: s.rotorSpeedRadPerSec,
    padGapMetres: padGapForHardware(s.brakePressure01),
    brakePressure01: s.brakePressure01,
    heat01: s.heat01,
    isCaliperStatic: true,
  };
};
