import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

// Release is fail-closed: a real Agent A GLB and a matching animation JSON are mandatory.
type Vector3 = [number, number, number];
type Transform = {position: Vector3; rotation: Vector3};
type Move = {startFrame:number; endFrame:number; from:Transform; to:Transform; easing:'smoothstep'};
type Animation = {schemaVersion:1; fps:30; durationInFrames:450; nodes:Record<string,Move>};
const REQUIRED = ['GPU_ROOT','FAN_ASSEMBLY','FAN_LEFT','FAN_CENTER','FAN_RIGHT','FRONT_SHROUD','HEATSINK','HEATSINK_FINS','HEATPIPE_BUNDLE','COLD_PLATE','PCB_ASSEMBLY','PCB','GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS','PCIE_FINGERS','POWER_8PIN','IO_BRACKET','BACKPLATE'] as const;
const MOVING = ['FAN_LEFT','FAN_CENTER','FAN_RIGHT','FRONT_SHROUD','HEATSINK','GPU_DIE','VRAM_CHIPS','PCB_ASSEMBLY','BACKPLATE'] as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const ease=(frame:number,start:number,end:number)=>{const x=clamp((frame-start)/(end-start)); return x*x*(3-2*x);};
const fadeIn=(f:number,start:number,len:number)=>ease(f,start,start+len);
const fadeOut=(f:number,end:number,len:number)=>1-ease(f,end-len,end);

function validate(animation:Animation, scene:THREE.Object3D):void {
 if(animation.schemaVersion!==1||animation.fps!==30||animation.durationInFrames!==450) throw new Error('Animation schema or timing mismatch');
 for(const name of REQUIRED) {
  const all:THREE.Object3D[]=[]; scene.traverse((obj)=>{if(obj.name===name)all.push(obj)});
  if(all.length!==1) throw new Error('GLB required node '+name+' found '+all.length+' times (expected 1)');
 }
 for(const name of MOVING) {
  const move=animation.nodes[name];
  if(!move||!Number.isInteger(move.startFrame)||!Number.isInteger(move.endFrame)||move.startFrame<90||move.endFrame>329||move.startFrame>=move.endFrame||move.easing!=='smoothstep') throw new Error('Invalid movement contract for '+name);
  for(const transform of [move.from,move.to]) for(const key of ['position','rotation'] as const) {
   if(!Array.isArray(transform?.[key])||transform[key].length!==3||transform[key].some((v)=>!Number.isFinite(v))) throw new Error('Bad movement vector for '+name);
  }
  if(move.from.position.some((v)=>Math.abs(v)>1e-6)||move.from.rotation.some((v)=>Math.abs(v)>1e-6)) throw new Error('Movement must use additive deltas for '+name);
 }
}

const Orientation:React.FC<{frame:number}>=({frame})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const p=ease(frame,205,449);
  const hero=frame<90?ease(frame,0,89):1;
  const ortho=camera as THREE.OrthographicCamera;
  // The ortho viewport in R3F uses native pixels; zoom is pixels per scene unit.
  ortho.zoom=1920/lerp(6.55,7.3,p);
  ortho.position.set(lerp(.28,2.0,p)+.17*Math.sin(hero*Math.PI*.65),lerp(.14,.55,p),lerp(10.5,11.8,p));
  ortho.lookAt(0,0,0);
  ortho.updateProjectionMatrix();
 },[camera,frame]);
 return null;
};

const AnimatedHardware:React.FC<{frame:number; original:THREE.Object3D; animation:Animation}>=({frame,original,animation})=>{
 const clone=useMemo(()=>{
  const object=original.clone(true);
  object.traverse((node)=>{if((node as THREE.Mesh).isMesh){const mesh=node as THREE.Mesh;mesh.castShadow=true;mesh.receiveShadow=true;}});
  return object;
 },[original]);
 const origins=useMemo(()=>{
  const originalTransforms=new Map<string,{p:THREE.Vector3;r:THREE.Euler}>();
  for(const name of MOVING){const n=clone.getObjectByName(name);if(!n)throw new Error('Missing node at pose '+name);originalTransforms.set(name,{p:n.position.clone(),r:n.rotation.clone()});}
  return originalTransforms;
 },[clone]);
 useLayoutEffect(()=>{
  for(const name of MOVING){
   const obj=clone.getObjectByName(name)!;
   const base=origins.get(name)!;
   const m=animation.nodes[name];
   const t=ease(frame,m.startFrame,m.endFrame);
   for(let axis=0;axis<3;axis++){
    const translation=lerp(m.from.position[axis],m.to.position[axis],t);
    const rotation=lerp(m.from.rotation[axis],m.to.rotation[axis],t);
    obj.position.setComponent(axis,base.p.getComponent(axis)+translation);
    if(axis===0)obj.rotation.x=base.r.x+rotation;
    if(axis===1)obj.rotation.y=base.r.y+rotation;
    if(axis===2)obj.rotation.z=base.r.z+rotation;
   }
  }
 },[frame,clone,animation,origins]);
 return <primitive object={clone}/>;
};

const Studio:React.FC<{frame:number; original:THREE.Object3D; animation:Animation}>=({frame,original,animation})=><>
 <color attach="background" args={['#15181d']}/>
 <ambientLight intensity={.48} color="#b4c2d0"/>
 <hemisphereLight args={['#e5edf9','#22232c',2.2]}/>
 <directionalLight color="#e7ecfa" position={[-4.5,6,9]} intensity={3.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
 <directionalLight color="#abc3de" position={[4,2,-5]} intensity={2.0}/>
 <spotLight color="#dee5ff" position={[0,5,8]} intensity={36} angle={.64} penumbra={1}/>
 <spotLight color="#90a9ce" position={[5,-1,4]} intensity={22} angle={.48} penumbra={1}/>
 <mesh position={[0,-1.14,-1]} rotation={[-Math.PI/2,0,0]} receiveShadow>
  <planeGeometry args={[200,200]}/>
  <meshStandardMaterial color="#202328" roughness={.41} metalness={.3}/>
 </mesh>
 <Orientation frame={frame}/>
 <AnimatedHardware frame={frame} original={original} animation={animation}/>
</>;

export const GpuDecomposition:React.FC=()=>{
 const frame=useCurrentFrame();
 const {width,height}=useVideoConfig();
 const [renderHandle]=useState(()=>delayRender('Load actual XFX Swift Blender GLB and locked separation JSON'));
 const [loaded,setLoaded]=useState<{original:THREE.Object3D;animation:Animation}|null>(null);
 useEffect(()=>{
  let active=true;
  const loader=new GLTFLoader();
  const glb=staticFile('gpu-decompose/xfx_swift_rx9060xt_triple16.glb');
  const json=staticFile('gpu-decompose/decomposition.json');
  Promise.all([
   loader.loadAsync(glb),
   fetch(json).then(async response=>{if(!response.ok)throw new Error('Animation JSON missing: HTTP '+response.status);return response.json() as Promise<Animation>;}),
  ]).then(([gltf,animation])=>{
   validate(animation,gltf.scene);
   if(!active)return;
   setLoaded({original:gltf.scene,animation});
   continueRender(renderHandle);
  }).catch((e:unknown)=>{if(active)cancelRender(e instanceof Error?e:new Error(String(e)));});
  return ()=>{active=false;};
 },[renderHandle]);
 const opening=fadeIn(frame,8,19)*fadeOut(frame,104,20);
 const footer=fadeIn(frame,349,28);
 const caption=frame>=90&&frame<180?'01 / COOLING SYSTEM':frame>=180&&frame<330?'02 / INNER ARCHITECTURE':frame>=330?'03 / EXPLODED ASSEMBLY':'3-FAN OC EDITION · 16GB';
 return <AbsoluteFill style={{background:'#15181d',color:'#f3f4f4',fontFamily:'Arial,Helvetica,sans-serif',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} orthographic camera={{position:[.28,.14,10.5],zoom:1920/6.55,near:.05,far:100}} shadows gl={{antialias:true,preserveDrawingBuffer:true}}>
   {loaded?<Studio frame={frame} original={loaded.original} animation={loaded.animation}/>:<color attach="background" args={['#15181d']}/>}
  </ThreeCanvas>
  <div style={{position:'absolute',left:76,right:76,top:119,display:'flex',justifyContent:'space-between',opacity:.68,fontSize:20,fontWeight:700,letterSpacing:5}}>
   <span>SWIFT / ENGINEERED</span><span>16GB GDDR6</span>
  </div>
  <div style={{position:'absolute',left:76,right:76,top:194,opacity:opening,transform:'translateY('+(1-opening)*20+'px)'}}>
   <div style={{fontSize:72,fontWeight:800,lineHeight:1.05,letterSpacing:-2,textShadow:'0 2px 12px #15181d'}}>XFX SWIFT</div>
   <div style={{fontSize:42,letterSpacing:5,fontWeight:650,marginTop:9,color:'#c2d0d9'}}>RX 9060 XT</div>
  </div>
  <div style={{position:'absolute',bottom:228,left:76,right:76,display:'flex',alignItems:'center',justifyContent:'space-between',opacity:.75}}>
   <span style={{fontSize:22,fontWeight:600,letterSpacing:3}}>{caption}</span>
   <span style={{fontSize:19,letterSpacing:2}}>{String(Math.floor(frame/30)).padStart(2,'0')} / 15</span>
  </div>
  <div style={{position:'absolute',left:76,right:76,bottom:118,height:2,background:'#a6b6c133'}}>
   <div style={{height:'100%',width:((frame+1)/450*100)+'%',background:'#d6e1eb'}}/>
  </div>
  <div style={{position:'absolute',left:76,right:76,bottom:348,opacity:footer,transform:'translateY('+(1-footer)*16+'px)',textAlign:'center',pointerEvents:'none'}}>
   <div style={{fontWeight:800,fontSize:76,letterSpacing:7,textShadow:'0 3px 22px #15181d'}}>DECONSTRUCTED</div>
  </div>
 </AbsoluteFill>;
};
