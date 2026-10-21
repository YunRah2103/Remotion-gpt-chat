/** Render-side camera adapter; pure camera mathematics live in cameras.ts. */
import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import type {CameraPose,ShotId,VehicleMotionState} from '../shared/contract.ts';
import {sampleRetimedShotCamera} from './cameras.ts';

export const ApplyCameraPose:React.FC<{pose:CameraPose;near?:number}>=({pose,near=.035})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    camera.position.set(...pose.positionWorld);
    camera.up.set(0,1,0);
    camera.lookAt(...pose.targetWorld);
    if(camera instanceof T.PerspectiveCamera){
      camera.near=near;camera.far=330;
      camera.fov=pose.fovDeg;camera.updateProjectionMatrix();
    }
  },[camera,...pose.positionWorld,...pose.targetWorld,pose.fovDeg,near]);
  return null;
};
export const ShotCamera:React.FC<{shot:ShotId;localSec:number;durationSec:number;motion:VehicleMotionState;near?:number}>=({shot,localSec,durationSec,motion,near})=>(
  <ApplyCameraPose pose={sampleRetimedShotCamera(shot,localSec,durationSec,motion)} near={near}/>
);
