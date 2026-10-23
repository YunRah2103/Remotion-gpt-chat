import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Composition, interpolate, registerRoot, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {Box3, Vector3} from 'three';

const FPS=24;
const SHOT_FRAMES=72;
const CAR_PATH=staticFile('p1-hybrid/mclaren-p1.glb');
// Every shot uses the original McLaren P1 GLB, not a procedural vehicle substitute.
const STORY=[
  {eyebrow:'MCLAREN P1 · HYBRID HYPERCAR',title:'903 BHP.',subtitle:'One V8. One electric motor. Pure response.',accent:'#ffae42'},
  {eyebrow:'01 / THE COMBUSTION',title:'TWIN-TURBO V8',subtitle:'3.8 litres of petrol-powered fury.',accent:'#ffae42'},
  {eyebrow:'02 / THE ELECTRIC BOOST',title:'INSTANT TORQUE.',subtitle:'An electric motor sharpens the throttle response.',accent:'#69e4ec'},
  {eyebrow:'03 / THE RESULT',title:'2.8 SECONDS.',subtitle:'0–62 mph. The power of two systems, working as one.',accent:'#ffae42'},
] as const;

const moves=[
  {a:[8.5,3.1,12.6],b:[6.6,2.5,10.8],target:[0,0.82,0],yaw:-0.35},
  {a:[11.7,3.0,1.5],b:[10.8,2.6,-4.1],target:[0,0.72,0],yaw:-0.35},
  {a:[6.4,3.2,-11.7],b:[-1.8,2.7,-11.7],target:[0,0.8,0],yaw:-0.35},
  {a:[-10.5,2.9,9.9],b:[-7.2,2.4,11.1],target:[0,0.87,0],yaw:-0.35},
] as const;
const smooth=(t:number)=>t*t*(3-2*t);
function MotionCamera({shot}:{shot:number}){
  const frame=useCurrentFrame();const {camera}=useThree();
  useLayoutEffect(()=>{
    const m=moves[shot],t=smooth(Math.max(0,Math.min(1,frame/(SHOT_FRAMES-1))));
    const p=m.a.map((v,i)=>v+(m.b[i]-v)*t);
    camera.position.set(p[0],p[1],p[2]);
    camera.lookAt(m.target[0],m.target[1],m.target[2]);
    camera.updateProjectionMatrix();
  },[camera,frame,shot]);
  return null;
}
function OriginalMcLaren({shot}:{shot:number}){
  const source=useLoader(GLTFLoader,CAR_PATH,loader=>loader.setMeshoptDecoder(MeshoptDecoder));
  const model=useMemo(()=>{
    const copy=source.scene.clone(true);
    copy.traverse((obj:any)=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
    copy.updateMatrixWorld(true);
    const bound=new Box3().setFromObject(copy);
    if(bound.isEmpty())throw Error('Real P1 GLB has empty model bounds');
    const dims=bound.getSize(new Vector3());const mid=bound.getCenter(new Vector3());
    const s=5.2/Math.max(dims.x,dims.y,dims.z);
    return {object:copy,scale:s,offset:[-mid.x*s,-bound.min.y*s,-mid.z*s] as [number,number,number]};
  },[source]);
  return <group rotation={[0,moves[shot].yaw,0]}>
    <group position={model.offset} scale={model.scale}><primitive object={model.object}/></group>
  </group>;
}
function Stage({shot}:{shot:number}){
  const {width,height}=useVideoConfig();
  return <ThreeCanvas width={width} height={height} shadows camera={{near:0.01,far:140,fov:35}}>
    <color attach="background" args={['#080d14']}/>
    <fog attach="fog" args={['#080d14',23,53]}/>
    <MotionCamera shot={shot}/>
    <hemisphereLight args={['#e7efff','#0c1824',2.0]}/>
    <ambientLight intensity={0.62}/>
    <directionalLight castShadow position={[-5,13,8]} intensity={3.8} color="#f2f8ff"
      shadow-mapSize={[2048,2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12}/>
    <directionalLight position={[4,7,-8]} intensity={3.4} color="#84dbe7"/>
    <directionalLight position={[12,2,3]} intensity={1.2} color="#ffbc69"/>
    <spotLight position={[-7,8,-1]} intensity={125} distance={31} angle={0.68} penumbra={0.8} color="#81c8ff"/>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.055,0]}>
      <planeGeometry args={[90,90]}/>
      <meshStandardMaterial color="#151e28" metalness={0.62} roughness={0.38}/>
    </mesh>
    <gridHelper args={[34,34,'#1f424c','#142731']} position={[0,-.045,0]}/>
    <mesh position={[0,6,-14]}><boxGeometry args={[26,.095,.15]}/><meshBasicMaterial color="#8cdbea"/></mesh>
    <mesh position={[-12,4,-6]} rotation={[0,0,0.09]}><boxGeometry args={[.10,10,.12]}/><meshBasicMaterial color="#456e83"/></mesh>
    <mesh position={[12,4,-6]} rotation={[0,0,-0.09]}><boxGeometry args={[.10,10,.12]}/><meshBasicMaterial color="#456e83"/></mesh>
    <OriginalMcLaren shot={shot}/>
  </ThreeCanvas>;
}
const Shot:React.FC<{shot:number}>=({shot})=>{
  const frame=useCurrentFrame(),{width,height}=useVideoConfig(),story=STORY[shot];
  const fadeIn=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const fadeOut=interpolate(frame,[SHOT_FRAMES-12,SHOT_FRAMES-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const opacity=Math.min(fadeIn,fadeOut);
  const move=interpolate(frame,[0,14],[24,0],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{backgroundColor:'#080d14',color:'#f6faff',fontFamily:'Arial, Helvetica, sans-serif',overflow:'hidden'}}>
    <Stage shot={shot}/>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(4,8,12,.9) 0%,rgba(4,8,12,.12) 33%,transparent 57%,rgba(4,8,12,.55) 100%)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:62,right:62,top:110,opacity,transform:'translateY('+move+'px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:15,marginBottom:23}}>
        <div style={{width:38,height:4,backgroundColor:story.accent}}/>
        <div style={{fontSize:19,fontWeight:700,letterSpacing:4,color:'#b6ccd4'}}>{story.eyebrow}</div>
      </div>
      <div style={{fontWeight:900,fontSize:shot===0?100:shot===3?80:71,lineHeight:.99,letterSpacing:-3.7,
        maxWidth:width-120,textShadow:'0 8px 32px rgba(0,0,0,.55)'}}>{story.title}</div>
      <div style={{fontWeight:500,fontSize:27,color:'#e0e9ec',marginTop:21,lineHeight:1.28,maxWidth:800}}>{story.subtitle}</div>
    </div>
    <div style={{position:'absolute',left:62,right:62,bottom:106,display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,letterSpacing:2,color:'#b9cad1'}}>
      <span>YUNEX / P1 STUDY</span><span>{String(shot+1).padStart(2,'0')} / 04</span>
    </div>
    <div style={{position:'absolute',left:62,right:62,bottom:89,height:3,background:'rgba(255,255,255,.20)'}}>
      <div style={{width:((shot+frame/SHOT_FRAMES)/4*100)+'%',height:'100%',background:story.accent}}/>
    </div>
    <div style={{position:'absolute',left:62,bottom:57,fontSize:14,color:'#7e969f'}}>Original P1 3D: vecarz (CC BY) · external model</div>
  </AbsoluteFill>;
};
const Film:React.FC=()=> <AbsoluteFill>{STORY.map((_,i)=>
  <Sequence key={i} from={i*SHOT_FRAMES} durationInFrames={SHOT_FRAMES}><Shot shot={i}/></Sequence>
)}</AbsoluteFill>;
const Root:React.FC=()=> <Composition id="P1HybridCinematic" component={Film} durationInFrames={STORY.length*SHOT_FRAMES} fps={FPS} width={900} height={1600}/>;
registerRoot(Root);
