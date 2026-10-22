/** Matching-time BEFORE / AFTER native Remotion previews for EP005 A6.
 * These are silent review films, not the finished EP005 edit or real flames.
 */
import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CameraAim} from '../../../../src/yunex/world-kit/components.tsx';
import {sampleRoute} from '../../../../src/yunex/world-kit/environments.ts';
import {createCinematicEnvironment} from '../../../../src/yunex/modelling-kit/environments.ts';
import {CinematicLighting} from '../../../../src/yunex/modelling-kit/Lighting.tsx';
import {animateCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {createEp005Hero,resolveEp005ExhaustPorts} from '../vehicle/hero.ts';
import {applyEp005HeroPolish,countEp005PolishDetails} from './quality.ts';
import {animatePlantedHero,polishFollowCamera} from './dynamics.ts';
import type {MotionSample,CameraPose} from './dynamics.ts';

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function sampleReview(frame:number,fps:number):MotionSample{
 const t=frame/fps;
 // Deliberately same analytic travel/speed and canonical track route as Agent 3.
 const distanceMeters=12*t+.30*t*t+t-25/(2*Math.PI)*Math.sin(2*Math.PI*t/25);
 const speedMps=12+.60*t+2*Math.sin(Math.PI*t/25)**2;
 const routeDistanceMeters=55+distanceMeters;
 const pose=sampleRoute('track',routeDistanceMeters);
 const ahead=sampleRoute('track',routeDistanceMeters+.45);
 const dYaw=Math.atan2(Math.sin(ahead.yaw-pose.yaw),Math.cos(ahead.yaw-pose.yaw));
 return {frame,fps,distanceMeters,routeDistanceMeters,speedMps,pose,steerRadians:clamp(-dYaw*2.78/.45,-.38,.38)};
}
const cameraLocal=(frame:number):{p:[number,number,number];at:[number,number,number];fov:number}=>{
 if(frame<60)return {p:[-7.1,1.62,3.0],at:[-1.28,.62,0],fov:40};
 if(frame<122)return {p:[-.7,2.42,7.6],at:[-.12,.68,0],fov:44};
 return {p:[-8.05,2.06,-3.55],at:[-.98,.67,0],fov:42};
};
const transform=(v:[number,number,number],pose:MotionSample['pose']):[number,number,number]=>{
 const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
 return [pose.position[0]+v[0]*c+v[2]*s,pose.position[1]+v[1],pose.position[2]-v[0]*s+v[2]*c];
};
export const EP005PolishPreview:React.FC<{polished:boolean}>=({polished})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const sample=sampleReview(frame,fps),camSpec=cameraLocal(frame);
 const hero=useMemo(()=>{const h=createEp005Hero();if(polished)applyEp005HeroPolish(h);return h;},[polished]);
 const world=useMemo(()=>createCinematicEnvironment({kind:'track',seed:21,timeOfDay:'dusk',quality:'hero',wetness:.10}),[]);
 useEffect(()=>()=>{disposeObject(hero);disposeObject(world);},[hero,world]);
 if(polished)animatePlantedHero(hero,sample);
 else{
  animateCinematicVehicle(hero,{frame,fps,distance:sample.distanceMeters,steer:sample.steerRadians});
  hero.position.fromArray(sample.pose.position);hero.rotation.set(0,sample.pose.yaw,0);
  hero.updateMatrixWorld(true);
 }
 // Strict contract: both named ports remain rooted to Agent 1's actual tailpipes.
 const ports=resolveEp005ExhaustPorts(hero);
 if(ports.length!==2||ports.some(p=>p.innerRadius!==.085||!Number.isFinite(p.position.x)))throw Error('EP005 flame port regression');
 if(polished&&countEp005PolishDetails(hero)<30)throw Error('A6 detail layer was not attached');
 const base:CameraPose={
  position:transform(camSpec.p,sample.pose),
  target:transform(camSpec.at,sample.pose),
  fov:camSpec.fov
 };
 const camera=polished?polishFollowCamera(base,sample):base;
 const a=transform([1.2,3.9,-3.4],sample.pose);
 const b=transform([-3.2,2.6,4.1],sample.pose);
 return <AbsoluteFill style={{backgroundColor:'#101a21'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:true}} camera={{near:.025,far:550,fov:camera.fov}}>
   <CinematicLighting focus={sample.pose.position} timeOfDay="dusk"/>
   <primitive object={world}/>
   <primitive object={hero}/>
   <CameraAim {...camera}/>
   <pointLight position={a} intensity={25} distance={16} decay={2} color="#b9dced"/>
   <pointLight position={b} intensity={18} distance={15} decay={2} color="#ffe1cb"/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',fontFamily:'Arial,sans-serif',fontSize:26,fontWeight:800,letterSpacing:2,color:'#f2f7fa',textShadow:'0 2px 9px #001117'}}>YUNEX / EP005 / AGENT 6</div>
  <div style={{position:'absolute',bottom:'11%',left:'7%',right:'7%',fontFamily:'Arial,sans-serif',fontSize:45,fontWeight:800,color:'#fff',textShadow:'0 3px 9px #001117'}}>
   {polished?'AFTER / REFINED & PLANTED':'BEFORE / AGENT 1 HERO'}
  </div>
  <div style={{position:'absolute',bottom:'6.5%',left:'7%',right:'7%',fontFamily:'Arial,sans-serif',fontSize:20,color:'#d1e1e5'}}>SILENT 6s COMPARISON · V3 TRACK · PHYSICAL EXHAUST MOUNTS PRESERVED</div>
 </AbsoluteFill>;
};
