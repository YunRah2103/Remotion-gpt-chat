/**
 * EP003 Agent 9 — deterministic two-outcome editorial clock.
 *
 * No animated stills: a renderer must draw source frames returned by its
 * sampled collision/vehicle dynamics rig at EXACTLY sourceTimeSec.
 * Reverse playback changes the source clock itself, not merely overlays.
 *
 * World metres: +X forward, +Y up, +Z left. 30fps frame clock belongs to
 * Agent 6; this module neither owns VO nor changes the 800-frame film root.
 */
import type {VehicleDynamicsFrame, Vec3, WheelId} from '../shared/contract.ts';

export type BranchPhase =
  | 'pre-choice' | 'wrong-outcome' | 'freeze-impact' | 'reverse-crash'
  | 'reset-to-choice' | 'correct-response';
export type BranchChoice = 'undecided'|'panic-brake-hypothetical'|'controlled-response';
export type BranchReplaySettings = Readonly<{
  choiceFilmSec: number;
  impactFilmSec: number;
  freezeEndFilmSec: number;
  rewindEndFilmSec: number;
  correctFilmSec: number;
  choiceSourceSec: number;
  impactSourceSec: number;
  controlledTimeRate: number;
  preChoiceTimeRate: number;
}>;
export const DEFAULT_BRANCH_REPLAY: BranchReplaySettings = Object.freeze({
  choiceFilmSec: 12.83,
  impactFilmSec: 14.22,
  freezeEndFilmSec: 14.44,
  rewindEndFilmSec: 15.83,
  correctFilmSec: 16.015,
  // Same origin handed to Agent 8, Agent 2, and tyre mechanics.
  choiceSourceSec: 4.0,
  // Time-compressed A8 bad branch: 3.5 simulated seconds, NOT 1.39s of real-time crash physics.
  impactSourceSec: 7.5,
  controlledTimeRate: 0.82,
  preChoiceTimeRate: 0.65,
});
export type BranchReplaySample = Readonly<{
  filmTimeSec: number;
  sourceTimeSec: number;
  sourceChoiceSec: number;
  phase: BranchPhase;
  branchChoice: BranchChoice;
  /** +1 forward, 0 impact/decision freeze, -1 true source replay backwards. */
  direction: -1|0|1;
  phaseProgress01: number;
  reversedSourceProgress01: number;
  /** Caller must NOT swap in an intact tyre on controlled restart. */
  failedTyreMustPersist: true;
  /** Intentional EDIT compression; not a simulated acceleration. */
  editorialCompression: boolean;
}>;
const clamp01=(x:number):number=>Math.max(0,Math.min(1,x));
const smooth=(x:number):number=>{const t=clamp01(x);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number):number=>a+(b-a)*t;

export function validateReplaySettings(s:BranchReplaySettings):void {
  if (!Object.values(s).every(x=>Number.isFinite(x))) throw Error('Nonfinite replay settings');
  if (!(0<=s.choiceFilmSec && s.choiceFilmSec<s.impactFilmSec &&
    s.impactFilmSec<s.freezeEndFilmSec &&
    s.freezeEndFilmSec<s.rewindEndFilmSec &&
    s.rewindEndFilmSec<s.correctFilmSec)) throw Error('Bad edit phase order');
  if (!(0<=s.choiceSourceSec && s.choiceSourceSec<s.impactSourceSec &&
    s.preChoiceTimeRate>0 && s.controlledTimeRate>0)) throw Error('Bad source times/rates');
}

/** Any input frame is independent of previous render order, including backwards. */
export function sampleBranchReplay(
  filmTimeSec:number,
  s:BranchReplaySettings=DEFAULT_BRANCH_REPLAY
):BranchReplaySample {
  validateReplaySettings(s);
  if (!Number.isFinite(filmTimeSec)||filmTimeSec<0) throw Error('Invalid film clock');
  const p=(a:number,b:number)=>clamp01((filmTimeSec-a)/(b-a));
  const basic=(phase:BranchPhase,sourceTimeSec:number,branchChoice:BranchChoice,
    direction:-1|0|1,phaseProgress01:number,editorialCompression=false):BranchReplaySample=>({
      filmTimeSec,sourceTimeSec,sourceChoiceSec:s.choiceSourceSec,phase,branchChoice,
      direction,phaseProgress01,reversedSourceProgress01:
        clamp01((s.impactSourceSec-sourceTimeSec)/(s.impactSourceSec-s.choiceSourceSec)),
      failedTyreMustPersist:true,editorialCompression,
    });
  if(filmTimeSec<s.choiceFilmSec) return basic('pre-choice',
    Math.max(0,s.choiceSourceSec-(s.choiceFilmSec-filmTimeSec)*s.preChoiceTimeRate),
    'undecided',1,0);
  if(filmTimeSec<s.impactFilmSec) return basic('wrong-outcome',
    mix(s.choiceSourceSec,s.impactSourceSec,smooth(p(s.choiceFilmSec,s.impactFilmSec))),
    'panic-brake-hypothetical',1,p(s.choiceFilmSec,s.impactFilmSec),true);
  if(filmTimeSec<s.freezeEndFilmSec) return basic('freeze-impact',
    s.impactSourceSec,'panic-brake-hypothetical',0,p(s.impactFilmSec,s.freezeEndFilmSec));
  if(filmTimeSec<s.rewindEndFilmSec) return basic('reverse-crash',
    mix(s.impactSourceSec,s.choiceSourceSec,smooth(p(s.freezeEndFilmSec,s.rewindEndFilmSec))),
    'panic-brake-hypothetical',-1,p(s.freezeEndFilmSec,s.rewindEndFilmSec),true);
  if(filmTimeSec<s.correctFilmSec) return basic('reset-to-choice',
    s.choiceSourceSec,'controlled-response',0,p(s.rewindEndFilmSec,s.correctFilmSec));
  return basic('correct-response',
    s.choiceSourceSec+(filmTimeSec-s.correctFilmSec)*s.controlledTimeRate,
    'controlled-response',1,p(s.correctFilmSec,s.correctFilmSec+3));
}

/**
 * Agent 8 supplies sampleWrong(sourceSec, seedSec) with damage, debris and
 * same-source world pose; Agent 2 supplies sampleCorrect(sourceSec).
 * The crash renderer receives the ENTIRE sampled frame for reverse playback.
 * No mutable physics stepping, fake magically disappearing damage or cutaway.
 */
export type BranchSamplers<WrongFrame,CorrectFrame> = Readonly<{
  sampleWrong:(sourceTimeSec:number,choiceSourceSec:number)=>WrongFrame;
  sampleCorrect:(sourceTimeSec:number)=>CorrectFrame;
}>;
export function resolveBranchFrame<WrongFrame,CorrectFrame>(
  filmTimeSec:number,
  samplers:BranchSamplers<WrongFrame,CorrectFrame>,
  settings:BranchReplaySettings=DEFAULT_BRANCH_REPLAY
):{replay:BranchReplaySample;frame:WrongFrame|CorrectFrame} {
  const replay=sampleBranchReplay(filmTimeSec,settings);
  const wrong=['wrong-outcome','freeze-impact','reverse-crash'].includes(replay.phase);
  return {replay,frame:wrong
    ? samplers.sampleWrong(replay.sourceTimeSec,replay.sourceChoiceSec)
    : samplers.sampleCorrect(replay.sourceTimeSec)};
}

/** A whole-vehicle visual hard-cut rebase; ALL wheel hubs share the same dx. */
export function rebaseDynamicsX(frame:VehicleDynamicsFrame,dx:number):VehicleDynamicsFrame {
  if(!Number.isFinite(dx))throw Error('Invalid world X offset');
  const wheels={} as VehicleDynamicsFrame['wheels'];
  for(const id of ['front-left','front-right','rear-left','rear-right'] as WheelId[]){
    const hub=frame.wheels[id].hubWorldM;
    wheels[id]={...frame.wheels[id],hubWorldM:[hub[0]+dx,hub[1],hub[2]]};
  }
  return {...frame,positionM:[frame.positionM[0]+dx,frame.positionM[1],frame.positionM[2]],wheels};
}
export function rebasePointX(p:Vec3,dx:number):Vec3{
  if(!Number.isFinite(dx))throw Error('Invalid world X offset');
  return [p[0]+dx,p[1],p[2]];
}
/** Exact seed-frame equality check required when A8's true collision module is hydrated. */
export function assertMatchingRestart(
  badSeed:Pick<VehicleDynamicsFrame,'positionM'|'yawRad'|'pitchRad'|'rollRad'|'wheels'>,
  correctSeed:Pick<VehicleDynamicsFrame,'positionM'|'yawRad'|'pitchRad'|'rollRad'|'wheels'>,
  tolerance=1e-6
):void {
  if(!Number.isFinite(tolerance)||tolerance<0)throw Error('Invalid tolerance');
  const close=(a:number,b:number)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tolerance;
  for(let i=0;i<3;i++)if(!close(badSeed.positionM[i],correctSeed.positionM[i]))
    throw Error('Reset changed original body location');
  for(const angle of ['yawRad','pitchRad','rollRad'] as const)if(!close(badSeed[angle],correctSeed[angle]))
    throw Error('Reset changed original car orientation');
  for(const id of ['front-left','front-right','rear-left','rear-right'] as WheelId[]){
    for(let i=0;i<3;i++)if(!close(badSeed.wheels[id].hubWorldM[i],correctSeed.wheels[id].hubWorldM[i]))
      throw Error('Reset changed original wheel hub: '+id);
    if(!close(badSeed.wheels[id].rollingRadiusM,correctSeed.wheels[id].rollingRadiusM))
      throw Error('Reset magically repaired tyre: '+id);
  }
}
