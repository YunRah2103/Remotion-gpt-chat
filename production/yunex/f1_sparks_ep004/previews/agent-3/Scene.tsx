import React,{useMemo} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as T from 'three';
import {WorldLighting,Environment,Vehicle} from '../../../../../src/yunex/world-kit/components.tsx';
import {sampleRoute,routeLength} from '../../../../../src/yunex/world-kit/environments.ts';
import {sampleTrackSurface} from '../../shared/track.ts';
import type {ShotId,CameraPose} from '../../shared/contract.ts';
import {sampleRetimedShotCamera} from '../../cinema/cameras.ts';
import {ApplyCameraPose} from '../../cinema/ShotCamera.tsx';
import {FIXTURE_LABEL,referenceForwardContact,sampleReferenceMotion,sampleReferenceSparks} from './referenceFixture.ts';

const segmentMap:{id:ShotId;from:number;duration:number}[]=[
  {id:'rear-mystery',from:0,duration:2.8},
  {id:'underfloor-reveal',from:2.8,duration:3},
  {id:'contact-macro',from:5.8,duration:2.2},
  {id:'racing-payoff',from:8,duration:3},
];
function previewShot(t:number,hook:boolean):{shot:ShotId;localSec:number;durationSec:number}{
  if(hook)return {shot:'spark-hook',localSec:t,durationSec:5};
  const item=segmentMap.find((v)=>t<v.from+v.duration)||segmentMap[segmentMap.length-1];
  return {shot:item.id,localSec:Math.max(0,t-item.from),durationSec:item.duration};
}
const RoadProfile:React.FC=()=>{
  const geometry=useMemo(()=>{
    const g=new T.BufferGeometry(),verts:number[]=[],faces:number[]=[];
    const L=routeLength('track'),n=1100;
    for(let i=0;i<=n;i++){
      const d=i/n*L,p=sampleRoute('track',d),front=sampleRoute('track',d+.06),yaw=p.yaw;
      const dx=Math.sin(yaw),dz=Math.cos(yaw),y=sampleTrackSurface(d).heightM+.009;
      const half=5.75;
      verts.push(p.position[0]-dx*half,y,p.position[2]-dz*half,p.position[0]+dx*half,y,p.position[2]+dz*half);
      if(i<n){const q=2*i;faces.push(q,q+1,q+2,q+1,q+3,q+2);}
    }
    g.setAttribute('position',new T.Float32BufferAttribute(verts,3));
    g.setIndex(faces);g.computeVertexNormals();return g;
  },[]);
  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color="#29333a" roughness={.84} side={T.DoubleSide} metalness={.08}/>
  </mesh>;
};
const SparkPreview:React.FC<{sec:number}>=({sec})=>{
  const particles=sampleReferenceSparks(sec);
  const motion=sampleReferenceMotion(sec),contact=referenceForwardContact(motion);
  return <>
    {particles.map(p=><mesh key={p.id} position={[...p.positionWorld]} scale={[1,1,1]}>
      <sphereGeometry args={[p.radiusM*(1.4+p.luminance01),5,4]}/>
      <meshBasicMaterial color={p.id%4===0?'#fff9d9':'#ffd496'} toneMapped={false}/>
    </mesh>)}
    {contact.active&&<pointLight color="#ffe0a1" intensity={2.5*contact.contactIntensity01} distance={3.8} decay={2} position={[...contact.pointWorld]}/>}
  </>;
};
const label:React.CSSProperties={color:'#e9f1f2',fontFamily:'Arial,sans-serif',letterSpacing:1,textShadow:'0 2px 10px #000e'};
export const Agent3Scene:React.FC<{hook:boolean}>=({hook})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),sec=frame/fps;
  const motion=sampleReferenceMotion(sec),spec=previewShot(sec,hook);
  const pose:CameraPose=sampleRetimedShotCamera(spec.shot,spec.localSec,spec.durationSec,motion);
  const routePose={position:[...motion.worldPosition] as [number,number,number],yaw:motion.yawRad};
  return <AbsoluteFill style={{background:'#070e17'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:[0,4,12],fov:52,near:.035,far:330}}>
      <WorldLighting timeOfDay="night" focus={[...motion.worldPosition]}/>
      <Environment kind="track" seed={12} timeOfDay="night"/>
      <RoadProfile/>
      <Vehicle variant="formula-modern" color="#006b76" accent="#f5aa5a" lights distance={motion.routeDistanceM} pose={routePose}/>
      <SparkPreview sec={sec}/>
      <ApplyCameraPose pose={pose} near={.035}/>
    </ThreeCanvas>
    <div style={{position:'absolute',left:'7%',top:'6%',right:'7%',...label,fontSize:21,fontWeight:700}}>
      EP004 / CAMERA STUDY <span style={{opacity:.7,fontWeight:400}}>{hook?'01 — OPENING':'02 — SPATIAL SEQUENCE'}</span>
    </div>
    <div style={{position:'absolute',left:'7%',bottom:'8%',right:'7%',...label,fontSize:25,fontWeight:700,textTransform:'uppercase'}}>
      {spec.shot.replaceAll('-',' ')}
      <div style={{fontSize:16,fontWeight:400,marginTop:9,opacity:.75,letterSpacing:.7}}>{FIXTURE_LABEL}</div>
    </div>
  </AbsoluteFill>;
};
