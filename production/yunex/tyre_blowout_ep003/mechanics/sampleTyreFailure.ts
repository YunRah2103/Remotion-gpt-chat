import {assertEpisodeTime, EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame, WheelId} from '../shared/contract.ts';

/** Pure visual tyre response, not a measured pressure / carcass simulation. */
export type TyreFailureParams = {
  failureStartSec?: number;
  pressureFallSec?: number;
  wheelRadiusM?: number;
  severity?: number;
  wheel?: WheelId;
  angularPhaseRad?: number;
  /** Optional wheel phase from Agent 2; this module never integrates car movement. */
  treadSeparation?: number;
};
const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const s=clamp01(v);return s*s*(3-2*s);};
export const MAX_LOADED_DROP_M=.074;
export const LOW_PRESSURE_RATIO=.10;

/**
 * At 100% illustrative failure, R_loaded = 0.360 - 0.074 = 0.286 m.
 * Rim lip radius is ~0.255 m, giving at least 31 mm road clearance.
 * Frame-local, deterministic, seekable/reversible. No speed, yaw or force claims.
 */
export function sampleTyreFailure(tSec:number,params:TyreFailureParams={}):TyreFrame {
  assertEpisodeTime(tSec);
  const start=params.failureStartSec??EP003_SCENE.referenceFailureStartSec;
  const fall=params.pressureFallSec??EP003_SCENE.referencePressureFallSec;
  const radius=params.wheelRadiusM??EP003_SCENE.wheelRadiusM;
  const severity=params.severity??1;
  const angle=params.angularPhaseRad??0;
  const separation=params.treadSeparation??0;
  if (![start,fall,radius,severity,angle,separation].every(Number.isFinite)
    || start<0 || fall<=0 || radius<=0 || severity<0 || severity>1
    || separation<0 || separation>1) throw new Error('Invalid tyre failure parameters');
  const wheel=params.wheel??EP003_SCENE.failedWheel;
  if (!(['front-left','front-right','rear-left','rear-right'] as string[]).includes(wheel))
    throw new Error('Unknown wheel');
  const progress=ease((tSec-start)/fall);
  const damage=progress*severity;
  // Other wheels remain unaffected unless the caller explicitly chooses a failing wheel.
  const loadedDrop=MAX_LOADED_DROP_M*damage*(radius/EP003_SCENE.wheelRadiusM);
  return {
    tSec, failureProgress:progress, pressureRatio:1-(1-LOW_PRESSURE_RATIO)*damage,
    sidewallCompression:damage,
    treadSeparation:separation*damage,
    angularPhaseRad:angle,
    effectiveRadiusM:radius-loadedDrop
  };
}

/** Lower corner as tyre support falls; Agent 2 can consume effectiveRadiusM. */
export function effectiveTyreSupportLossM(frame:TyreFrame,radiusM=EP003_SCENE.wheelRadiusM):number {
  return Math.max(0,Math.min(radiusM*.3,radiusM-frame.effectiveRadiusM));
}
