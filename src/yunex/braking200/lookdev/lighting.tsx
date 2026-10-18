import React,{useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {Point3} from './math.ts';
import {BRAKING_PALETTE} from './materials.ts';

/** Portable software-render-friendly image-based reflection setup.
 * Falls back to direct lights when PMREM is unavailable. All GPU resources
 * and renderer settings are restored/disposed on unmount. */
const StudioReflection:React.FC=()=>{
  const {gl,scene}=useThree();
  useEffect(()=>{
    const oldEnv=scene.environment,oldIntensity=scene.environmentIntensity;
    const oldTone=gl.toneMapping,oldExposure=gl.toneMappingExposure;
    let map:T.WebGLRenderTarget<T.Texture>|undefined;
    gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.16;
    try{
      const generator=new T.PMREMGenerator(gl),room=new RoomEnvironment();
      try{map=generator.fromScene(room,.04);}finally{room.dispose();generator.dispose();}
      scene.environment=map.texture;scene.environmentIntensity=.57;
    }catch(_error){scene.environment=oldEnv;scene.environmentIntensity=oldIntensity;}
    return ()=>{
      scene.environment=oldEnv;scene.environmentIntensity=oldIntensity;
      gl.toneMapping=oldTone;gl.toneMappingExposure=oldExposure;map?.dispose();
    };
  },[gl,scene]);return null;
};
export const BrakingWorldLighting:React.FC<{focus?:Point3}>=({focus=[0,0,0]})=>{
  const target=useMemo(()=>new T.Object3D(),[]);
  target.position.set(focus[0],focus[1],focus[2]);
  return <>
    <color attach="background" args={[BRAKING_PALETTE.sky]}/>
    <fog attach="fog" args={[BRAKING_PALETTE.sky,100,275]}/>
    <hemisphereLight args={['#edf4f6','#72796b',1.35]}/>
    <ambientLight color="#ebf1f4" intensity={.12}/>
    <primitive object={target}/>
    <directionalLight target={target} position={[focus[0]+30,focus[1]+52,focus[2]+21]}
      color={BRAKING_PALETTE.sun} intensity={2.75} castShadow
      shadow-mapSize={[1024,1024]} shadow-camera-left={-24}
      shadow-camera-right={24} shadow-camera-top={24}
      shadow-camera-bottom={-24} shadow-camera-near={.5}
      shadow-camera-far={150} shadow-bias={-.0003} shadow-normalBias={.026}/>
    <directionalLight position={[focus[0]-21,focus[1]+12,focus[2]-24]}
      color="#b6d8e5" intensity={.95}/>
    <directionalLight position={[focus[0]-13,focus[1]+8,focus[2]+17]}
      color="#f4cf9f" intensity={.52}/>
    <StudioReflection/>
  </>;
};
