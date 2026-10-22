import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
/** Initialise reflections before Remotion's first frame advance, not in a later passive effect. */
const StableReflections:React.FC<{night?:boolean}>=({night=false})=>{
 const {gl,scene}=useThree();useLayoutEffect(()=>{
  const previous=scene.environment,intensity=scene.environmentIntensity;
  const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);
  scene.environment=env.texture;scene.environmentIntensity=night?.12:.22;
  room.dispose();pmrem.dispose();return()=>{scene.environment=previous;scene.environmentIntensity=intensity;env.dispose();};
 },[gl,scene,night]);return null;
};
export const CinematicLighting:React.FC<{focus?:V3;timeOfDay?:'day'|'dusk'|'night'}>=({focus=[0,0,0],timeOfDay='day'})=> {
 const target=React.useMemo(()=>new T.Object3D(),[]);target.position.set(...focus);const night=timeOfDay==='night';
 return <>
 <color attach="background" args={['#14232d']}/><fog attach="fog" args={['#14232d',95,260]}/>
 <hemisphereLight args={['#b1cbdc','#17212b',night?.10:.55]}/><primitive object={target}/>
 <directionalLight target={target} position={[focus[0]+4,focus[1]+7,focus[2]+4]} color="#fff0dd" intensity={night?.25:3.2} castShadow shadow-mapSize={[1536,1536]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={35} shadow-bias={-.0003} shadow-normalBias={.015}/>
 <directionalLight target={target} position={[focus[0]-5,focus[1]+3,focus[2]-4]} color="#93d9d6" intensity={night?.18:1.5}/>
 <directionalLight target={target} position={[focus[0]+1,focus[1]+5,focus[2]-6]} color="#d5eaff" intensity={night?.22:1.2}/>
 {night?<><spotLight target={target} position={[focus[0]-3,focus[1]+6,focus[2]+3]} color="#e0ecff" intensity={110} distance={18} angle={.65} penumbra={.85} decay={2}/><spotLight target={target} position={[focus[0]+4,focus[1]+4,focus[2]-5]} color="#92cbd9" intensity={75} distance={16} angle={.65} penumbra={.9} decay={2}/></>:null}
 <StableReflections night={night}/>
 </>;
};
