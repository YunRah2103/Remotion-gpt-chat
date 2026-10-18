import {makeRacingLinePath} from '../track/racingPaths.ts';
import {makeRaceSimulator,REPRESENTATIVE_F1_CONFIG} from './simulation.ts';
import type {RaceCarId,RacePath} from '../contract.ts';

export {
  REPRESENTATIVE_F1_CONFIG,buildCarProfile,makeRaceSimulator,sampleCarAtTime,
  effectiveNormalLoadN,tyreForceLimitN,lateralAccelerationMps2,
  lateralForceN,remainingLongitudinalAccelerationMps2,localSpeedLimitMps
} from './simulation.ts';
export type {DynamicsConfig,CarProfile,SpeedNode,RaceComparison,CarComparison} from './simulation.ts';

/**
 * PR #166 authoritative geometry: two paths at the EXACT same physical
 * timing gates. No synthetic path substitutions or hard-coded winner.
 * When Agent 1 updates its path code, copy in that exact revision, rerun
 * tests and regenerate the signed comparison report BEFORE film integration.
 */
export const AUTHORITATIVE_RACE_PATHS:Readonly<Record<RaceCarId,RacePath>>=Object.freeze({
  shortcut:makeRacingLinePath('shortcut'),
  racing:makeRacingLinePath('racing'),
});
export const raceSimulator=makeRaceSimulator(AUTHORITATIVE_RACE_PATHS,REPRESENTATIVE_F1_CONFIG);

// Optional dependency injection permits isolated geometry regressions.
const cache=new WeakMap<RacePath,WeakMap<RacePath,ReturnType<typeof makeRaceSimulator>>>();
export const sampleRaceFrame=(frame:number,fps:number,paths?:Record<RaceCarId,RacePath>)=>{
  if(!paths)return raceSimulator.sample(frame,fps);
  let inner=cache.get(paths.shortcut);
  if(!inner){inner=new WeakMap();cache.set(paths.shortcut,inner);}
  let sim=inner.get(paths.racing);
  if(!sim){sim=makeRaceSimulator(paths,REPRESENTATIVE_F1_CONFIG);inner.set(paths.racing,sim);}
  return sim.sample(frame,fps);
};
export const getRaceComparison=()=>raceSimulator.comparison;
