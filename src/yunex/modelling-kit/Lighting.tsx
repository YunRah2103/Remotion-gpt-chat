import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {createReflectionStudio,lightingProfile} from './lighting-profile.ts';
import type {LightingTime} from './lighting-profile.ts';

/** Initialise reflections before Remotion's first frame advance. The capture is
 * independent of car position and frame order, so moving shots cannot flicker. */
const StableReflections:React.FC<{timeOfDay:LightingTime}>=({timeOfDay})=>{
 const {gl,scene}=useThree();useLayoutEffect(()=>{
  const previous=scene.environment,intensity=scene.environmentIntensity;
  const pmrem=new T.PMREMGenerator(gl),studio=createReflectionStudio(timeOfDay);
  const env=pmrem.fromScene(studio,.035,.1,100);
  scene.environment=env.texture;scene.environmentIntensity=lightingProfile(timeOfDay).environmentIntensity;
  studio.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
  pmrem.dispose();
  return()=>{scene.environment=previous;scene.environmentIntensity=intensity;env.dispose();};
 },[gl,scene,timeOfDay]);return null;
};
export const CinematicLighting:React.FC<{focus?:V3;timeOfDay?:LightingTime;shadowMapSize?:number}>=({focus=[0,0,0],timeOfDay='day',shadowMapSize=2048})=>{
 const target=React.useMemo(()=>new T.Object3D(),[]);target.position.set(...focus);
 const p=lightingProfile(timeOfDay),night=timeOfDay==='night';
 return <>
 <color attach="background" args={[p.background]}/><fog attach="fog" args={[p.background,95,260]}/>
 <hemisphereLight args={[p.sky,p.ground,p.hemisphere]}/><primitive object={target}/>
 <directionalLight target={target} position={[focus[0]+4,focus[1]+p.keyHeight,focus[2]+4]} color={p.keyColor} intensity={p.keyIntensity} castShadow shadow-mapSize={[shadowMapSize,shadowMapSize]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={35} shadow-bias={-.0002} shadow-normalBias={.012} shadow-radius={3}/>
 <directionalLight target={target} position={[focus[0]-5,focus[1]+3,focus[2]-4]} color={p.fillColor} intensity={p.fillIntensity}/>
 <directionalLight target={target} position={[focus[0]+1,focus[1]+5,focus[2]-6]} color={p.rimColor} intensity={p.rimIntensity}/>
 {night?<><spotLight target={target} position={[focus[0]-3,focus[1]+6,focus[2]+3]} color="#e0ecff" intensity={95} distance={18} angle={.65} penumbra={.85} decay={2}/><spotLight target={target} position={[focus[0]+4,focus[1]+4,focus[2]-5]} color="#92b7de" intensity={65} distance={16} angle={.65} penumbra={.9} decay={2}/></>:null}
 <StableReflections timeOfDay={timeOfDay}/>
 </>;
};
