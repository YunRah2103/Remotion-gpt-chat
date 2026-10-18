import {vehicleSpec} from '../../world-kit/catalog.ts';
import type {CarFrameState,RaceCarId,RaceFrameState} from '../contract.ts';
import {makeRacingLinePath} from '../track/racingPaths.ts';

export const FORMULA_RIG=Object.freeze({
  variant:'formula-modern' as const,
  wheelbaseM:vehicleSpec('formula-modern').wheelbase,
  tyreRadiusM:vehicleSpec('formula-modern').radius,
  lengthM:vehicleSpec('formula-modern').length,
  widthM:vehicleSpec('formula-modern').width,
});
export function steerFromCurvature(curvatureInvM:number){
  if(!Number.isFinite(curvatureInvM))throw new Error('Curvature must be finite');
  return Math.max(-.65,Math.min(.65,Math.atan(FORMULA_RIG.wheelbaseM*curvatureInvM)));
}
export function wheelRotationFromTravel(travelDistanceM:number){
  if(!Number.isFinite(travelDistanceM))throw new Error('Travel must be finite');
  return -travelDistanceM/FORMULA_RIG.tyreRadiusM;
}

/**
 * Agent-1 motion/shot demonstration only. No physical speed advantage is
 * asserted: both cars have the SAME constant illustrative speed, staggered
 * by 8m longitudinally to avoid contact near the shared apex.
 * Replace with Agent 2's authoritative sampleRaceFrame in the master film.
 */
export const PREVIEW_SPEED_MPS=9.7;
export function samplePreviewCar(id:RaceCarId,frame:number,fps:number):CarFrameState{
  if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid frame/fps');
  const timeSeconds=Math.max(0,frame/fps),path=makeRacingLinePath(id);
  const initialM=id==='shortcut'?12:4;
  const pathDistanceM=Math.min(path.lengthM,initialM+PREVIEW_SPEED_MPS*timeSeconds);
  const worldPose=path.sampleAtDistance(pathDistanceM);
  // Preview has equal forward motion only; acceleration/braking/tyre physics is A2.
  return {id,timeSeconds,pathDistanceM,worldPose,
    speedMps:pathDistanceM>=path.lengthM?0:PREVIEW_SPEED_MPS,
    longitudinalAccelMps2:0,lateralAccelMps2:PREVIEW_SPEED_MPS**2*worldPose.curvatureInvM,
    steerRad:steerFromCurvature(worldPose.curvatureInvM),
    travelDistanceM:pathDistanceM,brake01:0,throttle01:0,gripUtilization01:0};
}
export function samplePreviewRaceFrame(frame:number,fps=30):RaceFrameState{
  return {frame,fps,timeSeconds:frame/fps,cars:{
    shortcut:samplePreviewCar('shortcut',frame,fps),
    racing:samplePreviewCar('racing',frame,fps),
  }};
}
