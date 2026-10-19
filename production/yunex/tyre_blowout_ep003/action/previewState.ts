/**
 * Camera-blocking proof only: recovery uses actual Agent 2 safe dynamics;
 * crash uses a CLEARLY LABELLED TEMPORARY lateral-placement illustration
 * pending Agent 8's impactBranch and Agent 9's rewindTime integration.
 *
 * Never present this provisional trajectory as a validated crash simulation.
 */
import type {TyreFrame,VehicleDynamicsFrame,WheelId,Vec3} from '../shared/contract.ts';
import {DYNAMICS_DEFAULTS,sampleDynamics} from '../dynamics/model.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {ACTION_CRASH_CUTS,ACTION_RECOVERY_CUTS,rebaseActionFrame,selectActionCut} from './cameras.ts';
import type {ActionCut,ActionStage} from './cameras.ts';

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export const NARRATED_INITIAL_SPEED_MPS = 70*0.44704;
const params={...DYNAMICS_DEFAULTS,initialSpeedMps:NARRATED_INITIAL_SPEED_MPS};

export type ActionPreviewState=Readonly<{
  dynamics:VehicleDynamicsFrame;
  tyre:TyreFrame;
  stage:ActionStage;
  sourceTimeSec:number;
  filmTimeSec:number;
  cut:ActionCut;
  progress01:number;
  contact01:number;
  provisionalCrash:boolean;
}>;

function shiftRigid(d:VehicleDynamicsFrame,dx:number,dz:number):VehicleDynamicsFrame{
  const x=rebaseActionFrame(d,dx);
  const wheels={...x.wheels};
  (Object.keys(wheels) as WheelId[]).forEach(id=>{
    const hub=wheels[id].hubWorldM;
    wheels[id]={...wheels[id],hubWorldM:[hub[0],hub[1],hub[2]+dz] as Vec3};
  });
  return {...x,positionM:[x.positionM[0],x.positionM[1],x.positionM[2]+dz],wheels};
}

export function actionPreviewState(filmTimeSec:number,mode:'crash-blocking'|'recovery'):ActionPreviewState{
  if(!Number.isFinite(filmTimeSec)||filmTimeSec<0)throw new Error('Bad action preview time');
  const cuts=mode==='crash-blocking'?ACTION_CRASH_CUTS:ACTION_RECOVERY_CUTS;
  const {cut,progress01}=selectActionCut(filmTimeSec,cuts);
  // Recovery source clock never reverses. Agent 9 will later own the true
  // crash branch reverse state, NOT the camera system.
  const sourceTimeSec=.65+(mode==='recovery'?filmTimeSec*.85:filmTimeSec*.75);
  const raw=sampleDynamics(sourceTimeSec,params);
  const origin=sampleDynamics(.65+cut.fromSec*(mode==='recovery'?.85:.75),params);
  const cutX=(mode==='recovery'?cut.stage==='barrier-approach'?34:-55:-63);
  let shiftZ=0;
  if(mode==='crash-blocking'){
    // Temporary camera geography from user-requested narrative, NOT A8 forces:
    // rightward lane departure is merely a shot-blocking fixture. Physical
    // collision response, crush, debris, and reverse must come from A8/A9.
    shiftZ=-4.85*smooth((filmTimeSec-1.40)/2.83);
  }
  const dynamics=shiftRigid(raw,cutX-origin.positionM[0],shiftZ);
  const tyre=sampleTyreFailure(sourceTimeSec,{
    angularPhaseRad:raw.wheels['front-right'].spinRad
  });
  return {
    dynamics,tyre,stage:cut.stage,cut,progress01,filmTimeSec,sourceTimeSec,
    contact01:mode==='crash-blocking'?smooth((filmTimeSec-4.05)/.29):0,
    provisionalCrash:mode==='crash-blocking'
  };
}
