/** Agent 5 actual integrated story preview.
 * Imports the manager-accepted EP004 mechanical/physics/night-circuit modules.
 * All motion, sparks, point positions and road elevations come from shared scene
 * contracts, never from a separate spline or hand-timed fireworks.
 * The underfloor segment is an INTENTIONAL camera-through-track technical section
 * of the exact moving car: Agent 4 asphalt is temporarily hidden for visibility.
 * All external race shots use the Agent 4 profile-matched drivable road.
 */
import React,{useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {WorldLighting} from '../../../../src/yunex/world-kit/components';
import {F1HeroVehicle,UnderfloorReveal,getSkidDescriptors} from '../mechanics/index';
import {sampleDynamics,sampleContactDrivenSparks,localToWorld} from '../physics/index';
import {NightCircuitWorld} from '../look/index';
import type {ShotId,StoryRequest,VehicleMotionState,CameraPose,Vec3,SparkParticle} from '../shared/contract';
import {StorySequence} from './StorySequence';
import {clamp01,smoothstep,type StoryTiming} from './beats';
import type {ScreenAnchor,WordCaption} from './StoryOverlay';
import type {StoryVisualCue} from './visual-cues';

const SKIDS=getSkidDescriptors();
const FORWARD=SKIDS.find(s=>s.id==='forward');
if(!FORWARD) throw new Error('EP004 real mandatory metal forward skid missing');

/** Chosen real road/contact windows, not independent animated spark start times.
 * The portrait middle excerpt encounters the two shared bumps at 6.54/7.6s.
 */
export const PREVIEW_START_M={hook:72,middle:138-62*7.6} as const;
export const HOOK_STORY_TIMING:StoryTiming=[
 {shot:'spark-hook',durationSec:1.45},{shot:'rear-mystery',durationSec:1.45},
 {shot:'underfloor-reveal',durationSec:2.55},{shot:'aero-load',durationSec:.4},
 {shot:'contact-macro',durationSec:.4},{shot:'racing-payoff',durationSec:.4},
];
export const MIDDLE_STORY_TIMING:StoryTiming=[
 {shot:'spark-hook',durationSec:.4},{shot:'rear-mystery',durationSec:.4},
 {shot:'underfloor-reveal',durationSec:2.9},{shot:'aero-load',durationSec:2.9},
 {shot:'contact-macro',durationSec:2.4},{shot:'racing-payoff',durationSec:2.4},
];
/** Editorial chapter proof captions, NOT fabricated narration or word timecodes. */
export const HOOK_STORY_CAPTIONS:readonly WordCaption[]=[
 {text:'REAL METAL SPARKS',startSec:.1,endSec:1.45},
 {text:'WHERE FROM?',startSec:1.45,endSec:2.90},
 {text:'BELOW THE CAR',startSec:2.90,endSec:5.5}
];
export const MIDDLE_STORY_CAPTIONS:readonly WordCaption[]=[
 {text:'METAL SKID',startSec:.8,endSec:2.0},
 {text:'COMPOSITE PLANK',startSec:2.0,endSec:2.85},
 {text:'CARBON FLOOR',startSec:2.85,endSec:3.7},
 {text:'THE CAR SITS LOWER',startSec:3.7,endSec:6.6},
 {text:'METAL MEETS TRACK',startSec:6.6,endSec:9.0},
 {text:'SPARKS FLY',startSec:9.0,endSec:11},
];
function aeroProxy(shot:ShotId,shotLocalSec:number,durationSec:number):number {
 if(shot!=='aero-load')return 1;
 // First a visible low-load reference, then a deterministic increasing
 // Agent 2 aero proxy; no made-up Newton figures or new trajectory.
 return smoothstep((shotLocalSec/Math.max(durationSec,.35)-.19)/.67);
}
export function integratedStoryRequest(tSec:number,shot:ShotId,shotLocalSec:number,shotDurationSec:number,startDistanceM:number):StoryRequest{
 const aeroLoad01=aeroProxy(shot,shotLocalSec,shotDurationSec);
 const params={startDistanceM,speedMps:62,aeroLoad01};
 const motion=sampleDynamics(tSec,params);
 const {contacts,particles}=sampleContactDrivenSparks(tSec,motion,SKIDS,params);
 return {shot,tSec,shotLocalSec,shotDurationSec,motion,contacts,particles};
}
function localWorld(m:VehicleMotionState,p:Vec3):Vec3 {
 const c=Math.cos(m.yawRad),s=Math.sin(m.yawRad);
 return [m.worldPosition[0]+p[0]*c+p[2]*s,m.worldPosition[1]+p[1],m.worldPosition[2]-p[0]*s+p[2]*c];
}
/** Framing is in Agent 5-owned preview only; Agent 3 final production shot
 * camera replaces it on approved integration. The car trajectory is untouched.
 */
export function integratedStoryCamera(req:StoryRequest):CameraPose{
 const m=req.motion,p=clamp01(req.shotLocalSec/req.shotDurationSec);
 let pos:Vec3,target:Vec3,fovDeg:number;
 switch(req.shot){
  case 'spark-hook':pos=[.75+p*.6,1.22,13.4-p*.7];target=[.10,.55,0];fovDeg=52;break;
  case 'rear-mystery':pos=[-8.9+p*.6,1.5,4.0-p*.5];target=[-.45,.57,0];fovDeg=54;break;
  case 'underfloor-reveal':
   // Camera is below Agent 4's opaque road FOR THE CUTAWAY ONLY.
   // Look upward at the real silver skid and tan plank, not a ghost arrow.
   pos=[-.45+p*.65,-.89,4.45-p*.15];target=[.55,.115,0];fovDeg=43;break;
  case 'aero-load':pos=[.25,1.24,13.3-p*.3];target=[0,.46,0];fovDeg=50;break;
  case 'contact-macro':pos=[-.3,.50,5.2+p*.3];target=[.82,.12,0];fovDeg=48;break;
  default:pos=[-4.0+p*1.6,2.0,12.4];target=[-.30,.54,0];fovDeg=50;break;
 }
 return {positionWorld:localWorld(m,pos),targetWorld:localWorld(m,target),fovDeg,rollRad:0};
}
export function projectRealSkid(req:StoryRequest):ScreenAnchor|undefined{
 if(req.shot!=='underfloor-reveal')return undefined;
 const cameraPose=integratedStoryCamera(req);
 const v=new THREE.Vector3(...localToWorld(FORWARD!.localBottomPoint,req.motion));
 const cam=new THREE.PerspectiveCamera(cameraPose.fovDeg,1080/1920,.03,330);
 cam.position.set(...cameraPose.positionWorld);
 cam.lookAt(...cameraPose.targetWorld);
 cam.updateMatrixWorld(true);
 v.project(cam);
 if(!(v.z>-1&&v.z<1)||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1)return undefined;
 return {x01:(v.x+1)/2,y01:(1-v.y)/2,object:'metal-skid'};
}
const SceneCamera:React.FC<{pose:CameraPose}>=({pose})=>{
 const {camera}=useThree();
 camera.position.set(...pose.positionWorld);
 camera.up.set(0,1,0);
 camera.lookAt(...pose.targetWorld);
 if(camera instanceof THREE.PerspectiveCamera){
  camera.fov=pose.fovDeg;camera.near=.025;camera.far=350;camera.updateProjectionMatrix();
 }
 return null;
};
/** GPU-instanced actual Agent 2 particles. No particles when no true historical
 * signed-gap contact; persistence after contact is intentionally respected.
 */
const RealSparkParticles:React.FC<{particles:readonly SparkParticle[]}>=({particles})=>{
 const mesh=useMemo(()=>{
  const m=new THREE.InstancedMesh(
   new THREE.OctahedronGeometry(1,0),
   new THREE.MeshBasicMaterial({color:'#fff4cf',toneMapped:false,transparent:true,opacity:.94,depthWrite:false}),
   260);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;return m;
 },[]);
 const temp=new THREE.Object3D(),color=new THREE.Color();
 const usable=particles.filter(p=>p.luminance01>.04&&p.ageSec>=0).slice(0,260);
 for(let i=0;i<usable.length;i++){
  const p=usable[i],r=Math.max(.009,p.radiusM*(1.65+p.luminance01*.7));
  temp.position.set(...p.positionWorld);
  const speed=Math.hypot(...p.velocityWorld);
  temp.scale.set(r*(2+Math.min(4,speed/12)),r*.62,r*.62);
  const direction=new THREE.Vector3(...p.velocityWorld);
  temp.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),direction.lengthSq()>1e-8?direction.normalize():new THREE.Vector3(1,0,0));
  temp.updateMatrix();
  mesh.setMatrixAt(i,temp.matrix);
  color.setRGB(1,Math.min(1,.52+.45*p.luminance01),.24+.46*p.luminance01);
  mesh.setColorAt(i,color);
 }
 mesh.count=usable.length;mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 return <primitive object={mesh}/>;
};
/** Restrained real-geometry legend during the physical underfloor cutaway. */
const UnderfloorMaterialKey:React.FC<{request:StoryRequest;opacity:number}>=({request,opacity})=>{
 const p=clamp01(request.shotLocalSec/request.shotDurationSec);
 if(p<.10)return null;
 return <div style={{
  position:'absolute',left:'8%',top:'18%',display:'flex',flexDirection:'column',
  gap:9,opacity:opacity*.92,pointerEvents:'none',zIndex:3,
  fontFamily:'Arial,sans-serif',fontSize:42,fontWeight:750,letterSpacing:1.8,
  textShadow:'0 2px 9px #000',maxWidth:'50%'
 }}>
  <div style={{color:'#c5b69c'}}>● TAN COMPOSITE PLANK</div>
  <div style={{color:'#83acbc'}}>● DARK CARBON FLOOR</div>
 </div>;
};
const RealShot:React.FC<{request:StoryRequest;cue:StoryVisualCue}>=({request,cue})=>{
 const mechanism=request.shot==='underfloor-reveal';
 const pose=integratedStoryCamera(request);
 // The road and long-distance furniture cannot be optically transparent in
 // real racing shots. Hidden only for the labelled mechanical cutaway, like
 // a physical section view. Never lower or relocate the hero geometry.
 return <AbsoluteFill>
  <ThreeCanvas width={1080} height={1920}
   camera={{position:[...pose.positionWorld] as [number,number,number],fov:pose.fovDeg,near:.025,far:350}}
   shadows>
   {mechanism
    ? <>
       <WorldLighting timeOfDay="night"/>
       <pointLight position={[...localWorld(request.motion,[.2,-.25,1.5])] as [number,number,number]}
        color="#ffe0b5" intensity={16} distance={9}/>
       <pointLight position={[...localWorld(request.motion,[.9,-.12,-1.8])] as [number,number,number]}
        color="#d3eef8" intensity={10} distance={8}/>
      </>
    : <NightCircuitWorld motion={request.motion} particles={request.particles} exposure={.8}/>}
   <SceneCamera pose={pose}/>
   {mechanism?<UnderfloorReveal motion={request.motion} reveal01={cue.sectionReveal01}/>:
    <F1HeroVehicle motion={request.motion}/>}
   <RealSparkParticles particles={request.particles}/>
  </ThreeCanvas>
  {mechanism&&<UnderfloorMaterialKey request={request} opacity={smoothstep(request.shotLocalSec/.42)}/>}
 </AbsoluteFill>;
};
const Integrated:React.FC<{mode:'hook'|'middle'}>=({mode})=>{
 const start=PREVIEW_START_M[mode];
 const requestAt=(tSec:number,shot:ShotId,localSec:number,durationSec:number)=>
  integratedStoryRequest(tSec,shot,localSec,durationSec,start);
 return <StorySequence requestAt={requestAt} renderShot={(r,cue)=><RealShot request={r} cue={cue}/>}
   timing={mode==='hook'?HOOK_STORY_TIMING:MIDDLE_STORY_TIMING}
   captions={mode==='hook'?HOOK_STORY_CAPTIONS:MIDDLE_STORY_CAPTIONS}
   metalSkidScreenAnchor={projectRealSkid}
   showLabels showCaptions/>;
};
export const StoryIntegratedHook:React.FC=()=> <Integrated mode="hook"/>;
export const StoryIntegratedMiddle:React.FC=()=> <Integrated mode="middle"/>;
