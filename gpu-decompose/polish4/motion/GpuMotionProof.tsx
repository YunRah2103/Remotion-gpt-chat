import React,{useEffect,useLayoutEffect,useMemo,useState} from 'react';
import {AbsoluteFill,delayRender,continueRender,cancelRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {fitCamera} from '../../../src/gpu-polish3/cinema';

// PROOF ONLY: locked POLISH04 GLB and prior camera. D must revalidate
// against final POLISH04 A geometry and B cinematography before production.
type V=[number,number,number];
type Pose={position:V;rotation:V};
type Track={startFrame:number;endFrame:number;easing:'smoothstep';from:Pose;to:Pose};
type Motion={schemaVersion:1;fps:30;durationInFrames:450;nodes:Record<string,Track>};
type Loaded={model:THREE.Object3D;motion:Motion};
const REQUIRED='GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY PCB GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE'.split(' ');
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(a:number)=>Math.max(0,Math.min(1,a));
const progress=(f:number,a:number,b:number)=>{
 const t=clamp((f-a)/(b-a));return t*t*(3-2*t);
};
const verify=(gpu:THREE.Object3D,motion:Motion)=>{
 if(motion.schemaVersion!==1||motion.fps!==30||motion.durationInFrames!==450)throw Error('incompatible motion format');
 const counts=new Map<string,number>();
 gpu.traverse(o=>counts.set(o.name,(counts.get(o.name)||0)+1));
 for(const n of REQUIRED)if(counts.get(n)!==1)throw Error('invalid GLB node '+n);
 for(const [n,m] of Object.entries(motion.nodes)){
  if(counts.get(n)!==1||m.easing!=='smoothstep'||m.startFrame<90||m.endFrame>329||m.endFrame<=m.startFrame)throw Error('invalid track '+n);
  if(m.from.position.some(x=>x!==0)||m.from.rotation.some(x=>x!==0))throw Error('rest moved '+n);
 }
};
const applyPose=(gpu:THREE.Object3D,motion:Motion,bases:Map<string,{p:THREE.Vector3;r:THREE.Euler}>,f:number)=>{
 for(const [n,m] of Object.entries(motion.nodes)){
  const o=gpu.getObjectByName(n)!,base=bases.get(n)!;
  const t=progress(f,m.startFrame,m.endFrame);
  const r=[base.r.x,base.r.y,base.r.z];
  const p=[base.p.x,base.p.y,base.p.z];
  o.position.set(...([0,1,2].map(i=>p[i]+mix(m.from.position[i],m.to.position[i],t)) as V));
  o.rotation.set(...([0,1,2].map(i=>r[i]+mix(m.from.rotation[i],m.to.rotation[i],t)) as V),base.r.order);
 }
 // Exact local authored bases + local delta, not additive world transforms.
 gpu.updateMatrixWorld(true);
};
const Hardware:React.FC<{f:number;loaded:Loaded;w:number;h:number}>=({f,loaded,w,h})=>{
 const {camera}=useThree();
 const gpu=useMemo(()=>loaded.model.clone(true),[loaded.model]);
 const bases=useMemo(()=>{
  const out=new Map<string,{p:THREE.Vector3;r:THREE.Euler}>();
  for(const n of Object.keys(loaded.motion.nodes)){
   const o=gpu.getObjectByName(n);
   if(!o)throw Error('no base for '+n);
   out.set(n,{p:o.position.clone(),r:o.rotation.clone()});
  }
  return out;
 },[gpu,loaded.motion]);
 useLayoutEffect(()=>{
  applyPose(gpu,loaded.motion,bases,f);
  fitCamera(camera,gpu,f,w,h);
 },[gpu,loaded.motion,bases,f,camera,w,h]);
 return <primitive object={gpu}/>;
};
const Scene:React.FC<{f:number;loaded:Loaded;w:number;h:number}>=({f,loaded,w,h})=><>
 <color attach="background" args={['#242a31']}/>
 <ambientLight intensity={1.2} color="#dee6ee"/>
 <hemisphereLight args={['#ffffff','#56616f',2.5]}/>
 <directionalLight position={[-4,6,8]} intensity={5.1} color="#fff9f0"/>
 <directionalLight position={[5,2,7]} intensity={4.1} color="#eff7ff"/>
 <directionalLight position={[3,5,-5]} intensity={3.8} color="#d5e5f5"/>
 <directionalLight position={[-5,-2,5]} intensity={2.3} color="#b5c0d0"/>
 <Hardware f={f} loaded={loaded} w={w} h={h}/>
</>;
export const GpuPolish4MotionProof:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('POLISH04 C real model previsualization'));
 const [loaded,setLoaded]=useState<Loaded|null>(null);
 useEffect(()=>{
  let live=true;
  Promise.all([
   new GLTFLoader().loadAsync(staticFile('gpu-decompose/xfx_swift_rx9060xt_polish4.glb')),
   fetch(staticFile('gpu-decompose/decomposition.json')).then(async r=>{
    if(!r.ok)throw Error('no motion JSON '+r.status);
    return await r.json() as Motion;
   })
  ]).then(([asset,motion])=>{
   verify(asset.scene,motion);
   if(live){setLoaded({model:asset.scene,motion});continueRender(handle);}
  }).catch(e=>{if(live)cancelRender(e instanceof Error?e:Error(String(e)))});
  return ()=>{live=false};
 },[handle]);
 const stage=frame<90?'REST':frame<160?'FAN RELEASE':frame<210?'SHROUD / COOLER':
 frame<280?'THERMAL CORE':frame<330?'PCB / SILICON':'FULL EXPLODED';
 return <AbsoluteFill style={{background:'#242a31',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} orthographic
   camera={{position:[1.8,1.4,11],zoom:height/6.3,near:.05,far:100}}
   gl={{antialias:true,preserveDrawingBuffer:true}}>
   {loaded?<Scene f={frame} loaded={loaded} w={width} h={height}/>:<color attach="background" args={['#242a31']}/>}
  </ThreeCanvas>
  <div style={{position:'absolute',top:50,left:55,color:'#dae1e8',
   letterSpacing:2,fontSize:20,fontWeight:700}}>POLISH04 C · MECHANICAL PROOF</div>
  <div style={{position:'absolute',bottom:80,left:55,color:'#dae1e8',
   letterSpacing:2,fontSize:26,fontWeight:700}}>{stage} · F{String(frame).padStart(3,'0')}</div>
 </AbsoluteFill>;
};
