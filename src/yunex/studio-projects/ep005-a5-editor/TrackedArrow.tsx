import React from 'react';
import * as T from 'three';

/** Only use a *real* named-Object3D world-space anchor from a reviewed source.
 * Never point at an inferred exhaust position or an independent stock mesh.
 * Camera and anchor are sampled from the SAME absolute output frame. */
export type TrackedCamera={
 position:readonly [number,number,number];
 target:readonly [number,number,number];
 fov:number;
};
export type ScreenAnchor={x:number;y:number;depth:number;visible:boolean};
export function projectTrackedPoint(
 world:readonly [number,number,number],camera:TrackedCamera,width:number,height:number
):ScreenAnchor {
 if(![...world,...camera.position,...camera.target,camera.fov,width,height].every(Number.isFinite)
    ||camera.fov<=0||camera.fov>=160||width<=0||height<=0)
   return {x:0,y:0,depth:2,visible:false};
 const view=new T.PerspectiveCamera(camera.fov,width/height,.025,1000);
 view.position.set(...camera.position);
 const target=new T.Vector3(...camera.target);
 if(view.position.distanceToSquared(target)<1e-8)return {x:0,y:0,depth:2,visible:false};
 view.lookAt(target);
 view.updateMatrixWorld(true);
 const projected=new T.Vector3(...world).project(view);
 const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;
 // Camera-space depth also catches points behind the near clipping plane.
 const forward=target.clone().sub(view.position).normalize();
 const inFront=new T.Vector3(...world).sub(view.position).dot(forward)>.025;
 return {x,y,depth:projected.z,
   visible:inFront&&projected.z>=-1&&projected.z<=1&&x>=width*.05&&
     x<=width*.95&&y>=height*.11&&y<=height*.795};
}
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
/** Movie overlay: small 1–3-word label, arrow follows real transformed ports. */
export const TrackedArrow:React.FC<{
 pointWorld:readonly [number,number,number];
 camera:TrackedCamera;text:string;width:number;height:number;
 side?:'left'|'right';opacity?:number
}>=({pointWorld,camera,text,width:w,height:h,side='left',opacity=1})=>{
 const p=projectTrackedPoint(pointWorld,camera,w,h);
 if(!p.visible||!text.trim()||text.length>24)return null;
 const labelX=clamp(p.x+(side==='left'?-230:50),w*.075,w*.80);
 const labelY=clamp(p.y-105,h*.15,h*.72);
 const elbowX=labelX+(side==='left'?205:4);
 const elbowY=labelY+28;
 return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
   style={{position:'absolute',inset:0,pointerEvents:'none',opacity}}>
  <path d={`M ${p.x.toFixed(2)} ${p.y.toFixed(2)} L ${elbowX.toFixed(2)} ${elbowY.toFixed(2)}`}
    fill="none" stroke="#64ebda" strokeWidth={3.5} strokeLinecap="round"/>
  <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#65e5d6" strokeWidth={3}/>
  <circle cx={p.x} cy={p.y} r={3.5} fill="#e9ffff"/>
  <rect x={labelX} y={labelY} width={224} height={56} rx={7}
    fill="#04171f" fillOpacity={.88} stroke="#448b85" strokeOpacity={.6}/>
  <text x={labelX+16} y={labelY+35} fill="#f6fffe"
    fontFamily="Arial,sans-serif" fontSize={25} fontWeight={750}>{text}</text>
 </svg>;
};
