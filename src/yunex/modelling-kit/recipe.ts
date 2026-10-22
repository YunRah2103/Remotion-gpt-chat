import type {ModelVariation,AssemblySpec,ComponentSpec} from './authoring.ts';
import {VEHICLES,ENVIRONMENTS} from '../world-kit/catalog.ts';
import type {VehicleVariant,EnvironmentKind} from '../world-kit/catalog.ts';
import {PARTS} from '../parts-kit/catalog.ts';
import type {PartVariant} from '../parts-kit/catalog.ts';
import {drivingState} from './driving.ts';
import type {DrivingAction,CameraPreset} from './driving.ts';
export type StudioShot={id:string;duration:number;camera:CameraPreset;action:DrivingAction;caption:string;joints?:Record<string,number>;part?:PartVariant;assembly?:AssemblySpec;cutaway?:number;exploded?:number;highlight?:'engine'|'underfloor'|'wheels';annotation?:{anchor:'engine'|'front-wheel'|'driver'|'underfloor'|'part';text:string}};
export type EpisodeRecipe={id:string;title:string;vehicle:{variant:VehicleVariant;driver?:boolean;color?:string;powertrain?:AssemblySpec;model?:ModelVariation;components?:ComponentSpec[]};world:{kind:EnvironmentKind;wetness?:number;timeOfDay?:'day'|'dusk'|'night';model?:ModelVariation;components?:ComponentSpec[]};shots:StudioShot[];words?:{text:string;start:number;end:number}[];captions?:{start:number;end:number;text:string}[];audio?:{narration?:string;music?:string;musicVolume?:number}};
export type CompiledRecipe=Omit<EpisodeRecipe,'shots'> & {fps:number;durationInFrames:number;shots:(StudioShot & {startFrame:number;endFrame:number;distanceOffset:number})[]};
const fail=(message:string):never=>{throw new Error(message);};
export function compileRecipe(input:EpisodeRecipe,fps=30):CompiledRecipe{
 if(!Number.isFinite(fps)||fps<=0)fail('fps must be positive');
 const r=JSON.parse(JSON.stringify(input)) as EpisodeRecipe;
 if(typeof r.id!=='string'||typeof r.title!=='string'||!r.id||!r.title)fail('Recipe requires id and title');
 const vehicle=VEHICLES.find(v=>v.id===r.vehicle?.variant);if(!vehicle)fail('Unknown vehicle');
 if(r.vehicle.driver&&vehicle!.family==='bike')fail('Motorcycle driver is not supported');
 if(!ENVIRONMENTS.some(v=>v===r.world?.kind))fail('Unknown world');
 if(r.world.timeOfDay!==undefined&&!['day','dusk','night'].includes(r.world.timeOfDay))fail('Unknown time of day');
 if(!Array.isArray(r.shots)||!r.shots.length)fail('At least one shot required');
 for(const model of [r.vehicle.model,r.world.model])if(model&&(model.version!==1||!model.id||!Array.isArray(model.edits)))fail('Invalid model variation');
 let cursor=0,distance=0;const ids=new Set<string>();
 const shots=r.shots.map(s=>{
  if(typeof s.caption!=='string')fail('Shot caption must be text');
  if(typeof s.id!=='string'||!s.id||ids.has(s.id))fail('Shot ids must be unique');ids.add(s.id);
  if(!Number.isFinite(s.duration)||Math.round(s.duration*fps)<1)fail('Shot duration must contain at least one frame');
  if(!['tracking','chase','wheel','interior','onboard','overhead','reveal'].includes(s.camera))fail('Unknown camera');
  if(!['cruise','acceleration','braking','cornering'].includes(s.action))fail('Unknown action');
  if(s.part&&!PARTS.some(p=>p.id===s.part))fail('Unknown part');
  for(const value of [s.cutaway,s.exploded,r.world.wetness,r.audio?.musicVolume])if(value!==undefined&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1))fail('Controls must be 0..1');
  if(s.annotation&&(typeof s.annotation.text!=='string'||!s.annotation.text||s.annotation.text.length>48))fail('Annotation text must contain 1–48 characters');
  if(s.annotation&&!['engine','front-wheel','driver','underfloor','part'].includes(s.annotation.anchor))fail('Unknown annotation anchor');
  const startFrame=cursor;cursor+=Math.round(s.duration*fps);const distanceOffset=distance;
  distance+=drivingState(s.action,cursor-startFrame,fps).distance??0;
  return {...s,startFrame,endFrame:cursor,distanceOffset};
 });
 let wordEnd=0;for(const w of r.words??[]){if(typeof w.text!=='string'||!w.text||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<wordEnd||w.end<=w.start||w.end>cursor/fps)fail('Invalid supplied word timestamps');wordEnd=w.end;}
 let end=0;for(const c of r.captions??[]){if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<end||c.end<=c.start||c.end>cursor/fps)fail('Captions must be ordered, non-overlapping and inside the episode');end=c.end;}
 for(const path of [r.audio?.narration,r.audio?.music])if(path&&(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.startsWith('/')||path.split('/').includes('..')))fail('Audio must use a safe public-relative path');
 return {...r,fps,durationInFrames:cursor,shots};
}
export function sampleRecipe(recipe:CompiledRecipe,frame:number){
 if(!Number.isFinite(frame))fail('frame must be finite');
 const f=Math.max(0,Math.min(recipe.durationInFrames-1,Math.floor(frame)));
 const shot=recipe.shots.find(s=>f<s.endFrame)!;const localFrame=f-shot.startFrame;
 const state=drivingState(shot.action,localFrame,recipe.fps);
 return {shot,localFrame,frame:f,state:{...state,frame:f,distance:shot.distanceOffset+(state.distance??0),cutaway:shot.cutaway??0,exploded:shot.exploded??0,highlight:shot.highlight,gearChange:shot.action==='acceleration'?Math.max(0,Math.sin(localFrame/recipe.fps*5))**12:0},caption:recipe.captions?.find(c=>f/recipe.fps>=c.start&&f/recipe.fps<c.end)?.text??(recipe.captions? '':shot.caption)};
}
