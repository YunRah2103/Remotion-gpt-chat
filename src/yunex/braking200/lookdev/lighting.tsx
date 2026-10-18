import React,{useEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {Vec3} from '../contracts.ts';
import {BRAKING_PALETTE} from './materials.ts';

const ReflectedDaylight:React.FC=()=>{
 const {gl,scene}=useThree();
 useEffect(()=>{
  const previous={environment:scene.environment,intensity:scene.environmentIntensity,
    mapping:gl.toneMapping,exposure:gl.toneMappingExposure};
  let radiance:T.WebGLRenderTarget<T.Texture>|undefined;
  gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.12;
  try{
   const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment();
   try{radiance=pmrem.fromScene(room,.07);}
   finally{pmrem.dispose();room.dispose();}
   scene.environment=radiance.texture;scene.environmentIntensity=.49;
  }catch(_err){/* Shadowed directional/hemisphere lights still work on swangle. */}
  return ()=>{
   scene.environment=previous.environment;
   scene.environmentIntensity=previous.intensity;
   gl.toneMapping=previous.mapping;gl.toneMappingExposure=previous.exposure;
   radiance?.dispose();
  };
 },[gl,scene]);return null;
};
/** 3-point automotive lighting: bright sculpted forms, anchored shadows,
 * broad cool sky fill, warm directional grazing highlights; no night look. */
export const BrakingLighting:React.FC<{focus?:Vec3;studio?:boolean}>=({
 focus=[0,0,0],studio=false
})=>{
 const target=useMemo(()=>new T.Object3D(),[]);
 target.position.set(...focus);
 return <>
  <color attach="background" args={[studio?'#354755':BRAKING_PALETTE.sky]}/>
  <fog attach="fog" args={[studio?'#354755':BRAKING_PALETTE.sky,studio?22:85,studio?100:225]}/>
  <hemisphereLight args={['#d8eaf7','#53564f',studio?1.26:.96]}/>
  <ambientLight color="#f1f1ed" intensity={studio?.20:.12}/>
  <primitive object={target}/>
  <directionalLight target={target}
    position={[focus[0]+18,focus[1]+32,focus[2]+24]}
    color={BRAKING_PALETTE.sun} intensity={studio?3.6:3.35}
    castShadow shadow-mapSize={[2048,2048]}
    shadow-camera-left={-21} shadow-camera-right={21}
    shadow-camera-top={21} shadow-camera-bottom={-21}
    shadow-camera-near={.4} shadow-camera-far={115}
    shadow-bias={-.0004} shadow-normalBias={.022}/>
  <directionalLight position={[focus[0]-15,focus[1]+9,focus[2]-18]}
    color="#b2d7ef" intensity={studio?1.65:.92}/>
  <directionalLight position={[focus[0]-7,focus[1]+15,focus[2]+10]}
    color="#ffe0ac" intensity={studio?1.20:.57}/>
  <ReflectedDaylight/>
 </>;
};
/** Back-compatible name; contains no meshes other than light target. */
export const BrakingWorldLighting=BrakingLighting;
