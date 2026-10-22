import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {CINEMATIC_BEATS,frameBeat,explanationAt} from './picture-contract';

/** Screen-space target is supplied ONLY after projecting the actual named port
 * with the animated Agent 1 hero rig. No guessed fixed-screen arrow. */
export type ScreenTarget={x:number;y:number;visible:boolean;source:'mount:exhaust-tip-left'|'mount:exhaust-tip-right'};
export type VerifiedCaption={text:string;start:number;end:number};
type Props={exhaustTarget?:ScreenTarget|null;verifiedCaptions?:readonly VerifiedCaption[];originalAudioVerified?:boolean};
const font='Inter,Arial,Helvetica,sans-serif';
const clip=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const opacity=(local:number,len:number,delay=0)=>Math.min(clip((local-delay)/8),clip((len-local)/9));
const BG='rgba(5,13,19,.78)';
const safeShadow='0 4px 18px rgba(0,0,0,.85)';
/** Overlay never invents transcribed speech. Text here is authored explanatory UI. */
export const PremiumOverlay:React.FC<Props>=({exhaustTarget,verifiedCaptions=[],originalAudioVerified=false})=>{
 const frame=useCurrentFrame(),beat=frameBeat(frame),local=frame-beat.start,left=beat.end-frame;
 const science=explanationAt(frame);
 const hideHeader=frame<12;
 const alpha=opacity(local,beat.end-beat.start,beat.id==='hook'?12:6);
 const kicker=beat.id==='hook'?'WHY THE FLAMES?':
  beat.id==='launch'?'THE SCIENCE OF AFTERFIRE':
  beat.id==='engine-reveal'?'01 / THE ENGINE':
  beat.id==='mechanism'?'02 / THE EXHAUST':
  beat.id==='exhaust'?'03 / IGNITION':
  'THE FINAL BURST';
 const text=beat.id==='hook'?'WHEN EXHAUST IGNITES':
  beat.id==='launch'?'NOT EVERY SUPERCAR DOES THIS':
  beat.id==='engine-reveal'?'SOME FUEL MAY GO UNBURNT':
  beat.id==='mechanism'?'HOT EXHAUST + FUEL':
  beat.id==='exhaust'?'IGNITION CAN MAKE A FLAME':
  frame>=711?'THAT IS AFTERFIRE.':'ONE LAST SURGE';
 const isMechanical=beat.id==='engine-reveal'||beat.id==='mechanism';
 const bottom=originalAudioVerified && verifiedCaptions.length>0?
  verifiedCaptions.find(c=>frame/30>=c.start&&frame/30<c.end):undefined;
 const showMount=(beat.id==='exhaust' && frame>=441 && frame<524 &&
   exhaustTarget?.visible && exhaustTarget.x>150&&exhaustTarget.x<905&&
   exhaustTarget.y>220&&exhaustTarget.y<1400);
 const finalPulse=beat.id==='payoff'&&frame>=711?clip((frame-711)/12):1;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:font,color:'#f5f9fa',overflow:'hidden'}}>
  {!hideHeader&&<div style={{position:'absolute',top:104,left:80,right:78,
   display:'flex',justifyContent:'space-between',fontSize:19,fontWeight:750,letterSpacing:3.3,
   textShadow:safeShadow,opacity:.80}}>
    <span>YUNEX</span><span style={{fontSize:14,letterSpacing:2}}>EP005 / AUTOMOTIVE SCIENCE</span>
  </div>}
  {/* All major copy is kept in the upper or mid-lower third, never the
      82–94% phone-safe narration caption lane. */}
  {frame>=12&&<div style={{position:'absolute',left:80,right:76,
   top:isMechanical?1190:315,opacity:alpha*finalPulse,
   transform:`translateY(${Math.round((1-alpha)*16)}px)`}}>
   <div style={{fontSize:19,fontWeight:820,letterSpacing:2.6,color:'#9edbd3',
    marginBottom:13,textShadow:safeShadow}}>{kicker}</div>
   <div style={{width:'fit-content',maxWidth:855,padding:'17px 20px 18px 22px',
    background:BG,borderLeft:'3px solid #73b7b2',
    boxShadow:'0 15px 40px rgba(0,0,0,.25)'}}>
    <div style={{fontSize:beat.id==='hook'?53:beat.id==='payoff'?49:43,
     fontWeight:850,letterSpacing:-.8,lineHeight:1.12,textShadow:safeShadow}}>{text}</div>
    {science&&<div style={{marginTop:11,fontSize:22,lineHeight:1.3,
      fontWeight:550,color:'#cae3df'}}>{science}</div>}
   </div>
  </div>}
  {showMount&&exhaustTarget&&<svg width="1080" height="1920" style={{position:'absolute',inset:0,opacity:clip((frame-441)/10)*clip((524-frame)/10)}}>
    <path d={`M ${exhaustTarget.x} ${exhaustTarget.y} l 59 -62 h 128`}
      fill="none" stroke="#a4e7dc" strokeWidth="3"/>
    <circle cx={exhaustTarget.x} cy={exhaustTarget.y} r="6" fill="#a4e7dc"/>
    <text x={exhaustTarget.x+64} y={exhaustTarget.y-75} fill="#e8f6f4"
      fontSize="24" fontWeight="750" letterSpacing="2">TAILPIPE</text>
   </svg>}
  {/* The only spoken subtitle lane: intentionally blank without authenticated source. */}
  {bottom && <div style={{position:'absolute',left:90,right:90,top:1578,height:207,
   display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',
   color:'#fff',fontSize:58,fontWeight:820,lineHeight:1.16,textShadow:'0 4px 13px #000,0 7px 26px #000'}}>
   {bottom.text}
  </div>}
  <div style={{position:'absolute',bottom:56,right:73,fontSize:15,
   opacity:.66,letterSpacing:1.5,fontWeight:700,textShadow:safeShadow}}>
   {originalAudioVerified?'ORIGINAL AUDIO VERIFIED':'SILENT / PICTURE REVIEW — NOT FINAL'}
  </div>
 </AbsoluteFill>;
};
