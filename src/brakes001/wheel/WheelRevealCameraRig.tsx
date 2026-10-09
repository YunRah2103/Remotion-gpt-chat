/**
 * G-only opening camera rig; NEVER modifies E/C camera or late-film shot plan.
 * Positions approach the untouched Polish05 pad-entry camera by frame 95.
 */
import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export type IntroPose={
  position:[number,number,number];
  target:[number,number,number];
  fov:number;
};
export function wheelRevealPoseAt(frame:number):IntroPose{
  const t=smooth((frame-12)/83);
  // Sidewall/face-on tyre becomes a deliberately more axial three-quarter
  // brake cutaway, then joins E's established axial pad view without jumping.
  return {
    position:[
      lerp(1.68,.10,t),
      lerp(.24,.33,t)+.021*Math.sin(frame/28)*(1-t),
      lerp(.43,1.18,t),
    ],
    target:[
      lerp(.01,0,t),
      lerp(0,.07,t),
      lerp(0,.06,t),
    ],
    fov:lerp(40,45,t),
  };
}
export const WheelRevealCameraRig:React.FC<{frame:number}>=({frame})=>{
  const {camera,size,invalidate}=useThree();
  useLayoutEffect(()=>{
    const p=wheelRevealPoseAt(frame);
    camera.position.set(...p.position);
    camera.lookAt(new THREE.Vector3(...p.target));
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=p.fov;
      camera.aspect=size.width/Math.max(1,size.height);
      camera.near=.012;
      camera.far=75;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    invalidate();
  },[frame,camera,size.width,size.height,invalidate]);
  return null;
};
/** Wheel advances axially out only as a clearly labelled cutaway at the end. */
export const wheelExplodeAt=(frame:number):number=>{
  if(frame<=62)return 0;
  return 1.05*smooth((frame-62)/29);
};
export const wheelVisibleAt=(frame:number):boolean=>frame<94;
