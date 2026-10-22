import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SCREEN,activeSubtitle,subtitleSize,type NarratorWord,type SubtitleCue,type TimingStatus} from 'core.ts';
/** One optional drop-in substitution for Agent 6 captions. Editor MUST disable its built-in caption lane. */
export type QualitySubtitleProps=Readonly<{
 words:readonly NarratorWord[]; caption:SubtitleCue|null;
 frame:number;fps:number; timingStatus:TimingStatus;
 /** Explicitly for isolated non-VO previews, never an original-voice film. */
 allowProvisionalPreview?:boolean;
}>;
export const QualitySubtitleOverlay:React.FC<QualitySubtitleProps>=({
 words,caption,frame,fps,timingStatus,allowProvisionalPreview=false
})=>{
 const selected=activeSubtitle(frame,fps,words,caption,timingStatus,allowProvisionalPreview);
 if(!selected)return null;
 const tokens=selected.indices.map(i=>words[i].text);
 const sizing=subtitleSize(tokens);
 const provisional=timingStatus==='provisional-test-fixture';
 return <AbsoluteFill style={{pointerEvents:'none',overflow:'visible',fontFamily:'Inter,Arial,Helvetica,sans-serif'}}>
  {provisional&&<div style={{position:'absolute',left:SCREEN.left,top:SCREEN.top-82,
   color:'#ffe5ae',fontSize:20,letterSpacing:1.3,fontWeight:750,textShadow:'0 2px 6px #060606'}}>
   PROVISIONAL CAPTION TIMING — NOT ORIGINAL VO
  </div>}
  <div style={{position:'absolute',left:sizing.left,width:sizing.width,bottom:sizing.bottom,
   boxSizing:'border-box',padding:'9px 14px',textAlign:'center',
   fontSize:sizing.font,lineHeight:1.16,fontWeight:850,letterSpacing:'-0.45px',
   textShadow:'0 3px 12px #000, 0 1px 2px #000',color:'#f7f5ed',
   background:'linear-gradient(90deg,rgba(5,13,19,.02),rgba(5,13,19,.46) 15%,rgba(5,13,19,.48) 85%,rgba(5,13,19,.02))',
   transform:`translateY(${Math.round((1-selected.fade)*9)}px)`,
   opacity:selected.fade,overflowWrap:'anywhere'}}>
   {selected.indices.map((i,k)=><React.Fragment key={i}>
    {k>0?' ':null}
    <span style={{color:i===selected.highlighted?'#f7c979':'#fffdf4',
     transition:'none'}}>{words[i].text}</span>
   </React.Fragment>)}
  </div>
 </AbsoluteFill>;
};
