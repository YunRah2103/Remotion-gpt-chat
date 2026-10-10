import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import mapData from '../../production/videos/huracan-sto-v10-001/shot-map-landscape.json';

type Key={frame:number;x:number;y:number;zoom:number};
type Cut='cut'|'whip-left'|'whip-right'|'punch'|'impact';
type Shot={id:string;startFrame:number;endFrameExclusive:number;file:string;cutStyle:Cut;cropKeyframes:Key[]};
type Map={output:{width:number;height:number;fps:number;durationFrames:number};revealFrame:number;sourceGatePassed:boolean;shots:Shot[]};
const map=mapData as Map;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));

/**
 * HURACÁN STO 001 / LANDSCAPE. REAL publisher-origin footage, source QA pending.
 * Requires the 14 verified 30fps shot clips in public/sto-v10 created by
 * prepare_landscape_assets.py from the user's uploaded ZIP.
 * No invented car render, unrelated model substitution, UI, or missing-asset fallback.
 */
const CutVideo:React.FC<{shot:Shot}>=({shot})=>{
 const f=useCurrentFrame();
 const length=shot.endFrameExclusive-shot.startFrame;
 const a=shot.cropKeyframes[0],b=shot.cropKeyframes[shot.cropKeyframes.length-1];
 const lerp=(x:number,y:number)=>interpolate(f,[a.frame,b.frame],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const mx=lerp(a.x,b.x),my=lerp(a.y,b.y),zoom=lerp(a.zoom,b.zoom);
 const entry=clamp(1-f/5),impact=shot.cutStyle==='impact';
 const whip=shot.cutStyle==='whip-left'||shot.cutStyle==='whip-right';
 const direction=shot.cutStyle==='whip-left'?-1:1;
 // Shift a few frames only; overscan prevents empty edges. Do not smudge half the scene.
 const pan=whip?direction*entry*112:0;
 const punch=(impact||shot.cutStyle==='punch')?entry*entry*.10:0;
 const totalZoom=zoom+punch+(whip?entry*.065:0);
 const flash=impact?Math.max(0,(1-f/3))*.25:0;
 const blur=whip?Math.max(0,2.5-f*.7):0;
 return <AbsoluteFill style={{backgroundColor:'#06090d',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translate3d(${pan}px,0,0) scale(${totalZoom})`,
    transformOrigin:`${mx*100}% ${my*100}%`,
    filter:`contrast(1.055) saturate(1.035) brightness(1.005) blur(${blur}px)`}}>
    <OffthreadVideo src={staticFile('sto-v10/'+shot.file)} volume={0}
      startFrom={0} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  </AbsoluteFill>
  {flash>0?<AbsoluteFill style={{pointerEvents:'none',background:'#f2f5fc',opacity:flash}}/>:null}
 </AbsoluteFill>;
};
export const HuracanStoFilm:React.FC<{mode:'candidate'|'release'}>=({mode})=>{
 if(map.output.width!==1920||map.output.height!==1080||map.output.fps!==30||map.output.durationFrames!==316||map.revealFrame!==78)
   throw new Error('STO landscape production contract modified');
 if(mode==='release'&&!map.sourceGatePassed)
   throw new Error('STOP: moving-angle identity gate A NOT PASSED. Do not call candidate footage final.');
 return <AbsoluteFill style={{backgroundColor:'#05070a'}}>
  {map.shots.map(s=><Sequence key={s.id} from={s.startFrame}
     durationInFrames={s.endFrameExclusive-s.startFrame} name={s.id}>
    <CutVideo shot={s}/>
  </Sequence>)}
 </AbsoluteFill>;
};
