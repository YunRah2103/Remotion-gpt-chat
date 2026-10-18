/**
 * ISOLATED GRAPHICS PREVIEW FIXTURE ONLY. NOT AUTHORITATIVE PHYSICS.
 * DO NOT import in the film. A2's sampleBrakingSimulation owns production.
 * This deterministic fixture lets Agent 5 demonstrate animation geometry
 * before A2 merges, with a deliberately labelled ABS low-grip insert.
 */
import type {
  BrakingSimulationState,WheelBrakingState,WheelKey,
} from '../contracts.ts';
import {clamp01} from './logic.ts';

const V0=200/3.6;
const TSTOP=8; // test-only, NOT a reported stopping claim
const DECEL=V0/TSTOP;
export function sampleGraphicsProofOnly(seconds:number):BrakingSimulationState{
  const t=Math.max(0,Math.min(TSTOP,seconds));
  const speed=Math.max(0,V0-DECEL*t);
  const traveled=V0*t-DECEL*t*t/2;
  const illustratingLockTendency=seconds>=3.25&&seconds<4.9;
  const modulation=illustratingLockTendency?.67+.21*Math.sin(seconds*16):.89;
  const nearLock=illustratingLockTendency?.22+.09*Math.sin(seconds*10):.045;
  const wheel=(id:WheelKey):WheelBrakingState=>{
    const front=id.startsWith('front');
    const normal=front?4900:3200;
    return {
      angularSpeedRadPerSec:speed/.36*(1-clamp01(nearLock)),
      rotationRad:-traveled/.36, // presentation model's +Z wheel axis
      slipRatio:clamp01(nearLock),
      normalLoadN:normal,
      roadLongitudinalForceN:-normal*(illustratingLockTendency?.59:.72),
      brakePressure01:clamp01(modulation),
      absIntervening:illustratingLockTendency,
    };
  };
  return {
    simTimeSec:seconds,
    speedMps:speed,
    traveledM:traveled,
    decelerationMps2:seconds<TSTOP?DECEL:0,
    pitchRad:seconds<.5?.015:0,
    wheel:{
      'front-left':wheel('front-left'),'front-right':wheel('front-right'),
      'rear-left':wheel('rear-left'),'rear-right':wheel('rear-right'),
    },
    brakeHeatJ:Math.max(0,.5*1480*(V0*V0-speed*speed)*.72),
  };
}
