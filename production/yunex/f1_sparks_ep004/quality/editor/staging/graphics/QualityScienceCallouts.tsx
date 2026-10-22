import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CameraPose,StoryRequest,VehicleMotionState} from '../../../../shared/contract.ts';
import {SCREEN,aeroPin,contactPin,ease,materialPins} from 'core.ts';
export type QualityScienceProps=Readonly<{
 request:StoryRequest;cameraPose:CameraPose;unloadedMotion?:VehicleMotionState;
 /** If true, editor has not yet validated original word timing. Graphics remain semantic only. */
 showMystery?:boolean;
}>;
const font='Inter,Arial,Helvetica,sans-serif';
/** Callouts never emit physics, alter models or label an invisible/behind-camera material. */
export const QualityScienceCallouts:React.FC<QualityScienceProps>=({request,cameraPose,unloadedMotion,showMystery=true})=>{
 const p=request.shotDurationSec>0?request.shotLocalSec/request.shotDurationSec:0;
 const opacity=ease(Math.min(1,request.shotLocalSec/.24))*ease(Math.min(1,(request.shotDurationSec-request.shotLocalSec)/.30));
 const material=request.shot==='underfloor-reveal'?materialPins(request,cameraPose):[];
 const contact=contactPin(request,cameraPose);
 const aero=aeroPin(request,cameraPose,unloadedMotion);
 const mystery=showMystery&&request.shot==='rear-mystery'&&p>.18&&p<.81;
 return <AbsoluteFill style={{pointerEvents:'none',overflow:'hidden'}}>
  {mystery&&<div style={{position:'absolute',top:275,left:SCREEN.left,
   color:'#f4eddb',fontSize:31,fontFamily:font,fontWeight:760,
   letterSpacing:1.2,opacity:opacity*.85,textShadow:'0 3px 9px #000'}}>WHAT'S SCRAPING?</div>}
  {material.length>0&&<svg viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity}}>
   {material.map(pin=><g key={pin.id}>
    <path d={`M ${pin.anchorX.toFixed(2)} ${pin.anchorY.toFixed(2)} L ${(pin.labelX<pin.anchorX?pin.labelX+321:pin.labelX-12).toFixed(2)} ${(pin.labelY+13).toFixed(2)}`}
     stroke={pin.color} strokeWidth="2.5" strokeDasharray="3 6" strokeLinecap="round" fill="none" opacity=".8"/>
    <circle cx={pin.anchorX} cy={pin.anchorY} r="6" fill={pin.color} stroke="#091520" strokeWidth="3"/>
    <rect x={pin.labelX} y={pin.labelY-25} width="309" height="73" rx="12" fill="#06101a" fillOpacity=".75" stroke={pin.color} strokeOpacity=".39"/>
    <rect x={pin.labelX+9} y={pin.labelY-11} width="3" height="39" rx="2" fill={pin.color}/>
    <text x={pin.labelX+22} y={pin.labelY+7} fill="#faf7ed" fontSize="26" fontFamily={font} fontWeight="800" letterSpacing="1">{pin.title}</text>
    <text x={pin.labelX+22} y={pin.labelY+32} fill={pin.color} fontSize="18" fontFamily={font} fontWeight="700" letterSpacing=".4">{pin.hint}</text>
   </g>)}
  </svg>}
  {aero&&<svg viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity}}>
    <g transform={`translate(${Math.max(100,Math.min(675,aero.x-90))},${Math.max(300,Math.min(1120,aero.y-175))})`}>
     <path d="M 27 30 L 27 125 M 13 108 L 27 127 L 41 108" fill="none" stroke="#f4d092" strokeWidth="5" strokeLinecap="round"/>
     <text x="62" y="47" fontFamily={font} fontSize="27" fill="#fdf8ea" fontWeight="800">MORE DOWNFORCE</text>
     <text x="62" y="85" fontFamily={font} fontSize="25" fill="#f5cf8e" fontWeight="700">LOWER RIDE HEIGHT</text>
    </g>
  </svg>}
  {contact&&<svg viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity}}>
    <circle cx={contact.x} cy={contact.y} r="26" fill="none" stroke="#ffd89f" strokeWidth="3"/>
    <circle cx={contact.x} cy={contact.y} r="8" fill="#ffe5ac"/>
    <path d={`M ${contact.x} ${contact.y-30} l 0 -45`} stroke="#ffe5ac" strokeWidth="2"/>
    <text x={Math.max(90,Math.min(665,contact.x-145))} y={Math.max(240,contact.y-96)}
      fontFamily={font} fontSize="31" fontWeight="850" letterSpacing="1"
      fill="#fff4d1" stroke="#07111a" strokeWidth="5" paintOrder="stroke">METAL / ROAD CONTACT</text>
  </svg>}
 </AbsoluteFill>;
};
