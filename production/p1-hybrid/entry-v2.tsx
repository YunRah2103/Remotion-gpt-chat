/**
 * McLaren P1 REALISM STUDY V2.
 * Uses real source GLB. No procedural car replacement.
 * Reuses YUNEX world-kit Environment/WorldLighting and its RoomEnvironment PMREM.
 * Original V1 remains available at production/p1-hybrid/entry.tsx.
 */
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Composition, interpolate, registerRoot, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {Environment, WorldLighting, SceneProp} from '../../src/yunex/world-kit/components.tsx';

const FRAME_RATE=24;
const SHOT_LENGTH=54;
const P1=staticFile('p1-hybrid/mclaren-p1.glb');
const STORY=[
 {eyebrow:'THE MCLAREN P1',headline:'TWO POWER SOURCES.',detail:'ONE HYPERCAR.',number:'01',accent:'#cf9662'},
 {eyebrow:'THE POWERTRAIN',headline:'3.8L TWIN-TURBO V8.',detail:'PETROL POWER, ELECTRIC RESPONSE.',number:'02',accent:'#cf9662'},
 {eyebrow:'INSTANT RESPONSE',headline:'ELECTRIC TORQUE.',detail:'NO WAITING FOR THE THROTTLE.',number:'03',accent:'#6daeb7'},
 {eyebrow:'THE RESULT',headline:'903 BHP.',detail:'0–62 MPH IN 2.8 SECONDS.',number:'04',accent:'#cf9662'},
] as const;
const CAMERA=[
 {a:[7.3,2.25,10.4],b:[5.2,1.85,8.9],t:[0,.84,0],yaw:-.35},
 {a:[10.6,2.05,1.1],b:[8.0,1.70,-1.4],t:[0,.78,0],yaw:-.35},
 {a:[1.5,2.75,-9.5],b:[-2.3,2.2,-8.4],t:[0,.91,0],yaw:-.35},
 {a:[-9.0,2.45,7.8],b:[-6.7,1.95,8.6],t:[0,.88,0],yaw:-.35},
] as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(t:number)=>t*t*(3-2*t);
const MODEL_INFO={creator:'vecarz',collection:'pedrosoandre/carros',license:'CC BY 4.0'};
function CameraMove({shot}:{shot:number}){
 const {camera}=useThree(),frame=useCurrentFrame();
 useLayoutEffect(()=>{
  const c=CAMERA[shot],p=c.a.map((x,i)=>x+(c.b[i]-x)*ease(clamp(frame/(SHOT_LENGTH-1))));
  camera.position.set(p[0],p[1],p[2]);
  camera.lookAt(c.t[0],c.t[1],c.t[2]);
  camera.updateProjectionMatrix();
 },[camera,frame,shot]);
 return null;
}
function CinematicRenderer(){
 const {gl,scene}=useThree();
 useLayoutEffect(()=>{
  const old={tone:gl.toneMapping,exp:gl.toneMappingExposure,color:gl.outputColorSpace,intensity:scene.environmentIntensity};
  gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.10;gl.outputColorSpace=T.SRGBColorSpace;
  // The world-kit installs RoomEnvironment reflections separately.
  return ()=>{gl.toneMapping=old.tone;gl.toneMappingExposure=old.exp;gl.outputColorSpace=old.color;scene.environmentIntensity=old.intensity};
 },[gl,scene]);
 return null;
}
function TrueP1({shot}:{shot:number}){
 const loaded=useLoader(GLTFLoader,P1,loader=>loader.setMeshoptDecoder(MeshoptDecoder));
 const hero=useMemo(()=>{
  const obj=loaded.scene.clone(true);
  obj.updateMatrixWorld(true);
  const bound=new T.Box3().setFromObject(obj),center=bound.getCenter(new T.Vector3()),size=bound.getSize(new T.Vector3());
  if(bound.isEmpty())throw Error('Source GLB contains no geometry');
  const scale=5.2/Math.max(size.x,size.y,size.z);
  let paintCount=0,meshCount=0;
  obj.traverse((node:any)=>{
    if(!node.isMesh)return;
    meshCount++;node.castShadow=true;node.receiveShadow=true;
    const tune=(base:T.Material)=>{
      const m=base.clone() as T.MeshStandardMaterial;const id=((base.name??'')+' '+(node.name??'')).toLowerCase();
      if(m instanceof T.MeshStandardMaterial){
       m.envMapIntensity=1.45;
       if(/carpaint|car.?paint|body.?paint|painted.?body|paintwork/.test(id)){
        paintCount++;
        // Keep the original colour and textures; correct BRDF response instead of repainting it.
        const phys=new T.MeshPhysicalMaterial({
         name:base.name+'-cinematic',
         color:m.color.clone(),
         map:m.map,
         normalMap:m.normalMap,
         roughnessMap:m.roughnessMap,
         metalnessMap:m.metalnessMap,
         aoMap:m.aoMap,
         metalness:.50,
         roughness:.22,
         clearcoat:.95,
         clearcoatRoughness:.11,
         envMapIntensity:1.65,
         side:m.side,
        });
        phys.needsUpdate=true;
        m.dispose();
        return phys;
       }
       // Rubber/carbon remain matte; no blanket shiny-plastic treatment.
       if(/tyre|tire|rubber|carbon|interior/.test(id))m.roughness=Math.max(.63,m.roughness);
       m.needsUpdate=true;
      }
      return m;
    };
    node.material=Array.isArray(node.material)?node.material.map(tune):tune(node.material);
  });
  obj.userData.sourceModel={...MODEL_INFO,meshCount,paintCount,source:'original Meshopt GLB'};
  return {obj,scale,offset:[-center.x*scale,-bound.min.y*scale+.015,-center.z*scale] as [number,number,number]};
 },[loaded.scene]);
 return <group rotation={[0,CAMERA[shot].yaw,0]}>
   <group position={hero.offset} scale={hero.scale}><primitive object={hero.obj}/></group>
 </group>;
}
function PracticalLighting({workshop}:{workshop:boolean}){
 return <>
  {/* Explicit broad studio panels create coherent highlights across curved bodywork. */}
  {[-8,-2,4,10].map((x)=><group key={x} position={[x,6.0,1]}>
   <mesh rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[2.15,8.5]}/>
    <meshBasicMaterial color={workshop?'#f7e7d3':'#e3f1ef'} toneMapped={false} side={T.DoubleSide}/>
   </mesh>
  </group>)}
  <directionalLight castShadow position={[-5,11,8]} intensity={2.5} color="#fff5e9"
   shadow-mapSize={[2048,2048]} shadow-camera-left={-12} shadow-camera-right={12}
   shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-.0002}/>
  <directionalLight position={[7,7,-4]} intensity={1.75} color="#cadfec"/>
  <directionalLight position={[-2,4,-9]} intensity={1.0} color="#b8d6e0"/>
  <spotLight position={[1,7,8]} angle={.57} penumbra={.85} intensity={40} distance={20} color="#fff2e4"/>
 </>;
}
function SetAndCamera({shot}:{shot:number}){
 const {width,height}=useVideoConfig();
 const workshop=shot===1;
 return <ThreeCanvas width={width} height={height} shadows camera={{near:.01,far:90,fov:33}}>
  <WorldLighting studio focus={[0,.8,0]}/>
  <color attach="background" args={['#161c23']}/>
  <fog attach="fog" args={['#171f25',24,60]}/>
  <CinematicRenderer/>
  <Environment kind={workshop?'garage':'showroom'} timeOfDay={workshop?'dusk':'day'} seed={22}/>
  {/* Modified concrete presentation floor overlays the environment's overly-flat tiles. */}
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.019,0]}>
    <planeGeometry args={[27,25]}/>
    <meshPhysicalMaterial color={workshop?'#4a4d4b':'#737e82'} metalness={.15} roughness={workshop?.72:.38} clearcoat={workshop?.05:.28} clearcoatRoughness={.32}/>
  </mesh>
  <PracticalLighting workshop={workshop}/>
  {workshop&&<SceneProp kind="tyre-stack" position={[-11.4,.025,-6.4]}/>}
  <CameraMove shot={shot}/>
  <TrueP1 shot={shot}/>
 </ThreeCanvas>;
}
function Clip({shot}:{shot:number}){
 const f=useCurrentFrame();const info=STORY[shot];
 const show=interpolate(f,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const exit=interpolate(f,[SHOT_LENGTH-9,SHOT_LENGTH-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const fade=Math.min(show,exit);
 return <AbsoluteFill style={{background:'#171f25',color:'#f3f4ef',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <SetAndCamera shot={shot}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(8,12,15,.85),rgba(8,12,15,.04) 31%,rgba(8,12,15,0) 68%,rgba(8,12,15,.6))',pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:52,right:52,top:96,opacity:fade}}>
   <div style={{fontSize:15,letterSpacing:4.0,fontWeight:700,color:'#cad5d3'}}>{info.eyebrow}</div>
   <div style={{height:3,width:63,background:info.accent,margin:'22px 0 24px'}}/>
   <div style={{fontSize:shot===0?67:shot===3?88:57,fontWeight:900,letterSpacing:-2.2,lineHeight:.98,textShadow:'0 2px 12px #0008'}}>{info.headline}</div>
   <div style={{fontSize:20,letterSpacing:1.3,marginTop:17,color:'#d5d9d7',fontWeight:600}}>{info.detail}</div>
  </div>
  <div style={{position:'absolute',left:52,right:52,bottom:106,display:'flex',justifyContent:'space-between',alignItems:'end'}}>
   <span style={{fontSize:13,letterSpacing:3,color:'#f5e7d3',fontWeight:700}}>P1 / THE HYBRID FORMULA</span>
   <span style={{fontSize:15,color:'#f6e9d6'}}>{info.number}/04</span>
  </div>
  <div style={{position:'absolute',left:52,right:52,bottom:84,height:2,background:'#8d9e9b55'}}>
   <div style={{height:'100%',background:info.accent,width:((shot+f/SHOT_LENGTH)/4*100)+'%' }}/>
  </div>
  <div style={{position:'absolute',bottom:44,left:52,fontSize:11,color:'#cdd8d0aa'}}>REAL McLAREN P1 GLB · CREATOR vecarz · CC BY 4.0</div>
 </AbsoluteFill>;
}
const Reel:React.FC=()=> <AbsoluteFill>{STORY.map((_,i)=><Sequence key={i} from={i*SHOT_LENGTH} durationInFrames={SHOT_LENGTH}><Clip shot={i}/></Sequence>)}</AbsoluteFill>;
const Root:React.FC=()=> <Composition id="P1RealismV2" component={Reel} durationInFrames={SHOT_LENGTH*STORY.length} fps={FRAME_RATE} width={900} height={1600}/>;
registerRoot(Root);
