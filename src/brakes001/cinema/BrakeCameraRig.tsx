import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {brakeCameraAt,type BrakeShotId,type BrakeCameraPose} from './cameraMath';
export {brakeCameraAt,brakeShotAt,GHOST_FRONT_BRAKE_ANCHOR} from './cameraMath';
export type {BrakeShotId,BrakeCameraPose} from './cameraMath';
export type BrakeCameraRigProps={
  frame:number;
  shotId?:BrakeShotId;
  onPose?:(pose:BrakeCameraPose)=>void;
};
/** Frame-based R3F camera; never changes brake rotations/kinematics. */
export const BrakeCameraRig:React.FC<BrakeCameraRigProps>=({frame,shotId,onPose})=>{
  const {camera,size,invalidate}=useThree();
  useLayoutEffect(()=>{
    const p=brakeCameraAt(frame,shotId);
    camera.position.set(...p.position);
    camera.lookAt(new THREE.Vector3(...p.target));
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=p.fovDegrees;
      camera.aspect=size.width/Math.max(1,size.height);
      camera.near=.012;
      camera.far=75;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
    onPose?.(p);
  },[frame,shotId,camera,size.width,size.height,invalidate,onPose]);
  return null;
};
