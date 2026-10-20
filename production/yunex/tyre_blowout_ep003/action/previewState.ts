/**
 * Agent 10: ACTUAL Agent8 collision + Agent9 source-time rewind adapter.
 * 0..6s native review time is deliberately conformed to A9's 12.83..16.015
 * editorial window. The camera never manufactures sideways drift or damage.
 * The last frame returns to A2's identical failed-tyre pre-choice state.
 */
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import type {BranchReplaySample} from '../rewind/branchReplay.ts';
import {rebaseDynamicsX,resolveBranchFrame,DEFAULT_BRANCH_REPLAY} from '../rewind/branchReplay.ts';
import {AGENT9_CHOICE_SCENE_X,sampleControlledFrame,
  sampleRealAgent8Wrong,sampleRealAgent2Correct} from '../rewind/agent8Integration.ts';
import {sampleTyreFailure} from '../mechanics/sampleTyreFailure.ts';
import {ACTION_CRASH_CUTS,ACTION_RECOVERY_CUTS,selectActionCut,rebaseActionFrame} from './cameras.ts';
import type {ActionCut,ActionStage} from './cameras.ts';

const REAL_BRANCH_SAMPLERS={
 sampleWrong:sampleRealAgent8Wrong,
 sampleCorrect:sampleRealAgent2Correct,
};
const CRASH_FILM_START=DEFAULT_BRANCH_REPLAY.choiceFilmSec;
const CRASH_FILM_SPAN=DEFAULT_BRANCH_REPLAY.correctFilmSec-CRASH_FILM_START;
export const CRASH_ACTION_DURATION_SEC=6;
export const RECOVERY_ACTION_DURATION_SEC=7;
export type ActionPreviewMode='crash-action'|'recovery';
export type ActionPreviewState=Readonly<{
  dynamics:VehicleDynamicsFrame;
  tyre:TyreFrame;
  stage:ActionStage;
  sourceTimeSec:number;
  filmTimeSec:number;
  cut:ActionCut;
  progress01:number;
  contact01:number;
  impact:CrashOutcomeFrame|null;
  replay:BranchReplaySample|null;
  // True A8/A9 modules only. NEVER a provisional lateral-position fixture.
  provisionalCrash:false;
}>;
export function actionPreviewState(
  filmTimeSec:number,mode:ActionPreviewMode
):ActionPreviewState{
  if(!Number.isFinite(filmTimeSec)||filmTimeSec<0 ||
      (mode!=='crash-action'&&mode!=='recovery'))throw Error('Bad action preview time');
  const crash=mode==='crash-action';
  const cuts=crash?ACTION_CRASH_CUTS:ACTION_RECOVERY_CUTS;
  const {cut,progress01}=selectActionCut(filmTimeSec,cuts);
  let raw:VehicleDynamicsFrame,impact:CrashOutcomeFrame|null=null;
  let replay:BranchReplaySample|null=null,sourceTimeSec:number;
  if(crash){
    // This calls ACTUAL A8 forward and reverse poses/dents from the same
    // source seconds; A9 selects bad, freeze, backward, reset and good states.
    const editorSec=CRASH_FILM_START+filmTimeSec*CRASH_FILM_SPAN/CRASH_ACTION_DURATION_SEC;
    const resolved=resolveBranchFrame(editorSec,REAL_BRANCH_SAMPLERS);
    replay=resolved.replay;
    raw=resolved.frame.dynamics;
    impact=resolved.frame.impact;
    sourceTimeSec=replay.sourceTimeSec;
    const atChoice=sampleControlledFrame(DEFAULT_BRANCH_REPLAY.choiceSourceSec);
    const xOffset=AGENT9_CHOICE_SCENE_X-atChoice.positionM[0];
    raw=rebaseDynamicsX(raw,xOffset); // A8 X rail and A4 world use SAME coordinate.
  }else{
    // Full-speed moving safe-response branch. No fictitious full stop.
    sourceTimeSec=DEFAULT_BRANCH_REPLAY.choiceSourceSec+filmTimeSec*.82;
    const authoritative=sampleControlledFrame(sourceTimeSec);
    const anchor=sampleControlledFrame(
      DEFAULT_BRANCH_REPLAY.choiceSourceSec+cut.fromSec*.82
    );
    const sceneX=cut.stage==='barrier-approach'?34:-55;
    raw=rebaseActionFrame(authoritative,sceneX-anchor.positionM[0]);
  }
  // Maintain ORIGINAL rubber, rim, hub phase and failed front-right A1 tyre.
  const tyre=sampleTyreFailure(sourceTimeSec,{
    angularPhaseRad:raw.wheels['front-right'].spinRad
  });
  const contact01=impact?.contact.occurred
      ? Math.max(0,Math.min(1,impact.bumperCrushM/.24)):0;
  return {
    dynamics:raw,tyre,stage:cut.stage,cut,progress01,
    sourceTimeSec,filmTimeSec,contact01,impact,replay,
    provisionalCrash:false
  };
}
