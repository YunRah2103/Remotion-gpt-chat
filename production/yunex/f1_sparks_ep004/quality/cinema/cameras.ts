/** EP004 quality rescue / Agent 10. Pure deterministic camera rig.
 * Physical trajectory comes ONLY from Agent 2 VehicleMotionState.
 * +X forward, +Y up, +Z left. No camera shake/orbit/no global clock.
 */
import type {CameraPose, ShotId, Vec3, VehicleMotionState} from '../../shared/contract.ts';

type Key = readonly [number, Vec3, Vec3, number];
export type QualityShot = Readonly<{
  shot: ShotId;
  durationSec: number;
  handlesSec: readonly [number, number];
  cutaway: boolean;
  purpose: string;
}>;
/** Local durations are PREVIEW guidance, not original-VO word timing. */
export const QUALITY_SHOTS:readonly QualityShot[]=[
  {shot:'spark-hook',durationSec:1.20,handlesSec:[.22,.30],cutaway:false,purpose:'Immediate real metal-contact sparks then rapid full-car reveal'},
  {shot:'rear-mystery',durationSec:1.40,handlesSec:[.25,.30],cutaway:false,purpose:'Low moving near-car rear three-quarter chase'},
  {shot:'underfloor-reveal',durationSec:1.70,handlesSec:[.25,.36],cutaway:true,purpose:'Read mounted skid versus composite on a moving V2 car'},
  {shot:'aero-load',durationSec:1.25,handlesSec:[.20,.28],cutaway:false,purpose:'Load and road motion from a low parallel tracking lane'},
  {shot:'contact-macro',durationSec:1.20,handlesSec:[.20,.25],cutaway:true,purpose:'External close-up of metal insert with no camera/body collision'},
  {shot:'racing-payoff',durationSec:2.85,handlesSec:[.32,.50],cutaway:false,purpose:'Bright, large, fast-moving follow with no static asphalt ending'},
];
export const QUALITY_TOTAL_SEC=QUALITY_SHOTS.reduce((n,s)=>n+s.durationSec,0);
export const QUALITY_SHOT_INDEX=Object.freeze(Object.fromEntries(QUALITY_SHOTS.map(s=>[s.shot,s])) as Record<ShotId,QualityShot>);

/** Relative positions are always outside V2 Formula car's wheels/body.
 * The first 0.3sec is an explicitly intentional contact insert, NOT a full-car shot.
 * In the other five shots, near-car framing retains body/wings in the 9:16 view.
 */
const KEYS:Readonly<Record<ShotId,readonly Key[]>>={
  'spark-hook':[
    [0,[1.34,.28,1.72],[1.18,.075,0],55],
    [.23,[.15,.48,2.65],[1.10,.12,0],59],
    [.58,[-3.80,1.07,6.50],[.10,.68,0],61],
    [1,[-4.75,1.26,7.20],[0,.74,0],62],
  ],
  'rear-mystery':[
    [0,[-6.55,1.16,5.55],[-.35,.65,0],59],
    [.58,[-6.25,1.08,5.18],[-.10,.62,0],59],
    [1,[-5.88,1.28,5.28],[.30,.69,0],60],
  ],
  'underfloor-reveal':[
    [0,[2.20,.90,3.28],[1.18,.16,0],49],
    [.38,[1.86,.68,2.56],[1.18,.105,0],51],
    [.70,[1.56,.52,2.05],[1.18,.084,0],53],
    [1,[1.48,.47,1.82],[1.18,.072,0],54],
  ],
  'aero-load':[
    [0,[1.85,.82,7.72],[.24,.57,0],57],
    [.53,[.20,.83,7.12],[.14,.55,0],57],
    [1,[-.92,.94,7.05],[.10,.58,0],57],
  ],
  'contact-macro':[
    [0,[1.52,.38,1.88],[1.18,.073,0],53],
    [.5,[1.56,.41,1.70],[1.18,.070,0],54],
    [1,[1.46,.39,1.74],[1.18,.075,0],54],
  ],
  'racing-payoff':[
    [0,[-5.85,1.22,6.12],[-.25,.63,0],63],
    [.30,[-6.10,1.32,6.20],[.18,.65,0],63],
    [.67,[-5.55,1.39,6.30],[.35,.72,0],62],
    [1,[-4.98,1.50,6.65],[.63,.77,0],62],
  ],
};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const vec=(a:Vec3,b:Vec3,t:number):Vec3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
function keyed(shot:ShotId,t:number){
 const keys=KEYS[shot];
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]||i===keys.length-1){
   const a=keys[i-1],b=keys[i],w=smooth((t-a[0])/(b[0]-a[0]));
   return {position:vec(a[1],b[1],w),target:vec(a[2],b[2],w),fov:lerp(a[3],b[3],w)};
 }
 throw Error('Missing keys '+shot);
}
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/** World transform follows authoritative yaw and origin ONLY.
 * Never writes speed, distance, ride height, contact, or sparks.
 */
export function qualityLocalToWorld(local:Vec3,motion:VehicleMotionState):Vec3{
 const [x,y,z]=local,c=Math.cos(motion.yawRad),s=Math.sin(motion.yawRad);
 return [motion.worldPosition[0]+x*c+z*s,motion.worldPosition[1]+y,motion.worldPosition[2]-x*s+z*c];
}
export function sampleRetimedQualityCamera(shot:ShotId,shotLocalSec:number,shotDurationSec:number,motion:VehicleMotionState):CameraPose{
 if(!QUALITY_SHOT_INDEX[shot])throw Error('Unknown quality shot '+shot);
 if(!Number.isFinite(shotLocalSec)||!Number.isFinite(shotDurationSec)||shotDurationSec<=0)throw Error('Invalid shot timing');
 if(!Number.isFinite(motion.speedMps)||motion.speedMps<0||![...motion.worldPosition,motion.yawRad,motion.routeDistanceM].every(Number.isFinite))
   throw Error('Agent 2 finite motion required');
 const k=keyed(shot,clamp(shotLocalSec/shotDurationSec));
 // A15: the lens must always remain OUTSIDE the car's body/tyre envelope.
 if(k.position[2]<1.45||k.position[1]<.24)throw Error('Quality camera has unsafe vehicle collision geometry');
 if(k.fov<45||k.fov>75)throw Error('Quality camera vertical field of view out of bounds');
 const positionWorld=qualityLocalToWorld(k.position,motion);
 const targetWorld=qualityLocalToWorld(k.target,motion);
 const d=distance(positionWorld,targetWorld);
 if(!(d>1.4))throw Error('Camera target is inside near plane/mesh');
 return {positionWorld,targetWorld,fovDeg:k.fov,rollRad:0,focusDistanceM:d};
}
/** Exact requested three-argument API; callers can retime explicitly above. */
export function sampleQualityCamera(shot:ShotId,shotLocalSec:number,motion:VehicleMotionState):CameraPose{
 return sampleRetimedQualityCamera(shot,shotLocalSec,QUALITY_SHOT_INDEX[shot]?.durationSec??0,motion);
}
export type QualityCut=Readonly<QualityShot&{startFrame:number;endFrameExclusive:number}>;
/** 288 preview frames, continuous physical time INSIDE each cut.
 * Intentional replays at cut boundaries are exposed rather than disguised.
 */
export function qualityCutList(fps=30):readonly QualityCut[]{
 if(fps!==30)throw Error('Quality preview contract is exactly 30 fps');
 let first=0;
 return QUALITY_SHOTS.map(s=>{
   const frames=Math.round(s.durationSec*fps);
   const cut={...s,startFrame:first,endFrameExclusive:first+frames};
   first+=frames;return cut;
 });
}
export function qualityCutAtFrame(frame:number){
 if(!Number.isInteger(frame)||frame<0||frame>=qualityCutList().at(-1)!.endFrameExclusive)throw Error('Frame out of range');
 const cut=qualityCutList().find(s=>frame<s.endFrameExclusive)!;
 return {cut,localSec:(frame-cut.startFrame)/30};
}
/** Camera framing QA helper: horizontal coverage at focus distance. */
export function portraitVisibleWidth(pose:CameraPose):number{
 return 2*pose.focusDistanceM!*Math.tan(pose.fovDeg*Math.PI/360)*(1080/1920);
}
