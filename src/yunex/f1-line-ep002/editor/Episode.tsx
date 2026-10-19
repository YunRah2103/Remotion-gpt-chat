import React from 'react';
import {AbsoluteFill,Sequence,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {getRaceCamera} from '../cinema/cameras.ts';
import {getPremiumEditorialCamera} from './premiumCamera.ts';
import {CameraAim} from '../../world-kit/components';
import {RaceCameraRig} from '../cinema/RaceCameraRig.tsx';
import {RaceCar,RaceLighting,RaceWorld} from '../lookdev/index.ts';
import {RaceLineWorld} from '../graphics/WorldGraphics.tsx';
import {StoryOverlay} from '../graphics/StoryOverlay.tsx';
import {AUTHORITATIVE_RACE_PATHS,getRaceComparison,sampleRaceFrame} from '../physics/index.ts';
import {RACE_COLORS} from '../contract.ts';
import type {RaceCarId} from '../contract.ts';
import {editAtFrame} from './timeline.ts';

const P=AUTHORITATIVE_RACE_PATHS;
const RESULT=getRaceComparison();
const timeAdvantage=RESULT.racingFinishAdvantageSeconds;
const deltaMetres=RESULT.racing.pathLengthM-RESULT.shortcut.pathLengthM;

/**
 * Deliberately never alpha-blend overlapping full-car meshes: at common timing
 * gates a translucent Formula car creates severe depth-sorted ghost triangles,
 * shadow-like pixel grit and illegal-looking contact. Show the focal solid
 * car instead, preserving BOTH actual computed trajectories as road ribbons.
 * As soon as the independent simulation puts the cars safely apart, show both.
 */
const GhostAwareCars:React.FC<{state:ReturnType<typeof sampleRaceFrame>;focus:RaceCarId}>=
 ({state,focus})=>{
  const {shortcut:a,racing:b}=state.cars;
  const d=Math.hypot(a.worldPose.position[0]-b.worldPose.position[0],
    a.worldPose.position[2]-b.worldPose.position[2]);
  const overlap=d<5.8;
  const primary=state.cars[focus];
  if(overlap)return <RaceCar id={primary.id} pose={primary.worldPose}
     wheelTravelM={primary.travelDistanceM} steerRad={primary.steerRad}/>;
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

export const F1RacingLinePicture:React.FC<{premiumCamera?:boolean}>=({premiumCamera=false})=>{
 const frame=useCurrentFrame();
 const {fps,width,height}=useVideoConfig();
 const edit=editAtFrame(frame);
 const state=sampleRaceFrame(edit.sourceSeconds*fps,fps);
 const view=premiumCamera
  ?getPremiumEditorialCamera(edit,state,frame)
  :getRaceCamera(edit.shot,state,edit.sourceFrame);
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
 return <AbsoluteFill style={{background:'#668898'}}>
  <ThreeCanvas width={width} height={height} dpr={width<=540?1.35:1} shadows
   camera={{position:view.position,fov:view.fov,near:.1,far:500}}
   style={{width:'100%',height:'100%'}}>
   <RaceLighting quality="premium" focus={[65,0,18]}/>
   {/* Film-only clean blue-hour atmosphere. The kit's dusk preset uses a muted
       lavender sky and short fog range that wash out the cars/track in portrait.
       These overrides preserve A4's actual circuit, car and lighting objects. */}
   <color attach="background" args={['#739ebc']}/>
   <fog attach="fog" args={['#839dad',165,405]}/>
   <RaceWorld quality="premium" seed={12}/>
   {premiumCamera
    ?<CameraAim position={view.position} target={view.target} fov={view.fov}/>
    :<RaceCameraRig shot={edit.shot} state={state} frame={edit.sourceFrame}/>}
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
    main={labelledResult&&frame>=630?'AMBER EXITS FASTER':'WHO WINS THE CORNER?'}
    detail={labelledResult&&frame>=630?'WIDER RADIUS. MORE CORNERING SPEED.':''}
    alpha={fade} scale={scale}/>}
  {edit.beat==='final'&&
   <Headline eyebrow="THE RESULT • ILLUSTRATIVE SIMULATION"
    main="LONGER PATH. HIGHER SPEED. FASTER EXIT."
    detail={labelledResult?
      'AMBER +'+timeAdvantage.toFixed(3)+'s FASTER · '+deltaMetres.toFixed(3)+'m FARTHER':
      'NOT EVERY CORNER REWARDS THE WIDER LINE'}
    alpha={fade} scale={scale}/>}
  {/* One legend only: A5 draws its own on explanatory beats. */}
  {(edit.beat==='hook'||edit.beat==='payoff'||edit.beat==='final')&&<div style={{...safeText,position:'absolute',bottom:'9%',left:'9%',right:'9%',
   display:'flex',justifyContent:'space-between',gap:20,
   fontSize:15*scale,letterSpacing:1.2*scale,fontWeight:750}}>
   <span style={{color:RACE_COLORS.shortcut}}>A · SHORTCUT</span>
   <span style={{color:RACE_COLORS.racing}}>B · WIDE LINE</span>
  </div>}
  {(edit.beat==='hook'||edit.beat==='payoff'||edit.beat==='final')&&<div style={{position:'absolute',bottom:'5%',left:'9%',right:'9%',
   fontFamily:'Arial,Helvetica,sans-serif',fontWeight:750,fontSize:12*scale,
   letterSpacing:1.5*scale,color:'#f9faf7',textShadow:'0 2px 10px #000'}}>
   {caption}
  </div>}
  {/* Pace highlights come from A2 state only; no invented screen telemetry. */}
  {edit.beat==='explain'&&edit.localFrame>35&&
   <div style={{position:'absolute',right:'9%',top:'39%',color:'#fff',
      fontFamily:'Arial,Helvetica,sans-serif',fontSize:17*scale,
      fontWeight:750,textShadow:'0 2px 8px #000'}}>
     TYRE GRIP LIMITS CORNER SPEED
   </div>}
 </AbsoluteFill>;
};
