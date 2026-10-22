import type {ModelVariation,AssemblySpec,ComponentSpec} from './authoring.ts';
import {VEHICLES,ENVIRONMENTS} from '../world-kit/catalog.ts';
import type {VehicleVariant,EnvironmentKind} from '../world-kit/catalog.ts';
import {PARTS} from '../parts-kit/catalog.ts';
import type {PartVariant} from '../parts-kit/catalog.ts';
import {drivingState} from './driving.ts';
import type {DrivingAction,CameraPreset} from './driving.ts';
import {validateCameraMove} from './camera-move.ts';
import type {CameraMove} from './camera-move.ts';
export type StudioShot={cameraMove?:CameraMove;speedScale?:number;context?:'world'|'inspection';energyFlow?:'drive'|'regenerate';id:string;duration:number;camera:CameraPreset;action:DrivingAction;caption:string;orbit?:{azimuth:number;elevation:number;sweep?:number};joints?:Record<string,number>;jointTracks?:Record<string,{time:number;value:number}[]>;part?:PartVariant;assembly?:AssemblySpec;cutaway?:number;exploded?:number;highlight?:'engine'|'underfloor'|'wheels';annotation?:{anchor:'engine'|'front-wheel'|'driver'|'underfloor'|'part';text:string}};
export type EpisodeRecipe={presentation?:'cinematic';id:string;title:string;vehicle:{bodyDetail?:'legacy'|'coachbuilt'|'studio';variant:VehicleVariant;driver?:boolean;color?:string;powertrain?:AssemblySpec;model?:ModelVariation;components?:ComponentSpec[]};world:{kind:EnvironmentKind;roughness?:number;wetness?:number;timeOfDay?:'day'|'dusk'|'night';model?:ModelVariation;components?:ComponentSpec[]};shots:StudioShot[];words?:{text:string;start:number;end:number}[];captions?:{start:number;end:number;text:string}[];audio?:{narration?:string;music?:string;musicVolume?:number}};
export type CompiledRecipe=Omit<EpisodeRecipe,'shots'> & {fps:number;durationInFrames:number;shots:(StudioShot & {startFrame:number;endFrame:number;distanceOffset:number})[]};
const fail=(message:string):never=>{throw new Error(message);};
export function compileRecipe(input:EpisodeRecipe,fps=30):CompiledRecipe{
 if(!Number.isFinite(fps)||fps<=0)fail('fps must be positive');
 const r=JSON.parse(JSON.stringify(input)) as EpisodeRecipe;
 if(typeof r.id!=='string'||typeof r.title!=='string'||!r.id||!r.title)fail('Recipe requires id and title');
 const vehicle=VEHICLES.find(v=>v.id===r.vehicle?.variant);if(!vehicle)fail('Unknown vehicle');
 if(r.vehicle.bodyDetail!==undefined&&!['legacy','coachbuilt','studio'].includes(r.vehicle.bodyDetail))fail('Unknown body detail');
 if(r.presentation!==undefined&&r.presentation!=='cinematic')fail('Unknown presentation');
 if(r.vehicle.driver&&vehicle!.family==='bike')fail('Motorcycle driver is not supported');
 if(!ENVIRONMENTS.some(v=>v===r.world?.kind))fail('Unknown world');
 if(r.world.timeOfDay!==undefined&&!['day','dusk','night'].includes(r.world.timeOfDay))fail('Unknown time of day');
 if(r.world.roughness!==undefined&&(!Number.isFinite(r.world.roughness)||r.world.roughness<0||r.world.roughness>1||r.world.roughness>0&&r.world.kind!=='rally'))fail('Roughness requires a rally world and 0..1');
 if((r.world.roughness??0)>0&&(vehicle!.family==='bike'||vehicle!.axles!==2))fail('Rough rally contact currently requires a four-wheel vehicle; set roughness to 0 for motorcycles or six-wheel vehicles');
 if(!Array.isArray(r.shots)||!r.shots.length)fail('At least one shot required');
 for(const model of [r.vehicle.model,r.world.model])if(model&&(model.version!==1||!model.id||!Array.isArray(model.edits)))fail('Invalid model variation');
 let cursor=0,distance=0;const ids=new Set<string>();
 const shots=r.shots.map(s=>{
  if(s.cameraMove!==undefined)validateCameraMove(s.cameraMove);
  if(s.speedScale!==undefined&&(!Number.isFinite(s.speedScale)||s.speedScale<.25||s.speedScale>3))fail('Shot speed scale must be 0.25..3');
  if(s.context!==undefined&&!['world','inspection'].includes(s.context))fail('Unknown shot context');
  if(s.energyFlow!==undefined&&!['drive','regenerate'].includes(s.energyFlow))fail('Unknown energy flow');
  if(typeof s.caption!=='string')fail('Shot caption must be text');
  if(typeof s.id!=='string'||!s.id||ids.has(s.id))fail('Shot ids must be unique');ids.add(s.id);
  if(!Number.isFinite(s.duration)||Math.round(s.duration*fps)<1)fail('Shot duration must contain at least one frame');
  if(!['tracking','chase','wheel','interior','onboard','overhead','reveal'].includes(s.camera))fail('Unknown camera');
  if(!['cruise','acceleration','braking','cornering'].includes(s.action))fail('Unknown action');
  if(s.part&&!PARTS.some(p=>p.id===s.part))fail('Unknown part');
  for(const value of [s.cutaway,s.exploded,r.world.wetness,r.audio?.musicVolume])if(value!==undefined&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1))fail('Controls must be 0..1');
  if(s.annotation&&(typeof s.annotation.text!=='string'||!s.annotation.text||s.annotation.text.length>48))fail('Annotation text must contain 1–48 characters');
  if(s.annotation&&!['engine','front-wheel','driver','underfloor','part'].includes(s.annotation.anchor))fail('Unknown annotation anchor');
  if(s.orbit&&(!Number.isFinite(s.orbit.azimuth)||!Number.isFinite(s.orbit.elevation)||Math.abs(s.orbit.elevation)>1.4||!Number.isFinite(s.orbit.sweep??0)))fail('Invalid component camera orbit');
  for(const value of Object.values(s.joints??{}))if(!Number.isFinite(value)||value<0||value>1)fail('Invalid joint pose');
  for(const keys of Object.values(s.jointTracks??{})){let last=-1;if(!Array.isArray(keys)||!keys.length)fail('Invalid joint track');for(const key of keys){if(!Number.isFinite(key.time)||key.time<0||key.time<=last||key.time>s.duration||!Number.isFinite(key.value)||key.value<0||key.value>1)fail('Invalid joint track');last=key.time;}}
  const startFrame=cursor;cursor+=Math.round(s.duration*fps);const distanceOffset=distance;
  distance+=(drivingState(s.action,cursor-startFrame,fps).distance??0)*(s.speedScale??1);
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
 const raw=drivingState(shot.action,localFrame,recipe.fps),scale=shot.speedScale??1;
 const state={...raw,speed:raw.speed*scale,distance:(raw.distance??0)*scale,...(raw.acceleration!==undefined?{acceleration:raw.acceleration*scale}:{})};
 const joints={...shot.joints};for(const [name,keys] of Object.entries(shot.jointTracks??{})){const t=localFrame/recipe.fps;let value=keys[0].value;for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(t>=b.time)value=b.value;else if(t>=a.time){value=a.value+(b.value-a.value)*(t-a.time)/(b.time-a.time);break;}}joints[name]=value;}
 return {shot,localFrame,frame:f,joints,state:{...state,frame:f,distance:shot.distanceOffset+(state.distance??0),cutaway:shot.cutaway??0,exploded:shot.exploded??0,highlight:shot.highlight,gearChange:shot.action==='acceleration'?Math.max(0,Math.sin(localFrame/recipe.fps*5))**12:0},caption:recipe.words?(recipe.words.find(w=>f/recipe.fps>=w.start&&f/recipe.fps<w.end)?.text??''):recipe.captions?.find(c=>f/recipe.fps>=c.start&&f/recipe.fps<c.end)?.text??(recipe.captions? '':shot.caption)};
}
