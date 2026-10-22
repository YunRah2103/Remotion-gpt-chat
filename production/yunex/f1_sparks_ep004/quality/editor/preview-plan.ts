/**
 * Agent13 provisional VIDEO-ONLY moving picture review.
 * All six picture beats are provisional editorial lengths, NOT Cedar word timings.
 * 758 frames comes from a separately ffprobed original Cedar MP3 at 25.248 sec.
 * 25.248 sec times 30fps => ceil() 758 frames; no MP3 is embedded here.
 */
import type {ShotId} from '../../shared/contract.ts';
import {PHYSICAL_BEATS} from './staging/cinema/shot-plan.ts';
import {editorialStartDistance} from './payoff-source.ts';

export const REVIEW_FPS=30;
export const REVIEW_TOTAL_FRAMES=758;
export const REVIEW_CUT_FRAMES=[0,102,168,300,457,580,758] as const;
export const REVIEW_SHOTS=[
 'spark-hook','rear-mystery','underfloor-reveal',
 'aero-load','contact-macro','racing-payoff',
] as const satisfies readonly ShotId[];
export type ReviewBeat=Readonly<{
 shot:ShotId;frame:number;localFrame:number;localSec:number;
 durationSec:number;sourceSec:number;startDistanceM:number;
 aeroLoad01:number;startFrame:number;endFrameExclusive:number;
 sourceRate:number;
}>;

const clamp=(a:number)=>Math.max(0,Math.min(1,a));
const smooth=(a:number)=>{const t=clamp(a);return t*t*(3-2*t);};
export function reviewBeat(frame:number,sparkHookSec:number):ReviewBeat {
 if(!Number.isInteger(frame)||frame<0||frame>=REVIEW_TOTAL_FRAMES)
  throw Error('EP004 provisional picture review: frame outside 758-frame edit');
 if(!Number.isFinite(sparkHookSec)||sparkHookSec<0)
  throw Error('EP004: spark hook requires genuine physics-derived source sample');
 let i=0;
 while(i<6&&frame>=REVIEW_CUT_FRAMES[i+1])i++;
 const startFrame=REVIEW_CUT_FRAMES[i];
 const endFrameExclusive=REVIEW_CUT_FRAMES[i+1];
 const localFrame=frame-startFrame;
 const localSec=localFrame/REVIEW_FPS;
 const durationSec=(endFrameExclusive-startFrame)/REVIEW_FPS;
 const physical=PHYSICAL_BEATS[i];
 const sourceRate=i===0?.43:physical.sourceRate;
 const sourceIn=i===0?sparkHookSec:physical.sourceInSec;
 const aeroLoad01=i===3?.50+.50*smooth((localSec/durationSec-.17)/.68):1;
 return {shot:REVIEW_SHOTS[i],frame,localFrame,localSec,durationSec,
  sourceSec:sourceIn+localSec*sourceRate,
  startDistanceM:editorialStartDistance(physical.shot,physical.startDistanceM),
  aeroLoad01,sourceRate,startFrame,endFrameExclusive};
}
