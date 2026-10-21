import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim,WorldLighting,Vehicle} from '../world-kit/components';
import {CinematicVehicle} from './components';
import {HERO_VEHICLES} from './rig.ts';
import type {CinematicState} from './rig.ts';
import type {V3} from '../world-kit/geometry.ts';
import type {VehicleVariant} from '../world-kit/catalog.ts';
const smooth=(a:number,b:number,t:number)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
/** Shared local rendering look; no external textures, HDRIs or post-process grain. */
const Stage:React.FC<{distance:number;track:boolean}>=({distance,track})=><>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.016,0]} receiveShadow><planeGeometry args={[240,240]}/><meshStandardMaterial color={track?'#252d36':'#26343a'} roughness={track?.77:.36} metalness={track?.05:.2}/></mesh>
 {track&&<group position={[-distance%8,0,0]}>{Array.from({length:26},(_,i)=><group key={i} position={[(i-13)*8,0,0]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,-2.8]}><planeGeometry args={[3,.10]}/><meshStandardMaterial color="#dbe6e6" roughness={.7}/></mesh>
  {[-1,1].map(side=><group key={side} position={[0,0,side*4]}><mesh position={[0,.30,0]} castShadow><boxGeometry args={[7.9,.60,.23]}/><meshStandardMaterial color="#596975" metalness={.6} roughness={.4}/></mesh><mesh position={[0,.025,-side*.25]}><boxGeometry args={[4,.05,.5]}/><meshStandardMaterial color={i%2?'#c24b40':'#c7c9c5'} roughness={.8}/></mesh></group>)}
 </group>)}</group>}

</>;
export const KitDemo:React.FC<{demo:'A'|'B'|'C';baseline?:boolean;variant?:VehicleVariant}>=({demo,baseline=false,variant})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps,portrait=height>width;
 const selected=variant??(demo==='A'?HERO_VEHICLES[Math.min(2,Math.floor(t/3))]:demo==='B'?'hot-hatch':'formula-modern');
 const segment=demo==='A'?t%3:t,damage=demo==='B'?smooth(1.6,2.5,t):0;
 const compression=demo==='C'?.082*smooth(.8,1.3,t)*(1-smooth(4.8,5.3,t)):demo==='B'?.015*damage:0;
 const cutaway=demo==='C'?.92*smooth(2.6,3.2,t)*(1-smooth(4.5,5,t)):0;
 const distance=demo==='A'?t*1.4:demo==='B'?t*7-damage*Math.max(0,t-2)*3:t*10;
 let position:V3,target:V3=[0,.60,0],fov=portrait?42:38;
 if(demo==='A'){
  const angle=.55+segment*.23,r=portrait?11.8:6.2;position=[Math.cos(angle)*r,2.05,Math.sin(angle)*r];
  if(segment>1.8){const q=smooth(1.8,3,segment);position=[(1-q)*position[0]+q*3,(1-q)*position[1]+q*.9,(1-q)*position[2]+q*3.1];target=[q*.8,.55,q*.35];}
 }else if(demo==='B'){
  if(t<2.7)position=[portrait?7:5.5,1.7,portrait?6.2:4.8];
  else if(t<4.5){position=[3.1,.86,2.3];target=[1.25,.30,.8];fov=40;}
  else {position=[2.6,.57,2.05];target=[1.30,.25,.84];fov=portrait?44:35;}
 }else{
  if(t<2.6)position=[portrait?10.5:6,portrait?2.2:1.25,portrait?8:4.3];
  else if(t<5){position=[portrait?6:2.5,portrait?3.4:2.0,portrait?8:3.5];target=[0,.12,0];}
  else {position=[portrait?-8:-5.2,portrait?1.7:1.05,portrait?10:4.5];target=[-.25,.5,0];}
 }
 const state:CinematicState={frame,fps,distance,compression,tyreDamage:damage,steer:demo==='B'?.035*damage:0,cutaway,highlight:cutaway>0?'underfloor':undefined,bodyDamage:0};
 const title=demo==='A'?`${selected.toUpperCase()} / HERO`:demo==='B'?(t<1.6?'01 / INTACT':t<2.7?'02 / PRESSURE LOSS':t<4.5?'03 / COLLAPSED CARCASS':'04 / SAME WHEEL, DAMAGED'):t<2.6?'01 / SKID CONTACT':t<5?'02 / CARBON · PLANK · METAL':'03 / SUSPENSION REBOUNDS';
 return <AbsoluteFill style={{background:'#15232d'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov,near:.05,far:300}} gl={{antialias:true}}>
   <WorldLighting timeOfDay="night"/>
   <directionalLight position={[4,6,3]} intensity={1.8} color="#e2f0ff"/>
   <directionalLight position={[-3,3,-4]} intensity={1.6} color="#54d4cf"/>
   <Stage distance={distance} track={demo!=='A'}/><CameraAim position={position} target={target} fov={fov}/>
   <group rotation={[0,demo==='B'?damage*.055:0,0]}>
    {baseline?<Vehicle variant={selected} distance={distance} color={selected==='supercar'?'#ca3948':selected==='hot-hatch'?'#2368b6':'#10a99e'} lights/>:<CinematicVehicle options={{variant:selected,quality:'hero',color:selected==='supercar'?'#ca3948':selected==='hot-hatch'?'#2368b6':'#10a99e',lights:true}} state={state}/>}
   </group>
  </ThreeCanvas>
  <div style={{position:'absolute',left:'6%',top:'6%',color:'#e2f3f5',fontFamily:'Arial',fontSize:width*(portrait?.032:.018),letterSpacing:2}}>YUNEX / MODELLING KIT V2</div>
  <div style={{position:'absolute',left:'6%',right:'6%',bottom:'11%',color:'#edf9fa',fontFamily:'Arial',fontSize:width*(portrait?.035:.020),fontWeight:700}}>{baseline?'LEGACY BASELINE':title}</div>
  <div style={{position:'absolute',left:'6%',bottom:'7%',color:'#9fb8c3',fontFamily:'Arial',fontSize:width*(portrait?.022:.011)}}>Original procedural assets · Illustrative mechanics</div>
 </AbsoluteFill>;
};
