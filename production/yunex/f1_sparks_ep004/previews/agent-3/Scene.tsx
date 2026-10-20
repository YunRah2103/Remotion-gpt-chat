/** Agent 3 integrated native camera review — exact Agent 1/2/4 source.
 * No illustrative sparks, duplicate hero/road, temporal particle loop or
 * independent vehicle trajectory. Each retimeable shot samples Agent 2.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {F1HeroVehicle,getSkidDescriptors} from '../../mechanics/index.ts';
import {sampleDynamics,sampleContactDrivenSparks,localToWorld} from '../../physics/index.ts';
import {NightCircuitWorld} from '../../look/index.ts';
import type {ShotId,SparkParticle,CameraPose,VehicleMotionState} from '../../shared/contract.ts';
import {sampleRetimedShotCamera,cameraLocalToWorld} from '../../cinema/cameras.ts';
import {ApplyCameraPose} from '../../cinema/ShotCamera.tsx';
import {CutawayHero} from './CutawayHero.tsx';

const SKIDS=getSkidDescriptors();
export const INTEGRATED_SOURCE='Agent 1 actual hero + Agent 2 signed-gap particles + Agent 4 real night road';
export type CameraBeat=Readonly<{
  shot:ShotId;fromSec:number;durationSec:number;
  /** Agent 2's original absolute-time route; editorial replay is retimeable. */
  startDistanceM:number; startTimeSec:number; playRate:number;
}>;
export const CAMERA_SEQUENCE:readonly CameraBeat[]=[
  {shot:'rear-mystery',fromSec:0,durationSec:2.25,startDistanceM:63.55,startTimeSec:.13,playRate:.21},
  {shot:'underfloor-reveal',fromSec:2.25,durationSec:3.55,startDistanceM:132.30,startTimeSec:.055,playRate:.033},
  {shot:'contact-macro',fromSec:5.80,durationSec:2.30,startDistanceM:134.00,startTimeSec:.04,playRate:.030},
  {shot:'racing-payoff',fromSec:8.10,durationSec:2.90,startDistanceM:63.55,startTimeSec:.145,playRate:.22},
];
export const OPENING_BEAT:CameraBeat={
  shot:'spark-hook',fromSec:0,durationSec:5,startDistanceM:63.65,startTimeSec:.145,playRate:.30,
};
export function previewBeat(screenSec:number,hook:boolean):{beat:CameraBeat;localSec:number;physicsSec:number}{
  if(!Number.isFinite(screenSec)||screenSec<0)throw new Error('invalid sequence time');
  const beat=hook?OPENING_BEAT:CAMERA_SEQUENCE.find(b=>screenSec<b.fromSec+b.durationSec)??CAMERA_SEQUENCE[CAMERA_SEQUENCE.length-1];
  const localSec=Math.min(beat.durationSec,Math.max(0,screenSec-beat.fromSec));
  // Editorial 1-second high-speed-camera ramp lets the naturally brief actual
  // metal-contact shower remain legible, without spawning or repeating sparks.
  const storyMotionTime=hook?Math.min(localSec,1.0)*.09+Math.max(0,localSec-1.0)*.30:localSec*beat.playRate;
  return {beat,localSec,physicsSec:beat.startTimeSec+storyMotionTime};
}
/** Decorative geometry is prohibited: each filament is a camera-readable
 * visualisation of an actual Agent 2 particle with real skid-birth history.
 * The warm trail points along its computed velocity, not a random screen streak.
 */
const ContactSparkVisuals:React.FC<{particles:readonly SparkParticle[]}>=({particles})=>{
  const shown=particles.filter(p=>p.luminance01>.08).slice(-115);
  return <>
    {shown.map(p=>{
      const direction=new THREE.Vector3(...p.velocityWorld);
      if(direction.lengthSq()<1e-9)direction.set(0,0,1);
      // Camera shutter integration of the particle's real instantaneous
      // velocity (~1/50 s), not a synthetic emitter or screen-space flare.
      const size=.010+.013*p.luminance01;
      const length=.065+.32*Math.min(1,direction.length()/47)*p.luminance01;
      const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize());
      const whiteHot=p.luminance01>.67;
      return <group key={p.id} position={p.positionWorld} quaternion={quat}>
        <mesh>
          <boxGeometry args={[size,size,length]}/>
          <meshBasicMaterial color={whiteHot?'#fffce5':'#ffc076'} toneMapped={false}/>
        </mesh>
        <mesh>
          <sphereGeometry args={[.010+.012*p.luminance01,7,6]}/>
          <meshBasicMaterial color={whiteHot?'#fff8d4':'#ffad58'} toneMapped={false}/>
        </mesh>
      </group>;
    })}
  </>;
};
/** Anchored 2D engineering leader lines to the exact *unmoved* Agent 1
 * metal and composite 3D mesh coordinates, transformed by Agent 2's motion.
 * Explanatory optics, not replacement hardware or artificial light emission.
 */
function anchorXY(pose:CameraPose,motion:VehicleMotionState,local:readonly [number,number,number]){
  const camera=new THREE.PerspectiveCamera(pose.fovDeg,1080/1920,.025,350);
  camera.position.set(...pose.positionWorld);
  camera.lookAt(...pose.targetWorld);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const p=new THREE.Vector3(...localToWorld([...local],motion)).project(camera);
  return {x:(p.x+1)*540,y:(1-p.y)*960,visible:p.z>-1&&p.z<1};
}
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
const SkidLeaderOverlay:React.FC<{pose:CameraPose;motion:VehicleMotionState;show:boolean}>=({pose,motion,show})=>{
  if(!show)return null;
  const silver=anchorXY(pose,motion,[1.18,.091,-.005]);
  const plank=anchorXY(pose,motion,[.69,.095,-.14]);
  const annotations=[
    {source:silver,title:'METAL SKID',subtitle:'Titanium contact insert',x:110,y:525,color:'#dbf5ff'},
    {source:plank,title:'COMPOSITE PLANK',subtitle:'Non-metallic wear strip',x:540,y:925,color:'#e9b97e'},
  ];
  return <svg viewBox="0 0 1080 1920" width="100%" height="100%"
    style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'visible'}}>
    {annotations.map(a=>a.source.visible&&<g key={a.title}>
      <path d={`M ${a.source.x.toFixed(1)} ${a.source.y.toFixed(1)} L ${a.x+21} ${a.y+20}`}
        stroke={a.color} strokeWidth="3" fill="none" opacity=".85"/>
      <circle cx={a.source.x} cy={a.source.y} r="9" fill={a.color} stroke="#0d1720" strokeWidth="3"/>
      <rect x={a.x} y={a.y} width="405" height="87" rx="13" fill="#0a1825" fillOpacity=".78"
        stroke={a.color} strokeOpacity=".8" strokeWidth="2"/>
      <text x={a.x+17} y={a.y+34} fontSize="25" fontWeight="800" letterSpacing="2"
        fill={a.color}>{a.title}</text>
      <text x={a.x+17} y={a.y+64} fontSize="19" fill="#e5e5df">{a.subtitle}</text>
    </g>)}
    <text x="540" y="1450" textAnchor="middle" fontSize="23" fontWeight="600" fill="#e4f5f6"
      stroke="#121e22" strokeWidth="1.1">OPTICAL CUTAWAY · REAL MOUNTED PARTS</text>
  </svg>;
};

const reportStyle:React.CSSProperties={
  fontFamily:'Arial,Helvetica,sans-serif',color:'#e6eff1',textShadow:'0 2px 12px #000e',
  fontWeight:700,textTransform:'uppercase',letterSpacing:2,
};
export const Agent3Scene:React.FC<{hook:boolean}>=({hook})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),screenSec=frame/fps;
  const {beat,localSec,physicsSec}=previewBeat(screenSec,hook);
  const motion=sampleDynamics(physicsSec,{
    startDistanceM:beat.startDistanceM,speedMps:62,aeroLoad01:1,
  });
  const {particles,contacts}=sampleContactDrivenSparks(physicsSec,motion,SKIDS);
  const camera=sampleRetimedShotCamera(beat.shot,localSec,beat.durationSec,motion);
  // The real tyre and suspension obscure the 65 mm skid when viewed from outside.
  // Switch to a labelled optical section AFTER showing the complete hero moving.
  // The section removes visible shell/wheel meshes only; it does not move the skid.
  const sectioned=beat.shot==='contact-macro'||(beat.shot==='underfloor-reveal'&&localSec>=.92);
  const reveal=beat.shot==='underfloor-reveal'?Math.min(.97,.44+localSec*.20):0;
  const contactActive=contacts.some(c=>c.active);
  return <AbsoluteFill style={{background:'#0a1420'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:[0,3,10],fov:55,near:.025,far:350}}>
      <NightCircuitWorld motion={motion} particles={particles} exposure={.90}/>
      {sectioned&&<>
        {/* Neutral inspection lights show real titanium and plank surfaces;
            no invented hero, skid, glowing contact, or source spark particles. */}
        <pointLight position={cameraLocalToWorld([1.18,1.55,.72],motion)} intensity={6.0} distance={5} decay={2} color='#fff5dd'/>
        <pointLight position={cameraLocalToWorld([.3,.65,-.55],motion)} intensity={2.4} distance={3.5} decay={2} color='#a7d9ec'/>
      </>}
      {sectioned?<CutawayHero motion={motion}/>:<F1HeroVehicle motion={motion} reveal01={reveal}/>}
      <ContactSparkVisuals particles={particles}/>
      <ApplyCameraPose pose={camera} near={.025}/>
    </ThreeCanvas>
    <SkidLeaderOverlay pose={camera} motion={motion} show={sectioned}/>
    <div style={{position:'absolute',top:'6.8%',left:'8%',right:'8%',...reportStyle,fontSize:18,opacity:.86}}>
      YUNEX / EP004 — {hook?'OPENING SHOT':'CAMERA SEQUENCE'}
    </div>
    <div style={{position:'absolute',bottom:'8.4%',left:'8%',right:'8%',...reportStyle,fontSize:24}}>
      {beat.shot.replaceAll('-',' ')}
      {sectioned&&<div style={{fontSize:14,letterSpacing:1,marginTop:7,color:'#f3d7a1'}}>ACTUAL METAL SKID · COMPOSITE PLANK / OPTICAL CUTAWAY</div>}
      <div style={{fontSize:12,letterSpacing:1,fontWeight:400,opacity:.74,marginTop:7,textTransform:'none'}}>
        Metal skid contact: {contactActive?'YES':'clear'} · Authentic physics particles: {particles.length}
      </div>
    </div>
  </AbsoluteFill>;
};
