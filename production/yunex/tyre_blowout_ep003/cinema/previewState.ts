/** Authoritative, absolute-time preview sampler. No independent car trajectory.
 * The only edit is a hard-cut WORLD X rebasing to avoid the 180m kit road wrap.
 * All wheels are rebased by the same displacement; yaw/forces/spin untouched. */
import {sampleDynamics} from '../dynamics/model.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import type {VehicleDynamicsFrame,TyreFrame,WheelId} from '../shared/contract.ts';
import {OPENING_CUTS,MONTAGE_CUTS,selectCut} from './cameras.ts';
import type {Cut} from './cameras.ts';
// Reference failure remains at the authoritative .75s; the preview starts
// later in that SAME scenario so collapse is visible during the first second.
export const CAMERA_PREVIEW_SOURCE_OFFSET_SEC=.65;
export type PreviewState={
  dynamics:VehicleDynamicsFrame;tyre:TyreFrame;tSec:number;sourceTimeSec:number;
  cut:Cut;progress01:number;cameraWorldRebaseXM:number;
};
export function samplePreviewState(tSec:number,mode:'opening'|'montage'):PreviewState{
 const cuts=mode==='opening'?OPENING_CUTS:MONTAGE_CUTS;
 const {cut,progress01}=selectCut(tSec,cuts);
 const sourceTimeSec=tSec+CAMERA_PREVIEW_SOURCE_OFFSET_SEC;
 const raw=sampleDynamics(sourceTimeSec);
 const origin=sampleDynamics(cut.fromSec+CAMERA_PREVIEW_SOURCE_OFFSET_SEC);
 const sceneX=cut.shot==='safe-stop'?38:cut.shot==='chase-recovery'?-39:-64;
 const dx=sceneX-origin.positionM[0];
 const wheels={} as VehicleDynamicsFrame['wheels'];
 (Object.keys(raw.wheels) as WheelId[]).forEach(id=>{
  const w=raw.wheels[id];
  wheels[id]={...w,hubWorldM:[w.hubWorldM[0]+dx,w.hubWorldM[1],w.hubWorldM[2]]};
 });
 const dynamics:VehicleDynamicsFrame={...raw,positionM:[raw.positionM[0]+dx,raw.positionM[1],raw.positionM[2]],wheels};
 const tyre=sampleTyreFailure(sourceTimeSec,{
  angularPhaseRad:raw.wheels['front-right'].spinRad
 });
 return {dynamics,tyre,tSec,sourceTimeSec,cut,progress01,cameraWorldRebaseXM:dx};
}
