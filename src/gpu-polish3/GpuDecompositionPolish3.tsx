import React,{useEffect,useLayoutEffect,useMemo,useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,delayRender,continueRender,cancelRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {fitCamera,smooth} from './cinema';

type V=[number,number,number];
type Pose={position:V;rotation:V};
type Move={startFrame:number;endFrame:number;easing:'smoothstep';from:Pose;to:Pose};
type Anim={schemaVersion:1;fps:30;durationInFrames:450;nodes:Record<string,Move>};
type Loaded={model:THREE.Object3D;motion:Anim};
const REQUIRED=['GPU_ROOT','FAN_ASSEMBLY','FAN_LEFT','FAN_CENTER','FAN_RIGHT','FRONT_SHROUD','HEATSINK','HEATSINK_FINS','HEATPIPE_BUNDLE','COLD_PLATE','PCB_ASSEMBLY','PCB','GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS','PCIE_FINGERS','POWER_8PIN','IO_BRACKET','BACKPLATE'];
const MOVING=['FAN_LEFT','FAN_CENTER','FAN_RIGHT','FRONT_SHROUD','HEATSINK','GPU_DIE','VRAM_CHIPS','PCB_ASSEMBLY','BACKPLATE'];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function verify(gpu:THREE.Object3D,a:Anim){
 if(a.schemaVersion!==1||a.fps!==30||a.durationInFrames!==450)throw Error('POLISH3 incompatible animation');
 for(const name of REQUIRED){
  let count=0;gpu.traverse(x=>{if(x.name===name)count++});
  if(count!==1)throw Error('POLISH3 missing or duplicated '+name+': '+count);
 }
 for(const name of MOVING){
  const m=a.nodes[name];
  if(!m||!Number.isInteger(m.startFrame)||!Number.isInteger(m.endFrame)||m.startFrame<90||m.endFrame>329||m.startFrame>=m.endFrame||m.easing!=='smoothstep')throw Error('POLISH3 bad timeline '+name);
  for(const o of [m.from,m.to])for(const k of ['position','rotation'] as const){
   if(!Array.isArray(o?.[k])||o[k].length!==3||o[k].some(x=>!Number.isFinite(x)))throw Error('POLISH3 invalid offset '+name);
  }
  if(m.from.position.some(v=>Math.abs(v)>1e-6)||m.from.rotation.some(v=>Math.abs(v)>1e-6))throw Error('POLISH3 non-zero additive origin '+name);
 }
}
function litMaterial(source:THREE.Material):THREE.Material{
 const m=source.clone();
 if(m instanceof THREE.MeshStandardMaterial){
  m.metalness=Math.min(.78,m.metalness);
  m.roughness=Math.max(.29,m.roughness);
  const c=m.color,L=c.r*.2126+c.g*.7152+c.b*.0722;
  if(L<.09){c.multiplyScalar(1.3);m.emissive.copy(c);m.emissiveIntensity=.115;}
  m.needsUpdate=true;
 }
 return m;
}
const Hardware:React.FC<{f:number;loaded:Loaded;w:number;h:number}>=({f,loaded,w,h})=>{
 const {camera}=useThree();
 const gpu=useMemo(()=>{
  const clone=loaded.model.clone(true);
  clone.traverse(node=>{
   if((node as THREE.Mesh).isMesh){
    const m=node as THREE.Mesh;m.castShadow=true;m.receiveShadow=true;
    m.material=Array.isArray(m.material)?m.material.map(litMaterial):litMaterial(m.material);
   }
  });
  return clone;
 },[loaded.model]);
 const origin=useMemo(()=>{
  const out=new Map<string,{p:THREE.Vector3;r:THREE.Euler}>();
  for(const n of MOVING){
   const o=gpu.getObjectByName(n);
   if(!o)throw Error('POLISH3 moving anchor missing '+n);
   out.set(n,{p:o.position.clone(),r:o.rotation.clone()});
  }return out;
 },[gpu]);
 useLayoutEffect(()=>{
  // Mechanical deltas stay strictly within Agent A's JSON and anchor hierarchy.
  for(const n of MOVING){
   const o=gpu.getObjectByName(n)!,base=origin.get(n)!,m=loaded.motion.nodes[n];
   const t=smooth(f,m.startFrame,m.endFrame);
   o.position.set(
    base.p.x+mix(m.from.position[0],m.to.position[0],t),
    base.p.y+mix(m.from.position[1],m.to.position[1],t),
    base.p.z+mix(m.from.position[2],m.to.position[2],t));
   o.rotation.set(
    base.r.x+mix(m.from.rotation[0],m.to.rotation[0],t),
    base.r.y+mix(m.from.rotation[1],m.to.rotation[1],t),
    base.r.z+mix(m.from.rotation[2],m.to.rotation[2],t),base.r.order);
  }
  gpu.updateMatrixWorld(true);
  fitCamera(camera,gpu,f,w,h);
 },[camera,f,gpu,origin,loaded.motion,w,h]);
 return <primitive object={gpu}/>;
};
const Studio:React.FC<{f:number;loaded:Loaded;w:number;h:number}>=({f,loaded,w,h})=><>
 <color attach="background" args={['#242a31']}/>
 <ambientLight intensity={1} color="#dce4ec"/>
 <hemisphereLight args={['#ffffff','#56616f',2.3]}/>
 <directionalLight position={[-3.8,6.3,8.1]} intensity={5.1} color="#fff9f2" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
 <directionalLight position={[5.5,2.1,7.2]} intensity={3.9} color="#f4f8fc"/>
 <directionalLight position={[3.5,5.8,-5]} intensity={4} color="#d9e4ef"/>
 <directionalLight position={[-5,-1,5]} intensity={1.9} color="#a9b8c8"/>
 <spotLight position={[-1.6,7,8]} color="#fffdf8" intensity={32} angle={.75} penumbra={1}/>
 <Hardware f={f} loaded={loaded} w={w} h={h}/>
</>;
const STAGES=[
 {start:0,end:89,id:'00 / PRODUCT',name:'XFX SWIFT',detail:'TRIPLE-FAN · 16GB GDDR6'},
 {start:90,end:179,id:'01 / COOLING',name:'FAN & SHROUD',detail:'FRONT MODULE RELEASE'},
 {start:180,end:329,id:'02 / ARCHITECTURE',name:'CORE COMPONENTS',detail:'FIN STACK · DIE · MEMORY · PCB'},
 {start:330,end:449,id:'03 / ASSEMBLY',name:'DECONSTRUCTED',detail:'EACH LAYER, REVEALED'},
];
export const GpuDecompositionPolish3:React.FC=()=>{
 const f=useCurrentFrame(),{width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('POLISH3 requires new real XFX Swift GLB + motion'));
 const [loaded,setLoaded]=useState<Loaded|null>(null);
 useEffect(()=>{
  let live=true;
  Promise.all([
   new GLTFLoader().loadAsync(staticFile('gpu-decompose/xfx_swift_rx9060xt_polish3.glb')),
   fetch(staticFile('gpu-decompose/decomposition.json')).then(async r=>{if(!r.ok)throw Error('POLISH3 animation missing HTTP '+r.status);return await r.json() as Anim;})
  ]).then(([gltf,motion])=>{
   verify(gltf.scene,motion);
   if(!live)return;setLoaded({model:gltf.scene,motion});continueRender(handle);
  }).catch(e=>{if(live)cancelRender(e instanceof Error?e:Error(String(e)))});
  return ()=>{live=false};
 },[handle]);
 const stage=STAGES.find(s=>f>=s.start&&f<=s.end)!;
 const open=smooth(f,4,22)*(1-smooth(f,88,108));
 const stageAlpha=f===0?1:Math.max(.55,smooth(f,stage.start,stage.start+12));
 return <AbsoluteFill style={{background:'#242a31',color:'#f3f5f6',overflow:'hidden',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <ThreeCanvas width={width} height={height} orthographic camera={{position:[1.8,1.4,11],zoom:height/6.3,near:.05,far:100}} shadows gl={{antialias:true,preserveDrawingBuffer:true}}>
   {loaded?<Studio f={f} loaded={loaded} w={width} h={height}/>:<color attach="background" args={['#242a31']}/>}
  </ThreeCanvas>
  <div style={{position:'absolute',top:92,left:68,right:68,display:'flex',justifyContent:'space-between',fontSize:19,fontWeight:700,letterSpacing:3.7,color:'#dee6ed',opacity:.83}}>
   <span>SWIFT / ENGINEERED</span><span>RDNA 4 · 16GB</span>
  </div>
  <div style={{position:'absolute',top:190,left:67,right:67,opacity:open,transform:'translateY('+((1-open)*14)+'px)',pointerEvents:'none'}}>
   <div style={{fontSize:70,fontWeight:800,lineHeight:1.05,letterSpacing:-2.2}}>XFX SWIFT</div>
   <div style={{fontSize:40,fontWeight:700,color:'#d1dde7',letterSpacing:3.4,marginTop:11}}>RX 9060 XT</div>
  </div>
  <div style={{position:'absolute',bottom:319,left:70,right:70,opacity:stageAlpha,display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:20,pointerEvents:'none'}}>
   <div>
    <div style={{fontSize:19,fontWeight:700,letterSpacing:3.3,color:'#bccbd7',marginBottom:13}}>{stage.id}</div>
    <div style={{fontSize:f>=330?68:33,fontWeight:800,letterSpacing:f>=330?1.8:1.1,lineHeight:1.1}}>{stage.name}</div>
    <div style={{fontSize:18,fontWeight:600,letterSpacing:2,color:'#c0cbd5',marginTop:11}}>{stage.detail}</div>
   </div>
   <div style={{fontSize:20,fontWeight:700,letterSpacing:2,color:'#cbd7e0',whiteSpace:'nowrap'}}>{String(Math.floor(f/30)).padStart(2,'0')} / 15</div>
  </div>
  <div style={{position:'absolute',bottom:124,left:70,right:70,height:2,background:'#91a4b650'}}>
   <div style={{height:'100%',width:((f+1)/450*100)+'%',background:'#e3e9ef'}}/>
  </div>
 </AbsoluteFill>;
};
