import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import sceneMap from '../../production/videos/huracan-sto-v10-001/shot-map-v5.json';

type Scene=typeof sceneMap.shots[number];
const frameClamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const CarScene:React.FC<{s:Scene}>=({s})=>{
 const frame=useCurrentFrame();
 const duration=s.endFrameExclusive-s.startFrame;
 const entry=frameClamp(1-frame/5,0,1);
 const zoom=1.016+frame/duration*0.026+(s.impact?.055*entry*entry:0);
 const shift=s.whip?-32*entry:0;
 const blur=s.whip?Math.max(0,2.1-frame*.7):0;
 const flash=s.impact&&frame<2?(.12*(2-frame)/2):0;
 const outro=s.id==='FINAL_RED_HERO'?interpolate(frame,[duration-sceneMap.endFadeFrames,duration-1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):0;
 return <AbsoluteFill style={{backgroundColor:'#000',overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translate3d(${shift}px,0,0) scale(${zoom})`,filter:`blur(${blur}px)`}}>
   <OffthreadVideo src={staticFile('sto-v5/'+s.file)} volume={0} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  </AbsoluteFill>
  {flash>0?<AbsoluteFill style={{backgroundColor:'#e6ecf4',opacity:flash,pointerEvents:'none'}}/>:null}
  {outro>0?<AbsoluteFill style={{backgroundColor:'#000',opacity:outro,pointerEvents:'none'}}/>:null}
 </AbsoluteFill>;
};
export const HuracanStoV5:React.FC<{mode:'candidate'|'release'}>=({mode})=>{
 if(sceneMap.output.width!==1920||sceneMap.output.height!==1080||sceneMap.output.fps!==30||sceneMap.output.durationFrames!==316||sceneMap.revealFrame!==78)
  throw new Error('V5 composition not 1920x1080 316 frames with frame78 impact');
 if(mode==='release'&&!sceneMap.sourceGatePassed)throw new Error('Gate A: 10 distinct genuinely moving STO camera angles not approved');
 return <AbsoluteFill style={{backgroundColor:'#000'}}>
  {sceneMap.shots.map(s=><Sequence key={s.id} name={s.id} from={s.startFrame} durationInFrames={s.countFrames}><CarScene s={s}/></Sequence>)}
 </AbsoluteFill>;
};
