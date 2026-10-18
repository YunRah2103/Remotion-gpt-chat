import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {RACE_COLORS} from '../contract.ts';
import type {EpisodePaths,FilmBeat,GateComparison} from './model.ts';
import {storyCopy} from './model.ts';

/** 2D editorial words intentionally DO NOT masquerade as world-space anchors. */
export const StoryOverlay:React.FC<{
  beat:FilmBeat;paths:EpisodePaths;comparison?:GateComparison|null;
  preview?:boolean;opacity?:number;
}>=({beat,paths,comparison,preview=false,opacity=1})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const {eyebrow,headline,note}=storyCopy(beat,paths,preview?null:comparison);
 const appear=interpolate(frame,[0,8,14],[0,1,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const accent=beat==='shortcut'?RACE_COLORS.shortcut:beat==='wide'?RACE_COLORS.racing:'#f7f6f1';
 const size=beat==='final'?46:beat==='explain'?43:49;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:'Arial,Helvetica,sans-serif',
  opacity:appear*opacity,color:'#f7f6f1',textShadow:'0 2px 14px rgba(3,14,22,.83)'}}>
   {/* 540x960 preview scale is half of delivery; keep all labels inside 8% safety margin. */}
   <div style={{position:'absolute',top:'12%',left:'9%',right:'9%',display:'flex',
     flexDirection:'column',alignItems:'flex-start',gap:12}}>
     <div style={{fontWeight:800,fontSize:18,letterSpacing:3.1,color:accent,
       textTransform:'uppercase'}}>{eyebrow}</div>
     <div style={{fontSize:size,fontWeight:900,lineHeight:1.06,letterSpacing:-1.8,
       maxWidth:'100%',textWrap:'balance'}}>{headline}</div>
     {note&&<div style={{fontSize:20,fontWeight:650,letterSpacing:1.25,
       maxWidth:'90%',lineHeight:1.25}}>{note}</div>}
   </div>
   {/* Colour is an identity, never a claim about car position or which car wins. */}
   <div style={{position:'absolute',bottom:'12%',left:'9%',right:'9%',
      display:'flex',justifyContent:'space-between',gap:16}}>
     <div style={{fontWeight:850,fontSize:18,letterSpacing:1.8,color:RACE_COLORS.shortcut}}>A · SHORTCUT</div>
     <div style={{fontWeight:850,fontSize:18,letterSpacing:1.8,color:RACE_COLORS.racing}}>B · RACING LINE</div>
   </div>
 </AbsoluteFill>;
};
