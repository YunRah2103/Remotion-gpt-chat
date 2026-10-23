import React,{useState,useEffect,useLayoutEffect,useMemo} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig,useDelayRender,staticFile,AbsoluteFill} from 'remotion';
import {useThree} from '@react-three/fiber';import {ThreeCanvas} from '@remotion/three';import * as T from 'three';
import {loadConceptVehicle,CONCEPT_CREDIT} from './concept.ts';import {animateImportedVehicle} from './import.ts';
import {CinematicLighting} from '../modelling-kit/Lighting';import {CameraAim} from '../world-kit/components';import {disposeObject} from '../world-kit/geometry.ts';
import {limitStudioLights} from './light-pool.ts';
import {createStudioEnvironment} from './environment.ts';import {sampleRoad} from './road.ts';import {applyScannedMaterials} from './assets.ts';import {LocationReflections} from './Reflections';import type {V3} from '../world-kit/geometry.ts';
const ReadyModel:React.FC<{model:T.Group;handle:number}>=({model,handle})=>{const {continueRender}=useDelayRender(),{advance}=useThree();useLayoutEffect(()=>{advance(performance.now());continueRender(handle);},[model,handle,advance,continueRender]);return <primitive object={model}/>;};
export const ConceptProof:React.FC=()=>{
 const {delayRender,cancelRender}=useDelayRender(),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),[model,setModel]=useState<T.Group|null>(null),[handle]=useState(()=>delayRender('Load authored car and vendored city materials'));
 const world=useMemo(()=>createStudioEnvironment({preset:'city',vegetation:0,quality:'hero'}),[]);
 useEffect(()=>{let active=true,car:T.Group|undefined,cleanup:(()=>void)|undefined;Promise.all([loadConceptVehicle(staticFile('yunex-v5/concept-car/CarConcept.glb')),applyScannedMaterials(world.group,staticFile,'city','asphalt')]).then(([value,clean])=>{car=value;cleanup=clean;if(!active){disposeObject(value);clean();return;}for(const side of [-1,1]){const target=new T.Object3D();target.position.set(25,.04,side*.75);const lamp=new T.SpotLight('#dce9fa',120,40,.28,.7,2);lamp.position.set(2.2,.50,side*.75);lamp.target=target;car.add(lamp,target);}setModel(value);}).catch(cancelRender);return()=>{active=false;if(car)disposeObject(car);cleanup?.();};},[handle,world,cancelRender]);
 useEffect(()=>()=>disposeObject(world.group),[world]);
 const t=frame/fps,d=78+t*13,pose=sampleRoad(world.road,d),ahead=sampleRoad(world.road,d+.5),curvature=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw))/.5;
 limitStudioLights(world.group,pose.position,4);
 if(model){animateImportedVehicle(model,d,Math.atan(2.8*curvature));model.position.copy(pose.position);model.quaternion.copy(pose.quaternion);}
 const a=.72+.10*Math.sin(t*.3),local=new T.Vector3(Math.cos(a)*13.8,2.2,-Math.sin(a)*13.8),position=local.applyQuaternion(pose.quaternion).add(pose.position),target=pose.position.clone().add(new T.Vector3(0,.65,0));
 return <AbsoluteFill><ThreeCanvas width={width} height={height} shadows camera={{fov:40,near:.03,far:500}}><CinematicLighting focus={pose.position.toArray() as V3} timeOfDay="night"/>{model?<LocationReflections world={world.group} focus={sampleRoad(world.road,125).position} night/>:null}<primitive object={world.group}/>{model?<ReadyModel model={model} handle={handle}/>:null}<CameraAim position={position.toArray() as V3} target={target.toArray() as V3} fov={40}/></ThreeCanvas><div style={{position:'absolute',left:'5%',right:'5%',bottom:'4%',color:'#aebdc6',font:'20px Arial',lineHeight:1.3}}>{CONCEPT_CREDIT}</div></AbsoluteFill>;
};
registerRoot(()=> <Composition id="V5-AuthoredConceptCar" component={ConceptProof} width={1080} height={1920} fps={30} durationInFrames={240}/>);
