import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {RaceCarId,RacePath,RacePose,V3} from '../contract.ts';
import type {EpisodePaths} from '../graphics/model.ts';

/** ONLY an independent A5 staging adapter. Not Agent 1's accepted paths or Agent 2 physics.
 *  Editorial files ingest the actual A1/A2 adapters once their branches land.
 */
const total=routeLength('track');
const ANCHOR:V3=[65,0,18];
const pointDistance=(a:V3,b:V3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
let center=0,nearest=Infinity;
for(let i=0;i<768;i++){
 const d=i*total/768,p=sampleRoute('track',d).position;
 if(pointDistance(p,ANCHOR)<nearest){center=d;nearest=pointDistance(p,ANCHOR);}
}
const v=(d:number)=>sampleRoute('track',d).position;
function baseDerivative(d:number){
 const a=v(d-.1),b=v(d+.1),tx=b[0]-a[0],tz=b[2]-a[2],len=Math.hypot(tx,tz)||1;
 return [tx/len,tz/len] as const;
}
const before=baseDerivative(center-3),after=baseDerivative(center+3);
const inwardSign=Math.sign(before[0]*after[1]-before[1]*after[0])||-1;
const segmentStart=center-31,SEGMENT=72;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function position(id:RaceCarId,s:number):V3{
 const d=segmentStart+clamp(s,0,SEGMENT);
 const p=v(d),t=baseDerivative(d),n:[number,number]=[-t[1],t[0]];
 const u=clamp(s/SEGMENT,0,1);
 // A holds the inside; B enters wide, brushes inside and opens the steering on exit.
 const lateral=id==='shortcut'?2.1:-3.25+5.6*Math.sin(Math.PI*u)**2;
 const sign=inwardSign*lateral;
 return [p[0]+n[0]*sign,0,p[2]+n[1]*sign];
}
const wrapAngle=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
function sample(id:RaceCarId,s:number):RacePose{
 const t=clamp(s,.1,SEGMENT-.1);
 const p=position(id,s),ahead=position(id,Math.min(t+.08,SEGMENT)),
   behind=position(id,Math.max(t-.08,0));
 const yaw=Math.atan2(-(ahead[2]-behind[2]),ahead[0]-behind[0]);
 const heading=(d:number)=>{
  const a=position(id,Math.max(0,d-.1)),b=position(id,Math.min(SEGMENT,d+.1));
  return Math.atan2(-(b[2]-a[2]),b[0]-a[0]);
 };
 return {position:p,yaw,curvatureInvM:wrapAngle(heading(t+.3)-heading(t-.3))/.6};
}
function make(id:RaceCarId):RacePath{
 return {id,lengthM:SEGMENT,entryDistanceM:1,apexDistanceM:SEGMENT/2,
   exitDistanceM:SEGMENT-1,sampleAtDistance:(d)=>sample(id,d)};
}
export const STAGING_PREVIEW_PATHS:EpisodePaths={
 shortcut:make('shortcut'),racing:make('racing')
};
export const previewDistance=(frame:number,id:RaceCarId)=>clamp(
  4+frame*.29+(id==='racing'?-8:0),0,SEGMENT
);
