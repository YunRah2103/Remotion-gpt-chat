import type {CarFrameState,RaceCarId,RaceFrameState,RacePath,RacePose,V3} from '../contract.ts';

/** Film-grade UI decisions are derived from injected A1/A2 data; no synthetic speeds. */
export type EpisodePaths=Record<RaceCarId,RacePath>;
export type FilmBeat='hook'|'shortcut'|'wide'|'explain'|'payoff'|'final';
export type CarGate={entryAtSeconds:number;exitAtSeconds:number;elapsedSeconds:number;exitSpeedMps:number};
export type GateComparison={
  shortcut:CarGate;
  racing:CarGate;
  winner:RaceCarId|'tie';
  leadSeconds:number;
  /** Both cars crossed the episode's matching entry and exit stations. */
  evidence:'a2-sampled-common-sector';
};
export type ArcWindow={startM:number;endM:number};

const finite=(n:number)=>Number.isFinite(n);
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const distance=(a:V3,b:V3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

export function validateRacePath(path:RacePath):void{
  if(!(path.lengthM>0)&&finite(path.lengthM))throw new Error('Invalid path length');
  if(!finite(path.lengthM)||!(path.entryDistanceM>=0)
    ||!(path.apexDistanceM>path.entryDistanceM)
    ||!(path.exitDistanceM>path.apexDistanceM)
    ||path.exitDistanceM>path.lengthM)throw new Error('Invalid path marks');
  for(const d of [path.entryDistanceM,path.apexDistanceM,path.exitDistanceM]){
    const p=path.sampleAtDistance(d);
    if(!p.position.every(finite)||!finite(p.yaw)||!finite(p.curvatureInvM))throw new Error('Invalid path pose');
  }
}

/** The reveal follows each REAL car's distance over its own A1 path, not film time. */
export function visibleArc(path:RacePath,progressM:number,trailM=34,leadM=5):ArcWindow|null{
  if(!finite(progressM)||!finite(trailM)||!finite(leadM)||trailM<=0||leadM<0) return null;
  const startM=clamp(progressM-trailM,path.entryDistanceM,path.exitDistanceM);
  const endM=clamp(progressM+leadM,path.entryDistanceM,path.exitDistanceM);
  return endM-startM>.05?{startM,endM}:null;
}

export function compareApexCurvature(paths:EpisodePaths):'racing-gentler'|'shortcut-gentler'|'inconclusive'{
  const a=Math.abs(paths.shortcut.sampleAtDistance(paths.shortcut.apexDistanceM).curvatureInvM);
  const b=Math.abs(paths.racing.sampleAtDistance(paths.racing.apexDistanceM).curvatureInvM);
  if(!finite(a)||!finite(b))return 'inconclusive';
  if(a>b*1.06&&a-b>0.0006)return 'racing-gentler';
  if(b>a*1.06&&b-a>0.0006)return 'shortcut-gentler';
  return 'inconclusive';
}

type Gate='entry'|'exit';
const mark=(p:RacePath,g:Gate)=>g==='entry'?p.entryDistanceM:p.exitDistanceM;
type Cross={time:number;speed:number};
function crossing(
 samples:readonly RaceFrameState[],id:RaceCarId,dist:number,fps:number
):Cross|null{
 for(let i=1;i<samples.length;i++){
   const previous=samples[i-1].cars[id],current=samples[i].cars[id];
   if(!previous||!current) return null;
   const a=previous.pathDistanceM,b=current.pathDistanceM;
   if(![a,b,previous.speedMps,current.speedMps].every(finite)
      ||previous.speedMps<0||current.speedMps<0||b<a-.0001)return null;
   if(a<=dist&&b>=dist&&b>a){
     const f=clamp((dist-a)/(b-a),0,1);
     return {time:(samples[i-1].frame+(samples[i].frame-samples[i-1].frame)*f)/fps,
             speed:previous.speedMps+(current.speedMps-previous.speedMps)*f};
   }
 }
 return null;
}

/** Only declare a winner after A2 sampled the same sector for both cars.
 *  Calls may sample at ANY fixed FPS, and crossing times are interpolated.
 *  Zero/unknown data is NOT grounds to invent a result.
 */
export function measureCommonSector(
 paths:EpisodePaths,sampleRaceFrame:(frame:number,fps:number)=>RaceFrameState,
 fps:number,firstFrame:number,lastFrame:number
):GateComparison|null{
 if(!finite(fps)||fps<=0||!Number.isInteger(firstFrame)||!Number.isInteger(lastFrame)
   ||lastFrame<=firstFrame||lastFrame-firstFrame>6000)return null;
 for(const p of Object.values(paths))validateRacePath(p);
 // Entry and exit marks must represent the same road stations despite legal lateral offsets.
 for(const g of ['entry','exit'] as const){
   const a=paths.shortcut.sampleAtDistance(mark(paths.shortcut,g)).position;
   const b=paths.racing.sampleAtDistance(mark(paths.racing,g)).position;
   if(distance(a,b)>12.1)return null;
 }
 const frames:RaceFrameState[]=[];
 for(let frame=firstFrame;frame<=lastFrame;frame++){
   const s=sampleRaceFrame(frame,fps);
   if(s.frame!==frame||s.fps!==fps)return null;
   frames.push(s);
 }
 const capture=(id:RaceCarId):CarGate|null=>{
   const p=paths[id],start=crossing(frames,id,p.entryDistanceM,fps);
   const end=crossing(frames,id,p.exitDistanceM,fps);
   if(!start||!end||!(end.time>start.time))return null;
   return {entryAtSeconds:start.time,exitAtSeconds:end.time,
     elapsedSeconds:end.time-start.time,exitSpeedMps:end.speed};
 };
 const shortcut=capture('shortcut'),racing=capture('racing');
 if(!shortcut||!racing)return null;
 const difference=shortcut.elapsedSeconds-racing.elapsedSeconds;
 const winner=Math.abs(difference)<.005?'tie':difference>0?'racing':'shortcut';
 return {shortcut,racing,winner,leadSeconds:Math.abs(difference),
   evidence:'a2-sampled-common-sector'};
}

/** Overlay owns copy and timing. A6 is free to retime FilmBeat without redefining numbers. */
export function storyCopy(beat:FilmBeat,paths:EpisodePaths,result?:GateComparison|null){
 switch(beat){
  case 'hook':return {eyebrow:'ONE CORNER · TWO LINES',headline:'WHICH ONE IS FASTER?',note:''};
  case 'shortcut':return {eyebrow:'CAR A · SHORTCUT',headline:'THE SHORTER WAY',note:''};
  case 'wide':return {eyebrow:'CAR B · RACING LINE',headline:'WIDE · APEX · WIDE',note:''};
  case 'explain':{
    const insight=compareApexCurvature(paths);
    return insight==='racing-gentler'?
      {eyebrow:'SAME CORNER',headline:'A SHARPER · B SMOOTHER',note:'CURVATURE CHANGES THE GRIP NEEDED'}:
      insight==='shortcut-gentler'?
      {eyebrow:'SAME CORNER',headline:'B SHARPER · A SMOOTHER',note:'NOT EVERY WIDE LINE IS FASTER'}:
      {eyebrow:'SAME CORNER',headline:'WATCH THE CURVES',note:'TYRE GRIP SETS THE LIMIT'};
  }
  case 'payoff':
    if(!result)return {eyebrow:'THE EXIT',headline:'THE TIMING TELLS US',note:'SECTOR DATA PENDING'};
    return {eyebrow:'SIMULATED CORNER TIME',
      headline:result.winner==='tie'?'VIRTUALLY LEVEL':
        result.winner==='racing'?'CAR B IS QUICKER':'CAR A IS QUICKER',
      note:result.winner==='tie'?'SAME SECTOR · SAME CONDITIONS':
        result.leadSeconds.toFixed(2)+'s AT THE MATCHED SECTOR'};
  case 'final':return {eyebrow:'THE REAL ANSWER',headline:'SHORTEST ISN\'T ALWAYS FASTEST',note:''};
 }
}
