/** Agent 3 integrated native camera review — exact Agent 1/2/4 source.
 * No illustrative sparks, duplicate hero/road, temporal particle loop or
 * independent vehicle trajectory. Each retimeable shot samples Agent 2.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {F1HeroVehicle,getSkidDescriptors} from '../../mechanics/index.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
import {NightCircuitWorld} from '../../look/index.ts';
import type {ShotId,SparkParticle} from '../../shared/contract.ts';
import {sampleRetimedShotCamera} from '../../cinema/cameras.ts';
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
  {shot:'racing-payoff',fromSec:8.10,durationSec:2.90,startDistanceM:97.70,startTimeSec:.07,playRate:.20},
];
export const OPENING_BEAT:CameraBeat={
  shot:'spark-hook',fromSec:0,durationSec:5,startDistanceM:63.65,startTimeSec:.12,playRate:.31,
};
export function previewBeat(screenSec:number,hook:boolean):{beat:CameraBeat;localSec:number;physicsSec:number}{
  if(!Number.isFinite(screenSec)||screenSec<0)throw new Error('invalid sequence time');
  const beat=hook?OPENING_BEAT:CAMERA_SEQUENCE.find(b=>screenSec<b.fromSec+b.durationSec)??CAMERA_SEQUENCE[CAMERA_SEQUENCE.length-1];
  const localSec=Math.min(beat.durationSec,Math.max(0,screenSec-beat.fromSec));
  return {beat,localSec,physicsSec:beat.startTimeSec+localSec*beat.playRate};
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
      const size=.012+.020*p.luminance01;
      const length=.09+.22*Math.min(1,direction.length()/40)*p.luminance01;
      const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize());
      return <mesh key={p.id} position={p.positionWorld} quaternion={quat}>
        <boxGeometry args={[size,size,length]}/>
        <meshBasicMaterial color={p.luminance01>.67?'#fff7d3':'#ffbf72'} toneMapped={false}/>
      </mesh>;
    })}
  </>;
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
  const sectioned=beat.shot==='contact-macro'||(beat.shot==='underfloor-reveal'&&localSec>=1.12);
  const reveal=beat.shot==='underfloor-reveal'?Math.min(.97,.44+localSec*.20):0;
  const contactActive=contacts.some(c=>c.active);
  return <AbsoluteFill style={{background:'#0a1420'}}>
    <ThreeCanvas width={width} height={height} shadows camera={{position:[0,3,10],fov:55,near:.025,far:350}}>
      <NightCircuitWorld motion={motion} particles={particles} exposure={.90}/>
      {sectioned?<CutawayHero motion={motion}/>:<F1HeroVehicle motion={motion} reveal01={reveal}/>}
      <ContactSparkVisuals particles={particles}/>
      <ApplyCameraPose pose={camera} near={.025}/>
    </ThreeCanvas>
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
