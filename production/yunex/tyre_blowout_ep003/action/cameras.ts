/**
 * EP003 / Agent 10 — retimeable moving-camera specialist.
 * YUNEX coordinates: +X is vehicle forward; +Y up; -Z is the failed/right side.
 * Returns CAMERA transforms only. Never mutates car, hubs, crash, or world physics.
 * filmTimeSec is editing time; sourceTimeSec is the externally mapped physics clock.
 */
import type {Vec3, VehicleDynamicsFrame} from '../shared/contract.ts';

export type ActionStage =
  | 'emergency-pull' | 'barrier-approach' | 'impact-side-profile'
  | 'impact-overhead' | 'damage-scrape' | 'reverse-sweep'
  | 'steady-driver' | 'moving-recovery-hero';

export type ImpactCameraSignal = Readonly<{
  /** Agent 8 collision solver: zero pre-contact; 0..1 after first impact. */
  contact01: number;
  /** Do not invent an impact from mere time or tyre failure. */
  actualBarrierContact: boolean;
}>;

export type ActionCameraRequest = Readonly<{
  stage: ActionStage;
  sourceTimeSec: number;
  /** The local cut position; supplied by the editor, NOT a new physics clock. */
  progress01?: number;
  dynamics: VehicleDynamicsFrame;
  impactFrame?: ImpactCameraSignal;
}>;

export type ActionCameraPose = Readonly<{
  stage: ActionStage;
  position: Vec3;
  target: Vec3;
  fovDeg: number;
  nearM: number;
  farM: number;
  /** Useful to Agent 6 for scene-local motion effects; NEVER fake velocity. */
  roadParallaxMps: number;
  /** Visual shake translation in metres, not an edit to the vehicle. */
  shakeM: number;
  insideCabin: boolean;
}>;

export type ActionCut = Readonly<{
  stage: ActionStage;
  fromSec: number;
  toSec: number;
  /** Why this shot changes the story, for Agent 6 editorial selection. */
  purpose: string;
}>;

const clamp = (x:number,min=0,max=1) => Math.min(max,Math.max(min,x));
const smooth = (x:number) => {const t=clamp(x);return t*t*(3-2*t);};
const mix = (a:number,b:number,t:number) => a+(b-a)*t;
const lerp3 = (a:Vec3,b:Vec3,t:number):Vec3 =>
  [mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];

export function actionVehicleToWorld(offset:Vec3, d:Pick<VehicleDynamicsFrame,'positionM'|'yawRad'>):Vec3 {
  const c=Math.cos(d.yawRad),s=Math.sin(d.yawRad),p=d.positionM;
  return [p[0]+c*offset[0]+s*offset[2],p[1]+offset[1],
          p[2]-s*offset[0]+c*offset[2]];
}

/** Camera-only preview rebase. Shifts body and all four hubs by IDENTICAL X. */
export function rebaseActionFrame(d:VehicleDynamicsFrame, offsetX:number):VehicleDynamicsFrame {
  if(!Number.isFinite(offsetX))throw new Error('Nonfinite shot rebase');
  return {...d, positionM:[d.positionM[0]+offsetX,d.positionM[1],d.positionM[2]],
    wheels:{
      'front-left':{...d.wheels['front-left'],hubWorldM:[d.wheels['front-left'].hubWorldM[0]+offsetX,d.wheels['front-left'].hubWorldM[1],d.wheels['front-left'].hubWorldM[2]] as Vec3},
      'front-right':{...d.wheels['front-right'],hubWorldM:[d.wheels['front-right'].hubWorldM[0]+offsetX,d.wheels['front-right'].hubWorldM[1],d.wheels['front-right'].hubWorldM[2]] as Vec3},
      'rear-left':{...d.wheels['rear-left'],hubWorldM:[d.wheels['rear-left'].hubWorldM[0]+offsetX,d.wheels['rear-left'].hubWorldM[1],d.wheels['rear-left'].hubWorldM[2]] as Vec3},
      'rear-right':{...d.wheels['rear-right'],hubWorldM:[d.wheels['rear-right'].hubWorldM[0]+offsetX,d.wheels['rear-right'].hubWorldM[1],d.wheels['rear-right'].hubWorldM[2]] as Vec3},
    }};
}

export function sampleActionCamera(req:ActionCameraRequest):ActionCameraPose {
  const {stage,dynamics:d,sourceTimeSec}=req;
  const p=req.progress01??0;
  const contact=req.impactFrame?.contact01??0;
  if(!Number.isFinite(sourceTimeSec)||sourceTimeSec<0 ||
    ![p,contact,d.worldSpeedMps,d.yawRad,...d.positionM].every(Number.isFinite) ||
    p<0||p>1||contact<0||contact>1||d.worldSpeedMps<0)
    throw new Error('Agent 10: invalid absolute physics or cut progress');
  let position:Vec3=[-8,2,0],target:Vec3=[0,.8,0],fov=52,near=.07;
  const eased=smooth(p);
  switch(stage){
    case 'emergency-pull': {
      // Right-front deflation becomes a full-body three-quarter reveal.
      const reveal=smooth((p-.10)/.50);
      position=lerp3([2.52,.41,-2.68],[8.20,2.62,-5.25],reveal);
      target=lerp3([1.42,.25,-.88],[.10,.82,0],reveal);
      fov=mix(42,55,reveal);near=.029;break;
    }
    case 'barrier-approach': {
      // The rail sits at negative Z. Lens remains INSIDE the rail, looking
      // diagonally across both drifting car and obstacle with real road motion.
      position=lerp3([-8.3,1.65,3.8],[6.5,2.45,5.5],eased);
      target=lerp3([2.3,.76,-2.30],[.6,.72,-3.6],eased);
      fov=mix(55,59,eased);break;
    }
    case 'impact-side-profile': {
      // Wide geography FIRST: view from median side, so the near-side rail
      // cannot mask the contact. A deliberate short lateral dolly, no spin.
      position=lerp3([1.9,3.0,10.1],[4.0,2.75,10.4],eased);
      target=lerp3([.20,.82,-2.7],[.5,.80,-3.6],eased);
      fov=58;break;
    }
    case 'impact-overhead': {
      position=lerp3([-1.7,15.8,4.1],[-2.8,14.8,5.3],eased);
      target=[1.2,.65,-2.9];fov=48;break;
    }
    case 'damage-scrape': {
      // Low aftermath, still includes full impact direction and road speed.
      position=lerp3([-5.5,1.15,4.5],[-6.8,1.45,3.6],eased);
      target=lerp3([1.40,.57,-2.60],[1.7,.60,-2.9],eased);
      fov=56;break;
    }
    case 'reverse-sweep': {
      // Agent 9 supplies reverse-time vehicle state. Camera simply dollies
      // back with it. A reverse clock NEVER lives inside the camera sampler.
      position=lerp3([5.6,4.65,7.2],[-7.2,3.0,5.9],eased);
      target=lerp3([0,.84,-1.8],[1.4,.80,-1.7],eased);
      fov=mix(60,52,eased);break;
    }
    case 'steady-driver': {
      // Same in-car seating as Agent 3; A5 original hands must be visible.
      position=lerp3([.030,1.150,-.466],[.070,1.158,-.462],eased);
      target=lerp3([6.5,.97,-.45],[7.3,1.02,-.42],eased);
      fov=70;near=.021;break;
    }
    case 'moving-recovery-hero': {
      // Distinct moving rear chase -> rear-right sweep, not identical holds.
      position=lerp3([-9.5,2.35,2.15],[-7.2,2.60,-6.5],eased);
      target=lerp3([0,.76,0],[.75,.73,-.2],eased);
      fov=mix(53,56,eased);break;
    }
    default: throw new Error('Agent 10: unknown stage');
  }
  // Impulse is ONLY allowed with actual A8 contact. No enormous hand-held
  // shaking at 70mph and no fake impact triggered by ordinary deflation.
  const active=Boolean(req.impactFrame?.actualBarrierContact);
  const shakeM=active ? .032*contact*Math.sin(2*Math.PI*11*sourceTimeSec):0;
  const safePosition:Vec3=[position[0],Math.max(.15,position[1]+shakeM),position[2]];
  return {stage,position:actionVehicleToWorld(safePosition,d),
    target:actionVehicleToWorld(target,d),fovDeg:fov,nearM:near,farM:360,
    roadParallaxMps:d.worldSpeedMps,shakeM,
    insideCabin:stage==='steady-driver'};
}

/** Two native preview edit decision lists, distinct from absolute physics time. */
export const ACTION_CRASH_CUTS:readonly ActionCut[]=[
  {stage:'emergency-pull',fromSec:0,toSec:.68,purpose:'Failed right tyre then original GT reveal before wrong branch'},
  {stage:'barrier-approach',fromSec:.68,toSec:2.26,purpose:'Continuous real A8 veer and upcoming right-hand barrier'},
  {stage:'impact-side-profile',fromSec:2.26,toSec:2.95,purpose:'Wide continuous A8 rail strike, car not obscured'},
  {stage:'damage-scrape',fromSec:2.95,toSec:3.12,purpose:'Brief A8 impacted metal and road debris'},
  {stage:'reverse-sweep',fromSec:3.12,toSec:6.00,purpose:'A9 reverses physical car damage debris and collision source clock'},
];
export const ACTION_RECOVERY_CUTS:readonly ActionCut[]=[
  {stage:'steady-driver',fromSec:0,toSec:1.65,purpose:'A5 hands and road visible through windshield'},
  {stage:'moving-recovery-hero',fromSec:1.65,toSec:3.05,purpose:'Moving rear chase, full-bodied car'},
  {stage:'emergency-pull',fromSec:3.05,toSec:4.18,purpose:'Original front-right tyre, full-body speed'},
  {stage:'moving-recovery-hero',fromSec:4.18,toSec:5.32,purpose:'Side-rear parallax and controlled lane tracking'},
  {stage:'barrier-approach',fromSec:5.32,toSec:7.00,purpose:'Rail and safe refuge context, car still moving'},
];
export function selectActionCut(timeSec:number,cuts:readonly ActionCut[]):{
  cut:ActionCut;progress01:number;index:number
}{
  if(!Number.isFinite(timeSec)||timeSec<0||!cuts.length)throw new Error('Bad edit time');
  const i=cuts.findIndex(c=>c.fromSec<=timeSec&&timeSec<c.toSec);
  if(i===-1 && timeSec < cuts[0].fromSec)throw new Error('Uncovered edit time');
  const index=i<0?cuts.length-1:i,cut=cuts[index];
  return {cut,index,progress01:clamp((timeSec-cut.fromSec)/(cut.toSec-cut.fromSec))};
}
