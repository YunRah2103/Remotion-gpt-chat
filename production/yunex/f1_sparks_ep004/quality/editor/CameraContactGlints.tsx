/** Editor optical lens presentation of ACTUAL approved Agent 2 particles.
 * No new particles, no decorative emission, no invented event time.
 * All endpoints begin with Agent 5's camera projection of the genuine
 * particle.positionWorld + velocityWorld, and visible only while alive.
 */
import React from 'react';
import type {SparkParticle,CameraPose} from '../../shared/contract.ts';
import {projectSparkSegments} from '../../story/SparkLensGlints.tsx';
type Props=Readonly<{particles:readonly SparkParticle[];pose:CameraPose;strength?:number}>;
export const CameraContactGlints:React.FC<Props>=({particles,pose,strength=1})=>{
 const segs=projectSparkSegments(particles,pose).slice(0,125);
 if(segs.length===0)return null;
 return <svg aria-label="Real skid contact particles; camera/lens exposure only"
   viewBox="0 0 1080 1920" style={{
     position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'hidden',
   }}>
   <defs>
    <filter id="ep004-hot-spark-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5.5"/>
    </filter>
   </defs>
   {segs.map(s=>{
    const dx=s.tx-s.x,dy=s.ty-s.y;
    const length=Math.hypot(dx,dy),mult=length>0?Math.min(1.6,82/length):1;
    const tx=s.x+dx*mult,ty=s.y+dy*mult;
    return <g key={s.id} opacity={Math.min(1,s.energy*1.28)}>
      <line x1={s.x} y1={s.y} x2={tx} y2={ty}
        stroke="#ff8a28" strokeWidth={Math.max(7,19*strength)}
        strokeLinecap="round" opacity={.55} filter="url(#ep004-hot-spark-glow)"/>
      <line x1={s.x} y1={s.y} x2={tx} y2={ty}
        stroke="#ffaf43" strokeWidth={4.8*strength}
        strokeLinecap="round" opacity={.88}/>
      <line x1={s.x} y1={s.y} x2={tx} y2={ty}
        stroke="#fffce9" strokeWidth={1.8+2.1*strength*s.energy}
        strokeLinecap="round" opacity={.98}/>
      <circle cx={s.x} cy={s.y} r={2.5+2.8*strength*s.energy}
        fill="#fffdeb" opacity={.96}/>
    </g>;
   })}
 </svg>;
};
