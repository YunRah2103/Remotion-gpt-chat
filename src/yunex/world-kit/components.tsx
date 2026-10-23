import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createVehicle} from './vehicles.ts';
import {createProp} from './props.ts';
import type {PropOptions} from './props.ts';
import {createEnvironment} from './environments.ts';
import {animateVehicle,placeVehicle} from './motion.ts';
import {disposeObject} from './geometry.ts';
import type {VehicleOptions,TimeOfDay} from './catalog.ts';
import type {EnvironmentOptions,RoutePose} from './environments.ts';
import type {V3} from './geometry.ts';
export const Vehicle:React.FC<VehicleOptions & {distance?:number;steer?:number;pose?:RoutePose}>=({variant,color,accent,wheelColor,lights=false,interior=true,cutaway=false,glassOpacity,interiorColor,steeringSide,distance=0,steer=0,pose})=>{
 const model=useMemo(()=>createVehicle({variant,color,accent,wheelColor,lights,interior,cutaway,glassOpacity,interiorColor,steeringSide}),[variant,color,accent,wheelColor,lights,interior,cutaway,glassOpacity,interiorColor,steeringSide]);
 useEffect(()=>()=>disposeObject(model),[model]);
 animateVehicle(model,distance,steer);if(pose)placeVehicle(model,pose);else {model.position.set(0,0,0);model.rotation.set(0,0,0);}
 return <primitive object={model}/>;
};
export const Environment:React.FC<EnvironmentOptions>=({kind,seed=12,timeOfDay='day'})=>{
 const model=useMemo(()=>createEnvironment({kind,seed,timeOfDay}),[kind,seed,timeOfDay]);useEffect(()=>()=>disposeObject(model),[model]);return <primitive object={model}/>;
};
export const CameraAim:React.FC<{position:V3;target:V3;fov?:number}>=({position,target,fov=40})=>{
 const {camera}=useThree();useLayoutEffect(()=>{camera.position.set(...position);camera.lookAt(...target);if(camera instanceof T.PerspectiveCamera){camera.fov=fov;camera.updateProjectionMatrix();}},[camera,...position,...target,fov]);return null;
};
/** Procedural studio reflections; no network requests or external HDR files. */
const Reflections:React.FC=()=>{
 const {gl,scene}=useThree();useEffect(()=>{
  const pmrem=new T.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);const previous=scene.environment,previousIntensity=scene.environmentIntensity;
  scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
  return ()=>{scene.environment=previous;scene.environmentIntensity=previousIntensity;env.dispose();};
 },[gl,scene]);return null;
};
export const WorldLighting:React.FC<{timeOfDay?:TimeOfDay;studio?:boolean;focus?:V3}>=({timeOfDay='day',studio=false,focus=[0,0,0]})=>{
 const target=useMemo(()=>new T.Object3D(),[]);target.position.set(...focus);
 const cfg={day:{sky:'#b7ced8',sun:'#fff1d6',power:2.4,ambient:1.5},dusk:{sky:'#9b97a3',sun:'#ffd1a2',power:2.2,ambient:.9},night:{sky:'#162332',sun:'#8ab9df',power:1.25,ambient:.7}}[timeOfDay];
 return <>
  <color attach="background" args={[studio?'#c4cecc':cfg.sky]}/><fog attach="fog" args={[studio?'#c4cecc':cfg.sky,studio?55:95,studio?150:260]}/>
  <hemisphereLight args={['#e9f2fa','#6c7867',cfg.ambient]}/>
  <primitive object={target}/><directionalLight target={target} position={[focus[0]+30,focus[1]+45,focus[2]+20]} intensity={cfg.power} color={cfg.sun} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-far={120} shadow-bias={-.0003} shadow-normalBias={.035}/>
  <directionalLight position={[-20,12,-28]} color="#b1dcf3" intensity={.7}/>
  <Reflections/>
 </>;
};

export const SceneProp:React.FC<PropOptions & {position?:V3;rotationY?:number}>=({kind,color,lit=false,position=[0,0,0],rotationY=0})=>{
 const model=useMemo(()=>createProp({kind,color,lit}),[kind,color,lit]);useEffect(()=>()=>disposeObject(model),[model]);
 return <group position={position} rotation={[0,rotationY,0]}><primitive object={model}/></group>;
};
