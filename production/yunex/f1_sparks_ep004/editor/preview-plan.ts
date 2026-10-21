/**
 * VIDEO-ONLY six-beat editorial review plan.
 * These seconds are silent PICTURE REVIEW shot lengths, NOT recorded VO
 * timestamps. No fake transcript, Audio component or sample spoken captions.
 */
import type {ShotId} from '../shared/contract.ts';
import {findAuthenticSparkMoment} from './contact-hook.ts';

export const PREVIEW_FPS=30;
export const PREVIEW_WIDTH=1080;
export const PREVIEW_HEIGHT=1920;
export const PREVIEW_CUT_FRAMES=[0,24,75,159,222,258,420] as const;
export const PREVIEW_TOTAL_FRAMES=420;
export const PREVIEW_SHOTS:readonly ShotId[]=[
 'spark-hook','rear-mystery','underfloor-reveal','aero-load','contact-macro','racing-payoff'
];

export type PreviewFrame=Readonly<{
 shot:ShotId;frame:number;localFrame:number;
 localSec:number;durationSec:number;sourceSec:number;
 startFrame:number;endFrameExclusive:number;timeScale:number;
}>;

/** A real Agent 2 particle birth, never an arbitrary authored spark time.
 * Search only approved identical-track physics with Agent 1 metal skids.
 */
export const authenticSparkTime=():number=>
 findAuthenticSparkMoment({startSec:0,endSec:12,minimumVisibleParticles:6}).sourceSec;

/** Tightly limited slow-motion at ACTUAL real contact, not fake metal events.
 * Outside the hook & contact closeup the car moves at natural physical speed.
 */
export function previewFrame(frame:number,sparkTimeSec:number):PreviewFrame{
 if(!Number.isInteger(frame)||frame<0||frame>=PREVIEW_TOTAL_FRAMES)
  throw new Error('EP004 editor preview: frame outside real six-shot picture');
 if(!Number.isFinite(sparkTimeSec)||sparkTimeSec<0)
  throw new Error('EP004 editor preview: invalid genuine metal-contact cue');
 let i=0;
 while(i<6 && frame>=PREVIEW_CUT_FRAMES[i+1])i++;
 const start=PREVIEW_CUT_FRAMES[i],end=PREVIEW_CUT_FRAMES[i+1];
 const localFrame=frame-start,localSec=localFrame/PREVIEW_FPS;
 const durationSec=(end-start)/PREVIEW_FPS;
 // Mid-beats are a continuous high-speed race followed by an explicitly edited
 // contact replay and a new fast car chase. No fake route/particle generation.
 const sourceStarts=[sparkTimeSec,1.30,2.96,4.72,sparkTimeSec,6.35];
 const timeScale=i===0?.24:i===4?.04:1;
 return {shot:PREVIEW_SHOTS[i],frame,localFrame,localSec,durationSec,
  sourceSec:sourceStarts[i]+localSec*timeScale,
  startFrame:start,endFrameExclusive:end,timeScale};
}
