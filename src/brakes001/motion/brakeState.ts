/**
 * Carbon-ceramic brake frame-deterministic motion and illustrative heat state.
 * Rotor/hub rotate about X; disc plane YZ; units SI and radians.
 * NOT temperature calibration, friction certification, FEA or vehicle stopping data.
 */
export const BRAKE_FPS = 30;
export const BRAKE_FRAMES = 750;
export const ROTOR_OUTER_RADIUS_M = 0.195;
export const ROTOR_HALF_THICKNESS_M = 0.017;
export const PAD_REST_GAP_M = 0.006;
export const PAD_CONTACT_CLEARANCE_M = 0.0003;
const INITIAL_SPEED = 62; // Illustrative rotor radians/s, not road speed.
const SUBSTEPS_PER_FRAME = 8;
const DT = 1 / (BRAKE_FPS * SUBSTEPS_PER_FRAME);
type Cycle = Readonly<{
  start: number; end: number; rampIn: number; rampOut: number;
  peak: number; deceleration: number;
}>;
const smoothstep = (v: number): number => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};
const cyclePressure = (t: number, c: Cycle): number =>
  t <= c.start || t >= c.end ? 0 :
    c.peak * smoothstep((t - c.start) / c.rampIn) *
    smoothstep((c.end - t) / c.rampOut);
const effectiveDuration = (start: number, end: number, rampIn: number, rampOut: number) =>
  end - start - 0.5 * (rampIn + rampOut);
const firstStart = 3.15, firstEnd = 12.8;
const secondStart = 15.15, secondEnd = 19.95;
const FIRST_TARGET_EXIT_RAD_S = 26;
/** Two controlled braking cycles separated by a released cooling interval. */
export const BRAKE_CYCLES: readonly Cycle[] = Object.freeze([
  {start:firstStart, end:firstEnd, rampIn:0.75, rampOut:0.7, peak:1,
    deceleration:(INITIAL_SPEED - FIRST_TARGET_EXIT_RAD_S) /
      effectiveDuration(firstStart,firstEnd,0.75,0.7)},
  {start:secondStart, end:secondEnd, rampIn:0.5, rampOut:0.65, peak:1,
    deceleration:FIRST_TARGET_EXIT_RAD_S /
      effectiveDuration(secondStart,secondEnd,0.5,0.65)},
]);
/** padGapMetres is the clearance per pad face, NOT the sum of both gaps. */
export type BrakeMotionState = Readonly<{
  rotorAngleRad: number;
  rotorSpeedRadPerSec: number;
  brakePressure01: number;
  padGapMetres: number;
  heat01: number;
  cooling01: number;
  timeSeconds: number;
}>;
const pressureAt = (t: number): number =>
  BRAKE_CYCLES.reduce((sum, c) => sum + cyclePressure(t,c),0);
const decelerationAt = (t: number): number =>
  BRAKE_CYCLES.reduce((sum,c) => sum + c.deceleration * cyclePressure(t,c),0);

const buildStateTable = (): readonly BrakeMotionState[] => {
  const states: BrakeMotionState[] = [];
  let angle = 0, speed = INITIAL_SPEED, heat = 0;
  for (let frame=0; frame<BRAKE_FRAMES; frame++) {
    const t = frame/BRAKE_FPS, p = pressureAt(t), boundedHeat = Math.max(0, Math.min(1, heat));
    states.push(Object.freeze({
      rotorAngleRad:angle,
      rotorSpeedRadPerSec:Math.max(0,speed),
      brakePressure01:p,
      padGapMetres:PAD_REST_GAP_M - p*(PAD_REST_GAP_M - PAD_CONTACT_CLEARANCE_M),
      heat01:boundedHeat, cooling01:boundedHeat * (1-p), timeSeconds:t,
    }));
    for (let sub=0; sub<SUBSTEPS_PER_FRAME; sub++) {
      const before=t+sub*DT, after=before+DT, speedBefore=speed;
      const torque=(decelerationAt(before)+decelerationAt(after))*0.5;
      speed=Math.max(0,speedBefore-torque*DT);
      angle+=(speedBefore+speed)*0.5*DT;
      const avgSpeed=(speedBefore+speed)*0.5;
      const pressure=pressureAt(before+DT*0.5);
      // Bounded friction-work-like input minus gradual cooling; normalized illustration only.
      const gain=0.34*pressure*(0.22+0.78*avgSpeed/INITIAL_SPEED)*(1-0.60*heat);
      const loss=(0.055+0.06*avgSpeed/INITIAL_SPEED)*heat;
      heat=Math.max(0,Math.min(1,heat+(gain-loss)*DT));
    }
  }
  return Object.freeze(states);
};
const TABLE = buildStateTable();
/** Pure lookup, safe for out-of-order Remotion renders and arbitrary shot cuts. */
export const brakeStateAt = (frame: number): BrakeMotionState => {
  if (!Number.isFinite(frame)) throw new RangeError('frame must be finite');
  return TABLE[Math.min(BRAKE_FRAMES-1,Math.max(0,Math.floor(frame)))];
};
/**
 * Rotate the parent RotorAssembly ONCE if Hat and Hub are its children.
 * If they are independent siblings, set each sibling to this same angle.
 * Agent A's rig rest positions remain unchanged.
 */
export const brakePoseAt = (frame: number): Readonly<{
  rotorXRotationRad: number; hubXRotationRad: number;
  innerPadLocalXMetres: number; outerPadLocalXMetres: number;
  fixedCaliperXRotationRad: 0;
}> => {
  const s=brakeStateAt(frame);
  const travel=PAD_REST_GAP_M - s.padGapMetres;
  return {rotorXRotationRad:s.rotorAngleRad,hubXRotationRad:s.rotorAngleRad,
    innerPadLocalXMetres:travel,outerPadLocalXMetres:-travel,
    fixedCaliperXRotationRad:0};
};
/** False colour only on annular friction track, on BOTH rotor faces. */
export const frictionTrackHeat01At = (frame: number,radiusMetres: number): number => {
  if (!Number.isFinite(radiusMetres)) throw new RangeError('radius must be finite');
  return brakeStateAt(frame).heat01 *
    smoothstep((radiusMetres-0.126)/0.007) *
    smoothstep((0.190-radiusMetres)/0.007);
};
