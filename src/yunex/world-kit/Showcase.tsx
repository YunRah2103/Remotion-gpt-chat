import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {VEHICLES,vehicleSpec} from './catalog.ts';
import type {EnvironmentKind,TimeOfDay,VehicleVariant} from './catalog.ts';
import type {V3} from './geometry.ts';
import {sampleRoute} from './environments.ts';
import {Vehicle,Environment,CameraAim,WorldLighting} from './components';
export type PreviewProps={variant:VehicleVariant;angle:number;color?:string};
const caption:React.CSSProperties={fontFamily:'Arial, sans-serif',color:'#edf4ee',letterSpacing:2};
export const VehiclePreview:React.FC<PreviewProps>=({variant='saloon',angle=.67,color})=>{
 const {width,height,fps}=useVideoConfig(),frame=useCurrentFrame(),s=vehicleSpec(variant);
 const a=angle+frame/fps*.18,portrait=height>width,rad=Math.max(3.0,s.length*(portrait?1.70:1.12));
 return <AbsoluteFill style={{background:'#c4cecc'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[8,4,8],fov:38,near:.1,far:300}}>
   <WorldLighting studio/><CameraAim position={[Math.cos(a)*rad,rad*.39,Math.sin(a)*rad]} target={[0,s.height*.45,0]} fov={38}/>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.008,0]} receiveShadow><planeGeometry args={[300,300]}/><meshStandardMaterial color="#a6b2ac" roughness={.78}/></mesh>
   <Vehicle variant={variant} color={color}/>
  </ThreeCanvas>
  <div style={{...caption,position:'absolute',left:'5%',bottom:'7%',background:'#15232bd9',padding:'16px 24px',borderLeft:'3px solid #56cfb6'}}>
   <div style={{fontSize:Math.round(width*.012),opacity:.7,marginBottom:7}}>YUNEX / REUSABLE ORIGINALS</div>
   <div style={{fontSize:Math.round(width*.025),fontWeight:600,letterSpacing:0}}>{s.label}</div>
  </div>
 </AbsoluteFill>;
};
export type DrivingProps={variant:VehicleVariant;environment:EnvironmentKind;timeOfDay:TimeOfDay;seed:number};
export const DrivingPreview:React.FC<DrivingProps>=({variant='coupe',environment='highway',timeOfDay='day',seed=12})=>{
 const {width,height,fps}=useVideoConfig(),frame=useCurrentFrame(),s=vehicleSpec(variant),d=frame/fps*9-48;
 const pose=sampleRoute(environment,d),next=sampleRoute(environment,d+.5);
 const angle=pose.yaw,wide=height>width?1.35:1;
 const offset:V3=[s.length*1.25*wide,s.height+2.05,s.length*1.05*wide];
 const camera:V3=[pose.position[0]+Math.cos(angle)*offset[0]+Math.sin(angle)*offset[2],offset[1],pose.position[2]-Math.sin(angle)*offset[0]+Math.cos(angle)*offset[2]];
 const delta=Math.atan2(Math.sin(next.yaw-angle),Math.cos(next.yaw-angle));
 return <AbsoluteFill>
  <ThreeCanvas width={width} height={height} shadows camera={{position:camera,fov:44,near:.1,far:350}}>
   <WorldLighting timeOfDay={timeOfDay} focus={pose.position}/><Environment kind={environment} seed={seed} timeOfDay={timeOfDay}/>
   <CameraAim position={camera} target={[pose.position[0],s.height*.55,pose.position[2]]} fov={44}/>
   <Vehicle variant={variant} lights={timeOfDay!=='day'} distance={d} steer={Math.atan(s.wheelbase*delta/.5)} pose={pose}/>
  </ThreeCanvas>
  <div style={{...caption,position:'absolute',left:'5%',top:'7%',background:'#15232bd9',padding:'12px 18px',fontSize:width*.016}}>{s.label.toUpperCase()} / {environment.toUpperCase()}</div>
 </AbsoluteFill>;
};
/** 19 shapes, 3 environments; one second per variant at any FPS. */
export const WorldKitReel:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),i=Math.min(VEHICLES.length-1,Math.floor(frame/fps));
 const environment=(['highway','city','track'] as const)[i%3];
 return <Sequence key={VEHICLES[i].id} from={i*fps} durationInFrames={fps} premountFor={fps}><DrivingPreview variant={VEHICLES[i].id} environment={environment} timeOfDay={i%3===1?'dusk':'day'} seed={12}/></Sequence>;
};
