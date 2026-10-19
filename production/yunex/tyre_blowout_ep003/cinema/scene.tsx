import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import type {TyreFrame,VehicleDynamicsFrame} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {sampleCinemaCamera,type CinemaShot,type CameraPose} from './cameras.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';
import {ContactOcclusion} from '../look/contact.tsx';
import {alignCinematicBodyAndHubs} from './axes.ts';

/** Backwards-compatible plain world-kit motion adapter; actual CinemaVehicle
 * now uses Agent 1's real rubber deformation, below. */
export function updateCinematicVehicle(model:T.Group,d:VehicleDynamicsFrame,tyre:TyreFrame,_previewCosmeticOnly=false):void{
 if(!Number.isFinite(tyre.failureProgress))throw new Error('Invalid tyre frame');
 alignCinematicBodyAndHubs(model,d);
 model.traverse(o=>{if(o.userData.cabinSteering)o.rotation.x=-d.driverSteerRad*10;});
}

/** Cinematic vehicle reuses ALL original GT mechanics, plus Agent 1's cloned
 * rubber vertex displacement driven by Agent 2 hub/spin/steering states. */
export const CinematicVehicle:React.FC<{
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;previewCosmeticOnly?:boolean;cutaway?:boolean;interiorCamera?:boolean;
}>=({dynamics,tyre,cutaway=false,interiorCamera=false})=>{
 const rig=useMemo(()=>{
  const prepared=prepareTyreRig(EP003_SCENE.failedWheel,cutaway?.65:0);
  finishGrandTourer(prepared.vehicle);
  // A standard cinema "wild roof" for ONE inside-car camera only. The physical
  // GT body/interior, windshield, wheel and exterior hero shots stay intact.
  // This avoids a black roof plane obscuring the top 30% of the portrait POV.
  if(interiorCamera){
   prepared.vehicle.traverse(o=>{
    if(o instanceof T.Mesh && (o.name==='roof'||o.name==='roof-liner'||o.name==='windshield-seal'))o.visible=false;
   });
  }
  prepared.vehicle.traverse(o=>{
   if(o instanceof T.Mesh&&(o.name==='tyre'||o.name==='sidewall-bead')){
    const m=o.material;
    if(m instanceof T.MeshStandardMaterial){m.color.set('#32393d');m.roughness=.91;m.metalness=.015;}
   }
  });
  return prepared;
 },[cutaway,interiorCamera]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>{
  // Agent 1's corrected authoritative rig already applies X=pitch, Y=yaw,
  // Z=roll and places all four world-space hubs BEFORE road-relative rubber
  // deformation. Never rotate or re-project AFTER deformRubber: doing so can
  // invalidate the actual contact patch under body pitch/roll.
  applyTyreFrame(rig,tyre,{dynamics,exposure:cutaway?.65:0});
 },[rig,dynamics,tyre,cutaway]);
 return <primitive object={rig.vehicle}/>;
};
export const CinematicCameraRig:React.FC<{pose:CameraPose}>=({pose})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);
  if(camera instanceof T.PerspectiveCamera){
   camera.fov=pose.fovDeg;camera.near=pose.nearM;camera.far=pose.farM;
   camera.updateProjectionMatrix();
  }
 },[camera,pose]);return null;
};
export type CinematicSceneProps={
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;tSec:number;shot:CinemaShot;
 shotProgress01?:number;width?:number;height?:number;
 previewCosmeticOnly?:boolean;subtleImpactShake?:boolean;
};
/** Retimable native Remotion portrait scene; preserves original Camera API. */
export const CinematicScene:React.FC<CinematicSceneProps>=({
 dynamics,tyre,tSec,shot,shotProgress01=0,width=1080,height=1920,
 subtleImpactShake=true
})=>{
 const pose=sampleCinemaCamera({dynamics,tyre,tSec,shot,progress01:shotProgress01,subtleImpactShake});
 const highway=useMemo(buildEpisodeHighway,[]);
 useEffect(()=>()=>disposeObject(highway),[highway]);
 return <AbsoluteFill style={{background:'#b8cad5'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{
   position:[...pose.position],near:pose.nearM,far:pose.farM,fov:pose.fovDeg
  }}>
   <EpisodeLight focus={dynamics.positionM}/>
   <primitive object={highway}/>
   {/* Agent 4's wheel-contact shading tracks the authoritative hub positions. */}
   <ContactOcclusion dynamics={dynamics}/>
   <CinematicVehicle dynamics={dynamics} tyre={tyre} interiorCamera={shot==='driver-cockpit'}/>
   {/* Gentle front-right fill to resolve rubber on the first dark macro frame. */}
   <pointLight position={[dynamics.positionM[0]+2.8,4.6,dynamics.positionM[2]-4.1]}
    color="#e1e9eb" intensity={24} distance={14} decay={2}/>
   {/* Soft wheel-side bounce keeps collapsing rubber distinguishable from the
       turning aluminium rim without bleaching exterior paint. */}
   <pointLight position={[dynamics.positionM[0]+1.85,1.48,dynamics.positionM[2]-2.5]}
    color="#dce6ed" intensity={7} distance={5} decay={2}/>
   <CinematicCameraRig pose={pose}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
export type CinematicSequenceProps=CinematicSceneProps;
export const CinematicSequence:React.FC<CinematicSequenceProps>=props=><CinematicScene {...props}/>;
export {sampleCinemaCamera} from './cameras.ts';
