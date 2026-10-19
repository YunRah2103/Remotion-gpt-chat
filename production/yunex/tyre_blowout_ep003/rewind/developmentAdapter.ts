/**
 * TEMPORARY DEVELOPMENT ADAPTER ONLY. Never approve these illustrative
 * collision frames as Agent 8's actual crash/damage source.
 *
 * Uses actual A2 base trajectory and four original wheel/hub states.
 * Replaces ONLY the hypothetical wrong-control outcome to prove Agent9's
 * seekable reverse-clock plumbing before Agent8 delivers impact/**.
 * This is a storyboard-in-motion adapter, NOT a physical crash solver.
 */
import type {VehicleDynamicsFrame, WheelId} from '../shared/contract.ts';
import {sampleDynamics,DYNAMICS_DEFAULTS} from '../dynamics/model.ts';
import type {EpisodeParams} from '../shared/contract.ts';

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{const p=clamp(x);return p*p*(3-2*p);};
const IDs:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
/** A2's original safe model at the same absolute source clock and 70 mph. */
export const RESTART_PHYSICS:EpisodeParams={...DYNAMICS_DEFAULTS,initialSpeedMps:70*0.44704};
export function sampleControlledFrame(sourceTimeSec:number):VehicleDynamicsFrame {
  return sampleDynamics(sourceTimeSec,RESTART_PHYSICS);
}
/** For DEVELOPMENT CLIPS ONLY. Real production uses Agent 8's sampleCrashOutcome. */
export function sampleDevelopmentPanicFrame(
  sourceTimeSec:number,choiceSourceSec=4,impactSourceSec=6.1
):VehicleDynamicsFrame {
  if(![sourceTimeSec,choiceSourceSec,impactSourceSec].every(Number.isFinite) ||
     sourceTimeSec<choiceSourceSec || impactSourceSec<=choiceSourceSec)
    throw Error('Invalid development branch clock');
  const base=sampleControlledFrame(sourceTimeSec);
  // Crucially identical to A2 at the first decision frame, INCLUDING hubs.
  if(sourceTimeSec===choiceSourceSec)return base;
  const p=ease((sourceTimeSec-choiceSourceSec)/(impactSourceSec-choiceSourceSec));
  // Hypothetical lateral exit / no arbitrary instant teleport. At max,
  // front-right corner approaches the near right-hand rail at z~-7.8 m.
  // THIS IS TEMPORARY ART DIRECTION, NOT collision dynamics.
  const targetZ=-6.65;
  const shiftX=-2.5*p;
  const shiftZ=(targetZ-base.positionM[2])*p;
  const yaw=base.yawRad+(.18-base.yawRad)*p;
  const yawDelta=yaw-base.yawRad,co=Math.cos(yawDelta),si=Math.sin(yawDelta);
  const wheels={} as VehicleDynamicsFrame['wheels'];
  for(const id of IDs){
    const w=base.wheels[id];
    const bx=w.hubWorldM[0]-base.positionM[0],bz=w.hubWorldM[2]-base.positionM[2];
    wheels[id]={...w,hubWorldM:[
      base.positionM[0]+shiftX+bx*co+bz*si,
      w.hubWorldM[1],
      base.positionM[2]+shiftZ-bx*si+bz*co,
    ]};
  }
  return {...base,positionM:[
    base.positionM[0]+shiftX,base.positionM[1],base.positionM[2]+shiftZ
  ],wheels,yawRad:yaw,
    pitchRad:base.pitchRad+.042*p,rollRad:base.rollRad-.055*p,
    driverBrake01:Math.max(base.driverBrake01,.88*ease((sourceTimeSec-choiceSourceSec)/.30)),
    driverThrottle01:Math.max(0,base.driverThrottle01*(1-p)),
    driverSteerRad:base.driverSteerRad+.12*p,
    worldSpeedMps:base.worldSpeedMps*(1-.35*p),
  };
}
