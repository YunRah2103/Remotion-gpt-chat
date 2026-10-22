/** Six explicit editorial source clips, never a fabricated continuous lap.
 * Original 25.248sec VO / 758 frames will govern Agent 6's final edit;
 * these source-time handles are deliberately independent of narration.
 */
import type {ShotId} from '../../../../shared/contract.ts';
import {qualityCutAtFrame,qualityCutList} from './cameras.ts';

export type PhysicalBeat=Readonly<{
 shot:ShotId;startDistanceM:number;sourceInSec:number;sourceRate:number;
 reason:string;
}>;
/** Physics input start distances reuse observed contact regions from Agent 3,
 * NOT hardcoded particle births: emission is always recomputed by Agent 2.
 */
export const PHYSICAL_BEATS: readonly PhysicalBeat[]=[
 {shot:'spark-hook',startDistanceM:63.65,sourceInSec:.21,sourceRate:.22,reason:'Review real crest and spark with an immediate close lens'},
 {shot:'rear-mystery',startDistanceM:63.55,sourceInSec:.14,sourceRate:.37,reason:'High-parallax trailing pursuit'},
 {shot:'underfloor-reveal',startDistanceM:132.30,sourceInSec:.092,sourceRate:.18,reason:'Moving reveal; old clip was almost frozen'},
 {shot:'aero-load',startDistanceM:132.30,sourceInSec:.11,sourceRate:.35,reason:'Parallel track movement while downforce compression changes'},
 {shot:'contact-macro',startDistanceM:134.00,sourceInSec:.065,sourceRate:.16,reason:'Outside-the-body macro with actual intermittent contact'},
 {shot:'racing-payoff',startDistanceM:63.55,sourceInSec:.145,sourceRate:.43,reason:'Fast continuous follow; no static asphalt end'},
];
export const SHOT_SOURCE_TABLE=Object.freeze(qualityCutList().map((c,i)=>({
 shot:c.shot,startFrame:c.startFrame,endFrameExclusive:c.endFrameExclusive,
 sourceInSec:PHYSICAL_BEATS[i].sourceInSec,
 sourceOutSec:PHYSICAL_BEATS[i].sourceInSec+(c.endFrameExclusive-c.startFrame)/30*PHYSICAL_BEATS[i].sourceRate,
 startDistanceM:PHYSICAL_BEATS[i].startDistanceM,
 sourceRate:PHYSICAL_BEATS[i].sourceRate,
 handlesSec:c.handlesSec,
})));
export function sampleQualitySource(frame:number){
 const {cut,localSec}=qualityCutAtFrame(frame);
 const beat=PHYSICAL_BEATS.find(s=>s.shot===cut.shot)!;
 return {shot:cut.shot,localSec,shotDurationSec:cut.durationSec,
   sourceSec:beat.sourceInSec+localSec*beat.sourceRate,
   startDistanceM:beat.startDistanceM,
   sourceRate:beat.sourceRate,
 };
}
/** Exactly four A/B segments: same physical samples of two identical events,
 * original Agent 3 camera vs Agent 10 camera; NOT two separately staged scenes.
 * 4 x 60f => 240 frames = 8s at 30fps.
 */
export function sampleCameraComparison(frame:number){
 if(!Number.isInteger(frame)||frame<0||frame>=240)throw Error('Comparison frame out of range');
 const segment=Math.floor(frame/60),localSec=(frame%60)/30;
 const shot:ShotId=segment<2?'spark-hook':'racing-payoff';
 const beat=PHYSICAL_BEATS.find(b=>b.shot===shot)!;
 return {shot,localSec,durationSec:2,sourceSec:beat.sourceInSec+localSec*beat.sourceRate,
   startDistanceM:beat.startDistanceM,
   baseline:segment%2===0,
   pair:segment<2?'hook':'payoff',
 };
}
