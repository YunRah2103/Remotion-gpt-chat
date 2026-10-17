import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

/**
 * YUNEX — McLaren P1 airbrake / FULL 3D EXPERIMENT 001
 * All visuals are procedural 3D; no real footage, backgrounds, images or UI mockups.
 * Motion and cinematography authored frame-by-frame at 30fps for deterministic rendering.
 * Narration is muxed separately from the user's supplied audio (16.92s), keeping its original fidelity.
 */
type Vec = [number,number,number];
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const sm=(n:number)=>{const a=clamp(n);return a*a*(3-2*a);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const GOLD='#ffa63e', CYAN='#71f5fc', TEAL='#58b9c5', INK='#071321';
const PI=Math.PI;
const Box:React.FC<{p:Vec;s:Vec;c:string;metal?:number;rough?:number;glow?:number;opacity?:number;rot?:Vec}>=({p,s,c,metal=.05,rough=.48,glow=0,opacity=1,rot=[0,0,0]})=>
 <mesh position={p} rotation={rot} castShadow receiveShadow>
  <boxGeometry args={s}/>
  <meshStandardMaterial color={c} metalness={metal} roughness={rough} emissive={c} emissiveIntensity={glow} transparent={opacity<1} opacity={opacity} depthWrite={opacity>=1}/>
 </mesh>;

const createSkin=(rings:Vec[])=>{
 // Each ring describes longitudinal z, halfwidth x, roof y. Six perimeter points.
 const pos:number[]=[];const idx:number[]=[];const ringN=6;
 rings.forEach(([z,w,y])=>{
  const row:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[
   [-w*.91,.49,z],[-w,.70,z],[-w*.83,y,z],[w*.83,y,z],[w,.70,z],[w*.91,.49,z]];
  row.forEach(p=>pos.push(...p));
 });
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<ringN-1;j++){
  const a=i*ringN+j,b=a+ringN;idx.push(a,b,a+1,b,b+1,a+1);
 }
 for(let j=1;j<ringN-1;j++){idx.push(0,j+1,j);const n=(rings.length-1)*ringN;idx.push(n,n+j,n+j+1);}
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setIndex(idx);geo.computeVertexNormals();return geo;
};
const Skin:React.FC<{rings:Vec[];c:string;metal?:number;rough?:number;glass?:boolean}>=({rings,c,metal=.3,rough=.3,glass=false})=>{
 const geometry=useMemo(()=>createSkin(rings),[rings]);
 return <mesh geometry={geometry} castShadow={!glass} receiveShadow>
  <meshPhysicalMaterial color={c} metalness={metal} roughness={rough} clearcoat={glass ? .8 : 1} clearcoatRoughness={.18} side={THREE.DoubleSide} transparent={glass} opacity={glass ? .9 : 1}/>
 </mesh>;
};


const Intake:React.FC<{s:number}>=({s})=>{
 const geometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  const p=[s*1.037,.80,.13,s*1.052,1.04,.72,s*1.03,.58,1.59,
           s*1.04,.85,.25,s*1.05,.59,1.61,s*1.05,.60,1.88];
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.computeVertexNormals();return g;
 },[s]);
 return <mesh geometry={geometry} >
  <meshStandardMaterial color="#111d27" metalness={.50} roughness={.34} side={THREE.DoubleSide}/>
 </mesh>;
};

const bodyRings:Vec[]=[[-2.69,.37,.49],[-2.49,.67,.56],[-2.20,.91,.64],[-1.76,1.05,.80],[-1.16,1.06,.90],[-.56,1.04,1.00],[.30,1.07,1.03],[1.18,1.10,1.00],[1.85,1.08,.99],[2.35,.87,.84],[2.62,.69,.71]];
const canopyRings:Vec[]=[[-1.52,.34,1.06],[-1.14,.48,1.17],[-.74,.57,1.38],[-.10,.61,1.52],[.40,.60,1.51],[.89,.52,1.37],[1.36,.36,1.06]];

const Wheel:React.FC<{side:number;z:number;f:number}>=({side,z,f})=>
 <group position={[side*1.085,.51,z]}>
  <group rotation={[f*.31,0,0]}>
   <mesh rotation={[0,0,PI/2]} castShadow>
    <cylinderGeometry args={[.50,.50,.38,32]}/>
    <meshStandardMaterial color="#11151b" roughness={.94}/>
   </mesh>
   <mesh position={[side*.201,0,0]} rotation={[0,0,PI/2]}>
    <cylinderGeometry args={[.395,.395,.04,32]}/>
    <meshStandardMaterial color="#111b26" metalness={.8} roughness={.28}/>
   </mesh>
   <mesh position={[side*.23,0,0]} rotation={[0,0,PI/2]}>
    <torusGeometry args={[.36,.029,6,32]}/>
    <meshStandardMaterial color="#b9cad5" roughness={.29} metalness={.9}/>
   </mesh>
   {Array.from({length:10},(_,i)=>{
    const a=i*2*PI/10;
    return <Box key={i} p={[side*.236,Math.cos(a)*.19,Math.sin(a)*.19]}
      s={[.038,.066,.335]} c="#b7bdc8" metal={.92} rough={.22} rot={[a,0,0]}/>;
   })}
   <mesh position={[side*.252,0,0]} rotation={[0,0,PI/2]}>
    <cylinderGeometry args={[.095,.095,.05,20]}/>
    <meshStandardMaterial color="#f2ad43" metalness={.75}/>
   </mesh>
  </group>
  <Box p={[side*.10,0,0]} s={[.08,.21,.28]} c="#a5a8a9" metal={.8}/>
 </group>;

const Spoiler:React.FC<{f:number}>=({f})=>{
 const early=sm((f-2)/28);
 const later=sm((f-91)/27);
 // In the opening, start deployed; then retract and redeploy for the mechanism view.
 const act=f<68?early:f<98?1-sm((f-68)/27):later;
 const wingAngle=act*.88;
 return <group position={[0,1.05,2.06]}>
  {[-1,1].map(s=><React.Fragment key={s}>
   <Box p={[s*.58,.07,.1]} s={[.12,.36,.13]} c="#23232c" metal={.6}/>
   <mesh position={[s*.58,.26,.08]} rotation={[PI/2,0,0]}>
    <cylinderGeometry args={[.064,.064,.11,12]}/>
    <meshStandardMaterial color="#839ba8" metalness={.9} roughness={.25}/>
   </mesh>
  </React.Fragment>)}
  <group position={[0,.33,-.04]} rotation={[-wingAngle,0,0]}>
   <Box p={[0,0,0]} s={[2.01,.105,.49]} c="#222a33" metal={.58} rough={.24}/>
   <Box p={[0,.041,-.115]} s={[1.92,.025,.1]} c="#ffae50" metal={.7} rough={.22}/>
   {[-1,1].map(s=><Box key={s} p={[s*.99,.085,-.015]} s={[.045,.23,.47]} c="#151f29" metal={.6}/>)}
   <Box p={[0,-.065,.19]} s={[1.87,.026,.048]} c="#bcb1a0" metal={.8}/>
  </group>
 </group>;
};

const Supercar:React.FC<{f:number}>=({f})=>{
 const brake=sm((f-402)/27)*(1-sm((f-503)/20));
 return <group position={[0,.012*Math.sin(f*.17),0]}>
  <Box p={[0,.44,0]} s={[1.7,.23,4.7]} c="#101e25" metal={.6}/>
  <Skin rings={bodyRings} c="#f37c19" metal={.49} rough={.25}/>
  <Skin rings={canopyRings} c="#142c35" metal={.57} rough={.105} glass/>
  <Box p={[0,.94,-2.18]} s={[1.08,.024,.59]} c="#b84d1c" metal={.55}/>
  <Box p={[0,.82,2.50]} s={[1.1,.21,.19]} c="#1a242b" metal={.45}/>
  {[-1,1].map(s=><React.Fragment key={s}>
   <Wheel side={s} z={-1.63} f={f}/>
   <Wheel side={s} z={1.65} f={f}/>
   <Box p={[s*.97,.61,0]} s={[.15,.10,2.65]} c="#a74c1d" metal={.48}/>\n   <Box p={[s*.97,.53,0]} s={[.18,.06,2.20]} c="#101f29" metal={.55}/>
   <Intake s={s}/>
   <Box p={[s*.65,.81,-2.47]} s={[.42,.065,.18]} c="#f5ffed" glow={.9} rot={[0,s*.22,s*.42]}/>\n   <Box p={[s*.84,.72,-2.28]} s={[.13,.047,.34]} c="#e1fff4" glow={.8} rot={[0,0,s*.58]}/>
   <Box p={[s*.76,.84,2.59]} s={[.57,.095,.055]} c="#ff3b37" glow={brake*2.2+.5}/>
   <Box p={[s*.76,.89,-2.49]} s={[.43,.035,.06]} c="#d2f4ef" glow={1.4}/>
   <Box p={[s*.85,1.11,-.80]} s={[.18,.07,.23]} c="#f37c19" metal={.5}/>
   <Box p={[s*.57,1.48,.1]} s={[.045,.024,.72]} c="#4b8a97" metal={.6}/>
   <Box p={[s*.86,.57,1.91]} s={[.36,.08,.92]} c="#222a31" metal={.4}/>
  </React.Fragment>)}
  <Spoiler f={f}/>
  <Box p={[0,.52,-2.66]} s={[1.3,.19,.075]} c="#14232a" metal={.45}/>
  <Box p={[0,.49,2.66]} s={[1.49,.12,.075]} c="#182632" metal={.5}/>
  {[-1,1].map(s=><Box key={'pipe'+s} p={[s*.27,.45,2.72]} s={[.17,.095,.06]} c="#abb7bf" metal={.95}/>)}
 </group>;
};

const Building:React.FC<{x:number;z:number;h:number;tint:number}>=({x,z,h,tint})=>
 <group>
  <Box p={[x,h*.5-.05,z]} s={[1.55,h,1.7]} c={tint%3===0?'#0e3040':tint%3===1?'#163e4a':'#14303a'} rough={.9}/>
  {[.6,1.3,2.0].filter(y=>y<h).map((y,i)=><Box key={i} p={[x+(x>0?-.78:.78),y,z]} s={[.04,.07,1.25]} c="#70b5ae" glow={.15}/>)}
 </group>;
const World:React.FC<{f:number}>=({f})=>{
 const brake=sm((f-406)/42);
 const distance=(f*.52 - 70*brake);
 return <group>
  <Box p={[0,-.24,0]} s={[150,.38,150]} c="#193541" rough={.96}/>
  <Box p={[0,-.032,0]} s={[8,.05,150]} c="#263844" rough={.98}/>
  {[-1,1].map(s=><React.Fragment key={s}>
   <Box p={[s*3.66,.008,0]} s={[.08,.016,150]} c="#d0e4d6" glow={.16}/>
   <Box p={[s*4.44,.12,0]} s={[.38,.26,150]} c="#263e46" metal={.14}/>
   <Box p={[s*4.54,.43,0]} s={[.10,.11,150]} c="#6fa8a3" metal={.65}/>
   {Array.from({length:14},(_,i)=><Box key={i} p={[s*3.72,.008,((i*10+distance+75)%150)-75]} s={[.11,.02,2.8]} c="#e6e7d1" glow={.18}/>)}
  </React.Fragment>)}
  {Array.from({length:13},(_,i)=><Box key={i}
   p={[0,.005,((i*12+distance+75)%150)-75]} s={[.095,.015,2.45]} c="#c2cec6" glow={.12}/>)}
  {Array.from({length:40},(_,i)=>{
   const s=i%2?1:-1;
   const z=((i*10.6+distance*.47+75)%150)-75;
   return <Building key={i} x={s*(10+(i%4)*3)} z={z} h={2.8+(i*17%10)*.75} tint={i}/>;
  })}
  {Array.from({length:12},(_,i)=>{
    const z=((i*14+distance+84)%168)-84;
    return <group key={i} position={[0,0,z]}>
     {[-1,1].map(s=><group key={s}>
      <Box p={[s*5.15,1.8,0]} s={[.19,3.6,.21]} c="#466674" metal={.65}/>
      <Box p={[s*4.92,3.6,0]} s={[.65,.20,.54]} c="#adc8ba" glow={.46}/>
     </group>)}
    </group>;
  })}
  {f>=384&&f<515?<group position={[0,.02,-15]}>
   {Array.from({length:9},(_,i)=><Box key={i} p={[0,.035,-i*4]} s={[7.3,.06,.31]} c="#ebded0" glow={.3}/>)}
  </group>:null}
 </group>;
};

const Stream:React.FC<{idx:number;f:number}>=({idx,f})=>{
 const side=idx%2?1:-1, lane=Math.floor(idx/2), x=side*(.3+lane*.23);
 const points:THREE.Vector3[]=[
  new THREE.Vector3(x*.8,.75,-3.25),
  new THREE.Vector3(x,1.1,-1.8),
  new THREE.Vector3(x,1.42,.5),
  new THREE.Vector3(x,1.22,1.6),
  new THREE.Vector3(x,1.2,2.05),
  new THREE.Vector3(x*1.4,1.5,2.5),
  new THREE.Vector3(x*1.8,1.9,4.1)
 ];
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points),[idx]);
 const geo=useMemo(()=>new THREE.TubeGeometry(curve,48,.009,5,false),[curve]);
 const p=curve.getPoint((((f*.014+idx*.093)%1)+1)%1);
 return <group>
  <mesh geometry={geo}>
   <meshBasicMaterial color={CYAN} transparent opacity={.36} depthWrite={false}/>
  </mesh>
  <mesh position={[p.x,p.y,p.z]}>
   <sphereGeometry args={[.055,7,7]}/>
   <meshBasicMaterial color="#c0ffff" transparent opacity={.85}/>
  </mesh>
 </group>;
};
const ForceArrow:React.FC<{p:Vec;length:number;color:string;vertical?:boolean}>=({p,length,color,vertical=false})=>
 <group position={p} rotation={vertical?[0,0,PI]:[PI/2,0,0]}>
  <mesh position={[0,length*.43,0]}>
   <cylinderGeometry args={[.035,.035,length*.78,10]}/>
   <meshBasicMaterial color={color} transparent opacity={.77}/>
  </mesh>
  <mesh position={[0,length*.92,0]}>
   <coneGeometry args={[.13,.30,12]}/>
   <meshBasicMaterial color={color} transparent opacity={.85}/>
  </mesh>
 </group>;

const Aerodynamics:React.FC<{f:number}>=({f})=>{
 const flow=sm((f-140)/18)*(1-sm((f-342)/24));
 const down=sm((f-267)/22)*(1-sm((f-414)/15));
 return <group>
  {flow>.01?<group visible={flow>.01}>
   {Array.from({length:10},(_,i)=><Stream key={i} idx={i} f={f}/>)}
   {[-1,1].map(s=><ForceArrow key={s} p={[s*.35,1.53,2.75]} color="#57f0f9" length={2.0}/>)}
  </group>:null}
  {down>.01?<group>
   {[-1,1].map(s=><React.Fragment key={s}>
    <ForceArrow p={[s*.65,2.6,1.6]} length={1.07} vertical color="#ffbe63"/>
    <mesh position={[s*.7,.13,1.7]} rotation={[-PI/2,0,0]}>
     <ringGeometry args={[.32,.35,28]}/>
     <meshBasicMaterial color="#ffc16d" transparent opacity={.50} side={THREE.DoubleSide}/>
    </mesh>
   </React.Fragment>)}
  </group>:null}
 </group>;
};
type Shot={start:number;end:number;a:Vec;b:Vec;target:Vec;fov:number};
const shots:Shot[]=[
 {start:0,end:60,a:[2.6,1.84,4.36],b:[1.65,1.74,3.35],target:[0,1.35,2.1],fov:35},
 {start:60,end:139,a:[11.8,3.2,2.5],b:[10.5,2.4,-.9],target:[0,.98,0],fov:38},
 {start:139,end:249,a:[5.9,3.9,6.2],b:[-6.7,4.2,6.1],target:[0,1.05,1.55],fov:34},
 {start:249,end:365,a:[-7.3,4.8,5.1],b:[-5.7,2.9,3.8],target:[0,1.14,1.4],fov:38},
 {start:365,end:485,a:[3.5,2.05,-11.2],b:[-4.6,1.8,-9.4],target:[0,.98,0],fov:39},
 {start:485,end:540,a:[7.2,2.4,7.0],b:[4.8,1.38,7.4],target:[0,1.0,.5],fov:41},
];
const DirectCamera:React.FC<{f:number}>=({f})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const shot=shots.find(x=>f>=x.start&&f<x.end)??shots[shots.length-1];
  const t=sm((f-shot.start)/(shot.end-shot.start));
  const offset=shot.start===0 ? Math.sin(f*.13)*.035:Math.sin(f*.055)*.055;
  camera.position.set(mix(shot.a[0],shot.b[0],t)+offset,mix(shot.a[1],shot.b[1],t),mix(shot.a[2],shot.b[2],t));
  camera.lookAt(...shot.target);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=shot.fov;camera.updateProjectionMatrix();}
 },[camera,f]);
 return null;
};

const Headline:React.FC<{f:number}>=({f})=>{
 const stages:[number,number,string,string][]=[
  [0,65,'THE WING','MOVES.'],
  [147,240,'AIRBRAKE','DRAG'],
  [272,361,'MORE','DOWNFORCE'],
  [400,482,'BRAKING','ASSIST'],
 ];
 const entry=stages.find(x=>f>=x[0]&&f<x[1]);if(!entry)return null;
 const appear=sm((f-entry[0]-6)/10),disappear=1-sm((f-entry[1]-13)/13);
 const opacity=appear*disappear;
 return <div style={{position:'absolute',left:70,right:55,bottom:255,
   opacity,transform:'translateY('+((1-opacity)*30)+'px)',fontFamily:'Arial, sans-serif',fontWeight:900,
   letterSpacing:-3,lineHeight:1.03,textShadow:'0 4px 22px rgba(0,0,0,.68)',pointerEvents:'none'}}>
   <div style={{fontSize:60,color:'#f8f3e8'}}>{entry[2]}</div>
   <div style={{fontSize:90,color:f<272?CYAN:'#ffbf73'}}>{entry[3]}</div>
 </div>;
};
export const P1Full3DFilm:React.FC=()=>{
 const f=useCurrentFrame(),{width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:INK,overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position:[5,2.2,6],fov:38,near:.1,far:190}}
   gl={{antialias:true,preserveDrawingBuffer:true,alpha:false}}>
   <DirectCamera f={f}/>
   <color attach="background" args={['#0c2835']}/>
   <fog attach="fog" args={['#0c2835',20,86]}/>
   <ambientLight intensity={1.1}/>
   <hemisphereLight args={['#e9e4c0','#0c4056',2.45]}/>
   <directionalLight position={[-6,13,-8]} color="#fff4df" intensity={3.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
   <directionalLight position={[5,5,7]} color="#47bed0" intensity={2.15}/>
   <pointLight position={[0,4,3]} color="#ffac6c" intensity={25} distance={18}/>
   <World f={f}/>
   <Supercar f={f}/>
   <Aerodynamics f={f}/>
  </ThreeCanvas>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(5,14,23,.2),transparent 32%, transparent 68%,rgba(4,13,23,.6))',pointerEvents:'none'}}/>
  <Headline f={f}/>
 </AbsoluteFill>;
};
