/**
 * Agent 9 native moving proof of replay logic. TEMP development adapter.
 * Source media is real Agent1 tyre + Agent2 physics + Agent3 camera +
 * Agent4 environment + Agent5 original cockpit hands, checked out by CI
 * at exact SHAs. This DOES NOT pretend to contain Agent8 crash damage.
 *
 * Agent8 handoff: switch the wrong-frame sampler below to sampleCrashOutcome
 * and the wrong-frame visual rig to CrashCarRig / ImpactEffects3D. Until then,
 * both renders must keep developmentAdapter=true and may NOT be picture locked.
 */
import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CinemaShot} from '../cinema/cameras.ts';
import {sampleCinemaCamera} from '../cinema/cameras.ts';
import {CinematicCameraRig,CinematicVehicle} from '../cinema/scene.tsx';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';
import {sampleBranchReplay,rebaseDynamicsX,resolveBranchFrame} from './branchReplay.ts';
import {DEFAULT_BRANCH_REPLAY} from './branchReplay.ts';
import {sampleControlledFrame,sampleDevelopmentPanicFrame} from './developmentAdapter.ts';
import {ChoiceOverlay,RewindVisualTransition} from './RewindVisualTransition.tsx';

const seq={
  sampleWrong:(t:number,seed:number)=>sampleDevelopmentPanicFrame(t,seed,DEFAULT_BRANCH_REPLAY.impactSourceSec),
  sampleCorrect:sampleControlledFrame,
};
const cut=(t:number):CinemaShot=>{
 if(t<12.83)return 'front-three-quarter';
 if(t<13.43)return 'rear-three-quarter';
 if(t<14.44)return 'overhead-dynamics'; // reveal road/rail before collision
 if(t<15.83)return 'overhead-dynamics'; // true reversed car/road state
 if(t<16.015)return 'front-three-quarter';
 if(t<17.35)return 'driver-cockpit';
 if(t<18.15)return 'underbody'; // prove front-right tyre was NEVER healed
 return 'chase-recovery';
};

/** Original Agent 1 tyre rig plus existing A5 hands inside original car. */
const ControlCockpit:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
 const rig=useMemo(()=>{
   const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
   finishGrandTourer(r.vehicle);
   r.vehicle.traverse(o=>{
     if(o instanceof T.Mesh&&['roof','roof-liner','windshield-seal'].includes(o.name))o.visible=false;
   });
   return r;
 },[]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>applyTyreFrame(rig,tyre,{dynamics:d,exposure:0}),[rig,tyre,d]);
 return <primitive object={rig.vehicle}><SteadyHands3D dynamics={d} steeringSide="right"/></primitive>;
};
const Agent9MovingScene:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame;
 shot:CinemaShot;tSec:number;width:number;height:number}>=({d,tyre,shot,tSec,width,height})=>{
 const road=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(road),[road]);
 const pose=sampleCinemaCamera({dynamics:d,tyre,shot,tSec,progress01:0.45,
   subtleImpactShake:false});
 return <AbsoluteFill style={{backgroundColor:'#b8cad5'}}>
   <ThreeCanvas width={width} height={height} shadows camera={{
     position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg}}>
     <EpisodeLight focus={d.positionM}/>
     <primitive object={road}/>
     <ContactOcclusion dynamics={d}/>
     {shot==='driver-cockpit'
       ? <ControlCockpit d={d} tyre={tyre}/>
       : <CinematicVehicle dynamics={d} tyre={tyre} cutaway={false}/>}
     <pointLight position={[d.positionM[0]+2.8,4.6,d.positionM[2]-4.1]}
       color="#dce4e8" intensity={21} distance={14} decay={2}/>
     <CinematicCameraRig pose={pose}/>
   </ThreeCanvas>
 </AbsoluteFill>;
};
/** Do not add this source to Agent6 root. Agent9 has isolated entry.tsx. */
export const EP003Agent9Preview:React.FC<{kind:'impact-rewind'|'branch-compare'}>=({kind})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const filmTimeSec=12.15+frame/fps;
 const {replay,frame:physical}=resolveBranchFrame(filmTimeSec,seq);
 // Stable at choice: body and FOUR hubs receive the same sole X translation.
 const choice=sampleControlledFrame(DEFAULT_BRANCH_REPLAY.choiceSourceSec);
 const d=rebaseDynamicsX(physical,-55-choice.positionM[0]);
 const tyre=sampleTyreFailure(replay.sourceTimeSec,{
   angularPhaseRad:d.wheels['front-right'].spinRad
 });
 const shot=cut(filmTimeSec);
 return <AbsoluteFill style={{background:'#b8cad5'}}>
  <Agent9MovingScene d={d} tyre={tyre} shot={shot}
    tSec={replay.sourceTimeSec} width={width} height={height}/>
  <RewindVisualTransition replay={replay}/>
  <ChoiceOverlay replay={replay} developmentAdapter/>
  {kind==='branch-compare' && <div style={{position:'absolute',
      top:42,left:36,right:36,textAlign:'center',fontSize:22,
      letterSpacing:4,fontWeight:800,fontFamily:'Arial',color:'#e9f3fa',
      textShadow:'0 2px 10px #102334'}}>
      TWO POSSIBLE REACTIONS
  </div>}
 </AbsoluteFill>;
};
export const EP003Agent9ImpactRewind:React.FC=()=> <EP003Agent9Preview kind="impact-rewind"/>;
export const EP003Agent9BranchCompare:React.FC=()=> <EP003Agent9Preview kind="branch-compare"/>;
