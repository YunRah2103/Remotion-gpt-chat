import React,{useLayoutEffect,useMemo,useEffect} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {createVehicle,createEnvironment,disposeObject} from '../../../../src/yunex/world-kit/index.ts';
import {WorldLighting} from '../../../../src/yunex/world-kit/components.tsx';
import type {TyreFrame,VehicleDynamicsFrame,WheelId} from '../shared/contract.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {sampleCinemaCamera,type CinemaShot,type CameraPose} from './cameras.ts';
const idFor=(position:THREE.Vector3):WheelId=>
 (position.x>0?'front':'rear')+'-'+(position.z>0?'left':'right') as WheelId;
/** All moving geometry follows absolute-frame Agent 2 state, not a camera sim. */
export function updateCinematicVehicle(model:THREE.Group,d:VehicleDynamicsFrame,tyre:TyreFrame,previewCosmeticOnly=false):void{
 model.position.set(...d.positionM);
 model.rotation.set(d.pitchRad,d.yawRad,d.rollRad,'YXZ');
 model.updateMatrixWorld(true);
 model.traverse(node=>{
  if(node.userData.cabinSteering)node.rotation.x=-d.driverSteerRad*10;
  if(!node.name.startsWith('steer-')||!(node instanceof THREE.Group))return;
  const id=idFor(node.position),w=d.wheels[id];
  if(!w)return;
  const worldHub=new THREE.Vector3(...w.hubWorldM);
  if(worldHub.toArray().every(Number.isFinite))node.position.copy(model.worldToLocal(worldHub));
  node.rotation.y=w.steeringRad;
  const roll=node.children.find(o=>o.userData.wheel) as THREE.Group|undefined;
  if(!roll)return;
  roll.rotation.z=w.spinRad;
  // Kit tyre stays intact for production; preview-only cosmetic depression
  // must be replaced with Agent 1's model before physics approval.
  for(const child of roll.children){
   if(child.name==='tyre'||child.name==='tyre-groove'||child.name==='sidewall-bead'){
    const k=previewCosmeticOnly&&id===EP003_SCENE.failedWheel?Math.max(0,Math.min(1,tyre.failureProgress)):0;
    child.scale.set(1-.025*k,1-.075*k,1);
   }
  }
 });
}
export const CinematicVehicle:React.FC<{
 dynamics:VehicleDynamicsFrame;tyre:TyreFrame;previewCosmeticOnly?:boolean;cutaway?:boolean
}>=({dynamics,tyre,previewCosmeticOnly=false,cutaway=false})=>{
 const model=useMemo(()=>createVehicle({
  variant:'grand-tourer',color:EP003_SCENE.paint,accent:'#b8a07a',
  interior:true,glassOpacity:.28,cutaway,steeringSide:'right'
 }),[cutaway]);
 useEffect(()=>()=>disposeObject(model),[model]);
 useLayoutEffect(()=>{
  updateCinematicVehicle(model,dynamics,tyre,previewCosmeticOnly);
 },[model,dynamics,tyre,previewCosmeticOnly]);
 return <primitive object={model}/>;
};
export const CinematicCameraRig:React.FC<{pose:CameraPose}>=({pose})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);
  if(camera instanceof THREE.PerspectiveCamera){
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
/** Reusable isolated Remotion scene, no modifications to Agent 6 root. */
export const CinematicScene:React.FC<CinematicSceneProps>=({
 dynamics,tyre,tSec,shot,shotProgress01=0,width=1080,height=1920,
 previewCosmeticOnly=false,subtleImpactShake=true
})=>{
 const pose=sampleCinemaCamera({dynamics,tyre,tSec,shot,progress01:shotProgress01,subtleImpactShake});
 const highway=useMemo(()=>createEnvironment({kind:'highway',seed:12,timeOfDay:'day'}),[]);
 useEffect(()=>()=>disposeObject(highway),[highway]);
 return <AbsoluteFill style={{background:'#b8cad5'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{
   position:[pose.position[0],pose.position[1],pose.position[2]],
   near:pose.nearM,far:pose.farM,fov:pose.fovDeg
  }}>
   <WorldLighting timeOfDay="day" focus={[
    dynamics.positionM[0],dynamics.positionM[1],dynamics.positionM[2]
   ]}/>
   <primitive object={highway}/>
   <CinematicVehicle dynamics={dynamics} tyre={tyre} previewCosmeticOnly={previewCosmeticOnly}/>
   <CinematicCameraRig pose={pose}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
export type CinematicSequenceProps=CinematicSceneProps;
export const CinematicSequence:React.FC<CinematicSequenceProps>=props=><CinematicScene {...props}/>;
export {sampleCinemaCamera} from './cameras.ts';
