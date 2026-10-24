/** Native moving V5 evidence; identical lens/lighting for controlled V4/V5 comparisons. */
import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig,AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from './rig';
import {CinematicLighting} from './Lighting';
import {CameraAim} from '../world-kit/components';
import {disposeObject} from '../world-kit/geometry';
import {vehicleSpec} from '../world-kit/catalog';
import type {VehicleVariant} from '../world-kit/catalog';
type Props={variant:VehicleVariant;before?:boolean;mode?:'tour'|'orbit';panel?:boolean};
const Scene:React.FC<Props>=({variant,before=false,mode='tour',panel=false})=>{
 const frame=useCurrentFrame(),{width,height:fullHeight}=useVideoConfig(),height=panel?fullHeight/2:fullHeight,s=vehicleSpec(variant),rally=variant==='rally-hatch';
 const car=useMemo(()=>createCinematicVehicle({variant,bodyDetail:before?'coachbuilt':'fleet',quality:'hero',color:variant==='supercar'?'#18636b':s.color,driver:false}),[variant,before]);
 useEffect(()=>()=>disposeObject(car),[car]);
 const t=frame/30,shot=Math.min(4,Math.floor(frame/36)),phase=(frame%36)/35;
 animateCinematicVehicle(car,{frame,fps:30,distance:t*9,speed:9,steer:rally?.10*Math.sin(t*1.5):.015,roughness:rally?.35:0,curvature:rally?.025:0});
 let a=mode==='orbit'?.45+frame/179*Math.PI*1.05:shot===0?.55+phase*.12:shot===1?Math.PI/2:shot===2?2.55-phase*.13:shot===3?.70+phase*.18:.85+phase*.16;
 const close=mode==='tour'&&shot===3,radius=close?5.3:Math.max(panel?8.5:14,s.length*(panel?1.9:3.05)),target:T.Vector3Tuple=close?[s.wheelbase/2,.55,s.width*.30]:[0,s.height*.49,0];
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:38,near:.03,far:500}}>
  <CinematicLighting timeOfDay="day"/><primitive object={car}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.018,0]} receiveShadow><planeGeometry args={[300,300]}/><meshStandardMaterial color={rally?'#665c4e':'#3b4146'} roughness={.94} metalness={.02}/></mesh>
  {!rally?Array.from({length:31},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[i*6-90-(t*9)%6,-.015,-3]}><planeGeometry args={[2.4,.10]}/><meshStandardMaterial color="#b8bdba" roughness={1}/></mesh>):Array.from({length:120},(_,i)=>{const x=((i*1.713-t*9)%36+36)%36-18,z=Math.sin(i*2.399)*6;return <mesh key={i} position={[x,-.008+((i%7)*.002),z]} rotation={[0,i*.72,0]}><dodecahedronGeometry args={[.018+(i%4)*.012,0]}/><meshStandardMaterial color={i%2?'#a39a85':'#48463e'} roughness={1}/></mesh>;})}
  <CameraAim position={[target[0]+Math.cos(a)*radius,close?1.45:2.6,target[2]+Math.sin(a)*radius]} target={target} fov={38}/>
 </ThreeCanvas>;
};
const variants:VehicleVariant[]=['saloon','hot-hatch','rally-hatch','long-suv','crew-pickup','formula-modern','sport-bike','box-truck','grand-tourer','panel-van','estate','retro-coupe'];
const Comparison:React.FC=()=>{const f=useCurrentFrame(),v=variants[Math.floor(f/30)%variants.length];return <AbsoluteFill style={{background:'#101820'}}><div style={{position:'absolute',top:0,width:'100%',height:'50%'}}><Scene variant={v} before panel mode="orbit"/></div><div style={{position:'absolute',top:'50%',width:'100%',height:'50%'}}><Scene variant={v} panel mode="orbit"/></div><div style={{position:'absolute',top:32,left:40,color:'white',fontSize:28,fontFamily:'sans-serif'}}>V4 · {v}</div><div style={{position:'absolute',top:'51.5%',left:40,color:'white',fontSize:28,fontFamily:'sans-serif'}}>V5 · {v}</div></AbsoluteFill>;};
const Root=()=> <>
 <Composition id="V5Supercar" component={Scene} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{variant:'supercar'}}/>
 <Composition id="V5Road" component={Scene} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{variant:'grand-tourer'}}/>
 <Composition id="V5Rally" component={Scene} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{variant:'rally-hatch'}}/>
 <Composition id="V5Fleet" component={Comparison} width={1080} height={1920} fps={30} durationInFrames={360}/>
 </>;
registerRoot(Root);
