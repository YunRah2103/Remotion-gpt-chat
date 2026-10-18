import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import type {
  BrakingSimulationState,CinematicCameraPose,FilmCue,Vec3,WheelKey,
} from '../contracts.ts';
import {
  activeCueAtFrame,clamp01,cueEndFrame,cueStartFrame,heatVisual01,
  oppositeTravelPoint,projectWorldPoint,roadGripVisual01,
  safePin,shouldShowAbs,smooth,speedText,wheelFromState,
} from './logic.ts';

export type BrakingGraphicsPalette={
  ivory:string;amber:string;steel:string;shadow:string;
};
export const DEFAULT_BRAKING_GRAPHICS_PALETTE:BrakingGraphicsPalette={
  ivory:'#f7f3e9',amber:'#daa669',steel:'#92b3c4',shadow:'#07131b',
};

/**
 * Agent 5: external Remotion layer, never mounted inside ThreeCanvas.
 * Supply A2 state sampled at the SAME simulated timestamp as scene geometry.
 * Supply A3 camera and a WORLD-SPACE wheel/disc/contact point for true pinning.
 * Camera/projection can be omitted for an opening hero shot with no pointer.
 *
 * The cue override is for isolated shots. If omitted, master provisional cues
 * determine the stage, pending Agent 6 editorial retime.
 */
export type BrakingGraphicsProps={
  state:BrakingSimulationState;
  frame?:number;
  cue?:FilmCue;
  cueFrame?:number;
  cameraPose?:CinematicCameraPose;
  focusWorld?:Vec3;
  travelDirectionWorld?:Vec3;
  wheelKey?:WheelKey;
  heatReferenceJ?:number;
  palette?:Partial<BrakingGraphicsPalette>;
  showPin?:boolean;
};
export const BrakingGraphics:React.FC<BrakingGraphicsProps>=({
  state,frame,cue,cueFrame,cameraPose,focusWorld,
  travelDirectionWorld=[1,0,0],wheelKey='front-left',
  heatReferenceJ=0,palette,showPin=true,
})=>{
  const frameFromRemotion=useCurrentFrame();
  const {fps}=useVideoConfig();
  const f=frame??frameFromRemotion;
  const chapter=cue??activeCueAtFrame(f);
  const local=cueFrame??(cue?f:f-cueStartFrame(chapter));
  const enter=chapter==='hook'?smooth((local+7)/(fps*.34)):smooth((local-2)/(fps*.52));
  const exit=cue?1:smooth((cueEndFrame(chapter)-f)/(fps*.36));
  const opacity=enter*exit;
  const colors={...DEFAULT_BRAKING_GRAPHICS_PALETTE,...palette};
  const target=focusWorld&&cameraPose?projectWorldPoint(focusWorld,cameraPose):null;
  const pin=target?.visible?safePin(target):null;
  const pinShown=showPin&&pin!==null;
  const left=pin&&pin.x<540?475:103;
  const baseline=pin&&pin.y<935?1500:510;
  const lineFromX=left===103?left+385:left;
  const lineFromY=baseline+45;
  const label=chapter==='mechanism'?'FRICTION':chapter==='heat'?'HEAT':chapter==='grip'?'TYRE GRIP':chapter==='abs'?'ABS':'';
  const labelSize=chapter==='abs'?163:chapter==='grip'?88:chapter==='heat'?132:chapter==='mechanism'?102:100;
  const w=wheelFromState(state,wheelKey);
  const abs=chapter==='abs'&&shouldShowAbs(state,wheelKey);
  const heat=heatVisual01(state,heatReferenceJ);
  const grip=roadGripVisual01(state,wheelKey);
  const pressure=clamp01(w.brakePressure01);
  const effectAlpha=opacity*(chapter==='heat'?heat:chapter==='grip'?grip:pressure);
  const forceEnd=focusWorld&&cameraPose?
    projectWorldPoint(oppositeTravelPoint(focusWorld,travelDirectionWorld,.45+grip*.82),cameraPose):null;
  const display=chapter==='hook'||chapter==='mechanism'||chapter==='heat'||chapter==='grip'||abs;
  if(!display||opacity<=0)return null;
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:15,overflow:'hidden'}}>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <defs>
        <linearGradient id="braking-ink" x1="0" x2="1">
          <stop offset="0%" stopColor={colors.ivory}/><stop offset="100%" stopColor="#c9d6d9"/>
        </linearGradient>
        <radialGradient id="braking-heat">
          <stop offset="0" stopColor={colors.amber} stopOpacity=".38"/>
          <stop offset=".55" stopColor={colors.amber} stopOpacity=".12"/>
          <stop offset="1" stopColor={colors.amber} stopOpacity="0"/>
        </radialGradient>
        <filter id="braking-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="11"/>
        </filter>
      </defs>

      {chapter==='hook'&&<g opacity={opacity} transform={`translate(0 ${(1-enter)*32})`}>
        <path d={`M 105 174 H ${105+233*enter}`} stroke={colors.amber} strokeWidth="6" strokeLinecap="round"/>
        <text x="101" y="350" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900"
          fontSize="226" letterSpacing="-12" fill="url(#braking-ink)" paintOrder="stroke"
          stroke={colors.shadow} strokeWidth="3">{speedText(state)}</text>
        <text x="108" y="421" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700"
          fontSize="56" letterSpacing="13" fill={colors.ivory}>KM/H</text>
        <path d={`M 104 447 h ${300*enter}`} stroke={colors.ivory} strokeOpacity=".55" strokeWidth="2"/>
      </g>}

      {chapter!=='hook'&&<g opacity={opacity}>
        {chapter==='heat'&&pinShown&&<g opacity={effectAlpha}>
          <circle cx={pin!.x} cy={pin!.y} r={225+25*heat} fill="url(#braking-heat)"/>
          <circle cx={pin!.x} cy={pin!.y} r={152+22*heat} fill="none" stroke={colors.amber}
            strokeOpacity=".55" strokeWidth={2+2*heat} strokeDasharray="165 800"
            transform={`rotate(${-70+f*.28} ${pin!.x} ${pin!.y})`}/>
        </g>}
        {pinShown&&<g>
          <path d={`M ${lineFromX} ${lineFromY} Q ${(lineFromX+pin!.x)/2} ${lineFromY} ${pin!.x} ${pin!.y}`}
            stroke={chapter==='heat'?colors.amber:colors.ivory} strokeWidth="2"
            strokeOpacity=".75" fill="none" strokeDasharray={`${Math.round(1400*enter)} 1400`}/>
          <circle cx={pin!.x} cy={pin!.y} r={5+3*enter}
            fill={chapter==='heat'?colors.amber:colors.ivory} opacity={opacity}/>
          <circle cx={pin!.x} cy={pin!.y} r={16} stroke={colors.ivory}
            strokeOpacity=".38" strokeWidth="1.5" fill="none"/>
        </g>}
        {chapter==='grip'&&pinShown&&forceEnd?.visible&&grip>.03&&<g opacity={effectAlpha}>
          <path d={`M ${pin!.x} ${pin!.y} L ${forceEnd.x} ${forceEnd.y}`}
            stroke={colors.amber} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={`${Math.max(3,Math.hypot(pin!.x-forceEnd.x,pin!.y-forceEnd.y)*enter)} 1500`}/>
          <circle cx={forceEnd.x} cy={forceEnd.y} r="9" fill={colors.amber}/>
        </g>}
        {abs&&pinShown&&<g opacity={opacity*(.23+.77*pressure)}>
          <path d={`M ${pin!.x-58+24*pressure} ${pin!.y-46} L ${pin!.x-22} ${pin!.y-25}`}
            stroke={colors.steel} strokeWidth={4+3*pressure} strokeLinecap="round"/>
          <path d={`M ${pin!.x+58-24*pressure} ${pin!.y+46} L ${pin!.x+22} ${pin!.y+25}`}
            stroke={colors.steel} strokeWidth={4+3*pressure} strokeLinecap="round"/>
        </g>}
        <g transform={`translate(0 ${(1-enter)*30})`}>
          <path d={`M ${left} ${baseline-labelSize-23} h ${Math.min(220,220*enter)}`}
            stroke={chapter==='heat'?colors.amber:colors.steel} strokeWidth="5"/>
          <text x={left} y={baseline} fontSize={labelSize} fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900" letterSpacing={chapter==='grip'?-3:-5} fill={colors.ivory}
            paintOrder="stroke" stroke={colors.shadow} strokeOpacity=".85" strokeWidth="2">{label}</text>
          <path d={`M ${left+2} ${baseline+32} h ${Math.min(320,320*enter)}`}
            stroke={colors.ivory} strokeOpacity=".62" strokeWidth="2"/>
        </g>
      </g>}
    </svg>
  </AbsoluteFill>;
};
