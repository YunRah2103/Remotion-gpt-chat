import React,{useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
/** Initialise reflections before Remotion's first frame advance, not in a later passive effect. */
const StableReflections:React.FC=()=>{
 const {gl,scene}=useThree();useLayoutEffect(()=>{
  const previous=scene.environment,intensity=scene.environmentIntensity;
  const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);
  scene.environment=env.texture;scene.environmentIntensity=.22;
  room.dispose();pmrem.dispose();return()=>{scene.environment=previous;scene.environmentIntensity=intensity;env.dispose();};
 },[gl,scene]);return null;
};
export const CinematicLighting:React.FC=()=> <>
 <color attach="background" args={['#14232d']}/><fog attach="fog" args={['#14232d',95,260]}/>
 <hemisphereLight args={['#b1cbdc','#17212b',.55]}/>
 <directionalLight position={[4,7,4]} color="#fff0dd" intensity={3.2} castShadow shadow-mapSize={[1536,1536]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={35} shadow-bias={-.0003} shadow-normalBias={.015}/>
 <directionalLight position={[-5,2,-4]} color="#93d9d6" intensity={1.5}/>
 <directionalLight position={[1,5,-6]} color="#d5eaff" intensity={1.2}/>
 <StableReflections/>
 </>;
