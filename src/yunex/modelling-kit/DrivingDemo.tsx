import React,{useMemo,useEffect,useLayoutEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {CameraAim} from '../world-kit/components';
import {sampleRoute} from '../world-kit/environments.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import type {VehicleVariant,EnvironmentKind,TimeOfDay} from '../world-kit/catalog.ts';
import {disposeObject} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import {CinematicVehicle} from './components';
import {CinematicLighting} from './Lighting';
import {createCinematicEnvironment} from './environments.ts';
import {drivingCamera,drivingState} from './driving.ts';

const World:React.FC<{kind:EnvironmentKind;timeOfDay:TimeOfDay;baseline:boolean}>=({kind,timeOfDay,baseline})=>{
 const g=useMemo(()=>createCinematicEnvironment({kind,timeOfDay,wetness:timeOfDay==='night'?.8:.12,quality:baseline?'lightweight':'hero'}),[kind,timeOfDay,baseline]);
 useEffect(()=>()=>disposeObject(g),[g]);return <primitive object={g}/>;
};
const Headlights:React.FC=()=>{
 const targets=useMemo(()=>[-.58,.58].map(z=>{const g=new T.Object3D();g.position.set(24,0,z);return g;}),[]);
 return <>{targets.map((target,i)=><React.Fragment key={i}><primitive object={target}/><spotLight position={[1.9,.62,i? .58:-.58]} target={target} intensity={75} angle={.24} penumbra={.7} distance={45} decay={2} color="#e2edff"/></React.Fragment>)}</>;
};
/** A fixed pool of rain streaks sampled from absolute time, never accumulated. */
const Rain:React.FC<{frame:number;fps:number;focus:V3}>=({frame,fps,focus})=>{
 const rain=useMemo(()=>{const m=new T.InstancedMesh(new T.BoxGeometry(.012,.22,.012),new T.MeshBasicMaterial({color:'#a4bfcb',transparent:true,opacity:.22,depthWrite:false}),240);m.frustumCulled=false;return m;},[]);
 useLayoutEffect(()=>{const d=new T.Object3D(),t=frame/fps;for(let i=0;i<rain.count;i++){d.position.set(focus[0]+((i*7.31)%30)-15,((i*.713-t*9)%8+8)%8,focus[2]+((i*3.83)%30)-15);d.rotation.z=-.13;d.updateMatrix();rain.setMatrixAt(i,d.matrix);}rain.instanceMatrix.needsUpdate=true;},[rain,frame,fps,...focus]);
 useEffect(()=>()=>disposeObject(rain),[rain]);return <primitive object={rain}/>;
};
export const DrivingDemo:React.FC<{scene?:'highway'|'city'|'mountain'|'track';baseline?:boolean}>=({scene='highway',baseline=false})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps,portrait=height>width;
 const variant:VehicleVariant=scene==='track'?'formula-modern':scene==='city'?'supercar':'hot-hatch',s=vehicleSpec(variant);
 const timeOfDay=scene==='city'?'night':'day';
 const state=drivingState(scene==='highway'?'acceleration':scene==='mountain'?'cornering':'cruise',frame,fps);
 const distance=(state.distance??0)+(scene==='highway'?-30:scene==='track'?35:-40),pose=sampleRoute(scene,distance);
 // Numerical route curvature steers the wheels according to the actual road, including loop wrapping.
 const ahead=sampleRoute(scene,distance+.4),delta=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw)),steer=T.MathUtils.clamp(-delta/.4*s.wheelbase,-.4,.4);
 const shot=drivingCamera(scene==='track'?'chase':'tracking',pose,s,width/height,t);
 return <AbsoluteFill style={{background:'#14232d'}}><ThreeCanvas width={width} height={height} shadows camera={{fov:shot.fov,near:.05,far:500}} gl={{antialias:true}}>
 <CinematicLighting focus={pose.position} timeOfDay={timeOfDay}/><World kind={scene} timeOfDay={timeOfDay} baseline={baseline}/>
 <CameraAim {...shot}/>
 <group position={pose.position} rotation={[0,pose.yaw,0]}>
 <CinematicVehicle options={{variant,color:scene==='city'?'#ba364c':'#17a391',quality:'hero',lights:true,driver:scene!=='track'}} state={{frame:state.frame,fps:state.fps,distance:state.distance,steer,compression:state.compression,braking:state.braking,heat:state.heat}}/>
 {timeOfDay==='night'?<Headlights/>:null}
 </group>
 {timeOfDay==='night'?<Rain frame={frame} fps={fps} focus={pose.position}/>:null}
 </ThreeCanvas>
 <div style={{position:'absolute',left:'6%',top:'6%',right:'6%',fontFamily:'Arial',color:'#e4f2f1',fontSize:width*(portrait?.032:.018),letterSpacing:2}}>YUNEX / AUTOMOTIVE STUDIO</div>
 <div style={{position:'absolute',left:'6%',right:'6%',bottom:'10%',fontFamily:'Arial',color:'#e4f2f1',fontSize:width*(portrait?.036:.022),fontWeight:700}}>{scene.toUpperCase()} / {baseline?'RECOVERED WORLD':'PREMIUM WORLD'}</div>
 <div style={{position:'absolute',left:'6%',bottom:'7%',fontFamily:'Arial',color:'#a8c5cc',fontSize:width*(portrait?.023:.012)}}>Route-following · Native 30 fps · Illustrative motion</div>
 </AbsoluteFill>;
};
