import React, {useMemo} from 'react';
import {
  AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame,
} from 'remotion';
import {
  assertBeatMap, BEATS, DURATION, framingFor, FPS, type BeatSlot,
  type Generation, type M5Shot, type TimelineShot, validateM5Shots,
} from './timeline';

/**
 * EDIT DESIGN / BMW M5 EVOLUTION
 * Always exactly ONE source clip at a time: no old clip bleed,
 * arbitrary image grids, or same-video duplicates as split panels.
 * Every source file must be authenticated by Agent A before production.
 */

export type M5EvolutionFilmProps = {
  mode: 'production' | 'diagnostic';
  shots?: M5Shot[];
};

const PALETTE: Record<Generation, {wash: string; accent: string; matte: string}> = {
  E28: {wash:'#151817', accent:'#e1d4bb', matte:'#111211'},
  E34: {wash:'#1b2024', accent:'#d1d7d6', matte:'#10151a'},
  E39: {wash:'#131b24', accent:'#bdd0dc', matte:'#0b141c'},
  E60: {wash:'#15171d', accent:'#bbc9d7', matte:'#0b1019'},
  F10: {wash:'#0c141c', accent:'#9fc1d9', matte:'#07121b'},
  F90: {wash:'#0a111d', accent:'#84badf', matte:'#050b12'},
  G90: {wash:'#091222', accent:'#94d6ff', matte:'#030813'},
};
const safe = {extrapolateLeft:'clamp' as const, extrapolateRight:'clamp' as const};
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const tween = (f: number, a: number, b: number, v1: number, v2: number) =>
  interpolate(f,[a,b],[v1,v2],{...safe,easing:ease});
const phase = (f:number,n:number) => Math.max(0,Math.min(1,f / Math.max(1,n)));
const track = ['NOSE / APPROACH','WHEEL / DETAIL','SIDE / TRACKING','REAR / EXIT','ROAD / MOTION','HERO / PASS'] as const;

const DiagnosticVideo: React.FC<{beat:BeatSlot}> = ({beat}) => {
  const frame = useCurrentFrame();
  const tint = PALETTE[beat.generation];
  const moving = (frame*26 + beat.slot*83) % 900;
  return <AbsoluteFill style={{
    overflow:'hidden',
    background:'linear-gradient(128deg, '+tint.matte+', '+tint.wash+' 63%, #020408)',
  }}>
    <div style={{position:'absolute',width:1400,height:280,top:455,left:-260,
      background:'linear-gradient(90deg,transparent,rgba(226,228,220,.19),transparent)',
      transform:'rotate(-18deg) translateX('+ (moving-400) +'px)'}}/>
    {Array.from({length:8},(_,i)=><div key={i} style={{position:'absolute',
      width:1100,height:3,top:640+i*96,left:-70,
      background:i%2?'rgba(239,244,253,.1)':'rgba(255,255,255,.06)',
      transform:'perspective(800px) skewY(-14deg) translateX(' + ((moving*(i+1)/7)%500-250) +'px)'}}/>)}
    <div style={{position:'absolute',left:80,top:742,right:80,
      color:'#ffcf8b',font:'900 39px Arial, sans-serif',letterSpacing:7}}>DIAGNOSTIC — NO VERIFIED FOOTAGE</div>
    <div style={{position:'absolute',left:80,top:820,right:80,
      font:'600 25px Arial, sans-serif',letterSpacing:4,color:'#eff2ef'}}>SLOT {String(beat.slot).padStart(2,'0')} / 42 • {track[beat.withinChapter]}</div>
    <div style={{position:'absolute',left:80,top:890,
      font:'500 22px Arial, sans-serif',color:'rgba(255,255,255,.68)'}}>Synthetic animation for edit timing only</div>
  </AbsoluteFill>;
};

const RealVideo: React.FC<{shot:M5Shot;beat:BeatSlot}> = ({shot,beat}) => {
  const f = useCurrentFrame();
  const crop = framingFor(shot);
  // A native 1080p landscape archival source is framed as a picture field
  // instead of expanding a 607px-wide portrait sliver to 1080 pixels.
  const panel = crop === 'editorialPanel';
  const panX = (beat.withinChapter % 2 ? -1 : 1) * (panel ? 9 : 5) * phase(f,beat.durationFrames);
  const zoom = 1.014 + (beat.withinChapter % 3) * .004 + phase(f,beat.durationFrames) * .027;
  const video = <OffthreadVideo
    src={staticFile(shot.file)}
    startFrom={Math.round(shot.inSeconds*FPS)}
    muted
    style={{position:'absolute',inset:0,width:'100%',height:'100%',
      objectFit:'cover',objectPosition:String(shot.x??50)+'% '+String(shot.y??50)+'%',
      filter:'contrast(1.045) saturate(.94) brightness(.99)',
      transform:'translate3d('+panX+'px,0,0) scale('+zoom+')'}}
  />;
  if (!panel) {
    return <AbsoluteFill style={{background:PALETTE[beat.generation].matte,overflow:'hidden'}}>
      {video}
      <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(1,4,9,.28),transparent 34%,transparent 63%,rgba(1,3,7,.39))'}}/>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{background:PALETTE[beat.generation].matte}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 45% 46%, '+PALETTE[beat.generation].wash+' 0%, #020509 84%)'}}/>
    <div style={{position:'absolute',left:-124,top:410,width:1328,height:1040,
      overflow:'hidden',background:'#080d11',boxShadow:'0 35px 130px rgba(0,0,0,.88)'}}>
      {video}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        boxShadow:'inset 0 0 75px rgba(2,3,4,.45)'}}/>
    </div>
    <div style={{position:'absolute',left:66,right:66,top:380,height:1,background:'rgba(245,242,229,.38)'}}/>
    <div style={{position:'absolute',left:66,right:66,top:1467,height:1,background:'rgba(245,242,229,.38)'}}/>
  </AbsoluteFill>;
};

const GenerationTitle: React.FC<{beat:BeatSlot}> = ({beat}) => {
  const frame = useCurrentFrame(); // shot-local frame
  const chapterElapsed = (beat.startFrame - BEATS[beat.chapterIndex*6].startFrame) + frame;
  const after = chapterElapsed < 32 || (beat.slot === 42);
  if (!after) return null;
  const accent=PALETTE[beat.generation].accent;
  const fade=tween(chapterElapsed,0,4,0,1)*tween(chapterElapsed,24,32,1,0);
  const last = beat.slot===42;
  const visible=last?Math.max(fade,.92):fade;
  return <div style={{position:'absolute',left:74,right:100,top:213,
    color:'#f4f4f1',opacity:visible,textShadow:'0 4px 25px rgba(0,0,0,.75)',
    transform:'translateY('+tween(chapterElapsed,0,9,25,0)+'px)'}}>
    <div style={{font:'700 19px Arial,sans-serif',letterSpacing:7,color:accent,marginBottom:8}}>BMW M5 / EVOLUTION</div>
    <div style={{display:'flex',alignItems:'baseline',gap:29}}>
      <span style={{font:'800 106px Arial,sans-serif',letterSpacing:-6,lineHeight:1}}>{beat.generation}</span>
      <span style={{font:'500 35px Georgia,serif',letterSpacing:2,color:'#e4e3df'}}>{beat.generationYear}</span>
    </div>
    <div style={{height:2,width:tween(chapterElapsed,0,14,0,195),marginTop:19,background:accent}}/>
  </div>;
};

const BeatAccent:React.FC<{beat:BeatSlot}>=({beat})=>{
  const f=useCurrentFrame();
  const tint=PALETTE[beat.generation].accent;
  // All accents are OVER incoming footage, never a transition to old footage.
  // Effects are only 1-3 frames of the 12-15-frame beat.
  const pop=1-phase(f,3);
  if (beat.withinChapter===0) {
    return <>
      <div style={{position:'absolute',top:0,bottom:0,left:tween(f,0,3,-120,1110),
        width:4,background:'#e8f5ff',opacity:.6*pop,boxShadow:'0 0 38px '+tint}}/>
      <AbsoluteFill style={{background:tint,opacity:f===0?.06:0,pointerEvents:'none'}}/>
    </>;
  }
  if(beat.withinChapter===1) return <div style={{position:'absolute',left:0,top:325,width:5,
    height:tween(f,0,3,560,0),background:tint,opacity:pop*.67}}/>;
  if(beat.withinChapter===2) return <div style={{position:'absolute',top:380,left:0,
    width:tween(f,0,4,470,0),height:3,background:tint,opacity:.62*pop}}/>;
  if(beat.withinChapter===3) return <div style={{position:'absolute',right:0,top:630,width:5,
    height:tween(f,0,3,490,0),background:tint,opacity:.58*pop}}/>;
  if(beat.withinChapter===4) return <div style={{position:'absolute',top:0,bottom:0,
    right:tween(f,0,3,-110,1100),width:3,transform:'skewX(-9deg)',
    background:tint,opacity:.50*pop}}/>;
  return <div style={{position:'absolute',bottom:190,left:64,
    height:2,width:tween(f,0,4,240,0),background:tint,opacity:.52*pop}}/>;
};

const FinalFlourish:React.FC<{beat:BeatSlot}>=({beat})=>{
  const f=useCurrentFrame();
  if(beat.slot !== 42) return null;
  return <div style={{position:'absolute',left:74,bottom:280,right:74,
    borderTop:'1px solid rgba(243,244,251,.6)',paddingTop:19,
    transform:'translateY('+tween(f,0,8,25,0)+'px)',opacity:tween(f,0,7,0,1)}}>
    <div style={{font:'bold 23px Arial,sans-serif',letterSpacing:8,color:'#f4f4fa'}}>SEVEN ERAS. ONE LEGEND.</div>
  </div>;
};

const Shot:React.FC<{beat:BeatSlot;mode:'production'|'diagnostic';shot?:M5Shot}>=
({beat,mode,shot})=>{
  const f=useCurrentFrame();
  const accent=PALETTE[beat.generation].accent;
  return <AbsoluteFill style={{overflow:'hidden',background:'#070b11'}}>
    {mode==='diagnostic'?<DiagnosticVideo beat={beat}/>:<RealVideo shot={shot!} beat={beat}/>}
    {/* Kinetic editorial engraving is intentionally tiny and sparse. */}
    <div style={{position:'absolute',left:69,right:69,bottom:166,height:1,
      background:'rgba(240,240,236,.23)'}}/>
    <div style={{position:'absolute',left:74,bottom:119,color:accent,
      font:'600 16px Arial,sans-serif',letterSpacing:4.5,opacity:.85}}>
      {beat.withinChapter===0?'GEN '+String(beat.chapterIndex+1).padStart(2,'0')+' / 07':' '}
    </div>
    <GenerationTitle beat={beat}/>
    <BeatAccent beat={beat}/>
    <FinalFlourish beat={beat}/>
    {mode==='diagnostic'&&<div style={{position:'absolute',bottom:229,right:75,
      color:'#ffce8c',font:'bold 19px Arial',letterSpacing:3}}>
      SIMULATED • FRAME {beat.startFrame+f}</div>}
  </AbsoluteFill>;
};

export const M5EvolutionFilm:React.FC<M5EvolutionFilmProps>=({mode,shots=[]})=>{
  const timeline=useMemo(()=>{
    assertBeatMap();
    return mode==='production'?validateM5Shots(shots):BEATS;
  },[mode,shots]);
  return <AbsoluteFill style={{background:'#04070c',fontFamily:'Arial,sans-serif'}}>
    {timeline.map((beat)=>{
      const shot = mode==='production'?(beat as TimelineShot).asset:undefined;
      return <Sequence key={beat.slot} from={beat.startFrame}
        durationInFrames={beat.durationFrames} layout="none">
        <Shot beat={beat} shot={shot} mode={mode}/>
      </Sequence>;
    })}
  </AbsoluteFill>;
};

export const M5EvolutionParameters={fps:FPS,frames:DURATION,width:1080,height:1920} as const;
