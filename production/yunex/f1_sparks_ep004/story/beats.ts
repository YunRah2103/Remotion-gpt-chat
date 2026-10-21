import type {ShotId, StoryRequest, VehicleMotionState, SkidContact} from '../shared/contract';

export type Beat = Readonly<{
  shot: ShotId;
  durationSec: number;
  intention: string;
  focus: 'car-and-sparks'|'rear'|'plank-and-metal'|'ride-height'|'metal-contact'|'car-and-sparks';
  matchFromPrevious: string;
}>;
/** Editorial defaults ONLY. Agent 6 retimes after the actual recorded VO. */
export const DEFAULT_BEATS: readonly Beat[] = [
  {shot:'spark-hook',durationSec:2.8,intention:'First-frame moving car and contact-born sparks',focus:'car-and-sparks',matchFromPrevious:'start on bright real skid sparks'},
  {shot:'rear-mystery',durationSec:3.0,intention:'Follow one moving car; motivate the camera move beneath it',focus:'rear',matchFromPrevious:'match road vanishing point and vehicle heading'},
  {shot:'underfloor-reveal',durationSec:5.0,intention:'Show the central plank and the discrete metal skid against the separate floor',focus:'plank-and-metal',matchFromPrevious:'follow the same moving rear floor edge into the section'},
  {shot:'aero-load',durationSec:4.8,intention:'Compare externally supplied suspension compression and ride height',focus:'ride-height',matchFromPrevious:'maintain exact wheel/road scale across comparison'},
  {shot:'contact-macro',durationSec:4.5,intention:'Metal meets asphalt; use real signed-gap contacts only',focus:'metal-contact',matchFromPrevious:'match the forward skid world point and road line'},
  {shot:'racing-payoff',durationSec:6.1,intention:'Wide moving racecar and naturally evolving contact-born sparks; no outro',focus:'car-and-sparks',matchFromPrevious:'pull back along real metal sparks into same vehicle direction'},
];
export type StoryTiming = readonly Readonly<{shot:ShotId;durationSec:number}>[];
export type StoryLocation = Readonly<{
  shot:ShotId; shotIndex:number; startSec:number; endSec:number;
  shotLocalSec:number;shotDurationSec:number;progress01:number;
}>;
export const clamp01=(x:number)=>Math.max(0,Math.min(1,x));
export const smoothstep=(x:number)=>{const t=clamp01(x);return t*t*(3-2*t);};
export function validateTiming(timing:StoryTiming):void{
  if(timing.length!==6) throw new Error('EP004 story requires all six shots');
  const valid=new Set(DEFAULT_BEATS.map(x=>x.shot));
  const seen=new Set<ShotId>();
  timing.forEach(beat=>{
    if(!valid.has(beat.shot)||seen.has(beat.shot)) throw new Error('Duplicate/unknown story shot');
    if(!Number.isFinite(beat.durationSec)||beat.durationSec<0.35) throw new Error('Shot duration must be >=0.35s');
    seen.add(beat.shot);
  });
  if(DEFAULT_BEATS.some((beat,i)=>timing[i].shot!==beat.shot)) throw new Error('Canonical narrative order must be preserved');
}
export const defaultTiming:StoryTiming=DEFAULT_BEATS.map(({shot,durationSec})=>({shot,durationSec}));
export function storyDuration(timing:StoryTiming=defaultTiming):number {
  validateTiming(timing);return timing.reduce((sum,b)=>sum+b.durationSec,0);
}
export function storyLocation(tSec:number,timing:StoryTiming=defaultTiming):StoryLocation{
  validateTiming(timing);
  if(!Number.isFinite(tSec))throw new Error('Story time must be finite');
  const t=Math.max(0,tSec),total=storyDuration(timing);
  let startSec=0;
  for(let i=0;i<timing.length;i++){
    const {shot,durationSec}=timing[i],endSec=startSec+durationSec;
    if(t<endSec||i===timing.length-1){
      const shotLocalSec=Math.min(durationSec,Math.max(0,t-startSec));
      return {shot,shotIndex:i,startSec,endSec,shotLocalSec,shotDurationSec:durationSec,progress01:clamp01(shotLocalSec/durationSec)};
    }
    startSec=endSec;
  }
  throw new Error('Unreachable');
}
export type StoryLayer=Readonly<StoryLocation & {opacity:number}>;
/** Short, deterministic editorial blend, not a new path, emitter or physics timeline. */
export function storyLayers(tSec:number,timing:StoryTiming=defaultTiming,overlapSec=0.18):readonly StoryLayer[]{
  if(!(overlapSec>=0&&overlapSec<0.35))throw new Error('Invalid transition handle');
  const now=storyLocation(tSec,timing);
  if(now.shotIndex>0&&now.shotLocalSec<overlapSec){
    const priorIndex=now.shotIndex-1,priorBeat=timing[priorIndex],fade=smoothstep(now.shotLocalSec/overlapSec);
    return [
      { ...storyLocation(now.startSec-0.00001,timing),shot:priorBeat.shot,shotIndex:priorIndex,shotLocalSec:priorBeat.durationSec-overlapSec+now.shotLocalSec,opacity:1-fade },
      {...now,opacity:fade},
    ];
  }
  return [{...now,opacity:1}];
}
export function onMetalContact(contacts:readonly SkidContact[]):boolean{
  return contacts.some(c=>c.active&&c.signedGapM<=0&&c.relativeSpeedMps>0&&c.contactIntensity01>0);
}
export function contactMessage(req:Pick<StoryRequest,'contacts'|'particles'>):'CONTACT'|'CLEAR'{
  return onMetalContact(req.contacts)?'CONTACT':'CLEAR';
}
export type RideHeightComparison=Readonly<{heaveDeltaM:number;compressionDeltaM:number;compressionIncreased:boolean;safeToLabelLower:boolean}>;
export function compareRideHeight(unloaded:VehicleMotionState,loaded:VehicleMotionState):RideHeightComparison{
  const avg=(m:VehicleMotionState)=>Object.values(m.wheelCompressionM).reduce((a,b)=>a+b,0)/4;
  const heaveDeltaM=loaded.heaveM-unloaded.heaveM;
  const compressionDeltaM=avg(loaded)-avg(unloaded);
  return {heaveDeltaM,compressionDeltaM,compressionIncreased:compressionDeltaM>0.003,safeToLabelLower:heaveDeltaM<-.004};
}
export type ShotVisualMap=Readonly<{shot:ShotId;visual:string;syncCue:string;carryOut:string;captionSuggestion:string}>;
/** Narration semantic mapping; these are NOT speech/audio timecodes. */
export const SHOT_TO_SCRIPT: readonly ShotVisualMap[]=[
  {shot:'spark-hook',visual:'On moving rear-quarter pass, SHOW contact-sourced sparks immediately',syncCue:'question / why sparks?',carryOut:'same speed and road line to rear chase',captionSuggestion:''},
  {shot:'rear-mystery',visual:'Moving rear pursuit, make mystery of low floor near asphalt',syncCue:'what is under the car?',carryOut:'camera tracks along floor, no teleport',captionSuggestion:''},
  {shot:'underfloor-reveal',visual:'Section vehicle by Agent 1 UnderfloorReveal; distinguish dark surrounding floor, central plank, discrete metal forward skid',syncCue:'plank and metal skid explanation',carryOut:'preserve skid plate as main object',captionSuggestion:'METAL SKID'},
  {shot:'aero-load',visual:'Exact Agent 2 motion A/B comparison at same camera scale; show wheel/body heave, no false force figure',syncCue:'air pressure / ride height',carryOut:'follow skid low point toward asphalt',captionSuggestion:'LOWER'},
  {shot:'contact-macro',visual:'Macro on active SkidContact.pointWorld; metal makes contact then naturally sparks; stop sparks when no new contact',syncCue:'skid scrapes the track',carryOut:'sparks matchcut to wider moving car',captionSuggestion:'CONTACT'},
  {shot:'racing-payoff',visual:'Vary genuine racing angles, preserve contact-synced particles and drive out without logo or static outro',syncCue:'spectacular conclusion',carryOut:'end on car motion; no fixed bumper',captionSuggestion:''},
];
