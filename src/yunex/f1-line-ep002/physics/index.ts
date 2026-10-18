import {fixtureRacePaths} from './fixture-paths.ts';
import {makeRaceSimulator,REPRESENTATIVE_F1_CONFIG} from './simulation.ts';
import type {RaceCarId,RacePath} from '../contract.ts';

export {
  REPRESENTATIVE_F1_CONFIG,buildCarProfile,makeRaceSimulator,sampleCarAtTime,
  effectiveNormalLoadN,tyreForceLimitN,lateralAccelerationMps2,
  lateralForceN,remainingLongitudinalAccelerationMps2,localSpeedLimitMps
} from './simulation.ts';
export type {DynamicsConfig,CarProfile,SpeedNode,RaceComparison,CarComparison} from './simulation.ts';
export {fixtureRacePaths,FIXTURE_SCENARIO} from './fixture-paths.ts';

/** A1 integration: makeRaceSimulator({shortcut: makeRacingLinePath('shortcut'),
 * racing:makeRacingLinePath('racing')}); never modify or rescale their paths. */
export const fixtureSimulator=makeRaceSimulator(fixtureRacePaths,REPRESENTATIVE_F1_CONFIG);
// Immutable path identity cache: no mutable integrator/time stepping inside Remotion.
const cache=new WeakMap<RacePath,WeakMap<RacePath,ReturnType<typeof makeRaceSimulator>>>();
export const sampleRaceFrame=(frame:number,fps:number,paths?:Record<RaceCarId,RacePath>)=>{
  if(!paths)return fixtureSimulator.sample(frame,fps);
  let inner=cache.get(paths.shortcut);
  if(!inner){inner=new WeakMap();cache.set(paths.shortcut,inner);}
  let sim=inner.get(paths.racing);
  if(!sim){sim=makeRaceSimulator(paths,REPRESENTATIVE_F1_CONFIG);inner.set(paths.racing,sim);}
  return sim.sample(frame,fps);
};
export const getRaceComparison=()=>fixtureSimulator.comparison;
