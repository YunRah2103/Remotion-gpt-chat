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
/**
 * Portrait camera placement is deliberately OUTSIDE the front left wheel and
 * coachwork (2.7–5.5m away), not inside a tyre or opaque rocker panel.
 * +X forward, +Y up, +Z left. Each shot reveals a DIFFERENT fitted load path.
 */
const ranges=[
  {end:.25,focus:'contact' as const,from:[2.65,1.18,3.18] as V3,to:[2.49,1.10,3.05] as V3,target:[1.31,.36,.80] as V3,fov:53},
  {end:.50,focus:'spring' as const,from:[2.97,.97,3.62] as V3,to:[2.70,.89,3.43] as V3,target:[1.28,.59,.58] as V3,fov:52},
  {end:.73,focus:'damper' as const,from:[2.56,.77,3.18] as V3,to:[2.68,.71,3.48] as V3,target:[1.28,.54,.58] as V3,fov:52},
  {end:1,focus:'chassis' as const,from:[2.63,.33,5.15] as V3,to:[2.28,.38,4.85] as V3,target:[0,.47,0] as V3,fov:55},
];
/**
 * Global screen frames [192,555) replay canonical J1 source frames 62..125
 * monotonically. There is no new landing simulation or invented narration.
 */
export function sampleEp006MechanicalTimeline(globalFrame:number,
  canonicalMotion:(absoluteFrame:number)=>Ep006Motion):Ep006MechanicalShot{
  if(!Number.isInteger(globalFrame)||globalFrame<192||globalFrame>=555)
    throw Error('Mechanical timeline requires EP006 absolute frames [192,555)');
  const t=(globalFrame-192)/(555-192-1);
  const sourceFrame=62+Math.floor(t*63);
  const motion=canonicalMotion(sourceFrame);
  const i=ranges.findIndex(r=>t<=r.end),shot=ranges[Math.max(0,i)];
  const prior=i>0?ranges[i-1].end:0;
  const u=smooth((t-prior)/(shot.end-prior));
  const body=new T.Vector3(...motion.positionM);
  const orientation=new T.Euler(...motion.rotationRad,'XYZ');
  const transform=(v:V3):V3=>new T.Vector3(...v).applyEuler(orientation).add(body).toArray() as V3;
  const localPos:V3=[0,1,2].map(k=>lerp(shot.from[k],shot.to[k],u)) as V3;
  const focus=shot.focus;
  const exposure01=focus==='contact'?.12:focus==='chassis'?.94:.91;
  return {sourceFrame,motion,focus,exposure01,replay:true,
    camera:{position:transform(localPos),target:transform(shot.target),fov:shot.fov}};
}
