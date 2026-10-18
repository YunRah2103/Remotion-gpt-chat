/** A2 native integration proof: imports unmodified A1 source pinned/staged by CI.
 * No engineering code is vendored or edited on Agent 2's branch. */
import React from 'react';
import * as T from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment,WorldLighting,CameraAim} from '../../world-kit/components.tsx';
import {sampleRoute} from '../../world-kit/environments.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {BRAKING_EP001,wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState} from '../contracts.ts';
import {sampleBrakingSimulation} from './simulation.ts';
import {physicsVisualSignals} from './visual-signals.ts';
import {mapFilmFrameToSimulationSec,mapAbsInsertFrameToSimulationSec} from './timeline.ts';
// @ts-ignore A1 source is staged from a pinned peer SHA at render time.
import {BrakingVehicle} from '../engineering/BrakingVehicle.tsx';

const anchors=wheelAnchors(vehicleSpec(BRAKING_EP001.vehicleVariant));
const front=anchors.find(a=>a.id==='front-left');
if(!front)throw new Error('Missing kit front-left wheel');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const u=clamp(v);return u*u*(3-2*u);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const world=(p:readonly number[],yaw:number,x:number,y:number,z:number):[number,number,number]=>
 [p[0]+Math.cos(yaw)*x+Math.sin(yaw)*z,y,p[2]-Math.sin(yaw)*x+Math.cos(yaw)*z];

/** Contact patch, strut response and restrained vectors are explanatory only.
 * Contact length and spring compression are illustrative, not measured rates. */
const LoadedTyres:React.FC<{s:BrakingSimulationState;cutaway:number}>=({s,cutaway})=>{
 const cue=physicsVisualSignals(s);
 const compress=cue.illustrativeSpringCompressionM;
 return <group>
  {anchors.map(a=><group key={a.id}>
    {/* Soft ellipse remains planted on the road, not a floating vector diagram. */}
    <mesh position={[a.center[0]-.025,.023,a.center[2]]} rotation={[-Math.PI/2,0,0]}
      scale={[a.axle==='front'?cue.illustrativeContactLengthM:.18,.165,1]}>
      <circleGeometry args={[.5,40]}/>
      <meshBasicMaterial color={a.id==='front-left'?'#8dcbd1':'#98b4b7'}
        transparent opacity={a.id==='front-left'?.055+cue.illustrativeContactOpacity:.052}
        depthWrite={false} side={T.DoubleSide}/>
    </mesh>
  </group>)}
  {/* Film-only physical-length strut response, mounted behind A1 near-side rotor. */}
  <group position={[front.center[0]-.29,.57,front.center[2]-.29]}>
    <mesh position={[0,.08,0]}><cylinderGeometry args={[.023,.023,.40,16]}/>
      <meshStandardMaterial metalness={.86} roughness={.28} color="#94a9b0"/></mesh>
    <mesh position={[0,-.055+compress,0]}><cylinderGeometry args={[.04,.04,.12,16]}/>
      <meshStandardMaterial metalness={.82} roughness={.27} color="#536c77"/></mesh>
    <group position={[0,.095-compress/2,0]} scale={[1,1-compress/.28,1]}>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[0,(i-4)*.033,0]} rotation={[Math.PI/2,0,0]}>
       <torusGeometry args={[.053,.007,8,24]}/>
       <meshStandardMaterial metalness={.8} roughness={.32} color="#c9a16e"/>
      </mesh>)}
    </group>
    <mesh position={[0,.26-compress,0]}><cylinderGeometry args={[.08,.08,.025,18]}/>
     <meshStandardMaterial color="#2e3a40" metalness={.5} roughness={.43}/></mesh>
  </group>
  {cutaway>.4&&cue.illustrativeGripStreakM>.005&&<group
    position={[front.center[0]-.16,.028,front.center[2]+.12]}>
    {/* Three restrained ground streaks follow force magnitude and point -X.
        These cues vanish as the car reaches rest; they are not data arrows. */}
    {Array.from({length:3},(_,i)=><mesh key={i}
       position={[-.075*i-cue.illustrativeGripStreakM*.24,0,.030*i]}
       rotation={[0,-.12,0]}>
      <boxGeometry args={[Math.max(.012,cue.illustrativeGripStreakM*(1-i*.21)),.006,.009]}/>
      <meshBasicMaterial color="#9ad9d8" transparent opacity={.43-i*.095}
        depthWrite={false}/>
    </mesh>)}
  </group>}
 </group>;
};
const Overlay:React.FC<{s:BrakingSimulationState;abs:boolean;progress:number;cutaway:boolean}>=({s,abs,progress,cutaway})=>{
 const cue=physicsVisualSignals(s);
 const plus=cue.frontLoadDeltaKN;
 const font:React.CSSProperties={fontFamily:'Arial,Helvetica,sans-serif',color:'#eef6f6'};
 return <div style={{position:'absolute',inset:0,pointerEvents:'none',...font}}>
  <div style={{position:'absolute',top:0,left:0,right:0,height:360,
    background:'linear-gradient(#0b1f2cde,transparent)'}}/>
  <div style={{position:'absolute',bottom:0,left:0,right:0,height:425,
    background:'linear-gradient(transparent,#071b27f0)'}}/>
  <div style={{position:'absolute',left:'7%',right:'5%',top:'7%'}}>
    <div style={{fontSize:20,fontWeight:800,letterSpacing:4,color:'#8edbdd'}}>YUNEX / ENGINEERING 001</div>
    <div style={{fontSize:51,fontWeight:900,letterSpacing:-1,lineHeight:1.05,marginTop:20}}>
      {abs?'WHEN GRIP DROPS':'200 KM/H TO ZERO'}
    </div>
    <div style={{fontSize:22,letterSpacing:1.5,color:'#e9bd81',marginTop:15}}>
      {abs?'ILLUSTRATIVE LOW-GRIP ABS / SEPARATE RUN':'DRY TRACK / NO ABS INTERVENTION'}
    </div>
  </div>
  {abs&&<div style={{position:'absolute',right:'7%',top:'32%',width:205,
    padding:'13px 15px',borderLeft:cue.absPressureRelease?'4px solid #eab875':'3px solid #90c2c7',
    background:'linear-gradient(90deg,#0b1e2acc,#0c223766)',
    boxShadow:cue.absPressureRelease?'0 0 22px #dba75c30':'none'}}>
    <div style={{fontSize:17,fontWeight:800,letterSpacing:2.1,color:'#add3d8'}}>
      HYDRAULIC CONTROL
    </div>
    <div style={{fontSize:24,fontWeight:900,marginTop:8,lineHeight:1.13,
      color:cue.absPressureRelease?'#ffd59e':'#e8f3f4'}}>
      {cue.absPressureRelease?'ABS / PRESSURE RELEASE':'WHEEL SLIP MONITORED'}
    </div>
    <div style={{background:'#8ca1a780',height:5,marginTop:14}}>
      <div style={{height:'100%',width:(cue.brakePressure01*100)+'%',
        background:cue.absPressureRelease?'#e9b877':'#9ad6d7'}}/>
    </div>
  </div>}
  <div style={{position:'absolute',left:'7%',right:'7%',bottom:87}}>
    <div style={{fontSize:19,fontWeight:700,letterSpacing:2.2,color:'#90dadd'}}>
      {cutaway?'SPINNING ROTOR / FIXED CALIPER':'FOUR TYRES / ONE STOP'}
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:16,marginTop:7}}>
      <div style={{fontSize:91,fontWeight:900,fontVariantNumeric:'tabular-nums',lineHeight:1}}>
        {String(Math.round(s.speedMps*3.6)).padStart(3,'0')}
      </div><div style={{fontSize:24}}>KM/H</div>
      <div style={{marginLeft:'auto',fontSize:20,fontWeight:800,maxWidth:186,
        textAlign:'right',color:cue.absPressureRelease?'#e9bd81':'#a9d8df'}}>
       {abs?(cue.absPressureRelease?'ABS / RELEASE':'LOW GRIP'):'FRONT AXLE LOADED'}
      </div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:20,letterSpacing:1,marginTop:21}}>
      <span>PRESSURE {Math.round(cue.brakePressure01*100)}%</span>
      <span>FRONT +{plus.toFixed(2)} kN</span>
      <span>SLIP {(cue.slipRatio*100).toFixed(0)}%</span>
    </div>
    <div style={{height:3,background:'#879faa77',marginTop:24}}>
      <div style={{height:3,width:(clamp(progress)*100)+'%',background:'#e0b881'}}/>
    </div>
    <div style={{fontSize:16,letterSpacing:1,opacity:.77,marginTop:15}}>
     {abs?'ILLUSTRATIVE GRIP TRANSIENT / NOT A SPEED RESET':
       'ILLUSTRATIVE PHYSICS / NOT A MEASURED STOPPING DISTANCE'}
    </div>
  </div>
 </div>;
};
const IntegratedFilm:React.FC<{abs:boolean}>=({abs})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),length=abs?145:150;
 const progress=clamp(frame/(length-1));
 const simSec=abs?mapAbsInsertFrameToSimulationSec(frame):mapFilmFrameToSimulationSec(frame*5);
 const s=sampleBrakingSimulation(simSec,abs?'low-grip-abs':'dry-track');
 const offset=abs?34:16,route=sampleRoute('track',s.traveledM+offset),yaw=route.yaw;
 // Dry camera starts as a confident hero three-quarter instead of a tiny car,
 // then travels smoothly to the front-left genuine A1 rotor.
 const zoom=abs?1:ease((progress-.10)/.78);
 const cutaway=abs?1:ease((progress-.22)/.28);
 const target=world(route.position,yaw,lerp(.1,front.center[0]-.02,zoom),
   lerp(.7,front.center[1]+.04,zoom),lerp(0,front.center[2],zoom));
 const camera=world(route.position,yaw,lerp(6.9,front.center[0]+.62,zoom)+Math.sin(progress*2.35)*.14,
   lerp(2.5,front.center[1]+.48,zoom),
   lerp(7.1,front.center[2]+1.43,zoom)+Math.sin(progress*1.4)*.07);
 return <AbsoluteFill style={{background:'#93b0bd'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[8,3,8],fov:52,near:.06,far:400}}>
    <WorldLighting timeOfDay="day" focus={route.position}/>
    <Environment kind="track" timeOfDay="day" seed={BRAKING_EP001.environmentSeed}/>
    {/* Cinematic warm machined-metal rake and restrained cool edge light. */}
    <directionalLight color="#ffddaf" intensity={1.05} position={[4,5,6]}/>
    <directionalLight color="#9dc5de" intensity={.58} position={[-3,2,-4]}/>
    <group position={route.position} rotation={[0,yaw,0]}>
      <group rotation={[0,0,-s.pitchRad]}>
        {/* Exactly one real A1 vehicle and four real A1 drilled brake rigs. */}
        <BrakingVehicle simulation={s} cutawayWheel={abs||cutaway>.1?'front-left':undefined}
          cutaway01={cutaway} heatIllustration01={Math.min(.1,s.brakeHeatJ/8000000)}/>
      </group>
      <LoadedTyres s={s} cutaway={cutaway}/>
    </group>
    <CameraAim position={camera} target={target} fov={lerp(46,43,zoom)}/>
  </ThreeCanvas>
  <Overlay s={s} abs={abs} progress={progress} cutaway={abs||cutaway>.4}/>
 </AbsoluteFill>;
};
/** Two explicitly different real simulations, not a reset inside one stop. */
export const PhysicsIntegratedAbsMacro:React.FC=()=> <IntegratedFilm abs/>;
export const PhysicsIntegratedDryTrack:React.FC=()=> <IntegratedFilm abs={false}/>;
