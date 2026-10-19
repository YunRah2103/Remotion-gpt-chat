/**
 * Agent 9 consumer of REAL Agent 8 crash state. No fixture, no invented
 * collision geometry, no extrapolating a static pose during the rewind.
 * A8 source: impact/model.ts SHA is pinned in the Agent9 native workflow.
 *
 * A2 initial incident and A8 hypothetical branch share identical body
 * + four-hub + loaded-front-right tyre state. A8 supplies independent bad
 * controls, collision, deformation and effect clock; A2 owns good controls.
 */
import type {VehicleDynamicsFrame,WheelId} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import {crashIncidentFromDynamics,sampleCrashOutcome} from '../impact/model.ts';
import {sampleDynamics,DYNAMICS_DEFAULTS} from '../dynamics/model.ts';
export const AGENT9_70MPH_PARAMS={...DYNAMICS_DEFAULTS,initialSpeedMps:70*0.44704};
export function sampleControlledFrame(tSec:number):VehicleDynamicsFrame{
  return sampleDynamics(tSec,AGENT9_70MPH_PARAMS);
}
import {DEFAULT_BRANCH_REPLAY} from './branchReplay.ts';

const wheelIds:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
/** A8's contact rail is correctly located near the original hard-edge road,
 * before A4's refuge taper. Identical offset for both branches. */
export const AGENT9_CHOICE_SCENE_X=-86;
export type Agent9ActualFrame=Readonly<{
  dynamics:VehicleDynamicsFrame;
  impact:CrashOutcomeFrame|null;
}>;

/** A8's physically sampled crash branch mapped onto original A1 / A2 hubs. */
export function sampleRealAgent8Wrong(
  sourceTimeSec:number,
  seedSourceSec=DEFAULT_BRANCH_REPLAY.choiceSourceSec
):Agent9ActualFrame{
  if(!Number.isFinite(sourceTimeSec)||sourceTimeSec<seedSourceSec)
    throw Error('Invalid crash time before shared decision');
  const originalAtChoice=sampleControlledFrame(seedSourceSec);
  const elapsed=sourceTimeSec-seedSourceSec;
  const impact=sampleCrashOutcome(elapsed,{
    incident:crashIncidentFromDynamics(originalAtChoice),
    reaction:'panic-brake-and-overcorrect',
    worldCutX:AGENT9_CHOICE_SCENE_X,
  });
  // A8 contact model's worldX is rebased explicitly, but the actual
  // Agent2 world position remains authoritative at the fork.
  if(elapsed===0) return {dynamics:originalAtChoice,impact};
  const base=sampleControlledFrame(sourceTimeSec);
  const newPose=impact.physicalPositionM,yaw=impact.headingRad;
  const changeYaw=yaw-base.yawRad,co=Math.cos(changeYaw),si=Math.sin(changeYaw);
  const wheels={} as VehicleDynamicsFrame['wheels'];
  for(const id of wheelIds){
    const w=base.wheels[id],bx=w.hubWorldM[0]-base.positionM[0],
      bz=w.hubWorldM[2]-base.positionM[2];
    const changedX=bx*co+bz*si,changedZ=-bx*si+bz*co;
    const yCorrection=(impact.pitchRad-base.pitchRad)*changedX-
      (impact.rollRad-base.rollRad)*changedZ;
    const seedSpin=originalAtChoice.wheels[id].spinRad;
    const spin=id==='front-right'
      ? impact.frontRightWheelSpinRad
      : seedSpin-impact.distanceTravelledM/Math.max(.23,w.rollingRadiusM);
    wheels[id]={...w,hubWorldM:[
      newPose[0]+changedX,w.hubWorldM[1]+yCorrection,newPose[2]+changedZ
    ],steeringRad:id.startsWith('front')?impact.driverSteerRad:0,spinRad:spin};
  }
  return {impact,dynamics:{...base,tSec:sourceTimeSec,
    positionM:[...newPose],yawRad:yaw,pitchRad:impact.pitchRad,rollRad:impact.rollRad,
    worldSpeedMps:impact.speedMps,
    distanceTravelledM:originalAtChoice.distanceTravelledM+impact.distanceTravelledM,
    driverSteerRad:impact.driverSteerRad,
    driverBrake01:impact.driverBrake01,
    driverThrottle01:impact.driverThrottle01,wheels
  }};
}
export function sampleRealAgent2Correct(sourceTimeSec:number):Agent9ActualFrame{
  return {dynamics:sampleControlledFrame(sourceTimeSec),impact:null};
}
