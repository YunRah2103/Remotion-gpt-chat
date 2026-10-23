import {compileRecipe} from './recipe.ts';
import type {EpisodeRecipe,StudioShot} from './recipe.ts';
import {TWIN_TURBO_V8} from './v3-proofs.ts';
import type {AssemblySpec} from './authoring.ts';
/** V4 keeps connected hot housings intact; engine section boundaries remain illustrative. */
export const V4_TWIN_TURBO_V8:AssemblySpec={...structuredClone(TWIN_TURBO_V8),id:'v4-twin-turbo-v8',nodes:TWIN_TURBO_V8.nodes.map(n=>({...structuredClone(n),cutaway:!n.part.startsWith('turbo-')})),connections:TWIN_TURBO_V8.connections.map(c=>({...structuredClone(c),flow:{speed:.28,count:4}}))};

export type V4Kind='supercar'|'rally'|'film';
export type V4Brief={kind:V4Kind;id?:string;title?:string;duration?:number;vehicle?:Partial<EpisodeRecipe['vehicle']>;world?:Partial<EpisodeRecipe['world']>;audio?:EpisodeRecipe['audio'];words?:EpisodeRecipe['words'];captions?:EpisodeRecipe['captions']};
export type V4Beat={id:string;purpose:string};
type Demonstration={id:string;title:string;duration:number;vehicle:EpisodeRecipe['vehicle'];world:EpisodeRecipe['world'];shots:(StudioShot & {purpose:string})[]};
const shot=(id:string,duration:number,camera:StudioShot['camera'],action:StudioShot['action'],purpose:string,extra:Partial<StudioShot>={}):StudioShot & {purpose:string}=>({id,duration,camera,action,caption:'',purpose,...extra});
/** Editable examples rather than locked templates: all geometry and joints remain source-owned. */
export const V4_DEMONSTRATIONS:Record<V4Kind,Demonstration>={
 supercar:{id:'v4-a-supercar',title:'Form follows force',duration:14,vehicle:{variant:'supercar',bodyDetail:'studio',driver:true,color:'#18636b',powertrain:V4_TWIN_TURBO_V8},world:{kind:'track',timeOfDay:'dusk'},shots:[
  shot('front-three-quarter',2.5,'tracking','cruise','Establish the complete silhouette, front lighting and sculpted intake surfaces.'),
  shot('side-profile',2,'tracking','cruise','Read the complete side silhouette, wheelbase and roof line without perspective ambiguity.',{cameraMove:{start:{position:[0,1.3,-7.6],target:[0,.72,0],fov:48},end:{position:[.12,1.32,-7.4],target:[0,.72,0],fov:48},easing:'smooth'}}),
  shot('rear-three-quarter',2.5,'chase','cruise','Show the full rear proportion and exhaust; give the front view a meaningful reverse.'),
  shot('planform',2,'overhead','cornering','Expose planform, wheelbase and a whole-car change of direction.'),
  shot('driver-controls',3,'interior','cornering','Show the fitted occupant operating steering and pedals before the launch.',{cutaway:.94}),
  shot('engine-system',3,'reveal','acceleration','Connect the exterior car to a visible working V8 and both turbochargers.',{context:'inspection',assembly:V4_TWIN_TURBO_V8,orbit:{azimuth:.65,elevation:.28,sweep:.65}}),
  shot('driver-speed',2,'onboard','acceleration','Translate mechanical motion into forward travel from the windscreen mount.'),
  shot('speed-payoff',3,'tracking','cruise','Resolve the inspection sequence with a full-car high-speed pass at 36 metres per second.',{speedScale:3})
 ]},
 rally:{id:'v4-b-rally',title:'Read the road',duration:10,vehicle:{variant:'rally-hatch',bodyDetail:'studio',driver:true,color:'#c88735'},world:{kind:'rally',roughness:.82,timeOfDay:'day'},shots:[
  shot('read-the-corner',3,'overhead','cornering','Establish the bend and road corridor so the steering has visible spatial purpose.'),
  shot('commit',3,'tracking','cornering','Show body attitude and the front wheels following the actual route curvature.'),
  shot('contact-patch',3,'wheel','cornering','Inspect individual wheel travel against the same deterministic road height field.'),
  shot('driver-input',3,'interior','cornering','Tie driver hand motion and the steering column to the cornering action.',{cutaway:.94}),
  shot('traction-exit',4,'chase','acceleration','Follow the car out of the bend while keeping tyre contact and body motion readable.')
 ]},
 film:{id:'v4-c-film',title:'Pressure becomes motion',duration:22,vehicle:{variant:'supercar',bodyDetail:'studio',driver:true,color:'#18636b',powertrain:V4_TWIN_TURBO_V8},world:{kind:'mountain',timeOfDay:'dusk'},shots:[
  shot('hook-hidden-motion',3,'reveal','acceleration','Open directly on the working twin-turbo mechanism: motion before explanation.',{context:'inspection',assembly:V4_TWIN_TURBO_V8,orbit:{azimuth:.55,elevation:.22,sweep:.35},caption:'Exhaust energy spins the turbines.'}),
  shot('reveal-the-machine',3,'reveal','cruise','Answer the mechanical hook with the complete vehicle and a readable silhouette.'),
  shot('intent',3,'interior','cornering','Put a driver at the controls, providing a cause for the coming vehicle movement.',{cutaway:.94}),
  shot('contact',3,'wheel','cornering','Bridge control input to wheel rotation and tyre contact at the road.'),
  shot('pressure-path',4,'reveal','acceleration','Return to connected pipework and animated shafts as the mechanical midpoint.',{context:'inspection',assembly:V4_TWIN_TURBO_V8,orbit:{azimuth:1.4,elevation:.35,sweep:-.6},caption:'Compressed intake air supports more power.'}),
  shot('release',4,'onboard','acceleration','Let the road opening through the windscreen carry the acceleration beat.',{speedScale:2.3}),
  shot('flight',3,'tracking','acceleration','Pay off the mechanism with a full-car moving shot in its environment.',{speedScale:2.3}),
  shot('afterimage',3,'chase','cruise','End with the car leaving the viewer, giving the mechanical story a visual resolution.',{caption:'YUNEX / PRESSURE BECOMES MOTION — SILENT PROOF'})
 ]}
};
/** One call yields a serializable existing-pipeline recipe and a separate editorial handoff. */
export function createV4Production(brief:V4Brief):{recipe:EpisodeRecipe;storyboard:V4Beat[]}{
 const preset=V4_DEMONSTRATIONS[brief.kind];if(!preset)throw Error('Unknown V4 demonstration');
 const duration=brief.duration??preset.duration;
 if(!Number.isFinite(duration)||duration<=0)throw Error('Positive finite duration required');
 if(brief.kind==='film'&&(duration<20||duration>30))throw Error('Mechanical film duration must be 20..30 seconds');
 if(brief.kind==='rally'&&brief.world?.kind&&brief.world.kind!=='rally')throw Error('Rally demonstration requires the rally world');
 const clone=structuredClone(preset),targetFrames=Math.round(duration*30),weight=clone.shots.reduce((n,s)=>n+s.duration,0);
 if(targetFrames<clone.shots.length)throw Error('duration must fit at least one frame per shot');
 let cursor=0;
 const shots=clone.shots.map(({purpose,...s},i)=>{const boundary=i===clone.shots.length-1?targetFrames:Math.round(clone.shots.slice(0,i+1).reduce((n,v)=>n+v.duration,0)/weight*targetFrames);const frames=boundary-cursor;cursor=boundary;return {...s,duration:frames/30};});
 const recipe:EpisodeRecipe={presentation:'cinematic',id:brief.id??clone.id,title:brief.title??clone.title,vehicle:{...clone.vehicle,...structuredClone(brief.vehicle)},world:{...clone.world,...structuredClone(brief.world)},shots,...(brief.audio?{audio:structuredClone(brief.audio)}:{}),...(brief.words?{words:structuredClone(brief.words)}:{}),...(brief.captions?{captions:structuredClone(brief.captions)}:{})};
 compileRecipe(recipe);
 return {recipe,storyboard:clone.shots.map(({id,purpose})=>({id,purpose}))};
}
/** Cheap native moving windows for every cut; a review plan is never a render/visual approval. */
export function v4ReviewPlan(recipe:EpisodeRecipe){
 const compiled=compileRecipe(recipe),motionWindows=compiled.shots.map(s=>{const length=Math.min(12,s.endFrame-s.startFrame),start=s.startFrame+Math.floor((s.endFrame-s.startFrame-length)/2);return {id:s.id,range:[start,start+length-1] as [number,number],stillFrames:[s.startFrame,Math.floor((s.startFrame+s.endFrame-1)/2),s.endFrame-1]};});
 return {id:recipe.id,width:1080,height:1920,fps:30,frames:compiled.durationInFrames,audio:recipe.audio??null,motionWindows,previewFrameCount:motionWindows.reduce((n,w)=>n+w.range[1]-w.range[0]+1,0),approval:'Unrendered: inspect moving windows, then full native MP4 and full decode.'};
}
