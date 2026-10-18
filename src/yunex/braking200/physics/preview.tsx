import React,{useMemo,useEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,WorldLighting,CameraAim} from '../../world-kit/components';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import {sampleRoute} from '../../world-kit/environments.ts';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState,WheelKey} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {sampleBrakingSimulation} from './simulation.ts';
import {mapAbsInsertFrameToSimulationSec} from './timeline.ts';

const GOLD='#ffc28a',ICE='#84e9f2',WHITE='#f0f4f7';
const FONT:React.CSSProperties={fontFamily:'Arial,Helvetica,sans-serif',color:WHITE,textTransform:'uppercase'};
const Graphics:React.FC<{state:BrakingSimulationState;title:string;subtitle:string;context:string;progress:number;abs:boolean}>=({state,title,subtitle,context,progress,abs})=>{
 const wheel=state.wheel['front-left'];
 return <>
  <div style={{position:'absolute',inset:0,pointerEvents:'none',
    background:'linear-gradient(180deg,rgba(5,17,26,.92),transparent 24%,transparent 60%,rgba(4,17,26,.96))'}}/>
  <div style={{...FONT,position:'absolute',top:70,left:62,right:54}}>
   <div style={{fontSize:24,color:ICE,fontWeight:800,letterSpacing:6}}>YUNEX / ENGINEERING 001</div>
   <div style={{fontSize:69,lineHeight:1.03,fontWeight:900,letterSpacing:-1,marginTop:23}}>{title}</div>
   <div style={{fontSize:25,color:'#c8d3dd',letterSpacing:3,marginTop:19}}>{subtitle}</div>
  </div>
  <div style={{...FONT,position:'absolute',left:62,right:62,bottom:79}}>
   <div style={{display:'flex',alignItems:'end',justifyContent:'space-between',gap:20}}>
    <div><div style={{fontSize:22,color:GOLD,letterSpacing:3}}>SPEED / KM·H</div>
     <div style={{fontSize:100,fontWeight:900,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{String(Math.round(state.speedMps*3.6)).padStart(3,'0')}</div></div>
    <div style={{fontSize:21,letterSpacing:2,lineHeight:1.4,textAlign:'right',maxWidth:390,color:abs?GOLD:WHITE}}>{context}</div>
   </div>
   <div style={{marginTop:31,height:4,background:'#48606d'}}>
    <div style={{width:(Math.max(0,Math.min(1,progress))*100)+'%',height:'100%',background:GOLD}}/>
   </div>
   <div style={{display:'flex',justifyContent:'space-between',marginTop:16,fontSize:19,letterSpacing:1.7}}>
    <span>PAD PRESSURE <span style={{color:GOLD}}>{Math.round(wheel.brakePressure01*100)}%</span></span>
    <span>ROAD FORCE <span style={{color:ICE}}>{(wheel.roadLongitudinalForceN/1000).toFixed(1)} KN</span></span>
   </div>
   <div style={{fontSize:17,marginTop:17,color:'#9db3c2',letterSpacing:1.9}}>ILLUSTRATIVE PHYSICS — NOT MEASURED TEST DATA</div>
  </div>
 </>;
};
const Ground:React.FC<{distance:number}>=({distance})=>{
 const shift=-(distance%1.6);
 return <>
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]}>
   <planeGeometry args={[80,80]}/><meshStandardMaterial color="#28323a" roughness={.96}/>
  </mesh>
  {Array.from({length:22},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]}
    position={[(i-11)*1.6+shift,.011,-.65]}>
    <planeGeometry args={[.65,.028]}/><meshBasicMaterial color="#b5bcc2" opacity={.40} transparent/>
  </mesh>)}
 </>;
};
const WheelMacro:React.FC<{s:BrakingSimulationState}>=({s})=>{
 const w=s.wheel['front-left'];
 const a=Array.from({length:36},(_,i)=>i*2*Math.PI/36);
 return <group position={[0,.36,0]}>
  <group rotation={[0,0,-w.rotationRad]}>
   <mesh castShadow rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.36,.36,.30,64]}/>
    <meshStandardMaterial color="#0e171c" roughness={.95}/></mesh>
   {[-.15,.15].map((z,i)=><mesh key={i} position={[0,0,z]}>
    <torusGeometry args={[.30,.04,12,64]}/><meshStandardMaterial color="#253238" roughness={.9}/></mesh>)}
   {a.map((t,i)=><mesh key={i} rotation={[0,0,t]} position={[Math.cos(t)*.358,Math.sin(t)*.358,0]}>
    <boxGeometry args={[.045,.052,.32]}/><meshStandardMaterial color={i%4?'#253036':'#38474c'} roughness={.88}/></mesh>)}
   <mesh position={[0,0,.172]}><cylinderGeometry args={[.245,.245,.023,64]}/>
    <meshStandardMaterial color="#809096" metalness={.86} roughness={.30}/></mesh>
   <mesh position={[0,0,.199]}><torusGeometry args={[.245,.025,10,64]}/>
    <meshStandardMaterial color="#c0cace" metalness={.89} roughness={.28}/></mesh>
   {Array.from({length:8},(_,i)=><group key={i} rotation={[0,0,i*Math.PI/4]}>
    <mesh position={[.125,0,.209]}><boxGeometry args={[.19,.026,.02]}/>
      <meshStandardMaterial color="#e5e9e8" metalness={.8} roughness={.33}/></mesh>
    <mesh position={[.24,0,.217]}><sphereGeometry args={[.012,8,8]}/><meshBasicMaterial color={GOLD}/></mesh>
   </group>)}
   <mesh position={[0,0,.22]}><cylinderGeometry args={[.065,.065,.03,24]}/>
    <meshStandardMaterial color="#cad5d8" metalness={.9}/></mesh>
  </group>
  {/* Caliper mounted on wheel pivot, never the spinning hub. */}
  <group position={[.25,.045,.206]}>
   <mesh castShadow><boxGeometry args={[.108,.18,.085]}/>
    <meshStandardMaterial color="#c49b69" roughness={.33} metalness={.65}/></mesh>
   <mesh position={[0,0,.048]}><boxGeometry args={[.052,.08,.012]}/>
    <meshStandardMaterial color="#f5e2c0" emissive={GOLD} emissiveIntensity={w.brakePressure01*.3}/></mesh>
  </group>
  <pointLight position={[.28,.02,.30]} intensity={w.brakePressure01*.9} color={GOLD} distance={1.6}/>
 </group>;
};
const ContactVectors:React.FC<{s:BrakingSimulationState}>=({s})=>{
 const w=s.wheel['front-left'],load=Math.min(1,w.normalLoadN/6300),
   force=Math.min(1,w.roadLongitudinalForceN/5400);
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[.06,.019,.39]}>
   <planeGeometry args={[.60,.29]}/><meshBasicMaterial color={ICE} transparent opacity={.19}/></mesh>
  <group position={[.13,.055,.47]}>
   <mesh position={[force*.31,0,0]} rotation={[0,0,-Math.PI/2]}>
    <coneGeometry args={[.08,.17,12]}/><meshBasicMaterial color={ICE}/></mesh>
   <mesh position={[force*.14,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.018,.018,Math.max(.02,force*.54),12]}/><meshBasicMaterial color={ICE}/></mesh>
  </group>
  <group position={[.42,.70,-.26]}>
   <mesh position={[0,-load*.13,0]}><cylinderGeometry args={[.016,.016,load*.26,12]}/>
    <meshBasicMaterial color={GOLD}/></mesh>
   <mesh position={[0,-load*.29,0]} rotation={[Math.PI,0,0]}>
    <coneGeometry args={[.060,.12,12]}/><meshBasicMaterial color={GOLD}/></mesh>
  </group>
 </group>;
};
const MacroScene:React.FC<{state:BrakingSimulationState}>=({state})=>{
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#192b38'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[1.12,.94,2.52],fov:37,near:.08,far:120}}>
   <color attach="background" args={['#192b38']}/><ambientLight intensity={1.9}/>
   <directionalLight castShadow color="#e1efff" position={[3,5,4]} intensity={4}/>
   <directionalLight color={GOLD} position={[-2,2,-1]} intensity={2.4}/>
   <CameraAim position={[1.12,.94,2.52]} target={[.08,.43,0]} fov={37}/>
   <Ground distance={state.traveledM}/><WheelMacro s={state}/><ContactVectors s={state}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
const PhysicsVehicle:React.FC<{s:BrakingSimulationState}>=({s})=>{
 const model=useMemo(()=>createVehicle({variant:BRAKING_EP001.vehicleVariant,
   color:BRAKING_EP001.carPaint,accent:BRAKING_EP001.caliperAccent}),[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 const pose=sampleRoute('track',s.traveledM);
 model.position.set(...pose.position);
 model.rotation.order='YZX';model.rotation.set(0,pose.yaw,-s.pitchRad);
 model.traverse(node=>{
  if(!node.userData.wheel)return;
  const pivot=node.parent;if(!pivot)return;
  const key=((pivot.position.x>0?'front':'rear')+'-'+(pivot.position.z>0?'left':'right')) as WheelKey;
  node.rotation.z=-s.wheel[key].rotationRad;
 });
 return <primitive object={model}/>;
};
const WorldScene:React.FC<{state:BrakingSimulationState}>=({state})=>{
 const {width,height}=useVideoConfig();
 const p=sampleRoute('track',state.traveledM),x=p.position[0],z=p.position[2],a=p.yaw;
 const camera:[number,number,number]=[x+Math.cos(a)*10.8+Math.sin(a)*8.4,3.1,
   z-Math.sin(a)*10.8+Math.cos(a)*8.4];
 return <AbsoluteFill>
  <ThreeCanvas width={width} height={height} shadows camera={{position:camera,fov:39,near:.2,far:350}}>
   <WorldLighting timeOfDay="day" focus={p.position}/>
   <Environment kind="track" seed={12} timeOfDay="day"/>
   <CameraAim position={camera} target={[x,.76,z]} fov={39}/>
   <PhysicsVehicle s={state}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
export const BrakingPhysicsMacro:React.FC=()=>{
 const frame=useCurrentFrame(),s=sampleBrakingSimulation(mapAbsInsertFrameToSimulationSec(frame),'low-grip-abs');
 const active=s.wheel['front-left'].absIntervening;
 return <AbsoluteFill><MacroScene state={s}/>
  <Graphics state={s} title="THE GRIP LIMIT" subtitle="ABS / illustrative low-grip insert"
   context={active?'ABS RELEASES PRESSURE':'TYRE FORCE IS FINITE'} progress={frame/145} abs={active}/>
 </AbsoluteFill>;
};
export const BrakingPhysicsContext:React.FC=()=>{
 const frame=useCurrentFrame(),s=sampleBrakingSimulation(frame/30*2.0,'dry-track');
 return <AbsoluteFill><WorldScene state={s}/>
  <Graphics state={s} title="200 KM/H TO ZERO" subtitle="Four wheels / one physical state"
   context="DRY TRACK / 2X PREVIEW" progress={s.traveledM/215} abs={false}/>
 </AbsoluteFill>;
};
export const physicsWheelAnchors=()=>wheelAnchors(vehicleSpec(BRAKING_EP001.vehicleVariant));
