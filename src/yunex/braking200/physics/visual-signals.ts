/** Pure explanatory visual mappings driven exclusively by physical sampler state.
 * Effects are stylized, NOT measured tyre deformation or suspension travel. */
import type {BrakingSimulationState} from '../contracts.ts';
import {BRAKING_MODEL} from './simulation.ts';

const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));

export type VisualPhysicsSignals={
  frontLoadDeltaN:number;
  frontLoadDeltaKN:number;
  /** Illustrative coil travel, bounded to plausible visible scale (not measured). */
  illustrativeSpringCompressionM:number;
  /** Elliptical ground highlight length, not real tyre deformation. */
  illustrativeContactLengthM:number;
  illustrativeContactOpacity:number;
  roadForceN:number;
  illustrativeGripStreakM:number;
  brakePressure01:number;
  slipRatio:number;
  absPressureRelease:boolean;
};

export function physicsVisualSignals(s:BrakingSimulationState):VisualPhysicsSignals{
  const m=BRAKING_MODEL;
  const w=s.wheel['front-left'];
  const staticFrontN=m.illustrativeMassKg*m.gravityMps2*m.staticFrontLoadFraction/2;
  const extra=Math.max(0,w.normalLoadN-staticFrontN);
  const force=Math.max(0,w.roadLongitudinalForceN);
  return {
    frontLoadDeltaN:extra,
    frontLoadDeltaKN:extra/1000,
    illustrativeSpringCompressionM:clamp(extra/76000,0,.025),
    illustrativeContactLengthM:.18+clamp(extra/58000,0,.055),
    illustrativeContactOpacity:clamp(force/15000,0,.23),
    roadForceN:force,
    illustrativeGripStreakM:clamp(force/21000,0,.15),
    brakePressure01:w.brakePressure01,
    slipRatio:w.slipRatio,
    absPressureRelease:w.absIntervening,
  };
}
