/** Self-contained temporary geometry solely for A4 CAMERA prototypes.
 * A1/A2/A3 provide approved real models later. Never present these proxy meshes as final assets.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraDirector} from './CameraDirector';
import {SceneLabels} from './KineticLabels';
import type {Shot} from './cameraMath';

type Variant='hookA'|'hookB'|'shaft'|'charge'|'road';
const stone='#4B606D',teal='#0D817F',orange='#FF8A36',aqua='#53CFFF';
const Rotor:React.FC<{x:number;frame:number;color:string}>=({x,frame,color})=><group position={[x,0,0]}>
  <group rotation={[frame*.34,0,0]}>
   <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.19,.19,.15,24]}/><meshStandardMaterial color="#C5D0D1" metalness={.8} roughness={.32}/></mesh>
   {Array.from({length:10},(_,i)=>{const a=2*Math.PI*i/10;
    return <mesh key={i} position={[0,Math.cos(a)*.34,Math.sin(a)*.34]} rotation={[a+.25,0,0]} castShadow>
     <boxGeometry args={[.10,.17,.44]}/><meshStandardMaterial color={color} metalness={.72} roughness={.24} side={2}/>
    </mesh>})}
  </group>
  <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.64,.145,12,56]}/><meshStandardMaterial color={stone} metalness={.78} roughness={.3}/></mesh>
  <mesh position={[-.08,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.56,.56,.06,48]}/><meshStandardMaterial color="#233543" metalness={.78} roughness={.42} transparent opacity={.38} depthWrite={false}/></mesh>
 </group>;
const Orb:React.FC<{x:number;y:number;z:number;color:string;r?:number}>=({x,y,z,color,r=.06})=><mesh position={[x,y,z]}>
 <sphereGeometry args={[r,10,8]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.7}/></mesh>;
const Flow:React.FC<{frame:number;hot?:boolean}>=({frame,hot=true})=>{
 const t=frame*.052;
 return <group>{Array.from({length:24},(_,i)=>{
  const u=((i/24+t*(hot?1:-.8))%1+1)%1;
  const x=hot?-3.25+u*2.3:2.65-u*1.7;
  const spread=(1-u)*.18;
  return <Orb key={i} x={x} y={.13+Math.cos(i*2.4+t*1.2)*spread} z={-.12+Math.sin(i*1.7)*spread} r={.04+(1-u)*.022} color={hot?orange:aqua}/>;
 })}</group>;
};
const StubTurbo:React.FC<{frame:number}>=({frame})=><group>
 <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.105,.105,1.85,20]}/><meshStandardMaterial color="#CBD7D7" metalness={.84} roughness={.24}/></mesh>
 <Rotor x={-.82} frame={frame} color="#C58B62"/>
 <Rotor x={.82} frame={frame} color="#76CADC"/>
 <mesh position={[-2.15,-.2,-.1]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.28,.3,1.52,22]}/><meshStandardMaterial color="#5D4D43" metalness={.66} roughness={.39}/></mesh>
 <mesh position={[2.06,.23,-.1]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.29,.29,1.15,22]}/><meshStandardMaterial color={stone} metalness={.74} roughness={.35}/></mesh>
 <Flow frame={frame} hot/>
 <Flow frame={frame} hot={false}/>
 <group position={[0,-1.25,0]}>
  <mesh receiveShadow><boxGeometry args={[6,.18,3]}/><meshStandardMaterial color="#14222D" metalness={.3} roughness={.6}/></mesh>
  {Array.from({length:11},(_,i)=><mesh key={i} position={[-2.5+i*.5,.1,-1.2]}><boxGeometry args={[.012,.01,2.3]}/><meshStandardMaterial color="#2F5360" emissive="#134554" emissiveIntensity={.16}/></mesh>)}
 </group>
</group>;
const EngineStub:React.FC<{frame:number}>=({frame})=><group>
 <StubTurbo frame={frame}/>
 {/* CLEAR PROXY ENGINE: essential only for inspecting the A4 intake-to-cylinder camera.
     A2 supplies the real dimensional engine; A3 owns the real combustion animation. */}
 <mesh position={[4,0,-1.4]}><boxGeometry args={[1.0,1.58,2.0]}/><meshPhysicalMaterial color="#6B94A0" metalness={.32} roughness={.25} transparent opacity={.28} depthWrite={false} side={2}/></mesh>
 <mesh position={[4,.81,-1.4]}><boxGeometry args={[1.07,.09,2.08]}/><meshStandardMaterial color="#A4C1C5" metalness={.72} roughness={.28}/></mesh>
 {Array.from({length:4},(_,i)=><group key={i} position={[3.99,-.2,-2.09+i*.46]}>
   <mesh><cylinderGeometry args={[.21,.21,.8,14]}/><meshStandardMaterial color="#77C8D7" emissive="#245967" emissiveIntensity={.45} metalness={.5} roughness={.24}/></mesh>
   <mesh position={[0,.43,0]}><torusGeometry args={[.17,.035,8,16]}/><meshStandardMaterial color="#BDE6DE" metalness={.6} roughness={.2}/></mesh>
  </group>)}
 <mesh position={[3.15,-.35,-1.25]}><boxGeometry args={[1.35,.32,.42]}/><meshStandardMaterial color="#73BEC3" emissive="#267B83" emissiveIntensity={.38} metalness={.4} roughness={.35}/></mesh>
 {Array.from({length:10},(_,i)=><mesh key={i} position={[2.57+i*.13,-.12,-1.25]}>
   <boxGeometry args={[.035,.3,.48]}/><meshStandardMaterial color="#B1D6D8" metalness={.62} roughness={.27}/></mesh>)}
 {Array.from({length:12},(_,i)=>{const u=((i/12+frame*.009)%1);return <Orb key={i} x={2.1+u*2.2} y={-.2} z={-.9-u*.5} r={.055} color="#8CEBE3"/>})}
 </group>;
const Tire:React.FC<{x:number;z:number;frame:number}>=({x,z,frame})=><group position={[x,.39,z]} rotation={[frame*.22,0,0]}>
 <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.39,.39,.21,28]}/><meshStandardMaterial color="#141922" roughness={.9}/></mesh>
 <mesh position={[x>0?.125:-.125,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.21,.21,.015,16]}/><meshStandardMaterial color="#99A9B1" metalness={.85} roughness={.24}/></mesh>
 </group>;
const RoadStub:React.FC<{frame:number}>=({frame})=><group>
 <mesh position={[0,-.03,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[60,130]}/><meshStandardMaterial color="#101F2A" roughness={.94}/></mesh>
 {[-3,3].map(x=><mesh key={x} position={[x,0,0]}><boxGeometry args={[.08,.017,120]}/><meshBasicMaterial color="#608691"/></mesh>)}
 {Array.from({length:22},(_,i)=>{
  const z=((i*6+frame*.32+66)%132)-66;
  return <mesh key={i} position={[0,.013,z]}><boxGeometry args={[.10,.016,2.7]}/><meshBasicMaterial color="#C6DFDC"/></mesh>
 })}
 {Array.from({length:16},(_,i)=>{
  const z=((i*9+frame*.3+72)%144)-72;
  return <group key={i}><mesh position={[-4.8,.23,z]}><boxGeometry args={[.14,.5,.17]}/><meshStandardMaterial color="#1D5963" emissive="#21616B" emissiveIntensity={.3}/></mesh>
  <mesh position={[4.8,.23,z]}><boxGeometry args={[.14,.5,.17]}/><meshStandardMaterial color="#1D5963" emissive="#21616B" emissiveIntensity={.3}/></mesh></group>
 })}
 <group position={[0,0,.05]}>
 <mesh castShadow position={[0,.67,0]}><boxGeometry args={[1.94,.48,4.55]}/><meshPhysicalMaterial color={teal} metalness={.56} roughness={.24} clearcoat={.8}/></mesh>
 <mesh castShadow position={[0,1.06,-.35]}><boxGeometry args={[1.6,.51,2.1]}/><meshPhysicalMaterial color="#123E4B" metalness={.36} roughness={.24}/></mesh>
 <mesh position={[0,.65,2.33]}><boxGeometry args={[1.63,.14,.08]}/><meshBasicMaterial color="#C2F4EE"/></mesh>
 <mesh position={[0,.72,-2.29]}><boxGeometry args={[1.68,.13,.05]}/><meshBasicMaterial color="#F15C3A"/></mesh>
 {[-1,1].map(x=><React.Fragment key={x}><Tire x={x*1.01} z={1.48} frame={frame}/><Tire x={x*1.01} z={-1.45} frame={frame}/></React.Fragment>)}
 </group>
 </group>;
const PreviewWorld:React.FC<{frame:number;variant:Variant}>=({frame,variant})=>{
 const shot:Shot=variant==='hookA'?'hookOrbit':variant==='hookB'?'hookRush':variant==='shaft'?'shaftFollow':variant==='charge'?'chargeGlide':'roadHero';
 const duration=variant==='shaft'||variant==='charge'?150:variant==='road'?120:90;
 return <>
  <color attach="background" args={['#08121D']}/>
  <fog attach="fog" args={['#08121D',9,28]}/>
  <ambientLight intensity={.55}/>
  <hemisphereLight args={['#9BBCCB','#07111C',1.5]}/>
  <directionalLight position={[-5,9,5]} intensity={3.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
  <pointLight position={[3,3,-2]} intensity={25} color="#FF8A36" distance={14}/>
  <pointLight position={[-3,2,3]} intensity={23} color="#4CAFCB" distance={13}/>
  {variant==='road'?<RoadStub frame={frame}/>:variant==='charge'?<EngineStub frame={frame}/>:<StubTurbo frame={frame}/>}
  <CameraDirector frame={frame} shot={shot} durationInFrames={duration}/>
 </>;
};
/** Preview-only compositions; real production Root.tsx deliberately unchanged. */
export const CinematicsPreview:React.FC<{variant:Variant}>=({variant})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:'#08121D',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:true,preserveDrawingBuffer:true}} camera={{position:[0,1,5],fov:36,near:.08,far:120}}>
   <PreviewWorld frame={frame} variant={variant}/>
  </ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(2,7,12,.24),transparent 25%,transparent 78%,rgba(2,7,12,.35))'}}/>
  <SceneLabels frame={frame} variant={variant}/>
 </AbsoluteFill>;
};