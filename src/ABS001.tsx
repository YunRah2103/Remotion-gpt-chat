import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// AUTOMOTIVE ENGINEERING 001 / ABS. This is an independent original Remotion + Three.js 3D composition.
// All camera, wheel, valve, piston, pump and pressure states are deterministic functions of frame.
// Representative two-solenoid return-pump ABS circuit. No claim that ABS always shortens stopping distances.
const C={steel:'#bac9d0',dark:'#142330',rubber:'#101419',rotor:'#9eaeb3',cyan:'#61e0ed',amber:'#ffad66',red:'#d35243',green:'#68edb5'};
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(n:number)=>{const v=clamp(n);return v*v*(3-2*v)};
const stageAt=(f:number)=>f<120?0:f<240?1:f<360?2:f<600?3:4;
const start=[0,120,240,360,600], end=[120,240,360,600,750];
const MeshMat:React.FC<{c:string;metal?:number;rough?:number;opacity?:number}>=({c,metal=.65,rough=.32,opacity=1})=><meshPhysicalMaterial color={c} metalness={metal} roughness={rough} transparent={opacity<1} opacity={opacity} side={THREE.DoubleSide}/>;
const Pipe:React.FC<{pts:[number,number,number][];c:string;r?:number}>=({pts,c,r=.08})=>{
 const geo=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),64,r,10,false),[pts]);
 return <mesh geometry={geo}><MeshMat c={c} metal={.3}/></mesh>;
};
const Box:React.FC<{p?:[number,number,number];s:[number,number,number];c:string;opacity?:number}>=({p=[0,0,0],s,c,opacity=1})=><mesh position={p} castShadow receiveShadow><boxGeometry args={s}/><MeshMat c={c} opacity={opacity}/></mesh>;
const Cyl:React.FC<{p?:[number,number,number];r:number;h:number;c:string;axis?:'x'|'y'|'z'}>=({p=[0,0,0],r,h,c,axis='x'})=><mesh position={p} rotation={axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:[0,0,0]} castShadow><cylinderGeometry args={[r,r,h,48]}/><MeshMat c={c}/></mesh>;
const Ring:React.FC<{p?:[number,number,number];r:number;t:number;c:string}>=({p=[0,0,0],r,t,c})=><mesh position={p} rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[r,t,12,64]}/><MeshMat c={c}/></mesh>;
const Wheel:React.FC<{p:[number,number,number];scale?:number;angle:number;steer?:number;showSensor?:boolean;pressure?:number}>=({p,scale=1,angle,steer=0,showSensor=true,pressure=.7})=>(
 <group position={p} scale={scale} rotation={[0,steer,0]}>
  <group rotation={[angle,0,0]}>
   <Cyl r={.73} h={.36} c={C.rubber}/>
   {[-.19,-.05,.08,.19].map((x,i)=><Ring key={i} p={[x,0,0]} r={.77} t={.115} c={C.rubber}/>)}
   {Array.from({length:30},(_,i)=>{const a=i*Math.PI*2/30;return <group key={i} rotation={[a,0,0]}><Box p={[.01,.83,0]} s={[.34,.025,.1]} c="#2e3439"/></group>})}
   <Ring p={[.25,0,0]} r={.53} t={.05} c={C.steel}/>
   <Cyl p={[.30,0,0]} r={.21} h={.09} c="#9ea9ad"/>
   {Array.from({length:10},(_,i)=><group rotation={[i*Math.PI/5,0,0]} key={i}><Box p={[.31,.33,0]} s={[.07,.39,.074]} c="#adb9bd"/><Cyl p={[.37,.20,0]} r={.026} h={.038} c="#293137"/></group>)}
   <Cyl p={[-.16,0,0]} r={.60} h={.044} c="#83959c"/>
   <Ring p={[-.20,0,0]} r={.54} t={.018} c="#d1d8d8"/>
   {Array.from({length:32},(_,i)=>{const a=i*Math.PI*2/32;return <group key={i} rotation={[a,0,0]}><Cyl p={[-.22,.49,0]} r={.014} h={.017} c="#17242b"/></group>})}
   {showSensor&&<>
    <Ring p={[-.29,0,0]} r={.29} t={.016} c="#d19c5c"/>
    {Array.from({length:44},(_,i)=><group key={i} rotation={[i*Math.PI*2/44,0,0]}><Box p={[-.30,.304,0]} s={[.025,.038,.035]} c="#d6a65e"/></group>)}
   </>}
  </group>
  <group>
   <Box p={[-.23,.35,-.37]} s={[.18,.38,.37]} c={C.red}/>
   <Box p={[.10,.35,-.37]} s={[.14,.38,.37]} c={C.red}/>
   <Box p={[-.07,.56,-.37]} s={[.46,.10,.31]} c="#db6d55"/>
   <Box p={[-.13+.048*pressure,.35,-.37]} s={[.04,.25,.27]} c="#263339"/>
   <Box p={[.02-.048*pressure,.35,-.37]} s={[.04,.25,.27]} c="#263339"/>
   <Cyl p={[-.08,.34,-.37]} r={.11} h={.21} c="#8b9da5"/>
   {showSensor&&<><Box p={[-.34,.28,.22]} s={[.13,.12,.12]} c={C.cyan}/><Pipe pts={[[-.34,.28,.22],[-.60,.38,.25],[-.79,.50,.32]]} c="#4ea1ab" r={.02}/></>}
  </group>
 </group>
);
const Floor:React.FC<{f:number}>=({f})=><group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.97,0]} receiveShadow><planeGeometry args={[40,90]}/><meshStandardMaterial color="#26323a" roughness={.85}/></mesh>
 {Array.from({length:22},(_,i)=><Box key={i} p={[2.0,-.962,((i*1.8+f*.15+16)%37)-18]} s={[.06,.012,.85]} c="#9eb8b8"/>)}
 </group>;
const SensorWorld:React.FC<{f:number}>=({f})=>{
 const n=f-240;
 return <group>
  <Wheel p={[-1.05,-.05,0]} scale={.83} angle={-n*.14}/>
  <Box p={[1.55,.02,0]} s={[.25,1.8,1.45]} c="#1c5354"/>
  <Box p={[1.73,.02,0]} s={[.16,.60,.59]} c="#26343b"/>
  {Array.from({length:10},(_,i)=><Box key={i} p={[1.83,-.61+i*.135,i%2?.45:-.45]} s={[.04,.04,.23]} c="#d5b567"/>)}
  <Pipe pts={[[-1.25,.32,.36],[-.45,.67,.42],[.35,.72,.42],[.91,.45,.42],[1.43,.42,.42]]} c={C.cyan} r={.025}/>
  {Array.from({length:9},(_,i)=>{const t=((n*.025-i*.13)%1+1)%1;return <mesh key={i} position={[-.6+2.05*t,.62-.19*t,.45]}><sphereGeometry args={[.05,10,8]}/><meshBasicMaterial color={C.cyan}/></mesh>})}
 </group>;
};
const modeAt=(f:number)=>{
 const c=((f-360)%117)/117;
 if(c<.22)return {mode:'APPLY',pressure:.35+.65*c/.22,inlet:true,outlet:false};
 if(c<.47)return {mode:'REDUCE',pressure:1-.8*(c-.22)/.25,inlet:false,outlet:true};
 if(c<.63)return {mode:'HOLD',pressure:.2,inlet:false,outlet:false};
 return {mode:'REAPPLY',pressure:.2+.65*(c-.63)/.37,inlet:true,outlet:false};
};
const Valve:React.FC<{x:number;open:boolean;c:string}>=({x,open,c})=><group position={[x,0,.12]}>
  <Cyl p={[0,.32,0]} r={.30} h={.73} c="#242f37" axis="y"/>
  {Array.from({length:6},(_,i)=><mesh key={i} position={[0,-.05+i*.11,.04]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.26,.025,8,42]}/><MeshMat c="#c98248"/></mesh>)}
  <Cyl p={[0,-.32,0]} r={.077} h={1.05} c="#cfdddf" axis="y"/>
  <mesh position={[0,-.78,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.17,.032,8,40]}/><MeshMat c="#e3eef0"/></mesh>
  <Cyl p={[0,open?-.56:-.80,0]} r={.15} h={.16} c={c} axis="y"/>
 </group>;
const Hydraulic:React.FC<{f:number}>=({f})=>{
 const {inlet,outlet,pressure}=modeAt(f),n=f-360;
 return <group>
  <Box p={[0,-.2,-.52]} s={[4.7,2.46,.81]} c="#536874" opacity={.36}/>
  {[-1.75,-.6,.6,1.75].map(x=><Cyl key={x} p={[x,1.06,-.36]} r={.105} h={.39} c="#c1cdd1" axis="y"/>)}
  <Valve x={-.92} open={inlet} c={C.cyan}/><Valve x={.88} open={outlet} c={C.amber}/>
  <Cyl p={[-3.56,.12,0]} r={.28} h={1.2} c="#aebdc2"/>
  <Cyl p={[-4.08+.16*ease(n/30),.12,0]} r={.22} h={.18} c="#dce9e8"/>
  <Cyl p={[3.3,.10,0]} r={.35} h={.36} c="#b6c5c8"/>
  <Cyl p={[3.52+.12*pressure,.10,0]} r={.25} h={.13} c="#59b3d1"/>
  <Box p={[3.95,.10,-.22]} s={[.15,.6,.28]} c={C.red}/>
  <Box p={[4.18,.10,-.22]} s={[.15,.6,.28]} c={C.red}/>
  <Pipe pts={[[-3,.12,.05],[-2.12,.12,.05],[-.92,.12,.05],[0,.12,.05],[2.25,.12,.05],[3.32,.12,.05]]} c="#6acbff" r={.10}/>
  <Pipe pts={[[.88,-.72,.17],[1.35,-1.40,.17],[2.24,-1.42,.17],[2.45,-1.66,.17],[.05,-1.71,.17],[-.92,-.77,.17]]} c="#f5a453" r={.078}/>
  <Cyl p={[2.27,-1.30,.18]} r={.34} h={.66} c="#808c90" axis="y"/>
  <Cyl p={[.62,-1.96,.25]} r={.45} h={.32} c="#a8b8bb"/>
  <group position={[.86,-1.94,.48]} rotation={[n*.20,0,0]}>{Array.from({length:6},(_,i)=><group key={i} rotation={[i*Math.PI/3,0,0]}><Box p={[0,.22,0]} s={[.08,.31,.09]} c="#d4e2e1"/></group>)}</group>
  <Box p={[0,1.68,-.30]} s={[1.4,.73,.5]} c="#213841"/>
  <Box p={[0,1.71,-.01]} s={[.53,.3,.19]} c="#415967"/>
  <Pipe pts={[[0,1.35,.05],[-.92,.91,.08]]} c={C.cyan} r={.027}/>
  <Pipe pts={[[0,1.35,.05],[.88,.91,.08]]} c={C.cyan} r={.027}/>
  {Array.from({length:9},(_,i)=>{const t=((n*.019+i*.111)%1);return <mesh key={i} position={[-2.8+6.05*t,.13,.14]} visible={inlet}><sphereGeometry args={[.052,9,8]}/><meshBasicMaterial color="#b4eeff"/></mesh>})}
  {Array.from({length:7},(_,i)=>{const t=((n*.015+i*.144)%1);return <mesh key={i} position={[.88+1.5*Math.sin(Math.PI*t),-.75-.86*t,.2]} visible={outlet}><sphereGeometry args={[.052,9,8]}/><meshBasicMaterial color="#ffcb80"/></mesh>})}
 </group>;
};
const Director:React.FC<{f:number;stage:number}>=({f,stage})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const target:[number,number,number]=stage===3?[.0,-.17,0]:stage===2?[.30,0,0]:[0,-.1,0];
  const cameraPos:[number,number,number]=stage===3?[3.9,2.65,14.1]:stage===2?[3.6,2.1,10.8]:stage===0?[3.5,1.8,7.5]:[2.7,2.1,9.9];
  const drift=Math.sin((f-start[stage])/110)*.12;
  camera.position.set(cameraPos[0]+drift,cameraPos[1],cameraPos[2]);camera.lookAt(...target);camera.updateProjectionMatrix();
 },[camera,f,stage]);return null;
};
const World:React.FC<{f:number;stage:number}>=({f,stage})=>{
 const t=f-start[stage],m=stage===3?modeAt(f):null;
 return <>
  <color attach="background" args={['#0b1722']}/>
  <ambientLight intensity={.7}/><hemisphereLight args={['#d7eef4','#101c24',2.0]}/>
  <directionalLight position={[-5,8,7]} intensity={3} castShadow/>
  <spotLight position={[5,4,5]} color="#72e8f3" intensity={32} angle={.55}/>
  <Director f={f} stage={stage}/>
  {(stage===0||stage===1||stage===4)&&<Floor f={f}/>}
  {stage===0&&<Wheel p={[0,0,0]} angle={-(Math.min(t,75)*.20+Math.max(0,t-75)*.20*(1-clamp((t-75)/20)))} pressure={ease((t-43)/34)}/>}
  {stage===1&&<><Wheel p={[-.93,-.36,0]} scale={.62} angle={-t*.20}/><Wheel p={[.94,-.36,0]} scale={.62} angle={0}/></>}
  {stage===2&&<SensorWorld f={f}/>}
  {stage===3&&<Hydraulic f={f}/>}
  {stage===4&&<><Wheel p={[-.93,-.34,0]} scale={.65} angle={0}/><Wheel p={[.94,-.34,0]} scale={.65} angle={-t*.16} steer={.17*ease((t-42)/80)} pressure={.4+.4*Math.sin(t*.12)}/></>}
 </>;
};
const chapters=['01 / THE PROBLEM','02 / LOCKUP','03 / SENSOR','04 / HYDRAULICS','05 / STEERING'];
const titles=['WHAT DOES ABS ACTUALLY DO?','A SKIDDING TYRE CAN\'T STEER','THE SENSOR DETECTS DECELERATION','REDUCE. HOLD. REAPPLY.','ABS HELPS YOU STEER WHILE BRAKING.'];
const captions=[
 [0,60,'When you slam on the brakes,'],[60,138,'a wheel can stop spinning while the car is still moving.'],
 [138,198,'This is called wheel lockup,'],[198,258,'and it makes steering much harder.'],
 [258,300,'ABS uses sensors'],[300,378,'to monitor each wheel\'s speed.'],
 [378,435,'If a wheel is about to lock,'],[435,576,'the system rapidly reduces and reapplies brake pressure.'],
 [576,648,'This helps the wheels keep rolling,'],[648,750,'allowing you to steer during emergency braking.']
] as [number,number,string][];
export const ABS001:React.FC=()=>{
 const frame=useCurrentFrame();const {width,height}=useVideoConfig();const stage=stageAt(frame);const mode=modeAt(frame);
 const caption=captions.find(([a,b])=>frame>=a&&frame<b)?.[2]||'';
 const l=frame-start[stage], fade=Math.min(ease(l/14),ease((end[stage]-frame)/14));
 return <AbsoluteFill style={{background:'#09141d',color:'#eff6f7',fontFamily:'Arial,Helvetica,sans-serif',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[3.5,2.4,10],fov:stage===3?35:stage===0?30:34,near:.1,far:120}} gl={{antialias:true,preserveDrawingBuffer:true}}><World f={frame} stage={stage}/></ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(4,14,25,.95) 0%,rgba(4,14,25,.76) 22%,transparent 36%,transparent 68%,rgba(4,14,25,.76) 82%,rgba(4,14,25,.95) 100%)'}}/>
  <div style={{position:'absolute',top:80,left:65,right:65,display:'flex',justifyContent:'space-between',fontSize:23,fontWeight:800,letterSpacing:4,color:'#92dee1'}}><span>AUTOMOTIVE ENGINEERING / 001</span><span>ABS / 3D</span></div>
  <div style={{position:'absolute',left:66,top:165,right:65,opacity:fade}}>
   <div style={{fontSize:22,letterSpacing:5,color:'#8ad7d8',fontWeight:700}}>{chapters[stage]}</div>
   <div style={{marginTop:25,fontSize:stage===4?71:76,fontWeight:900,lineHeight:1.08,textShadow:'0 4px 20px #000a'}}>{titles[stage]}</div>
  </div>
  {stage===1&&<div style={{position:'absolute',top:1360,left:110,right:110,display:'flex',justifyContent:'space-between',fontSize:27,fontWeight:800}}><span style={{color:'#85edc5'}}>ROLLING</span><span style={{color:'#faba82'}}>LOCKED / SKIDDING</span></div>}
  {stage===2&&<div style={{position:'absolute',top:1330,left:100,right:100,display:'flex',justifyContent:'space-between',fontSize:23,letterSpacing:1,fontWeight:800}}><span style={{color:'#f8bd79'}}>ENCODER TARGET</span><span style={{color:'#8ceef2'}}>ABS CONTROLLER</span></div>}
  {stage===3&&<div style={{position:'absolute',top:1330,left:75,right:75,fontSize:25,fontWeight:800}}>
   <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#82e8f1'}}>INLET: {mode.inlet?'OPEN':'CLOSED'}</span><span style={{color:'#fdb77a'}}>OUTLET: {mode.outlet?'OPEN':'CLOSED'}</span><span>{mode.mode}</span></div>
   <div style={{background:'#29414d',height:15,borderRadius:8,marginTop:30,overflow:'hidden'}}><div style={{background:'#77caec',height:'100%',width:`${mode.pressure*100}%`}}/></div>
   <div style={{fontSize:17,letterSpacing:3,color:'#c6dae0',textAlign:'right',marginTop:9}}>CALIPER PRESSURE</div>
  </div>}
  {stage===4&&<div style={{position:'absolute',top:1350,left:120,right:120,display:'flex',justifyContent:'space-between',fontSize:30,fontWeight:800}}><span style={{color:'#f2ac82'}}>NO ABS</span><span style={{color:'#79eab3'}}>WITH ABS ↷</span></div>}
  <div style={{position:'absolute',bottom:204,left:70,right:70,fontWeight:700,lineHeight:1.32,fontSize:39,textAlign:'center',textShadow:'0 3px 10px black'}}>{caption}</div>
  <div style={{position:'absolute',bottom:120,left:70,right:70,height:3,background:'#8297a355'}}><div style={{width:`${frame/749*100}%`,height:3,background:'#7fe9e8'}}/></div>
  <div style={{position:'absolute',left:70,right:70,bottom:69,fontSize:18,letterSpacing:3,fontWeight:800,color:'#bed3d5',display:'flex',justifyContent:'space-between'}}><span>ABS MODULATES BRAKE PRESSURE</span><span>{String(Math.floor(frame/30)).padStart(2,'0')} / 25</span></div>
 </AbsoluteFill>;
};
