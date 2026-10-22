import React from "react";
import type {RoutePose} from "../../../../src/yunex/world-kit/environments.ts";

/** Animated flame bounce is a LIGHT INPUT ONLY. Agent 2 supplies its real flame timeline/model. */
export const EP005PracticalLighting:React.FC<{
  pose:RoutePose; premium?:boolean; flameIntensity?:number;
}>=({pose,premium=true,flameIntensity=0})=>{
  if(!premium)return <hemisphereLight args={["#8da0af","#24303a",.12]}/>;
  const p=pose.position;
  return <>
    <hemisphereLight args={["#b7d0db","#263441",.30]}/>
    <directionalLight position={[p[0]-8,9,-7]} color="#a8d4f5" intensity={.85}/>
    <directionalLight position={[p[0]+6,6,9]} color="#ffe0bb" intensity={.45}/>
    {[-74,-38,-2,34,70].map(x=><React.Fragment key={x}>
      <pointLight position={[x,6.35,-8.22]} intensity={36} distance={18} decay={2} color="#ffd8a2"/>
      <pointLight position={[x,6.35,8.22]} intensity={22} distance={16} decay={2} color="#b9dbe1"/>
    </React.Fragment>)}
    <pointLight position={[p[0]+2.25,.65,p[2]]} intensity={10} distance={7} decay={2} color="#e0efff"/>
    {flameIntensity>0?<pointLight position={[p[0]-2.2,.52,p[2]]} intensity={26*Math.min(1,Math.max(0,flameIntensity))} distance={5.2} decay={2} color="#ff8b3d"/>:null}
  </>;
};
