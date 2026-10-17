import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {sampleShot,poseIsValid,type Shot,type Anchors} from './cameraMath';

/** Insert INSIDE a <ThreeCanvas>. It only moves its active camera, never modifies artist models. */
export const CameraDirector:React.FC<{
 frame:number;shot:Shot;durationInFrames?:number;anchors?:Anchors;visibility?:boolean
}>=({frame,shot,durationInFrames,anchors={},visibility=true})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  if(!visibility) return;
  const pose=sampleShot(shot,frame,anchors,durationInFrames);
  if(!poseIsValid(pose)) throw new Error('CameraDirector invalid pose at frame '+frame+' shot '+shot);
  camera.position.set(...pose.position);
  camera.up.set(0,1,0);
  camera.lookAt(...pose.target);
  if(camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov-pose.fov)>.00001){
   camera.fov=pose.fov;
   camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
 },[camera,frame,shot,durationInFrames,anchors,visibility]);
 return null;
};