import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * A restrained lower/upper-third text overlay for YUNEX footage.
 * Animation is deterministic (no CSS animations). Background stays transparent.
 * Use inside a Sequence when the point begins; hide when the idea is understood.
 */
export type YunexTypeTreatment='editorial'|'technical'|'impact';

export const KineticTitle: React.FC<{
  text: string;
  treatment?: YunexTypeTreatment;
  accentWords?: string[];
  anchorY?: number;
  durationInFrames?: number;
  enterFrames?: number;
}> = ({text, treatment='editorial', accentWords=[], anchorY=.57,
       durationInFrames=75, enterFrames=12}) => {
  const frame=useCurrentFrame();
  const {fps, width, height}=useVideoConfig();
  const impact=treatment==='impact';
  const technical=treatment==='technical';
  const words=text.trim().split(/\s+/).filter(Boolean).slice(0,18);
  const accent=new Set(accentWords.map(w=>w.toLowerCase()));
  const inTime=Math.max(4,enterFrames);
  const exitAt=Math.max(inTime+5,durationInFrames-10);
  const leave=interpolate(frame,[exitAt,durationInFrames],[1,0],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',
  });
  const y=Math.min(.72,Math.max(.16,anchorY))*height;
  const typeSize=(impact?86:technical?54:69)*width/1080;
  const baseWeight=impact?800:technical?600:700;
  const lineProgress=spring({frame,fps,config:{damping:200},durationInFrames:17});
  return <AbsoluteFill style={{pointerEvents:'none',overflow:'hidden'}}>
    <div style={{
      position:'absolute',left:width*.075,top:y,width:width*.85,
      opacity:leave,display:'flex',flexDirection:'column',
      alignItems:'flex-start',
    }}>
      {technical&&<div style={{
        width:Math.max(1,160*lineProgress)*width/1080,height:3,
        background:'#72bd8b',marginBottom:15,
      }}/>}
      <div style={{
        fontFamily:'Arial, Helvetica, sans-serif',
        fontSize:typeSize,fontWeight:baseWeight,lineHeight:1.06,
        letterSpacing:impact?'-0.042em':technical?'.028em':'-.018em',
        color:'#f5f6f4',textShadow:'0px 3px 25px rgba(0,0,0,.78)',
        textTransform:impact?'uppercase':'none',
        display:'flex',flexWrap:'wrap',columnGap:typeSize*.23,
        rowGap:4,maxWidth:width*.85,
      }}>
        {words.map((word,i)=>{
          const local=frame-Math.min(i,8)*(impact?1.2:2.1);
          const visible=spring({
            fps,frame:local,
            durationInFrames:inTime,
            config:{damping:200,stiffness:130},
          });
          const opacity=interpolate(local,[-2,inTime*.55],[0,1],{
            extrapolateLeft:'clamp',extrapolateRight:'clamp',
          });
          const clean=word.toLowerCase().replace(/[^a-z0-9]/g,'');
          return <span key={i} style={{
            opacity,display:'inline-block',
            transform:'translateY('+((1-visible)*(impact?28:18))+'px)',
            color:accent.has(clean)?'#89d7a0':'inherit',
            whiteSpace:'nowrap',
          }}>{word}</span>;
        })}
      </div>
    </div>
  </AbsoluteFill>;
};
