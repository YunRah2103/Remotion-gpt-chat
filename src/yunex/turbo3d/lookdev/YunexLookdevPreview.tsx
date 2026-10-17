import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ExhaustHeat,RoadAtmosphere,RotorGlimmer,YUNEX_LOOK,YunexLights,YunexSurface} from './YunexLookdev';
import {YunexReflectionEnvironment} from './YunexReflectionEnvironment';

/** Independent A5 material/light proofs using disposable reference stand-ins.
 *  A1 and A2 geometry is NOT copied, changed or reauthored here; their real
 *  published named slots are resolved by the YunexLookdev material adapter.
 */
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const Vec3=([x,y,z]:readonly number[])=>new THREE.Vector3(x,y,z);
const WHEEL_OFFSETS=[[-.90,1.47],[.90,1.47],[-.90,-1.48],[.90,-1.48]] as const;

const CarWheel:React.FC<{x:number;z:number;frame:number}>=({x,z,frame})=>
  <group position={[x,.355,z]} rotation={[frame*.065,0,0]}>
    <mesh rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[.276,.083,12,36]}/><YunexSurface surface="tyre"/></mesh>
    <mesh rotation={[0,0,Math.PI/2]} castShadow>
      <cylinderGeometry args={[.264,.264,.135,40]}/><YunexSurface surface="rim"/>
    </mesh>
    {Array.from({length:9},(_,i)=>{
      const a=i*2*Math.PI/9;
      return <mesh key={i} position={[x>0?.079:-.079,Math.cos(a)*.154,Math.sin(a)*.154]}
        rotation={[a,0,0]} castShadow>
        <boxGeometry args={[.025,.286,.038]}/><YunexSurface surface="machinedSteel"/>
      </mesh>;
    })}
    <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.073,.073,.18,26]}/><YunexSurface surface="brakeSteel"/></mesh>
  </group>;

const createLoft=(sections:ReadonlyArray<readonly [number,number,number,number]>):THREE.BufferGeometry=>{
 const vertices:number[]=[],faces:number[]=[];
 sections.forEach(([z,w,lo,hi])=>vertices.push(-w,lo,z,w,lo,z,w,hi,z,-w,hi,z));
 for(let i=0;i<sections.length-1;i++)for(let k=0;k<4;k++){
  const a=i*4+k,b=i*4+(k+1)%4,c=a+4,d=b+4;
  faces.push(a,b,c,b,d,c);
 }
 const end=(sections.length-1)*4;faces.push(0,2,1,0,3,2,end,end+1,end+2,end,end+2,end+3);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setIndex(faces);g.computeVertexNormals();return g;
};

/** The only geometry here is an intentionally simplified material test proxy, not A1 deliverable. */
const CarProxy:React.FC<{frame:number}>=({frame})=>{
 const body=useMemo(()=>createLoft([
  [-2.3,.66,.47,.64],[-1.92,.89,.44,.78],[-1.46,.97,.45,.81],
  [-.6,.94,.43,.83],[.45,.96,.43,.83],[1.55,.92,.42,.73],[2.3,.58,.48,.63],
 ]),[]);
 const cabin=useMemo(()=>createLoft([
  [-1.16,.65,.80,.83],[-.64,.62,.83,1.19],[.15,.56,.85,1.23],
  [.54,.56,.84,1.14],[1.22,.78,.79,.81]
 ]),[]);
 return <group name="A5_TEST_PROXY_CAR" rotation={[0,Math.sin(frame*.012)*.02,0]}>
  <mesh geometry={body} castShadow receiveShadow><YunexSurface surface="tealPaint"/></mesh>
  <mesh geometry={cabin} castShadow><YunexSurface surface="glass"/></mesh>
  <mesh position={[0,1.242,-.15]}><boxGeometry args={[.98,.023,.74]}/><YunexSurface surface="tealTrim"/></mesh>
  <mesh position={[0,.45,2.29]}><boxGeometry args={[1.60,.07,.27]}/><YunexSurface surface="carbon"/></mesh>
  <mesh position={[0,.85,-2.2]}><boxGeometry args={[1.73,.08,.42]}/><YunexSurface surface="carbon"/></mesh>
  {[-1,1].map(s=><group key={s}>
    <mesh position={[s*.72,.75,2.245]} rotation={[0,s*.12,0]}>
      <boxGeometry args={[.29,.066,.035]}/><meshBasicMaterial color="#C6F7FF" toneMapped={false}/>
    </mesh>
    <mesh position={[s*.72,.70,-2.28]}><boxGeometry args={[.32,.044,.03]}/>
      <meshBasicMaterial color="#FF4C5E" toneMapped={false}/></mesh>
    <mesh position={[s*.86,.62,.20]}><boxGeometry args={[.04,.12,1.36]}/><YunexSurface surface="carbon"/></mesh>
  </group>)}
  {WHEEL_OFFSETS.map(([x,z],i)=><CarWheel key={i} x={x} z={z} frame={frame}/>)}
 </group>;
};

const RoadProxy:React.FC<{frame:number;variant:'a'|'b'}>=({frame,variant})=><group>
  <mesh position={[0,-.13,0]} receiveShadow><boxGeometry args={[13,.26,90]}/><YunexSurface surface="asphalt"/></mesh>
  {[-3.4,3.4].map(x=><mesh key={x} position={[x,.006,0]}>
    <boxGeometry args={[.065,.018,90]}/><YunexSurface surface="roadStripe"/></mesh>)}
  {Array.from({length:18},(_,i)=>{const z=((i*5+frame*.32+45)%90)-45;
    return <mesh key={i} position={[0,.012,z]}>
      <boxGeometry args={[.07,.02,2.2]}/><YunexSurface surface="roadStripe"/></mesh>;
  })}
  <mesh position={[0,-.09,-17]}><boxGeometry args={[65,.08,2]}/><YunexSurface surface="carbon"/></mesh>
  {[-1,1].flatMap(s=>Array.from({length:5},(_,i)=>{
    const z=((i*19+frame*.18+50)%110)-55;
    return <group key={s+'-'+i} position={[s*5.2,0,z]}>
      <mesh position={[0,2.5,0]}><cylinderGeometry args={[.065,.08,5,8]}/><YunexSurface surface="graphiteHousing"/></mesh>
      <mesh position={[-s*.39,4.95,0]}><boxGeometry args={[.75,.08,.27]}/><YunexSurface surface="machinedSteel"/></mesh>
      <mesh position={[-s*.64,4.91,0]}><boxGeometry args={[.2,.027,.18]}/>
        <meshBasicMaterial color="#FFE0A4" toneMapped={false}/></mesh>
      <pointLight position={[-s*.65,4.78,0]} intensity={variant==='a'?3.5:6}
        distance={7} color="#FFA96A"/>
    </group>;
  }))}
  <RoadAtmosphere frame={frame} visibility={variant==='a'?.85:1}/>
  <CarProxy frame={frame}/>
</group>;

const Casing:React.FC<{x:number;compressor:boolean}>=({x,compressor})=>
  <group position={[x,0,0]}>
    <mesh rotation={[0,Math.PI/2,0]} castShadow>
      <torusGeometry args={[.73,.22,16,48]}/>
      <YunexSurface surface={compressor?'graphiteHousing':'warmHousing'}/>
    </mesh>
    <mesh rotation={[0,Math.PI/2,0]}>
      <torusGeometry args={[.69,.033,8,48]}/><YunexSurface surface="machinedSteel"/>
    </mesh>
  </group>;
const RotorProxy:React.FC<{x:number;frame:number;compressor:boolean}>=({x,frame,compressor})=>
  <group position={[x,0,0]} rotation={[frame*.165,0,0]}>
   {Array.from({length:11},(_,i)=>{
    const a=i*2*Math.PI/11;
    return <mesh key={i} rotation={[a,0,0]} position={[0,Math.cos(a)*.43,Math.sin(a)*.43]}>
      <boxGeometry args={[.08,.44,.12]}/><YunexSurface surface={compressor?'machinedSteel':'warmHousing'}/>
    </mesh>;
   })}
   <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.19,.19,.23,24]}/><YunexSurface surface="machinedSteel"/></mesh>
  </group>;

/** Macro cutaway lighting proof — rotor proxies preserve A2's shared shaft +X convention. */
const TurboProxy:React.FC<{frame:number;charge?:boolean}>=({frame,charge=false})=><group>
 <mesh position={[0,-2.18,-.4]} receiveShadow>
   <boxGeometry args={[17,.30,13]}/><YunexSurface surface="carbon"/></mesh>
 <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,3.1,26]}/><YunexSurface surface="machinedSteel"/></mesh>
 <Casing x={-1.13} compressor={false}/><Casing x={1.13} compressor/>
 <RotorProxy x={-1.13} frame={frame} compressor={false}/>
 <RotorProxy x={1.13} frame={frame} compressor/>
 <mesh position={[-2.25,.67,.2]} rotation={[.15,0,-.6]}>
   <cylinderGeometry args={[.18,.18,1.72,18]}/><YunexSurface surface="hotPipe"/></mesh>
 <mesh position={[2.34,.63,.2]} rotation={[.2,0,.6]}>
   <cylinderGeometry args={[.16,.16,1.45,18]}/><YunexSurface surface="coldPipe"/></mesh>
 <pointLight position={[-2.2,1.7,.9]} color="#FF8544" intensity={9} distance={5}/>
 <pointLight position={[2.15,1.38,.8]} color="#53CFFF" intensity={10} distance={6}/>
 <ExhaustHeat frame={frame} position={[-1.45,.60,.23]}/>
 <RotorGlimmer frame={frame} position={[-1.13,0,0]} />
 {charge?<group position={[3.25,-.55,-.8]}>
    <mesh castShadow><boxGeometry args={[.8,1.65,1.7]}/><YunexSurface surface="intercooler"/></mesh>
    {Array.from({length:18},(_,i)=><mesh key={i} position={[.414,-.75+i*.085,0]}>
      <boxGeometry args={[.034,.041,1.58]}/><YunexSurface surface="machinedSteel"/></mesh>)}
    <pointLight position={[1.0,.1,0]} color="#8CEBE3" intensity={5} distance={4}/>
  </group>:null}
 </group>;

const LookdevCamera:React.FC<{frame:number;sceneVariant:'road'|'turbine'|'charge'}>=({frame,sceneVariant})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const t=clamp((frame%90)/89),w=t*t*(3-2*t);
  if(sceneVariant==='road'){
    camera.position.set(4.65-.85*w,1.95+.45*w,8.5-1.2*w);
    camera.lookAt(0,.65,0);
  }else if(sceneVariant==='turbine'){
    camera.position.set(3.6-1.6*w,2.4+.15*w,6.7-.6*w);
    camera.lookAt(0,.05,0);
  }else{
    camera.position.set(5.6-.65*w,2.25+.3*w,6.2-1.0*w);
    camera.lookAt(.85,-.35,-.55);
  }
  camera.updateProjectionMatrix();
 },[camera,frame,sceneVariant]);
 return null;
};

export const YunexLookdevProofScene:React.FC<{frame:number;forceVariant?:'road'|'turbine'|'charge';comparison?:'a'|'b'}>=({
 frame,forceVariant,comparison='b',
})=>{
 const v=forceVariant??(frame<90?'road':frame<180?'turbine':'charge');
 const isAB=comparison==='a';
 return <group name={'A5_LOOKDEV_PROOF_'+v}>
  <color attach="background" args={[YUNEX_LOOK.background]}/>
  <fog attach="fog" args={[YUNEX_LOOK.background,v==='road'?17:12,v==='road'?66:32]}/>
  <LookdevCamera frame={frame} sceneVariant={v}/>
  <YunexReflectionEnvironment intensity={isAB?.25:.92} variant={v}/>
  <YunexLights sceneVariant={v} intensity={isAB?.46:1} shadows={!isAB}/>
  {v==='road'?<RoadProxy frame={frame} variant={isAB?'a':'b'}/>:
   <TurboProxy frame={frame} charge={v==='charge'}/>}
 </group>;
};

/** This is an A5-only stand-alone Remotion preview, not the A6 film composition.
 *  For full source-backed motion proof render frame windows 15–35 / 105–125 / 195–215.
 */
export const YunexA5LookdevPreview:React.FC=()=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:YUNEX_LOOK.background}}>
  <ThreeCanvas width={1080} height={1920}
    camera={{position:[4,2,8],fov:39,near:.05,far:160}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
    <YunexLookdevProofScene frame={frame}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:135,left:90,letterSpacing:5,
      color:'#A3D6D4',font:'500 26px system-ui, sans-serif',opacity:.82}}>
    {frame<90?'01 / TEAL PAINT + STREET':frame<180?'02 / BRUSHED METAL + HEAT':'03 / CHARGE COOLING + STEEL'}
  </div>
  <div style={{position:'absolute',bottom:115,left:90,color:'#8EACAD',
      font:'400 22px system-ui, sans-serif',letterSpacing:3}}>
    YUNEX / A5 — MATERIAL + LIGHT REFERENCE ONLY
  </div>
 </AbsoluteFill>;
};
