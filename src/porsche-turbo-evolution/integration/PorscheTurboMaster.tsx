import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import beatMap from '../../../production/videos/porsche-911-turbo-evolution-001/beat-map.json';
import {BeatFxTransform} from '../../fx/FXComponents';
import type {BeatCut} from '../../fx/beat';

/** Master-facing adapter for Agent A's verified files and Agent B's shot choices.
 * Restricted video is staged privately under public/ for rendering; it is not
 * committed to the public repository. Agent C can replace the chapter FX plan
 * only after reviewing real footage.
 */
export type TurboGeneration = '930'|'964'|'993'|'996'|'997'|'991'|'992';
export type TurboShot = {
  slot: number;
  generation: TurboGeneration;
  file: string;
  shotKey: string;
  visualFingerprint: string;
  sourceId: string;
  sourceSha256: string;
  sourceWidth: number;
  sourceHeight: number;
  nativeFps: number;
  inSeconds: number;
  identityVerified: true;
  actualMotionVerified: true;
  x?: number;
  y?: number;
};
export type TurboMasterProps = {
  mode: 'production'|'diagnostic';
  shots?: TurboShot[];
};
type Beat = {
  slot: number;
  generation: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
};
const BEATS: ReadonlyArray<Beat> = beatMap.cuts;
const GEN: TurboGeneration[] = ['930','964','993','996','997','991','992'];
const LENGTHS = [4,4,4,4,4,5,5];
const FPS=30;
const FRAMES=510;
const fail=(msg:string):never=>{throw new Error('[PorscheTurboMaster] '+msg);};

export const validateTurboTimeline=():void=>{
  if(beatMap.output.frames!==FRAMES||beatMap.output.fps!==FPS||
    beatMap.output.width!==1080||beatMap.output.height!==1920)
    fail('Unexpected 510-frame / 1080x1920 / 30fps master geometry');
  if(BEATS.length!==30) fail('Expected 30 beat cuts');
  let frame=0, index=0, chapterEnd=LENGTHS[0];
  BEATS.forEach((b,i)=>{
    if(i>=chapterEnd){index++;chapterEnd+=LENGTHS[index];}
    if(b.slot!==i+1||b.generation!==GEN[index]||b.startFrame!==frame||
       b.endFrame-b.startFrame+1!==b.durationFrames||b.durationFrames<12)
      fail('Bad beat map at slot '+(i+1));
    frame=b.endFrame+1;
  });
  if(frame!==FRAMES||index!==6)fail('Beat map must end at frame 509');
};
export const validateTurboShots=(shots:ReadonlyArray<TurboShot>):void=>{
  validateTurboTimeline();
  if(shots.length!==30)fail('Production requires 30 real moving Turbo shots, got '+shots.length);
  const slots=new Set<number>(), keys=new Set<string>(), fingerprints=new Set<string>();
  const spans=new Map<string,Array<[number,number]>>();
  shots.forEach(s=>{
    const b=BEATS[s.slot-1];
    if(!b||slots.has(s.slot)||s.generation!==b.generation)
      fail('Duplicate/wrong generation at slot '+s.slot);
    slots.add(s.slot);
    if(!s.identityVerified||!s.actualMotionVerified)
      fail('No authenticated moving Turbo at slot '+s.slot);
    if(!s.shotKey||!s.visualFingerprint||keys.has(s.shotKey)||
       fingerprints.has(s.visualFingerprint))
      fail('Repeated/unverified camera view at slot '+s.slot);
    keys.add(s.shotKey);fingerprints.add(s.visualFingerprint);
    if(!s.sourceId||!/^[0-9a-f]{64}$/i.test(s.sourceSha256)||
       !s.file||/^(\/|https?:|data:)/i.test(s.file)||
       s.file.split('/').includes('..')||!/\.(mp4|mov|webm)$/i.test(s.file))
      fail('Invalid local source/provenance at slot '+s.slot);
    if(!Number.isFinite(s.inSeconds)||s.inSeconds<0||
       !Number.isFinite(s.sourceWidth)||s.sourceWidth<480||
       !Number.isFinite(s.sourceHeight)||s.sourceHeight<360||
       !Number.isFinite(s.nativeFps)||s.nativeFps<20||s.nativeFps>120)
      fail('Invalid media specification at slot '+s.slot);
    const times:[number,number]=[s.inSeconds,s.inSeconds+b.durationFrames/FPS];
    const history=spans.get(s.sourceId)??[];
    if(history.some(([a,z])=>times[0]<z-.015&&a<times[1]-.015))
      fail('Overlapping footage reused at slot '+s.slot);
    history.push(times);spans.set(s.sourceId,history);
  });
  if(slots.size!==30)fail('Missing Porsche beats');
};

const chapterStart=(slot:number)=>[1,5,9,13,17,21,26].includes(slot);
/** Opt-in, barely perceptible FX only on selected chapter starts. Agent C
 * has final say following source-aware visual QA. Normal beats are cuts.
 */
const chapterFx=(slot:number):BeatCut[]=>{
  if(![5,17,21,26].includes(slot))return [{frame:0,style:'cut'}];
  const style=slot===21?'whip-left':'punch';
  return [{frame:0,style,chapterStart:true}];
};

const RealShot:React.FC<{beat:Beat;shot:TurboShot}> = ({beat,shot})=>{
  const src=staticFile(shot.file);
  const trim=Math.round(shot.inSeconds*FPS);
  const objectPosition=(shot.x??50)+'% '+(shot.y??50)+'%';
  const aspect=shot.sourceWidth/shot.sourceHeight;
  const isPortrait=aspect<1.05;
  const panelHeight=Math.min(1050,Math.max(600,1080/aspect));
  const foreground=<OffthreadVideo src={src} trimBefore={trim} muted style={{
    width:'100%',height:'100%',objectFit:isPortrait?'cover':'contain',
    objectPosition,filter:'contrast(1.02) saturate(.98)'
  }}/>;
  return <AbsoluteFill style={{overflow:'hidden',background:'#080a0d'}}>
    <OffthreadVideo src={src} trimBefore={trim} muted style={{
      position:'absolute',left:-100,top:-100,width:1280,height:2120,
      objectFit:'cover',objectPosition,
      filter:'blur(65px) brightness(.34) saturate(.8)'
    }}/>
    {isPortrait?<AbsoluteFill>{foreground}</AbsoluteFill>:
      <div style={{position:'absolute',left:0,top:(1920-panelHeight)/2,
        width:1080,height:panelHeight,overflow:'hidden',
        WebkitMaskImage:'linear-gradient(to bottom,transparent 0%,black 5%,black 95%,transparent 100%)',
        maskImage:'linear-gradient(to bottom,transparent 0%,black 5%,black 95%,transparent 100%)'
      }}>{foreground}</div>}
  </AbsoluteFill>;
};
const Diagnostic:React.FC<{beat:Beat}>=({beat})=><AbsoluteFill style={{
  background:'#091017',alignItems:'center',justifyContent:'center',color:'#ffc17a'
}}>
  <div style={{font:'bold 30px Arial',letterSpacing:2}}>DIAGNOSTIC — NO VERIFIED PORSCHE FOOTAGE</div>
  <div style={{font:'24px Arial',marginTop:25}}>SLOT {beat.slot} / 30</div>
</AbsoluteFill>;

export const PorscheTurboMaster:React.FC<TurboMasterProps>=({mode,shots=[]})=>{
  useMemo(()=>{
    validateTurboTimeline();
    if(mode==='production')validateTurboShots(shots);
  },[mode,shots]);
  const bySlot=new Map(shots.map(s=>[s.slot,s]));
  return <AbsoluteFill style={{background:'#070a0d'}}>
    {BEATS.map(b=>{
      const shot=bySlot.get(b.slot);
      const isStart=chapterStart(b.slot);
      return <Sequence key={b.slot} from={b.startFrame}
        durationInFrames={b.durationFrames} layout="none">
        <AbsoluteFill>
          <BeatFxTransform cuts={chapterFx(b.slot)} duration={b.durationFrames}
             strength={isStart?0.2:0}>
            {mode==='production'&&shot?<RealShot beat={b} shot={shot}/>:<Diagnostic beat={b}/>}
          </BeatFxTransform>
          <div style={{position:'absolute',left:70,top:145,color:'#fff',
            font:'500 42px Arial,sans-serif',letterSpacing:0,textShadow:'none'}}>
            {b.generation}
          </div>
        </AbsoluteFill>
      </Sequence>;
    })}
  </AbsoluteFill>;
};
