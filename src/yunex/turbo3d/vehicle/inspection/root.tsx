import React, {useLayoutEffect} from 'react';
import {Composition, AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {VehicleWorld} from '../VehicleWorld';

/** Four genuinely moving camera passes over original native geometry; no flat still pan. */
export const CLOSEUP_SHOTS=['FRONT_HEADLAMP_DUCT','WHEEL_BRAKES','REAR_ENGINE_REVEAL','REAR_HERO'] as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const Cams:React.FC<{frame:number}>=({frame})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
   const stage=Math.min(3,Math.floor(frame/45));
   const t=clamp((frame%45)/44), ease=t*t*(3-2*t);
   let p:[number,number,number]=[-2.95,1.45,4.16],look:[number,number,number]=[-.56,.67,1.91],fov=32;
   if(stage===0){p=[-3.75+ease*.42,1.72+ease*.10,5.0-ease*.45];look=[-.48,.70,1.83];fov=35;}
   if(stage===1){p=[-2.65+ease*.19,.96+ease*.10,3.08-ease*.20];look=[-.858,.355,1.47];fov=31;}
   if(stage===2){p=[-3.15+ease*.40,2.55-ease*.22,-4.28+ease*.16];look=[0,.98,-1.51];fov=37;}
   if(stage===3){p=[4.28-ease*.55,2.12+ease*.20,-6.32+ease*.55];look=[0,.81,-1.35];fov=38;}
   camera.position.set(...p);
   camera.lookAt(...look);
   if('fov' in camera){(camera as import('three').PerspectiveCamera).fov=fov;}
   camera.updateProjectionMatrix();
 },[camera,frame]);
 return null;
};
const Inspection:React.FC=()=>{
 const frame=useCurrentFrame(),stage=Math.floor(frame/45),local=frame%45;
 const reveal=stage===2?clamp(local/35):0;
 const distance=stage===2?0:frame*.12;
 return <AbsoluteFill style={{background:'#08121D'}}>
  <ThreeCanvas width={540} height={960} shadows
     camera={{fov:33,position:[-2.9,1.45,4],near:.06,far:160}}
     gl={{antialias:true,preserveDrawingBuffer:true}}>
   <Cams frame={frame}/>
   <VehicleWorld frame={frame} variant={stage===2?'reveal':'hero'} revealProgress={reveal} travelMeters={distance}/>
  </ThreeCanvas>
  <div style={{position:'absolute',left:28,top:38,color:'#C6E3E4',fontFamily:'Arial',fontWeight:700,fontSize:14,letterSpacing:2,opacity:.82}}>{CLOSEUP_SHOTS[stage]}</div>
 </AbsoluteFill>;
};
export const VehicleCloseupRoot:React.FC=()=> <Composition id="A1VehicleCloseupInspection" component={Inspection}
 width={540} height={960} fps={30} durationInFrames={180}/>;
