import React from 'react';
import {
  AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence,
  staticFile, useCurrentFrame,
} from 'remotion';
import manifest from './shot-manifest.json';

export type SourceShot = {
  slot: number;
  shotId: string;
  file: string;
  sourceId: string;
  inSeconds: number;
  playbackRate: number;
  angle: string;
  direction: 'left' | 'right' | 'front' | 'rear' | 'static-camera';
  cropX: number;
  cropY: number;
  sourceSHA256: string;
  evidence: string;
  licenseId: string;
};
type ShotManifest = {schemaVersion: number; status: string; shots: SourceShot[]};

export const BEAT_FRAMES = [
  0,16,31,47,62,78,93,109,124,139,155,171,187,202,217,233,
  249,264,279,295,311,326,341,357,373,388,403,419,435,450,
  465,481,497,512,527,543,559,574,589,
] as const;
export const FILM_FPS = 30;
export const FILM_FRAMES = 600;
const info = manifest as ShotManifest;
const clamp = {extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const ease = Easing.bezier(0.18,0.78,0.28,1);

const MotionShot: React.FC<{shot: SourceShot; index: number; frames: number}> = ({shot,index,frames}) => {
  const f=useCurrentFrame();
  const intro=interpolate(f,[0,7],[1,0],clamp);
  const pan=interpolate(f,[0,Math.max(1,frames-1)],[-9,9],clamp);
  const zoom=1.09+0.046*intro+(index%3===0?0.016:0);
  const accent=index%8===0;
  const flash=accent?interpolate(f,[0,1,3,5],[0.14,0.10,0.02,0],clamp):0;
  const sway=index%2===0?1:-1;
  const subtleVignette='radial-gradient(ellipse at 51% 49%,transparent 39%,rgba(4,5,9,.26) 75%,rgba(4,5,9,.60) 100%)';

  return <AbsoluteFill style={{background:'#030507',overflow:'hidden'}}>
    <AbsoluteFill style={{
       transform:'translate3d('+(-pan*sway)+'px,'+(pan*0.16)+'px,0) scale('+zoom+')',
    }}>
      <OffthreadVideo
        src={staticFile('bmw-m5-g90-beat/'+shot.file)}
        startFrom={Math.round(shot.inSeconds*FILM_FPS)}
        playbackRate={shot.playbackRate}
        muted
        style={{height:'100%',width:'100%',objectFit:'cover',
          objectPosition:shot.cropX+'% '+shot.cropY+'%',
          filter:'brightness(.94) contrast(1.12) saturate(.84)'}}
      />
    </AbsoluteFill>
    <AbsoluteFill style={{background:subtleVignette,pointerEvents:'none'}} />
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.26) 0%,transparent 26%,transparent 72%,rgba(0,0,0,.31) 100%)',pointerEvents:'none'}} />
    {/* Very short optical emphasis; never substitute transitions for an actual new moving shot. */}
    <AbsoluteFill style={{background:'#fff8e7',opacity:flash,pointerEvents:'none'}} />
    {index%4===0 && <div style={{
       position:'absolute',left:40,top:140,width:4,height:180,
       background:'rgba(239,232,216,.62)',transform:'scaleY('+interpolate(f,[0,9],[0,1],clamp)+')',
       transformOrigin:'top',
     }}/>}
    {index%8===0 && <div style={{position:'absolute',left:0,top:0,width:1080,height:9,
      background:'rgba(214,205,191,.65)',opacity:interpolate(f,[0,5],[.8,0],clamp)}} />}
  </AbsoluteFill>;
};

const MasterGraphics:React.FC=()=>{
  const frame=useCurrentFrame();
  const headOpacity=interpolate(frame,[1,6,41,57],[0,1,1,0],clamp);
  const tailOpacity=interpolate(frame,[550,571,586,599],[0,1,1,.80],clamp);
  return <AbsoluteFill style={{pointerEvents:'none',color:'#f6f3ed'}}>
    <div style={{position:'absolute',left:64,right:64,top:95,
      display:'flex',justifyContent:'space-between',alignItems:'center',
      opacity:headOpacity}}>
      <span style={{font:'700 24px Arial,sans-serif',letterSpacing:5}}>BMW</span>
      <span style={{font:'600 18px Arial,sans-serif',letterSpacing:6}}>G90 / 2025+</span>
    </div>
    <div style={{position:'absolute',left:61,bottom:238,opacity:headOpacity,
       transform:'translate3d(0,'+interpolate(frame,[0,14],[24,0],clamp)+'px,0)'}}>
      <div style={{font:'900 166px Arial,sans-serif',lineHeight:.85,letterSpacing:-11,
        textShadow:'0 9px 55px rgba(0,0,0,.65)'}}>M5<span style={{color:'#d3c7af'}}>.</span></div>
      <div style={{font:'700 18px Arial,sans-serif',letterSpacing:10,marginTop:30}}>THE NEXT GENERATION</div>
    </div>
    <div style={{position:'absolute',left:54,bottom:210,opacity:tailOpacity,
       transform:'translate3d(0,'+interpolate(frame,[550,570],[32,0],clamp)+'px,0)'}}>
      <div style={{font:'900 163px Arial,sans-serif',lineHeight:.88,letterSpacing:-8,
          textShadow:'0 5px 35px rgba(0,0,0,.8)'}}>M5</div>
      <div style={{font:'700 21px Arial,sans-serif',letterSpacing:14,
        marginLeft:8,marginTop:26}}>G90 / SALOON</div>
    </div>
    <div style={{position:'absolute',left:54,bottom:87,right:54,height:1,
         background:'rgba(247,243,234,.48)',opacity:.6}} />
  </AbsoluteFill>;
};

export const BmwM5G90Beat001:React.FC=()=>{
  if(info.status!=='ready'||info.shots.length!==BEAT_FRAMES.length) {
    throw new Error('BMW M5 G90 footage is not approved: Agent A needs 39 verified licensed moving shots. Run editor/validate_editor.py.');
  }
  return <AbsoluteFill style={{background:'#030507'}}>
    {BEAT_FRAMES.map((from,i)=>{
      const duration=(i===BEAT_FRAMES.length-1?FILM_FRAMES:BEAT_FRAMES[i+1])-from;
      const shot=info.shots[i];
      if(shot.slot!==i+1) throw new Error('Shot slot does not match beat slot '+(i+1));
      return <Sequence key={shot.shotId} name={'M5 G90 beat '+(i+1)} from={from} durationInFrames={duration}>
        <MotionShot shot={shot} index={i} frames={duration}/>
      </Sequence>;
    })}
    <MasterGraphics/>
  </AbsoluteFill>;
};
