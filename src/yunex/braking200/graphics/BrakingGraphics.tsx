/**
 * Cinematic, physics-bound typography and optical engineering annotations.
 * Overlay only; 3D car, rotor, pads, track, state and cameras are owned by
 * Agents 1–4. Do not mount inside ThreeCanvas.
 */
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrakingSimulationState,CinematicCameraPose,FilmCue,Vec3,WheelKey} from '../contracts.ts';
import {
 activeCueAtFrame,clamp01,cueEndFrame,cueStartFrame,heatVisual01,
 oppositeTravelPoint,projectWorldPoint,roadGripVisual01,
 shouldShowAbs,smooth,speedText,wheelFromState,
} from './logic.ts';

export type BrakingGraphicsPalette={
 ivory:string; amber:string; steel:string; shadow:string;
};
export const DEFAULT_BRAKING_GRAPHICS_PALETTE:BrakingGraphicsPalette={
 ivory:'#f7f3e9',amber:'#d2a36c',steel:'#a2becb',shadow:'#0d1f2a',
};
export type BrakingGraphicsProps={
 state:BrakingSimulationState; frame?:number; cue?:FilmCue; cueFrame?:number;
 cameraPose?:CinematicCameraPose; focusWorld?:Vec3;
 travelDirectionWorld?:Vec3; wheelKey?:WheelKey;
 heatReferenceJ?:number; palette?:Partial<BrakingGraphicsPalette>;
 showPin?:boolean;
 /** True only when explicitly showing Agent 2's low-grip scenario. */
 lowGripExample?:boolean;
};
const SVG_FONT='Arial, Helvetica, sans-serif';
const ring=(r:number)=>Math.min(200,Math.max(25,r));
export const BrakingGraphics:React.FC<BrakingGraphicsProps>=({
 state,frame,cue,cueFrame,cameraPose,focusWorld,
 travelDirectionWorld=[1,0,0],wheelKey='front-left',heatReferenceJ=0,
 palette,showPin=true,lowGripExample=false,
})=>{
 const current=useCurrentFrame(),{fps}=useVideoConfig();
 const f=frame??current,chapter=cue??activeCueAtFrame(f);
 const local=cueFrame??(cue?f:f-cueStartFrame(chapter));
 const E=chapter==='hook'?1:smooth((local-1)/(fps*.36));
 const exit=cue?1:smooth((cueEndFrame(chapter)-f)/(fps*.24));
 const alpha=E*exit;
 const colors={...DEFAULT_BRAKING_GRAPHICS_PALETTE,...palette};
 const wheel=wheelFromState(state,wheelKey);
 const intervenes=shouldShowAbs(state,wheelKey);
 // On an ordinary dry road STOP never draw an ABS event or assume low grip.
 const visible=chapter!=='finale'&&(chapter!=='abs'||(lowGripExample&&intervenes));
 if(!visible||alpha<=0)return null;
 const speed=speedText(state);
 const heat=heatVisual01(state,heatReferenceJ);
 const opticalHeat=Math.sqrt(heat); // visibility transfer only: NOT degrees Celsius
 const pressure=clamp01(wheel.brakePressure01);
 const grip=roadGripVisual01(state,wheelKey);
 const projected=cameraPose&&focusWorld?projectWorldPoint(focusWorld,cameraPose):null;
 const pointed=showPin&&projected?.visible?projected:null;
 const radius=pointed&&cameraPose?
   ring(.36*1920/(2*Math.tan(cameraPose.fovDeg*Math.PI/360))/pointed.depth):80;
 const p=pointed;
 const label=chapter==='mechanism'?'FRICTION':chapter==='heat'?'HEAT':
   chapter==='grip'?'TYRE GRIP':chapter==='abs'?'ABS':'';
 const big=chapter==='grip'?86:chapter==='mechanism'?98:chapter==='heat'?130:156;
 const alignedRight=Boolean(p&&p.x<520);
 const labelX=alignedRight?476:95;
 const labelY=p&&p.y>1260?465:1530;
 const lineStartX=alignedRight?labelX:labelX+Math.min(480,big*4.2);
 const lineStartY=labelY+37;
 const force=p&&focusWorld&&cameraPose?projectWorldPoint(
   oppositeTravelPoint(focusWorld,travelDirectionWorld,.2+grip*.48),cameraPose):null;
 const energyOpacity=alpha*(.14+.73*opticalHeat);
 const micro=chapter==='abs'?lowGripExample?'LOW-GRIP EXAMPLE':'':'';
 return <AbsoluteFill style={{pointerEvents:'none',overflow:'hidden',zIndex:20}}>
  <svg viewBox="0 0 1080 1920" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
   <defs>
    <linearGradient id="yunex-energy" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0" stopColor={colors.amber} stopOpacity=".72"/>
     <stop offset="1" stopColor="#f0ca8b" stopOpacity=".02"/>
    </linearGradient>
    <radialGradient id="yunex-disc-heat">
     <stop offset="0" stopColor={colors.amber} stopOpacity=".19"/>
     <stop offset=".47" stopColor={colors.amber} stopOpacity=".10"/>
     <stop offset="1" stopColor={colors.amber} stopOpacity="0"/>
    </radialGradient>
   </defs>

   {chapter==='hook'?
    <g opacity={alpha}>
     <path d={`M 100 182 h ${Math.max(85,Math.min(315,local*20))}`}
      stroke={colors.amber} strokeWidth="8" strokeLinecap="round"/>
     <text x="88" y="404" fontFamily={SVG_FONT} fontWeight="900"
      fontSize="290" letterSpacing="-16" fill={colors.ivory}
      paintOrder="stroke" stroke={colors.shadow} strokeWidth="6">
      {speed}
     </text>
     <text x="104" y="488" fontFamily={SVG_FONT} fontWeight="800"
      fontSize="75" letterSpacing="15" fill={colors.ivory}
      paintOrder="stroke" stroke={colors.shadow} strokeWidth="3">KM/H</text>
     <path d={`M 105 520 h ${Math.min(365,110+local*16)}`}
      stroke={colors.ivory} strokeOpacity=".88" strokeWidth="3"/>
     <path d={`M 104 531 h ${Math.min(155,local*11)}`}
      stroke={colors.amber} strokeOpacity=".84" strokeWidth="4"/>
    </g>:
    <g opacity={alpha}>
     {/* Real 3D attachment projection, never an invented screen marker. */}
     {p&&<g>
      {chapter==='heat'&&<g opacity={energyOpacity}>
       <circle cx={p.x} cy={p.y} r={radius*1.70} fill="url(#yunex-disc-heat)"/>
       {[0,1,2].map(i=><path key={i}
        d={`M ${p.x+Math.cos((f*.019+i*2.09))*radius*.70} ${p.y+Math.sin((f*.019+i*2.09))*radius*.70}
          A ${radius*.70} ${radius*.70} 0 0 1
          ${p.x+Math.cos((f*.019+i*2.09)+.93)*radius*.70}
          ${p.y+Math.sin((f*.019+i*2.09)+.93)*radius*.70}`}
        stroke={colors.amber} fill="none" strokeWidth={3+2*opticalHeat}
        opacity={.28+.35*opticalHeat} strokeLinecap="round"/> )}
       <circle cx={p.x} cy={p.y} r={radius*.9} stroke={colors.amber}
         strokeOpacity={.10+.24*opticalHeat} strokeWidth="1.6" fill="none"/>
      </g>}
      {chapter==='mechanism'&&<g opacity={.25+.75*pressure}>
       {/* Tiny opposed pad impulses, never exaggerated metre-scale pad motion. */}
       <path d={`M ${p.x-radius*.60-5*pressure} ${p.y-radius*.24}
                 l ${radius*.14} ${radius*.13} l ${-radius*.14} ${radius*.13}`}
        stroke={colors.amber} strokeWidth="5" fill="none" strokeLinejoin="round"/>
       <path d={`M ${p.x+radius*.60+5*pressure} ${p.y-radius*.24}
                 l ${-radius*.14} ${radius*.13} l ${radius*.14} ${radius*.13}`}
        stroke={colors.amber} strokeWidth="5" fill="none" strokeLinejoin="round"/>
      </g>}
      {chapter==='grip'&&<g opacity={.25+.75*grip}>
       <ellipse cx={p.x} cy={p.y+3} rx={Math.max(24,radius*.51)}
         ry={Math.max(6,radius*.08)} fill={colors.amber} opacity=".24"/>
       <ellipse cx={p.x} cy={p.y+3} rx={Math.max(24,radius*.58)}
         ry={Math.max(6,radius*.11)} stroke={colors.amber}
         strokeWidth="2.5" fill="none" opacity=".90"/>
       {force?.visible&&<path d={`M ${p.x} ${p.y}
         L ${p.x+(force.x-p.x)*E} ${p.y+(force.y-p.y)*E}`}
         fill="none" stroke={colors.steel} strokeWidth={Math.max(4,6*grip)}
         strokeLinecap="round" />}
       {/* Short normal-load mark; height tracks Agent 2 normal force. */}
       <path d={`M ${p.x} ${p.y-40-Math.min(33,wheel.normalLoadN/210)}
           V ${p.y-19}`} stroke={colors.amber}
           strokeWidth="4" strokeLinecap="round" opacity=".70"/>
      </g>}
      {chapter==='abs'&&<g opacity={.2+.8*pressure}>
       {[0,1,2].map(i=><path key={i}
         d={`M ${p.x-45+i*25} ${p.y-radius*.70}
           v ${-8-(i===1?32:18)*pressure}`}
         stroke={i===1?colors.amber:colors.steel} strokeWidth="5"
         strokeLinecap="round"/> )}
      </g>}
      <path d={`M ${lineStartX} ${lineStartY}
        Q ${(lineStartX+p.x)/2} ${lineStartY+(p.y-lineStartY)*.13}
        ${p.x} ${p.y}`} stroke={colors.ivory} strokeOpacity=".52"
        strokeWidth="2.2" fill="none" strokeDasharray={`${E*1800} 1800`}/>
      <circle cx={p.x} cy={p.y} r="6" fill={chapter==='heat'?colors.amber:colors.ivory}/>
      <circle cx={p.x} cy={p.y} r="21" fill="none" stroke={colors.ivory}
       strokeOpacity=".42" strokeWidth="2"/>
     </g>}
     <g transform={`translate(0 ${(1-E)*20})`}>
      <path d={`M ${labelX} ${labelY-big-35} h ${Math.max(14,Math.min(190,190*E))}`}
       stroke={chapter==='heat'?colors.amber:colors.steel} strokeWidth="6"/>
      <text x={labelX} y={labelY} fontSize={big} fontFamily={SVG_FONT}
       fontWeight="900" letterSpacing={-big*.038} fill={colors.ivory}
       paintOrder="stroke" stroke={colors.shadow} strokeWidth="5">{label}</text>
      <path d={`M ${labelX+3} ${labelY+28} h ${Math.min(250,250*E)}`}
       stroke={colors.ivory} strokeWidth="2" strokeOpacity=".58"/>
      {micro&&<text x={labelX+2} y={labelY+88} fontFamily={SVG_FONT}
       fill={colors.ivory} fontSize="30" fontWeight="700"
       letterSpacing="5" paintOrder="stroke" stroke={colors.shadow} strokeWidth="3">
       {micro}
      </text>}
     </g>
    </g>}
  </svg>
 </AbsoluteFill>;
};
