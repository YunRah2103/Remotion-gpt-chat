import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {StudioShot} from '../../modelling-kit/recipe';

// Non-spoken editorial explanation only. Original spoken words, when supplied,
// continue to use the V3 recipe ONE-CAPTION-LANE renderer. We never infer them.
type TimedShot=StudioShot & {startFrame:number;endFrame:number};
type Cue={kicker:string;headline:string;index?:number;context?:string};
const CUES:Record<string,Cue>={
 'flame-hook':{kicker:'AFTERFIRE / THE QUESTION',headline:'WHY THE FLAMES?'},
 'moving-reveal':{kicker:'WHEN DOES IT HAPPEN?',headline:'ONLY UNDER CERTAIN CONDITIONS'},
 'engine-reveal':{kicker:'01 / INSIDE THE ENGINE',headline:'FUEL CAN REMAIN UNBURNT',index:1},
 'fuel-path':{kicker:'02 / THROUGH THE EXHAUST',headline:'FUEL + HOT EXHAUST',index:2,context:'ILLUSTRATED GAS FLOW'},
 'afterfire-exit':{kicker:'03 / AT THE TAILPIPE',headline:'IGNITION CAN PRODUCE A FLAME',index:3},
 'driving-payoff':{kicker:'THE REAL EXPLANATION',headline:'NOT EVERY SUPERCAR DOES THIS'}
};
const FONT='Inter,Arial,Helvetica,sans-serif';
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
export const EditorOverlay:React.FC<{shots:TimedShot[];hasVerifiedWords:boolean}>=({shots,hasVerifiedWords})=>{
 const f=useCurrentFrame(),{width:w,height:h}=useVideoConfig();
 const shot=shots.find(s=>f<s.endFrame)??shots[shots.length-1];
 if(!shot)return null;
 const cue=CUES[shot.id];if(!cue)return null;
 const local=f-shot.startFrame,remaining=shot.endFrame-f;
 const hook=shot.id==='flame-hook';
 // Real tailpipe fire must remain the only focal point at f0–11.
 const intro=hook?12:5;
 const reveal=clamp((local-intro)/9,0,1);
 const exit=clamp(remaining/8,0,1);
 const alpha=Math.min(reveal,exit);
 const rise=(1-reveal)*12;
 // Four-frame minimal editorial wipe on each cut; no flash over f0 hero/fire.
 const cut=hook?0:clamp(1-local/4,0,1);
 const isScience=Boolean(cue.index);
 // Caption-safe lower 18% is kept entirely clear of explanatory UI.
 // Science card sits well below the V3-native projected engine/part arrow\n // (which occupies the upper-left), yet above the reserved bottom subtitle lane.
 const cardTop=h*(isScience?.65:.158);
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:FONT,color:'#f0f8f7'}}>
  <div style={{position:'absolute',left:w*.07,right:w*.07,top:h*.075,
   display:'flex',justifyContent:'space-between',alignItems:'center',opacity:.83}}>
   <span style={{fontSize:w*.023,fontWeight:800,letterSpacing:4,color:'#ebf9f8',
     textShadow:'0 2px 12px #000'}}>Y U N E X</span>
   <span style={{fontSize:w*.017,fontWeight:650,letterSpacing:2,color:'#bfe0de'}}>
     EP005 / SCIENCE OF SPEED
   </span>
  </div>
  {cut>0&&<div style={{position:'absolute',left:0,right:0,top:h*.106,height:3,
    opacity:cut*.85,background:'linear-gradient(90deg,transparent,#69ebdb,transparent)',
    transform:`translateX(${(1-cut)*37}%)`}}/>}
  <div style={{position:'absolute',left:w*.074,right:w*.074,top:cardTop,
    opacity:alpha,transform:`translateY(${rise}px)`}}>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:13}}>
      <span style={{display:'block',background:'#61e2d5',width:22,height:3}}/>
      <span style={{fontSize:w*.019,letterSpacing:2.5,fontWeight:800,
       color:'#9fe8df',textShadow:'0 2px 12px #061015'}}>{cue.kicker}</span>
    </div>
    <div style={{maxWidth:w*.80,width:'fit-content',background:'rgba(4,15,22,.82)',
      borderLeft:'4px solid #63e2d5',padding:'15px 23px 17px',
      boxShadow:'0 13px 28px rgba(0,0,0,.22)'}}>
      <div style={{fontSize:w*(hook?.045:.035),fontWeight:850,
       lineHeight:1.15,letterSpacing:.25,maxWidth:w*.74,
       textShadow:'0 2px 8px #02080b'}}>{cue.headline}</div>
      {cue.context&&<div style={{marginTop:11,fontSize:w*.017,letterSpacing:1.75,
        color:'#b5d1cf',fontWeight:750}}>{cue.context}</div>}
    </div>
  </div>
  {cue.index&&<div style={{position:'absolute',right:w*.075,top:h*.137,opacity:alpha*.86,
    display:'flex',gap:7,alignItems:'center'}}>
    {[1,2,3].map(i=><div key={i} style={{height:3,width:19,
      background:cue.index===i?'#5ce5d4':'rgba(233,245,244,.28)'}}/>)}
  </div>}
  <div style={{position:'absolute',top:h*.929,left:w*.08,right:w*.08,
    display:'flex',justifyContent:'space-between',alignItems:'center',opacity:.6,
    fontSize:w*.017,letterSpacing:1.2,fontWeight:700}}>
   <span>{hasVerifiedWords?'ORIGINAL NARRATION':'SILENT PICTURE BLOCKOUT / NOT FINAL'}</span>
   <span>25S REVIEW TIMING</span>
  </div>
 </AbsoluteFill>;
};
