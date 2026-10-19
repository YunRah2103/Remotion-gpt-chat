import React,{useEffect,useMemo} from 'react';
import {AbsoluteFill,Sequence,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {getRaceCamera} from '../cinema/cameras.ts';
import {RaceCameraRig} from '../cinema/RaceCameraRig.tsx';
import {RaceCar,RaceLighting,RaceWorld} from '../lookdev/index.ts';
import {RaceLineWorld} from '../graphics/WorldGraphics.tsx';
import {StoryOverlay} from '../graphics/StoryOverlay.tsx';
import {AUTHORITATIVE_RACE_PATHS,getRaceComparison,sampleRaceFrame} from '../physics/index.ts';
import {RACE_COLORS} from '../contract.ts';
import type {RaceCarId,RacePose} from '../contract.ts';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {animateVehicle,placeVehicle} from '../../world-kit/motion.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import {editAtFrame} from './timeline.ts';

const P=AUTHORITATIVE_RACE_PATHS;
const RESULT=getRaceComparison();
const timeAdvantage=RESULT.racingFinishAdvantageSeconds;
const deltaMetres=RESULT.racing.pathLengthM-RESULT.shortcut.pathLengthM;

/** A light-through translucent alternate lap at shared checkpoints.
 * No fabricated car spacing/position: BOTH poses are always sampled from A2.
 */
const GhostCar:React.FC<{id:RaceCarId;pose:RacePose;travel:number;steer:number}>=
 ({id,pose,travel,steer})=>{
  const car=useMemo(()=>{
   const group=createVehicle({variant:'formula-modern',color:RACE_COLORS[id],
    accent:id==='shortcut'?'#c8faf1':'#ffe3ac',wheelColor:'#82949a',
    interior:false,lights:false});
   group.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    obj.castShadow=false;obj.receiveShadow=false;
    obj.material=(Array.isArray(obj.material)?obj.material:[obj.material]).map(mat=>{
     const m=mat.clone();m.transparent=true;m.opacity=.3;
     m.depthWrite=false;return m;
    });
   });
   return group;
  },[id]);
  useEffect(()=>()=>disposeObject(car),[car]);
  animateVehicle(car,travel,steer);
  placeVehicle(car,pose);
  return <primitive object={car}/>;
 };

const GhostAwareCars:React.FC<{state:ReturnType<typeof sampleRaceFrame>;focus:RaceCarId}>=
 ({state,focus})=>{
  const {shortcut:a,racing:b}=state.cars;
  const d=Math.hypot(a.worldPose.position[0]-b.worldPose.position[0],
    a.worldPose.position[2]-b.worldPose.position[2]);
  const overlap=d<5.8;
  const primary=state.cars[focus];
  const secondary=state.cars[focus==='shortcut'?'racing':'shortcut'];
  if(overlap)return <>
   <RaceCar id={primary.id} pose={primary.worldPose}
      wheelTravelM={primary.travelDistanceM} steerRad={primary.steerRad}/>
   <GhostCar id={secondary.id} pose={secondary.worldPose}
      travel={secondary.travelDistanceM} steer={secondary.steerRad}/>
  </>;
  return <>
   <RaceCar id="shortcut" pose={a.worldPose}
      wheelTravelM={a.travelDistanceM} steerRad={a.steerRad}/>
   <RaceCar id="racing" pose={b.worldPose}
      wheelTravelM={b.travelDistanceM} steerRad={b.steerRad}/>
  </>;
};

const safeText:React.CSSProperties={
 color:'#fffdf7',fontFamily:'Arial,Helvetica,sans-serif',fontWeight:900,
 textShadow:'0 3px 16px rgba(2,11,16,.91)',
};
const Headline:React.FC<{eyebrow:string;main:string;detail?:string;alpha:number;scale:number}>=
 ({eyebrow,main,detail,alpha,scale})=>
 <div style={{position:'absolute',left:'9%',right:'9%',top:'12%',
  opacity:alpha,pointerEvents:'none',...safeText}}>
   <div style={{fontSize:18*scale,letterSpacing:3*scale,
    color:'#ffd7a6',marginBottom:11*scale}}>{eyebrow}</div>
   <div style={{fontSize:47*scale,lineHeight:1.04,letterSpacing:-1.5*scale,
    maxWidth:900}}>{main}</div>
   {detail&&<div style={{fontSize:20*scale,fontWeight:700,
    lineHeight:1.3,marginTop:12*scale}}>{detail}</div>}
 </div>;

export const F1RacingLinePicture:React.FC=()=>{
 const frame=useCurrentFrame();
 const {fps,width,height}=useVideoConfig();
 const edit=editAtFrame(frame);
 const state=sampleRaceFrame(edit.sourceSeconds*fps,fps);
 const view=getRaceCamera(edit.shot,state,edit.sourceFrame);
 const a=state.cars.shortcut,b=state.cars.racing;
 const gap=Math.hypot(a.worldPose.position[0]-b.worldPose.position[0],
   a.worldPose.position[2]-b.worldPose.position[2]);
 const focus:RaceCarId=edit.beat==='shortcut'?'shortcut':'racing';
 const fade=interpolate(edit.localFrame,[0,9,25],[0,1,1],
   {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const scale=Math.min(width/540,height/960);
 const showWorldLines=edit.beat!=='hook'&&edit.beat!=='final';
 const showApex=edit.beat==='wide'||edit.beat==='explain';
 const labelledResult=RESULT.fasterAtCommonFinish==='racing'&&timeAdvantage>0;
 const caption=edit.beat==='payoff'
   ?'SAME START • SAME FINISH • ONE PHYSICS MODEL'
   :edit.beat==='hook'?'ONE CORNER • TWO DIFFERENT PATHS'
   :edit.replay?'REPLAY • REPRESENTATIVE SIMULATION':'REPRESENTATIVE SIMULATION';
 const showOverlay=edit.beat==='hook'||edit.beat==='payoff'||edit.beat==='final';
 return <AbsoluteFill style={{background:'#668898'}}>
  <ThreeCanvas width={width} height={height} shadows
   camera={{position:view.position,fov:view.fov,near:.1,far:500}}
   style={{width:'100%',height:'100%'}}>
   <RaceLighting quality="premium" focus={[65,0,18]}/>
   <RaceWorld quality="premium" seed={12}/>
   <RaceCameraRig shot={edit.shot} state={state} frame={edit.sourceFrame}/>
   <GhostAwareCars state={state} focus={focus}/>
   {showWorldLines&&<RaceLineWorld paths={P}
    progressM={{shortcut:a.pathDistanceM,racing:b.pathDistanceM}}
    frame={edit.sourceFrame} highlight={edit.beat==='shortcut'?'shortcut':
     edit.beat==='wide'?'racing':'both'} showApex={showApex}/>}
  </ThreeCanvas>
  {/* A5 typography, placed on true beat-local sequences so reveal restarts at each cut. */}
  <Sequence from={60} durationInFrames={120}>
   <StoryOverlay beat="shortcut" paths={P}/>
  </Sequence>
  <Sequence from={180} durationInFrames={150}>
   <StoryOverlay beat="wide" paths={P}/>
  </Sequence>
  <Sequence from={330} durationInFrames={150}>
   <StoryOverlay beat="explain" paths={P}/>
  </Sequence>
  {edit.beat==='hook'&&<Headline eyebrow="TEAL: SHORTCUT  /  AMBER: RACING LINE"
    main="THE LONGER WAY IS FASTER?" alpha={fade} scale={scale}/>}
  {edit.beat==='payoff'&&
   <Headline eyebrow="THE RACE • IDENTICAL FINISH CHECKPOINT"
    main={labelledResult?'AMBER EXITS FASTER':'WHICH LINE WINS?'}
    detail={labelledResult?'WIDER RADIUS. MORE CORNERING SPEED.':''}
    alpha={fade} scale={scale}/>}
  {edit.beat==='final'&&
   <Headline eyebrow="THE RESULT • ILLUSTRATIVE SIMULATION"
    main="LONGER PATH. HIGHER SPEED. FASTER EXIT."
    detail={labelledResult?
      'AMBER +'+timeAdvantage.toFixed(3)+'s FASTER · '+deltaMetres.toFixed(3)+'m FARTHER':
      'NOT EVERY CORNER REWARDS THE WIDER LINE'}
    alpha={fade} scale={scale}/>}
  {/* Explicit distinction between split/ghost replay and a real simultaneous on-track pass. */}
  <div style={{...safeText,position:'absolute',bottom:'9%',left:'9%',right:'9%',
   display:'flex',justifyContent:'space-between',gap:20,
   fontSize:15*scale,letterSpacing:1.2*scale,fontWeight:750}}>
   <span style={{color:RACE_COLORS.shortcut}}>A · SHORTCUT</span>
   <span style={{color:RACE_COLORS.racing}}>B · WIDE LINE</span>
  </div>
  <div style={{position:'absolute',bottom:'5%',left:'9%',right:'9%',
   fontFamily:'Arial,Helvetica,sans-serif',fontWeight:750,fontSize:12*scale,
   letterSpacing:1.5*scale,color:'#f9faf7',textShadow:'0 2px 10px #000'}}>
   {caption}{gap<5.8?' • TRANSLUCENT GHOST COMPARISON':''}
  </div>
  {/* Pace highlights come from A2 state only; no invented screen telemetry. */}
  {edit.beat==='explain'&&edit.localFrame>35&&
   <div style={{position:'absolute',right:'9%',top:'39%',color:'#fff',
      fontFamily:'Arial,Helvetica,sans-serif',fontSize:17*scale,
      fontWeight:750,textShadow:'0 2px 8px #000'}}>
     TYRE GRIP LIMITS CORNER SPEED
   </div>}
 </AbsoluteFill>;
};
