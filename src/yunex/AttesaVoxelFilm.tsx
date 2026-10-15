import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

/** YUNEX • GT-R R35 ATTESA E-TS • procedural, genuine 3D voxel art.
 * Narrator-aligned 814 frames @ 30fps. No vehicle meshes, images or licensed footage.
 * Keep any supplied voiceover as public/gtr-attesa/voiceover.mp3 and set withVoiceover=true.
 */
const MINT='#86ffd0', ORANGE='#ffb45d', INK='#06131e', SNOW='#eaf9f2';
const ease=(x:number)=>{const c=Math.max(0,Math.min(1,x));return c*c*(3-2*c);};
const rng=(a:number,b:number,x:number)=>a+(b-a)*ease(x);
const pieces=[0,151,344,617,814];
const stageOf=(f:number)=>f<pieces[1]?0:f<pieces[2]?1:f<pieces[3]?2:3;

type V3=[number,number,number];
const Block:React.FC<{at:V3;dim:V3;color:string;opacity?:number;glow?:number}>=({at,dim,color,opacity=1,glow=0})=>
 <mesh position={at} castShadow receiveShadow>
  <boxGeometry args={dim}/>
  <meshStandardMaterial color={color} roughness={.64} metalness={.14} transparent={opacity<1} opacity={opacity} emissive={color} emissiveIntensity={glow}/>
 </mesh>;

const VoxelWheel:React.FC<{s:number;z:number;f:number}>=({s,z,f})=>
 <group position={[s*1.32,.51,z]}>
  <group rotation={[f*.14,0,0]}>
   <mesh rotation={[0,0,Math.PI/2]} castShadow>
    <cylinderGeometry args={[.51,.51,.4,14]}/>
    <meshStandardMaterial color="#0a1019" roughness={.92}/>
   </mesh>
   <mesh position={[s*.225,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.4,.4,.055,12]}/>
    <meshStandardMaterial color="#334754" roughness={.5} metalness={.55}/>
   </mesh>
   <mesh position={[s*.27,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.3,.3,.06,12]}/>
    <meshStandardMaterial color="#a0c9c2" roughness={.3} metalness={.75}/>
   </mesh>
   {Array.from({length:10},(_,i)=>{const a=i*Math.PI*2/10;return <Block key={i}
      at={[s*.33,Math.cos(a)*.19,Math.sin(a)*.19]}
      dim={[.05,.07,.27]} color="#d3eae6"/>;})}
   <mesh position={[s*.37,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.075,.075,.065,12]}/>
    <meshStandardMaterial color="#203b4d" metalness={.7}/>
   </mesh>
  </group>
 </group>;

const CarVoxel:React.FC<{f:number;stage:number}>=({f,stage})=>{
 const shell=stage===0?1:stage===1?rng(1,.13,(f-150)/36):stage===2?.15:rng(.15,1,(f-617)/43);
 const internal=stage===0?.08:stage===3?rng(1,.11,(f-617)/56):1;
 const front=ease((f-416)/55);
 return <group position={[0,stage===0||stage===3?.018*Math.sin(f/11):0,0]}>
  <group>
   <Block at={[0,.80,0]} dim={[2.54,.46,5.72]} color="#386e81" opacity={shell}/>
   <Block at={[0,.72,-2.84]} dim={[2.40,.4,.62]} color="#29586a" opacity={shell}/>
   <Block at={[0,.70,2.86]} dim={[2.38,.41,.62]} color="#168d80" opacity={shell}/>
   <Block at={[0,.98,-1.91]} dim={[2.31,.28,1.72]} color="#579ea9" opacity={shell}/>
   <Block at={[0,.97,2.08]} dim={[2.34,.27,1.31]} color="#366e83" opacity={shell}/>
   <Block at={[0,1.20,-.28]} dim={[1.90,.46,2.67]} color="#163d4d" opacity={shell}/>
   <Block at={[0,1.53,-.26]} dim={[1.73,.21,1.84]} color="#77aeb0" opacity={shell}/>
   <Block at={[0,1.63,-.26]} dim={[1.35,.055,1.42]} color="#a6d9d3" opacity={shell}/>
   {[-1,1].map(s=><React.Fragment key={s}>
    <Block at={[s*.97,1.27,-.20]} dim={[.13,.42,2.11]} color="#4f98a5" opacity={shell}/>
    <Block at={[s*.90,1.04,-3.17]} dim={[.54,.15,.13]} color="#e2fff4" opacity={shell} glow={.6}/>
    <Block at={[s*.91,.96,3.17]} dim={[.54,.16,.13]} color="#fe5867" opacity={shell} glow={.3}/>
    <Block at={[s*1.24,1.07,-.77]} dim={[.3,.16,.28]} color="#579eaa" opacity={shell}/>
    <Block at={[s*.76,1.14,-.5]} dim={[.13,.20,1.23]} color="#0c2d38" opacity={shell}/>
    {Array.from({length:10},(_,j)=>j===1||j===2||j===8?null:<Block key={j} at={[s*1.28,.77,-2.2+j*.48]} dim={[.06,.19,.33]} color={j%2?'#209d8c':'#2bc7ac'} opacity={shell}/>)}
    <Block at={[s*.78,1.22,2.58]} dim={[.11,.45,.13]} color="#152734" opacity={shell}/>
   </React.Fragment>)}
   <Block at={[0,1.5,2.58]} dim={[2.40,.13,.48]} color="#142a34" opacity={shell}/>
   <Block at={[0,.79,-3.19]} dim={[1.42,.20,.09]} color="#091820" opacity={shell}/>
   <Block at={[0,.87,-3.235]} dim={[.17,.14,.035]} color="#ec4c55" opacity={shell}/>
   {/* GT-R front grille, pixel headlights, asymmetric bonnet vents, signature quad tail lamps */}
   <Block at={[0,.70,-3.12]} dim={[1.35,.38,.09]} color="#071522" opacity={shell}/>
   {Array.from({length:11},(_,i)=><Block key={'g'+i} at={[(i-5)*.105,.67,-3.173]}
      dim={[.052,.20,.014]} color="#294c5c" opacity={shell}/>)}
   {[-1,1].map(side=><React.Fragment key={'detail'+side}>
    {Array.from({length:6},(_,i)=><Block key={'lamp'+i}
      at={[side*(.68+i*.076),1.04,-3.10-i*.008]}
      dim={[.105,.063,.065]} color="#e7fff8" glow={.7} opacity={shell}/>)}
    {Array.from({length:4},(_,i)=><Block key={'vent'+i}
      at={[side*(.46+i*.11),1.12,-2.19]}
      dim={[.055,.021,.27]} color="#0c4451" opacity={shell}/>)}
    {[.64,1.01].map(x=><mesh key={'tail'+x} position={[side*x,1.04,3.087]}
        rotation={[Math.PI/2,0,0]}>
      <cylinderGeometry args={[.115,.115,.043,12]}/>
      <meshStandardMaterial color="#ff455c" emissive="#ff304e" emissiveIntensity={1.2}
        transparent opacity={shell}/>
    </mesh>)}
   </React.Fragment>)}
  </group>
  {[-1,1].flatMap(s=>[-1.86,1.88].map(z=><VoxelWheel key={s+':'+z} s={s} z={z} f={f}/>))}
  <group>
   {/* ATTESA E-TS layout simplified deliberately: transaxle/rear drive path,
       multi-plate clutch routes adjustable torque to front axle. */}
   <Block at={[0,.44,-1.28]} dim={[1.16,.34,1.20]} color="#607784" opacity={internal}/>
   <Block at={[0,.36,0]} dim={[.22,.17,4.34]} color={ORANGE} opacity={internal} glow={.25}/>
   {/* Separate forward drive path from electronically controlled rear transfer coupling. */}
   <Block at={[.47,.27,0]} dim={[.13,.13,3.87]} color={MINT} opacity={internal*front} glow={.5}/>
   <Block at={[0,.45,1.89]} dim={[1.7,.28,.40]} color={ORANGE} opacity={internal} glow={.25}/>
   <Block at={[0,.45,-1.85]} dim={[1.65,.28,.40]} color="#45c5c9" opacity={internal} glow={front*.6}/>
   {[-1,1].map(s=><React.Fragment key={s}>
    <Block at={[s*.75,.44,1.88]} dim={[.95,.11,.15]} color={ORANGE} opacity={internal} glow={.28}/>
    <Block at={[s*.75,.44,-1.85]} dim={[.94,.11,.15]} color={MINT} opacity={internal*front} glow={.4}/>
   </React.Fragment>)}
   {stage===1||stage===2?Array.from({length:26},(_,i)=>{
    const rear=i<13; const u=((i%13)/13+f*(rear?.019:.016))%1;
    const z=rear?-1.45+3.34*u:1.84-3.70*u;
    return <Block key={i} at={[rear?Math.sin(i*2)*.075:.47+Math.sin(i*2)*.028,.29,z]} dim={[.13,.13,.13]} color={rear?ORANGE:MINT} opacity={rear?1:front} glow={1.7}/>;
   }):null}
  </group>
 </group>;
};

const Road:React.FC<{f:number}>=({f})=>{
 return <group>
  <Block at={[0,-.14,0]} dim={[14,.15,130]} color="#132535"/>
  {[-1,1].map(s=><React.Fragment key={s}>
   <Block at={[s*4.30,-.035,0]} dim={[.12,.03,130]} color="#3abf9a" glow={.7}/>
   {Array.from({length:15},(_,i)=><Block key={i} at={[s*4.78,.012,((i*9+f*.24+68)%128)-64]} dim={[.48,.03,.94]} color="#164455"/>)}
  </React.Fragment>)}
  {Array.from({length:19},(_,i)=><Block key={i} at={[0,-.03,((i*7+f*.32+68)%136)-68]} dim={[.07,.027,1.65]} color="#56727c"/>)}
  {Array.from({length:21},(_,i)=>{
   const s=i%2?1:-1;const h=2+(i*13%8);
   return <Block key={i} at={[s*(9+i%4),h/2,((i*19+f*.11+55)%124)-63]} dim={[1.8+(i%3)*.6,h,2.8]} color={i%3?'#102d3d':'#174254'}/>;
  })}
 </group>;
};

const shots=[0,88,155,249,345,433,524,615,715,814];
const shotOf=(f:number)=>shots.findIndex((_,i)=>i<shots.length-1&&f>=shots[i]&&f<shots[i+1]);
const CameraDirector:React.FC<{f:number;stage:number}>=({f})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const shot=Math.max(0,shotOf(f));
  const start=shots[shot];const end=shots[shot+1];
  const a=ease((f-start)/Math.max(1,end-start));
  const viewpoints:Array<[V3,V3,number]>= [
   [[3.3,2.4,-8.8],[2.7,1.9,-8.4],39],
   [[-5,2.3,6.1],[-4.4,2.9,7.8],39],
   [[3.5,8.9,-4.2],[1.5,11.4,-2.7],41],
   [[1.5,11,3],[.2,12,2],41],
   [[-2.3,10.9,4.1],[-.7,11.8,2.1],41],
   [[2,10.9,3.4],[.7,12,-2.1],40],
   [[.4,12.2,-1.2],[1.3,11.4,-2.8],40],
   [[-4.8,2.8,-8.6],[2,2.3,-9.6],40],
   [[4.3,2.7,8.3],[3.2,4,9.1],40]
  ];
  const [aPos,bPos,fov]=viewpoints[shot];
  camera.position.set(rng(aPos[0],bPos[0],a),rng(aPos[1],bPos[1],a),rng(aPos[2],bPos[2],a));
  camera.lookAt(0,.65,shot>=2&&shot<=6?.45:0);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=fov;camera.updateProjectionMatrix();}
 },[camera,f]);
 return null;
};

const captions=[
 [0,152,'THE SECRET TO GT-R ACCELERATION'],
 [152,232,'UNLIKE MOST AWD CARS'],
 [232,345,'POWER STARTS AT THE REAR'],
 [345,418,'WHEN GRIP GETS LOW'],
 [418,506,'ATTESA E-TS RESPONDS'],
 [506,617,'UP TO 50% TORQUE TO FRONT'],
 [617,652,'THE RESULT?'],
 [652,748,'THE FEEL OF REAR DRIVE'],
 [748,814,'THE GRIP OF ALL-WHEEL DRIVE'],
] as const;

const txtStyle:React.CSSProperties={fontFamily:'DejaVu Sans Mono, Consolas, monospace',fontWeight:900,letterSpacing:-2};
const Label:React.FC<{children:React.ReactNode;top:number;color?:string;size?:number}>=({children,top,color=SNOW,size=70})=>
 <div style={{position:'absolute',left:80,right:62,top,color,fontSize:size,lineHeight:1.08,...txtStyle,textShadow:'0 3px 0 #05131d,0 8px 22px #061018'}}>{children}</div>;

export const AttesaVoxelFilm:React.FC<{withVoiceover?:boolean}>=({withVoiceover=false})=>{
 const f=useCurrentFrame();const {width,height}=useVideoConfig();const stage=stageOf(f);
 const t=f/30; const torque=50*ease((f-416)/80); const shot=Math.max(0,shotOf(f));
 const sub=captions.find(c=>f>=c[0]&&f<c[1])?.[2]??'';
 return <AbsoluteFill style={{background:INK,color:SNOW,overflow:'hidden',fontFamily:'DejaVu Sans Mono, monospace'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[7,7,-10],fov:37,near:.1,far:160}} gl={{antialias:false,preserveDrawingBuffer:true}}>
   <CameraDirector f={f} stage={stage}/>
   <color attach="background" args={['#071522']}/>
   <ambientLight intensity={1.35}/>
   <hemisphereLight args={['#d7ffe9','#0a2035',2.2]}/>
   <directionalLight position={[-8,13,-7]} intensity={3.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
   <spotLight position={[6,8,5]} intensity={85} color="#35b9bb" angle={.66} penumbra={.8}/>
   {shot<=1||shot>=7?<Road f={f}/>:null}
   <CarVoxel f={f} stage={stage}/>
  </ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(3,12,20,.98) 0%,rgba(3,12,20,.93) 9%,rgba(3,12,20,0) 33%,rgba(3,12,20,0) 70%,rgba(3,12,20,.95) 83%,#030c13 100%)'}}/>
  <div style={{position:'absolute',left:80,right:76,top:88,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:31,fontWeight:900,letterSpacing:9}}>
   <span><span style={{color:MINT}}>▌</span> Y U N E X</span>
   <span style={{fontSize:23,letterSpacing:2,color:'#9fb9bc'}}>TECH / 001</span>
  </div>
  <div style={{position:'absolute',top:198,left:80,right:80,height:3,background:'#234851'}}>
   <div style={{height:3,width:(f/813*100)+'%',background:MINT}}/>
  </div>
  <div style={{position:'absolute',left:80,top:237,color:MINT,fontSize:27,fontWeight:800,letterSpacing:3}}>NISSAN GT-R  /  ATTESA E-TS</div>
  {shot===0?<><Label top={375}>THE HIDDEN</Label><Label top={470} color={MINT}>ADVANTAGE.</Label></>:null}
  {shot===1?<><Label top={375}>BUILT FOR</Label><Label top={470} color={MINT}>THE LAUNCH.</Label></>:null}
  {shot===2?<><Label top={375}>NOT YOUR</Label><Label top={470} color={MINT}>TYPICAL AWD.</Label></>:null}
  {shot===3?<><Label top={375}>REAR-FIRST</Label><Label top={470} color={ORANGE}>POWER.</Label></>:null}
  {shot===4?<><Label top={375}>GRIP</Label><Label top={470} color="#ff6b6b">DISAPPEARS.</Label></>:null}
  {shot===5?<><Label top={375}>ATTESA</Label><Label top={470} color={MINT}>WAKES UP.</Label></>:null}
  {shot===6?<><Label top={375} color={MINT}>UP TO 50%</Label><Label top={470} size={42}>FRONT-AXLE TORQUE</Label></>:null}
  {shot===7?<><Label top={375}>REAR-DRIVE</Label><Label top={470} color={MINT}>FEEL.</Label></>:null}
  {shot===8?<><Label top={375}>ALL-WHEEL</Label><Label top={470} color={MINT}>GRIP.</Label></>:null}
  {(stage===1||stage===2)?<div style={{position:'absolute',left:80,right:80,bottom:380,padding:'27px 28px 23px',background:'rgba(4,17,27,.93)',border:'2px solid #316d76'}}>
    <div style={{color:'#b7d1ce',fontSize:26,letterSpacing:3,fontWeight:800}}>ADAPTIVE TORQUE SPLIT</div>
    <div style={{height:31,marginTop:18,display:'flex',background:'#192d39'}}>
     <div style={{background:ORANGE,width:(100-torque)+'%'}}/>
     <div style={{background:MINT,width:torque+'%'}}/>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:26,fontWeight:900}}>
     <span style={{color:ORANGE}}>REAR {Math.round(100-torque)}%</span>
     <span style={{color:MINT}}>FRONT {Math.round(torque)}%</span>
    </div>
   </div>:null}
  <div style={{position:'absolute',left:80,right:80,bottom:161}}>
   <div style={{fontSize:35,fontWeight:900,letterSpacing:.2,lineHeight:1.2,textShadow:'0 4px 12px #000'}}>{sub}</div>
   <div style={{height:2,background:'#31515b',marginTop:24}}/>
   <div style={{display:'flex',justifyContent:'space-between',fontSize:23,fontWeight:800,color:'#8faeb3',marginTop:23}}>
    <span>R35 • ATTESA E-TS</span><span>{t.toFixed(1)} / 27.1</span>
   </div>
  </div>
  {withVoiceover?<Audio src={staticFile('gtr-attesa/voiceover.mp3')}/>:null}
 </AbsoluteFill>;
};
