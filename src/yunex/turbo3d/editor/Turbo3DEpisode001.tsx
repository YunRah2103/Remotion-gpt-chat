/** YUNEX A6 first-cut assembly. Review pass, NOT picture lock.
 * Specialist code is imported unchanged from pinned real-model integration QC.
 * Narration cue positions measured from user-supplied 21.216s MP3.
 */
import React,{useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {VehicleWorld} from '../vehicle/VehicleWorld';
import {TurboMechanism} from '../mechanism/TurboMechanism';
import {TurboFlow,type TurboFlowPhase} from '../airflow/TurboFlow';
import {CinematicFlow} from '../airflow/CinematicFlow';
import {A2_CANDIDATE_PORTS,A2_CANDIDATE_ROUTES} from '../airflow/A2CandidateAdapter';
import {TURBO_PIVOTS,TURBO_PORTS} from '../mechanism/ports';
import {CameraDirector} from '../cinematics/CameraDirector';
import {KineticLabel} from '../cinematics/KineticLabels';
import type {Anchors,Shot,Vec3} from '../cinematics/cameraMath';
import {YunexLights,YUNEX_LOOK,RoadAtmosphere,ExhaustHeat,applyYunexMaterials} from '../lookdev/YunexLookdev';
import {YunexReflectionEnvironment} from '../lookdev/YunexReflectionEnvironment';

export const FILM_FRAMES=720; // 24s at 30fps, speech ends at ~21.09s
export type FilmShot='hook'|'exhaust'|'shaft'|'compressor'|'power'|'cooler'|'road';
export const FIRST_CUT_SHOTS:ReadonlyArray<{id:FilmShot;start:number;end:number;purpose:string}>=[
 {id:'hook',start:0,end:75,purpose:'Immediate spinning turbine / question'},
 {id:'exhaust',start:75,end:174,purpose:'Hot exhaust gas drives turbine'},
 {id:'shaft',start:174,end:258,purpose:'Continuous common shaft reveal'},
 {id:'compressor',start:258,end:352,purpose:'Separate clean intake / compressor'},
 {id:'power',start:352,end:482,purpose:'Air, fuel, physical power stroke'},
 {id:'cooler',start:482,end:587,purpose:'Existing charge cooled in intercooler'},
 {id:'road',start:587,end:720,purpose:'V6.3 teal coupe / final car payoff'},
];
const asVec=(x:readonly [number,number,number]):Vec3=>[x[0],x[1],x[2]];
const MECH_ANCHORS:Anchors={
 TURBINE:asVec(TURBO_PIVOTS.TURBINE_ROTOR),
 SHAFT:asVec(TURBO_PIVOTS.SHAFT),
 COMPRESSOR:asVec(TURBO_PIVOTS.COMPRESSOR_ROTOR),
 EXHAUST_IN:asVec(TURBO_PORTS.EXHAUST_IN),
 COMPRESSED_AIR_OUT:asVec(TURBO_PORTS.COMPRESSED_AIR_OUT),
 INTERCOOLER_OUT:asVec(TURBO_PORTS.INTERCOOLER_OUT),
 ENGINE_INTAKE:asVec(TURBO_PORTS.ENGINE_INTAKE),
};
const CAR_ANCHORS:Anchors={CAR:[0,.76,0]};
/** Parent-local A6 adapter: keep A1/A2 mesh sources untouched and dispose materials. */
const SurfaceAdapter:React.FC<{children:React.ReactNode}>=({children})=>{
 const group=useRef<THREE.Group>(null);
 useLayoutEffect(()=>{if(!group.current)return;return applyYunexMaterials(group.current);},[]);
 return <group ref={group}>{children}</group>;
};
/** Correct A3's preview-only depthTest=false for the actual assembled film.
 * No change is made to their original shaders/geometry/source files.
 * The cutaway rotor glint is intentionally separately handled by A5.
 */
const OccludedAirflow:React.FC<{children:React.ReactNode}>=({children})=>{
 const group=useRef<THREE.Group>(null);
 useLayoutEffect(()=>{
  const materials:THREE.Material[]=[];
  group.current?.traverse(obj=>{
   if(obj instanceof THREE.Mesh && obj.material){
    const mm=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const m of mm){if(m.depthTest===false){materials.push(m);m.depthTest=true;m.depthWrite=false;m.needsUpdate=true;}}
   }
  });
  return ()=>{for(const m of materials){m.depthTest=false;m.needsUpdate=true;}};
 },[]);
 return <group ref={group}>{children}</group>;
};
/** Editorial camera corrections in A6's exclusive path, never alter A4's source rigs.
 * Looking forward from z=-1.10 at the actual cylinder X-ray mounted at z=-2.37
 * avoids the large turbo housing intersecting the line of sight.
 */
const EngineCamera:React.FC<{frame:number;duration:number}>=({frame,duration})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const t=Math.min(1,frame/Math.max(1,duration-1));
  camera.position.set(.25-.37*t,-.12+.05*t,-.60-.45*t);
  camera.up.set(0,1,0);
  camera.lookAt(-.35,-.63,-2.38);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=46-5*t;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();
 },[camera,frame,duration]);
 return null;
};
/** Keep the full compressor and its clean-air port in frame: previous macro cut off
 * the majority of the rotor and hid the physical intake connection.
 */
const CompressorCamera:React.FC<{frame:number;duration:number}>=({frame,duration})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const t=Math.min(1,frame/Math.max(1,duration-1));
  camera.position.set(3.95-.45*t,1.10-.18*t,4.55-.35*t);
  camera.up.set(0,1,0);
  camera.lookAt(1.62+.32*t,.15+.10*t,-.12);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=40;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();
 },[camera,frame,duration]);
 return null;
};
/** A3's piston is explanatory: one combustion power stroke, never claimed as measured CAD. */
const EnginePowerWindow:React.FC<{frame:number}>=({frame})=>{
 const phase=(frame%27)/27;
 const ignition=Math.exp(-Math.pow((phase-.16)/.13,2));
 const t=Math.max(0,Math.min(1,(phase-.2)/.56));
 const displacement=-.29*t*t*(3-2*t);
 return <group position={[-.35,-.54,-2.37]} name="A6_POWER_CUTAWAY_OF_A2_ENGINE">
  <mesh position={[0,-.06,0]}><cylinderGeometry args={[.365,.365,.95,28,1,true]}/>
    <meshPhysicalMaterial color="#8FB7C6" metalness={.48} roughness={.22} transparent opacity={.23} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
  <mesh position={[0,-.25+displacement,0]}><cylinderGeometry args={[.31,.31,.16,28]}/>
    <meshStandardMaterial color="#C5D2D3" metalness={.88} roughness={.19}/>
  </mesh>
  <mesh position={[0,.12,0]} scale={[.8+ignition*.35,.4+ignition*.65,.8+ignition*.35]}>
    <sphereGeometry args={[.32,18,12]}/>
    <meshBasicMaterial color="#FF9942" transparent opacity={.12+.76*ignition} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false}/>
  </mesh>
  <pointLight color="#FF8D36" intensity={3*ignition} distance={2.1}/>
 </group>;
};
const FilmMechanics:React.FC<{shot:FilmShot;frame:number;duration:number}>=({shot,frame,duration})=>{
 const road=shot==='road',full=['exhaust','power','cooler'].includes(shot);
 const cameraShot:Shot=shot==='hook'?'hookOrbit':shot==='exhaust'?'exhaustTrack':shot==='shaft'?'shaftFollow':shot==='compressor'?'compressorReveal':'chargeGlide';
 const phase:TurboFlowPhase=shot==='exhaust'?'exhaust':shot==='hook'?'turbine':shot==='shaft'?'turbine':shot==='compressor'?'compressor':shot==='power'?'combustion':'intercooler';
 if(road)return <>
  <YunexReflectionEnvironment variant="road" intensity={.88}/>
  <SurfaceAdapter><VehicleWorld frame={frame+587} variant="hero" travelMeters={frame*.40+28}/></SurfaceAdapter>
  <YunexLights sceneVariant="road" augment shadows={false}/>
  <RoadAtmosphere frame={frame} visibility={.66}/>
  <CameraDirector frame={frame} shot="roadHero" anchors={CAR_ANCHORS} durationInFrames={duration}/>
 </>;
 return <>
  <color attach="background" args={[YUNEX_LOOK.background]}/>
  <fog attach="fog" args={[YUNEX_LOOK.background,13,30]}/>
  <YunexReflectionEnvironment variant={full?'charge':'turbine'} intensity={.88}/>
  <YunexLights sceneVariant={full?'charge':'turbine'} shadows/>
  <mesh position={[0,-2.66,-.9]} receiveShadow>
   <boxGeometry args={[18,.13,17]}/>
   <meshStandardMaterial color="#10222C" metalness={.2} roughness={.8}/>
  </mesh>
  <SurfaceAdapter><TurboMechanism frame={frame} variant={full?'full':'turbo'} cutaway={1}/></SurfaceAdapter>
  {shot!=='shaft'&&<OccludedAirflow>
   <TurboFlow frame={frame} phase={phase} ports={A2_CANDIDATE_PORTS} routes={A2_CANDIDATE_ROUTES} intensity={shot==='power'?.5:.32}/>
   <CinematicFlow frame={frame} phase={phase} intensity={shot==='power'?.74:.65}/>
  </OccludedAirflow>}
  {(shot==='hook'||shot==='exhaust')&&<ExhaustHeat frame={frame} intensity={shot==='exhaust'?.8:.48}/>}
  {shot==='power'&&<EnginePowerWindow frame={frame}/>}
  {shot==='power'?<EngineCamera frame={frame} duration={duration}/>:shot==='compressor'?<CompressorCamera frame={frame} duration={duration}/>:<CameraDirector frame={shot==='cooler'?Math.floor(55+frame*.60):frame} shot={cameraShot} anchors={MECH_ANCHORS} durationInFrames={duration}/>}
 </>;
};
const AccentTag:React.FC<{name:string;color:string;frame:number;duration:number}>=({name,color,frame,duration})=>{
 const fadeIn=Math.min(1,frame/9),fadeOut=Math.min(1,(duration-1-frame)/10),opacity=Math.max(0,Math.min(fadeIn,fadeOut));
 return <div style={{position:'absolute',top:420,left:118,opacity,transform:`translateY(${(1-fadeIn)*12}px)`,fontFamily:'Arial,Helvetica,sans-serif',fontSize:45,fontWeight:850,letterSpacing:2.1,color:'#F1F7F6',textShadow:'0 3px 12px rgba(0,0,0,.8)',pointerEvents:'none'}}>
  <div style={{height:4,width:66,background:color,marginBottom:15}}/>{name}
 </div>;
};
const FilmShotView:React.FC<{shot:FilmShot;duration:number}>=({shot,duration})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const tag=shot==='hook'?'TURBINE':shot==='exhaust'?'HOT EXHAUST':shot==='shaft'?'ONE SHAFT':shot==='compressor'?'CLEAN AIR':shot==='power'?'MORE POWER':shot==='cooler'?'INTERCOOLER':null;
 const color=(shot==='hook'||shot==='exhaust'||shot==='power')?'#FF8A36':shot==='shaft'?'#D2E8E6':'#53CFFF';
 const edge=Math.max(0,Math.min(1,(5-Math.min(frame,duration-1-frame))/5));
 return <AbsoluteFill style={{background:'#08121D',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows gl={{antialias:true,preserveDrawingBuffer:true}} camera={{position:[0,1,7],fov:40,near:.08,far:180}}>
   <FilmMechanics shot={shot} frame={frame} duration={duration}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(1,5,9,.14) 0%,transparent 24%,transparent 77%,rgba(1,6,10,.17) 100%)',pointerEvents:'none'}}/>
  {tag&&<AccentTag frame={frame} duration={duration} name={tag} color={color}/>}
  {frame>duration-6&&shot!=='road'?<AbsoluteFill style={{background:color,opacity:.075*edge,pointerEvents:'none'}}/>:null}
 </AbsoluteFill>;
};
export const Turbo3DEpisode001:React.FC=()=>{
 return <AbsoluteFill style={{background:'#08121D'}}>
  {FIRST_CUT_SHOTS.map(s=><Sequence key={s.id} from={s.start} durationInFrames={s.end-s.start} name={s.id}>
   <FilmShotView shot={s.id} duration={s.end-s.start}/>
  </Sequence>)}
 </AbsoluteFill>;
};
