import React from "react";
import type {RoutePose} from "../../../../src/yunex/world-kit/environments.ts";
import {EP005_ROUTE,trackPoint} from "./route.ts";
/** Agent 2 supplies the optional flame intensity; never substitute a light for flame geometry. */
export const EP005PracticalLighting:React.FC<{pose:RoutePose;premium?:boolean;flameIntensity?:number}>=
({pose,premium=true,flameIntensity=0})=>{
 if(!premium)return <hemisphereLight args={["#99b2c3","#1d2730",.12]}/>;
 const p=pose.position,forward=[Math.cos(pose.yaw),-Math.sin(pose.yaw)];
 return <>
  <hemisphereLight args={["#b7d5e0","#2b303e",.19]}/>
  <directionalLight position={[p[0]-12,10,p[2]-8]} intensity={.34} color="#b9d8f2"/>
  {Array.from({length:12},(_,i)=>{
   const d=EP005_ROUTE.lapMetres*(i+.07)/12;
   const l=trackPoint(d,i%2===0?19.3:-19.3,6.96).position;
   return <pointLight key={i} position={l} intensity={72} distance={30} decay={2}
    color={i%3===0?"#bddde8":"#ffd6a0"}/>;
  })}
  <pointLight position={[p[0]+2.2*forward[0],.72,p[2]+2.2*forward[1]]}
    color="#cfe7fa" intensity={12} decay={2} distance={7}/>
  {flameIntensity>0?<pointLight
   position={[p[0]-2.2*forward[0],.45,p[2]-2.2*forward[1]]}
   intensity={27*Math.min(1,Math.max(0,flameIntensity))} color="#ff823a"
   distance={5} decay={2}/>:null}
 </>;
};
