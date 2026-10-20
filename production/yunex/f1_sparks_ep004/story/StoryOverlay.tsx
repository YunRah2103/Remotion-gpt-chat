import React from 'react';
import {AbsoluteFill,interpolate} from 'remotion';
import type {StoryRequest,ShotId} from '../shared/contract';
import {clamp01,onMetalContact} from './beats';
/** Screen fractions, supplied by camera department projection of the real Agent 1 metal skid.
 * Never generate a guessed pointer to the floor/body. */
export type ScreenAnchor=Readonly<{x01:number;y01:number;object:'metal-skid'}>;
export type WordCaption=Readonly<{text:string;startSec:number;endSec:number}>;
export type StoryOverlayProps=Readonly<{
  request:StoryRequest;
  globalTimeSec:number;
  captions?:readonly WordCaption[];
  metalSkidScreenAnchor?:ScreenAnchor;
  showLabels?:boolean;
  showCaptions?:boolean;
  height?:number;
  width?:number;
}>;
const textStyle:React.CSSProperties={fontFamily:'Inter,Arial,sans-serif',fontWeight:800,textShadow:'0 4px 24px rgba(0,0,0,.8),0 1px 2px #060d12',color:'#f7f8f4'};
export function chooseLabel(request:StoryRequest):string|null{
 switch(request.shot){
  case 'underfloor-reveal':return 'METAL SKID';
  case 'aero-load':return request.motion.heaveM<-.004?'LOWER':'';
  case 'contact-macro':return onMetalContact(request.contacts)?'METAL CONTACT':null;
  default:return null;
 }
}
/** All labels are metadata-driven. No manually timed contact flash or mock telemetry. */
export const StoryOverlay:React.FC<StoryOverlayProps>=({
 request,globalTimeSec,captions=[],metalSkidScreenAnchor,
 showLabels=true,showCaptions=true,height=1920,width=1080
})=>{
 const portrait=height>=width;
 const leftMargin=Math.round(width*.085);
 const topSafe=Math.round(height*.13),bottomSafe=Math.round(height*.155);
 const label=showLabels?chooseLabel(request):null;
 const localProgress=clamp01(request.shotLocalSec/.35);
 const isAnchored=label==='METAL SKID'&&metalSkidScreenAnchor?.object==='metal-skid'
   &&Number.isFinite(metalSkidScreenAnchor.x01)&&Number.isFinite(metalSkidScreenAnchor.y01);
 const anchor=isAnchored?metalSkidScreenAnchor:undefined;
 const inSafeAnchor=anchor&&anchor.x01>.08&&anchor.x01<.92&&anchor.y01>.13&&anchor.y01<.72;
 const anchorX=anchor?anchor.x01*width:0,anchorY=anchor?anchor.y01*height:0;
 const candidates=captions.filter(c=>c.startSec<=globalTimeSec&&c.endSec>globalTimeSec);
 const active=candidates.length?candidates[candidates.length-1]:null;
 const labelLeft=inSafeAnchor?Math.max(leftMargin,Math.min(width*.64,anchorX+32)):leftMargin;
 const labelTop=inSafeAnchor?Math.max(topSafe,Math.min(height*.63,anchorY-62)):topSafe;
 const fade=interpolate(localProgress,[0,1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{pointerEvents:'none',overflow:'hidden',background:'transparent'}}>
  {label&&<div style={{
    position:'absolute',left:labelLeft,top:labelTop,opacity:fade,maxWidth:width*.67,
    display:'flex',alignItems:'center',columnGap:11,transform:'translateZ(0)',
    ...textStyle,fontSize:Math.round(width*(portrait?.034:.023)),
    letterSpacing:2.5,lineHeight:1.23
   }}>
   <span style={{display:'inline-block',height:24,width:4,background:'#efd7a8',boxShadow:'0 0 16px #efd7a8'}}/>
   {label}
  </div>}
  {inSafeAnchor&&<svg style={{position:'absolute',left:0,top:0,width,height,overflow:'visible',opacity:fade}}>
    <line x1={anchorX} y1={anchorY} x2={labelLeft-8} y2={labelTop+12} stroke="#f9e6c5" strokeWidth="2"/>
    <circle cx={anchorX} cy={anchorY} r="5" fill="#ffe0a8"/>
   </svg>}
  {showCaptions&&active&&<div style={{
    position:'absolute',left:width*.09,right:width*.09,bottom:bottomSafe,
    textAlign:'center',fontFamily:'Inter,Arial,sans-serif',fontWeight:800,
    fontSize:Math.round(width*(portrait?.052:.036)),lineHeight:1.22,color:'#fffdf4',
    textShadow:'0 3px 13px #000,0 1px 2px #000',
    overflowWrap:'break-word',padding:'9px 0',
    maxHeight:Math.round(height*.17),overflow:'hidden'
  }}>{active.text}</div>}
 </AbsoluteFill>;
};
