/**
 * GT3 Nürburgring multi-car visual editor (Agent B).
 * Release refuses to render until every slot has a real verified source.
 * LayoutProof is visibly labelled synthetic timing-only previsualisation.
 * Agent C owns original soundtrack and engine sounds.
 */
import React from 'react';
import {
  AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence,
  staticFile, useCurrentFrame,
} from 'remotion';
import rawShotmap from '../../production/videos/gt3-nurburgring-multicar-001/edit/shotmap.json';

type Transition = {kind:'hard'|'cut'|'impact'|'whip'|'mono';frames:number;direction:'left'|'right'};
type Edit = {speed:number;cropX:number;cropY:number;driftX:number;push:number;contrast:number;saturation:number;brightness:number};
type Slot = {
  id:string;from:number;to:number;
  targetMake:string;targetModel:string;targetAngle:string;
  source:string|null;sourceInFrame:number|null;sourceFilmId:string|null;
  verifiedMake:string|null;verifiedModel:string|null;sourceSha256:string|null;
  transition:Transition;edit:Edit;
};
const spec = rawShotmap as {width:number;height:number;fps:number;durationInFrames:number;shots:Slot[];impactFrames:number[]};
const clamp = {extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};

const TimingSlate:React.FC<{slot:Slot;frame:number;length:number}>=({slot,frame,length})=>{
  const p=Math.min(1,Math.max(0,frame/Math.max(1,length-1)));
  const move=slot.edit.driftX*p*4;
  return <AbsoluteFill style={{overflow:'hidden',background:'linear-gradient(115deg,#121820,#26333d 55%,#0b0e13)'}}>
    <AbsoluteFill style={{opacity:.22,background:'repeating-linear-gradient(117deg,transparent 0px,transparent 54px,#8da1aa 55px,transparent 57px)',
      transform:'translateX('+move+'px) scale(1.18)'}}/>
    <div style={{position:'absolute',top:34,left:48,fontSize:24,letterSpacing:3,fontFamily:'Arial,sans-serif',fontWeight:700,color:'#f0c67d'}}>
      TIMING ONLY · NO FOOTAGE · AGENT A PENDING
    </div>
    <div style={{position:'absolute',top:365,left:70,fontFamily:'Arial,sans-serif',fontSize:84,fontWeight:900,
      letterSpacing:-3,color:'#f4f6f8',textShadow:'0 5px 28px #000'}}>
      {slot.targetMake.toUpperCase()}
    </div>
    <div style={{position:'absolute',top:476,left:76,fontFamily:'Arial,sans-serif',fontSize:34,color:'#c9d2d9'}}>
      {slot.targetModel} · {slot.targetAngle}
    </div>
    <div style={{position:'absolute',bottom:38,left:48,fontFamily:'monospace',fontSize:26,color:'#f4c87e'}}>
      {slot.id} | frame {slot.from}–{slot.to-1} | not production media
    </div>
  </AbsoluteFill>;
};

const ShotLayer:React.FC<{slot:Slot;planningPreview:boolean}>=({slot,planningPreview})=>{
  const local=useCurrentFrame();
  const overlap=slot.transition.frames;
  const entire=slot.to-slot.from+overlap;
  const p=interpolate(local,[0,Math.max(1,entire-1)],[0,1],clamp);
  const ease=Easing.inOut(Easing.quad)(p);
  const opacity=overlap>0?interpolate(local,[0,overlap],[0,1],clamp):1;
  const drift=slot.edit.driftX*(ease-.5);
  const whip=slot.transition.kind==='whip' && local<overlap
    ? (slot.transition.direction==='left'?1:-1)*(overlap-local)*18 :0;
  const scale=1.045+slot.edit.push*ease;
  const styled:React.CSSProperties={
    width:'100%',height:'100%',objectFit:'cover',objectPosition:slot.edit.cropX+'% '+slot.edit.cropY+'%',
    transform:'translate3d('+(drift+whip)+'px,0,0) scale('+scale+')',
    filter:'brightness('+slot.edit.brightness+') contrast('+slot.edit.contrast+') saturate('+slot.edit.saturation+')'
      +(slot.transition.kind==='mono'&&local<3?' grayscale(0.8)':''),
  };
  return <AbsoluteFill style={{overflow:'hidden',opacity,background:'#000'}}>
    {planningPreview
      ? <TimingSlate slot={slot} frame={local} length={entire}/>
      : <OffthreadVideo
          src={staticFile(slot.source!)}
          muted
          startFrom={Math.max(0,Math.round(slot.sourceInFrame!-overlap*slot.edit.speed))}
          playbackRate={slot.edit.speed}
          style={styled}
        />}
  </AbsoluteFill>;
};

export const Gt3MultiCarMontage:React.FC<{planningPreview?:boolean}>=({planningPreview=false})=>{
  const frame=useCurrentFrame();
  if(!planningPreview){
    const missing=spec.shots.filter(s=>!s.source||s.sourceInFrame===null||!s.verifiedMake||!s.sourceFilmId||!s.sourceSha256);
    if(missing.length)throw new Error('GT3 MEDIA GATE BLOCKED: '+missing.length+' unverified shot slots; run validate-shotmap.mjs --strict.');
  }
  return <AbsoluteFill style={{backgroundColor:'#000'}}>
    {spec.shots.map(slot=>
      <Sequence
        key={slot.id}
        from={slot.from-slot.transition.frames}
        durationInFrames={slot.to-slot.from+slot.transition.frames}
      >
        <ShotLayer slot={slot} planningPreview={planningPreview}/>
      </Sequence>
    )}
    {spec.impactFrames.map(hit=>{
      const delta=frame-hit;
      if(delta<0||delta>1)return null;
      return <AbsoluteFill key={hit} style={{
        pointerEvents:'none',backgroundColor:'#fff',
        opacity:delta===0?.20:.065,mixBlendMode:'screen',
      }}/>;
    })}
    {planningPreview&&<div style={{position:'absolute',right:42,top:34,fontFamily:'monospace',fontSize:23,color:'#fff'}}>
      PREVIS / 1920×1080 / {frame+1} OF {spec.durationInFrames}
    </div>}
  </AbsoluteFill>;
};
