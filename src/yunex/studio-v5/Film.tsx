import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {createStudioEnvironment} from './environment.ts';
import type {StudioConfig,Preset} from './environment.ts';
import {sampleRoad} from './road.ts';
import {createStudioVehicle,poseStudioVehicle} from './vehicle.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../modelling-kit/rig.ts';
import {CinematicLighting} from '../modelling-kit/Lighting';
import {LocationReflections} from './Reflections';
import {CameraAim} from '../world-kit/components';
import {disposeObject} from '../world-kit/geometry.ts';
import {createCinematicEnvironment} from '../modelling-kit/environments.ts';
import {sampleRoute} from '../world-kit/environments.ts';
import type {V3} from '../world-kit/geometry.ts';
export type FilmProps={config:StudioConfig;baseline?:boolean};
export const StudioFilm:React.FC<FilmProps>=({config,baseline=false})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
 const environment=useMemo(()=>createStudioEnvironment(config),[config]);
 const {road,config:c}=environment;
 const variant=c.preset==='city'?'coupe':c.preset==='rally'?'rally-hatch':'supercar';
 const car=useMemo(()=>createStudioVehicle(variant),[variant]);
 const legacy=useMemo(()=>baseline?createCinematicEnvironment({kind:c.preset==='circuit'?'track':c.preset==='rally'?'rally':c.preset,timeOfDay:c.timeOfDay,wetness:c.weather==='wet'?.7:0,quality:'hero'}):null,[baseline,c.preset,c.timeOfDay,c.weather]);
 useEffect(()=>()=>{disposeObject(environment.group);},[environment]);useEffect(()=>()=>disposeObject(car),[car]);useEffect(()=>()=>{if(legacy)disposeObject(legacy);},[legacy]);
 const distance=78+t*(c.preset==='rally'?10:13),pose=sampleRoad(road,distance),ahead=sampleRoad(road,distance+.5);
 const curvature=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw))/.5;
 poseStudioVehicle(car,road,distance,frame,fps,c.preset==='rally'?10:13);
 // A matched legacy view uses the original route and corresponding vehicle-local camera.
 if(legacy){const p=sampleRoute(c.preset==='circuit'?'track':c.preset==='rally'?'rally':c.preset,distance);car.position.fromArray(p.position);car.rotation.set(0,p.yaw,0);}
 const a=.78+.12*Math.sin(t*.32),radius=13.8,local=new T.Vector3(Math.cos(a)*radius,2.5+Math.sin(t*.35)*.18,(c.preset==='mountain'?1:-1)*Math.sin(a)*radius),target=new T.Vector3(0,1.0,0).applyQuaternion(car.quaternion).add(car.position);
 const position=local.applyQuaternion(car.quaternion).add(car.position),night=c.timeOfDay==='night';
 const background=c.timeOfDay==='dusk'?'#aab3ba':night?'#101c2a':'#a6b9c5';
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:40,near:.05,far:1400}} gl={{antialias:true}}>
 <CinematicLighting focus={car.position.toArray() as V3} timeOfDay={c.timeOfDay}/>
 <color attach="background" args={[background]}/><fog attach="fog" args={[background,night?75:180,night?300:850]}/>
 <hemisphereLight args={[night?'#8ba9ce':'#d6e2eb',night?'#343c43':'#786d58',night?.55:.35]}/>
 <LocationReflections world={legacy??environment.group} focus={sampleRoad(road,125).position} night={night}/><primitive object={legacy??environment.group}/><primitive object={car}/><CameraAim position={position.toArray() as V3} target={target.toArray() as V3} fov={40}/>
 </ThreeCanvas>;
};
const Root=()=> <>{(['mountain','circuit','city','rally'] as Preset[]).map(preset=><Composition key={preset} id={'V5-'+preset} component={StudioFilm} width={1080} height={1920} fps={30} durationInFrames={240} defaultProps={{config:{preset,quality:'hero'}}}/>)}</>;
registerRoot(Root);
