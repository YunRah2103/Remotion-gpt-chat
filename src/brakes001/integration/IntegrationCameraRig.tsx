/**
 * E-only photography adapter: retain C's deterministic five-shot plan while
 * giving the fixed caliper a reveal-friendly three-quarter view and keeping
 * the complete hot annulus away from portrait-frame edges.
 *
 * Does not alter C's exported camera math or the actual hardware assembly.
 */
import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {brakeCameraAt, type BrakeCameraPose} from '../cinema/cameraMath';

const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};

export const integrationCameraAt=(frame:number):BrakeCameraPose=>{
  const p=brakeCameraAt(frame);
  // The demonstration covers B's real first pressure ramp (frames 95–117);
  // camera is side-oriented so per-face axial travel has perspective.
  if(frame>=100&&frame<=147){
    const reveal=smooth((frame-101)/12);
    const position:[number,number,number]=[
      lerp(.64,.09,reveal),lerp(.28,.25,reveal),lerp(.59,.85,reveal)];
    const target:[number,number,number]=[0,.055,.085];
    return {...p,position,target,fovDegrees:39,
      focusDistanceMetres:Math.hypot(...position.map((v,i)=>v-target[i]))};
  }
  if(p.shotId==='reveal'){
    // Camera orbits instead of zooming the pads beyond their true 2.5mm travel.
    const t=smooth((frame-120)/149);
    const position:[number,number,number]=[
      lerp(.77,.68,t),lerp(.32,.38,t),lerp(.57,.69,t)];
    const target:[number,number,number]=[0,.062,.045];
    return {...p,position,target,fovDegrees:37,
      focusDistanceMetres:Math.hypot(...position.map((v,i)=>v-target[i]))};
  }
  if(p.shotId==='benefits'){
    // D Polish02: preserve whole caliper and annular perimeter across 450-629.
    // Only gently orbit the camera, never enlarge the moving brake model.
    const t=smooth((frame-450)/179);
    const position:[number,number,number]=[
      lerp(.87,.83,t),lerp(.38,.42,t),lerp(.67,.77,t)];
    const target:[number,number,number]=[0,.045,.035];
    return {...p,position,target,fovDegrees:39,
      focusDistanceMetres:Math.hypot(...position.map((v,i)=>v-target[i]))};
  }
  if(p.shotId==='thermal'){
    return {...p,fovDegrees:Math.max(34,p.fovDegrees)};
  }
  if(p.shotId==='hero'){
    // Polish04: a genuine ~35° continuous orbit, not a nearly static ease.
    // Preserve the stopped physical rotor; CAMERA parallax supplies the ending.
    const t=Math.max(0,Math.min(1,(frame-630)/119));
    const position:[number,number,number]=[
      lerp(.91,.38,t),lerp(.39,.45,t),lerp(.55,.90,t)];
    const target:[number,number,number]=[0,.055,.055];
    return {...p,position,target,fovDegrees:42,
      focusDistanceMetres:Math.hypot(...position.map((v,i)=>v-target[i]))};
  }
  return p;
};

export const IntegrationCameraRig:React.FC<{frame:number}>=({frame})=>{
  const {camera,size,invalidate}=useThree();
  useLayoutEffect(()=>{
    const p=integrationCameraAt(frame);
    camera.position.set(...p.position);
    camera.lookAt(new THREE.Vector3(...p.target));
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=p.fovDegrees;
      camera.aspect=size.width/Math.max(1,size.height);
      camera.near=.012;camera.far=75;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
  },[frame,camera,size.width,size.height,invalidate]);
  return null;
};
