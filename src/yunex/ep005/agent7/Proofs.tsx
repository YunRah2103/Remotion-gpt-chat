import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../world-kit/components';
import {createAfterfireRig,animateAfterfire} from './afterfire';
import {buildScienceEngine,animateScienceEngine} from './science';
import type {WorldExhaustPort} from './ports';

const chrome=new T.MeshPhysicalMaterial({color:'#aaa8a5',metalness:.95,roughness:.2,clearcoat:.28});
const dark=new T.MeshStandardMaterial({color:'#1d252d',metalness:.65,roughness:.34});
const backdrop='#111820';
function fixture(){
  const root=new T.Group();root.name='NEUTRAL TEST FIXTURE / NOT AGENT 6 CAR';
  const bumper=new T.Mesh(new T.BoxGeometry(.32,.35,1.38),dark);
  bumper.position.set(.06,.28,0);root.add(bumper);
  for(const side of [-1,1]){
    const tube=new T.Mesh(new T.CylinderGeometry(.059,.059,.24,48,1,true),chrome);
    tube.rotation.z=Math.PI/2;tube.position.set(-.24,.24,side*.38);root.add(tube);
    const bore=new T.Mesh(new T.CircleGeometry(.050,48),
       new T.MeshBasicMaterial({color:'#0b1018',side:T.DoubleSide}));
    bore.rotation.y=-Math.PI/2;bore.position.set(-.363,.24,side*.38);root.add(bore);
  }
  return root;
}
const Frame:React.FC<{tag:string;title:string;subtitle:string;footer:string}>=({tag,title,subtitle,footer})=>
  <div style={{position:'absolute',inset:0,pointerEvents:'none',fontFamily:'Arial, sans-serif'}}>
    <div style={{position:'absolute',top:96,left:78,right:70}}>
      <div style={{fontSize:23,letterSpacing:5,color:'#86a6b8',fontWeight:700}}>{tag}</div>
      <div style={{fontSize:64,color:'#edf4f7',fontWeight:800,lineHeight:1.05,marginTop:20,
         letterSpacing:-2}}>{title}</div>
      <div style={{fontSize:30,color:'#b5c8d2',marginTop:26,lineHeight:1.25}}>{subtitle}</div>
    </div>
    <div style={{position:'absolute',bottom:150,left:80,right:80,
      borderTop:'1px solid rgba(190,209,220,.4)',paddingTop:22,
      color:'#d1dfe7',fontSize:22,letterSpacing:1}}>{footer}</div>
  </div>;

type VectorTuple=[number,number,number];
/** Shot-sized optical compositions rather than one tiny wide orthographic diagram. */
function scienceCamera(t:number):{position:VectorTuple;target:VectorTuple}{
  const k:{t:number;position:VectorTuple;target:VectorTuple}[]=[
    {t:0,position:[3.35,2.45,7.1],target:[.05,.42,0]},
    {t:1.35,position:[3.0,2.65,6.7],target:[-.05,.42,0]},
    {t:1.90,position:[2.45,2.65,7.0],target:[-.45,.35,0]},
    {t:2.83,position:[.85,2.6,7.15],target:[-.75,.26,0]},
    {t:3.50,position:[-2.9,2.45,6.25],target:[-1.35,.16,0]},
    {t:5,position:[-3.5,2.3,5.95],target:[-1.60,.10,0]},
  ];
  let i=0;while(i<k.length-2&&t>k[i+1].t)i++;
  const a=k[i],b=k[i+1],u=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t)));
  const s=u*u*(3-2*u);
  const mix=(v:VectorTuple,w:VectorTuple):VectorTuple=>[
    v[0]+(w[0]-v[0])*s,v[1]+(w[1]-v[1])*s,v[2]+(w[2]-v[2])*s
  ];
  return {position:mix(a.position,b.position),target:mix(a.target,b.target)};
}

export const FlameFixtureProof:React.FC=()=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
  const metal=useMemo(()=>fixture(),[]);
  const rig=useMemo(()=>createAfterfireRig(),[]);
  useEffect(()=>()=>{metal.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});},[metal]);
  // Explicit fixture-only coordinates. NEVER consume this in production.
  const ports:WorldExhaustPort[]=[-1,1].map((side,i)=>({
    id:i===0?'right':'left',
    origin:new T.Vector3(-.365,.24,side*.38),
    outward:new T.Vector3(-1,0,0),
    innerRadiusM:.049,outerDiameterM:.118,frame,fps
  }));
  animateAfterfire(rig,ports,t,[{at:-.055,duration:.68,strength:1},
    {at:1.43,duration:.53,strength:.92},
    {at:2.33,duration:.35,strength:.72}]);
  return <AbsoluteFill style={{background:backdrop}}>
    <ThreeCanvas width={width} height={height} camera={{fov:37,near:.025,far:60}}
        gl={{antialias:true,alpha:false}}>
      <color attach="background" args={[backdrop]}/>
      <ambientLight intensity={.55} color="#c5d6e5"/>
      <directionalLight position={[2,6,3]} intensity={2.8} color="#fff4e6"/>
      <directionalLight position={[-3,2,-5]} intensity={2} color="#92ccfe"/>
      <pointLight position={[-1.1,1.5,1]} intensity={.75} distance={2.4} color="#ffc195"/>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.18,0]} receiveShadow>
        <planeGeometry args={[70,70]}/>
        <meshStandardMaterial color="#2d323a" metalness={.35} roughness={.46}/>
      </mesh>
      <primitive object={metal}/><primitive object={rig.root}/>
      <CameraAim position={[-3.95+.09*t,1.24,4.12-.09*t]} target={[-.85,.29,0]} fov={37}/>
    </ThreeCanvas>
    <Frame tag="YUNEX / AGENT 7 / FLAME R&D"
       title="TRANSIENT AFTERFIRE"
       subtitle="Turbulent ignition • brief pulses • localized light"
       footer="NEUTRAL FIXTURE TEST — NOT AGENT 6'S HERO CAR"/>
  </AbsoluteFill>;
};
export const MechanicalScienceProof:React.FC=()=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps;
  const a=useMemo(()=>buildScienceEngine(),[]);
  // Science-only outlet geometry: these are NOT car exhaust measurements.
  // Reuse the identical volumetric flame renderer, never the cartoon cone mockup.
  const scienceAfterfire=useMemo(()=>createAfterfireRig(),[]);
  const phase:0|1|2=t<1.6?0:t<3.3?1:2;
  const camera=scienceCamera(t);
  animateScienceEngine(a,t,phase);
  const sciencePorts:WorldExhaustPort[] = (['left','right'] as const).map((id,i)=>({
    id, frame, fps, origin:new T.Vector3(-2.56,-.06,i===0?.71:-.71),
    outward:new T.Vector3(-1,0,0), innerRadiusM:.044, outerDiameterM:.118,
  }));
  animateAfterfire(scienceAfterfire,sciencePorts,t,[
    {at:3.24,duration:.49,strength:.95},
    {at:3.80,duration:.39,strength:1},
    {at:4.28,duration:.43,strength:.94},
    {at:4.76,duration:.32,strength:.95},
  ]);
  const story=[
    {h:'INSIDE THE ENGINE',sub:'Fuel normally burns inside the cylinders.',tag:'01 / CONTROLLED COMBUSTION'},
    {h:'HOT EXHAUST',sub:'On some tuned overrun events, fuel reaches the exhaust.',tag:'02 / FUEL + HEAT'},
    {h:'A BRIEF IGNITION',sub:'Fuel, oxygen and enough heat can create afterfire.',tag:'03 / CONDITIONAL AFTERFIRE'},
  ][phase];
  return <AbsoluteFill style={{background:backdrop}}>
    <ThreeCanvas width={width} height={height} camera={{fov:38,near:.025,far:90}} gl={{antialias:true}}>
      <color attach="background" args={[backdrop]}/>
      <ambientLight intensity={1.35} color="#bfd8e8"/>
      <directionalLight position={[4,8,6]} intensity={4.1} color="#fff5e2"/>
      <directionalLight position={[-5,4,-4]} intensity={2.3} color="#8db8dc"/>
      <pointLight position={[-2,1,2]} intensity={5.5} distance={8} color="#f4aa75"/>
      <mesh position={[-.45,-.52,0]} receiveShadow>
        <boxGeometry args={[3.9,.12,1.95]}/>
        <meshStandardMaterial color="#394954" metalness={.26} roughness={.53}/>
      </mesh>
      <primitive object={a.root}/>
      <primitive object={scienceAfterfire.root}/>
      <CameraAim position={camera.position} target={camera.target} fov={38}/>
    </ThreeCanvas>
    <Frame tag={'YUNEX / ' + story.tag} title={story.h}
      subtitle={story.sub}
      footer="Illustrative V8/exhaust anatomy • Catalysts can suppress visible flames"/>
    <div style={{position:'absolute',bottom:'25%',left:'9%',right:'9%',
      fontFamily:'Arial',fontSize:31,letterSpacing:1.2,fontWeight:700,
      color:'#f2ecdf',textAlign:'center',padding:'16px 22px',
      background:'rgba(9,20,29,.72)',borderTop:'2px solid #e89a64'}}>
      {phase===0?'PISTONS • CYLINDER IGNITION':phase===1?'HOT GAS THROUGH CONNECTED HEADERS':'BRIEF AFTERFIRE — ONLY IN SOME CONDITIONS'}
    </div>
  </AbsoluteFill>;
};
