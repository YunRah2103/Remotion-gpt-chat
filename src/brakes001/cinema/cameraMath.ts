/**
 * Carbon Ceramic 001: pure frame-deterministic camera/lookdev math.
 * Y up, X is disc axle, disc lies in YZ plane. Angles in radians except fov.
 * Intro ghost is in car space; shot 120 cuts to isolated brake at origin.
 */
export type Vec3Tuple = readonly [number,number,number];
export type BrakeShotId = 'context'|'reveal'|'thermal'|'benefits'|'hero';
export type BrakeCameraPose = {
  shotId:BrakeShotId;
  position:Vec3Tuple;
  target:Vec3Tuple;
  fovDegrees:number;
  focusDistanceMetres:number;
};
export const BRAKES_001_TOTAL_FRAMES=750;
export const GHOST_FRONT_BRAKE_ANCHOR:Vec3Tuple=[.85,.45,-1.42];
const clamp01=(v:number):number=>Math.max(0,Math.min(1,v));
const smooth=(v:number):number=>{const t=clamp01(v);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number):number=>a+(b-a)*t;
const mix3=(a:Vec3Tuple,b:Vec3Tuple,t:number):Vec3Tuple=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
const make=(shotId:BrakeShotId,position:Vec3Tuple,target:Vec3Tuple,fovDegrees:number):BrakeCameraPose=>({
  shotId,position,target,fovDegrees,
  focusDistanceMetres:Math.hypot(position[0]-target[0],position[1]-target[1],position[2]-target[2])
});
export function brakeShotAt(frame:number):BrakeShotId{
  if(frame<120)return 'context';
  if(frame<270)return 'reveal';
  if(frame<450)return 'thermal';
  if(frame<630)return 'benefits';
  return 'hero';
}
export function brakeCameraAt(frame:number,shotOverride?:BrakeShotId):BrakeCameraPose{
  if(!Number.isFinite(frame))throw new Error('frame must be finite');
  const f=Math.max(0,Math.min(749,frame));
  const shot=shotOverride??brakeShotAt(f);
  if(shot==='context'){
    const t=smooth((f-8)/111);
    return make(shot,mix3([3.95,1.88,-5.65],[2.03,.92,-2.55],t),
      mix3([0,.70,-.45],[.72,.46,-1.31],t),mix(35,30,t));
  }
  if(shot==='reveal'){
    const t=smooth((f-120)/149),theta=mix(-.36,.34,t);
    return make(shot,[1.12-.12*t,.23+.12*t,.48*Math.cos(theta)+.13*Math.sin(f/66)],
      [0,.025,0],mix(35,32,t));
  }
  if(shot==='thermal'){
    const t=smooth((f-270)/179),close=Math.sin(Math.PI*t)**2;
    return make(shot,[mix(.91,.73,close),mix(.29,.13,t),mix(.32,-.18,t)],
      [0,mix(.055,.09,t),mix(.035,.115,t)],mix(29,27,close));
  }
  if(shot==='benefits'){
    const t=(f-450)/179,cycling=Math.sin(Math.PI*2*t)*.038;
    return make(shot,[1.02+.05*Math.sin(Math.PI*t),.35+cycling,.49-.24*t],
      [0,.025,0],31);
  }
  const t=smooth((f-630)/119),theta=mix(-.42,.54,t);
  return make(shot,[1.13+.045*Math.sin(Math.PI*t),.31+.12*t,.53*Math.sin(theta)+.31*Math.cos(theta)],
    [0,.015,0],mix(35,32,t));
}
export function ghostOpacityAt(frame:number,allowEndingGhost=false):number{
  const f=Math.max(0,Math.min(749,frame));
  if(f<120)return .45*(1-smooth((f-88)/31));
  if(allowEndingGhost&&f>=684)return .12*smooth((f-684)/42);
  return 0;
}
/** Only a decorative light; heat signal must be supplied by Agent B. */
export function thermalLightAt(frame:number,heat01=0):number{
  return frame>=270&&frame<630?clamp01(heat01)*.66:0;
}
