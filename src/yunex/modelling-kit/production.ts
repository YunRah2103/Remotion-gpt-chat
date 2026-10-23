import {compileRecipe} from './recipe.ts';
import type {EpisodeRecipe,StudioShot} from './recipe.ts';
import type {VehicleVariant,EnvironmentKind} from '../world-kit/catalog.ts';
export type CreativeBrief={id:string;subject:string;duration:number;vehicle:VehicleVariant|EpisodeRecipe['vehicle'];environment:EnvironmentKind|EpisodeRecipe['world'];narration?:string;audio?:EpisodeRecipe['audio'];words?:EpisodeRecipe['words'];captions?:EpisodeRecipe['captions'];scenes:(Omit<StudioShot,'duration'> & {duration?:number})[]};
/** A structured creative brief, not an LLM or a fixed template. Agent owns scene choices and wording. */
export function compileBrief(brief:CreativeBrief):EpisodeRecipe{
 if(!Number.isFinite(brief.duration)||brief.duration<=0||!brief.scenes?.length)throw Error('Brief requires a positive duration and scenes');
 const explicit=brief.scenes.reduce((n,s)=>n+(s.duration??0),0),missing=brief.scenes.filter(s=>s.duration===undefined).length;
 if(explicit>brief.duration||(!missing&&Math.abs(explicit-brief.duration)>1/30))throw Error('Scene durations do not fit brief');
 const recipe:EpisodeRecipe={id:brief.id,title:brief.subject,vehicle:typeof brief.vehicle==='string'?{variant:brief.vehicle}:structuredClone(brief.vehicle),world:typeof brief.environment==='string'?{kind:brief.environment}:structuredClone(brief.environment),shots:brief.scenes.map(s=>({...s,duration:s.duration??(brief.duration-explicit)/missing})),...(brief.audio||brief.narration?{audio:{...structuredClone(brief.audio),...(brief.narration?{narration:brief.narration}:{})}}:{}),...(brief.words?{words:structuredClone(brief.words)}:{}),...(brief.captions?{captions:structuredClone(brief.captions)}:{})};compileRecipe(recipe);return recipe;
}
function fingerprint(value:unknown){const source=JSON.stringify(value);let a=2166136261;for(let i=0;i<source.length;i++){a^=source.charCodeAt(i);a=Math.imul(a,16777619);}return (a>>>0).toString(16).padStart(8,'0');}
export type ProductionPlan={id:string;frames:number;fps:number;audio:'silent'|'supplied';shots:{id:string;range:[number,number];hash:string;changed:boolean;previewFrames:number[]}[];warnings:string[]};
/** Cache hints only: CI/artifact SHA256 remains the identity proof. Include cumulative offsets for continuity. */
export function productionPlan(recipe:EpisodeRecipe,previous?:ProductionPlan):ProductionPlan{
 const compiled=compileRecipe(recipe),{shots,...global}=compiled;
 return {id:compiled.id,frames:compiled.durationInFrames,fps:compiled.fps,audio:recipe.audio?.narration||recipe.audio?.music?'supplied':'silent',shots:shots.map(s=>{const hash=fingerprint({global,shot:s}),old=previous?.shots.find(o=>o.id===s.id);return {id:s.id,range:[s.startFrame,s.endFrame-1],hash,changed:old?.hash!==hash,previewFrames:[s.startFrame,Math.floor((s.startFrame+s.endFrame-1)/2),s.endFrame-1]};}),warnings:[...(!recipe.audio?.narration?['Silent narration proof; no speech or timings invented.']:[]),...shots.filter((s,i)=>i&&s.camera===shots[i-1].camera).map(s=>`Repeated adjacent camera: ${s.id}`),...shots.filter(s=>s.caption.length>100).map(s=>`Caption may exceed two phone-safe lines: ${s.id}`)]};
}
