import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import mapJSON from '../../production/videos/huracan-sto-v10-001/shot-map.json';
import {evaluateBeatFx} from '../fx/beat';
import type {CutStyle} from '../fx/beat';

/**
 * Every sequence is a DIFFERENT physical camera angle once Agent A supplies approved media.
 * With missing files, only the intentionally conspicuous PROVISIONAL layout is renderable.
 * No automotive footage is generated, faked, or implied by this fallback.
 */
type Keyframe={frame:number;x:number;y:number;zoom:number};
type Source={file:string|null;sourceStartSeconds:number|null;sourceEndSeconds:number|null};
type Shot={id:string;startFrame:number;endFrameExclusive:number;intendedSubject:string;desiredCameraAngle:string;cutStyle:CutStyle;source:Source;cropKeyframes:Keyframe[]};
type ShotMap={fps:number;durationFrames:number;revealFrame:number;shots:Shot[]};
const shotMap=mapJSON as unknown as ShotMap;
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const interpolateCrop=(local:number,keys:Keyframe[])=>{
 const prev=keys[0];
 const next=keys[keys.length-1];
 const sample=(field:'x'|'y'|'zoom')=>interpolate(local,[prev.frame,next.frame],[prev[field],next[field]],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return {x:sample('x'),y:sample('y'),zoom:sample('zoom')};
};
const Scene:React.FC<{shot:Shot;mode:'provisional'|'final'}>=({shot,mode})=>{
 const frame=useCurrentFrame();
 const duration=shot.endFrameExclusive-shot.startFrame;
 const crop=interpolateCrop(frame,shot.cropKeyframes);
 const fx=evaluateBeatFx(frame,[{frame:0,style:shot.cutStyle}],duration,.58);
 const x=clamp(crop.x,.08,.92),y=clamp(crop.y,.08,.92),zoom=clamp(crop.zoom,1,1.18);
 const overscan=Math.max(zoom,1+Math.abs(fx.shiftX)/540+.012);
 const real=shot.source.file!==null&&shot.source.sourceStartSeconds!==null;
 if(mode==='final'&&!real)throw new Error('UNVERIFIED STO MEDIA: '+shot.id+'. Populate shot-map.json and run --final validation.');
 return <AbsoluteFill style={{backgroundColor:'#050608',overflow:'hidden'}}>
   {real?<AbsoluteFill style={{transform:`translateX(${fx.shiftX}px) rotate(${fx.tilt}deg) scale(${overscan*fx.zoom})`,transformOrigin:'center'}}>
    <OffthreadVideo src={staticFile('sto-v10/'+shot.source.file)}
      startFrom={Math.round(shot.source.sourceStartSeconds!*shotMap.fps)}
      volume={0} style={{width:'100%',height:'100%',objectFit:'cover',
        objectPosition:`${x*100}% ${y*100}%`,
        filter:'contrast(1.055) saturate(1.04) brightness(1.01)'}}/>
   </AbsoluteFill>:<AbsoluteFill style={{background:'linear-gradient(145deg,#05080e,#171d29 45%,#05080e)'}}>
    <div style={{position:'absolute',top:550,left:70,right:70,fontFamily:'Arial,sans-serif',color:'#e9edf3'}}>
      <div style={{fontSize:27,letterSpacing:5,color:'#f3bc77'}}>PROVISIONAL · MEDIA MISSING</div>
      <div style={{fontSize:91,fontWeight:800,marginTop:25}}>STO {shot.id.slice(0,2)}</div>
      <div style={{fontSize:32,lineHeight:1.25,marginTop:22}}>{shot.intendedSubject}</div>
      <div style={{fontSize:25,color:'#909bab',marginTop:32}}>{shot.startFrame}–{shot.endFrameExclusive-1} / 316 FRAMES</div>
    </div>
   </AbsoluteFill>}
   {fx.flash>0?<AbsoluteFill style={{backgroundColor:'#eef4ff',opacity:Math.min(.32,fx.flash),pointerEvents:'none'}}/>:null}
   {fx.rgbOffset>0?<AbsoluteFill style={{opacity:Math.min(.12,fx.rgbOffset/20),pointerEvents:'none',
     background:'linear-gradient(90deg,rgba(240,52,67,.13),transparent 25%,transparent 75%,rgba(63,170,254,.13))'}}/>:null}
 </AbsoluteFill>;
};
export const HuracanStoFilm:React.FC<{mode:'provisional'|'final'}>=({mode})=>{
 if(shotMap.fps!==30||shotMap.durationFrames!==316||shotMap.revealFrame!==78)throw new Error('STO locked format changed');
 return <AbsoluteFill style={{backgroundColor:'#050608'}}>
  {shotMap.shots.map(shot=><Sequence key={shot.id} from={shot.startFrame} durationInFrames={shot.endFrameExclusive-shot.startFrame} name={shot.id}>
    <Scene shot={shot} mode={mode}/>
  </Sequence>)}
 </AbsoluteFill>;
};