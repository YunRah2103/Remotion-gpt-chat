/** Honest separation between actual 7–9s physics and ~25s cinematic editorial. */
import {sampleBrakingSimulation} from './simulation.ts';
import type {BrakingSimulationState} from '../contracts.ts';

const DRY_KEYS:readonly (readonly [number,number])[]=[
  [0,0],[120,1.15],[255,2.60],[385,3.95],[505,5.45],[650,6.8],[750,10],
];
function map(frame:number,keys:readonly (readonly [number,number])[]):number{
  if(!Number.isFinite(frame))throw new RangeError('frame must be finite');
  const f=Math.max(0,Math.min(frame,keys[keys.length-1][0]));
  for(let i=1;i<keys.length;i++)if(f<=keys[i][0]){
    const [f0,t0]=keys[i-1],[f1,t1]=keys[i];
    return t0+(t1-t0)*(f-f0)/(f1-f0);
  }
  return keys[keys.length-1][1];
}
export function mapFilmFrameToSimulationSec(frame:number):number{return map(frame,DRY_KEYS);}
export function mapAbsInsertFrameToSimulationSec(localFrame:number):number{
  // Distinct labelled low-grip demonstration, not a continuation of the dry stop!
  return map(localFrame,[[0,.70],[35,1.12],[90,1.85],[145,2.83]]);
}
export function sampleMainFilmFrame(frame:number):BrakingSimulationState{
  return sampleBrakingSimulation(mapFilmFrameToSimulationSec(frame));
}
export function sampleIllustrativeAbsFrame(frame:number):BrakingSimulationState{
  return sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(frame),'low-grip-abs');
}
