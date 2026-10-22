import React,{useLayoutEffect} from "react";
import {useThree} from "@react-three/fiber";
import * as T from "three";
import type {RoutePose} from "../../../../src/yunex/world-kit/environments.ts";
import {EP005_ROUTE,trackPoint} from "./route.ts";

/** Keep the original V3 PMREM reflections, grade only this Agent-4 scene. */
export const EP005NightAtmosphere:React.FC<{premium?:boolean}>=({premium=true})=>{
 const {scene}=useThree();
 useLayoutEffect(()=>{
  if(!premium)return;
  const previousBackground=scene.background,previousFog=scene.fog;
  const previousEnvironmentIntensity=scene.environmentIntensity;
  scene.background=new T.Color("#071320");
  scene.fog=new T.Fog("#0e1d2a",78,245);
  scene.environmentIntensity=.21;
  return ()=>{scene.background=previousBackground;scene.fog=previousFog;
    scene.environmentIntensity=previousEnvironmentIntensity;};
 },[scene,premium]);
 return null;
};
/** Film-motivated moon/rim/practicals. No following headlight 'white blob' point source. */
export const EP005PracticalLighting:React.FC<{
 pose:RoutePose;premium?:boolean;flameIntensity?:number;
}>=({pose,premium=true,flameIntensity=0})=>{
 if(!premium)return null;
 const p=pose.position,yaw=pose.yaw;
 const forward=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const rear=new T.Vector3(...p).addScaledVector(forward,-2.35);
 const cameraFill=new T.Vector3(...p).addScaledVector(forward,5.5);
 const lightData=Array.from({length:24},(_,i)=>{
  const k=Math.floor(i/2),side=i%2===0?1:-1;
  const distance=EP005_ROUTE.lapMetres*(k+.07)/12;
  const position=trackPoint(distance,side*19.3,6.96).position;
  const separation=new T.Vector3(...position).distanceTo(new T.Vector3(...p));
  const strength=Math.max(0,Math.min(1,(43-separation)/12));
  return {key:i,position,intensity:54*strength,color:k%4===0?"#c4dce8":"#e9c18a"};
 }).filter(l=>l.intensity>0);
 return <>
  <hemisphereLight args={["#91b8ca","#13202d",.34]}/>
  <directionalLight position={[p[0]+7,11,p[2]-8]} intensity={.82} color="#afcee2"/>
  <directionalLight position={[p[0]-6,6,p[2]+9]} intensity={.51} color="#d9a875"/>
  {lightData.map(l=><pointLight key={l.key} position={l.position} color={l.color}
    intensity={l.intensity} distance={29} decay={2}/>)}
  {/* A restrained camera-side reflection edge, not a forward ground hotspot. */}
  <pointLight position={[cameraFill.x,4.8,cameraFill.z+5.2]}
    intensity={5.5} distance={10} decay={2} color="#cce3f0"/>
  {flameIntensity>0?<pointLight position={[rear.x,.51,rear.z]}
    intensity={30*Math.min(1,Math.max(0,flameIntensity))}
    distance={5.8} decay={2} color="#ff8238"/>:null}
 </>;
};
