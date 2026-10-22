import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {StudioShot} from '../../modelling-kit/recipe';

type TimedShot = StudioShot & {startFrame:number;endFrame:number};
const EXPLANATIONS:Record<string,{eyebrow:string;headline:string;subline?:string;step?:number}>={
  'flame-hook':{eyebrow:'THE QUESTION',headline:'WHY THE FLAMES?'},
  'moving-reveal':{eyebrow:'THE PHENOMENON',headline:'IT HAPPENS UNDER CERTAIN CONDITIONS'},
  'engine-reveal':{eyebrow:'STEP 01  /  ENGINE',headline:'SOME FUEL CAN REMAIN UNBURNT',step:1},
  'fuel-path':{eyebrow:'STEP 02  /  EXHAUST',headline:'HOT EXHAUST + UNBURNT FUEL',step:2},
  'afterfire-exit':{eyebrow:'STEP 03  /  AFTERFIRE',headline:'IGNITION CAN OCCUR IN THE EXHAUST',step:3},
  'driving-payoff':{eyebrow:'THE TAKEAWAY',headline:'NOT EVERY SUPERCAR DOES THIS'}
};
const F = 'Inter, Arial, Helvetica, sans-serif';
export const EditorOverlay:React.FC<{shots:TimedShot[];hasVerifiedWords:boolean}>=({shots,hasVerifiedWords})=>{
 const frame=useCurrentFrame();
 const {width,height,fps}=useVideoConfig();
 const shot=shots.find(s=>frame<s.endFrame)??shots[shots.length-1];
 const cue=EXPLANATIONS[shot.id];
 if(!cue) return null;
 const local=frame-shot.startFrame;
 // Intro deliberately remains clear for the first 12 frames, so a real flame
 // can own the opening once an approved Agent 2/3 shot is connected.
 const delay=shot.id==='flame-hook'?12:5;
 const inOpacity=interpolate(local,[delay,delay+8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const outOpacity=interpolate(shot.endFrame-frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const opacity=Math.min(inOpacity,outOpacity);
 const isNarrated=hasVerifiedWords;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:F,color:'#f0faf9'}}>
   <div style={{position:'absolute',top:height*.13,right:width*.07,
     color:'#eac69a',fontSize:width*.021,letterSpacing:2.4,fontWeight:700,
     textShadow:'0 2px 12px #031016'}}>
      EDITOR BLOCKOUT / SILENT / NOT FINAL
   </div>
   <div style={{position:'absolute',left:width*.07,right:width*.07,top:height*.66,opacity}}>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
      <div style={{width:25,height:3,background:'#65e5d5'}}/>
      <span style={{fontWeight:700,fontSize:width*.022,letterSpacing:2.9,color:'#9ee7df',
        textShadow:'0 2px 10px #000'}}>{cue.eyebrow}</span>
    </div>
    <div style={{maxWidth:width*.82,padding:'16px 21px',borderLeft:'4px solid #5de8d8',
      background:'linear-gradient(100deg,rgba(5,18,26,.90),rgba(5,18,26,.55))',
      fontSize:width*.032,lineHeight:1.19,fontWeight:800,letterSpacing:.6,
      textShadow:'0 2px 8px rgba(0,0,0,.8)'}}>{cue.headline}</div>
   </div>
   {cue.step&&<div style={{position:'absolute',right:width*.07,top:height*.585,
      fontSize:width*.018,letterSpacing:2,opacity,color:'#b4d8d3'}}>COMBUSTION EXPLAINER
     <div style={{display:'flex',gap:9,marginTop:11,justifyContent:'flex-end'}}>
      {[1,2,3].map(i=><div key={i} style={{height:4,width:26,
        background:i===cue.step?'#63e6d8':'rgba(220,240,240,.3)'}} />)}
     </div>
   </div>}
   {isNarrated?null:<div style={{position:'absolute',bottom:height*.055,left:width*.07,
      color:'#c5d7d3',fontSize:width*.017,letterSpacing:1.6,opacity:.75}}>
       VOICE-SYNCED SUBTITLES PENDING VERIFIED ORIGINAL NARRATION
     </div>}
 </AbsoluteFill>;
};
