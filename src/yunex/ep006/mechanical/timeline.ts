/** Absolute-frame editorial mapping for the shared EP006 first-landing replay. */
import * as T from 'three';
import type {Ep006Motion,MechanicalFocus} from './reveal.ts';
export const EP006_MECHANICAL_WINDOW={start:192,end:555} as const;
export type Ep006MechanicalShot={sourceFrame:number;motion:Ep006Motion;focus:MechanicalFocus;exposure01:number;
  camera:{position:[number,number,number];target:[number,number,number];fov:number};replay:true};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const a=clamp(n);return a*a*(3-2*a);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
type V3=[number,number,number];
const ranges=[
  {end:.25,focus:'contact' as const, from:[2.38,.40,2.30] as V3,to:[1.72,.48,1.62] as V3,target:[1.23,.38,.67] as V3,fov:48},
  {end:.50,focus:'spring' as const,from:[1.88,.96,1.65] as V3,to:[1.50,.84,1.30] as V3,target:[1.22,.53,.66] as V3,fov:42},
  {end:.73,focus:'damper' as const,from:[1.10,.68,1.52] as V3,to:[1.31,.47,1.32] as V3,target:[1.23,.54,.63] as V3,fov:39},
  {end:1,focus:'chassis' as const,from:[-.92,.23,1.68] as V3,to:[.38,.27,1.68] as V3,target:[0,.40,0] as V3,fov:49},
];
/**
 * Screen time 192..555 plays source landing 62..125 at ~0.17x speed.
 * Nothing here creates a second landing or guesses camera/voice timestamps.
 * Agent 2 owns sourceFrame => physically canonical sample.
 */
export function sampleEp006MechanicalTimeline(globalFrame:number,
  canonicalMotion:(absoluteFrame:number)=>Ep006Motion):Ep006MechanicalShot{
  if(!Number.isInteger(globalFrame)||globalFrame<192||globalFrame>=555)
    throw Error('Mechanical timeline requires EP006 absolute frames [192,555)');
  const t=(globalFrame-192)/(555-192-1);
  // Preserve launch→touchdown→compression→damped rebound in source order.
  const sourceFrame=62+Math.floor(t*63);
  const motion=canonicalMotion(sourceFrame);
  const i=ranges.findIndex(r=>t<=r.end),shot=ranges[Math.max(0,i)];
  const prior=i>0?ranges[i-1].end:0;
  const u=smooth((t-prior)/(shot.end-prior));
  const body=new T.Vector3(...motion.positionM);
  const orientation=new T.Euler(...motion.rotationRad,'XYZ');
  const transform=(v:V3):V3=>{
    const p=new T.Vector3(...v).applyEuler(orientation).add(body);return p.toArray() as V3;
  };
  const localPos:V3=[0,1,2].map(k=>lerp(shot.from[k],shot.to[k],u)) as V3;
  const focus=shot.focus;
  // Contact starts mostly opaque, skin becomes ghosted while metal remains solid.
  const exposure01=(focus==='contact'?.22:.72)*smooth(Math.min(1,t*9));
  return {sourceFrame,motion,focus,exposure01,replay:true,
    camera:{position:transform(localPos),target:transform(shot.target),fov:shot.fov}};
}
