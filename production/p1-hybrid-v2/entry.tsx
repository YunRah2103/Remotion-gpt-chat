import React, {useEffect,useLayoutEffect,useMemo} from 'react';
import {AbsoluteFill,Composition,interpolate,registerRoot,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {WorldLighting} from '../../src/yunex/world-kit/components.tsx';
import {createEnvironment} from '../../src/yunex/world-kit/environments.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
import {createPart} from '../../src/yunex/parts-kit/models.ts';
import {animatePart} from '../../src/yunex/parts-kit/motion.ts';
import {partCamera} from '../../src/yunex/parts-kit/cameras.ts';

const FPS=24,SHOT=64;
const CAR_PATH=staticFile('p1-hybrid/mclaren-p1.glb');
const sections=[
 {kicker:'McLAREN P1 / HYBRID HYPERCAR',headline:'A DIFFERENT KIND OF FAST.',sub:'Petrol and electricity. One powertrain.',accent:'#c9e8e1'},
 {kicker:'01  /  COMBUSTION',headline:'3.8L TWIN-TURBO V8',sub:'A compact V8 drives the rear wheels.',accent:'#ffb371'},
 {kicker:'02  /  ELECTRIC RESPONSE',headline:'INSTANT TORQUE.',sub:'Electric assistance fills in the response.',accent:'#88e7e8'},
 {kicker:'03  /  COMBINED OUTPUT',headline:'903 BHP. 2.8 SEC.',sub:'0–62 mph from a hybrid icon.',accent:'#e5f4e8'}
] as const;
const cameras=[
 {from:[7.4,2.8,10.8],to:[6.5,2.5,9.7],at:[0,.75,0],turn:-.27},
 {from:[9.0,2.4,3.7],to:[8.4,2.15,1.5],at:[0,.76,0],turn:-.27},
 {from:[5.9,3.0,-9.2],to:[3.2,2.4,-10.5],at:[0,.8,0],turn:-.27},
 {from:[-6.5,2.5,10.4],to:[-7.0,2.15,8.7],at:[0,.78,0],turn:-.27}
] as const;
const ease=(p:number)=>p*p*(3-2*p);
function CameraMotion({shot}:{shot:number}){
 const frame=useCurrentFrame(),{camera}=useThree(),conf=cameras[shot];
 useLayoutEffect(()=>{
  const t=ease(T.MathUtils.clamp(frame/(SHOT-1),0,1));
  const p=conf.from.map((v,i)=>v+(conf.to[i]-v)*t);
  camera.position.set(p[0],p[1],p[2]);camera.lookAt(...conf.at);camera.updateProjectionMatrix();
 },[camera,frame,conf]);
 return null;
}
function OriginalP1({shot}:{shot:number}){
 const gltf=useLoader(GLTFLoader,CAR_PATH,loader=>loader.setMeshoptDecoder(MeshoptDecoder));
 const model=useMemo(()=>{
  const object=gltf.scene.clone(true);
  let paintCount=0;
  object.traverse((obj:any)=>{
   if(!obj.isMesh)return;
   obj.castShadow=true;obj.receiveShadow=true;
   const tune=(base:T.Material)=>{
    if(!(base instanceof T.MeshStandardMaterial))return base.clone();
    const m=new T.MeshPhysicalMaterial({
     name:base.name,color:base.color.clone(),map:base.map,normalMap:base.normalMap,
     normalScale:base.normalScale.clone(),metalness:base.metalness,roughness:base.roughness,
     roughnessMap:base.roughnessMap,metalnessMap:base.metalnessMap,
     emissive:base.emissive.clone(),emissiveMap:base.emissiveMap,
     emissiveIntensity:base.emissiveIntensity,alphaMap:base.alphaMap,
     opacity:base.opacity,transparent:base.transparent,alphaTest:base.alphaTest,
     side:base.side,depthWrite:base.depthWrite,vertexColors:base.vertexColors,
     aoMap:base.aoMap,aoMapIntensity:base.aoMapIntensity,
     lightMap:base.lightMap,lightMapIntensity:base.lightMapIntensity
    });
    const n=(base.name||'').toLowerCase();
    m.envMapIntensity=1.65;
    if(n.includes('carpaint')||n.includes('body_paint')||n==='body'){
      paintCount++; m.roughness=.20; m.metalness=.52; m.clearcoat=1;
      m.clearcoatRoughness=.08; m.envMapIntensity=2.1;
    }else if(/glass|window|windscreen|windshield/.test(n)){
      m.roughness=.09; m.metalness=.10; m.clearcoat=.6; m.clearcoatRoughness=.04;
    }else if(/rubber|tire|tyre/.test(n)){
      m.roughness=.91;m.metalness=.01;
    }else if(/rim|wheel|brake|disc|metal/.test(n)){
      m.roughness=.32;m.metalness=.73;
    }else{
      m.roughness=Math.max(.24,m.roughness);
    }
    return m;
   };
   obj.material=Array.isArray(obj.material)?obj.material.map(tune):tune(obj.material);
  });
  const bbox=new T.Box3().setFromObject(object);
  if(bbox.isEmpty())throw Error('Original external P1 GLB is empty');
  const size=bbox.getSize(new T.Vector3()),center=bbox.getCenter(new T.Vector3());
  const scale=5.2/Math.max(size.x,size.y,size.z);
  object.userData.externalModel={file:'mclaren-p1.glb',paintMaterialMatches:paintCount,source:'pedrosoandre/carros'};
  return {object,scale,offset:[-center.x*scale,-bbox.min.y*scale,-center.z*scale] as [number,number,number]};
 },[gltf]);
 return <group rotation={[0,cameras[shot].turn,0]}><group scale={model.scale} position={model.offset}><primitive object={model.object}/></group></group>;
}
function KitWorld({shot}:{shot:number}){
 const kind=shot===1?'garage':'showroom';
 const scene=useMemo(()=>createEnvironment({kind,seed:22,timeOfDay:'night'}),[kind]);
 useEffect(()=>()=>disposeObject(scene),[scene]);
 return <primitive object={scene}/>;
}
function RenderScene({shot}:{shot:number}){
 const {width,height}=useVideoConfig();
 return <ThreeCanvas width={width} height={height} shadows camera={{fov:34,near:.01,far:190}}>
  <CameraMotion shot={shot}/>
  <WorldLighting timeOfDay="night" focus={[0,.6,0]}/>
  <color attach="background" args={['#12191c']}/>
  <KitWorld shot={shot}/>
  <directionalLight position={[5,9,7]} color="#fff3e4" intensity={3.5} castShadow
    shadow-mapSize={[2048,2048]} shadow-camera-left={-11} shadow-camera-right={11}
    shadow-camera-top={11} shadow-camera-bottom={-11} shadow-normalBias={.02}/>
  <directionalLight position={[-6,6,-7]} color="#c4edfa" intensity={2.4}/>
  <directionalLight position={[-7,3,5]} color="#ffd1a0" intensity={.85}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]} receiveShadow>
    <planeGeometry args={[11,11]}/><meshStandardMaterial color="#555f60" roughness={.48} metalness={.15}/>
  </mesh>
  <OriginalP1 shot={shot}/>
 </ThreeCanvas>;
}
function MechanicalAngle({target}:{target:'v8'|'ev-drive'}){
 const frame=useCurrentFrame(),{camera}=useThree();
 const mesh=useMemo(()=>createPart({variant:target,cutaway:true}),[target]);
 useEffect(()=>()=>disposeObject(mesh),[mesh]);
 animatePart(mesh,{shaftAngle:frame*.17,compression:(1-Math.cos(frame*.15))*.4,heat:target==='v8'?.13:0});
 const view=partCamera(mesh,false);
 useLayoutEffect(()=>{
  const a=frame*.014;
  const rel=new T.Vector3(...view.position).sub(new T.Vector3(...view.target)).applyAxisAngle(new T.Vector3(0,1,0),a);
  camera.position.copy(new T.Vector3(...view.target).add(rel));
  camera.lookAt(...view.target);camera.updateProjectionMatrix();
 },[camera,frame,target]);
 return <><ambientLight intensity={1.9}/><hemisphereLight args={['#c0dfed','#596366',1.6]}/>
 <directionalLight position={[3,8,5]} intensity={4.0} color="#ffffff"/>
 <directionalLight position={[-5,2,-3]} intensity={2.3} color="#9bdddf"/>
 <primitive object={mesh}/></>;
}
function PartsKitInset({shot}:{shot:number}){
 const target=shot===1?'v8':'ev-drive';const frame=useCurrentFrame();
 const alpha=Math.min(1,frame/12,(SHOT-frame)/12);
 return <div style={{position:'absolute',top:343,left:50,width:465,height:266,opacity:alpha,
   border:'1px solid rgba(196,230,232,.35)',borderRadius:11,overflow:'hidden',
   background:'linear-gradient(110deg,rgba(9,19,25,.90),rgba(16,28,34,.74))',
   boxShadow:'0 9px 42px rgba(0,0,0,.3)'}}>
   <div style={{position:'absolute',top:13,left:17,zIndex:2,color:'#bad9de',fontSize:14,letterSpacing:2,fontWeight:700}}>
    {target==='v8'?'YUNEX PARTS KIT / V8 SCHEMATIC':'YUNEX PARTS KIT / ELECTRIC DRIVE'}
   </div>
   <ThreeCanvas width={465} height={266} camera={{fov:39,near:.01,far:100}}>
    <MechanicalAngle target={target}/>
   </ThreeCanvas>
   <div style={{position:'absolute',bottom:9,left:17,color:'#a3b6bd',fontSize:12}}>Illustrative kit mechanism · not McLaren CAD</div>
  </div>;
}
function Shot({shot}:{shot:number}){
 const frame=useCurrentFrame(),conf=sections[shot];
 const fade=Math.min(1,frame/8,(SHOT-frame)/9);
 return <AbsoluteFill style={{color:'#f6f8f6',backgroundColor:'#101820',fontFamily:'Arial, Helvetica, sans-serif'}}>
  <RenderScene shot={shot}/>
  <div style={{position:'absolute',inset:0,pointerEvents:'none',
  background:'linear-gradient(180deg,rgba(2,8,10,.80) 0%,rgba(2,8,10,.28) 30%,transparent 46%,transparent 69%,rgba(2,8,10,.7) 100%)'}}/>
  <div style={{position:'absolute',top:80,left:50,right:45,opacity:fade}}>
    <div style={{fontWeight:700,fontSize:16,letterSpacing:3.6,color:conf.accent}}>{conf.kicker}</div>
    <div style={{fontWeight:900,fontSize:53,letterSpacing:-1.8,lineHeight:1.07,marginTop:19,maxWidth:815}}>{conf.headline}</div>
    <div style={{fontWeight:500,fontSize:23,lineHeight:1.25,marginTop:18,color:'#e8edef',maxWidth:780}}>{conf.sub}</div>
  </div>
  {(shot===1||shot===2)&&<PartsKitInset shot={shot}/>}
  <div style={{position:'absolute',bottom:106,left:50,right:50,display:'flex',justifyContent:'space-between',fontSize:15,
   color:'#c9d3d5',fontWeight:700,letterSpacing:2}}>
   <span>YUNEX / P1  ·  REAL GLB</span><span>{shot+1} / 4</span>
  </div>
  <div style={{position:'absolute',bottom:91,left:50,right:50,height:3,background:'rgba(210,239,234,.25)'}}>
    <div style={{width:((shot+frame/SHOT)/4*100)+'%',height:'100%',background:conf.accent}}/>
  </div>
  <div style={{position:'absolute',left:50,bottom:60,color:'#9fb2b7',fontSize:13}}>Car mesh: vecarz / Sketchfab, CC BY · kit mechanisms are illustrative</div>
 </AbsoluteFill>;
}
const Film:React.FC=()=> <AbsoluteFill>{sections.map((_,i)=><Sequence key={i} from={i*SHOT} durationInFrames={SHOT}><Shot shot={i}/></Sequence>)}</AbsoluteFill>;
const Root:React.FC=()=> <Composition id="P1StudioV2" component={Film} width={900} height={1600} fps={FPS} durationInFrames={SHOT*4}/>;
registerRoot(Root);
