/**
 * Pure, arbitrary-frame deterministic Agent 6 → integrated Agent 5 request.
 * Importable by native Node --experimental-strip-types tests without TSX.
 * Approved Agent 1 metal skids, Agent 2 contact physics, Agent 4 asphalt.
 * Final Agent 3 camera is deliberately NOT selected here.
 */
import {getSkidDescriptors} from '../mechanics/skids.ts';
import {sampleDynamics,sampleContactDrivenSparks} from '../physics/index.ts';
import {SHOT_ORDER} from './timing.ts';
import type {StoryRequest} from '../shared/contract.ts';
import type {VisualShotProps} from './PictureEdit.tsx';

const SKIDS=getSkidDescriptors();

export function buildRealStoryRequest(props:VisualShotProps):StoryRequest{
  if(!SHOT_ORDER.includes(props.shot as (typeof SHOT_ORDER)[number])) {
    throw new Error('EP004 editor bridge: unrecognised canonical story shot');
  }
  if(!Number.isFinite(props.globalSec)||!Number.isFinite(props.sourceSec)
     ||!Number.isFinite(props.shotLocalSec)||!Number.isFinite(props.shotDurationSec)
     ||props.globalSec<0||props.sourceSec<0||props.shotLocalSec<0
     ||props.shotDurationSec<=0||props.shotLocalSec>=props.shotDurationSec+.0001){
    throw new Error('EP004 editor bridge: invalid VO/source-time split or shot handle');
  }
  const motion=sampleDynamics(props.sourceSec);
  const {contacts,particles}=sampleContactDrivenSparks(props.sourceSec,motion,SKIDS);
  return {shot:props.shot,tSec:props.sourceSec,shotLocalSec:props.shotLocalSec,
    shotDurationSec:props.shotDurationSec,motion,contacts,particles};
}
