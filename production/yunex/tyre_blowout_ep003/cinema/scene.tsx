import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import type {TyreFrame,VehicleDynamicsFrame,WheelId} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {sampleCinemaCamera,type CinemaShot,type CameraPose} from './cameras.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {buildEpisodeHighway,EpisodeLight,finishGrandTourer} from '../look/world.tsx';

/** Backwards-compatible plain world-kit motion adapter; actual CinemaVehicle
 * now uses Agent 1's real rubber deformation, below. */
export function updateCinematicVehicle(model:T.Group,d:VehicleDynamicsFrame,tyre:TyreFrame,_previewCosmeticOnly=false):void{
 if(!Number.isFinite(tyre.failureProgress))throw new Error('Invalid tyre frame');
 model.position.set(...d.positionM);
 model.rotation.set(d.rollRad,d.yawRad,d.pitchRad,'YXZ');
 model.updateMatrixWorld(true);
 model.traverse(o=>{
  if(o.userData.cabinSteering)o.rotation.x=-d.driverSteerRad*10;
  if(!(o instanceof T.Group)||!o.children.some(v=>v.userData.wheel))return;
  const id=(((o.position.x>0)?'front':'rear')+'-'+((o.position.z<0)?'right':'left')) as WheelId;
  const w=d.wheels[id];if(!w)return;
  o.position.copy(model.worldToLocal(new T.Vector3(...w.hubWorldM)));
  o.rotation.y=w.steeringRad;
  const rotating=o.children.find(v=>v.userData.wheel);
  if(rotating)rotating.rotation.z=w.spinRad;
 });
 model.updateMatrixWorld(true);
}

/** Cinematic vehicle reuses ALL original GT mechanics, plus Agent 1's cloned
 * rubber vertex displacement driven by Agent 2 hub/spin/steering states. */
export const CinematicVehicle:React.FC<{
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;previewCosmeticOnly?:boolean;cutaway?:boolean;
}>=({dynamics,tyre,cutaway=false})=>{
 const rig=useMemo(()=>{
  const prepared=prepareTyreRig(EP003_SCENE.failedWheel,cutaway?.65:0);
  finishGrandTourer(prepared.vehicle);
  prepared.vehicle.traverse(o=>{
   if(o instanceof T.Mesh&&(o.name==='tyre'||o.name==='sidewall-bead')){
    const m=o.material;
    if(m instanceof T.MeshStandardMaterial){m.color.set('#32393d');m.roughness=.91;m.metalness=.015;}
   }
  });
  return prepared;
 },[cutaway]);
 useEffect(()=>()=>disposeTyreRig(rig),[rig]);
 useLayoutEffect(()=>applyTyreFrame(rig,tyre,{dynamics,exposure:cutaway?.65:0}),[rig,dynamics,tyre,cutaway]);
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
   <CinematicVehicle dynamics={dynamics} tyre={tyre}/>
   {/* Gentle front-right fill to resolve rubber on the first dark macro frame. */}
   <pointLight position={[dynamics.positionM[0]+2.8,4.6,dynamics.positionM[2]-4.1]}
    color="#e1e9eb" intensity={24} distance={14} decay={2}/>
   <CinematicCameraRig pose={pose}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
export type CinematicSequenceProps=CinematicSceneProps;
export const CinematicSequence:React.FC<CinematicSequenceProps>=props=><CinematicScene {...props}/>;
export {sampleCinemaCamera} from './cameras.ts';
