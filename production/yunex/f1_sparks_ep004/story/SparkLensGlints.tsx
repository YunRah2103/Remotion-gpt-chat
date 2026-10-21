/** Cinematic exposure pass over EXISTING Agent 2 spark particles only.
 * No spawn code, no decorative onset: the end points and world velocity are
 * projected from the exact signed-gap-born SparkParticle list from physics.
 * In particular, dry frames get NO light strokes.
 */
import React from 'react';
import * as THREE from 'three';
import type {CameraPose,SparkParticle} from '../shared/contract.ts';

type Segment=Readonly<{id:number;x:number;y:number;tx:number;ty:number;energy:number}>;
export function projectSparkSegments(particles:readonly SparkParticle[],pose:CameraPose,width=1080,height=1920):readonly Segment[]{
 if(!particles.length)return [];
 const camera=new THREE.PerspectiveCamera(pose.fovDeg,width/height,.025,350);
 camera.position.set(...pose.positionWorld);
 camera.lookAt(...pose.targetWorld);
 camera.updateMatrixWorld(true);
 const results:Segment[]=[];
 for(const p of particles){
  if(p.ageSec<0||p.ageSec>=p.lifetimeSec||p.luminance01<=.11)continue;
  const head=new THREE.Vector3(...p.positionWorld);
  const trail=new THREE.Vector3(...p.velocityWorld).multiplyScalar(-.026).add(head);
  head.project(camera);trail.project(camera);
  if(head.z<-1||head.z>1||!Number.isFinite(head.x)||!Number.isFinite(head.y))continue;
  const x=(head.x+1)*width/2,y=(1-head.y)*height/2;
  const rawX=(trail.x+1)*width/2,rawY=(1-trail.y)*height/2;
  if(x<-25||x>width+25||y<-25||y>height+25)continue;
  const dx=rawX-x,dy=rawY-y,dist=Math.hypot(dx,dy);
  const limit=Math.max(6,Math.min(48,dist));
  const factor=dist>1e-5?limit/dist:0;
  results.push({id:p.id,x,y,tx:x+dx*factor,ty:y+dy*factor,energy:p.luminance01});
  if(results.length>=125)break;
 }
 return results;
}
export const SparkLensGlints:React.FC<{particles:readonly SparkParticle[];pose:CameraPose}>=({particles,pose})=>{
 const segments=projectSparkSegments(particles,pose);
 if(!segments.length)return null;
 return <svg aria-hidden style={{position:'absolute',inset:0,width:'100%',height:'100%',
  pointerEvents:'none',overflow:'hidden'}} viewBox="0 0 1080 1920">
  {segments.map(s=><g key={s.id}>
    <line x1={s.x} y1={s.y} x2={s.tx} y2={s.ty}
      stroke="#ffb14c" strokeWidth={4+7*s.energy} strokeLinecap="round" opacity={.26*s.energy}/>
    <line x1={s.x} y1={s.y} x2={s.tx} y2={s.ty}
      stroke="#fff9e5" strokeWidth={1.7+2.9*s.energy} strokeLinecap="round" opacity={.7+.3*s.energy}/>
   </g>)}
 </svg>;
};
