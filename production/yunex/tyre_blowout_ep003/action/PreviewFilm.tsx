import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {CinematicVehicle} from '../cinema/scene.tsx';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {SteadyHands3D} from '../story/SteadyHands3D.tsx';
import {sampleActionCamera} from './cameras.ts';
import type {ActionCameraPose} from './cameras.ts';
import {actionPreviewState} from './previewState.ts';

const ActionCameraRig:React.FC<{pose:ActionCameraPose}>=({pose})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    camera.up.set(0,1,0);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    if(camera instanceof T.PerspectiveCamera){
      camera.fov=pose.fovDeg;camera.near=pose.nearM;camera.far=pose.farM;
      camera.updateProjectionMatrix();
    }
  },[camera,pose]);
  return null;
};
/** A5 hands are mounted on the ACTUAL original GT's steering geometry. */
const MovingCockpit:React.FC<{d:VehicleDynamicsFrame;tyre:TyreFrame}>=({d,tyre})=>{
  const rig=useMemo(()=>{
    const r=prepareTyreRig(EP003_SCENE.failedWheel,0);
    finishGrandTourer(r.vehicle);
    // Only the cockpit lens needs a wild roof, as in the approved A3 setup.
    r.vehicle.traverse(node=>{
      if(node instanceof T.Mesh &&
        ['roof','roof-liner','windshield-seal'].includes(node.name)) node.visible=false;
    });
    return r;
  },[]);
  useEffect(()=>()=>disposeTyreRig(rig),[rig]);
  useLayoutEffect(()=>applyTyreFrame(rig,tyre,{dynamics:d,exposure:0}),[rig,d,tyre]);
  return <primitive object={rig.vehicle}>
    <SteadyHands3D dynamics={d} steeringSide="right"/>
  </primitive>;
};

/** Working native 3D Remotion camera previews; NO screenshot montage or zoom. */
export const ActionPreviewFilm:React.FC<{mode:'crash-blocking'|'recovery'}>=({mode})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const state=actionPreviewState(frame/fps,mode);
  const pose=sampleActionCamera({
    stage:state.stage,sourceTimeSec:state.sourceTimeSec,
    progress01:state.progress01,dynamics:state.dynamics,
    // Agent 8 has not supplied actual contact; never falsely shake camera.
    impactFrame:{contact01:state.contact01,actualBarrierContact:false}
  });
  const highway=useMemo(buildEpisodeHighway,[]);
  useEffect(()=>()=>disposeObject(highway),[highway]);
  const cockpit=pose.insideCabin;
  return <AbsoluteFill style={{background:'#b8cad5'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{
      position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg
    }}>
      <EpisodeLight focus={state.dynamics.positionM}/>
      <primitive object={highway}/>
      <ContactOcclusion dynamics={state.dynamics}/>
      {cockpit
        ? <MovingCockpit d={state.dynamics} tyre={state.tyre}/>
        : <CinematicVehicle dynamics={state.dynamics} tyre={state.tyre}/>}
      <pointLight position={[
        state.dynamics.positionM[0]+2.6,4.5,state.dynamics.positionM[2]-4.0
      ]} color="#dee9f0" intensity={22} distance={14} decay={2}/>
      <ActionCameraRig pose={pose}/>
    </ThreeCanvas>
    {mode==='crash-blocking' &&
      <div style={{
        position:'absolute',bottom:70,left:42,right:42,padding:'12px 16px',
        fontFamily:'Arial,sans-serif',fontSize:23,letterSpacing:.3,
        lineHeight:1.25,background:'rgba(13,23,30,.78)',color:'#ffffff'
      }}>CAMERA BLOCKING ONLY · TEMPORARY CRASH PATH
        <div style={{fontSize:19,opacity:.90}}>
          Agent 8 collision / Agent 9 rewind NOT YET integrated
        </div>
      </div>}
  </AbsoluteFill>;
};
