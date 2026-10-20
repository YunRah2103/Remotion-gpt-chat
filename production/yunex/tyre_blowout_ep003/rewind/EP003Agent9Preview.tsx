/**
 * Agent 9 REAL moving Agent8 damage rewind.
 * Source: pinned A8 collision states + original deforming A1 wheel,
 * A2 initial/safe physics, A3 tracking cameras, A4 original GT and
 * roadway, A5 real original cabin steering wheel + hands.
 *
 * NO still-image effects: every crash pose, dent, spark and road relation
 * is sampled deterministically at sourceTimeSec, including in REVERSE.
 * These dedicated roots never modify Agent6's 800-frame VO master.
 */
import React,{useCallback,useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import type {CinemaShot} from '../cinema/cameras.ts';
import {sampleCinemaCamera} from '../cinema/cameras.ts';
import {CinematicCameraRig,CinematicVehicle} from '../cinema/scene.tsx';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';
import {CrashCarRig,ImpactEffects3D} from '../impact/Preview.tsx';
import {CrashBarrierWorld} from '../impact/Barrier.tsx';
import {rebaseDynamicsX,resolveBranchFrame} from './branchReplay.ts';
import {DEFAULT_BRANCH_REPLAY} from './branchReplay.ts';
import {sampleControlledFrame} from './agent8Integration.ts';
import {AGENT9_CHOICE_SCENE_X,sampleRealAgent8Wrong,sampleRealAgent2Correct} from './agent8Integration.ts';
import {ChoiceOverlay,RewindVisualTransition} from './RewindVisualTransition.tsx';

const samplers={sampleWrong:sampleRealAgent8Wrong,sampleCorrect:sampleRealAgent2Correct};
const cut=(t:number):CinemaShot=>{
 if(t<12.83)return 'front-three-quarter';
 if(t<13.43)return 'rear-three-quarter';
 if(t<14.44)return 'overhead-dynamics';
 if(t<15.83)return 'overhead-dynamics'; // real backwards car + rail + debris
 if(t<16.015)return 'front-three-quarter';
 if(t<17.35)return 'driver-cockpit';
 if(t<18.15)return 'underbody'; // tyre still failed
 return 'chase-recovery';
};

const OriginalCockpit:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
 const rig=useMemo(()=>{
   const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
   finishGrandTourer(r.vehicle);
   r.vehicle.traverse(o=>{
     if(o instanceof T.Mesh&&['roof','roof-liner','windshield-seal'].includes(o.name))o.visible=false;
   });
   return r;
 },[]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>{applyTyreFrame(rig,tyre,{dynamics:d,exposure:0});},[rig,tyre,d]);
 return <primitive object={rig.vehicle}><SteadyHands3D dynamics={d} steeringSide="right"/></primitive>;
};

/**
 * Approved A8 original GT nose/lamp/fender deformable rig, over the SAME
 * Agent1 four-wheel + failed-rubber vehicle. Agent8 exclusively owns its
 * damage geometry. In afterPose the authoritative Agent2/A8-derived hubs,
 * road contact and tyre phase are applied exactly once and on EVERY frame,
 * including decreasing sourceTimeSec during rewind. No duplicate car.
 */
const OriginalDamagedGrandTourer:React.FC<{
 d:VehicleDynamicsFrame;tyre:TyreFrame;impact:CrashOutcomeFrame;
}>=({d,tyre,impact})=>{
 const rig=useMemo(()=>prepareTyreRig(EP003_SCENE.failedWheel,0),[]);
 const makeVehicle=useCallback(()=>finishGrandTourer(rig.vehicle),[rig]);
 const afterPose=useCallback((_vehicle:T.Group,_frame:CrashOutcomeFrame)=>{
   // Impact physical body + all four hubs have already been consistently
   // rebased into the declared A8 scene cut at X=-86 by resolveBranchFrame.
   // A1 deformRubber keeps the original front-right puncture on the rewind.
   applyTyreFrame(rig,tyre,{dynamics:d,exposure:0});
 },[rig,tyre,d]);
 return <CrashCarRig frame={impact} makeVehicle={makeVehicle} afterPose={afterPose}/>;
};
const NativeAgent9Scene:React.FC<{
 d:VehicleDynamicsFrame;tyre:TyreFrame;
 impact:CrashOutcomeFrame|null;shot:CinemaShot;
 tSec:number;width:number;height:number;
}>=({d,tyre,impact,shot,tSec,width,height})=>{
 const road=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(road),[road]);
 const candidate=sampleCinemaCamera({dynamics:d,tyre,shot,tSec,
   progress01:.45,subtleImpactShake:false});
 // 9:16 overhead: extra real lens height avoids cropping the whole car on
 // a phone and keeps both road line and collision rail readable.
 const pose=shot==='overhead-dynamics'
   ? {...candidate,position:[candidate.position[0],candidate.position[1]+4.5,
       candidate.position[2]] as const,fovDeg:52}
   : candidate;
 return <AbsoluteFill style={{backgroundColor:'#b8cad5'}}>
   <ThreeCanvas width={width} height={height} shadows camera={{
     position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg}}>
     <EpisodeLight focus={d.positionM}/>
     {impact
       ? <CrashBarrierWorld frame={impact} worldFactory={buildEpisodeHighway}/>
       : <primitive object={road}/>}
     <ContactOcclusion dynamics={d}/>
     {impact
       ? <OriginalDamagedGrandTourer d={d} tyre={tyre} impact={impact}/>
       : shot==='driver-cockpit'
         ? <OriginalCockpit d={d} tyre={tyre}/>
         : <CinematicVehicle dynamics={d} tyre={tyre} cutaway={false}/>}
     {impact&&<ImpactEffects3D frame={impact}/>}
     <pointLight position={[d.positionM[0]+2.8,4.6,d.positionM[2]-4.1]}
       color="#dce4e8" intensity={21} distance={14} decay={2}/>
     <CinematicCameraRig pose={pose}/>
   </ThreeCanvas>
 </AbsoluteFill>;
};
/** Independent moving source previews; Agent6 handles final visual tempo. */
export const EP003Agent9Preview:React.FC<{kind:'impact-rewind'|'branch-compare'}>=({kind})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const filmTimeSec=12.15+frame/fps;
 const {replay,frame:source}=resolveBranchFrame(filmTimeSec,samplers);
 const seed=sampleControlledFrame(DEFAULT_BRANCH_REPLAY.choiceSourceSec);
 const dx=AGENT9_CHOICE_SCENE_X-seed.positionM[0];
 const d=rebaseDynamicsX(source.dynamics,dx);
 const tyre=sampleTyreFailure(replay.sourceTimeSec,{
   angularPhaseRad:d.wheels['front-right'].spinRad
 });
 return <AbsoluteFill style={{background:'#b8cad5'}}>
  <NativeAgent9Scene d={d} tyre={tyre} impact={source.impact} shot={cut(filmTimeSec)}
    tSec={replay.sourceTimeSec} width={width} height={height}/>
  <RewindVisualTransition replay={replay}/>
  <ChoiceOverlay replay={replay}/>
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
