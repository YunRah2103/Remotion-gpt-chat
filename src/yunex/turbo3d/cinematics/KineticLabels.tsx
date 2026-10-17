import React from 'react';
import {clamp01,smooth} from './cameraMath';
export type EngineeringLabel='HOT EXHAUST'|'TURBINE'|'ONE SHAFT'|'CLEAN AIR'|'INTERCOOLER';
const labelAccent:Record<EngineeringLabel,string>={
 'HOT EXHAUST':'#FF8A36','TURBINE':'#FFC287','ONE SHAFT':'#C5D0D1',
 'CLEAN AIR':'#53CFFF','INTERCOOLER':'#8CEBE3'
};
/** DOM overlay for A6 to composite above ThreeCanvas. Native frame timing, no CSS keyframes. */
export const KineticLabel:React.FC<{
 frame:number;startFrame:number;endFrame:number;label:EngineeringLabel;
 side?:'left'|'right';top?:number;visibility?:boolean
}>=({frame,startFrame,endFrame,label,side='left',top=410,visibility=true})=>{
 if(!visibility || frame<startFrame || frame>=endFrame) return null;
 const duration=endFrame-startFrame;
 const enter=smooth((frame-startFrame)/9),exit=smooth((endFrame-1-frame)/10);
 const opacity=Math.min(enter,exit);
 const dx=(1-enter)*(side==='left'?-28:28);
 const accent=labelAccent[label];
 return <div aria-label={label} style={{
  pointerEvents:'none',position:'absolute',top,
  left:side==='left'?118:undefined,right:side==='right'?118:undefined,
  display:'flex',flexDirection:'column',alignItems:side==='left'?'flex-start':'flex-end',
  gap:10,opacity,transform:`translate3d(${dx}px, ${(1-enter)*7}px, 0)`,
  fontFamily:'Arial,Helvetica,sans-serif',
  textShadow:'0 3px 12px rgba(0,0,0,.8)'
 }}>
  <div style={{width:65,height:3,background:accent,boxShadow:`0 0 12px ${accent}55`}}/>
  <span style={{color:'#EFF7F7',fontSize:42,fontWeight:800,letterSpacing:3.1,whiteSpace:'nowrap'}}>{label}</span>
 </div>;
};
/** No blanket story-board UI: only timed subject-matched educational tags. */
export const SceneLabels:React.FC<{frame:number;variant:'hookA'|'hookB'|'shaft'|'charge'|'road'}>=({frame,variant})=>{
 if(variant==='road')return null;
 if(variant==='hookA')return <KineticLabel frame={frame} startFrame={8} endFrame={66} label="TURBINE" top={350}/>;
 if(variant==='hookB')return <KineticLabel frame={frame} startFrame={8} endFrame={66} label="HOT EXHAUST" top={350}/>;
 if(variant==='shaft')return <>
  <KineticLabel frame={frame} startFrame={12} endFrame={72} label="ONE SHAFT" top={385}/>
  <KineticLabel frame={frame} startFrame={80} endFrame={140} label="CLEAN AIR" top={390} side="right"/>
 </>;
 return <>
  <KineticLabel frame={frame} startFrame={8} endFrame={43} label="CLEAN AIR" top={410}/>
  <KineticLabel frame={frame} startFrame={44} endFrame={112} label="INTERCOOLER" top={410}/>
 </>;
};