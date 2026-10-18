import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {RACE_COLORS} from '../contract.ts';
import type {EpisodePaths,FilmBeat,GateComparison} from './model.ts';
import {storyCopy} from './model.ts';
import {portraitOverlayScale} from './layout.ts';

/**
 * 2D explanatory type is not a world-space marker. Scale from the approved
 * 540x960 working preview so its visual size stays consistent at 1080x1920.
 */
export const StoryOverlay:React.FC<{
 beat:FilmBeat;paths:EpisodePaths;comparison?:GateComparison|null;
 preview?:boolean;opacity?:number;
}>=({beat,paths,comparison,preview=false,opacity=1})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const scale=portraitOverlayScale(width,height);
 const {eyebrow,headline,note}=storyCopy(beat,paths,preview?null:comparison);
 const appear=interpolate(frame,[0,8,14],[0,1,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const accent=beat==='shortcut'?RACE_COLORS.shortcut:beat==='wide'?RACE_COLORS.racing:'#f7f6f1';
 const headlineSize=(beat==='final'?46:beat==='explain'?43:49)*scale;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:'Arial,Helvetica,sans-serif',
  opacity:appear*opacity,color:'#f7f6f1',textShadow:`0 ${2*scale}px ${14*scale}px rgba(3,14,22,.83)`}}>
   {/* Relative safe margins; pixel-based type scales with output. */}
   <div style={{position:'absolute',top:'12%',left:'9%',right:'9%',display:'flex',
     flexDirection:'column',alignItems:'flex-start',gap:12*scale}}>
     <div style={{fontWeight:800,fontSize:18*scale,letterSpacing:3.1*scale,color:accent,
       textTransform:'uppercase'}}>{eyebrow}</div>
     <div style={{fontSize:headlineSize,fontWeight:900,lineHeight:1.06,
       letterSpacing:-1.8*scale,maxWidth:'100%',textWrap:'balance'}}>{headline}</div>
     {note&&<div style={{fontSize:20*scale,fontWeight:650,letterSpacing:1.25*scale,
       maxWidth:'90%',lineHeight:1.25}}>{note}</div>}
   </div>
   {/* Subtle road-coloured scrim keeps the lower legend readable over pale kerbs. */}
   <div style={{position:'absolute',bottom:'8%',left:0,right:0,height:'20%',
     background:'linear-gradient(to top, rgba(5,15,21,.48), rgba(5,15,21,.24) 38%, transparent 100%)'}}/>
   {/* Colour encodes car identity only, never a fixed winner. */}
   <div style={{position:'absolute',bottom:'12%',left:'9%',right:'9%',
      display:'flex',justifyContent:'space-between',gap:16*scale}}>
     <div style={{fontWeight:850,fontSize:18*scale,letterSpacing:1.8*scale,
       color:RACE_COLORS.shortcut}}>A · SHORTCUT</div>
     <div style={{fontWeight:850,fontSize:18*scale,letterSpacing:1.8*scale,
       color:RACE_COLORS.racing}}>B · RACING LINE</div>
   </div>
 </AbsoluteFill>;
};
