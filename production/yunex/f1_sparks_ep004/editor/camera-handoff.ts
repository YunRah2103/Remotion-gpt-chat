/**
 * Exact final Agent 3 camera contract derived ONLY from verified original-
 * narration word anchors. No guessed clip length or approved camera claim.
 *
 * Agent 5's 0.18s cinematic overlap is allowed ONLY when two cut endpoints
 * sample continuous source time (not when rejoining a spark-hook flashforward).
 * All 6 shots are requested and the hero's +X world route never restarts.
 */
import {SHOT_ORDER,EP004_FPS,type PicturePlan} from './timing.ts';
import type {ShotId} from '../shared/contract.ts';

export type CameraShotHandoff=Readonly<{
  shot:ShotId;
  startFrame:number;
  endFrameExclusive:number;
  frameCount:number;
  voStartSec:number;
  voEndSec:number;
  physicsStartSec:number;
  physicsEndSecExclusive:number;
  incomingCut:'cold-open'|'continuous-match'|'hard-time-jump';
  incomingBlendFrames:number;
  incomingHandleSec:number;
  hasApprovedRecordedTiming:true;
}>;

export function deriveCameraHandoff(plan:PicturePlan, desiredBlendSec=0.18):readonly CameraShotHandoff[]{
  if(plan.fps!==EP004_FPS || plan.width!==1080 || plan.height!==1920
     ||!Number.isInteger(plan.totalFrames)||plan.totalFrames<=0
     ||plan.cuts.length!==6||plan.words.length<6
     ||!Number.isFinite(plan.audioDurationSec)||plan.audioDurationSec<=0
     ||typeof plan.audioSrc!=='string'||!plan.audioSrc||/ep003/i.test(plan.audioSrc)){
    throw new Error('EP004 camera handoff: real recorded-voice six-shot plan is required');
  }
  if(!Number.isFinite(desiredBlendSec)||desiredBlendSec<0||desiredBlendSec>=.35)
    throw new Error('EP004 camera handoff: invalid source-verified blend handle');
  const blended=Math.floor(desiredBlendSec*EP004_FPS);
  const output:CameraShotHandoff[]=[];
  let prevEnd=0;
  for(const [index,cut] of plan.cuts.entries()){
    if(cut.shot!==SHOT_ORDER[index]||cut.startFrame!==prevEnd
       ||cut.endFrameExclusive>plan.totalFrames
       ||cut.endFrameExclusive<=cut.startFrame||cut.durationFrames!==cut.endFrameExclusive-cut.startFrame
       ||cut.durationFrames<18)
      throw new Error('EP004 camera handoff: missing, discontinuous or too-short shot '+index);
    const physicsStartSec=cut.sourceStartSec??cut.startFrame/EP004_FPS;
    if(!Number.isFinite(physicsStartSec)||physicsStartSec<0)
      throw new Error('EP004 camera handoff: bad real source-time anchor at shot '+index);
    const physicsEndSecExclusive=physicsStartSec+cut.durationFrames/EP004_FPS;
    const previous=output.at(-1);
    // Even when the selected real spark moment accidentally numerically aligns
    // with the first VO cut, a declared flash-forward is a deliberate story jump.
    // Never hide that jump with a false optical dissolve.
    const intentionalHookFlashforward=index===1 && plan.cuts[0].sourceStartSec!==undefined;
    const sourceContinuous=previous!==undefined && !intentionalHookFlashforward
      &&Math.abs(physicsStartSec-previous.physicsEndSecExclusive)<1/EP004_FPS+1e-7;
    const allowable=index===0?0:sourceContinuous
      ? Math.min(blended,Math.floor((cut.durationFrames-1)/3),Math.floor((previous!.frameCount-1)/3))
      : 0;
    output.push({
      shot:cut.shot,startFrame:cut.startFrame,endFrameExclusive:cut.endFrameExclusive,
      frameCount:cut.durationFrames,
      voStartSec:cut.startFrame/EP004_FPS,voEndSec:cut.endFrameExclusive/EP004_FPS,
      physicsStartSec,physicsEndSecExclusive,
      incomingCut:index===0?'cold-open':sourceContinuous?'continuous-match':'hard-time-jump',
      incomingBlendFrames:allowable,incomingHandleSec:allowable/EP004_FPS,
      hasApprovedRecordedTiming:true
    });
    prevEnd=cut.endFrameExclusive;
  }
  if(prevEnd!==plan.totalFrames)
    throw new Error('EP004 camera handoff: last frame does not end with recorded VO');
  return output;
}
